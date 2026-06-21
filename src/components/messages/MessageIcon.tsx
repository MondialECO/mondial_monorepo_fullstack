"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import EmptyState from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/app/_providers/AuthProvider";
import { useConversations } from "@/hooks/queries/chat";
import { UserRole } from "@/lib/roles";
import {
  formatRelativeTime,
  initialsFromLabel,
  otherParticipant,
  participantDisplayName,
  resolveMediaUrl,
} from "@/lib/messaging-utils";

function messengerRoute(role?: UserRole) {
  if (role === UserRole.SERVICE_PROVIDER) return "/dashboard/serviceprovider/messenger";
  if (role === UserRole.INVESTOR) return "/dashboard/investor/messages";
  if (role === UserRole.ENTREPRENEUR) return "/dashboard/entrepreneur/messages";
  return "/dashboard/creator/messenger";
}

export default function MessageIcon() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Total unread = sum of per-conversation unread counts from the live
  // conversations list (kept current by the chat realtime cache mutators).
  const { data: conversations, isLoading, isError } = useConversations();
  const unreadCount = (conversations ?? []).reduce(
    (n, c) => n + (c.unreadCount ?? 0),
    0
  );
  const route = messengerRoute(user?.role);
  const recent = (conversations ?? []).slice(0, 3);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Messages"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MessageCircle className="h-5 w-5 text-muted-foreground" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Messenger</p>
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
          </div>

          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Could not load messages.
            </p>
          ) : recent.length === 0 ? (
            <div className="p-4">
              <EmptyState size="sm" icon={MessageCircle} title="No messages yet" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((conversation) => {
                const other = otherParticipant(conversation.participants, user?.id);
                const label = participantDisplayName(other, user?.role);
                const unread = conversation.unreadCount ?? 0;

                return (
                  <Link
                    key={conversation.id}
                    href={route}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-10 w-10 shrink-0 border border-border">
                      <AvatarImage src={resolveMediaUrl(other?.imagePath)} alt="" />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initialsFromLabel(label)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {label}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {conversation.lastMessage ?? "No messages yet"}
                        </span>
                        {unread > 0 && (
                          <Badge className="h-5 min-w-5 justify-center px-1.5 text-[10px]">
                            {unread > 9 ? "9+" : unread}
                          </Badge>
                        )}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="border-t p-3">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={route} onClick={() => setOpen(false)}>
                Open messenger page
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
