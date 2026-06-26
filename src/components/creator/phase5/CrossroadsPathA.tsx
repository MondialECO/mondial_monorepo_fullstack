"use client";

import { useState } from "react";
import { TrendingUp, Loader2, Store, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { creatorJourneyApi, type IpValuation } from "@/lib/api-creator-journey";

export function CrossroadsPathA({ onChanged }: { onChanged: () => void }) {
  const [valuation, setValuation] = useState<IpValuation | null>(null);
  const [valuing, setValuing] = useState(false);
  const [valError, setValError] = useState<string | null>(null);

  const [nda, setNda] = useState(true);
  const [purchase, setPurchase] = useState(true);
  const [license, setLicense] = useState(true);
  const [audience, setAudience] = useState("public");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ matchingStubbed: boolean } | null>(null);
  const [pubError, setPubError] = useState<string | null>(null);

  const runValuation = async () => {
    setValuing(true); setValError(null);
    try { setValuation(await creatorJourneyApi.ipValuation()); }
    catch (e) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      setValError(err.response?.status === 429 ? "Daily valuation limit reached (10/day)." : (err.response?.data?.message ?? "Couldn't compute valuation."));
    } finally { setValuing(false); }
  };

  const publish = async () => {
    setPublishing(true); setPubError(null);
    try {
      const res = await creatorJourneyApi.publishMarketplace({ ndaRequired: nda, openToPurchase: purchase, openToLicense: license, audience });
      setPublished({ matchingStubbed: res.matchingStubbed });
      onChanged();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setPubError(err.response?.data?.message ?? (e instanceof Error ? e.message : "Couldn't publish."));
    } finally { setPublishing(false); }
  };

  const fmt = (n: number) => `€${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-4">
      {/* IP valuation */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> IP Valuation</div>
          <Button variant="outline" size="sm" onClick={runValuation} disabled={valuing}>{valuing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Estimate"}</Button>
        </div>
        {valError && <p className="text-sm text-destructive">{valError}</p>}
        {valuation && (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="text-2xl font-extrabold">{fmt(valuation.estimatedMin)}–{fmt(valuation.estimatedMax)}</div>
              <Badge variant="outline" className="capitalize">{valuation.confidence} confidence</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {([
                ["Clarity", valuation.breakdown.conceptClarity], ["Market", valuation.breakdown.marketPotential],
                ["Feasibility", valuation.breakdown.techFeasibility], ["Founder", valuation.breakdown.founderCredibility],
                ["Plan", valuation.breakdown.businessPlanQuality],
              ] as const).map(([label, v]) => (
                <div key={label} className="rounded-lg border border-border p-2 text-center"><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm font-bold">{v}</div></div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Marketplace listing */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="text-sm font-bold flex items-center gap-1.5"><Store className="h-4 w-4 text-primary" /> Marketplace Listing</div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} /> NDA required</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={purchase} onChange={(e) => setPurchase(e.target.checked)} /> Open to purchase</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={license} onChange={(e) => setLicense(e.target.checked)} /> Open to license</label>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Audience:</span>
          {["public", "matched", "private"].map((a) => (
            <button key={a} onClick={() => setAudience(a)} className={`rounded-lg border px-3 py-1 text-xs capitalize ${audience === a ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{a}</button>
          ))}
        </div>
        {pubError && <p className="text-sm text-destructive">{pubError}</p>}
        {published ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> Listing is live.</div>
            {published.matchingStubbed && <p className="text-xs text-muted-foreground">Buyer matching is coming soon — your listing is visible to matched buyers once the pool is live.</p>}
          </div>
        ) : (
          <Button onClick={publish} disabled={publishing} className="gap-2">{publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish listing</Button>
        )}
      </Card>
    </div>
  );
}
