import type { SystemUpdate } from './updates.service';

type Progress = { seen?: boolean; acknowledged?: boolean; remindAfter?: number };
type StoredProgress = Record<string, Progress>;
export const UPDATE_REMINDER_DELAY = 24 * 60 * 60 * 1000;
export const updateRevisionKey = (update: SystemUpdate) => `${update.id}:${update.updated_at || update.created_at || update.version}`;
const storageKey = (userId: string) => `system_update_progress:${userId}`;
const read = (userId: string): StoredProgress => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as StoredProgress : {};
  } catch { return {}; }
};
const save = (userId: string, progress: StoredProgress) => {
  try { localStorage.setItem(storageKey(userId), JSON.stringify(progress)); return true; }
  catch { return false; }
};
export const hasUnreadUpdate = (userId: string, update: SystemUpdate) => {
  const progress = read(userId)[updateRevisionKey(update)] || {};
  return update.is_mandatory ? !progress.acknowledged : !progress.seen;
};
export const shouldAutoOpenUpdate = (userId: string, update: SystemUpdate, now = Date.now()) => {
  const progress = read(userId)[updateRevisionKey(update)] || {};
  return hasUnreadUpdate(userId, update) && (progress.remindAfter || 0) <= now;
};
export const recordUpdateView = (userId: string, update: SystemUpdate) => {
  const stored = read(userId), key = updateRevisionKey(update);
  if (stored[key]?.seen) return false;
  stored[key] = { ...stored[key], seen: true };
  return save(userId, stored);
};
export const acknowledgeUpdate = (userId: string, update: SystemUpdate) => {
  const stored = read(userId), key = updateRevisionKey(update);
  if (stored[key]?.acknowledged) return false;
  stored[key] = { seen: true, acknowledged: true };
  return save(userId, stored);
};
export const deferMandatoryUpdates = (userId: string, updates: SystemUpdate[], now = Date.now()) => {
  const stored = read(userId);
  let changed = false;
  for (const update of updates) {
    const key = updateRevisionKey(update);
    if (update.is_mandatory && !stored[key]?.acknowledged) {
      stored[key] = { ...stored[key], remindAfter: now + UPDATE_REMINDER_DELAY };
      changed = true;
    }
  }
  return changed && save(userId, stored);
};
