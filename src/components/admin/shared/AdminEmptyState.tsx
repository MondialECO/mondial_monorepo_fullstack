import React, { ReactNode } from "react";
import { FolderOpen, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminEmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  className?: string;
}

export function AdminEmptyState({
  title = "No records found",
  description = "There are no records matching your current filter criteria.",
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
  children,
  className = "",
}: AdminEmptyStateProps) {
  return (
    <div
      className={`py-16 px-4 text-center flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-muted/40 text-muted-foreground mb-3 border border-border/40">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-bold text-foreground tracking-tight font-syne mb-1">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="text-xs">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
