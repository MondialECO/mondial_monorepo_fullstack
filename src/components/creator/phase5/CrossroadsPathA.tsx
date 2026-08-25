"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Loader2, Store, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { creatorJourneyApi, type IpValuation } from "@/lib/api-creator-journey";

type ListingState = { askingPrice?: number | null; publishedAt?: string | null; saleType?: string | null };
type PathAState = { ipValuation?: IpValuation | null; marketplaceListing?: ListingState | null };

export function CrossroadsPathA({ ideaId, initial, onChanged }: {
  ideaId: string | null;
  initial?: Record<string, unknown>;
  onChanged: () => void;
}) {
  const saved = initial as PathAState | undefined;
  const [valuation, setValuation] = useState<IpValuation | null>(saved?.ipValuation ?? null);
  const [valuing, setValuing] = useState(false);
  const [valError, setValError] = useState<string | null>(null);
  const [askingPrice, setAskingPrice] = useState<number>(saved?.marketplaceListing?.askingPrice ?? 0);
  const [nda, setNda] = useState(true);
  const [audience, setAudience] = useState("public");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(Boolean(saved?.marketplaceListing?.publishedAt));
  const [isEmpty, setIsEmpty] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);
  const [hydratedIdeaId, setHydratedIdeaId] = useState<string | null>(null);

  useEffect(() => {
    if (ideaId && hydratedIdeaId !== ideaId) {
      if (initial) {
        const s = initial as PathAState;
        if (s.marketplaceListing?.askingPrice != null) {
          setAskingPrice(s.marketplaceListing.askingPrice);
        }
        if (s.ipValuation != null) {
          setValuation(s.ipValuation);
        }
        if (s.marketplaceListing?.publishedAt != null) {
          setPublished(Boolean(s.marketplaceListing.publishedAt));
        }
        setHydratedIdeaId(ideaId);
      } else {
        setAskingPrice(0);
        setValuation(null);
        setPublished(false);
      }
    }
  }, [initial, ideaId, hydratedIdeaId]);

  const runValuation = async () => {
    setValuing(true); setValError(null);
    try {
      setValuation(await creatorJourneyApi.ipValuation(ideaId));
      onChanged();
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      setValError(err.response?.status === 429 ? "Daily valuation limit reached (10/day)." : (err.response?.data?.message ?? "Couldn't compute the planning estimate."));
    } finally { setValuing(false); }
  };

  const publish = async () => {
    setPublishing(true); setPubError(null);
    try {
      const res = await creatorJourneyApi.publishMarketplace({ ndaRequired: nda, askingPrice, audience }, ideaId);
      setPublished(true);
      setIsEmpty(res.isEmpty);
      onChanged();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setPubError(err.response?.data?.message ?? (e instanceof Error ? e.message : "Couldn't publish the Full Buyout listing."));
    } finally { setPublishing(false); }
  };

  const fmt = (n: number) => `€${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> Planning Valuation Estimate</div>
          <Button variant="outline" size="sm" onClick={runValuation} disabled={valuing}>{valuing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh estimate"}</Button>
        </div>
        <p className="text-xs text-muted-foreground">Based on saved resource investment and project-readiness signals. This is not a certified business or IP valuation.</p>
        {valError && <p className="text-sm text-destructive">{valError}</p>}
        {valuation && (
          <div className="space-y-2">
            <div className="flex items-end gap-2"><div className="text-2xl font-extrabold">{fmt(valuation.estimatedMin)}–{fmt(valuation.estimatedMax)}</div><Badge variant="outline" className="capitalize">{valuation.confidence} confidence</Badge></div>
            {valuation.marketOpportunityContext != null && <p className="text-xs text-muted-foreground">Target market opportunity: {fmt(valuation.marketOpportunityContext)}. This is context only, not the valuation calculation.</p>}
          </div>
        )}
      </Card>

      <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="text-sm font-bold flex items-center gap-1.5"><Store className="h-4 w-4 text-primary" /> Full Buyout Listing</div>
        <p className="text-xs text-muted-foreground">Your asking price is your decision and stays separate from the planning estimate.</p>
        <label className="block text-sm"><span className="text-muted-foreground">Your asking price (€)</span><input aria-label="Your asking price" type="number" min="1" value={askingPrice || ""} onChange={(e) => setAskingPrice(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} /> NDA required</label>
        <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Audience:</span>{["public", "matched", "private"].map((value) => <button key={value} onClick={() => setAudience(value)} className={`rounded-lg border px-3 py-1 text-xs capitalize ${audience === value ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{value}</button>)}</div>
        {pubError && <p className="text-sm text-destructive">{pubError}</p>}
        {published ? <div className="space-y-1"><div className="flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> Full Buyout listing is live.</div>{isEmpty && <p className="text-xs text-muted-foreground">No buyer matches yet. Your listing is ready; matching results will appear when compatible buyers are available.</p>}</div> : <Button onClick={publish} disabled={publishing || askingPrice <= 0} className="gap-2">{publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish Full Buyout Listing</Button>}
      </Card>
    </div>
  );
}
