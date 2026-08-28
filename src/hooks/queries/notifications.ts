'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllAsRead,
  markAsRead,
} from '@/lib/api-notifications';
import { hubEvent, useSignalRHub } from '@/lib/realtime';
import type { AppNotification } from '@/types/notifications';

export const notificationsKey = ['notifications', 'list'] as const;
export const unreadCountKey = ['notifications', 'unreadCount'] as const;

const MAX_CACHED = 100;

// Insert a realtime notification at the top of the list, de-duplicated by id, and increment unread count.
export function prependNotificationInCache(
  qc: QueryClient,
  n: AppNotification
): void {
  // Update all notification list queries in cache
  qc.setQueriesData<AppNotification[]>({ queryKey: ['notifications', 'list'] }, (prev = []) => {
    if (prev.some((x) => x.id === n.id)) return prev;
    return [n, ...prev].slice(0, MAX_CACHED);
  });

  // Increment canonical unread count if newly arrived notification is unread
  if (!n.isRead) {
    qc.setQueryData<number>(unreadCountKey, (prev = 0) => prev + 1);
  }
}

export function useUnreadNotificationCount() {
  const query = useQuery<number>({
    queryKey: unreadCountKey,
    queryFn: getUnreadNotificationCount,
    staleTime: 1000 * 30, // 30 seconds
  });
  return query.data ?? 0;
}

export function useNotifications(limit = 10, skip = 0) {
  const listQuery = useQuery<AppNotification[]>({
    queryKey: ['notifications', 'list', skip, limit],
    queryFn: () => getNotifications(skip, limit),
  });

  const unreadQuery = useQuery<number>({
    queryKey: unreadCountKey,
    queryFn: getUnreadNotificationCount,
    staleTime: 1000 * 30,
  });

  const notifications = listQuery.data ?? [];
  // Fallback to local list calculation only if unreadQuery is not yet available
  const unreadCount = unreadQuery.data ?? notifications.reduce(
    (n, item) => (item.isRead ? n : n + 1),
    0
  );

  return {
    notifications,
    unreadCount,
    isLoading: listQuery.isLoading || unreadQuery.isLoading,
    isError: listQuery.isError || unreadQuery.isError,
    refetch: async () => {
      await Promise.all([listQuery.refetch(), unreadQuery.refetch()]);
    },
  };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    // Optimistically flip isRead; roll back on failure.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prevLists = qc.getQueriesData<AppNotification[]>({ queryKey: ['notifications', 'list'] });
      const prevUnread = qc.getQueryData<number>(unreadCountKey);

      qc.setQueriesData<AppNotification[]>({ queryKey: ['notifications', 'list'] }, (list) =>
        list?.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      qc.setQueryData<number>(unreadCountKey, (prev = 0) => Math.max(0, prev - 1));

      return { prevLists, prevUnread };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevLists) {
        ctx.prevLists.forEach(([key, data]) => qc.setQueryData(key, data));
      }
      if (ctx?.prevUnread !== undefined) {
        qc.setQueryData(unreadCountKey, ctx.prevUnread);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prevLists = qc.getQueriesData<AppNotification[]>({ queryKey: ['notifications', 'list'] });
      const prevUnread = qc.getQueryData<number>(unreadCountKey);

      qc.setQueriesData<AppNotification[]>({ queryKey: ['notifications', 'list'] }, (list) =>
        list?.map((n) => ({ ...n, isRead: true }))
      );
      qc.setQueryData<number>(unreadCountKey, 0);

      return { prevLists, prevUnread };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevLists) {
        ctx.prevLists.forEach(([key, data]) => qc.setQueryData(key, data));
      }
      if (ctx?.prevUnread !== undefined) {
        qc.setQueryData(unreadCountKey, ctx.prevUnread);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Subscribes to live notifications on the shared notifications hub and keeps the
 * TanStack Query cache current. Mirrors useDealRealtime: the handler depends only
 * on the stable QueryClient + a module-level cache helper. Returns the status.
 */
export function useNotificationRealtime(enabled: boolean) {
  const qc = useQueryClient();
  const { status } = useSignalRHub('notifications', {
    enabled,
    events: [
      hubEvent<AppNotification>('ReceiveNotification', (n) =>
        prependNotificationInCache(qc, n)
      ),
    ],
  });
  return status;
}

