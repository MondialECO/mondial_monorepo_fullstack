"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  CheckCheck,
  DollarSign,
  Handshake,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types/notifications";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/queries/notifications";

function formatTime(iso: string, locale?: string): string {
  try {
    return formatDistanceToNowStrict(new Date(iso), {
      addSuffix: true,
      locale: locale === "fr" ? fr : undefined,
    });
  } catch {
    return "";
  }
}

function getNotificationTypeLabel(
  type: NotificationType | string | undefined,
  t: (k: string, fb: string) => string
): string {
  switch (type?.toLowerCase()) {
    case "message":
      return t("creator.notifications.types.message", "Message");
    case "investment":
      return t("creator.notifications.types.investment", "Investment");
    case "security":
      return t("creator.notifications.types.security", "Security");
    case "system":
      return t("creator.notifications.types.system", "System");
    default:
      return type || "";
  }
}

function getNotificationIcon(type: NotificationType | string) {
  switch (type) {
    case "Message":
      return <MessageSquare className="h-4 w-4 text-primary" />;
    case "Investment":
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    case "Security":
      return <ShieldCheck className="h-4 w-4 text-amber-500" />;
    case "System":
      return <Sparkles className="h-4 w-4 text-primary" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

interface SharedNotificationsPageProps {
  role?: string;
}

const PAGE_SIZE = 20;

export default function SharedNotificationsPage({ role }: SharedNotificationsPageProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Fetch up to 100 notifications for full page review
  const { notifications, unreadCount, isLoading, isError, refetch } = useNotifications(100);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const visibleNotifications = filteredNotifications.slice(0, displayCount);
  const hasMore = filteredNotifications.length > displayCount;

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) {
      markRead.mutate(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <PageContainer variant="standard" className="space-y-6">
      {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading text-foreground">
              {t("creator.notifications.page.title", "Notifications")}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("creator.notifications.page.subtitle", "Stay updated on your projects, deals, messages, and platform activity.")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="text-xs font-semibold gap-1.5 h-9"
              >
                <CheckCheck className="h-4 w-4 text-primary" />
                <span>{t("creator.notifications.actions.markAllRead", "Mark all as read")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setFilter("all");
              setDisplayCount(PAGE_SIZE);
            }}
            className="text-xs font-semibold h-8 gap-1.5"
          >
            <span>{t("creator.notifications.filters.all", "All")}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {notifications.length}
            </Badge>
          </Button>

          <Button
            variant={filter === "unread" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setFilter("unread");
              setDisplayCount(PAGE_SIZE);
            }}
            className="text-xs font-semibold h-8 gap-1.5"
          >
            <span>{t("creator.notifications.filters.unread", "Unread")}</span>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground font-bold">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/4 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
            <p className="text-sm text-destructive font-medium">
              {t("creator.notifications.errors.couldNotLoad", "Could not load notifications.")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs font-semibold gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {t("creator.notifications.actions.tryAgain", "Try Again")}
            </Button>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-12 rounded-2xl border border-border bg-card text-center">
            <EmptyState
              size="default"
              icon={Bell}
              title={filter === "unread" ? t("creator.notifications.empty.noUnreadTitle", "No unread notifications") : t("creator.notifications.empty.noNotificationsTitle", "No notifications yet")}
              description={t("creator.notifications.empty.description", "Updates about your projects, deals, messages, and activity will appear here.")}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map((n) => (
              <Card
                key={n.id}
                role="article"
                aria-label={n.title}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  "p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none",
                  n.isRead
                    ? "border-border bg-card hover:bg-muted/40"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/10 shadow-sm"
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Type Icon */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/20"
                    )}
                  >
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Notification Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={cn(
                            "text-sm truncate",
                            n.isRead ? "font-medium text-foreground" : "font-bold text-foreground"
                          )}
                        >
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30 shrink-0">
                            {t("creator.notifications.item.new", "New")}
                          </Badge>
                        )}
                        {n.type && (
                          <Badge variant="secondary" className="text-[10px] text-muted-foreground hidden sm:inline-flex">
                            {getNotificationTypeLabel(n.type, t)}
                          </Badge>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(n.createdAt, locale)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {n.body}
                    </p>

                    {n.link && (
                      <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-primary">
                        <span>{t("creator.notifications.item.viewDetails", "View details")}</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  className="text-xs font-semibold"
                >
                  {t("creator.notifications.pagination.loadMore", "Load More Notifications")}
                </Button>
              </div>
            )}
          </div>
        )}
    </PageContainer>
  );
}
