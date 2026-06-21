import api from "@/lib/axios";
import type {
  ChatMessage,
  Conversation,
  CreateConversationRequest,
  SendMessageRequest,
} from "@/types/chat";

// REST client for the chat domain. Mirrors backend ChatController routes
// (api/chat/*). Realtime delivery is handled separately via the chat hub;
// these are the request/fetch + REST-fallback paths. Errors propagate.

export async function getConversations(): Promise<Conversation[]> {
  const res = await api.get<Conversation[]>("/chat/conversations");
  return res.data;
}

export async function createConversation(
  request: CreateConversationRequest
): Promise<Conversation> {
  const res = await api.post<Conversation>("/chat/conversations", request);
  return res.data;
}

// Contextual "Message Founder": create/get the conversation with a company's
// owner. The founder's user id is resolved server-side from the company.
export async function createConversationByCompany(
  companyId: string
): Promise<Conversation> {
  const res = await api.post<Conversation>(
    `/chat/conversations/by-company/${companyId}`
  );
  return res.data;
}

export async function getMessages(
  conversationId: string,
  skip = 0,
  limit = 30
): Promise<ChatMessage[]> {
  const res = await api.get<ChatMessage[]>(`/chat/messages/${conversationId}`, {
    params: { skip, limit },
  });
  return res.data;
}

export async function sendMessage(
  request: SendMessageRequest
): Promise<ChatMessage> {
  const res = await api.post<ChatMessage>("/chat/send", request);
  return res.data;
}

export async function markAsRead(conversationId: string): Promise<void> {
  await api.post(`/chat/read/${conversationId}`);
}
