"use client";

import { useState } from "react";
import { Building2, Coins, Loader2, Check, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { creatorJourneyApi, type OwnershipEntry, type UseOfFunds } from "@/lib/api-creator-journey";

const TYPES = ["SAS", "SAS-U", "SARL"];
const INVESTOR_TYPES = ["Angel", "Pre-seed fund", "Seed fund", "Strategic investor"];
type BuildState = { companyFormation?: { selectedType?: string; ownership?: OwnershipEntry[] } | null; seedFunding?: { totalAsk?: number; useOfFunds?: UseOfFunds[]; investorTypesTargeted?: string[] } | null };
type FormationContext = { selectedType?: string; youNeed?: Array<{ skill?: string }>; cofounderDraft?: { roleNeeded?: string; equityRange?: string; locationPreference?: string } | null };

export function CrossroadsPathB({ ideaId, initial, formationContext, onChanged }: {
  ideaId: string | null;
  initial?: Record<string, unknown>;
  formationContext?: Record<string, unknown>;
  onChanged: () => void;
}) {
  const saved = initial as BuildState | undefined;
  const formation = formationContext as FormationContext | undefined;
  const [type, setType] = useState(saved?.companyFormation?.selectedType ?? formation?.selectedType ?? "");
  const [ownership, setOwnership] = useState<OwnershipEntry[]>(saved?.companyFormation?.ownership?.length ? saved.companyFormation.ownership : [{ holder: "", percent: 0, isFounder: true, isEsop: false }]);
  const [formSaved, setFormSaved] = useState(Boolean(saved?.companyFormation));
  const [formWarn, setFormWarn] = useState<string[]>([]);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [totalAsk, setTotalAsk] = useState(saved?.seedFunding?.totalAsk ?? 0);
  const [use, setUse] = useState<UseOfFunds[]>(saved?.seedFunding?.useOfFunds ?? []);
  const [investorTypes, setInvestorTypes] = useState<string[]>(saved?.seedFunding?.investorTypesTargeted ?? []);
  const [seedSaved, setSeedSaved] = useState(Boolean(saved?.seedFunding));
  const [seedErr, setSeedErr] = useState<string | null>(null);
  const [savingSeed, setSavingSeed] = useState(false);

  const ownSum = ownership.reduce((sum, entry) => sum + (entry.percent || 0), 0);
  const founderSum = ownership.filter((entry) => entry.isFounder).reduce((sum, entry) => sum + entry.percent, 0);
  const useSum = use.reduce((sum, entry) => sum + (entry.percent || 0), 0);
  const toggleInvestor = (value: string) => setInvestorTypes((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const saveFormation = async () => {
    setSavingForm(true); setFormErr(null);
    try { const res = await creatorJourneyApi.companyFormation({ selectedType: type, ownership }, ideaId); setFormWarn(res.warnings); setFormSaved(true); onChanged(); }
    catch (e) { const err = e as { response?: { data?: { message?: string } } }; setFormErr(err.response?.data?.message ?? (e instanceof Error ? e.message : "Couldn't save company planning.")); }
    finally { setSavingForm(false); }
  };
  const saveSeed = async () => {
    setSavingSeed(true); setSeedErr(null);
    try { await creatorJourneyApi.seedFunding({ totalAsk, useOfFunds: use, investorTypesTargeted: investorTypes }, ideaId); setSeedSaved(true); onChanged(); }
    catch (e) { const err = e as { response?: { data?: { message?: string } } }; setSeedErr(err.response?.data?.message ?? (e instanceof Error ? e.message : "Couldn't save funding preparation.")); }
    finally { setSavingSeed(false); }
  };

  return <div className="space-y-4">
    {formation && <Card className="rounded-2xl border border-border bg-card p-5 space-y-1"><div className="text-sm font-bold">Formation context</div><p className="text-xs text-muted-foreground">Phase 3 company/team decisions are reused here; they are not recreated.</p>{formation.cofounderDraft && <p className="text-xs">Co-founder opportunity: {formation.cofounderDraft.roleNeeded ?? "Not specified"} · {formation.cofounderDraft.equityRange ?? "Equity to be decided"} · {formation.cofounderDraft.locationPreference ?? "Location flexible"}</p>}{formation.youNeed?.length ? <p className="text-xs text-muted-foreground">Team gaps: {formation.youNeed.map((item) => item.skill).filter(Boolean).join(", ")}</p> : null}</Card>}
    <Card className="rounded-2xl border border-border bg-card p-5 space-y-3"><div className="text-sm font-bold flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> Company Planning</div><div className="flex gap-2">{TYPES.map((value) => <button key={value} onClick={() => setType(value)} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${type === value ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{value}</button>)}</div><div className="space-y-2"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Ownership — enter your intended split</span><span className={ownSum === 100 ? "text-primary" : "text-destructive"}>{ownSum}% · founder {founderSum}%</span></div>{ownership.map((entry, index) => <div key={index} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center"><input value={entry.holder} placeholder="Holder" onChange={(e) => setOwnership((items) => items.map((item, i) => i === index ? { ...item, holder: e.target.value } : item))} className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" /><input type="number" value={entry.percent || ""} onChange={(e) => setOwnership((items) => items.map((item, i) => i === index ? { ...item, percent: Number(e.target.value) } : item))} className="w-16 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" /><label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked={entry.isFounder} onChange={(e) => setOwnership((items) => items.map((item, i) => i === index ? { ...item, isFounder: e.target.checked } : item))} /> founder</label><label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked={entry.isEsop} onChange={(e) => setOwnership((items) => items.map((item, i) => i === index ? { ...item, isEsop: e.target.checked } : item))} /> esop</label><button onClick={() => setOwnership((items) => items.filter((_, i) => i !== index))} aria-label="Remove ownership holder"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button></div>)}<button onClick={() => setOwnership((items) => [...items, { holder: "", percent: 0, isFounder: false, isEsop: false }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add holder</button></div>{formWarn.includes("esop_recommended") && <p className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> An ESOP pool of ≥10% is recommended for hiring.</p>}{formErr && <p className="text-sm text-destructive">{formErr}</p>}<Button onClick={saveFormation} disabled={savingForm} className="gap-2">{savingForm ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{formSaved ? "Update company planning" : "Save company planning"}</Button></Card>
    <Card className="rounded-2xl border border-border bg-card p-5 space-y-3"><div className="text-sm font-bold flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" /> Funding Preparation</div><p className="text-xs text-muted-foreground">Set your own funding target and use of funds. These values are not inferred from a generic template.</p><label className="text-sm space-y-1 block"><span className="text-muted-foreground">Your funding target (€)</span><input aria-label="Your funding target" type="number" min="10000" value={totalAsk || ""} onChange={(e) => setTotalAsk(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label><div className="space-y-2"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Use of funds</span><span className={useSum === 100 ? "text-primary" : "text-destructive"}>{useSum}%</span></div>{use.map((entry, index) => <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center"><input value={entry.category} placeholder="Category" onChange={(e) => setUse((items) => items.map((item, i) => i === index ? { ...item, category: e.target.value } : item))} className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" /><input type="number" value={entry.percent || ""} onChange={(e) => setUse((items) => items.map((item, i) => i === index ? { ...item, percent: Number(e.target.value) } : item))} className="w-16 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" /><button onClick={() => setUse((items) => items.filter((_, i) => i !== index))} aria-label="Remove use of funds"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button></div>)}<button onClick={() => setUse((items) => [...items, { category: "", percent: 0 }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add use of funds</button></div><div className="space-y-1"><span className="text-xs text-muted-foreground">Target investor types</span><div className="flex flex-wrap gap-2">{INVESTOR_TYPES.map((value) => <button key={value} onClick={() => toggleInvestor(value)} className={`rounded-full border px-3 py-1 text-xs ${investorTypes.includes(value) ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>{value}</button>)}</div></div>{seedErr && <p className="text-sm text-destructive">{seedErr}</p>}{seedSaved && <div className="flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4" /> Funding preparation saved.</div>}<Button onClick={saveSeed} disabled={savingSeed} className="gap-2">{savingSeed ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save funding preparation</Button></Card>
  </div>;
}
