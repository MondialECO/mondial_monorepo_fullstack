"use client";

import {
  Bell,
  CheckCheck,
  DollarSign,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/_providers/AuthProvider";
import { getNotificationRouteForRole } from "@/lib/roles";
import type { AppNotification, NotificationType } from "@/types/notifications";
import {
  useMarkAllNotificationsRead,
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

function getNotificationIcon(type: NotificationType | string) {
  switch (type) {
    case "Message":
      return <MessageSquare className="h-4 w-4" />;
    case "Investment":
    case "term_sheet":
    case "deal_counter":
    case "deal_closed":
      return <DollarSign className="h-4 w-4" />;
    case "Security":
    case "data_room_access_request":
    case "data_room_access_approved":
    case "data_room_access_declined":
    case "data_room_access_revoked":
      return <ShieldCheck className="h-4 w-4" />;
    case "diligence_question":
    case "diligence_answer":
      return <MessageSquare className="h-4 w-4" />;
    case "System":
      return <Sparkles className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}


/**
 * `triggerClassName` styles the BELL BUTTON only.
 */
export default function NotificationBell({ triggerClassName }: { triggerClassName?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Request latest 10 items for the topbar dropdown
  const { notifications, unreadCount, isLoading, isError, refetch } = useNotifications(10);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  useNotificationRealtime(!!token);

  // Exact latest 10 items to display
  const latestTen = (notifications ?? []).slice(0, 10);
  const notificationsRoute = getNotificationRouteForRole(user?.role, pathname);

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) {
      markRead.mutate(n.id);
    }
    setOpen(false);
    if (n.link) {
      router.push(n.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

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
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[380px] max-w-[calc(100vw-1.5rem)] max-h-[min(640px,calc(100vh-6rem))] flex flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl">
          {/* Header - Fixed */}
          <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3.5 bg-card/60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold font-heading text-foreground">Notifications</p>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 px-1.5 py-0 h-4">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-sans">
                Stay up to date with your activity.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0 ml-2"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Area - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border border-border/40 bg-muted/20">
                    <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-24 rounded" />
                        <Skeleton className="h-3 w-10 rounded" />
                      </div>
                      <Skeleton className="h-3 w-full rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-destructive font-medium">
                  Unable to load notifications
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="text-xs font-semibold gap-1.5 h-7"
                >
                  <RefreshCw className="h-3 w-3" /> Try again
                </Button>
              </div>
            ) : latestTen.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  size="default"
                  icon={Bell}
                  title="No notifications yet"
                  description="New activity and updates will appear here."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {latestTen.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "relative flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 w-full select-none",
                        !n.isRead && "bg-primary/[0.04]"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          n.isRead
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary border border-primary/20"
                        )}
                      >
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "text-xs leading-snug line-clamp-2",
                              n.isRead ? "font-medium text-foreground" : "font-bold text-foreground"
                            )}
                          >
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground mt-0.5">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                          {n.body}
                        </p>
                      </div>

                      {/* Unread indicator dot */}
                      {!n.isRead && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2 shadow-sm"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer - Fixed See More CTA */}
          <div className="shrink-0 border-t border-border bg-card/80 p-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 h-9 rounded-xl"
              onClick={() => setOpen(false)}
            >
              <Link href={notificationsRoute}>
                See More
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


