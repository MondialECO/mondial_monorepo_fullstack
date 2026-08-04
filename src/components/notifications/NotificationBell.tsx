"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/_providers/AuthProvider";
import {
  useMarkNotificationRead,
  useNotificationRealtime,
  useNotifications,
} from "@/hooks/queries/notifications";

function formatTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

/**
 * `triggerClassName` styles the BELL BUTTON only.
 *
 * It exists because the SP headers previously wrapped this component in
 * `[&_button]:size-11` to give the trigger a 44px touch target. That arbitrary variant
 * compiles to a DESCENDANT selector, and the panel below renders inline rather than through
 * a portal — so it also matched every notification row, each of which is a <button>, and
 * forced them to 44x44px. Descendant specificity (class + element) outranks the row's own
 * `w-full` (class alone), so rows collapsed to a square: the title's `truncate` and the
 * body's `line-clamp-2` clipped to nothing while the timestamp's `shrink-0` kept its width
 * and spilled into the panel. Only the time survived. SP-only, and present for as long as
 * that wrapper has been there.
 *
 * Passing a class for the trigger explicitly makes that whole class of leak impossible:
 * a caller can no longer reach the panel's internals by selector.
 */
export default function NotificationBell({ triggerClassName }: { triggerClassName?: string } = {}) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  useNotificationRealtime(!!token);

  // Close on outside click / Escape.
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
        className={cn("relative", triggerClassName)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Could not load notifications.
            </p>
          ) : notifications.length === 0 ? (
            <div className="p-4">
              <EmptyState
                size="sm"
                icon={Bell}
                title="You're all caught up"
              />
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <ul className="divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!n.isRead) markRead.mutate(n.id);
                      }}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !n.isRead && "bg-muted/30"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          n.isRead ? "bg-transparent" : "bg-primary"
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "truncate text-sm text-foreground",
                              n.isRead ? "font-medium" : "font-semibold"
                            )}
                          >
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatTime(n.createdAt)}
                          </span>
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
