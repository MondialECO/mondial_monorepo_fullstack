"use client";

import type { RealtimeStatus } from "@/lib/realtime";
import { useLanguage } from "@/providers/LanguageProvider";

interface MessagesHeaderProps {
  status: RealtimeStatus;
}

export default function MessagesHeader({ status }: MessagesHeaderProps) {
  const { t } = useLanguage();
  const live = status === "connected";

  const getStatusLabel = (s: RealtimeStatus) => {
    switch (s) {
      case "idle":
      case "disconnected":
        return t("creator.messages.status.offline", "Offline");
      case "connecting":
        return t("creator.messages.status.connecting", "Connecting…");
      case "connected":
        return t("creator.messages.status.live", "Live");
      case "reconnecting":
        return t("creator.messages.status.reconnecting", "Reconnecting…");
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px]">
            {t("creator.messages.header.title", "Messages")}
          </h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            aria-live="polite"
          >
            <span
              className={
                live
                  ? "inline-block h-1.5 w-1.5 rounded-full bg-success-text"
                  : "inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground"
              }
              aria-hidden
            />
            {getStatusLabel(status)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            "creator.messages.header.subtitle",
            "Direct conversations between entrepreneurs and investors. Start one from a deal in Discovery or your Pipeline."
          )}
        </p>
      </div>
    </div>
  );
}
