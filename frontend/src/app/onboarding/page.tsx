"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { onboardingPath } from "@/lib/onboarding-routes";

/**
 * /onboarding hub — never has its own UI; just bounces the user to the
 * first incomplete step (or /onboarding/complete if everything is done).
 */
export default function OnboardingHub() {
  const router = useRouter();
  const { isLoading, nextStep, isComplete } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isComplete ? "/onboarding/complete" : onboardingPath(nextStep));
  }, [isLoading, nextStep, isComplete, router]);

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      Loading your onboarding…
    </div>
  );
}
