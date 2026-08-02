'use client';

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { ArrowLeft, FileText, Plus, Trash2, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  SpCard,
  SpEmptyState,
  SpFormField,
  SpMutationFeedback,
  SpPage,
  SpPageHeader,
  SpSectionHeader,
  SpStatusBadge,
  SpTagInput,
} from '@/components/serviceprovider/ui';
import {
  useCreateProposal,
  useLeadBrief,
  useProposal,
  useReviseProposal,
  useSubmitProposal,
  useUpdateProposal,
} from '@/hooks/queries/leads';
import { useSpDirtyFormGuard } from '@/hooks/useSpDirtyFormGuard';
import { looksLikeUrlReference, safeHttpUrl } from '@/lib/service-provider/url-security';
import type { ClientBrief, Proposal, ProposalMilestone, UpsertProposalRequest } from '@/types/leads';
import {
  apiError,
  briefIsExpired,
  formatEnum,
  localDateTime,
  money,
  proposalIsExpired,
} from './_shared';

type ProposalForm = {
  title: string;
  coverMessage: string;
  proposedPrice: string;
  pricingType: string;
  weeklyHourLimit: string;
  deliveryTimeValue: string;
  deliveryTimeUnit: string;
  deliveryDayType: string;
  deliveryStartRule: string;
  includedRevisionCount: string;
  unlimitedRevisions: boolean;
  revisionRequestWindowDays: string;
  deliverables: string[];
  milestonePlan: ProposalMilestone[];
  attachments: string[];
  expiresAt: string;
};

const emptyForm = (): ProposalForm => ({
  title: '',
  coverMessage: '',
  proposedPrice: '',
  pricingType: 'FixedPrice',
  weeklyHourLimit: '',
  deliveryTimeValue: '1',
  deliveryTimeUnit: 'Weeks',
  deliveryDayType: 'BusinessDays',
  deliveryStartRule: 'AfterEscrowFunding',
  includedRevisionCount: '1',
  unlimitedRevisions: false,
  revisionRequestWindowDays: '7',
  deliverables: [],
  milestonePlan: [],
  attachments: [],
  expiresAt: localDateTime(7),
});

export function ProposalEditor({
  briefId,
  proposalId,
  onBack,
  onPersisted,
  onSubmitted,
}: {
  briefId?: string;
  proposalId?: string;
  onBack: () => void;
  onPersisted: (id: string) => void;
  onSubmitted: (id: string) => void;
}) {
  const proposalQuery = useProposal(proposalId ?? null);
  const linkedBriefId = proposalQuery.data?.clientBriefId ?? briefId ?? null;
  const briefQuery = useLeadBrief(linkedBriefId);
  const createProposal = useCreateProposal();
  const updateProposal = useUpdateProposal();
  const reviseProposal = useReviseProposal();
  const submitProposal = useSubmitProposal();
  const [form, setForm] = useState<ProposalForm>(emptyForm);
  const [savedProposal, setSavedProposal] = useState<Proposal | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error' | 'info'; message: string } | null>(null);
  const dirtyGuard = useSpDirtyFormGuard(form, { enabled: loadedKey !== null });
  const { markClean } = dirtyGuard;

  const proposal = proposalQuery.data;
  const brief = briefQuery.data;
  const revisionMode = proposal?.status === 'ChangesRequested';
  const editable = !proposal || proposal.status === 'Draft' || revisionMode;

  useEffect(() => {
    if (proposal && loadedKey !== `proposal:${proposal.id}:${proposal.version}`) {
      const next = formFromProposal(proposal);
      setForm(next);
      markClean(next);
      setSavedProposal(proposal);
      setLoadedKey(`proposal:${proposal.id}:${proposal.version}`);
      return;
    }
    if (!proposalId && brief && loadedKey !== `brief:${brief.id}`) {
      const next = formFromBrief(brief);
      setForm(next);
      markClean(next);
      setLoadedKey(`brief:${brief.id}`);
    }
  }, [brief, loadedKey, markClean, proposal, proposalId]);

  const errors = useMemo(() => validate(form), [form]);
  const isLoading = !!proposalId && proposalQuery.isLoading || !!linkedBriefId && briefQuery.isLoading;
  const isError = !!proposalId && proposalQuery.isError || !!linkedBriefId && briefQuery.isError;
  const isPending = createProposal.isPending || updateProposal.isPending || reviseProposal.isPending || submitProposal.isPending;
  const briefClosed = !!brief && (brief.status !== 'Open' || briefIsExpired(brief));
  const proposalExpired = !!proposal && proposalIsExpired(proposal);
  const price = Number(form.proposedPrice || 0);
  const budgetWarning = !!brief && price > 0 && (price < brief.budgetMinimum || price > brief.budgetMaximum);
  const previewCurrent = !!savedProposal && savedProposal.proposedPrice === price && savedProposal.currency === (brief?.currency ?? savedProposal.currency);

  const payload = (): UpsertProposalRequest => ({
    clientBriefId: proposal?.clientBriefId ?? brief?.id ?? null,
    clientId: proposal?.clientId ?? brief?.clientId ?? null,
    serviceId: proposal?.serviceId ?? null,
    packageId: proposal?.packageId ?? null,
    proposalSource: proposal?.proposalSource ?? 'StandardProposal',
    title: form.title.trim(),
    coverMessage: form.coverMessage.trim(),
    proposedPrice: numberValue(form.proposedPrice),
    currency: brief?.currency ?? proposal?.currency ?? 'EUR',
    pricingType: form.pricingType,
    weeklyHourLimit: form.pricingType === 'Hourly' ? numberValue(form.weeklyHourLimit) : null,
    deliveryTimeValue: numberValue(form.deliveryTimeValue),
    deliveryTimeUnit: form.deliveryTimeUnit,
    deliveryDayType: form.deliveryDayType,
    deliveryStartRule: form.deliveryStartRule,
    includedRevisionCount: numberValue(form.includedRevisionCount),
    unlimitedRevisions: form.unlimitedRevisions,
    confirmUnlimitedRevisions: form.unlimitedRevisions,
    revisionRequestWindowDays: numberValue(form.revisionRequestWindowDays),
    deliverables: form.deliverables,
    milestonePlan: form.milestonePlan.map((item, index) => ({ ...item, displayOrder: index })),
    attachments: form.attachments,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
  });

  const saveDraft = async () => {
    setFeedback(null);
    try {
      const result = proposal
        ? await updateProposal.mutateAsync({ id: proposal.id, payload: payload() })
        : await createProposal.mutateAsync(payload());
      setSavedProposal(result);
      markClean(form);
      setFeedback({ status: 'success', message: 'Proposal draft saved. The earnings preview was refreshed by the server.' });
      onPersisted(result.id);
      return result;
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The proposal draft could not be saved.') });
      return null;
    }
  };

  const confirmSubmit = async () => {
    setFeedback(null);
    try {
      let result: Proposal;
      if (revisionMode && proposal) {
        result = await reviseProposal.mutateAsync({ id: proposal.id, payload: payload() });
      } else {
        const draft = proposal
          ? await updateProposal.mutateAsync({ id: proposal.id, payload: payload() })
          : await createProposal.mutateAsync(payload());
        result = await submitProposal.mutateAsync(draft.id);
      }
      setConfirmOpen(false);
      markClean(form);
      onSubmitted(result.id);
    } catch (error) {
      setConfirmOpen(false);
      setFeedback({ status: 'error', message: apiError(error, revisionMode ? 'The revision could not be submitted.' : 'The proposal could not be submitted.') });
    }
  };

  if (isLoading) return <EditorSkeleton />;
  if (isError || proposalId && !proposal || linkedBriefId && !brief) {
    return (
      <SpPage>
        <BackButton onClick={onBack} />
        <SpEmptyState
          icon={FileText}
          title="Proposal editor unavailable"
          description="The proposal or its client brief could not be loaded."
          action={<Button type="button" variant="outline" onClick={() => { proposalQuery.refetch(); briefQuery.refetch(); }}>Try again</Button>}
        />
      </SpPage>
    );
  }

  if (!editable) {
    return (
      <SpPage>
        <BackButton onClick={onBack} />
        <SpEmptyState icon={FileText} title="This proposal is read-only" description={`A ${formatEnum(proposal?.status ?? '')} proposal cannot be edited.`} action={<Button type="button" variant="outline" onClick={onBack}>View proposal</Button>} />
      </SpPage>
    );
  }

  const submitDisabled = isPending || Object.keys(errors).length > 0 || briefClosed || proposalExpired;

  return (
    <SpPage>
      <BackButton onClick={() => dirtyGuard.confirmDiscard(onBack)} />
      <SpPageHeader
        title={revisionMode ? 'Revise proposal' : proposal ? 'Edit proposal draft' : 'Create proposal'}
        description={brief ? `For ${brief.title}` : 'Prepare clear commercial terms for the client.'}
        actions={proposal && <SpStatusBadge tone={revisionMode ? 'warning' : 'neutral'}>{formatEnum(proposal.status)} · Version {proposal.version}</SpStatusBadge>}
      />

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
      {(briefClosed || proposalExpired) && <SpMutationFeedback status="error">This client brief is no longer accepting proposal changes.</SpMutationFeedback>}
      {revisionMode && <SpMutationFeedback status="info">Submitting this revision preserves the current proposal as a previous version.</SpMutationFeedback>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <SpCard>
            <SpSectionHeader title="Proposal introduction" description="Write a clear, personal introduction describing your approach and relevant experience." />
            <div className="mt-6 space-y-5">
              <SpFormField id="proposal-title" label="Proposal title" required error={errors.title}>
                <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} maxLength={160} />
              </SpFormField>
              <SpFormField id="proposal-cover" label="Cover message" required error={errors.coverMessage} description="Explain your approach, relevant experience, and any assumptions.">
                <Textarea value={form.coverMessage} onChange={(event) => setForm((current) => ({ ...current, coverMessage: event.target.value }))} rows={8} maxLength={5000} />
              </SpFormField>
            </div>
          </SpCard>

          <SpCard>
            <SpSectionHeader title="Commercial terms" description="Currency is fixed to the client brief. Gross price and net earnings are distinct." />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <SpFormField id="proposal-price" label="Gross proposed price" required error={errors.proposedPrice} description={brief ? `Client budget: ${money(brief.budgetMinimum, brief.currency)} – ${money(brief.budgetMaximum, brief.currency)}` : undefined}>
                <Input type="number" min={0} step="0.01" value={form.proposedPrice} onChange={(event) => setForm((current) => ({ ...current, proposedPrice: event.target.value }))} />
              </SpFormField>
              <SpFormField id="proposal-pricing" label="Pricing model" required>
                <Select value={form.pricingType} onChange={(value) => setForm((current) => ({ ...current, pricingType: value }))}>
                  <option value="FixedPrice">Fixed price</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Retainer">Retainer</option>
                </Select>
              </SpFormField>
              {form.pricingType === 'Hourly' && (
                <SpFormField id="proposal-hours" label="Weekly hour limit" required error={errors.weeklyHourLimit}>
                  <Input type="number" min={0} step="0.5" value={form.weeklyHourLimit} onChange={(event) => setForm((current) => ({ ...current, weeklyHourLimit: event.target.value }))} />
                </SpFormField>
              )}
              <SpFormField id="proposal-expiry" label="Proposal expires" required error={errors.expiresAt}>
                <Input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} />
              </SpFormField>
            </div>
            {budgetWarning && <SpMutationFeedback status="info" className="mt-5">Your proposed price is outside the client’s published budget. You may still save it, but the server will return the same warning.</SpMutationFeedback>}
          </SpCard>

          <SpCard>
            <SpSectionHeader title="Delivery and revisions" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <SpFormField id="delivery-value" label="Delivery duration" required error={errors.deliveryTimeValue}>
                <Input type="number" min={1} value={form.deliveryTimeValue} onChange={(event) => setForm((current) => ({ ...current, deliveryTimeValue: event.target.value }))} />
              </SpFormField>
              <SpFormField id="delivery-unit" label="Duration unit" required>
                <Select value={form.deliveryTimeUnit} onChange={(value) => setForm((current) => ({ ...current, deliveryTimeUnit: value }))}>
                  <option value="Hours">Hours</option><option value="Days">Days</option><option value="Weeks">Weeks</option>
                </Select>
              </SpFormField>
              <SpFormField id="delivery-days" label="Day calculation" required>
                <Select value={form.deliveryDayType} onChange={(value) => setForm((current) => ({ ...current, deliveryDayType: value }))}>
                  <option value="BusinessDays">Business days</option><option value="CalendarDays">Calendar days</option>
                </Select>
              </SpFormField>
              <SpFormField id="delivery-start" label="Delivery starts" required description={form.deliveryStartRule === 'AfterEscrowFunding' ? 'Escrow funding is currently backed by the payment-gateway STUB, not real money movement.' : undefined}>
                <Select value={form.deliveryStartRule} onChange={(value) => setForm((current) => ({ ...current, deliveryStartRule: value }))}>
                  <option value="AfterOrderConfirmation">After order confirmation</option>
                  <option value="AfterEscrowFunding">After escrow funding (STUB-backed)</option>
                  <option value="AfterClientRequirementsComplete">After requirements are complete</option>
                  <option value="AfterProviderStarts">After provider starts</option>
                </Select>
              </SpFormField>
              <SpFormField id="included-revisions" label="Included revisions" required error={errors.includedRevisionCount}>
                <Input type="number" min={0} value={form.includedRevisionCount} disabled={form.unlimitedRevisions} onChange={(event) => setForm((current) => ({ ...current, includedRevisionCount: event.target.value }))} />
              </SpFormField>
              <SpFormField id="revision-window" label="Revision request window (days)" required error={errors.revisionRequestWindowDays}>
                <Input type="number" min={0} value={form.revisionRequestWindowDays} onChange={(event) => setForm((current) => ({ ...current, revisionRequestWindowDays: event.target.value }))} />
              </SpFormField>
            </div>
            <label className="mt-5 flex items-start gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm text-[#374151]">
              <input type="checkbox" checked={form.unlimitedRevisions} onChange={(event) => setForm((current) => ({ ...current, unlimitedRevisions: event.target.checked }))} className="mt-0.5 size-4 accent-[#3C61DD]" />
              <span><strong className="block text-[#171717]">Offer unlimited revisions</strong>I understand this removes the numeric revision limit and requires explicit confirmation.</span>
            </label>
          </SpCard>

          <SpCard>
            <SpTagInput id="proposal-deliverables" label="Deliverables" required value={form.deliverables} onChange={(deliverables) => setForm((current) => ({ ...current, deliverables }))} placeholder="Add a deliverable" description="Press Enter or comma after each deliverable." />
            {errors.deliverables && <p className="mt-2 text-xs font-medium text-[#B42318]" role="alert">{errors.deliverables}</p>}
          </SpCard>

          <MilestoneEditor form={form} setForm={setForm} />

          <SpCard>
            <SpTagInput id="proposal-attachments" label="Attachment references" value={form.attachments} onChange={(attachments) => setForm((current) => ({ ...current, attachments }))} placeholder="Add a secure file reference or URL" description="HTTP(S) references open as links. The current contract stores string references only; file upload and real malware scanning are unavailable, and IFileSecurityScanner is a deterministic STUB." error={errors.attachments} validateItem={(value) => looksLikeUrlReference(value) && !safeHttpUrl(value) ? 'URL references must begin with http:// or https://.' : null} />
          </SpCard>
        </div>

        <aside className="space-y-6" aria-label="Proposal summary">
          <SpCard className="xl:sticky xl:top-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#E8F7F0] text-[#157A55]"><WalletCards className="size-5" aria-hidden="true" /></span>
              <div><h2 className="font-heading text-lg font-semibold text-[#171717]">Earnings preview</h2><p className="text-xs text-[#6B7280]">Calculated by the backend</p></div>
            </div>
            {savedProposal && previewCurrent ? (
              <ProposalEarningsPreview preview={savedProposal.earningsPreview} />
            ) : (
              <p className="mt-5 rounded-xl bg-[#F9FAFB] p-4 text-sm leading-6 text-[#6B7280]">Save the draft to receive a current, server-authoritative commission and net-earnings preview.</p>
            )}
            {savedProposal?.warnings.map((warning) => <SpMutationFeedback key={warning} status="info" className="mt-4">{warning}</SpMutationFeedback>)}
            <p className="mt-5 text-xs leading-5 text-[#6B7280]">Tier and Trust Score do not affect commission, pricing, or payouts.</p>
          </SpCard>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse justify-end gap-3 border-t border-[#E5E7EB] bg-[#F4F5F7]/95 py-4 backdrop-blur sm:flex-row">
        <Button type="button" variant="outline" onClick={() => dirtyGuard.confirmDiscard(onBack)} disabled={isPending}>Cancel</Button>
        {!revisionMode && <Button type="button" variant="outline" onClick={saveDraft} disabled={isPending || briefClosed || proposalExpired}>{isPending ? 'Saving…' : 'Save draft'}</Button>}
        <Button type="button" onClick={() => setConfirmOpen(true)} disabled={submitDisabled}>{isPending ? 'Submitting…' : revisionMode ? 'Submit revision' : 'Submit proposal'}</Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{revisionMode ? 'Submit this revision?' : 'Submit this proposal?'}</DialogTitle>
            <DialogDescription>{revisionMode ? 'The current version will be preserved in version history and this revision will return to the client.' : 'The client will receive these terms. Submitted proposals cannot be edited unless the client requests changes.'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>Keep editing</Button>
            <Button type="button" onClick={confirmSubmit} disabled={submitDisabled}>{isPending ? 'Submitting…' : revisionMode ? 'Submit revision' : 'Submit proposal'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SpPage>
  );
}

function MilestoneEditor({ form, setForm }: { form: ProposalForm; setForm: Dispatch<SetStateAction<ProposalForm>> }) {
  const update = (index: number, patch: Partial<ProposalMilestone>) => setForm((current) => ({
    ...current,
    milestonePlan: current.milestonePlan.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
  }));
  const add = () => setForm((current) => ({
    ...current,
    milestonePlan: [...current.milestonePlan, { title: '', description: '', amount: 0, deliveryTimeValue: 1, deliveryTimeUnit: 'Weeks', displayOrder: current.milestonePlan.length }],
  }));
  const remove = (index: number) => setForm((current) => ({ ...current, milestonePlan: current.milestonePlan.filter((_, itemIndex) => itemIndex !== index) }));

  return (
    <SpCard>
      <SpSectionHeader title="Milestone plan" description="Optional. Amounts describe the proposed payment schedule." action={<Button type="button" size="sm" variant="outline" onClick={add}><Plus className="size-4" aria-hidden="true" /> Add milestone</Button>} />
      {form.milestonePlan.length === 0 ? <p className="mt-5 rounded-xl bg-[#F9FAFB] p-4 text-sm text-[#6B7280]">No milestones added. Module 4 creates a single fallback milestone if an accepted proposal has no plan.</p> : (
        <div className="mt-5 space-y-4">
          {form.milestonePlan.map((item, index) => (
            <fieldset key={index} className="rounded-xl border border-[#E5E7EB] p-4">
              <legend className="px-2 text-sm font-semibold text-[#171717]">Milestone {index + 1}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <SpFormField id={`milestone-${index}-title`} label="Title" required><Input value={item.title} onChange={(event) => update(index, { title: event.target.value })} /></SpFormField>
                <SpFormField id={`milestone-${index}-amount`} label="Amount" required><Input type="number" min={0} step="0.01" value={item.amount} onChange={(event) => update(index, { amount: Number(event.target.value) })} /></SpFormField>
                <SpFormField id={`milestone-${index}-description`} label="Description" className="sm:col-span-2"><Textarea value={item.description} onChange={(event) => update(index, { description: event.target.value })} rows={3} /></SpFormField>
                <SpFormField id={`milestone-${index}-duration`} label="Delivery duration" required><Input type="number" min={1} value={item.deliveryTimeValue} onChange={(event) => update(index, { deliveryTimeValue: Number(event.target.value) })} /></SpFormField>
                <SpFormField id={`milestone-${index}-unit`} label="Duration unit" required><Select value={item.deliveryTimeUnit} onChange={(value) => update(index, { deliveryTimeUnit: value })}><option value="Hours">Hours</option><option value="Days">Days</option><option value="Weeks">Weeks</option></Select></SpFormField>
              </div>
              <Button type="button" size="sm" variant="ghost" className="mt-3 text-[#B42318]" onClick={() => remove(index)}><Trash2 className="size-4" aria-hidden="true" /> Remove milestone</Button>
            </fieldset>
          ))}
        </div>
      )}
    </SpCard>
  );
}

function formFromBrief(brief: ClientBrief): ProposalForm {
  return { ...emptyForm(), title: brief.title, proposedPrice: String(brief.budgetMinimum || ''), pricingType: brief.pricingType || 'FixedPrice' };
}

function formFromProposal(proposal: Proposal): ProposalForm {
  return {
    title: proposal.title,
    coverMessage: proposal.coverMessage,
    proposedPrice: String(proposal.proposedPrice),
    pricingType: proposal.pricingType,
    weeklyHourLimit: proposal.weeklyHourLimit == null ? '' : String(proposal.weeklyHourLimit),
    deliveryTimeValue: String(proposal.deliveryTimeValue),
    deliveryTimeUnit: proposal.deliveryTimeUnit,
    deliveryDayType: proposal.deliveryDayType,
    deliveryStartRule: proposal.deliveryStartRule,
    includedRevisionCount: String(proposal.includedRevisionCount),
    unlimitedRevisions: proposal.unlimitedRevisions,
    revisionRequestWindowDays: String(proposal.revisionRequestWindowDays),
    deliverables: [...proposal.deliverables],
    milestonePlan: proposal.milestonePlan.map((item) => ({ ...item })),
    attachments: [...proposal.attachments],
    expiresAt: proposal.expiresAt ? toLocalInput(proposal.expiresAt) : localDateTime(7),
  };
}

function validate(form: ProposalForm) {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = 'Enter a proposal title.';
  if (!form.coverMessage.trim()) errors.coverMessage = 'Enter a cover message.';
  if (numberValue(form.proposedPrice) <= 0) errors.proposedPrice = 'Enter a price greater than zero.';
  if (form.pricingType === 'Hourly' && numberValue(form.weeklyHourLimit) <= 0) errors.weeklyHourLimit = 'Enter a weekly hour limit.';
  const unsafeAttachment = form.attachments.find((value) => looksLikeUrlReference(value) && !safeHttpUrl(value));
  if (unsafeAttachment) errors.attachments = `“${unsafeAttachment}” is not a safe HTTP(S) URL.`;
  if (numberValue(form.deliveryTimeValue) <= 0) errors.deliveryTimeValue = 'Enter a delivery duration.';
  if (numberValue(form.includedRevisionCount) < 0) errors.includedRevisionCount = 'Revision count cannot be negative.';
  if (numberValue(form.revisionRequestWindowDays) < 0) errors.revisionRequestWindowDays = 'Revision window cannot be negative.';
  if (!form.expiresAt || new Date(form.expiresAt).getTime() <= Date.now()) errors.expiresAt = 'Choose a future expiration date.';
  if (form.deliverables.length === 0) errors.deliverables = 'Add at least one deliverable.';
  return errors;
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">{children}</select>;
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex items-start justify-between gap-4 ${strong ? 'border-t border-[#E5E7EB] pt-4' : ''}`}><dt className="text-sm text-[#6B7280]">{label}</dt><dd className={`text-right text-sm ${strong ? 'font-semibold text-[#157A55]' : 'font-medium text-[#171717]'}`}>{value}</dd></div>;
}

export function ProposalEarningsPreview({ preview }: { preview: Proposal['earningsPreview'] }) {
  return <dl className="mt-6 space-y-4">
    <SummaryRow label="Gross price" value={money(preview.price, preview.currency)} />
    <SummaryRow label={`Fixed platform commission (${percent(preview.rate)})`} value={`−${money(preview.commission, preview.currency)}`} />
    <SummaryRow label="Net provider earnings" value={money(preview.net, preview.currency)} strong />
  </dl>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" variant="ghost" className="w-fit px-0 hover:bg-transparent" onClick={onClick}><ArrowLeft className="size-4" aria-hidden="true" /> Back</Button>;
}

function EditorSkeleton() {
  return <SpPage aria-label="Loading proposal editor"><Skeleton className="h-10 w-32" /><Skeleton className="h-20 w-full" /><div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]"><Skeleton className="h-[720px] rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></div></SpPage>;
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(rate: number) {
  return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 2 }).format(rate);
}

function toLocalInput(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
