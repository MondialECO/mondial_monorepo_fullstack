"use client";

import { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhaseFormWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  successMessage?: string;
  onRetry?: () => void;
  onDismissError?: () => void;
}

export function PhaseFormWrapper({
  title,
  description,
  children,
  isLoading,
  error,
  success,
  successMessage,
  onRetry,
  onDismissError,
}: PhaseFormWrapperProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      {/* Success Banner */}
      {success && (
        <div className="bg-success-light border-2 border-success-text/20 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success-text flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-success-text">
              {successMessage || "Saved successfully!"}
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive mb-1">Error</p>
                <p className="text-destructive text-sm">{error}</p>
              </div>
            </div>
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="text-destructive hover:text-destructive/80 flex-shrink-0"
              >
                ✕
              </button>
            )}
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-4 border-destructive/20"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-popover rounded-lg p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Saving your changes...</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-popover border-2 border-border rounded-xl p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
