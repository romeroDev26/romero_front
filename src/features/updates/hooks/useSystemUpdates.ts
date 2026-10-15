import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { updatesService, SystemUpdate } from '../services/updates.service';
import { acknowledgeUpdate, deferMandatoryUpdates, hasUnreadUpdate, recordUpdateView, shouldAutoOpenUpdate } from '../services/updateProgress';

export const useSystemUpdates = (userId?: string) => {
  const [, refreshProgress] = useState(0);
  const { data: updates = [], isLoading } = useQuery<SystemUpdate[]>({
    queryKey: ['system-updates-latest', userId],
    queryFn: () => updatesService.getLatest('WEB'),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
  const refresh = useCallback((changed: boolean) => { if (changed) refreshProgress(value => value + 1); }, []);
  const markViewed = useCallback((update: SystemUpdate) => {
    if (userId) refresh(recordUpdateView(userId, update));
  }, [userId, refresh]);
  const confirmUpdate = useCallback((update: SystemUpdate) => {
    if (userId) refresh(acknowledgeUpdate(userId, update));
  }, [userId, refresh]);
  const dismissUpdates = useCallback((shown: SystemUpdate[]) => {
    if (userId) refresh(deferMandatoryUpdates(userId, shown));
  }, [userId, refresh]);
  return {
    updates, isLoading,
    hasNew: Boolean(userId && updates.some(update => hasUnreadUpdate(userId, update))),
    autoUpdates: userId ? updates.filter(update => shouldAutoOpenUpdate(userId, update)) : [],
    markViewed, confirmUpdate, dismissUpdates,
  };
};
