"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import { useBackgroundJob } from "@/hooks/useBackgroundJob";

interface JobProgressIndicatorProps {
  jobId: string | null;
  title: string;
  description?: string;
  onComplete?: (success: boolean, result?: string, error?: string) => void;
}

export function JobProgressIndicator({
  jobId,
  title,
  description,
  onComplete,
}: JobProgressIndicatorProps) {
  const { jobStatus, isDone, isSuccess, isFailed } = useBackgroundJob(jobId);
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (isDone && !hasNotified && onComplete) {
      setHasNotified(true);
      onComplete(isSuccess, jobStatus?.result, jobStatus?.errorMessage);
    }
  }, [isDone, hasNotified, isSuccess, jobStatus, onComplete]);

  if (!jobId || !jobStatus) return null;

  const getStatusIcon = () => {
    switch (jobStatus.status) {
      case "completed":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case "processing":
        return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-neutral-5" />;
    }
  };

  const getStatusText = () => {
    switch (jobStatus.status) {
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "processing":
        return "Processing...";
      case "queued":
        return "Queued";
      default:
        return "Unknown";
    }
  };

  const getBgColor = () => {
    switch (jobStatus.status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "failed":
        return "bg-red-50 border-red-200";
      case "processing":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-neutral-50 border-neutral-200";
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-neutral-1">{title}</h4>
            <span className="text-xs font-medium text-neutral-5">
              {getStatusText()}
            </span>
          </div>
          {description && (
            <p className="text-sm text-neutral-5 mb-2">{description}</p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: jobStatus.status === "processing" ? "70%" : jobStatus.status === "completed" ? "100%" : "0%",
              }}
            />
          </div>

          {/* Result or Error Message */}
          {jobStatus.status === "completed" && jobStatus.result && (
            <p className="text-sm text-green-700">{jobStatus.result}</p>
          )}
          {jobStatus.status === "failed" && jobStatus.errorMessage && (
            <p className="text-sm text-red-700">{jobStatus.errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
