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
import { Phase4ProfileGuard } from "@/components/creator/phase4/Phase4ProfileGuard";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { PageContainer } from "@/components/layout/PageContainer";
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
    description: "Choose a pricing model and create tiered packages based on sector benchmarks and your venture inputs.",
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

function OfferPricingContent() {
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
    <PageContainer variant="standard">
      <header className="space-y-2">
          <h1 className="font-heading text-page-heading font-semibold leading-10 tracking-[-0.02em] text-foreground">
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
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium">{label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="mx-2 h-px w-6 shrink-0 bg-border" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          {hydrating ? (
            <Phase4HydrationSkeleton />
          ) : hydrateError ? (
            <div
              role="alert"
              className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive"
            >
              <div className="text-sm font-medium">
                Could not load your saved offer plan. Retry to reload without losing progress.
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setAttempt((count) => count + 1)}
              >
                Retry
              </Button>
            </div>
          ) : (
            <>
              {benchmarkError && !benchmarkNoticeDismissed && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-6 flex items-center justify-between rounded-2xl border border-warning/30 bg-warning/5 p-4 text-warning"
                >
                  <div className="text-sm font-medium">
                    Sector pricing benchmarks could not be loaded. You can still define your pricing manually.
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-warning hover:bg-warning/10"
                    onClick={() => setBenchmarkNoticeDismissed(true)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Dismiss benchmark warning</span>
                  </Button>
                </div>
              )}

              {step === 0 && (
                <Phase4Pricing
                  ideaId={activeIdeaId}
                  initial={{
                    pricingModel: saved.pricingModel ?? null,
                    tiers: saved.tiers ?? null,
                    pricingForecastContext: saved.pricingForecastContext ?? null,
                  }}
                  onSaved={(phase4: any) =>
                    setSaved((current) => ({
                      ...current,
                      pricingModel: phase4?.pricingModel ?? current.pricingModel,
                      tiers: phase4?.tiers ?? current.tiers,
                    }))
                  }
                  onNext={() => setStep(1)}
                />
              )}
              {step === 1 && (
                <Phase4Resource
                  ideaId={activeIdeaId}
                  initial={saved.resourceCalculation ?? null}
                  benchmark={benchmark}
                  onSaved={(calc) => setSaved((current) => ({ ...current, resourceCalculation: calc }))}
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
    </PageContainer>
  );
}

export default function OfferPricingPage() {
  return (
    <Phase4ProfileGuard>
      <OfferPricingContent />
    </Phase4ProfileGuard>
  );
}
