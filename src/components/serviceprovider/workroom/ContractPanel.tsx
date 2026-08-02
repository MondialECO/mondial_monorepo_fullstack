'use client';

import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SpCard, SpMutationFeedback, SpSectionHeader, SpStatusBadge } from '@/components/serviceprovider/ui';
import { useConfirmContract } from '@/hooks/queries/workroom';
import type { WorkroomDetail } from '@/types/workroom';
import { deliveryDayTypeLabel, deliveryStartRuleLabel, deliveryTimeUnitLabel, isHourlyPricing, pricingModelLabel } from '@/lib/workroom-format';
import { apiError, formatDate, money, words } from './_shared';

export function ContractPanel({ data, readOnly }: { data: WorkroomDetail; readOnly: boolean }) {
  const confirm = useConfirmContract();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const contract = data.contract;
  const terms = contract.terms;

  const recordConsent = async () => {
    setFeedback(null);
    try {
      await confirm.mutateAsync(data.engagement.id);
      setFeedback({ status: 'success', message: 'Your authenticated in-app consent was recorded.' });
      setDialogOpen(false);
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'Contract consent could not be recorded.') });
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <SpCard>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><SpSectionHeader title="Accepted commercial terms" description="Immutable snapshot created from the accepted proposal." /><SpStatusBadge tone={contract.status === 'Signed' ? 'positive' : contract.status === 'Voided' ? 'negative' : 'warning'}>{words(contract.status)}</SpStatusBadge></div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Term label="Contract value" value={money(terms.price, terms.currency)} />
              <Term label="Pricing model" value={pricingModelLabel(terms.pricingType)} />
              <Term label="Delivery duration" value={`${terms.deliveryTimeValue} ${deliveryTimeUnitLabel(terms.deliveryTimeUnit).toLocaleLowerCase()}`} />
              <Term label="Day calculation" value={deliveryDayTypeLabel(terms.deliveryDayType)} />
              <Term label="Delivery starts" value={deliveryStartRuleLabel(terms.deliveryStartRule)} />
              <Term label="Revision policy" value={terms.unlimitedRevisions ? 'Unlimited revisions' : `${terms.includedRevisionCount} included`} />
              <Term label="Revision request window" value={`${terms.revisionRequestWindowDays} days`} />
              <Term label="Parallel milestones" value={terms.allowsParallelMilestones ? 'Allowed' : 'Sequential approval required'} />
              {isHourlyPricing(terms.pricingType) && <Term label="Hourly terms" value={`${terms.hourlyRate == null ? 'Rate not set' : money(terms.hourlyRate, terms.currency)} · ${terms.weeklyHourLimit ?? 'No'} weekly hour limit`} />}
            </dl>
            <div className="mt-6"><p className="text-sm font-semibold text-[#171717]">Deliverables</p>{terms.deliverables.length ? <ul className="mt-3 space-y-2 text-sm text-[#374151]">{terms.deliverables.map((item) => <li key={item} className="rounded-lg bg-[#F9FAFB] px-4 py-3">{item}</li>)}</ul> : <p className="mt-2 text-sm text-[#6B7280]">No deliverables listed.</p>}</div>
          </SpCard>

          <SpCard>
            <SpSectionHeader title="Milestone schedule" description="Live due dates reflect approved extensions and pause/resume calculations." />
            <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-[#E5E7EB] text-xs uppercase tracking-[0.08em] text-[#6B7280]"><th className="px-3 py-3 font-semibold">Milestone</th><th className="px-3 py-3 font-semibold">Amount</th><th className="px-3 py-3 font-semibold">Due date</th></tr></thead><tbody>{data.milestones.map((item) => <tr key={item.id} className="border-b border-[#E5E7EB] last:border-0"><td className="px-3 py-4 font-semibold text-[#171717]">{item.title}</td><td className="px-3 py-4 text-[#374151]">{money(item.amount, item.currency)}</td><td className="px-3 py-4 text-[#374151]">{formatDate(item.dueDate)}</td></tr>)}</tbody></table></div>
          </SpCard>
        </div>

        <aside>
          <SpCard>
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#E8F7F0] text-[#157A55]"><ShieldCheck className="size-5" aria-hidden="true" /></span><h2 className="font-heading text-lg font-semibold text-[#171717]">Consent status</h2></div>
            <ol className="mt-6 space-y-5">
              <ConsentStep label="Contract created" complete />
              <ConsentStep label="Provider consent" complete={!!contract.providerSignedAt} date={contract.providerSignedAt} />
              <ConsentStep label="Client consent" complete={!!contract.clientSignedAt} date={contract.clientSignedAt} />
              <ConsentStep label="Both parties confirmed" complete={contract.status === 'Signed'} />
            </ol>
            {!readOnly && !contract.providerSignedAt && contract.status !== 'Voided' && <Button type="button" className="mt-6 w-full" onClick={() => setDialogOpen(true)}><ShieldCheck className="size-4" aria-hidden="true" /> Confirm terms</Button>}
          </SpCard>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Record your in-app consent?</DialogTitle><DialogDescription>This confirms that you accept the displayed immutable commercial terms. It is not a legal e-signature or signed document.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={confirm.isPending}>Cancel</Button><Button type="button" onClick={recordConsent} disabled={confirm.isPending}>{confirm.isPending ? 'Recording…' : 'I confirm these terms'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function Term({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#F9FAFB] p-4"><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[#171717]">{value}</dd></div>; }
function ConsentStep({ label, complete, date }: { label: string; complete: boolean; date?: string | null }) { return <li className="flex items-start gap-3"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-[#157A55] text-white' : 'bg-[#F3F4F6] text-[#9CA3AF]'}`}>{complete ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <span className="size-2 rounded-full bg-current" />}</span><div><p className={`text-sm font-semibold ${complete ? 'text-[#171717]' : 'text-[#6B7280]'}`}>{label}</p>{date && <p className="mt-1 text-xs text-[#6B7280]">{formatDate(date, true)}</p>}</div></li>; }
