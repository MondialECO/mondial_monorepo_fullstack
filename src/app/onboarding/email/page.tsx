"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { Button } from "@/components/ui/button";

export default function OnboardingEmailPage() {
  const router = useRouter();
  const { refresh, status } = useOnboarding();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError(null);
    setBusy(true);
    try {
      await api.post("/onboarding/send-email-otp");
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
      // Redirect to hub, NOT to completion
      // Hub will show "Complete" button for manual promotion
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Invalid code.");
    } finally {
      setBusy(false);
    }
  }


  useEffect(() => {
    // Auto-trigger the send on first arrival
    if (status?.email) void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.email]);

  const maskedEmail = status?.email ? maskEmail(status.email) : "your email";

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-lg p-6 w-full max-w-[400px] space-y-6">
          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">Email Verification</h1>
            <p className="text-base text-muted-foreground">
              Your information is encrypted and secured by VeriSure, our trusted security partner.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Code Input Form */}
          <form onSubmit={verifyCode} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="email-code" className="text-sm font-medium text-foreground">
                Verification Code
              </label>
              <input
                id="email-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground text-center text-2xl tracking-widest font-mono outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sent to {maskedEmail}.{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={sendCode}
                  disabled={busy}
                >
                  Resend code
                </button>
              </p>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>
        </div>
      </div>
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return email;
  return `${local.slice(0, 2)}…${local.slice(-1)}@${domain}`;
}
