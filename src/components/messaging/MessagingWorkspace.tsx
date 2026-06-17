"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/_providers/AuthProvider";
import { useSignalRHub, hubEvent } from "@/lib/realtime";
import {
  bumpConversationInCache,
  clearUnreadInCache,
  conversationsKey,
  incrementUnreadInCache,
  upsertConversationInCache,
  upsertMessageInCache,
  useConversations,
  useCreateConversation,
  useMarkConversationRead,
} from "@/hooks/queries/chat";
import type { ChatMessage, Conversation } from "@/types/chat";
import MessagesHeader from "./MessagesHeader";
import ConversationList from "./ConversationList";
import ConversationThread from "./ConversationThread";

export default function MessagingWorkspace() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();

  const activeId = params.get("c");
  const toParam = params.get("to");

  const { data: conversations = [], isLoading, isError } = useConversations();
  const markRead = useMarkConversationRead();
  const createConversation = useCreateConversation();

  // Refs read by the (stable) realtime handler to avoid stale closures.
  const activeIdRef = useRef<string | null>(activeId);
  const userIdRef = useRef<string | undefined>(user?.id);
  const onMessageRef = useRef<(m: ChatMessage) => void>(() => {});
  const onConversationCreatedRef = useRef<(c: Conversation) => void>(() => {});

  useEffect(() => {
    activeIdRef.current = activeId;
    userIdRef.current = user?.id;

    onMessageRef.current = (msg: ChatMessage) => {
      // If the message belongs to a conversation we don't have yet (e.g. the
      // ConversationCreated event hasn't landed), refetch the list so it shows.
      const known = qc
        .getQueryData<Conversation[]>(conversationsKey)
        ?.some((c) => c.id === msg.conversationId);
      if (!known) qc.invalidateQueries({ queryKey: conversationsKey });

      upsertMessageInCache(qc, msg.conversationId, msg);
      bumpConversationInCache(qc, msg.conversationId, msg);

      const isActive = msg.conversationId === activeIdRef.current;
      const isMine = msg.senderId === userIdRef.current;

      if (isMine) return;
      if (isActive) {
        markRead.mutate(msg.conversationId);
      } else {
        incrementUnreadInCache(qc, msg.conversationId);
      }
    };

    onConversationCreatedRef.current = (conversation: Conversation) => {
      upsertConversationInCache(qc, conversation);
    };
  });

  const { status, connection } = useSignalRHub("chat", {
    enabled: !!user,
    events: [
      hubEvent<ChatMessage>("ReceiveMessage", (m) => onMessageRef.current(m)),
      hubEvent<Conversation>("ConversationCreated", (c) =>
        onConversationCreatedRef.current(c)
      ),
    ],
  });

  // Join the active conversation group whenever it changes (once connected).
  // `connection` is stable (only changes on connect/disconnect), so this fires
  // only on genuine status/active/connection changes — not every render.
  useEffect(() => {
    if (status === "connected" && activeId && connection) {
      connection.invoke("JoinConversation", activeId).catch(() => {});
    }
  }, [status, activeId, connection]);

  // Mark read + clear unread when a conversation becomes active.
  useEffect(() => {
    if (!activeId) return;
    clearUnreadInCache(qc, activeId);
    markRead.mutate(activeId);
    // markRead/qc are stable; intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Handle a ?to=<userId> deep link: create/fetch the conversation, then
  // swap the URL to ?c=<conversationId>. Guarded so it runs once per target.
  const handledToRef = useRef<string | null>(null);
  useEffect(() => {
    if (!toParam || !user) return;
    if (handledToRef.current === toParam) return;
    handledToRef.current = toParam;
    createConversation
      .mutateAsync({ targetUserId: toParam })
      .then((convo) => router.replace(`?c=${convo.id}`))
      .catch(() => router.replace("?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toParam, user]);

  const selectConversation = (id: string) => {
    router.replace(`?c=${id}`);
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-8">
      <MessagesHeader status={status} />

      <div className="grid h-[calc(100vh-260px)] min-h-[480px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[320px_1fr]">
        {/* Conversation list pane */}
        <div
          className={cn(
            "min-h-0 border-border md:border-r",
            activeId ? "hidden md:block" : "block"
          )}
        >
          <ConversationList
            conversations={conversations}
            isLoading={isLoading}
            isError={isError}
            currentUserId={user?.id}
            currentRole={user?.role}
            activeId={activeId}
            onSelect={selectConversation}
          />
        </div>

        {/* Thread pane */}
        <div className={cn("min-h-0", activeId ? "block" : "hidden md:block")}>
          {activeId ? (
            <ConversationThread
              key={activeId}
              conversationId={activeId}
              conversation={activeConversation}
              currentUserId={user?.id}
              currentRole={user?.role}
              onBack={() => router.replace("?")}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Select a conversation to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
