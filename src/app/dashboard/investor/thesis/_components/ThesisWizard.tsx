"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ThesisWizardProps {
  /** 1-based current input step (1..totalSteps-1). */
  step: number;
  /** Total steps including the completion screen. */
  totalSteps: number;
  title: string;
  subtitle: string;
  canProceed: boolean;
  isSaving: boolean;
  isError: boolean;
  errorMessage?: string;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

export default function ThesisWizard({
  step,
  totalSteps,
  title,
  subtitle,
  canProceed,
  isSaving,
  isError,
  errorMessage,
  onBack,
  onNext,
  onSubmit,
  children,
}: ThesisWizardProps) {
  const isLastInput = step === totalSteps - 1;
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold leading-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
            Step {step} of {totalSteps}
          </span>
        </div>
        <Progress value={pct} />
      </CardHeader>

      <CardContent className="space-y-6">
        {children}

        {isError ? (
          <p className="text-sm text-destructive">
            {errorMessage ?? "Couldn't save your thesis. Please try again."}
          </p>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={step === 1 || isSaving}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {isLastInput ? (
            <Button onClick={onSubmit} disabled={!canProceed || isSaving}>
              {isSaving ? (
                "Saving…"
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save &amp; finish
                </>
              )}
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
