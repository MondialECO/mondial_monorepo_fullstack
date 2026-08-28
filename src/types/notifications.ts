// Wire contract for the notifications domain.
// Mirrors WebApp.Models.DatabaseModels.Notification as serialized by
// ASP.NET Core (camelCase). Ids are opaque strings on the wire.

export type NotificationType = "Message" | "Investment" | "System" | "Security";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  referenceId: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}
