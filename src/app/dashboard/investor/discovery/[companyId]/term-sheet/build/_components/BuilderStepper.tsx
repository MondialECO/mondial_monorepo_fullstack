"use client";

import { ArrowLeft, ArrowRight, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface BuilderStepperProps {
  step: number; // 1-based
  totalSteps: number;
  title: string;
  subtitle: string;
  savedAt?: number | null;
  canProceed: boolean;
  isSending?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

export default function BuilderStepper({
  step,
  totalSteps,
  title,
  subtitle,
  savedAt,
  canProceed,
  isSending,
  isError,
  errorMessage,
  onBack,
  onNext,
  onSubmit,
  children,
}: BuilderStepperProps) {
  const isLast = step === totalSteps;
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <Card className="rounded-2xl border-border">
      <CardContent className="space-y-6 p-6">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {savedAt ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Check className="h-3 w-3 text-primary" aria-hidden />
                  Auto-saved
                </span>
              ) : null}
              <span className="text-xs font-medium text-muted-foreground">
                Step {step} of {totalSteps}
              </span>
            </div>
          </div>
          <Progress value={pct} />
        </div>

        <div>{children}</div>

        {isError ? (
          <p className="text-sm text-destructive">
            {errorMessage ?? "Couldn't send the offer. Please try again."}
          </p>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={step === 1 || isSending}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {isLast ? (
            <Button onClick={onSubmit} disabled={!canProceed || isSending}>
              <Send className="h-4 w-4" />
              {isSending ? "Sending…" : "Send offer"}
            </Button>
          ) : (
            <Button onClick={onNext} disabled={!canProceed}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
