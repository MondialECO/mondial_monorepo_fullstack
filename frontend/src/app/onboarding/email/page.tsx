"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { Button } from "@/components/ui/button";
import BackToHub from "@/components/onboarding/BackToHub";

export default function OnboardingEmailPage() {
  const router = useRouter();
  const { refresh, status } = useOnboarding();
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"need-send" | "enter-code">("need-send");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError(null);
    setBusy(true);
    try {
      await api.post("/onboarding/send-email-otp");
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
      await api.post("/onboarding/verify-email-otp", { code });
      await refresh();
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // Auto-trigger the send on first arrival so the user just sees the code
    // input. They can use "Resend code" if needed.
    if (stage === "need-send") void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maskedEmail = status?.email ? maskEmail(status.email) : "your email";

  return (
    <div className="mx-auto max-w-[560px] px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <BackToHub />

      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Email Verification</h1>
          <p className="text-sm text-muted-foreground">
            A 6-digit verification code was sent to {maskedEmail}.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={verifyCode} className="space-y-4">
        <div>
          <label htmlFor="email-code" className="block text-sm font-medium text-foreground mb-1.5">
            6-digit code
          </label>
          <input
            id="email-code"
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
            Didn&apos;t receive it?{" "}
            <button type="button" className="text-primary hover:underline" onClick={sendCode}>
              Resend code
            </button>
          </p>
        </div>
        <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Verify code
        </Button>
      </form>
    </div>
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return email;
  return `${local.slice(0, 2)}…${local.slice(-1)}@${domain}`;
}
