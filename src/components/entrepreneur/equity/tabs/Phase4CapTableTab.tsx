'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import entrepreneurApi, { EquityGrantDto } from '@/lib/api-entrepreneur';
import { Phase4Context } from '../Phase4TabbedView';
import { fmtNum, TYPE_LABEL, StakeType as UtilStakeType } from '../phase4-utils';

type StakeType = 'founder' | 'investor' | 'advisor' | 'esop';
type ShareClass = 'common' | 'preferred';

const CLASS_LABEL: Record<ShareClass, string> = {
  common: 'Common',
  preferred: 'Preferred',
};

interface Row {
  stakeholderName: string;
  stakeholderType: StakeType;
  shareClass: ShareClass;
  sharesGranted: string;
  investmentAmount: string;
  cliffMonths: string;
  totalVestMonths: string;
  date: string;
}

// Tailwind badge tone per stakeholder type — mirrors the HealthBadge pattern
// already used in the KPI tracker (named colors + dark: variants, dark-mode safe).
const TYPE_BADGE: Record<StakeType, string> = {
  founder: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  investor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  advisor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  esop: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// Backend stores vesting in months; the UI presents it in years.
const monthsToYears = (m: number) => {
  const y = m / 12;
  return Number.isInteger(y) ? String(y) : y.toFixed(1);
};
const yearsToMonths = (y: number) => Math.round(y * 12);
const fmtYears = (m: number) => `${monthsToYears(m)}y`;

function rowFrom(g: EquityGrantDto): Row {
  const sc = (g.shareClass ?? '').toLowerCase();
  const validSc: ShareClass = sc === 'preferred' ? 'preferred' : 'common';
  return {
    stakeholderName: g.stakeholderName,
    stakeholderType: (g.stakeholderType ?? 'investor') as StakeType,
    shareClass: validSc,
    sharesGranted: String(g.sharesGranted),
    investmentAmount: g.investmentAmount != null ? String(g.investmentAmount) : '',
    cliffMonths: String(g.cliffMonths ?? 0),
    totalVestMonths: String(g.totalVestMonths ?? 0),
    date: g.grantDate ? g.grantDate.slice(0, 10) : '',
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
    date: todayStr(),
  };
}

export function Phase4CapTableTab({ ctx }: { ctx: Phase4Context }) {
  const [totalShares, setTotalShares] = useState(
    ctx.snapshot ? String(ctx.snapshot.totalShares) : '10000000',
  );
  const [rows, setRows] = useState<Row[]>(
    ctx.snapshot && ctx.snapshot.grants.length > 0
      ? ctx.snapshot.grants.map(rowFrom)
      : [],
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Add / edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Row>(emptyRow('investor'));
  const [dialogError, setDialogError] = useState('');

  // Delete confirmation state
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const totalSharesNum = parseInt(totalShares, 10) || 0;
  const issued = rows.reduce((s, r) => s + (parseInt(r.sharesGranted, 10) || 0), 0);
  const issuedPct = totalSharesNum > 0 ? (issued / totalSharesNum) * 100 : 0;

  const setDraftField = (patch: Partial<Row>) => setDraft((d) => ({ ...d, ...patch }));

  function openAdd() {
    setDraft(emptyRow('investor'));
    setEditIndex(null);
    setDialogError('');
    setDialogOpen(true);
  }

  function openEdit(i: number) {
    setDraft(rows[i]);
    setEditIndex(i);
    setDialogError('');
    setDialogOpen(true);
  }

  // Shared persist — reuses the existing validation + submitCapTable contract.
  async function persist(nextRows: Row[], nextTotal?: number): Promise<boolean> {
    setError('');
    const totalNum = nextTotal ?? totalSharesNum;
    if (totalNum <= 0) {
      setError('Total authorised shares must be greater than 0.');
      return false;
    }
    for (const r of nextRows) {
      if (!r.stakeholderName.trim()) {
        setError('Every stakeholder needs a name.');
        return false;
      }
      const shares = parseInt(r.sharesGranted, 10);
      if (!Number.isFinite(shares) || shares <= 0) {
        setError(`"${r.stakeholderName || 'Row'}": shares must be a whole number > 0.`);
        return false;
      }
      if (shares > totalNum) {
        setError(`"${r.stakeholderName}": shares exceed total authorised shares.`);
        return false;
      }
    }

    setSaving(true);
    try {
      const grants: EquityGrantDto[] = nextRows.map((r) => ({
        stakeholderName: r.stakeholderName.trim(),
        stakeholderType: r.stakeholderType,
        shareClass: r.shareClass,
        sharesGranted: parseInt(r.sharesGranted, 10),
        investmentAmount: r.investmentAmount ? parseFloat(r.investmentAmount) : undefined,
        grantDate: r.date || undefined,
        cliffMonths: parseInt(r.cliffMonths, 10) || 0,
        totalVestMonths: parseInt(r.totalVestMonths, 10) || 0,
      }));
      await entrepreneurApi.submitCapTable(ctx.companyId, {
        totalShares: totalNum,
        esopPoolPercent: ctx.snapshot?.esopPoolPercent ?? 0,
        esopVestingMonths: ctx.snapshot?.esopVestingMonths ?? 48,
        grants,
      });
      await ctx.reload();
      setSavedAt(new Date().toISOString());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save cap table');
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Dialog submit — validates the single draft, then persists the whole table.
  async function handleDialogSave() {
    setDialogError('');
    if (!draft.stakeholderName.trim()) {
      setDialogError('Stakeholder name is required.');
      return;
    }
    const shares = parseInt(draft.sharesGranted, 10);
    if (!Number.isFinite(shares) || shares <= 0) {
      setDialogError('Shares granted must be a whole number greater than 0.');
      return;
    }
    if (shares > totalSharesNum) {
      setDialogError('Shares exceed total authorised shares.');
      return;
    }
    const next = editIndex === null ? [...rows, draft] : rows.map((r, i) => (i === editIndex ? draft : r));
    const ok = await persist(next);
    if (ok) {
      setRows(next);
      setDialogOpen(false);
    } else {
      // Surface the table-level error inside the dialog too.
      setDialogError('Could not save. Check the values and try again.');
    }
  }

  // Delete confirm — removes the row then persists (or just clears locally if none remain).
  async function handleDeleteConfirm() {
    if (deleteIndex === null) return;
    const next = rows.filter((_, i) => i !== deleteIndex);
    if (next.length === 0) {
      setRows(next);
      setDeleteIndex(null);
      return;
    }
    const ok = await persist(next);
    if (ok) setRows(next);
    setDeleteIndex(null);
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
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add stakeholder
        </Button>
      </div>

      <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
        <label className="text-xs font-medium text-muted-foreground">Total authorised shares</label>
        <Input
          type="number"
          value={totalShares}
          onChange={(e) => setTotalShares(e.target.value)}
          className="h-8 w-40 bg-popover"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <th className="px-5 py-2.5 font-medium">Name</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">Share Class</th>
              <th className="px-3 py-2.5 font-medium text-right">% Fully Diluted</th>
              <th className="px-3 py-2.5 font-medium text-right">Investment €</th>
              <th className="px-3 py-2.5 font-medium text-right">Date</th>
              <th className="px-3 py-2.5 font-medium text-right">Vesting</th>
              <th className="px-3 py-2.5 font-medium text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No stakeholders yet. Click <span className="font-medium text-foreground">Add stakeholder</span> to record one.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">{r.stakeholderName}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${TYPE_BADGE[r.stakeholderType]}`}>
                      {TYPE_LABEL[r.stakeholderType as UtilStakeType]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{CLASS_LABEL[r.shareClass]}</td>
                  <td className="px-3 py-3 text-right text-foreground whitespace-nowrap">
                    {totalSharesNum > 0
                      ? `${(((parseInt(r.sharesGranted, 10) || 0) / totalSharesNum) * 100).toFixed(2)}%`
                      : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                    {r.investmentAmount ? `€${fmtNum(parseFloat(r.investmentAmount))}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">{r.date || '—'}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                    {parseInt(r.totalVestMonths, 10) > 0
                      ? `${fmtYears(parseInt(r.cliffMonths, 10) || 0)} cliff / ${fmtYears(parseInt(r.totalVestMonths, 10))}`
                      : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(i)} aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteIndex(i)}
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
          <Button onClick={() => persist(rows)} disabled={saving || rows.length === 0} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save total shares
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-5 pb-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editIndex === null ? 'Add stakeholder' : 'Edit stakeholder'}</DialogTitle>
            <DialogDescription>
              Enter the stakeholder&apos;s equity details. Saving updates the cap table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full name</label>
              <Input
                value={draft.stakeholderName}
                onChange={(e) => setDraftField({ stakeholderName: e.target.value })}
                placeholder="e.g. Alice Smith"
                className="bg-popover"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type</label>
                <Select value={draft.stakeholderType} onValueChange={(v) => setDraftField({ stakeholderType: v as StakeType })}>
                  <SelectTrigger className="bg-popover"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="advisor">Advisor</SelectItem>
                    <SelectItem value="esop">ESOP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Share class</label>
                <Select value={draft.shareClass} onValueChange={(v) => setDraftField({ shareClass: v as ShareClass })}>
                  <SelectTrigger className="bg-popover"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="preferred">Preferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Shares granted</label>
                <Input
                  type="number"
                  value={draft.sharesGranted}
                  onChange={(e) => setDraftField({ sharesGranted: e.target.value })}
                  placeholder="0"
                  className="bg-popover"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Investment € (optional)</label>
                <Input
                  type="number"
                  value={draft.investmentAmount}
                  onChange={(e) => setDraftField({ investmentAmount: e.target.value })}
                  placeholder="—"
                  className="bg-popover"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Grant date (optional)</label>
              <Input
                type="date"
                value={draft.date}
                onChange={(e) => setDraftField({ date: e.target.value })}
                className="bg-popover"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cliff (years)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={draft.cliffMonths ? monthsToYears(parseInt(draft.cliffMonths, 10) || 0) : ''}
                  onChange={(e) => setDraftField({ cliffMonths: String(yearsToMonths(parseFloat(e.target.value) || 0)) })}
                  placeholder="0"
                  className="bg-popover"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Total vesting (years)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={draft.totalVestMonths ? monthsToYears(parseInt(draft.totalVestMonths, 10) || 0) : ''}
                  onChange={(e) => setDraftField({ totalVestMonths: String(yearsToMonths(parseFloat(e.target.value) || 0)) })}
                  placeholder="0"
                  className="bg-popover"
                />
              </div>
            </div>

            {dialogError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-destructive">{dialogError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleDialogSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editIndex === null ? 'Add stakeholder' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteIndex !== null} onOpenChange={(o) => !o && setDeleteIndex(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove stakeholder</DialogTitle>
            <DialogDescription>
              {deleteIndex !== null && rows[deleteIndex]
                ? `Remove "${rows[deleteIndex].stakeholderName}" from the cap table? This updates your saved cap table.`
                : 'Remove this stakeholder?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIndex(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={saving}
              className="gap-2 bg-destructive text-white hover:bg-destructive/90"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
