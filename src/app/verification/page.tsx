"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import AuthGuard from "@/components/layout/AuthGuard";
import { Button } from "@/components/ui/button";
import { OnboardingProvider, useOnboarding } from "@/providers/OnboardingProvider";

export default function VerificationPage() {
  return (
    <AuthGuard>
      <OnboardingProvider>
        <VerificationFlow />
      </OnboardingProvider>
    </AuthGuard>
  );
}

function VerificationFlow() {
  const { isLoading, isComplete, nextRequired } = useOnboarding();
  const href = nextRequired?.href ?? "/onboarding/complete";

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">Universal Identity Gate</p>
                <h1 className="mt-1 text-3xl font-semibold leading-10 text-foreground">
                  Verification flow
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Complete the required checks to unlock the rest of your Mondial.eco account.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                Loading your verification status...
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {isComplete ? "Required checks complete" : nextRequired?.title ?? "Continue verification"}
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {isComplete
                        ? "Your profile is ready for the next onboarding phase."
                        : nextRequired?.description ?? "Resume the next required verification step."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              {isLoading ? (
                <Button disabled>
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button asChild>
                  <Link href={href}>
                    Continue
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
