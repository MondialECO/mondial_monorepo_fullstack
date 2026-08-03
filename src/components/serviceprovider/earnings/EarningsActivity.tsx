'use client';

// Remaining hardcoded hex on this file is deliberate, not an oversight: those values
// have no exact token equivalent. See the PENDING DESIGN-TOKEN DECISION note in
// src/app/globals.css (below the .sp-workspace block) for the full list and why.
import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarRange, FileBarChart2, Filter, ReceiptText, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useFinancialStatement } from '@/hooks/queries/workroom';
import { SpCard, SpEmptyState, SpFilterBar, SpMetricCard, SpMutationFeedback, SpSectionHeader, SpStatusBadge } from '@/components/serviceprovider/ui';
import { apiError, formatDate, money, words } from '@/components/serviceprovider/workroom/_shared';
import type { FinancialSummary, FinancialTransaction } from '@/types/workroom';
import { monthStartInput, rangeIso, shortReference, todayInput, transactionAmount, transactionTone } from './_shared';

export function EarningsActivity({ data, currency }: { data: FinancialSummary; currency: string }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<FinancialTransaction | null>(null);

  const transactions = useMemo(() => data.transactions.filter((transaction) => {
    const query = search.trim().toLowerCase();
    const searchable = [transaction.transactionType, transaction.paymentStatus, transaction.engagementId, transaction.milestoneId, transaction.id].filter(Boolean).join(' ').toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (status !== 'all' && transaction.paymentStatus !== status && transaction.transactionType !== status) return false;
    const created = new Date(transaction.createdAt).getTime();
    if (from && created < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && created >= new Date(`${to}T00:00:00`).getTime() + 86_400_000) return false;
    return true;
  }), [data.transactions, from, search, status, to]);

  const groups = useMemo(() => {
    const grouped = new Map<string, FinancialTransaction[]>();
    transactions.forEach((transaction) => {
      const key = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(transaction.createdAt));
      grouped.set(key, [...(grouped.get(key) ?? []), transaction]);
    });
    return Array.from(grouped.entries());
  }, [transactions]);

  const statuses = Array.from(new Set(data.transactions.flatMap((item) => [item.paymentStatus, item.transactionType]))).sort();
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <SpMetricCard label="Gross earnings" value={money(data.grossEarnings, currency)} detail="Completed server-recorded releases" icon={ArrowUpRight} className="min-h-0" />
      <SpMetricCard label="Fixed platform commission" value={money(data.commissionPaid, currency)} detail="Server-calculated at the canonical 12% release rate" icon={ReceiptText} iconClassName="bg-warning/10 text-warning" className="min-h-0" />
      <SpMetricCard label="Net earnings" value={money(data.netEarnings, currency)} detail="Gross less the server-recorded commission" icon={ArrowDownLeft} iconClassName="bg-[#E8F7F0] text-[#157A55]" className="min-h-0" />
    </div>

    <SpCard>
      <SpSectionHeader title="Financial activity" description="Search and filter the immutable transaction ledger. Select a row for its recorded amounts and references." />
      <SpFilterBar className="mt-5 border-0 bg-[#F9FAFB] p-3">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Search transactions</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search type or reference" className="bg-white pl-9" /></label>
        <label><span className="sr-only">Transaction status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-[#374151] outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{words(item)}</option>)}</select></label>
        <label><span className="sr-only">Transactions from date</span><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="bg-white" /></label>
        <label><span className="sr-only">Transactions to date</span><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="bg-white" /></label>
        {(search || status !== 'all' || from || to) && <Button type="button" variant="outline" onClick={() => { setSearch(''); setStatus('all'); setFrom(''); setTo(''); }}>Clear</Button>}
      </SpFilterBar>

      {data.transactions.length === 0 ? <SpEmptyState className="mt-5 border-0 bg-[#F9FAFB]" icon={Wallet} title="No earnings activity yet" description="Server-recorded financial events will appear after the first project payment lifecycle event." /> : groups.length === 0 ? <SpEmptyState className="mt-5 border-0 bg-[#F9FAFB]" icon={Filter} title="No transactions match" description="Clear or adjust the current search, status and date filters." /> : <div className="mt-5 space-y-6">{groups.map(([label, items]) => <section key={label} aria-labelledby={`group-${label.replace(/\s/g, '-')}`}><h3 id={`group-${label.replace(/\s/g, '-')}`} className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</h3><div className="overflow-hidden rounded-xl border border-border">{items.map((transaction) => <button type="button" key={transaction.id} onClick={() => setSelected(transaction)} className="flex w-full items-center justify-between gap-4 border-b border-border px-4 py-4 text-left outline-none last:border-0 hover:bg-[#F9FAFB] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{words(transaction.transactionType)}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(transaction.createdAt, true)} · Project {shortReference(transaction.engagementId)}</p></div><div className="shrink-0 text-right"><p className={`text-sm font-semibold ${transactionAmount(transaction) < 0 ? 'text-[#B42318]' : 'text-foreground'}`}>{money(transactionAmount(transaction), transaction.currency)}</p><SpStatusBadge tone={transactionTone(transaction.paymentStatus)} className="mt-1">{words(transaction.paymentStatus)}</SpStatusBadge></div></button>)}</div></section>)}</div>}
      {data.transactions.length === 0 && (data.available > 0 || data.workInProgress > 0 || data.inReview > 0) && <SpMutationFeedback status="info" className="mt-4">Balance lifecycle totals are available, but this currency has no transaction-detail rows yet.</SpMutationFeedback>}
    </SpCard>

    <StatementPanel currency={currency} />
    <TransactionDrawer transaction={selected} onOpenChange={(open) => !open && setSelected(null)} />
  </div>;
}

function StatementPanel({ currency }: { currency: string }) {
  const [from, setFrom] = useState(monthStartInput());
  const [to, setTo] = useState(todayInput());
  const valid = !!from && !!to && new Date(to) >= new Date(from);
  const statement = useFinancialStatement(valid ? rangeIso(from) : '', valid ? rangeIso(to, true) : '', currency, false);
  return <SpCard>
    <SpSectionHeader title="Financial statement" description="Generate a structured server response for a date range. No PDF or downloadable statement is available in the current API." action={<FileBarChart2 className="size-5 text-primary" aria-hidden="true" />} />
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="space-y-2 text-sm font-semibold text-[#374151]">Start date<Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="space-y-2 text-sm font-semibold text-[#374151]">End date<Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><Button type="button" variant="outline" disabled={!valid || statement.isFetching} onClick={() => statement.refetch()}>{statement.isFetching ? 'Generating…' : 'Generate statement'}</Button></div>
    {!valid && <p className="mt-2 text-xs font-medium text-[#B42318]">End date must be on or after the start date.</p>}
    {statement.isError && <SpMutationFeedback status="error" className="mt-4">{apiError(statement.error, 'The statement could not be generated. Adjust the range and try again.')}</SpMutationFeedback>}
    {statement.data && <div className="mt-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><StatementValue label="Opening balance" value={statement.data.openingBalance} currency={currency} /><StatementValue label="Gross releases" value={statement.data.gross} currency={currency} /><StatementValue label="Fixed commission" value={statement.data.commission} currency={currency} /><StatementValue label="Adjustments" value={statement.data.adjustments} currency={currency} /><StatementValue label="Payouts" value={statement.data.payouts} currency={currency} /><StatementValue label="Closing balance" value={statement.data.closingBalance} currency={currency} strong /></div><p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><CalendarRange className="size-4" aria-hidden="true" />{formatDate(statement.data.from)} through {formatDate(new Date(new Date(statement.data.to).getTime() - 1).toISOString())} · {statement.data.transactions.length} ledger row{statement.data.transactions.length === 1 ? '' : 's'}</p></div>}
  </SpCard>;
}

function StatementValue({ label, value, currency, strong = false }: { label: string; value: number; currency: string; strong?: boolean }) { return <div className={`rounded-xl border p-4 ${strong ? 'border-[#BBE8D3] bg-[#E8F7F0]' : 'border-border bg-[#F9FAFB]'}`}><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-2 text-lg font-semibold text-foreground">{money(value, currency)}</p></div>; }

function TransactionDrawer({ transaction, onOpenChange }: { transaction: FinancialTransaction | null; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={!!transaction} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto bg-white sm:max-w-md"><SheetHeader className="border-b border-border p-6"><SheetTitle className="font-heading text-xl text-foreground">Transaction details</SheetTitle><SheetDescription>Server-recorded ledger data. Payment state remains sandbox-backed.</SheetDescription></SheetHeader>{transaction && <div className="space-y-6 p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{words(transaction.transactionType)}</p><p className="mt-2 text-3xl font-semibold text-foreground">{money(transactionAmount(transaction), transaction.currency)}</p><SpStatusBadge tone={transactionTone(transaction.paymentStatus)} className="mt-3">{words(transaction.paymentStatus)}</SpStatusBadge></div><dl className="space-y-4"><Detail label="Gross amount" value={money(transaction.grossAmount, transaction.currency)} /><Detail label="Fixed platform commission" value={money(transaction.commissionAmount, transaction.currency)} /><Detail label="Net amount" value={money(transaction.netAmount, transaction.currency)} /><Detail label="Project reference" value={shortReference(transaction.engagementId)} /><Detail label="Milestone reference" value={shortReference(transaction.milestoneId)} /><Detail label="Recorded" value={formatDate(transaction.createdAt, true)} /><Detail label="Release timestamp" value={formatDate(transaction.releasedAt, true)} /><Detail label="Transaction reference" value={shortReference(transaction.id)} /></dl><SpMutationFeedback status="info">A “completed” or “released” status here represents the current STUB adapter and stored lifecycle—not confirmed real-money movement.</SpMutationFeedback></div>}</SheetContent></Sheet>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="border-b border-border pb-3"><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd></div>; }
