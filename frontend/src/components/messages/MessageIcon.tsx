"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessageIcon() {
  const unreadCount = 2; // later API / realtime

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Messages"
    >
      <MessageCircle className="h-5 w-5 text-muted-foreground" />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
          {unreadCount}
        </span>
      )}
    </Button>
  );
}
