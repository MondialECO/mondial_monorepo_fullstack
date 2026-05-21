"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OnboardingProvider, useOnboarding } from "@/providers/OnboardingProvider";
import { onboardingPath } from "@/lib/onboarding-routes";

/**
 * Sits *inside* AuthGuard (so we know the user is logged in) but *outside*
 * any role-specific dashboard. Redirects to the right /onboarding/* step
 * until Phase 1 is complete. Once complete, the user passes through.
 */
function Gate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isComplete, nextStep, status } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;
    if (isComplete) return;
    // Status fetch failed (e.g. 401) — let AuthGuard handle the redirect.
    if (!status) return;

    const destination = onboardingPath(nextStep);
    if (pathname !== destination) {
      router.replace(destination);
    }
  }, [isLoading, isComplete, nextStep, status, pathname, router]);

  if (isLoading || (!isComplete && status)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Checking your account…
      </div>
    );
  }

  return <>{children}</>;
}

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <Gate>{children}</Gate>
    </OnboardingProvider>
  );
}
