'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import entrepreneurApi, { OwnershipHistoryEntryDto } from '@/lib/api-entrepreneur';
import { Phase4Context } from '../Phase4TabbedView';
import { deriveCapTable, fmtPct } from '../phase4-utils';

interface RoundState {
  name: string;
  badge: 'Current' | 'Projection';
  raise: string;
  preMoney: string;
}

const DEFAULT_ROUNDS: RoundState[] = [
  { name: 'Pre-Seed Round', badge: 'Current', raise: '200000', preMoney: '1200000' },
  { name: 'Seed Round', badge: 'Projection', raise: '2000000', preMoney: '8000000' },
  { name: 'Series A', badge: 'Projection', raise: '8000000', preMoney: '30000000' },
];

export function Phase4DilutionTab({ ctx }: { ctx: Phase4Context }) {
  const derived = deriveCapTable(ctx.snapshot);
  const [rounds, setRounds] = useState<RoundState[]>(DEFAULT_ROUNDS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const update = (i: number, patch: Partial<RoundState>) =>
    setRounds((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  // Sequential founder dilution across rounds (no post-render mutation:
  // each round's founder-before is the base scaled by the product of prior
  // rounds' retained fractions).
  const base = derived.founderPct || 100;
  const newInvestorPctOf = (r: RoundState) => {
    const raise = parseFloat(r.raise) || 0;
    const preMoney = parseFloat(r.preMoney) || 0;
    const postMoney = preMoney + raise;
    return postMoney > 0 ? (raise / postMoney) * 100 : 0;
  };
  const computed = rounds.map((r, i) => {
    const raise = parseFloat(r.raise) || 0;
    const preMoney = parseFloat(r.preMoney) || 0;
    const postMoney = preMoney + raise;
    const newInvestorPct = newInvestorPctOf(r);
    const priorFactor = rounds
      .slice(0, i)
      .reduce((f, rr) => f * (1 - newInvestorPctOf(rr) / 100), 1);
    const founderBefore = base * priorFactor;
    const founderAfter = founderBefore * (1 - newInvestorPct / 100);
    return { raise, preMoney, postMoney, newInvestorPct, founderBefore, founderAfter };
  });

  const journey = [
    { label: 'Today', pct: derived.founderPct || 100 },
    ...computed.map((c, i) => ({ label: rounds[i].name.replace(' Round', ''), pct: c.founderAfter })),
  ];
  const finalFounder = journey[journey.length - 1].pct;

  async function handleSave() {
    setError('');
    if (!ctx.snapshot) {
      setError('Create your cap table first (Cap Table tab).');
      return;
    }
    setSaving(true);
    try {
      const entries: OwnershipHistoryEntryDto[] = rounds.map((r, i) => ({
        roundName: r.name,
        founderOwnershipBefore: Number(computed[i].founderBefore.toFixed(2)),
        founderOwnershipAfter: Number(computed[i].founderAfter.toFixed(2)),
        investorOwnership: Number(computed[i].newInvestorPct.toFixed(2)),
        esopOwnership: ctx.snapshot?.esopPoolPercent ?? 0,
        valuation: computed[i].postMoney,
        notes: `Simulated ${r.name.toLowerCase()}. Investors acquire ${computed[i].newInvestorPct.toFixed(1)}% at post-money valuation €${Math.round(computed[i].postMoney).toLocaleString()}.`,
      }));
      await entrepreneurApi.saveOwnershipHistory(ctx.companyId, { entries });
      await ctx.reload();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save dilution simulation');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-foreground">Dilution Sim</h3>
          <span className="text-xs font-semibold text-primary bg-primary/10 rounded-lg px-3 py-1">
            Adjust values below
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {rounds.map((r, i) => {
            const c = computed[i];
            const isCurrent = r.badge === 'Current';
            return (
              <div
                key={i}
                className={`rounded-2xl border p-4 space-y-4 ${
                  isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-primary">{r.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-success-light text-success-text'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {r.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Raise amount (€)</label>
                  <Input type="number" value={r.raise} onChange={(e) => { update(i, { raise: e.target.value }); setSaved(false); }} className="h-9 bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Pre-money valuation (€)</label>
                  <Input type="number" value={r.preMoney} onChange={(e) => { update(i, { preMoney: e.target.value }); setSaved(false); }} className="h-9 bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Post-money valuation (€)</label>
                  <Input value={`€ ${c.postMoney.toLocaleString()}`} readOnly className="h-9 bg-muted/50 text-muted-foreground" />
                </div>

                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">New investor ownership</p>
                  <p className="text-2xl font-bold text-primary">{fmtPct(c.newInvestorPct, 2)}</p>
                </div>

                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Founders before</span>
                    <span className="font-medium text-foreground">{fmtPct(c.founderBefore, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Founders after</span>
                    <span className="font-semibold text-warning">{fmtPct(c.founderAfter, 2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Founder ownership journey */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-foreground">Founder ownership journey</h3>
          {saved && !error && (
            <span className="flex items-center gap-1.5 text-success-text text-sm">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {journey.map((j, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{fmtPct(j.pct, 2)}</span>
              <div className="w-full h-1 rounded-full bg-input relative">
                <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-3 h-3 rounded-full bg-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{j.label}</span>
            </div>
          ))}
        </div>

        <div
          className={`rounded-xl p-3 text-sm ${
            finalFounder >= 50
              ? 'bg-success-light text-success-text'
              : 'bg-warning/10 text-warning'
          }`}
        >
          {finalFounder >= 50
            ? '✓ Founders retain majority control through the final round. A healthy outcome for B2B SaaS at this stage.'
            : '⚠ Founders drop below majority control. Consider adjusting raise amounts or valuations.'}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save simulation
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
