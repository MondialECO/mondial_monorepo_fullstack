"use client";

import { MessagesSquare } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConversationListItem from "./ConversationListItem";
import { ConversationListSkeleton } from "./Skeletons";
import type { Conversation } from "@/types/chat";
import type { UserRole } from "@/lib/roles";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  isError: boolean;
  currentUserId: string | undefined;
  currentRole: UserRole | undefined;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({
  conversations,
  isLoading,
  isError,
  currentUserId,
  currentRole,
  activeId,
  onSelect,
}: ConversationListProps) {
  if (isLoading) return <ConversationListSkeleton />;

  if (isError) {
    return (
      <div className="p-4">
        <EmptyState
          icon={MessagesSquare}
          title="Couldn't load conversations"
          description="Please try again in a moment."
        />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={MessagesSquare}
          title="No conversations yet"
          description="Start a new message to reach an investor or entrepreneur."
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((c) => (
          <ConversationListItem
            key={c.id}
            conversation={c}
            currentUserId={currentUserId}
            currentRole={currentRole}
            active={c.id === activeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
