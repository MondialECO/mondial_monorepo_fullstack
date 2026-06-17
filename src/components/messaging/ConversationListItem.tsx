"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  initialsFromLabel,
  otherParticipant,
  participantDisplayName,
  resolveMediaUrl,
} from "@/lib/messaging-utils";
import type { Conversation } from "@/types/chat";
import type { UserRole } from "@/lib/roles";

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId: string | undefined;
  currentRole: UserRole | undefined;
  active: boolean;
  onSelect: (id: string) => void;
}

export default function ConversationListItem({
  conversation,
  currentUserId,
  currentRole,
  active,
  onSelect,
}: ConversationListItemProps) {
  const other = otherParticipant(conversation.participants, currentUserId);
  const label = participantDisplayName(other, currentRole);
  const unread = conversation.unreadCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
        active ? "bg-accent" : "hover:bg-muted/60"
      )}
    >
      <Avatar className="h-10 w-10 shrink-0 border border-border">
        <AvatarImage src={resolveMediaUrl(other?.imagePath)} alt="" />
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initialsFromLabel(label)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm text-foreground",
              unread > 0 ? "font-bold" : "font-semibold"
            )}
          >
            {label}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-xs",
              unread > 0 ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            {conversation.lastMessage ?? "No messages yet"}
          </span>
          {unread > 0 ? (
            <Badge className="h-5 min-w-5 justify-center px-1.5 text-[10px] tabular-nums">
              {unread > 99 ? "99+" : unread}
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}
