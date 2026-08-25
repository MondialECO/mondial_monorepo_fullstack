"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creatorJourneyApi, type PricingInsights, type PricingTier } from "@/lib/api-creator-journey";

const ASSET_ROOT = "/figma/offer-pricing";

const MODELS = [
  {
    id: "subscription",
    label: "Subscription",
    description: "Recurring monthly or annual payments for access.",
    iconSrc: `${ASSET_ROOT}/calendar.svg`,
  },
  {
    id: "one_time",
    label: "On-Time",
    description: "A single upfront payment for lifetime or fixed access.",
    iconSrc: `${ASSET_ROOT}/clock.svg`,
  },
  {
    id: "freemium",
    label: "Freemium",
    description: "Free basic features with paid upgrades available.",
    iconSrc: `${ASSET_ROOT}/gift.svg`,
  },
  {
    id: "usage_based",
    label: "Usage-Based",
    description: "Pay based on metered consumption of resources.",
    iconSrc: `${ASSET_ROOT}/graph.svg`,
  },
] as const;

const tierTemplate = (
  name: string,
  price: number,
  features: string[],
  isHighlighted = false,
): PricingTier => ({
  id: Math.random().toString(36).slice(2, 11),
  name,
  price,
  billingCycle: "monthly",
  features,
  isHighlighted,
});

const createDefaultTiers = (): PricingTier[] => [
  tierTemplate("Package 1", 0, ["", "", ""]),
  tierTemplate("Package 2", 0, ["", "", ""], true),
  tierTemplate("Package 3", 0, ["", "", ""]),
];

export function Phase4Pricing({
  ideaId,
  initial,
  currency = "EUR",
  onSaved,
  onNext,
}: {
  ideaId: string | null;
  initial?: {
    pricingModel?: string | null;
    tiers?: PricingTier[] | null;
    pricingForecastContext?: { isPotentiallyOutdated?: boolean } | null;
  };
  currency?: string;
  onSaved?: (phase4: unknown) => void;
  onNext: () => void;
}) {
  // Saved values always win; templates are only used for a genuinely empty Phase-4 record.
  const [model, setModel] = useState(initial?.pricingModel || "subscription");
  const [tiers, setTiers] = useState<PricingTier[]>(() =>
    initial?.tiers?.length ? initial.tiers : createDefaultTiers(),
  );
  const [insights, setInsights] = useState<PricingInsights | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsAttempt, setInsightsAttempt] = useState(0);
  const [forecastOutdated, setForecastOutdated] = useState(Boolean(initial?.pricingForecastContext?.isPotentiallyOutdated));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setInsights(null);
    setInsightsError(null);
    creatorJourneyApi.pricingInsights(ideaId)
      .then((value) => { if (active) setInsights(value); })
      .catch((caught) => {
        if (!active) return;
        const message = (caught as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setInsightsError(message ?? "Couldn't load pricing context.");
      });
    return () => { active = false; };
  }, [ideaId, insightsAttempt]);

  const setTier = (index: number, patch: Partial<PricingTier>) =>
    setTiers((current) => current.map((tier, tierIndex) => (tierIndex === index ? { ...tier, ...patch } : tier)));

  const setHighlighted = (index: number) =>
    setTiers((current) => current.map((tier, tierIndex) => ({ ...tier, isHighlighted: tierIndex === index })));

  const setFeature = (tierIndex: number, featureIndex: number, value: string) =>
    setTiers((current) =>
      current.map((tier, index) =>
        index === tierIndex
          ? { ...tier, features: tier.features.map((feature, itemIndex) => (itemIndex === featureIndex ? value : feature)) }
          : tier,
      ),
    );

  const save = async () => {
    setSaving(true);
    setError(null);
    setForecastOutdated(false);
    try {
      const clean = tiers.map((tier) => ({ ...tier, features: tier.features.filter((feature) => feature.trim()) }));
      const response = await creatorJourneyApi.setPricing(model, clean, ideaId);
      setForecastOutdated(response.forecastPricingOutdated);
      onSaved?.(response.phase4);
      onNext();
    } catch (caught) {
      const message = (caught as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? (caught instanceof Error ? caught.message : "Couldn't save pricing."));
    } finally {
      setSaving(false);
    }
  };

  const applyForecastAssumption = () => {
    const price = insights?.forecastContext?.arpu;
    if (price == null) return;
    setTier(0, { price });
  };

  return (
    <div>
      <section aria-labelledby="pricing-model-heading">
        <h2 id="pricing-model-heading" className="font-heading text-lg font-medium leading-6 text-foreground">
          Select Pricing Model
        </h2>
        <div className="mt-[18px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
          {MODELS.map((pricingModel) => {
            const selected = model === pricingModel.id;
            return (
              <button
                key={pricingModel.id}
                type="button"
                onClick={() => setModel(pricingModel.id)}
                className="flex h-[140px] flex-col items-start gap-4 rounded-xl border border-[var(--card-edge)] bg-card p-5 text-left transition-colors hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-pressed={selected}
              >
                <div className="flex w-full flex-1 items-start justify-between">
                  <Image src={pricingModel.iconSrc} alt="" width={20} height={20} className="size-5" />
                  {selected && <Image src={`${ASSET_ROOT}/selected.svg`} alt="" width={16} height={16} className="size-4" />}
                </div>
                <div className="space-y-2">
                  <h3 className="font-heading text-lg font-semibold leading-6 text-foreground">{pricingModel.label}</h3>
                  <p className="text-xs leading-4 text-muted-foreground">{pricingModel.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="package-builder-heading">
        <h2 id="package-builder-heading" className="font-heading text-lg font-medium leading-6 text-foreground">
          Package Builder
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {tiers.map((tier, tierIndex) => (
            <article
              key={tier.id || tierIndex}
              className={`relative flex min-h-[532px] flex-col rounded-3xl border-2 bg-card px-5 py-6 shadow-[-2px_-1px_8.5px_rgba(0,0,0,0.02),1px_2px_1.5px_rgba(0,0,0,0.04)] ${
                tier.isHighlighted ? "border-primary/50" : "border-[var(--card-edge)]"
              }`}
            >
              {tier.isHighlighted && (
                <span className="absolute right-2 top-2.5 rounded-full bg-primary px-2.5 py-1.5 text-xs font-medium leading-4 text-primary-foreground">
                  Most Popular
                </span>
              )}

              <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-col gap-6">
                  <input
                    value={tier.name}
                    onChange={(event) => setTier(tierIndex, { name: event.target.value })}
                    aria-label={`Package ${tierIndex + 1} name`}
                    className="w-[calc(100%_-_104px)] bg-transparent font-heading text-xl font-medium leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <div className="flex items-end border-b border-border pb-8">
                    <span className="font-heading text-5xl font-semibold leading-[52px] text-foreground">{currency === "EUR" ? "€" : currency}</span>
                    <input
                      type="number"
                      min="0"
                      value={tier.price}
                      onChange={(event) => setTier(tierIndex, { price: Number(event.target.value) })}
                      aria-label={`${tier.name} price`}
                      className="w-[78px] appearance-none bg-transparent font-heading text-5xl font-semibold leading-[52px] text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="ml-2 font-heading text-5xl font-semibold leading-[52px] text-foreground">/mo</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="group flex min-h-5 items-center gap-[14px]">
                      <Image
                        src={`${ASSET_ROOT}/feature-check.svg`}
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 shrink-0"
                      />
                      <input
                        value={feature}
                        onChange={(event) => setFeature(tierIndex, featureIndex, event.target.value)}
                        placeholder={`Feature ${featureIndex + 1}`}
                        aria-label={`${tier.name} feature ${featureIndex + 1}`}
                        className="min-w-0 flex-1 bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
                      />
                      {tier.features.length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setTier(tierIndex, { features: tier.features.filter((_, index) => index !== featureIndex) })
                          }
                          className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                          aria-label={`Remove ${tier.name} feature ${featureIndex + 1}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTier(tierIndex, { features: [...tier.features, ""] })}
                    className="inline-flex items-center gap-[14px] text-sm leading-5 text-primary hover:text-primary/80"
                  >
                    <Image src={`${ASSET_ROOT}/add.svg`} alt="" width={16} height={16} className="size-4" />
                    Feature
                  </button>
                </div>
              </div>

              <Button
                type="button"
                variant={tier.isHighlighted ? "default" : "outline"}
                onClick={() => setHighlighted(tierIndex)}
                className={`mt-12 h-12 w-full rounded-full font-heading text-base font-medium leading-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] ${
                  tier.isHighlighted
                    ? "bg-primary text-primary-foreground"
                    : "border-border bg-[var(--bg-light)] text-muted-foreground hover:bg-secondary"
                }`}
              >
                Get Started
              </Button>
            </article>
          ))}
        </div>
      </section>

      {insightsError && (
        <section className="mt-8 rounded-[20px] border border-warning/40 bg-warning/10 p-6" role="status">
          <p className="text-sm font-medium text-foreground">Couldn&apos;t load pricing context.</p>
          <p className="mt-1 text-xs text-muted-foreground">You can still set your own prices. No market data has been substituted.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setInsightsAttempt((value) => value + 1)}>Retry</Button>
        </section>
      )}

      {insights && (
        <section
          className="mt-8 rounded-[20px] border border-[var(--card-edge)] bg-card p-6"
          aria-labelledby="pricing-insights-heading"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-secondary">
              <Image src={`${ASSET_ROOT}/chart.svg`} alt="" width={20} height={20} className="size-5" />
            </span>
            <h2 id="pricing-insights-heading" className="font-heading text-lg font-medium leading-6 text-[#4855ea]">
              Pricing Insights
            </h2>
          </div>
          <div className="mt-4">
            {insights.selectedEntryPrice != null && <p className="text-sm text-foreground">Your selected entry price: <strong>{currency === "EUR" ? "€" : `${currency} `}{insights.selectedEntryPrice}</strong></p>}
            {insights.forecastContext && (
              <div className="mt-3 rounded-xl bg-secondary p-3 text-sm">
                <p className="font-medium text-foreground">Forecast context: {currency === "EUR" ? "€" : `${currency} `}{insights.forecastContext.arpu}/month ARPU</p>
                <p className="mt-1 text-xs text-muted-foreground">This is the assumption used by your current forecast, not a selected price.</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={applyForecastAssumption}>Apply to Package 1</Button>
              </div>
            )}
            {insights.recommendation && <p className="mt-3 text-xs leading-4 text-muted-foreground"><strong>Planning recommendation:</strong> {insights.recommendation.message}</p>}
            <div className="mt-3 rounded-xl border border-border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Competitor pricing data unavailable</p>
              <p className="mt-1">{insights.competitorPricing.message}</p>
              <p className="mt-2">{insights.marketBenchmark.message}</p>
            </div>
            {forecastOutdated && <p className="mt-3 text-xs leading-4 text-warning">Your selected entry price differs from your forecast ARPU. Update Forecast when you&apos;re ready; your existing forecast has not been changed.</p>}
          </div>
        </section>
      )}

      {error && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-end border-t border-border pt-4">
        <Button onClick={save} disabled={saving} className="h-11 min-w-[199px] gap-2 rounded-md px-5 text-[13px]">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save &amp; continue
          {!saving && <Image src={`${ASSET_ROOT}/arrow-right.svg`} alt="" width={16} height={16} className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
