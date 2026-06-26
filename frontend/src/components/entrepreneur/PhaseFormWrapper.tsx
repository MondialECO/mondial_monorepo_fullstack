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
        <h1 className="text-3xl font-bold text-neutral-1">{title}</h1>
        {description && (
          <p className="text-neutral-5 mt-2">{description}</p>
        )}
      </div>

      {/* Success Banner */}
      {success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">
              {successMessage || "Saved successfully!"}
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Error</p>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="text-red-600 hover:text-red-700 flex-shrink-0"
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
              className="mt-4 border-red-300"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-neutral-5 text-sm">Saving your changes...</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white border-2 border-neutral-2 rounded-xl p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
