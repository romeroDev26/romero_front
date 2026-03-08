import { useQuery } from '@tanstack/react-query';
import { updatesService, SystemUpdate } from '../services/updates.service';

export const useSystemUpdates = () => {
  const { data: updates = [], isLoading } = useQuery<SystemUpdate[]>({
    queryKey: ['system-updates-latest'],
    queryFn: async () => {
      const [webUpdates, allUpdates] = await Promise.all([
        updatesService.getLatest('WEB'),
        updatesService.getLatest('ALL'),
      ]);

      // Merge + dedupe in case backend returns overlapping data.
      const uniqueById = new Map<number, SystemUpdate>();
      [...webUpdates, ...allUpdates].forEach((update) => {
        if (update.platform === 'WEB' || update.platform === 'ALL') {
          uniqueById.set(update.id, update);
        }
      });

      return Array.from(uniqueById.values()).sort((a, b) => a.id - b.id);
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: false,
  });

  const hasNew = updatesService.hasUnseenUpdates(updates);

  const markAsSeen = () => {
    if (!updates.length) return;
    const maxId = Math.max(...updates.map((u) => u.id));
    updatesService.saveLastSeenId(maxId);
  };

  return { updates, isLoading, hasNew, markAsSeen };
};
