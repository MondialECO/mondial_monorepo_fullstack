"use client";

import { MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/_providers/AuthProvider";
import { getMessageRouteForRole } from "@/lib/roles";
import { useConversations } from "@/hooks/queries/chat";

export default function MessageIcon() {
  // Total unread = sum of per-conversation unread counts from the live
  // conversations list (kept current by the chat realtime cache mutators).
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: conversations } = useConversations();
  const unreadCount = (conversations ?? []).reduce(
    (n, c) => n + (c.unreadCount ?? 0),
    0
  );

  // Resolves destination from current dashboard context first (e.g. /dashboard/serviceprovider -> /dashboard/serviceprovider/messages),
  // falling back to the user's primary role or /login if not authenticated.
  const openMessages = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    const targetRoute = getMessageRouteForRole(user.role, pathname);
    router.push(targetRoute);
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
