"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { Button } from "@/components/ui/button";

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
      router.push("/onboarding/identity");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Verify your phone</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ll text a 6-digit code. It expires in 60 seconds.
          </p>
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
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
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
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring transition"
            />
            <p className="mt-1 text-xs text-muted-foreground">
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
            <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1">
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
              className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring transition tracking-[0.4em] text-center font-mono"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Code sent to {phone}. <button type="button" className="text-primary hover:underline" onClick={() => setStage("enter-phone")}>Use a different number</button>
            </p>
          </div>

          <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify code
          </Button>
        </form>
      )}
    </div>
  );
}
