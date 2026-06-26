// Wire contracts for the chat/messaging domain.
// These mirror the backend models (WebApp.Models.DatabaseModels.ChatMessage /
// Conversation) as serialized by ASP.NET Core's camelCase System.Text.Json /
// SignalR JSON protocol. Ids are treated as opaque strings on the wire.

export type ConversationType = "Direct" | "Group";

export type ChatMessageType = "Text" | "Image" | "File";

// Participant identity resolved server-side from ApplicationUser.
export interface ConversationParticipant {
  id: string;
  name: string | null;
  imagePath: string | null;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  type: ConversationType;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  // Caller's unread count, derived server-side from ChatMessage.IsRead.
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  messageType: ChatMessageType;
  isRead: boolean;
  createdAt: string;
}

// Request bodies / hub invocation payloads.

export interface SendMessageRequest {
  conversationId: string;
  message: string;
}

export interface CreateConversationRequest {
  targetUserId: string;
}
