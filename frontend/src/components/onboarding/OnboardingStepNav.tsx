"use client";

import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { isStepComplete } from "@/lib/onboarding-routes";
import { cn } from "@/lib/utils";

export default function OnboardingStepNav() {
  const { steps, status, isLoading } = useOnboarding();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {steps.map((step) => {
        const done = status ? isStepComplete(step, status) : false;
        const current = pathname?.endsWith(`/onboarding/${step.slug}`);

        return (
          <li
            key={step.slug}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              current && "border-primary bg-primary/5",
              !current && done && "border-green-600/30 bg-green-600/5",
              !current && !done && "border-border",
            )}
          >
            <span className="mt-0.5">
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className={cn("w-5 h-5", current ? "text-primary" : "text-muted-foreground")} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                Step {step.number}. {step.title}
              </span>
              <span className="block text-xs text-muted-foreground">{step.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
