"use client";

import { useEffect, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  createConversation,
  createConversationByCompany,
  getConversations,
  getMessages,
  markAsRead,
  sendMessage,
} from "@/lib/api-chat";
import type {
  ChatMessage,
  Conversation,
  CreateConversationRequest,
} from "@/types/chat";

export const PAGE_SIZE = 30;

export const conversationsKey = ["chat", "conversations"] as const;
export const messagesKey = (id: string) =>
  ["chat", "messages", id] as const;

// ---- cache mutators (shared by send + realtime) ----------------------------

// Append a message to a thread cache, de-duplicated by id (the REST send
// response and the realtime echo carry the same id).
export function upsertMessageInCache(
  qc: QueryClient,
  conversationId: string,
  msg: ChatMessage
): void {
  qc.setQueryData<ChatMessage[]>(messagesKey(conversationId), (prev = []) => {
    if (prev.some((m) => m.id === msg.id)) return prev;
    return [...prev, msg];
  });
}

// Reflect a new message in the conversation list (last message + re-sort).
export function bumpConversationInCache(
  qc: QueryClient,
  conversationId: string,
  msg: ChatMessage
): void {
  qc.setQueryData<Conversation[]>(conversationsKey, (prev) => {
    if (!prev) return prev;
    const next = prev.map((c) =>
      c.id === conversationId
        ? { ...c, lastMessage: msg.message, lastMessageAt: msg.createdAt }
        : c
    );
    return [...next].sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
  });
}

// Insert a new conversation (or refresh an existing one) at the top of the
// list — driven by the realtime "ConversationCreated" event.
export function upsertConversationInCache(
  qc: QueryClient,
  conversation: Conversation
): void {
  qc.setQueryData<Conversation[]>(conversationsKey, (prev) => {
    if (!prev) return [conversation];
    if (prev.some((c) => c.id === conversation.id)) {
      return prev.map((c) =>
        c.id === conversation.id ? { ...c, ...conversation } : c
      );
    }
    return [conversation, ...prev];
  });
}

// Bump the unread badge for a conversation (realtime message while the thread
// isn't open). Backend seeds the baseline; this keeps it live in-session.
export function incrementUnreadInCache(
  qc: QueryClient,
  conversationId: string
): void {
  qc.setQueryData<Conversation[]>(conversationsKey, (prev) =>
    prev?.map((c) =>
      c.id === conversationId
        ? { ...c, unreadCount: (c.unreadCount ?? 0) + 1 }
        : c
    )
  );
}

// Reset a conversation's unread badge (thread opened / marked read).
export function clearUnreadInCache(
  qc: QueryClient,
  conversationId: string
): void {
  qc.setQueryData<Conversation[]>(conversationsKey, (prev) =>
    prev?.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    )
  );
}

// ---- queries / mutations ---------------------------------------------------

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: conversationsKey,
    queryFn: getConversations,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateConversationRequest) => createConversation(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: conversationsKey }),
  });
}

export function useCreateConversationByCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) => createConversationByCompany(companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: conversationsKey }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      sendMessage({ conversationId, message: text }),
    onSuccess: (saved) => {
      upsertMessageInCache(qc, conversationId, saved);
      bumpConversationInCache(qc, conversationId, saved);
    },
  });
}

export function useMarkConversationRead() {
  return useMutation({ mutationFn: (id: string) => markAsRead(id) });
}

// Thread messages, oldest→newest, with skip/limit "load older" pagination.
// Overlap from messages arriving between pages is tolerated via id de-dup.
export function useThreadMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const nextSkipRef = useRef(PAGE_SIZE);
  const initForRef = useRef<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const query = useQuery<ChatMessage[]>({
    queryKey: conversationId
      ? messagesKey(conversationId)
      : ["chat", "messages", "none"],
    queryFn: async () => {
      const page = await getMessages(conversationId as string, 0, PAGE_SIZE);
      return [...page].reverse();
    },
    enabled: !!conversationId,
  });

  // Reset pagination when switching conversations.
  useEffect(() => {
    nextSkipRef.current = PAGE_SIZE;
    setHasMore(false);
  }, [conversationId]);

  // Seed hasMore once the first page for this conversation arrives.
  useEffect(() => {
    if (
      conversationId &&
      query.isSuccess &&
      initForRef.current !== conversationId
    ) {
      initForRef.current = conversationId;
      setHasMore((query.data?.length ?? 0) === PAGE_SIZE);
    }
  }, [conversationId, query.isSuccess, query.data]);

  const loadOlder = async () => {
    if (!conversationId || isLoadingOlder || !hasMore) return;
    setIsLoadingOlder(true);
    try {
      const page = await getMessages(
        conversationId,
        nextSkipRef.current,
        PAGE_SIZE
      );
      const ordered = [...page].reverse();
      qc.setQueryData<ChatMessage[]>(messagesKey(conversationId), (prev = []) => {
        const seen = new Set(prev.map((m) => m.id));
        const fresh = ordered.filter((m) => !seen.has(m.id));
        return [...fresh, ...prev];
      });
      nextSkipRef.current += PAGE_SIZE;
      setHasMore(page.length === PAGE_SIZE);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    loadOlder,
    hasMore,
    isLoadingOlder,
  };
}
