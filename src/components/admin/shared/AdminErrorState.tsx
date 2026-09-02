import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function AdminErrorState({
  title = "Failed to load data",
  message,
  onRetry,
  className = "",
}: AdminErrorStateProps) {
  return (
    <div
      className={`p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h4 className="text-xs font-semibold">{title}</h4>
          <p className="text-xs text-destructive/80 mt-0.5 truncate max-w-xl">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-8 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
