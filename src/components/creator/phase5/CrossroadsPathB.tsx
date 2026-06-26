"use client";

import { useState } from "react";
import { Building2, Coins, Loader2, Check, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { creatorJourneyApi, type OwnershipEntry, type UseOfFunds } from "@/lib/api-creator-journey";

const TYPES = ["SAS", "SAS-U", "SARL"];

export function CrossroadsPathB({ onChanged }: { onChanged: () => void }) {
  const [type, setType] = useState("SAS");
  const [ownership, setOwnership] = useState<OwnershipEntry[]>([
    { holder: "Founder", percent: 80, isFounder: true, isEsop: false },
    { holder: "ESOP pool", percent: 10, isFounder: false, isEsop: true },
    { holder: "Co-founder", percent: 10, isFounder: false, isEsop: false },
  ]);
  const [formSaved, setFormSaved] = useState(false);
  const [formWarn, setFormWarn] = useState<string[]>([]);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  const [totalAsk, setTotalAsk] = useState(150000);
  const [use, setUse] = useState<UseOfFunds[]>([
    { category: "Product", percent: 50 }, { category: "Marketing", percent: 30 }, { category: "Operations", percent: 20 },
  ]);
  const [investorTypes] = useState<string[]>(["Angel", "Pre-seed VC"]);
  const [seedSaved, setSeedSaved] = useState<{ companyId: string | null; matchedInvestorCount: number } | null>(null);
  const [seedErr, setSeedErr] = useState<string | null>(null);
  const [savingSeed, setSavingSeed] = useState(false);

  const ownSum = ownership.reduce((s, o) => s + (o.percent || 0), 0);
  const founderSum = ownership.filter((o) => o.isFounder).reduce((s, o) => s + o.percent, 0);
  const useSum = use.reduce((s, u) => s + (u.percent || 0), 0);

  const saveFormation = async () => {
    setSavingForm(true); setFormErr(null);
    try {
      const res = await creatorJourneyApi.companyFormation({ selectedType: type, ownership });
      setFormWarn(res.warnings); setFormSaved(true); onChanged();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormErr(err.response?.data?.message ?? (e instanceof Error ? e.message : "Couldn't save formation."));
    } finally { setSavingForm(false); }
  };

  const saveSeed = async () => {
    setSavingSeed(true); setSeedErr(null);
    try {
      const res = await creatorJourneyApi.seedFunding({ totalAsk, useOfFunds: use, investorTypesTargeted: investorTypes });
      setSeedSaved({ companyId: res.companyId, matchedInvestorCount: res.matchedInvestorCount }); onChanged();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setSeedErr(err.response?.data?.message ?? (e instanceof Error ? e.message : "Couldn't save seed funding."));
    } finally { setSavingSeed(false); }
  };

  return (
    <div className="space-y-4">
      {/* Formation */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="text-sm font-bold flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> Company Formation</div>
        <div className="flex gap-2">
          {TYPES.map((t) => <button key={t} onClick={() => setType(t)} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${type === t ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{t}</button>)}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Cap table</span>
            <span className={ownSum === 100 ? "text-primary" : "text-destructive"}>{ownSum}% · founder {founderSum}%</span>
          </div>
          {ownership.map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
              <input value={o.holder} onChange={(e) => setOwnership((x) => x.map((y, j) => j === i ? { ...y, holder: e.target.value } : y))} className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" />
              <input type="number" value={o.percent} onChange={(e) => setOwnership((x) => x.map((y, j) => j === i ? { ...y, percent: Number(e.target.value) } : y))} className="w-16 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" />
              <label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked={o.isFounder} onChange={(e) => setOwnership((x) => x.map((y, j) => j === i ? { ...y, isFounder: e.target.checked } : y))} /> founder</label>
              <label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked={o.isEsop} onChange={(e) => setOwnership((x) => x.map((y, j) => j === i ? { ...y, isEsop: e.target.checked } : y))} /> esop</label>
              <button onClick={() => setOwnership((x) => x.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
          ))}
          <button onClick={() => setOwnership((x) => [...x, { holder: "", percent: 0, isFounder: false, isEsop: false }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add holder</button>
        </div>
        {formWarn.includes("esop_recommended") && <p className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> An ESOP pool of ≥10% is recommended for hiring.</p>}
        {formErr && <p className="text-sm text-destructive">{formErr}</p>}
        {formSaved ? <div className="flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> Formation saved.</div>
          : <Button onClick={saveFormation} disabled={savingForm} className="gap-2">{savingForm ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save formation</Button>}
      </Card>

      {/* Seed funding */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="text-sm font-bold flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" /> Seed Funding</div>
        <label className="text-sm space-y-1 block">
          <span className="text-muted-foreground">Total ask (€)</span>
          <input type="number" value={totalAsk} onChange={(e) => setTotalAsk(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Use of funds</span><span className={useSum === 100 ? "text-primary" : "text-destructive"}>{useSum}%</span></div>
          {use.map((u, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <input value={u.category} onChange={(e) => setUse((x) => x.map((y, j) => j === i ? { ...y, category: e.target.value } : y))} className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" />
              <input type="number" value={u.percent} onChange={(e) => setUse((x) => x.map((y, j) => j === i ? { ...y, percent: Number(e.target.value) } : y))} className="w-16 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" />
            </div>
          ))}
        </div>
        {seedErr && <p className="text-sm text-destructive">{seedErr}</p>}
        {seedSaved ? (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-primary"><Check className="h-4 w-4" /> Seed round saved{seedSaved.companyId ? " · company created" : ""}.</div>
            <p className="text-xs text-muted-foreground">{seedSaved.matchedInvestorCount > 0 ? `${seedSaved.matchedInvestorCount} potential investors matched.` : "No investors matched yet — full matchmaking unlocks in Phase 6."}</p>
          </div>
        ) : (
          <Button onClick={saveSeed} disabled={savingSeed} className="gap-2">{savingSeed ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save &amp; create company</Button>
        )}
      </Card>
    </div>
  );
}
