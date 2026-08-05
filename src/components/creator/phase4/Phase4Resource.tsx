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
  type MarketBenchmark,
} from "@/lib/api-creator-journey";

// The backend persists the calculator's INPUTS (teamRequirements/saasStack) alongside
// the computed outputs; the shared ResourceCalculation type only models the outputs.
type SavedResourceCalculation = ResourceCalculation & {
  teamRequirements?: TeamRequirement[];
  saasStack?: SaasItem[];
};

type ValueSource = "saved" | "benchmark" | "manual" | "unavailable";

function SourceBadge({ source, benchmark }: { source: ValueSource; benchmark?: MarketBenchmark | null }) {
  const label = source === "saved"
    ? "Saved value"
    : source === "manual"
      ? "Manual entry"
      : source === "unavailable"
        ? "Reference unavailable"
      : benchmark?.matchType === "sector"
        ? `Benchmark: ${benchmark.resolvedBenchmarkSector}`
        : benchmark?.displayLabel ?? "Benchmark";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
      source === "benchmark" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    }`}>
      {label}
    </span>
  );
}

export function Phase4Resource({ ideaId, initial, benchmark, onSaved, onNext, onBack }: {
  ideaId: string | null;
  initial?: SavedResourceCalculation | null;
  benchmark?: MarketBenchmark | null;
  onSaved?: (calc: SavedResourceCalculation) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // Parent hydration completes before mount, so saved inputs or benchmark defaults
  // are selected once without a late-fetch state overwrite.
  const hasSavedTeam = Boolean(initial?.teamRequirements?.length);
  const hasSavedSaas = Boolean(initial?.saasStack?.length);
  const [team, setTeam] = useState<TeamRequirement[]>(() =>
    hasSavedTeam
      ? initial!.teamRequirements!
      : benchmark
        ? [{
            role: "Full-stack Developer",
            cost: benchmark.resourceDefaults.developerCostPerMonth,
            durationMonths: benchmark.resourceDefaults.developerDurationMonths,
            oneTime: false,
          }]
        : [],
  );
  const [saas, setSaas] = useState<SaasItem[]>(() =>
    hasSavedSaas
      ? initial!.saasStack!
      : benchmark
        ? [{ name: "Hosting & infra", monthlyCost: benchmark.resourceDefaults.hostingCostPerMonth }]
        : [],
  );
  const [calc, setCalc] = useState<ResourceCalculation | null>(initial ?? null);
  const [teamSource, setTeamSource] = useState<ValueSource>(hasSavedTeam ? "saved" : benchmark ? "benchmark" : "manual");
  const [saasSource, setSaasSource] = useState<ValueSource>(hasSavedSaas ? "saved" : benchmark ? "benchmark" : "manual");
  const [launchSource, setLaunchSource] = useState<ValueSource>(initial ? "saved" : benchmark ? "benchmark" : "unavailable");
  const [legalMiscSource, setLegalMiscSource] = useState<ValueSource>(initial ? "saved" : benchmark ? "benchmark" : "unavailable");
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerNote, setProviderNote] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const invalidateCalculation = () => {
    setCalc(null);
    setLaunchSource(benchmark ? "benchmark" : "unavailable");
    setLegalMiscSource(benchmark ? "benchmark" : "unavailable");
  };

  const editTeam = (update: (items: TeamRequirement[]) => TeamRequirement[]) => {
    setTeam((items) => update(items));
    setTeamSource("manual");
    invalidateCalculation();
  };

  const editSaas = (update: (items: SaasItem[]) => SaasItem[]) => {
    setSaas((items) => update(items));
    setSaasSource("manual");
    invalidateCalculation();
  };

  const compute = async () => {
    setComputing(true); setError(null);
    try {
      const result = (await creatorJourneyApi.resourceCalculator(team, saas, ideaId)) as SavedResourceCalculation;
      setCalc(result);
      setTeamSource("saved");
      setSaasSource("saved");
      setLaunchSource("saved");
      setLegalMiscSource("saved");
      onSaved?.(result); // keep the host's saved snapshot current for Back-navigation
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

  const currency = benchmark?.currency || "EUR";
  const fmt = (n: number) => new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(n));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team */}
        <Card className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">Developer / team requirements</div>
            <SourceBadge source={teamSource} benchmark={benchmark} />
          </div>
          {team.length === 0 && <p className="text-xs text-muted-foreground">Add the roles and costs you want to use.</p>}
          {team.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
              <input value={t.role} onChange={(e) => editTeam((x) => x.map((y, j) => j === i ? { ...y, role: e.target.value } : y))} className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" placeholder="Role" />
              <input type="number" value={t.cost} onChange={(e) => editTeam((x) => x.map((y, j) => j === i ? { ...y, cost: Number(e.target.value) } : y))} className="w-20 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" title={`${currency}/mo`} />
              <input type="number" value={t.durationMonths} onChange={(e) => editTeam((x) => x.map((y, j) => j === i ? { ...y, durationMonths: Number(e.target.value) } : y))} className="w-14 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" title="months" />
              <button onClick={() => editTeam((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${t.role || "role"}`}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
          ))}
          <button onClick={() => editTeam((x) => [...x, { role: "", cost: 0, durationMonths: 1, oneTime: false }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add role</button>
        </Card>

        {/* SaaS */}
        <Card className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">Hosting / SaaS stack (monthly)</div>
            <SourceBadge source={saasSource} benchmark={benchmark} />
          </div>
          {saas.length === 0 && <p className="text-xs text-muted-foreground">Add hosting or tools with their monthly costs.</p>}
          {saas.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <input value={s.name} onChange={(e) => editSaas((x) => x.map((y, j) => j === i ? { ...y, name: e.target.value } : y))} className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" placeholder="Tool" />
              <input type="number" value={s.monthlyCost} onChange={(e) => editSaas((x) => x.map((y, j) => j === i ? { ...y, monthlyCost: Number(e.target.value) } : y))} className="w-20 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none" title={`${currency}/mo`} />
              <button onClick={() => editSaas((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${s.name || "tool"}`}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
          ))}
          <button onClick={() => editSaas((x) => [...x, { name: "", monthlyCost: 0 }])} className="text-xs text-primary inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add tool</button>
        </Card>
      </div>

      <Card className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 text-sm font-semibold">Planning assumptions</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium">Launch duration</span>
              <SourceBadge source={launchSource} benchmark={benchmark} />
            </div>
            <p className="text-sm font-semibold">
              {calc
                ? `${calc.timeToLaunchWeeksMin}–${calc.timeToLaunchWeeksMax} weeks`
                : benchmark
                  ? `${benchmark.resourceDefaults.launchDurationWeeksMin}–${benchmark.resourceDefaults.launchDurationWeeksMax} weeks`
                  : "Calculated when you compute"}
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium">Legal</span>
              <SourceBadge source={legalMiscSource} benchmark={benchmark} />
            </div>
            <p className="text-sm font-semibold">
              {calc ? "Included in saved calculation" : benchmark ? fmt(benchmark.resourceDefaults.legalCost) : "Calculated when you compute"}
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium">Miscellaneous</span>
              <SourceBadge source={legalMiscSource} benchmark={benchmark} />
            </div>
            <p className="text-sm font-semibold">
              {calc ? "Included in saved calculation" : benchmark ? `${benchmark.resourceDefaults.miscPercentage}%` : "Calculated when you compute"}
            </p>
          </div>
        </div>
      </Card>

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
