"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Smartphone } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { Button } from "@/components/ui/button";
import BackToHub from "@/components/onboarding/BackToHub";

export default function OnboardingPhonePage() {
  const router = useRouter();
  const { refresh, status } = useOnboarding();

  const [phone, setPhone] = useState(status?.phone ?? "");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"enter-phone" | "enter-code">("enter-phone");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/onboarding/send-otp", { phone });
      setStage("enter-code");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to send code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/onboarding/verify-otp", { code });
      await refresh();
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  async function devConfirm() {
    setError(null);
    setBusy(true);
    try {
      await api.post("/onboarding/phone/dev-confirm");
      await refresh();
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to mark verified. Backend may not be in Development mode.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[560px] px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <BackToHub />

      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Phone Verification</h1>
          <p className="text-sm text-muted-foreground">A 6-digit code will be sent via SMS. Expires in 60s.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {stage === "enter-phone" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
              Phone number (E.164)
            </label>
            <input
              id="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+33612345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring transition bg-card"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Include country code, e.g. +33 for France, +44 for the UK.
            </p>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1.5">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-2.5 border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring transition tracking-[0.4em] text-center font-mono bg-card"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Sent to {phone}.{" "}
              <button type="button" className="text-primary hover:underline" onClick={() => setStage("enter-phone")}>
                Use a different number
              </button>
            </p>
          </div>
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify code
          </Button>
        </form>
      )}

      {/* Development shortcut — mirrors the identity page. Replaced once the
          Twilio SMS integration is wired up. The endpoint behind the button
          is IsDevelopment()-gated, so production users never see this work. */}
      <div className="rounded-2xl border border-dashed border-border bg-card p-5 space-y-3">
        <div className="flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Development shortcut: skip the SMS exchange and mark the phone verified. Available only while the backend runs in Development.
          </span>
        </div>
        <Button onClick={devConfirm} disabled={busy} variant="outline" className="w-full">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Mark verified (development)
        </Button>
      </div>
    </div>
  );
}
