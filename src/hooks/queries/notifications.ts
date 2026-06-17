'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { getNotifications, markAsRead } from '@/lib/api-notifications';
import { hubEvent, useSignalRHub } from '@/lib/realtime';
import type { AppNotification } from '@/types/notifications';

// TanStack Query layer for the notifications domain. The backend exposes a
// list endpoint and a single mark-as-read endpoint only — there is no
// unread-count or mark-all endpoint, so the unread count is derived from the
// fetched list. Realtime arrivals come over the shared notifications hub.

export const notificationsKey = ['notifications', 'list'] as const;

const PAGE_LIMIT = 30;
// Keep the in-memory inbox bounded as realtime items prepend.
const MAX_CACHED = 50;

// Insert a realtime notification at the top of the list, de-duplicated by id.
export function prependNotificationInCache(
  qc: QueryClient,
  n: AppNotification
): void {
  qc.setQueryData<AppNotification[]>(notificationsKey, (prev = []) => {
    if (prev.some((x) => x.id === n.id)) return prev;
    return [n, ...prev].slice(0, MAX_CACHED);
  });
}

export function useNotifications() {
  const query = useQuery<AppNotification[]>({
    queryKey: notificationsKey,
    queryFn: () => getNotifications(0, PAGE_LIMIT),
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.reduce(
    (n, item) => (item.isRead ? n : n + 1),
    0
  );

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    // Optimistically flip isRead; roll back on failure.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: notificationsKey });
      const prev = qc.getQueryData<AppNotification[]>(notificationsKey);
      qc.setQueryData<AppNotification[]>(notificationsKey, (list) =>
        list?.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationsKey, ctx.prev);
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
