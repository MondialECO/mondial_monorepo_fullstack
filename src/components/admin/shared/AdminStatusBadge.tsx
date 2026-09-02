import React from "react";
import { Badge } from "@/components/ui/badge";

export type AdminStatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple"
  | "cyan";

interface AdminStatusBadgeProps {
  status: string;
  variant?: AdminStatusVariant;
  className?: string;
  size?: "sm" | "default";
}

export function getStatusVariant(status: string): AdminStatusVariant {
  const s = (status || "").trim().toLowerCase();

  // Success / Verified / Active / Healthy / Resolved / Approved / Completed
  if (
    s === "verified" ||
    s === "active" ||
    s === "healthy" ||
    s === "resolved" ||
    s === "approved" ||
    s === "completed" ||
    s === "succeeded" ||
    s === "success" ||
    s === "delivered" ||
    s === "released"
  ) {
    return "success";
  }

  // Warning / Pending / Under Review / In Progress / Degraded / Requested / Needs Update
  if (
    s === "pending" ||
    s === "underreview" ||
    s === "under review" ||
    s === "under_review" ||
    s === "in_progress" ||
    s === "inprogress" ||
    s === "in progress" ||
    s === "degraded" ||
    s === "processing" ||
    s === "queued" ||
    s === "scheduled" ||
    s === "requested" ||
    s === "submitted" ||
    s === "awaiting" ||
    s === "needsupdate" ||
    s === "needs update" ||
    s === "needs_update"
  ) {
    return "warning";
  }

  // Danger / Failed / Rejected / Suspended / Locked / Critical / Unhealthy / Dispute
  if (
    s === "rejected" ||
    s === "suspended" ||
    s === "locked" ||
    s === "failed" ||
    s === "unhealthy" ||
    s === "critical" ||
    s === "high" ||
    s === "disputed" ||
    s === "dispute" ||
    s === "error" ||
    s === "blocked"
  ) {
    return "danger";
  }

  // Purple / Action Taken / Special
  if (s === "actiontaken" || s === "action taken" || s === "confidential" || s === "restrictedpii") {
    return "purple";
  }

  // Info / Open / New / Normal / Data Access / Export
  if (s === "open" || s === "new" || s === "normal" || s === "dataaccess" || s === "dataexport") {
    return "info";
  }

  // Neutral / Dismissed / Low / Unknown / Inactive / Archived / Hidden / Cancelled
  return "neutral";
}

export function AdminStatusBadge({
  status,
  variant,
  className = "",
  size = "default",
}: AdminStatusBadgeProps) {
  const effectiveVariant = variant || getStatusVariant(status);
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5";

  let colorClasses = "";
  switch (effectiveVariant) {
    case "success":
      colorClasses =
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium";
      break;
    case "warning":
      colorClasses =
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium";
      break;
    case "danger":
      colorClasses =
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-medium";
      break;
    case "purple":
      colorClasses =
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-medium";
      break;
    case "info":
      colorClasses =
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium";
      break;
    case "cyan":
      colorClasses =
        "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 font-medium";
      break;
    case "neutral":
    default:
      colorClasses =
        "bg-muted/60 text-muted-foreground border-border/60 font-medium";
      break;
  }

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-tight ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          effectiveVariant === "success"
            ? "bg-emerald-500"
            : effectiveVariant === "warning"
            ? "bg-amber-500"
            : effectiveVariant === "danger"
            ? "bg-rose-500"
            : effectiveVariant === "purple"
            ? "bg-purple-500"
            : effectiveVariant === "info"
            ? "bg-blue-500"
            : effectiveVariant === "cyan"
            ? "bg-cyan-500"
            : "bg-muted-foreground/60"
        }`}
      />
      <span>{status}</span>
    </Badge>
  );
}
