"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/_providers/AuthProvider";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/roles";
import { useConversations } from "@/hooks/queries/chat";

export default function MessageIcon() {
  // Total unread = sum of per-conversation unread counts from the live
  // conversations list (kept current by the chat realtime cache mutators).
  const router = useRouter();
  const { user } = useAuth();
  const { data: conversations } = useConversations();
  const unreadCount = (conversations ?? []).reduce(
    (n, c) => n + (c.unreadCount ?? 0),
    0
  );

  // The icon renders only inside authenticated dashboard chrome, so user is
  // present in practice; the fallback covers the render before auth resolves.
  const openMessages = () => {
    const base = user ? ROLE_DASHBOARD_ROUTES[user.role] : "/login";
    router.push(`${base}/messages`);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Messages"
      onClick={openMessages}
    >
      <MessageCircle className="h-5 w-5 text-muted-foreground" />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
