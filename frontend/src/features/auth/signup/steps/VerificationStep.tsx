"use client";

import { ChevronRight, Circle, ShieldCheck, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VERIFICATION_STEPS } from "@/features/auth/signup/constants/verification-steps";

interface VerificationStepProps {
  onBack?: () => void;
  onStart?: () => void;
  onSelectStep?: (id: string) => void;
}

/**
 * Identity Verification — Figma frame 3600.
 * Two-column card: progress sidebar on the left, mandatory-steps list +
 * "Start Verification" CTA on the right. Stacks on mobile.
 */
export function VerificationStep({
  onBack,
  onStart,
  onSelectStep,
}: VerificationStepProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-3xl border-2 border-card bg-card shadow-sm",
        "flex flex-col lg:flex-row",
      )}
    >
      {/* Left column — progress sidebar */}
      <aside
        className={cn(
          "flex flex-col items-center justify-center gap-6",
          "px-8 py-8 lg:px-[120px] lg:py-8",
          "border-b border-border lg:border-b-0 lg:border-r",
        )}
      >
        <div className="flex flex-col items-center">
          <div className="relative">
            <div
              className="flex size-[150px] items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <User className="size-16" strokeWidth={1.5} />
            </div>
            <span
              className={cn(
                "absolute -bottom-3 left-1/2 -translate-x-1/2",
                "rounded-full border border-border bg-card",
                "px-3 py-1 text-[13px] font-medium leading-5 text-muted-foreground",
              )}
            >
              UNVERIFIED
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-[9px] text-center">
          <p className="text-[32px] font-medium leading-10 text-foreground">
            0% Complete
          </p>
          <p className="text-lg leading-7 text-muted-foreground">
            Verification required
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-base text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
          <span className="leading-6">Secure Identity Gate</span>
        </div>
      </aside>

      {/* Right column — mandatory steps + CTA */}
      <div
        className={cn(
          "flex flex-1 flex-col items-end gap-10",
          "px-8 py-10 lg:pl-[60px] lg:pr-[120px] lg:py-[60px]",
        )}
      >
        {onBack && (
          <button
            onClick={onBack}
            className={cn(
              "flex items-center gap-2 text-sm font-medium text-muted-foreground",
              "transition-colors hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            aria-label="Go back to role selection"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Role Selection
          </button>
        )}

        <div className="flex w-full max-w-[428px] flex-col gap-3">
          <h2 className="text-[32px] font-semibold leading-10 tracking-tight text-foreground">
            Identity Verification Required
          </h2>
          <p className="text-base leading-6 text-muted-foreground">
            To maintain{" "}
            <span className="font-semibold text-foreground">
              ecosystem integrity
            </span>{" "}
            and high-trust standards, all members must complete mandatory
            verification. Verified accounts are M01-M50 trust certified, granting
            full marketplace access and secure deal capabilities.
          </p>
        </div>

        <div className="flex w-full max-w-[428px] flex-col gap-8">
          <ul className="flex flex-col">
            <li className="border-b border-border pb-3">
              <p className="text-base font-medium leading-6 text-muted-foreground">
                MANDATORY STEPS
              </p>
            </li>
            {VERIFICATION_STEPS.map((step) => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onSelectStep?.(step.id)}
                  className={cn(
                    "group flex w-full items-center justify-between gap-5 border-b border-border py-6",
                    "text-left transition-colors hover:bg-muted/40",
                    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                  )}
                >
                  <span className="flex flex-1 items-center gap-5">
                    <Circle
                      className="size-6 shrink-0 text-muted-foreground/60 group-hover:text-primary"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <span className="flex flex-col">
                      <span className="text-base font-medium leading-6 text-foreground">
                        {step.title}
                      </span>
                      <span className="truncate text-[13px] font-medium leading-5 text-muted-foreground">
                        {step.description}
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex justify-end">
            <Button onClick={onStart} size="lg" className="px-6">
              Start Verification
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
