"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Phase4Pricing } from "@/components/creator/phase4/Phase4Pricing";
import { Phase4Resource } from "@/components/creator/phase4/Phase4Resource";
import { Phase4Gtm } from "@/components/creator/phase4/Phase4Gtm";
import { Phase4Complete } from "@/components/creator/phase4/Phase4Complete";

const STEPS = ["Services & Pricing", "Resource Calculator", "Web & GTM Setup", "Complete"];

export default function OfferPricingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <h1 className="text-sm font-bold">Phase 4 — Offer &amp; Resource Setup</h1>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}
        </div>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-2 px-6 py-4 max-w-5xl mx-auto w-full overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
            <span className={`text-xs font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      <main className="max-w-5xl mx-auto w-full p-6">
        {step === 0 && <Phase4Pricing onNext={() => setStep(1)} />}
        {step === 1 && <Phase4Resource onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <Phase4Gtm onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Phase4Complete onContinue={() => router.push("/dashboard/creator/crossroads")} />}
      </main>
    </div>
  );
}
