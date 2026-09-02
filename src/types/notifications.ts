// Wire contract for the notifications domain.
// Mirrors WebApp.Models.DatabaseModels.Notification as serialized by
// ASP.NET Core (camelCase). Ids are opaque strings on the wire.

export type NotificationType =
  | "Message"
  | "Investment"
  | "System"
  | "Security"
  | "data_room_access_request"
  | "data_room_access_approved"
  | "data_room_access_declined"
  | "data_room_access_revoked"
  | "diligence_question"
  | "diligence_answer"
  | "term_sheet"
  | "deal_counter"
  | "signature"
  | "deal_closed"
  | string;


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

export interface UnreadCountResponse {
  unreadCount: number;
}

