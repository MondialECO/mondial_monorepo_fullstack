"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, IdCard, AlertCircle, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { Button } from "@/components/ui/button";
import BackToHub from "@/components/onboarding/BackToHub";

export default function OnboardingIdentityPage() {
  const router = useRouter();
  const { refresh, status } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function devConfirm() {
    setError(null);
    setBusy(true);
    try {
      // Per product: one shared SUMSUB session covers both Identity Document
      // and Facial Verification. The dev shortcut flips both flags so the hub
      // shows two ✓ at once.
      await api.post("/onboarding/identity/dev-confirm");
      await refresh();
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to mark verified. Backend may not be in Development mode.");
    } finally {
      setBusy(false);
    }
  }

  const identityDone = !!status?.items?.identity?.verified;
  const faceDone = !!status?.items?.face?.verified;

  return (
    <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <BackToHub />

      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <IdCard className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Verify your identity</h1>
          <p className="text-sm text-muted-foreground">
            Government ID + face match in one secure session. Both Identity Document and Facial Verification will complete together.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <StatusChip label="Identity Document" done={identityDone} />
        <StatusChip label="Facial Verification" done={faceDone} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your information is encrypted and processed by our certified security partner. The real ID + face scan widget lands in the next release.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-amber-500/5 border border-amber-500/30 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Development shortcut: clicking below marks both Identity and Face verified.</span>
        </div>

        <Button onClick={devConfirm} disabled={busy || (identityDone && faceDone)} className="w-full">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {identityDone && faceDone ? "Already verified" : "Mark verified (development)"}
        </Button>
      </div>
    </div>
  );
}

function StatusChip({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm " +
        (done
          ? "border-green-600/40 bg-green-600/5 text-green-700 dark:text-green-300"
          : "border-border text-muted-foreground")
      }
    >
      <span
        className={
          "w-2 h-2 rounded-full " +
          (done ? "bg-green-600" : "bg-muted-foreground")
        }
      />
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-xs uppercase tracking-wide">
        {done ? "Verified" : "Pending"}
      </span>
    </div>
  );
}
