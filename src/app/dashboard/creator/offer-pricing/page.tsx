"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Phase4Pricing } from "@/components/creator/phase4/Phase4Pricing";
import { Phase4Resource } from "@/components/creator/phase4/Phase4Resource";
import { Phase4Gtm } from "@/components/creator/phase4/Phase4Gtm";
import { Phase4Complete } from "@/components/creator/phase4/Phase4Complete";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import {
  creatorJourneyApi,
  type GtmSetup,
  type MarketBenchmark,
  type PricingTier,
  type ResourceCalculation,
  type SaasItem,
  type TeamRequirement,
} from "@/lib/api-creator-journey";

const STEPS = ["Services & Pricing", "Resource Calculator", "Web & GTM Setup", "Complete"];

const STEP_COPY = [
  {
    title: "Define Your Price",
    description: "Choose a pricing model and create tiered packages based on market benchmarks and AI analysis.",
  },
  {
    title: "Plan Your Resources",
    description: "Estimate the team and tools you need to bring your offer to market.",
  },
  {
    title: "Web & GTM Setup",
    description: "Build your web presence and choose the channels that will reach your audience.",
  },
  {
    title: "Offer Setup Complete",
    description: "Review your completed offer setup and continue to the next stage.",
  },
] as const;

// Typed view of journey.phase4Data (serialized camelCase; upstream type is Record<string, unknown>).
type SavedPhase4Data = {
  pricingModel?: string | null;
  tiers?: PricingTier[] | null;
  pricingForecastContext?: { isPotentiallyOutdated?: boolean } | null;
  resourceCalculation?: (ResourceCalculation & { teamRequirements?: TeamRequirement[]; saasStack?: SaasItem[] }) | null;
  gtmSetup?: GtmSetup | null;
};

function Phase4HydrationSkeleton() {
  return (
    <div className="max-w-7xl space-y-6" aria-label="Loading saved plan and reference estimates">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((card) => (
          <div key={card} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((card) => <Skeleton key={card} className="h-24 rounded-2xl" />)}
      </div>
    </div>
  );
}

export default function OfferPricingPage() {
  const router = useRouter();
  const { state: { activeIdeaId }, isLoading: progressLoading } = useCreatorProgress();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<SavedPhase4Data>({});
  const [benchmark, setBenchmark] = useState<MarketBenchmark | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [hydrateError, setHydrateError] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState(false);
  const [benchmarkNoticeDismissed, setBenchmarkNoticeDismissed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Hydrate before mounting a step so saved values can never be replaced by defaults.
  useEffect(() => {
    if (progressLoading) return;
    let active = true;
    (async () => {
      setHydrating(true);
      setHydrateError(false);
      setBenchmarkError(false);
      setBenchmarkNoticeDismissed(false);
      setBenchmark(null);
      try {
        const { journey, computedStatus } = await creatorJourneyApi.get(activeIdeaId);
        if (!active) return;

        let loadedBenchmark: MarketBenchmark | null = null;
        try {
          loadedBenchmark = await creatorJourneyApi.marketBenchmark(journey.project?.sector);
        } catch {
          if (active) setBenchmarkError(true);
        }
        if (!active) return;

        setSaved((journey.phase4Data ?? {}) as SavedPhase4Data);
        setBenchmark(loadedBenchmark);
        // Backend steps are 1-based; the local wizard is 0-based.
        const currentStep = computedStatus?.phase4?.currentStep;
        setStep(typeof currentStep === "number" ? Math.min(Math.max(currentStep - 1, 0), 3) : 0);
      } catch {
        if (active) setHydrateError(true);
      } finally {
        if (active) setHydrating(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeIdeaId, attempt, progressLoading]);

  return (
    <div className="min-h-[calc(100vh-68px)] bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <main className="mx-auto w-full max-w-7xl">
        <header className="space-y-2">
          <h1 className="font-heading text-[32px] font-semibold leading-10 tracking-[-0.02em] text-foreground">
            {STEP_COPY[step].title}
          </h1>
          <p className="text-base leading-6 text-muted-foreground">{STEP_COPY[step].description}</p>
        </header>

        <div className="mt-8 flex w-full max-w-[776px] items-center overflow-x-auto pb-1" aria-label="Offer setup progress">
          {STEPS.map((label, index) => {
            const active = index === step;
            return (
              <div key={label} className="contents">
                <div
                  className={`flex shrink-0 items-center gap-1 rounded-full border py-1 pl-1 pr-3 ${
                    active
                      ? "border-black/[0.06] bg-secondary text-primary"
                      : "border-black/[0.06] bg-muted text-muted-foreground"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[11px] font-medium leading-4 ${
                      active
                        ? "border border-[#a7b9f5] bg-primary text-primary-foreground"
                        : "bg-[#606060] text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="whitespace-nowrap text-xs font-medium leading-4">{label}</span>
                </div>
                {index < STEPS.length - 1 && <span className="h-px min-w-8 flex-1 bg-border" aria-hidden="true" />}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          {hydrating && (
            <Phase4HydrationSkeleton />
          )}

          {!hydrating && hydrateError && (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-sm text-destructive">
                Couldn&apos;t load your saved Phase-4 data. Continuing without it could overwrite your plan, so please retry.
              </p>
              <Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>
                Retry
              </Button>
            </div>
          )}

          {!hydrating && !hydrateError && (
            <>
              {benchmarkError && !benchmarkNoticeDismissed && (
                <div
                  role="status"
                  className="mb-5 flex max-w-5xl items-start justify-between gap-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">Couldn&apos;t load reference estimates.</p>
                    <p className="mt-0.5 text-muted-foreground">You can still enter your own numbers and save the form.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label="Dismiss reference estimate notice"
                    onClick={() => setBenchmarkNoticeDismissed(true)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
              {step === 0 && (
                <Phase4Pricing
                  ideaId={activeIdeaId}
                  initial={{
                    pricingModel: saved.pricingModel,
                    tiers: saved.tiers,
                    pricingForecastContext: saved.pricingForecastContext,
                  }}
                  currency={benchmark?.currency ?? "EUR"}
                  onSaved={(phase4) => setSaved((phase4 ?? {}) as SavedPhase4Data)}
                  onNext={() => setStep(1)}
                />
              )}
              {step === 1 && (
                <Phase4Resource
                  ideaId={activeIdeaId}
                  initial={saved.resourceCalculation ?? null}
                  benchmark={benchmark}
                  onSaved={(calculation) => setSaved((current) => ({ ...current, resourceCalculation: calculation }))}
                  onNext={() => setStep(2)}
                  onBack={() => setStep(0)}
                />
              )}
              {step === 2 && (
                <Phase4Gtm
                  ideaId={activeIdeaId}
                  initial={saved.gtmSetup ?? null}
                  benchmark={benchmark}
                  onSaved={(gtm) => setSaved((current) => ({ ...current, gtmSetup: gtm }))}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <Phase4Complete
                  ideaId={activeIdeaId}
                  onContinue={() => router.push("/dashboard/creator/crossroads")}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
