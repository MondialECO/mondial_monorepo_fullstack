"use client";

import React from "react";

interface RegenerateCapBadgeProps {
  usedCount: number;
  maxCount?: number;
  className?: string;
}

export function RegenerateCapBadge({
  usedCount,
  maxCount = 3,
  className = "",
}: RegenerateCapBadgeProps) {
  const remaining = Math.max(0, maxCount - usedCount);
  const isExhausted = remaining === 0;

  if (isExhausted) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono text-badge font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 tabular-nums shrink-0 ${className}`}
        title={`Maximum ${maxCount} regenerations reached`}
      >
        0/{maxCount} LEFT
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-badge font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50 tabular-nums shrink-0 ${className}`}
      title={`${remaining} of ${maxCount} regenerations left`}
    >
      {remaining}/{maxCount} LEFT
    </span>
  );
}
