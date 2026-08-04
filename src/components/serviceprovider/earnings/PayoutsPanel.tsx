'use client';

// Fully token-driven as of the Earnings visual redesign — no hex literals remain on this
// file. Greens use --success-light / --success-strong; the latter was added because
// --success-text is 2.80:1 on --success-light and fails AA. See globals.css.
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, BanknoteArrowDown, CreditCard, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRequestPayout } from '@/hooks/queries/workroom';
import { SpCard, SpEmptyState, SpFormField, SpMetricCard, SpMutationFeedback, SpSectionHeader, SpStatusBadge } from '@/components/serviceprovider/ui';
import { apiError, formatDate, money, words } from '@/components/serviceprovider/workroom/_shared';
import type { FinancialSummary } from '@/types/workroom';
import { transactionTone } from './_shared';

export function PayoutsPanel({ data, currency }: { data: FinancialSummary; currency: string }) {
  const payout = useRequestPayout();
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState(data.settings.defaultPayoutMethodId ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  useEffect(() => {
    if (!data.settings.payoutMethods.some((method) => method.id === methodId && method.verified)) setMethodId(data.settings.defaultPayoutMethodId ?? data.settings.payoutMethods.find((method) => method.verified)?.id ?? '');
  }, [data.settings.defaultPayoutMethodId, data.settings.payoutMethods, methodId]);

  const numericAmount = Number(amount);
  const selectedMethod = data.settings.payoutMethods.find((method) => method.id === methodId);
  const validation = useMemo(() => {
    if (data.settings.accountOnHold) return 'Payout requests are disabled while the account is on hold.';
    if (!selectedMethod?.verified) return 'Select a verified payout method.';
    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) return 'Enter a payout amount.';
    if (numericAmount < data.settings.minimumPayoutAmount) return `Minimum request is ${money(data.settings.minimumPayoutAmount, currency)}.`;
    if (numericAmount > data.available) return 'The request exceeds the available balance.';
    return null;
  }, [amount, currency, data.available, data.settings.accountOnHold, data.settings.minimumPayoutAmount, numericAmount, selectedMethod]);

  const submit = async () => {
    if (validation) return;
    setFeedback(null);
    try {
      const result = await payout.mutateAsync({ amount: numericAmount, currency, payoutMethodId: methodId });
      setFeedback({ status: 'success', message: `Payout request recorded with status “${words(result.status)}”.` });
      setAmount(''); setConfirmOpen(false);
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The payout request failed. Funds remain in the recorded available balance; review the details and try again.') });
      setConfirmOpen(false);
    }
  };

  return <div className="space-y-6">
    {data.settings.accountOnHold && <SpMutationFeedback status="error"><strong>Account hold active.</strong> New payout requests are blocked by the backend until the account review is resolved.</SpMutationFeedback>}
    {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
      <SpCard>
        <SpSectionHeader title="Request a payout" description="Request a payout to a verified destination." />
        {/* Available balance is deliberately NOT repeated here. It is the hero card at the
            top of this page, visible on this tab, and the confirm dialog restates it at the
            moment it matters ("Available before request"). A third copy mid-form added no
            information and gave the page three places to disagree. */}
        <div className="mt-6"><SpMetricCard className="min-h-0" label={`Minimum payout (${currency})`} value={money(data.settings.minimumPayoutAmount, currency)} detail="Requests below this are rejected by the backend" icon={BanknoteArrowDown} /></div>
        {data.settings.payoutMethods.length === 0 ? <SpEmptyState className="mt-5 border-0 bg-muted/40" icon={CreditCard} title="No payout method" description="Add a masked payout method in Financial Settings before requesting a payout." /> : <div className="mt-6 space-y-5">
          <SpFormField id="payout-amount" label={`Requested amount (${currency})`} description="The backend validates the minimum, available balance, account hold and active-payout rules." error={amount ? validation : null} required><Input type="number" min={data.settings.minimumPayoutAmount} max={data.available} step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></SpFormField>
          <SpFormField id="payout-method" label="Payout method" required><select value={methodId} onChange={(event) => setMethodId(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Select a verified method</option>{data.settings.payoutMethods.map((method) => <option key={method.id} value={method.id} disabled={!method.verified}>{method.displayName} · {method.maskedDescriptor}{method.id === data.settings.defaultPayoutMethodId ? ' · Default' : ''}{!method.verified ? ' · Unverified' : ''}</option>)}</select></SpFormField>
          <Button type="button" disabled={!!validation || payout.isPending} onClick={() => setConfirmOpen(true)}>Review payout request</Button>
        </div>}
        <p className="mt-5 text-xs leading-5 text-muted-foreground">No daily clearing, instant withdrawal, guaranteed completion time, bank transfer or Stripe Connect movement is promised by this screen.</p>
      </SpCard>

      <SpCard>
        <SpSectionHeader title="Selected method" description="Only masked account descriptors are returned to this workspace." />
        {selectedMethod ? <div className="mt-6 rounded-xl border border-border bg-muted/40 p-5"><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary"><CreditCard className="size-5" aria-hidden="true" /></span><SpStatusBadge tone={selectedMethod.verified ? 'positive' : 'warning'}>{selectedMethod.verified ? 'Verified by STUB' : 'Unverified'}</SpStatusBadge></div><p className="mt-5 text-base font-semibold text-foreground">{selectedMethod.displayName}</p><p className="mt-1 text-sm text-muted-foreground">{words(selectedMethod.rail)} · {selectedMethod.maskedDescriptor}</p>{selectedMethod.id === data.settings.defaultPayoutMethodId && <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-success-strong"><BadgeCheck className="size-4" aria-hidden="true" />Default payout method</p>}</div> : <SpEmptyState className="mt-5 min-h-48 border-0 bg-muted/40" icon={AlertTriangle} title="Choose a method" description="Select a verified payout method to review its masked details." />}
      </SpCard>
    </div>

    <SpCard>
      <SpSectionHeader title="Payout history" description="Requested, processing, completed, failed, cancelled and on-hold records remain distinguishable." action={<History className="size-5 text-primary" aria-hidden="true" />} />
      {data.payouts.length === 0 ? <SpEmptyState className="mt-5 border-0 bg-muted/40" icon={BanknoteArrowDown} title="No payout history" description="Payout records will appear here after the first confirmed request." /> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground"><th className="px-3 py-3 font-semibold">Requested</th><th className="px-3 py-3 font-semibold">Method</th><th className="px-3 py-3 text-right font-semibold">Amount</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Completed</th></tr></thead><tbody>{data.payouts.map((item) => { const method = data.settings.payoutMethods.find((candidate) => candidate.id === item.payoutMethodId); return <tr key={item.id} className="border-b border-border last:border-0"><td className="px-3 py-4 text-foreground">{formatDate(item.createdAt, true)}</td><td className="px-3 py-4 text-foreground">{method ? `${method.displayName} · ${method.maskedDescriptor}` : 'Removed method'}</td><td className="px-3 py-4 text-right font-semibold tabular-nums text-foreground">{money(item.amount, item.currency)}</td><td className="px-3 py-4"><SpStatusBadge tone={transactionTone(item.status)}>{words(item.status)}</SpStatusBadge></td><td className="px-3 py-4 text-muted-foreground">{formatDate(item.completedAt, true)}</td></tr>; })}</tbody></table></div>}
    </SpCard>

    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent><DialogHeader><DialogTitle>Confirm payout request</DialogTitle><DialogDescription>Review the amount and masked destination before confirming.</DialogDescription></DialogHeader><dl className="space-y-3 rounded-xl bg-muted/40 p-4"><ConfirmRow label="Amount" value={money(numericAmount || 0, currency)} /><ConfirmRow label="Method" value={selectedMethod ? `${selectedMethod.displayName} · ${selectedMethod.maskedDescriptor}` : 'Not selected'} /><ConfirmRow label="Available before request" value={money(data.available, currency)} /></dl>{validation && <SpMutationFeedback status="error">{validation}</SpMutationFeedback>}<DialogFooter><Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={payout.isPending}>Cancel</Button><Button type="button" onClick={submit} disabled={!!validation || payout.isPending}>{payout.isPending ? 'Processing…' : 'Confirm request'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function ConfirmRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-right text-sm font-semibold text-foreground">{value}</dd></div>; }
