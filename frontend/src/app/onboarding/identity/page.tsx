"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { Button } from "@/components/ui/button";

export default function OnboardingIdentityPage() {
  const router = useRouter();
  const { refresh, status } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneVerified = status?.phoneVerified ?? false;

  async function devConfirm() {
    setError(null);
    setBusy(true);
    try {
      await api.post("/onboarding/kyc/dev-confirm");
      await refresh();
      router.push("/onboarding/profile");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to mark verified. Backend may not be in Development mode.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Verify your identity</h2>
          <p className="text-sm text-muted-foreground">
            Government ID scan + face match. Powered by SUMSUB.
          </p>
        </div>
      </div>

      {!phoneVerified && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Please verify your phone first.{" "}
          <button onClick={() => router.push("/onboarding/phone")} className="font-medium underline">
            Go back
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            The SUMSUB widget will replace this card in the next release. For now, use the
            development shortcut below to mark KYC as verified and continue.
          </div>
        </div>

        <Button onClick={devConfirm} disabled={busy || !phoneVerified} className="w-full">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Mark verified (development)
        </Button>
      </div>
    </div>
  );
}
