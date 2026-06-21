import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Optional lucide icon rendered in the header. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional action node (e.g. a Button or Link) rendered below the copy. */
  action?: ReactNode;
  /**
   * `default` — full-size panel (feed / page empties).
   * `sm` — compact placeholder (kanban column / inline empties).
   */
  size?: "default" | "sm";
  className?: string;
}

/**
 * Canonical empty-state primitive. Generalizes the investor `EmptyFeedState`
 * (size="default") and `EmptyColumnPlaceholder` (size="sm") patterns.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "default",
  className,
}: EmptyStateProps) {
  const isSm = size === "sm";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-border text-center",
        isSm
          ? "rounded-xl bg-card/50 py-8 px-4"
          : "rounded-2xl bg-card py-12 px-6",
        className
      )}
    >
      {Icon ? (
        isSm ? (
          <Icon className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden />
        ) : (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
        )
      ) : null}

      {isSm ? (
        <p className="text-xs text-muted-foreground">{title}</p>
      ) : (
        <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      )}

      {description && !isSm ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}

      {action ? <div className={cn(isSm ? "mt-3" : "mt-5")}>{action}</div> : null}
    </div>
  );
}
