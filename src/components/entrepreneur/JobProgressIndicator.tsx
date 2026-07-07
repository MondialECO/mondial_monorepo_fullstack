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
        return <CheckCircle2 className="w-6 h-6 text-success-text" />;
      case "failed":
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      case "processing":
        return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-muted-foreground" />;
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
        return "bg-success-light border-success-text/20";
      case "failed":
        return "bg-destructive/10 border-destructive/20";
      case "processing":
        return "bg-primary/10 border-primary/20";
      default:
        return "bg-muted border-border";
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <span className="text-xs font-medium text-muted-foreground">
              {getStatusText()}
            </span>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-input rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: jobStatus.status === "processing" ? "70%" : jobStatus.status === "completed" ? "100%" : "0%",
              }}
            />
          </div>

          {/* Result or Error Message */}
          {jobStatus.status === "completed" && jobStatus.result && (
            <p className="text-sm text-success-text">{jobStatus.result}</p>
          )}
          {jobStatus.status === "failed" && jobStatus.errorMessage && (
            <p className="text-sm text-destructive">{jobStatus.errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
