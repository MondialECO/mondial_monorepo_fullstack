'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Copy, FileText, Pencil, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard,
  SpEmptyState,
  SpMutationFeedback,
  SpPage,
  SpPageHeader,
  SpSectionHeader,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import {
  useDuplicateProposal,
  useProposal,
  useReviewOrderRequest,
  useSubmitProposal,
  useWithdrawProposal,
} from '@/hooks/queries/leads';
import type { Proposal, ProposalVersion } from '@/types/leads';
import { safeHttpUrl } from '@/lib/service-provider/url-security';
import {
  apiError,
  expirationLabel,
  formatDate,
  formatEnum,
  money,
  proposalStatusTone,
} from './_shared';

type Confirmation = 'submit' | 'withdraw' | 'duplicate' | 'approve' | 'decline' | null;

export function ProposalDetail({
  id,
  onBack,
  onEdit,
  onOpen,
}: {
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onOpen: (id: string) => void;
}) {
  const query = useProposal(id);
  const submit = useSubmitProposal();
  const withdraw = useWithdrawProposal();
  const duplicate = useDuplicateProposal();
  const review = useReviewOrderRequest();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const pending = submit.isPending || withdraw.isPending || duplicate.isPending || review.isPending;

  if (query.isLoading) return <DetailSkeleton />;
  if (query.isError || !query.data) {
    return (
      <SpPage>
        <BackButton onClick={onBack} />
        <SpEmptyState icon={FileText} title="Proposal unavailable" description="The proposal could not be loaded." action={<Button type="button" variant="outline" onClick={() => query.refetch()}>Try again</Button>} />
      </SpPage>
    );
  }

  const proposal = query.data;
  const expiry = expirationLabel(proposal.expiresAt);
  const approvalRequired = proposal.status === 'Submitted' && proposal.acceptanceTrigger === 'ProviderApprovalRequired';

  const act = async () => {
    if (!confirmation) return;
    setFeedback(null);
    try {
      if (confirmation === 'submit') await submit.mutateAsync(proposal.id);
      if (confirmation === 'withdraw') await withdraw.mutateAsync(proposal.id);
      if (confirmation === 'approve') await review.mutateAsync({ id: proposal.id, accept: true });
      if (confirmation === 'decline') await review.mutateAsync({ id: proposal.id, accept: false });
      if (confirmation === 'duplicate') {
        const result = await duplicate.mutateAsync(proposal.id);
        setConfirmation(null);
        onOpen(result.id);
        return;
      }
      setFeedback({
        status: 'success',
        message: confirmation === 'submit' ? 'Proposal submitted.' : confirmation === 'withdraw' ? 'Proposal withdrawn.' : confirmation === 'approve' ? 'Order request approved. The client must now confirm the final terms.' : 'Order request declined.',
      });
      setConfirmation(null);
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The proposal action could not be completed.') });
      setConfirmation(null);
    }
  };

  return (
    <SpPage>
      <BackButton onClick={onBack} />
      <SpPageHeader
        title={proposal.title || 'Untitled proposal'}
        description={`Proposal version ${proposal.version} · Updated ${formatDate(proposal.updatedAt, true)}`}
        actions={<ProposalActions proposal={proposal} approvalRequired={approvalRequired} onEdit={onEdit} onConfirm={setConfirmation} />}
      />

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
      {approvalRequired && <SpMutationFeedback status="info">This package order needs your approval. Approval moves it to client confirmation; it does not move real money.</SpMutationFeedback>}
      {proposal.status === 'Accepted' && proposal.conversionStatus === 'AwaitingModule4' && <SpMutationFeedback status="info">Accepted and queued for Workroom conversion. Module 3 stops at this handoff.</SpMutationFeedback>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          <SpCard>
            <div className="flex flex-wrap items-center gap-2">
              <SpStatusBadge tone={proposalStatusTone(proposal.status)}>{formatEnum(proposal.status)}</SpStatusBadge>
              <SpStatusBadge>{formatEnum(proposal.proposalSource)}</SpStatusBadge>
              <SpStatusBadge tone={expiry.expired ? 'negative' : expiry.urgent ? 'warning' : 'neutral'}>{expiry.label}</SpStatusBadge>
            </div>
            <h2 className="mt-5 font-heading text-lg font-semibold text-[#171717]">Cover message</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4B5563]">{proposal.coverMessage || 'No cover message saved.'}</p>
          </SpCard>

          <SpCard>
            <SpSectionHeader title="Delivery terms" />
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Term label="Pricing" value={formatEnum(proposal.pricingType)} />
              {proposal.pricingType === 'Hourly' && <Term label="Weekly hour limit" value={proposal.weeklyHourLimit == null ? 'Not set' : `${proposal.weeklyHourLimit} hours`} />}
              <Term label="Delivery duration" value={`${proposal.deliveryTimeValue} ${formatEnum(proposal.deliveryTimeUnit).toLocaleLowerCase()}`} />
              <Term label="Day calculation" value={formatEnum(proposal.deliveryDayType)} />
              <Term label="Delivery starts" value={formatEnum(proposal.deliveryStartRule)} />
              <Term label="Revision policy" value={proposal.unlimitedRevisions ? 'Unlimited revisions' : `${proposal.includedRevisionCount} included`} />
              <Term label="Revision request window" value={`${proposal.revisionRequestWindowDays} days`} />
              <Term label="Requirements" value={formatEnum(proposal.requirementsStatus)} />
            </dl>
            {proposal.deliveryStartRule === 'AfterEscrowFunding' && <p className="mt-4 text-xs leading-5 text-[#6B7280]">Escrow funding currently uses the payment-gateway STUB; it is not real money movement.</p>}
          </SpCard>

          <ListCard title="Deliverables" values={proposal.deliverables} empty="No deliverables saved." />
          <MilestoneList proposal={proposal} />
          <ListCard title="Attachment references" values={proposal.attachments} empty="No attachment references saved." description="Stored references only. IFileSecurityScanner is a deterministic STUB; no real file scanning is available." linkHttpReferences />
          <VersionHistory versions={proposal.previousVersions} />
        </div>

        <aside className="space-y-6" aria-label="Proposal financial and status summary">
          <SpCard>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#E8F7F0] text-[#157A55]"><WalletCards className="size-5" aria-hidden="true" /></span>
              <div><h2 className="font-heading text-lg font-semibold text-[#171717]">Earnings preview</h2><p className="text-xs text-[#6B7280]">Server-authoritative</p></div>
            </div>
            <dl className="mt-6 space-y-4">
              <SummaryRow label="Gross price" value={money(proposal.earningsPreview.price, proposal.earningsPreview.currency)} />
              <SummaryRow label={`Fixed platform commission (${percent(proposal.earningsPreview.rate)})`} value={`−${money(proposal.earningsPreview.commission, proposal.earningsPreview.currency)}`} />
              <SummaryRow label="Net provider earnings" value={money(proposal.earningsPreview.net, proposal.earningsPreview.currency)} strong />
            </dl>
            <p className="mt-5 text-xs leading-5 text-[#6B7280]">Tier and Trust Score are ranking signals only and never change this rate.</p>
          </SpCard>

          <SpCard>
            <h2 className="font-heading text-lg font-semibold text-[#171717]">Status details</h2>
            <dl className="mt-5 space-y-4">
              <SummaryRow label="Acceptance mode" value={formatEnum(proposal.acceptanceMode)} />
              <SummaryRow label="Escrow status" value={`${formatEnum(proposal.escrowStatus)}${proposal.escrowStatus !== 'NotStarted' ? ' (STUB-backed)' : ''}`} />
              <SummaryRow label="Conversion" value={formatEnum(proposal.conversionStatus)} />
              <SummaryRow label="Submitted" value={formatDate(proposal.submittedAt, true)} />
              <SummaryRow label="Accepted" value={formatDate(proposal.acceptedAt, true)} />
            </dl>
            {proposal.status === 'ConvertedToProject' && <Button asChild variant="outline" className="mt-5 w-full"><Link href="/dashboard/serviceprovider/workroom?view=active">Open Workroom</Link></Button>}
          </SpCard>

          {proposal.warnings.length > 0 && <SpCard><h2 className="font-heading text-base font-semibold text-[#171717]">Warnings</h2><ul className="mt-3 space-y-2 text-sm text-[#965F11]">{proposal.warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></SpCard>}
        </aside>
      </div>

      <ConfirmationDialog kind={confirmation} pending={pending} onClose={() => setConfirmation(null)} onConfirm={act} />
    </SpPage>
  );
}

function ProposalActions({ proposal, approvalRequired, onEdit, onConfirm }: { proposal: Proposal; approvalRequired: boolean; onEdit: () => void; onConfirm: (kind: Exclude<Confirmation, null>) => void }) {
  if (approvalRequired) return <><Button type="button" variant="outline" onClick={() => onConfirm('decline')}>Decline request</Button><Button type="button" onClick={() => onConfirm('approve')}>Approve request</Button></>;
  if (proposal.status === 'Draft') return <><Button type="button" variant="outline" onClick={onEdit}><Pencil className="size-4" aria-hidden="true" /> Edit draft</Button><Button type="button" onClick={() => onConfirm('submit')}>Submit proposal</Button></>;
  if (proposal.status === 'ChangesRequested') return <Button type="button" onClick={onEdit}><Pencil className="size-4" aria-hidden="true" /> Prepare revision</Button>;
  if (proposal.status === 'Submitted') return <Button type="button" variant="outline" onClick={() => onConfirm('withdraw')}>Withdraw proposal</Button>;
  if (proposal.status === 'Expired') return <Button type="button" onClick={() => onConfirm('duplicate')}><Copy className="size-4" aria-hidden="true" /> Duplicate as draft</Button>;
  return null;
}

function MilestoneList({ proposal }: { proposal: Proposal }) {
  return (
    <SpCard>
      <SpSectionHeader title="Milestone plan" description={proposal.milestonePlan.length ? `${proposal.milestonePlan.length} proposed milestone${proposal.milestonePlan.length === 1 ? '' : 's'}` : 'No milestone plan was included.'} />
      {proposal.milestonePlan.length > 0 && <ol className="mt-5 space-y-4">{proposal.milestonePlan.map((item, index) => <li key={`${item.displayOrder}-${item.title}`} className="rounded-xl border border-[#E5E7EB] p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><p className="text-sm font-semibold text-[#171717]">{index + 1}. {item.title}</p><p className="mt-1 text-sm leading-6 text-[#6B7280]">{item.description || 'No description.'}</p></div><p className="shrink-0 text-sm font-semibold text-[#171717]">{money(item.amount, proposal.currency)}</p></div><p className="mt-3 text-xs text-[#6B7280]">Delivery: {item.deliveryTimeValue} {formatEnum(item.deliveryTimeUnit).toLocaleLowerCase()}</p></li>)}</ol>}
    </SpCard>
  );
}

function ListCard({ title, values, empty, description, linkHttpReferences = false }: { title: string; values: string[]; empty: string; description?: string; linkHttpReferences?: boolean }) {
  return <SpCard><SpSectionHeader title={title} description={description} />{values.length ? <ul className="mt-5 space-y-2 text-sm text-[#374151]">{values.map((value) => { const href = linkHttpReferences ? safeHttpUrl(value) : null; return <li key={value} className="rounded-lg bg-[#F9FAFB] px-4 py-3">{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">{value}</a> : value}</li>; })}</ul> : <p className="mt-5 text-sm text-[#6B7280]">{empty}</p>}</SpCard>;
}

function VersionHistory({ versions }: { versions: ProposalVersion[] }) {
  return (
    <SpCard>
      <SpSectionHeader title="Previous versions" description="Revision snapshots are preserved when a client-requested revision supersedes earlier terms." />
      {versions.length === 0 ? <p className="mt-5 text-sm text-[#6B7280]">No previous versions yet.</p> : (
        <div className="mt-5 space-y-3">{versions.map((version) => <details key={`${version.version}-${version.supersededAt}`} className="group rounded-xl border border-[#E5E7EB] p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"><span>Version {version.version}</span><span className="text-xs font-normal text-[#6B7280]">Superseded {formatDate(version.supersededAt, true)}</span></summary><div className="mt-4 border-t border-[#E5E7EB] pt-4"><p className="text-sm font-semibold text-[#171717]">{version.title}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#6B7280]">{version.coverMessage}</p><dl className="mt-4 grid gap-3 sm:grid-cols-2"><Term label="Gross price" value={money(version.proposedPrice, version.currency)} /><Term label="Delivery" value={`${version.deliveryTimeValue} ${formatEnum(version.deliveryTimeUnit).toLocaleLowerCase()}`} /><Term label="Revisions" value={version.unlimitedRevisions ? 'Unlimited' : String(version.includedRevisionCount)} /><Term label="Expiration" value={formatDate(version.expiresAt, true)} /></dl></div></details>)}</div>
      )}
    </SpCard>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#F9FAFB] p-4"><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[#171717]">{value}</dd></div>;
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex items-start justify-between gap-4 ${strong ? 'border-t border-[#E5E7EB] pt-4' : ''}`}><dt className="text-sm text-[#6B7280]">{label}</dt><dd className={`text-right text-sm ${strong ? 'font-semibold text-[#157A55]' : 'font-medium text-[#171717]'}`}>{value}</dd></div>;
}

function ConfirmationDialog({ kind, pending, onClose, onConfirm }: { kind: Confirmation; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!kind) return null;
  const copy = confirmationCopy[kind];
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{copy.title}</DialogTitle><DialogDescription>{copy.description}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button type="button" variant={kind === 'withdraw' || kind === 'decline' ? 'destructive' : 'default'} onClick={onConfirm} disabled={pending}>{pending ? 'Working…' : copy.action}</Button></DialogFooter></DialogContent></Dialog>;
}

const confirmationCopy = {
  submit: { title: 'Submit this proposal?', description: 'The client will receive the current draft. It becomes read-only unless changes are requested.', action: 'Submit proposal' },
  withdraw: { title: 'Withdraw this proposal?', description: 'Withdrawal is final for this proposal and cannot be undone.', action: 'Withdraw proposal' },
  duplicate: { title: 'Duplicate this expired proposal?', description: 'A new editable draft will be created with a fresh expiration date.', action: 'Create draft' },
  approve: { title: 'Approve this order request?', description: 'The client will still need to confirm final terms and the STUB-backed escrow authorization before acceptance.', action: 'Approve request' },
  decline: { title: 'Decline this order request?', description: 'The order request will be closed as declined.', action: 'Decline request' },
} as const;

function BackButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" variant="ghost" className="w-fit px-0 hover:bg-transparent" onClick={onClick}><ArrowLeft className="size-4" aria-hidden="true" /> Back to pipeline</Button>;
}

function DetailSkeleton() {
  return <SpPage aria-label="Loading proposal"><Skeleton className="h-10 w-40" /><Skeleton className="h-20 w-full" /><div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]"><Skeleton className="h-[620px] rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div></SpPage>;
}

function percent(rate: number) {
  return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 2 }).format(rate);
}
