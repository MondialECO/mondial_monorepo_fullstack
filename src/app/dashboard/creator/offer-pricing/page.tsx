"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Phase4Pricing } from "@/components/creator/phase4/Phase4Pricing";
import { Phase4Resource } from "@/components/creator/phase4/Phase4Resource";
import { Phase4Gtm } from "@/components/creator/phase4/Phase4Gtm";
import { Phase4Complete } from "@/components/creator/phase4/Phase4Complete";
import {
  creatorJourneyApi,
  type PricingTier,
  type TeamRequirement,
  type SaasItem,
  type ResourceCalculation,
  type GtmSetup,
} from "@/lib/api-creator-journey";

const STEPS = ["Services & Pricing", "Resource Calculator", "Web & GTM Setup", "Complete"];

// Typed view of journey.phase4Data (serialized camelCase; upstream type is Record<string, unknown>).
type SavedPhase4Data = {
  pricingModel?: string | null;
  tiers?: PricingTier[] | null;
  resourceCalculation?: (ResourceCalculation & { teamRequirements?: TeamRequirement[]; saasStack?: SaasItem[] }) | null;
  gtmSetup?: GtmSetup | null;
};

export default function OfferPricingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<SavedPhase4Data>({});
  const [hydrating, setHydrating] = useState(true);
  const [hydrateError, setHydrateError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Hydrate saved Phase-4 data + the backend-derived resume step BEFORE mounting any
  // step component — steps seed their state from `saved`, so rendering them with
  // defaults while real data exists is exactly the overwrite bug this prevents.
  useEffect(() => {
    let active = true;
    (async () => {
      setHydrating(true);
      setHydrateError(false);
      try {
        const { journey, computedStatus } = await creatorJourneyApi.get();
        if (!active) return;
        setSaved((journey.phase4Data ?? {}) as SavedPhase4Data);
        // Backend step is 1-based (1 pricing … 4 complete); the wizard is 0-based.
        const s = computedStatus?.phase4?.currentStep;
        setStep(typeof s === "number" ? Math.min(Math.max(s - 1, 0), 3) : 0);
      } catch {
        if (active) setHydrateError(true);
      } finally {
        if (active) setHydrating(false);
      }
    })();
    return () => { active = false; };
  }, [attempt]);

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
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
        {hydrating && (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading your saved plan…
          </div>
        )}

        {!hydrating && hydrateError && (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-destructive text-sm">Couldn&apos;t load your saved Phase-4 data. Continuing without it could overwrite your plan, so please retry.</p>
            <Button variant="outline" size="sm" onClick={() => setAttempt((a) => a + 1)}>Retry</Button>
          </div>
        )}

        {!hydrating && !hydrateError && (
          <>
            {step === 0 && (
              <Phase4Pricing
                initial={{ pricingModel: saved.pricingModel, tiers: saved.tiers }}
                onSaved={(phase4) => setSaved((phase4 ?? {}) as SavedPhase4Data)}
                onNext={() => setStep(1)}
              />
            )}
            {step === 1 && (
              <Phase4Resource
                initial={saved.resourceCalculation ?? null}
                onSaved={(calc) => setSaved((s) => ({ ...s, resourceCalculation: calc }))}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <Phase4Gtm
                initial={saved.gtmSetup ?? null}
                onSaved={(gtm) => setSaved((s) => ({ ...s, gtmSetup: gtm }))}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && <Phase4Complete onContinue={() => router.push("/dashboard/creator/crossroads")} />}
          </>
        )}
      </main>
    </div>
  );
}
