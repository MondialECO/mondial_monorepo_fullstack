import api from "@/lib/axios";
import type { AppNotification, UnreadCountResponse } from "@/types/notifications";

// REST client for the notifications domain. Mirrors backend
// NotificationController routes (api/notification/*). Errors propagate.

export async function getNotifications(
  skip = 0,
  limit = 20
): Promise<AppNotification[]> {
  const res = await api.get<AppNotification[]>("/notification", {
    params: { skip, limit },
  });
  return res.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await api.get<UnreadCountResponse>("/notification/unread-count");
  return res.data.unreadCount ?? 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.post(`/notification/read/${notificationId}`);
}

export async function markAllAsRead(): Promise<void> {
  await api.post("/notification/read-all");
}

