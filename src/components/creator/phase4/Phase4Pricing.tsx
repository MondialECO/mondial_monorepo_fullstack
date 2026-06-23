"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Plus, Trash2, Loader2, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { creatorJourneyApi, type PricingTier } from "@/lib/api-creator-journey";

const MODELS: { id: string; label: string }[] = [
  { id: "subscription", label: "Subscription" },
  { id: "one_time", label: "One-time" },
  { id: "freemium", label: "Freemium" },
  { id: "usage_based", label: "Usage-based" },
];

const blankTier = (name: string, price: number, highlighted = false): PricingTier => ({
  name, price, billingCycle: "monthly", features: ["", "", ""], isHighlighted: highlighted,
});

export function Phase4Pricing({ onNext }: { onNext: () => void }) {
  const [model, setModel] = useState("subscription");
  const [tiers, setTiers] = useState<PricingTier[]>([
    blankTier("Basic", 9), blankTier("Standard", 19, true), blankTier("Premium", 39),
  ]);
  const [insights, setInsights] = useState<{ competitors: string[]; sectorAveragePrice: number } | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { creatorJourneyApi.pricingInsights().then(setInsights).catch(() => {}); }, []);

  const setTier = (i: number, patch: Partial<PricingTier>) =>
    setTiers((t) => t.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setHighlighted = (i: number) =>
    setTiers((t) => t.map((x, j) => ({ ...x, isHighlighted: j === i })));
  const setFeature = (i: number, fi: number, v: string) =>
    setTiers((t) => t.map((x, j) => (j === i ? { ...x, features: x.features.map((f, k) => (k === fi ? v : f)) } : x)));

  const save = async () => {
    setSaving(true); setError(null); setSuggestion(null);
    try {
      const clean = tiers.map((t) => ({ ...t, features: t.features.filter((f) => f.trim()) }));
      const res = await creatorJourneyApi.setPricing(model, clean);
      setSuggestion(res.suggestion);
      onNext();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (e instanceof Error ? e.message : "Couldn't save pricing."));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Model cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MODELS.map((m) => (
          <button key={m.id} onClick={() => setModel(m.id)}
            className={`rounded-xl border-2 p-4 text-sm font-semibold ${model === m.id ? "border-primary bg-primary/5" : "border-border"}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((t, i) => (
          <Card key={i} className={`rounded-2xl border bg-card p-4 space-y-3 ${t.isHighlighted ? "border-primary" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <input value={t.name} onChange={(e) => setTier(i, { name: e.target.value })}
                className="font-bold text-sm bg-transparent outline-none w-full" />
              <button onClick={() => setHighlighted(i)} title="Most popular">
                <Star className={`h-4 w-4 ${t.isHighlighted ? "text-primary fill-primary" : "text-muted-foreground"}`} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">€</span>
              <input type="number" value={t.price} onChange={(e) => setTier(i, { price: Number(e.target.value) })}
                className="text-2xl font-extrabold bg-transparent outline-none w-full" />
            </div>
            <div className="space-y-1.5">
              {t.features.map((f, fi) => (
                <div key={fi} className="flex items-center gap-1.5">
                  <input value={f} onChange={(e) => setFeature(i, fi, e.target.value)} placeholder={`Feature ${fi + 1}`}
                    className="flex-1 text-xs rounded-lg border border-border bg-background px-2 py-1 outline-none focus:border-primary" />
                  {t.features.length > 3 && (
                    <button onClick={() => setTier(i, { features: t.features.filter((_, k) => k !== fi) })}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  )}
                </div>
              ))}
              <button onClick={() => setTier(i, { features: [...t.features, ""] })} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Feature</button>
            </div>
            {t.isHighlighted && <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>}
          </Card>
        ))}
      </div>

      {/* Insights */}
      {insights && (
        <Card className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Pricing insights</div>
          <p className="text-sm text-muted-foreground">Sector average entry price: <strong>€{insights.sectorAveragePrice}</strong></p>
          <div className="flex flex-wrap gap-2 mt-2">
            {insights.competitors.map((c) => <span key={c} className="rounded-full bg-muted px-3 py-1 text-xs">{c}</span>)}
          </div>
          {suggestion && <p className="text-xs text-warning mt-2">{suggestion}</p>}
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save &amp; continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
