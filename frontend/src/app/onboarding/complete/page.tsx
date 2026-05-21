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
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (isLoading) return;
    if (!isComplete) {
      router.replace("/onboarding");
      return;
    }
    const role = user?.role ?? UserRole.CREATOR;
    const dest = ROLE_DASHBOARD_ROUTES[role] ?? "/dashboard";
    const t = setTimeout(() => router.replace(dest), 1600);
    return () => clearTimeout(t);
  }, [isComplete, isLoading, router, user?.role]);

  return (
    <div className="mx-auto max-w-[480px] px-4 sm:px-6 py-16">
      <div className="rounded-3xl border border-border bg-card p-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-600/15 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Documents Verified</h1>
          <p className="text-sm text-muted-foreground">
            All required verifications complete. Taking you to your dashboard.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Redirecting…
        </div>
      </div>
    </div>
  );
}
