"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import { ThreadSkeleton } from "./Skeletons";
import { useSendMessage, useThreadMessages } from "@/hooks/queries/chat";
import {
  initialsFromLabel,
  otherParticipant,
  participantDisplayName,
  resolveMediaUrl,
} from "@/lib/messaging-utils";
import type { Conversation } from "@/types/chat";
import type { UserRole } from "@/lib/roles";

interface ConversationThreadProps {
  conversationId: string;
  conversation: Conversation | undefined;
  currentUserId: string | undefined;
  currentRole: UserRole | undefined;
  onBack: () => void;
}

export default function ConversationThread({
  conversationId,
  conversation,
  currentUserId,
  currentRole,
  onBack,
}: ConversationThreadProps) {
  const { messages, isLoading, isError, loadOlder, hasMore, isLoadingOlder } =
    useThreadMessages(conversationId);
  const sendMutation = useSendMessage(conversationId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);

  // Scroll to bottom only when a new newest message appears (initial load,
  // send, realtime) — not when older history is prepended.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.id !== lastIdRef.current) {
      lastIdRef.current = last.id;
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const other = conversation
    ? otherParticipant(conversation.participants, currentUserId)
    : undefined;
  const label = participantDisplayName(other, currentRole);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src={resolveMediaUrl(other?.imagePath)} alt="" />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initialsFromLabel(label)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {label}
          </div>
          <div className="text-xs text-muted-foreground">Direct conversation</div>
        </div>
      </div>

      {/* Messages */}
      {isLoading ? (
        <ThreadSkeleton />
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <EmptyState
            icon={MessageSquare}
            title="Couldn't load messages"
            description="Please try again in a moment."
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {hasMore ? (
            <div className="mb-3 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={loadOlder}
                disabled={isLoadingOlder}
              >
                {isLoadingOlder ? "Loading…" : "Load older messages"}
              </Button>
            </div>
          ) : null}

          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                description="Send the first message to start the conversation."
              />
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOwn={m.senderId === currentUserId}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      )}

      {/* Composer */}
      <MessageComposer
        sending={sendMutation.isPending}
        onSend={(text) => sendMutation.mutate(text)}
      />
    </div>
  );
}
