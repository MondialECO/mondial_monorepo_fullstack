"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OnboardingProvider, useOnboarding } from "@/providers/OnboardingProvider";

/**
 * Sits inside AuthGuard (so we know the user is logged in) but outside any
 * role-specific dashboard. While Phase 1 is incomplete, every /dashboard/*
 * request is redirected to the verification hub at /onboarding. The hub
 * itself decides which sub-page (Identity / Phone / Email / etc.) to send
 * the user to.
 */
function Gate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isComplete, status } = useOnboarding();
  const [hasSkipped, setHasSkipped] = useState(false);

  useEffect(() => {
    if (status?.role === "Creator") {
      const skippedAtStr = localStorage.getItem("creator_verification_skipped_at");
      if (skippedAtStr) {
        const skippedAt = parseInt(skippedAtStr, 10);
        const now = Date.now();
        if (now - skippedAt < 24 * 60 * 60 * 1000) {
          setHasSkipped(true);
          return;
        }
      }
    }
    setHasSkipped(false);
  }, [status, pathname]);

  const isBypassPath = pathname?.startsWith("/onboarding") || pathname?.startsWith("/creator/verification");
  const isAllowedCreator = status?.role === "Creator" && pathname?.startsWith("/dashboard/creator") && hasSkipped;

  useEffect(() => {
    if (isLoading) return;
    if (isComplete) return;
    // Status fetch failed (e.g. 401) — let AuthGuard handle the redirect.
    if (!status) return;
    if (isBypassPath) return;
    if (isAllowedCreator) return;
    router.replace("/onboarding");
  }, [isLoading, isComplete, status, pathname, router, isAllowedCreator, isBypassPath]);

  if (isLoading || (!isComplete && status && !isAllowedCreator && !isBypassPath)) {
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
