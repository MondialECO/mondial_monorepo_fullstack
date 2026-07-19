"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, ChevronDown } from "lucide-react";
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
  const [countryCode, setCountryCode] = useState("+1");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/onboarding/send-otp", { phone: countryCode + phone });
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
      router.push("/onboarding/email");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Invalid code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setBusy(true);
    try {
      await api.post("/onboarding/phone/skip");
      await refresh();
      router.push("/onboarding/email");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to skip. Please try again.");
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-lg p-6 w-full max-w-[400px] space-y-6">
          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">Phone Verification</h1>
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

          {stage === "enter-phone" ? (
            <form onSubmit={sendCode} className="space-y-6">
              {/* Country and Phone Input */}
              <div className="flex gap-2">
                {/* Country Selector */}
                <div className="flex flex-col gap-2 w-28">
                  <label className="text-sm font-medium text-foreground">Country</label>
                  <div className="relative">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground text-sm appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+880">🇧🇩 +880</option>
                      <option value="+91">🇮🇳 +91</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Phone Input */}
                <div className="flex flex-col gap-2 flex-1">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="446-1676"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>
              </div>

              {/* Send and Skip Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={busy}
                  className="flex-1"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Skipping...
                    </>
                  ) : (
                    "Skip"
                  )}
                </Button>
                <Button
                  type="submit"
                  disabled={busy || !phone}
                  className="flex-1"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Code"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-6">
              {/* Code Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="code" className="text-sm font-medium text-foreground">
                  Verification Code
                </label>
                <input
                  id="code"
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
                  Sent to {countryCode} {phone}.{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setStage("enter-phone")}
                  >
                    Use a different number
                  </button>
                </p>
              </div>

              {/* Verify and Skip Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={busy}
                  className="flex-1"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Skipping...
                    </>
                  ) : (
                    "Skip for now"
                  )}
                </Button>
                <Button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="flex-1"
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
              </div>
            </form>
          )}

        </div>
      </div>
  );
}
