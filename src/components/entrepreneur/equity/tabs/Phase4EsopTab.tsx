'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { Phase4Context } from '../Phase4TabbedView';
import { fmtNum } from '../phase4-utils';

// const REASONS = [
//   {
//     color: 'var(--chart-1)',
//     title: 'Attract top talent',
//     body: "Senior engineers and executives expect equity. An ESOP pool signals you're serious about team growth.",
//   },
//   {
//     color: 'var(--chart-5)',
//     title: 'Dilute before raise',
//     body: 'Creating ESOP before fundraising means founders absorb the dilution — not the incoming investors. This is the smart approach.',
//   },
//   {
//     color: 'var(--chart-2)',
//     title: 'Investor confidence',
//     body: 'Pre-seed investors prefer ESOP pools already in place. It shows forward planning and reduces negotiation friction.',
//   },
// ];

export function Phase4EsopTab({ ctx }: { ctx: Phase4Context }) {
  const [pool, setPool] = useState(ctx.snapshot?.esopPoolPercent ?? 5);
  const [cliff, setCliff] = useState('2 years (Standard)');
  const [vesting, setVesting] = useState('4 years (Standard)');
  const [acceleration, setAcceleration] = useState('Double trigger (Recommended)');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const totalShares = ctx.snapshot?.totalShares ?? 0;
  const reservedShares = Math.round((totalShares * pool) / 100);

  async function handleSave() {
    setError('');
    if (!ctx.snapshot) {
      setError('Create your cap table first (Cap Table tab).');
      return;
    }
    setSaving(true);
    try {
      const vestMonths = vesting.startsWith('3') ? 36 : vesting.startsWith('5') ? 60 : 48;
      await entrepreneurApi.submitCapTable(ctx.companyId, {
        totalShares: ctx.snapshot.totalShares,
        esopPoolPercent: pool,
        esopVestingMonths: vestMonths,
        grants: ctx.snapshot.grants,
      });
      await ctx.reload();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save ESOP pool');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
      {/* Left: configuration */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-foreground">ESOP Pool — Quick Setup</h3>
          <span className="text-xs font-semibold text-success-text bg-success-light rounded-lg px-3 py-1">
            Recommended 10–15%
          </span>
        </div>

        <div className="bg-card rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">{pool}%</p>
            <p className="text-sm text-muted-foreground mt-1">
              = {fmtNum(reservedShares)} shares reserved
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative h-6 flex items-center">
              <div className="absolute w-full h-1 bg-input rounded-full" />
              <div className="absolute h-1 bg-primary rounded-full" style={{ width: `${(pool / 30) * 100}%` }} />
              <input
                type="range"
                min={1}
                max={30}
                value={pool}
                onChange={(e) => { setPool(Number(e.target.value)); setSaved(false); }}
                aria-label="ESOP pool allocation percentage"
                aria-valuemin={1}
                aria-valuemax={30}
                aria-valuenow={pool}
                className="relative w-full appearance-none bg-transparent cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cliff period</label>
              <Select value={cliff} onValueChange={(v) => { setCliff(v); setSaved(false); }}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 year">1 year</SelectItem>
                  <SelectItem value="2 years (Standard)">2 years (Standard)</SelectItem>
                  <SelectItem value="3 years">3 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Total vesting</label>
              <Select value={vesting} onValueChange={(v) => { setVesting(v); setSaved(false); }}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 years">3 years</SelectItem>
                  <SelectItem value="4 years (Standard)">4 years (Standard)</SelectItem>
                  <SelectItem value="5 years">5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Acceleration clause</label>
            <Select value={acceleration} onValueChange={(v) => { setAcceleration(v); setSaved(false); }}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Single trigger">Single trigger</SelectItem>
                <SelectItem value="Double trigger (Recommended)">Double trigger (Recommended)</SelectItem>
                <SelectItem value="No acceleration">No acceleration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && !error && (
            <span className="flex items-center gap-1.5 text-success-text text-sm">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save ESOP pool
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}
      </div>

      {/* Right: why ESOP now */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">Why create ESOP now?</h3>
        {/* <div className="space-y-3">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="border-l-[3px] rounded-lg p-3 bg-muted/40"
              style={{ borderLeftColor: r.color }}
            >
              <p className="font-semibold text-sm text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.body}</p>
            </div>
          ))}
        </div> */}

        <div className="space-y-3">
              {/* Green: Attract top talent */}
              <div className="border-l-3 border-success-text bg-popover rounded-lg p-3 space-y-1">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-text flex-shrink-0 mt-1.5"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">Attract top talent</p>
                    <p className="text-xs text-muted-foreground">
                      Senior engineers and executives expect equity. An ESOP pool signals you're serious about team growth.
                    </p>
                  </div>
                </div>
              </div>

              {/* Orange: Dilute before raise */}
              <div className="border-l-3 border-warning bg-popover rounded-lg p-3 space-y-1">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0 mt-1.5"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">Dilute before raise</p>
                    <p className="text-xs text-muted-foreground">
                      Creating ESOP before fundraising means founders absorb the dilution — not the incoming investors. This is the smart approach.
                    </p>
                  </div>
                </div>
              </div>

              {/* Blue: Investor confidence */}
              <div className="border-l-3 border-primary bg-popover rounded-lg p-3 space-y-1">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">Investor confidence</p>
                    <p className="text-xs text-muted-foreground">
                      Pre-seed investors prefer ESOP pools already in place. It shows forward planning and reduces negotiation friction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
      </div>
    </div>
  );
}
