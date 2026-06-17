"use client";

// Internal, non-UI verification of the realtime foundation. This hook is NOT
// rendered anywhere user-facing — it exists to prove, at compile time and via
// the type system, that:
//   - useSignalRHub is generic and drives multiple hubs simultaneously,
//   - server→client event bindings are type-safe end to end,
//   - the chat/notification REST contracts line up with the API clients.
// Gate 3 (Messaging/Notification UI) will consume these primitives directly.

import { useSignalRHub } from "./use-signalr-hub";
import { hubEvent } from "./types";
import type { ChatMessage, SendMessageRequest } from "@/types/chat";
import type { AppNotification } from "@/types/notifications";
import * as chatApi from "@/lib/api-chat";
import * as notificationApi from "@/lib/api-notifications";

export function useRealtimeVerification(enabled: boolean) {
  // Multiple hubs through the same generic hook.
  const chat = useSignalRHub("chat", {
    enabled,
    events: [
      hubEvent<ChatMessage>("ReceiveMessage", (msg) => void msg.message),
    ],
    onConnected: (connection) => connection.invoke("JoinConversation", "test"),
  });

  const notifications = useSignalRHub("notifications", {
    enabled,
    events: [
      hubEvent<AppNotification>("ReceiveNotification", (n) => void n.title),
    ],
  });

  // Type-safe hub invocation.
  const sendViaHub = (req: SendMessageRequest) =>
    chat.invoke<ChatMessage>("SendMessage", req);

  // REST clients are reachable and correctly typed.
  const restSurface = {
    getConversations: chatApi.getConversations,
    createConversation: chatApi.createConversation,
    getMessages: chatApi.getMessages,
    sendMessage: chatApi.sendMessage,
    markConversationRead: chatApi.markAsRead,
    getNotifications: notificationApi.getNotifications,
    markNotificationRead: notificationApi.markAsRead,
  };

  return {
    chatStatus: chat.status,
    notificationsStatus: notifications.status,
    sendViaHub,
    restSurface,
  };
}
