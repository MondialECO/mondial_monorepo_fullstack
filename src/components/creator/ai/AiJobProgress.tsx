"use client";

import { Loader2, CheckCircle2, AlertCircle, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiSessionStatus } from "@/types/creator/ai";

interface AiJobProgressProps {
  status: AiSessionStatus;
  title: string;
  /** Backend-provided failure message, shown when status is Failed. */
  error?: string | null;
}

/**
 * Progress experience for an AI session, driven by the session status
 * (the source of truth). Mirrors the entrepreneur JobProgressIndicator
 * pattern but for the PascalCase AI-session lifecycle.
 */
export function AiJobProgress({ status, title, error }: AiJobProgressProps) {
  const config: Record<
    AiSessionStatus,
    { icon: typeof Clock; text: string; box: string; bar: number; spin?: boolean }
  > = {
    Pending: {
      icon: Clock,
      text: "Queued — waiting to start.",
      box: "bg-muted/40 border-border",
      bar: 10,
    },
    Processing: {
      icon: Loader2,
      text: "Generating with AI. This can take a moment…",
      box: "bg-info/10 border-info/30",
      bar: 70,
      spin: true,
    },
    Completed: {
      icon: CheckCircle2,
      text: "Done.",
      box: "bg-success-light border-success-text/20",
      bar: 100,
    },
    NeedsReview: {
      icon: Eye,
      text: "Generated — flagged for your review.",
      box: "bg-warning/10 border-warning/30",
      bar: 100,
    },
    Failed: {
      icon: AlertCircle,
      text: error || "Generation failed. Please try again.",
      box: "bg-destructive/10 border-destructive/30",
      bar: 100,
    },
  };

  const { icon: Icon, text, box, bar, spin } = config[status];

  return (
    <div className={cn("rounded-xl border p-4", box)}>
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 text-foreground/80",
            spin && "animate-spin",
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
          {status !== "Failed" && (
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  status === "Completed" || status === "NeedsReview"
                    ? "bg-success-text"
                    : "bg-primary",
                )}
                style={{ width: `${bar}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiJobProgress;
