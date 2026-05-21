"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useAuth } from "@/app/_providers/AuthProvider";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/role-routes";
import { UserRole } from "@/lib/roles";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isComplete, isLoading, refresh } = useOnboarding();

  useEffect(() => {
    if (isLoading) return;

    if (!isComplete) {
      // Caller arrived here too early; bounce back to /onboarding which
      // will figure out the right step.
      router.replace("/onboarding");
      return;
    }

    const role = user?.role ?? UserRole.CREATOR;
    const dest = ROLE_DASHBOARD_ROUTES[role] ?? "/dashboard";
    const t = setTimeout(() => router.replace(dest), 1200);
    return () => clearTimeout(t);
  }, [isComplete, isLoading, router, user?.role]);

  useEffect(() => {
    // Defensive: pull the latest status one more time so the badge state
    // reflects reality if the user reloaded this page directly.
    void refresh();
  }, [refresh]);

  return (
    <div className="max-w-md text-center mx-auto py-8">
      <div className="w-16 h-16 rounded-full bg-green-600/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-9 h-9 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">You&apos;re all set</h2>
      <p className="text-muted-foreground mb-6">
        Phase 1 complete. Taking you to your dashboard…
      </p>
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Redirecting
      </div>
    </div>
  );
}
