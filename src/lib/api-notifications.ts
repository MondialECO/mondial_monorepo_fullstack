import api from "@/lib/axios";
import type { AppNotification } from "@/types/notifications";

// REST client for the notifications domain. Mirrors backend
// NotificationController routes (api/notification/*). Errors propagate.

export async function getNotifications(
  skip = 0,
  limit = 30
): Promise<AppNotification[]> {
  const res = await api.get<AppNotification[]>("/notification", {
    params: { skip, limit },
  });
  return res.data;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await api.post(`/notification/read/${notificationId}`);
}
