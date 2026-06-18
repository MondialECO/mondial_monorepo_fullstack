'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import entrepreneurApi, { EquityGrantDto } from '@/lib/api-entrepreneur';
import { Phase4Context } from '../Phase4TabbedView';
import { fmtNum } from '../phase4-utils';

type StakeType = 'founder' | 'investor' | 'advisor' | 'esop';
type ShareClass = 'common' | 'preferred' | 'safe' | 'note';

interface Row {
  stakeholderName: string;
  stakeholderType: StakeType;
  shareClass: ShareClass;
  sharesGranted: string;
  investmentAmount: string;
  cliffMonths: string;
  totalVestMonths: string;
}

function rowFrom(g: EquityGrantDto): Row {
  return {
    stakeholderName: g.stakeholderName,
    stakeholderType: g.stakeholderType,
    shareClass: g.shareClass,
    sharesGranted: String(g.sharesGranted),
    investmentAmount: g.investmentAmount != null ? String(g.investmentAmount) : '',
    cliffMonths: String(g.cliffMonths ?? 0),
    totalVestMonths: String(g.totalVestMonths ?? 0),
  };
}

function emptyRow(type: StakeType): Row {
  return {
    stakeholderName: '',
    stakeholderType: type,
    shareClass: type === 'investor' ? 'preferred' : 'common',
    sharesGranted: '',
    investmentAmount: '',
    cliffMonths: type === 'founder' ? '12' : '0',
    totalVestMonths: type === 'founder' ? '48' : '0',
  };
}

export function Phase4CapTableTab({ ctx }: { ctx: Phase4Context }) {
  const [totalShares, setTotalShares] = useState(
    ctx.snapshot ? String(ctx.snapshot.totalShares) : '10000000',
  );
  const [rows, setRows] = useState<Row[]>(
    ctx.snapshot && ctx.snapshot.grants.length > 0
      ? ctx.snapshot.grants.map(rowFrom)
      : [emptyRow('founder')],
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const totalSharesNum = parseInt(totalShares, 10) || 0;
  const issued = rows.reduce((s, r) => s + (parseInt(r.sharesGranted, 10) || 0), 0);
  const issuedPct = totalSharesNum > 0 ? (issued / totalSharesNum) * 100 : 0;

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const add = () => setRows((rs) => [...rs, emptyRow('investor')]);

  async function handleSubmit() {
    setError('');
    if (totalSharesNum <= 0) {
      setError('Total authorised shares must be greater than 0.');
      return;
    }
    for (const r of rows) {
      if (!r.stakeholderName.trim()) {
        setError('Every stakeholder needs a name.');
        return;
      }
      const shares = parseInt(r.sharesGranted, 10);
      if (!Number.isFinite(shares) || shares <= 0) {
        setError(`"${r.stakeholderName || 'Row'}": shares must be a whole number > 0.`);
        return;
      }
      if (shares > totalSharesNum) {
        setError(`"${r.stakeholderName}": shares exceed total authorised shares.`);
        return;
      }
    }

    setSaving(true);
    try {
      const grants: EquityGrantDto[] = rows.map((r) => ({
        stakeholderName: r.stakeholderName.trim(),
        stakeholderType: r.stakeholderType,
        shareClass: r.shareClass,
        sharesGranted: parseInt(r.sharesGranted, 10),
        investmentAmount: r.investmentAmount ? parseFloat(r.investmentAmount) : undefined,
        cliffMonths: parseInt(r.cliffMonths, 10) || 0,
        totalVestMonths: parseInt(r.totalVestMonths, 10) || 0,
      }));
      await entrepreneurApi.submitCapTable(ctx.companyId, {
        totalShares: totalSharesNum,
        esopPoolPercent: ctx.snapshot?.esopPoolPercent ?? 0,
        esopVestingMonths: ctx.snapshot?.esopVestingMonths ?? 48,
        grants,
      });
      await ctx.reload();
      setSavedAt(new Date().toISOString());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save cap table';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-foreground">Official Cap Table</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record founders, investors, advisors and the ESOP pool.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add stakeholder
        </Button>
      </div>

      <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
        <label className="text-xs font-medium text-muted-foreground">Total authorised shares</label>
        <Input
          type="number"
          value={totalShares}
          onChange={(e) => setTotalShares(e.target.value)}
          className="h-8 w-40 bg-background"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-2 py-2.5 font-medium">Type</th>
              <th className="px-2 py-2.5 font-medium">Class</th>
              <th className="px-2 py-2.5 font-medium">Shares</th>
              <th className="px-2 py-2.5 font-medium">Investment €</th>
              <th className="px-2 py-2.5 font-medium">Cliff</th>
              <th className="px-2 py-2.5 font-medium">Vest</th>
              <th className="px-2 py-2.5 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <Input
                    value={r.stakeholderName}
                    onChange={(e) => update(i, { stakeholderName: e.target.value })}
                    placeholder="Name"
                    className="h-8 min-w-[140px] bg-background"
                  />
                </td>
                <td className="px-2 py-2">
                  <Select value={r.stakeholderType} onValueChange={(v) => update(i, { stakeholderType: v as StakeType })}>
                    <SelectTrigger className="h-8 w-[110px] bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Founder</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                      <SelectItem value="esop">ESOP</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2">
                  <Select value={r.shareClass} onValueChange={(v) => update(i, { shareClass: v as ShareClass })}>
                    <SelectTrigger className="h-8 w-[110px] bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="safe">SAFE</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2">
                  <Input type="number" value={r.sharesGranted} onChange={(e) => update(i, { sharesGranted: e.target.value })} placeholder="0" className="h-8 w-28 bg-background" />
                </td>
                <td className="px-2 py-2">
                  <Input type="number" value={r.investmentAmount} onChange={(e) => update(i, { investmentAmount: e.target.value })} placeholder="—" className="h-8 w-28 bg-background" />
                </td>
                <td className="px-2 py-2">
                  <Input type="number" value={r.cliffMonths} onChange={(e) => update(i, { cliffMonths: e.target.value })} className="h-8 w-16 bg-background" />
                </td>
                <td className="px-2 py-2">
                  <Input type="number" value={r.totalVestMonths} onChange={(e) => update(i, { totalVestMonths: e.target.value })} className="h-8 w-16 bg-background" />
                </td>
                <td className="px-2 py-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(i)} aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <span className="text-muted-foreground">Issued </span>
          <span className="font-semibold text-foreground">{fmtNum(issued)}</span>
          <span className="text-muted-foreground"> / {fmtNum(totalSharesNum)} </span>
          <span className={issuedPct >= 90 && issuedPct <= 100 ? 'text-success-text font-semibold' : 'text-warning font-semibold'}>
            ({issuedPct.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && !error && (
            <span className="flex items-center gap-1.5 text-success-text text-sm">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save cap table
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-5 pb-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
