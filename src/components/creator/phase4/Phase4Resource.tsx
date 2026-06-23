"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Plus, Trash2, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  creatorJourneyApi,
  type TeamRequirement,
  type SaasItem,
  type ResourceCalculation,
} from "@/lib/api-creator-journey";

export function Phase4Resource({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [team, setTeam] = useState<TeamRequirement[]>([{ role: "Full-stack Developer", cost: 4000, durationMonths: 3, oneTime: false }]);
  const [saas, setSaas] = useState<SaasItem[]>([{ name: "Hosting & infra", monthlyCost: 80 }]);
  const [calc, setCalc] = useState<ResourceCalculation | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerNote, setProviderNote] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const compute = async () => {
    setComputing(true); setError(null);
    try {
      setCalc(await creatorJourneyApi.resourceCalculator(team, saas));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't compute.");
    } finally { setComputing(false); }
  };

  const bookTalent = async () => {
    setBooking(true); setProviderNote(null);
    try {
      const matches = await creatorJourneyApi.spMatches("development");
      if (matches.length === 0) { setProviderNote("No verified developers available right now."); return; }
      await creatorJourneyApi.openWorkroom(matches[0].spId, "Launch team — development");
      setProviderNote(`Workroom opened with ${matches[0].name}.`);
    } catch (e) {
      setProviderNote(e instanceof Error ? e.message : "Couldn't open a workroom.");
    } finally { setBooking(false); }
  };

  const fmt = (n: number) => `€${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team */}
        <Card className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold">Team requirements</div>
          {team.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
              <input value={t.role} onChange={(e) => setTeam((x) => x.map((y, j) => j === i ? { ...y, role: e.target.value } : y))} className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" placeholder="Role" />
              <input type="number" value={t.cost} onChange={(e) => setTeam((x) => x.map((y, j) => j === i ? { ...y, cost: Number(e.target.value) } : y))} className="w-20 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" title="€/mo" />
              <input type="number" value={t.durationMonths} onChange={(e) => setTeam((x) => x.map((y, j) => j === i ? { ...y, durationMonths: Number(e.target.value) } : y))} className="w-14 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" title="months" />
              <button onClick={() => setTeam((x) => x.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
          ))}
          <button onClick={() => setTeam((x) => [...x, { role: "", cost: 0, durationMonths: 1, oneTime: false }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add role</button>
        </Card>

        {/* SaaS */}
        <Card className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold">SaaS stack (monthly)</div>
          {saas.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <input value={s.name} onChange={(e) => setSaas((x) => x.map((y, j) => j === i ? { ...y, name: e.target.value } : y))} className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" placeholder="Tool" />
              <input type="number" value={s.monthlyCost} onChange={(e) => setSaas((x) => x.map((y, j) => j === i ? { ...y, monthlyCost: Number(e.target.value) } : y))} className="w-20 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" title="€/mo" />
              <button onClick={() => setSaas((x) => x.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
          ))}
          <button onClick={() => setSaas((x) => [...x, { name: "", monthlyCost: 0 }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add tool</button>
        </Card>
      </div>

      <Button variant="outline" onClick={compute} disabled={computing} className="gap-2">{computing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Compute plan</Button>

      {calc && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="rounded-2xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Launch budget</div><div className="text-lg font-extrabold">{fmt(calc.totalLaunchBudgetMin)}–{fmt(calc.totalLaunchBudgetMax)}</div></Card>
            <Card className="rounded-2xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Monthly running</div><div className="text-lg font-extrabold">{fmt(calc.monthlyRunningCost)}</div></Card>
            <Card className="rounded-2xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Time to launch</div><div className="text-lg font-extrabold">{calc.timeToLaunchWeeksMin}–{calc.timeToLaunchWeeksMax} wks</div></Card>
          </div>
          {/* Breakdown bar */}
          <Card className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold mb-2">Budget breakdown</div>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div className="bg-primary" style={{ width: `${calc.budgetBreakdown.teamPct}%` }} title={`Team ${calc.budgetBreakdown.teamPct}%`} />
              <div className="bg-warning" style={{ width: `${calc.budgetBreakdown.toolsPct}%` }} title={`Tools ${calc.budgetBreakdown.toolsPct}%`} />
              <div className="bg-success-text" style={{ width: `${calc.budgetBreakdown.legalPct}%` }} title={`Legal ${calc.budgetBreakdown.legalPct}%`} />
              <div className="bg-muted-foreground" style={{ width: `${calc.budgetBreakdown.miscPct}%` }} title={`Misc ${calc.budgetBreakdown.miscPct}%`} />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>Team {calc.budgetBreakdown.teamPct}%</span><span>Tools {calc.budgetBreakdown.toolsPct}%</span><span>Legal {calc.budgetBreakdown.legalPct}%</span><span>Misc {calc.budgetBreakdown.miscPct}%</span>
            </div>
          </Card>
          {/* Verified providers */}
          <Card className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
            <div><div className="text-sm font-semibold">Verified providers</div><div className="text-xs text-muted-foreground">Book vetted M50 talent for your launch team.</div></div>
            <Button variant="outline" size="sm" onClick={bookTalent} disabled={booking} className="gap-1.5">{booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Book Talent</Button>
          </Card>
          {providerNote && <p className="text-xs text-primary">{providerNote}</p>}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <Button onClick={onNext} disabled={!calc} className="gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
