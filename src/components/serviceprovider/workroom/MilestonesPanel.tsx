'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, FileUp, Play, ShieldAlert } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  SpCard,
  SpFormField,
  SpMutationFeedback,
  SpSectionHeader,
  SpStatusBadge,
  SpTagInput,
} from '@/components/serviceprovider/ui';
import {
  useActivateMilestone,
  useOpenDispute,
  useRequestExtension,
  useStartRevision,
  useSubmitDeliverable,
  useUploadWorkroomFile,
} from '@/hooks/queries/workroom';
import type { Milestone, SubmitDeliverablePayload, WorkroomDetail } from '@/types/workroom';
import {
  apiError,
  canOpenDispute,
  formatDate,
  milestoneTone,
  money,
  relativeDue,
  words,
} from './_shared';

type Confirmation = 'activate' | 'revision' | null;

export function MilestonesPanel({ data, selectedId, onSelect, readOnly }: { data: WorkroomDetail; selectedId: string | null; onSelect: (id: string) => void; readOnly: boolean }) {
  const fallback = data.milestones.find((item) => item.id === data.engagement.currentMilestoneId) ?? data.milestones.find((item) => !['Paid', 'Cancelled'].includes(item.status)) ?? data.milestones[0];
  const selected = data.milestones.find((item) => item.id === selectedId) ?? fallback;

  if (!selected) return <SpCard><SpSectionHeader title="Milestones" description="No milestone plan exists for this project." /></SpCard>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.6fr)]">
      <aside aria-label="Project milestones" className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-[#171717]">Milestones</h2>
        {data.milestones.map((item, index) => (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)} aria-current={selected.id === item.id ? 'true' : undefined} className={`w-full rounded-2xl border bg-white p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#3C61DD] ${selected.id === item.id ? 'border-[#3C61DD] ring-1 ring-[#3C61DD]' : 'border-[#E5E7EB] hover:border-[#CAD4FA]'}`}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#6B7280]">Milestone {index + 1}</p><p className="mt-1 text-sm font-semibold text-[#171717]">{item.title}</p></div><SpStatusBadge tone={milestoneTone(item.status)}>{words(item.status)}</SpStatusBadge></div>
            <p className="mt-3 text-xs text-[#6B7280]">{money(item.amount, item.currency)} · {formatDate(item.dueDate)}</p>
          </button>
        ))}
      </aside>
      <MilestoneDetail data={data} milestone={selected} readOnly={readOnly} />
    </div>
  );
}

function MilestoneDetail({ data, milestone, readOnly }: { data: WorkroomDetail; milestone: Milestone; readOnly: boolean }) {
  const activate = useActivateMilestone();
  const startRevision = useStartRevision();
  const extension = useRequestExtension();
  const dispute = useOpenDispute();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [extensionForm, setExtensionForm] = useState({ days: '1', reason: '' });
  const [disputeReason, setDisputeReason] = useState('');
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const revision = data.revisionRequests.find((item) => item.milestoneId === milestone.id && ['Submitted', 'InProgress'].includes(item.revisionRequestStatus));
  const due = relativeDue(milestone.dueDate);
  const canDeliver = ['Active', 'SubmissionDraft', 'RevisionInProgress'].includes(milestone.status);
  const pending = activate.isPending || startRevision.isPending || extension.isPending || dispute.isPending;

  const confirm = async () => {
    if (!confirmation) return;
    setFeedback(null);
    try {
      if (confirmation === 'activate') await activate.mutateAsync(milestone.id);
      if (confirmation === 'revision' && revision) await startRevision.mutateAsync(revision.id);
      setFeedback({ status: 'success', message: confirmation === 'activate' ? 'Milestone activated. The backend started its delivery clock.' : 'Revision work started.' });
      setConfirmation(null);
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The milestone action could not be completed.') });
      setConfirmation(null);
    }
  };

  const requestExtension = async () => {
    setFeedback(null);
    try {
      await extension.mutateAsync({ id: milestone.id, days: Number(extensionForm.days), reason: extensionForm.reason.trim() });
      setFeedback({ status: 'success', message: 'Extension requested. The due date remains unchanged until the client approves it.' });
      setExtensionOpen(false);
      setExtensionForm({ days: '1', reason: '' });
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The extension request could not be sent.') });
    }
  };

  const openDispute = async () => {
    setFeedback(null);
    try {
      await dispute.mutateAsync({ id: milestone.id, reason: disputeReason.trim() });
      setFeedback({ status: 'success', message: 'Dispute opened for support review. The STUB-backed payment state is on hold.' });
      setDisputeOpen(false);
      setDisputeReason('');
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The dispute could not be opened.') });
    }
  };

  return (
    <div className="space-y-5">
      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
      <SpCard>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div><div className="flex flex-wrap items-center gap-2"><SpStatusBadge tone={milestoneTone(milestone.status)}>{words(milestone.status)}</SpStatusBadge><SpStatusBadge tone={due.urgent ? 'warning' : 'neutral'}>{due.label}</SpStatusBadge></div><h2 className="mt-4 font-heading text-2xl font-semibold text-[#171717]">{milestone.title}</h2><p className="mt-2 text-sm leading-7 text-[#6B7280]">{milestone.description || 'No milestone description.'}</p></div><p className="shrink-0 text-xl font-semibold text-[#171717]">{money(milestone.amount, milestone.currency)}</p>
        </div>
        <dl className="mt-6 grid gap-4 border-y border-[#E5E7EB] py-5 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Start date" value={formatDate(milestone.startDate)} />
          <Metric label="Due date" value={formatDate(milestone.dueDate)} />
          <Metric label="Delivery clock" value={words(milestone.deliveryClockState)} />
          <Metric label="Revisions left" value={milestone.unlimitedRevisions ? 'Unlimited' : String(milestone.remainingRevisions)} />
        </dl>
        <div className="mt-5 rounded-xl bg-[#F9FAFB] p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">Completion criteria</p><p className="mt-2 text-sm leading-6 text-[#374151]">{milestone.completionCriteria || 'No completion criteria specified.'}</p></div>

        <div className="mt-5 flex flex-wrap gap-2">
          {!readOnly && milestone.status === 'Funded' && <Button type="button" onClick={() => setConfirmation('activate')}><Play className="size-4" aria-hidden="true" /> Start milestone</Button>}
          {!readOnly && milestone.status === 'RevisionRequested' && revision?.revisionRequestStatus === 'Submitted' && <Button type="button" onClick={() => setConfirmation('revision')}>Start revision work</Button>}
          {!readOnly && canDeliver && <Button type="button" variant="outline" onClick={() => setDeliveryOpen(true)}><FileUp className="size-4" aria-hidden="true" /> Prepare delivery</Button>}
          {!readOnly && milestone.status === 'Active' && !milestone.extensionRequested && <Button type="button" variant="outline" onClick={() => setExtensionOpen(true)}><CalendarClock className="size-4" aria-hidden="true" /> Request extension</Button>}
          {!readOnly && canOpenDispute(milestone) && <Button type="button" variant="outline" className="text-[#B42318]" onClick={() => setDisputeOpen(true)}><ShieldAlert className="size-4" aria-hidden="true" /> Open dispute</Button>}
        </div>
      </SpCard>

      {milestone.extensionRequested && <SpMutationFeedback status="info">An extension is awaiting client decision. The existing due date has not changed automatically.</SpMutationFeedback>}
      {milestone.approvedExtensionDays > 0 && <SpMutationFeedback status="info">The client approved {milestone.approvedExtensionDays} extension day(s); the backend calculated the current due date.</SpMutationFeedback>}
      {milestone.disputeOpenedAt && <SpMutationFeedback status="error">Dispute opened {formatDate(milestone.disputeOpenedAt, true)}. Outcome: {words(milestone.disputeOutcome ?? 'Open')}. Support review target: {formatDate(milestone.disputeReviewEndsAt, true)}.</SpMutationFeedback>}
      {revision && <RevisionCard revision={revision} />}
      {(milestone.reviewWindowEndsAt || milestone.autoReleaseAt) && <SpCard><SpSectionHeader title="Client review window" description="These timestamps are backend-owned. No client approval or payment release is performed by this screen." /><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Metric label="Review window ends" value={formatDate(milestone.reviewWindowEndsAt, true)} /><Metric label="Scheduled rule evaluation" value={`${formatDate(milestone.autoReleaseAt, true)} · STUB-backed payment`} /></dl></SpCard>}

      <SimpleConfirmation kind={confirmation} pending={pending} onClose={() => setConfirmation(null)} onConfirm={confirm} />
      <ExtensionDialog open={extensionOpen} form={extensionForm} setForm={setExtensionForm} pending={extension.isPending} onClose={() => setExtensionOpen(false)} onConfirm={requestExtension} />
      <DisputeDialog open={disputeOpen} reason={disputeReason} setReason={setDisputeReason} pending={dispute.isPending} onClose={() => setDisputeOpen(false)} onConfirm={openDispute} />
      <DeliveryDialog open={deliveryOpen} data={data} milestone={milestone} onClose={() => setDeliveryOpen(false)} onSuccess={() => setFeedback({ status: 'success', message: 'Versioned delivery submitted for client review.' })} />
    </div>
  );
}

function DeliveryDialog({ open, data, milestone, onClose, onSuccess }: { open: boolean; data: WorkroomDetail; milestone: Milestone; onClose: () => void; onSuccess: () => void }) {
  const submit = useSubmitDeliverable();
  const upload = useUploadWorkroomFile();
  const [form, setForm] = useState({ title: milestone.title, description: '', submissionMessage: '', clientInstructions: '', externalLinks: [] as string[], fileIds: [] as string[], allDeliverablesIncluded: false, filesReviewed: false, noUnrelatedPrivateInfo: false, readyForReview: false, majorScopeVersion: false });
  const [error, setError] = useState('');
  const files = useMemo(() => data.files.filter((item) => form.fileIds.includes(item.id)), [data.files, form.fileIds]);
  const valid = form.title.trim() && form.description.trim() && form.clientInstructions.trim() && (form.fileIds.length > 0 || form.externalLinks.length > 0) && form.allDeliverablesIncluded && form.filesReviewed && form.noUnrelatedPrivateInfo && form.readyForReview;

  const pick = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      const result = await upload.mutateAsync({ engagementId: data.engagement.id, milestoneId: milestone.id, file });
      setForm((current) => ({ ...current, fileIds: [...current.fileIds, result.id] }));
    } catch (uploadError) {
      setError(apiError(uploadError, 'The file reference could not be prepared.'));
    }
  };

  const deliver = async () => {
    const payload: SubmitDeliverablePayload = { ...form };
    setError('');
    try {
      await submit.mutateAsync({ id: milestone.id, payload });
      onClose();
      onSuccess();
    } catch (submitError) {
      setError(apiError(submitError, 'The delivery could not be submitted.'));
    }
  };

  return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Submit a versioned delivery</DialogTitle><DialogDescription>Each submission creates a new immutable delivery record. Earlier versions remain in history.</DialogDescription></DialogHeader><div className="space-y-5"><SpMutationFeedback status="info">File security scanning is currently a test integration. A “Ready” result comes from the deterministic scanner STUB, not production malware scanning or independently verified storage.</SpMutationFeedback><SpFormField id="delivery-title" label="Delivery title" required><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></SpFormField><SpFormField id="delivery-description" label="Description" required><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} /></SpFormField><SpFormField id="delivery-instructions" label="Client instructions" required><Textarea value={form.clientInstructions} onChange={(event) => setForm((current) => ({ ...current, clientInstructions: event.target.value }))} rows={3} /></SpFormField><SpFormField id="delivery-message" label="Submission message"><Textarea value={form.submissionMessage} onChange={(event) => setForm((current) => ({ ...current, submissionMessage: event.target.value }))} rows={3} /></SpFormField><SpTagInput id="delivery-links" label="External links" value={form.externalLinks} onChange={(externalLinks) => setForm((current) => ({ ...current, externalLinks }))} placeholder="Add a delivery URL" /><SpFormField id="delivery-files" label="File upload" description="Supported extension and size checks run through the current test scanner integration."><Input type="file" onChange={(event) => pick(event.target.files?.[0])} /></SpFormField>{form.fileIds.length > 0 && <ul className="space-y-2" aria-label="Prepared files">{form.fileIds.map((id) => { const file = files.find((item) => item.id === id); return <li key={id} className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-sm text-[#374151]">{file?.originalName ?? `Prepared file ${id.slice(-6)}`}</li>; })}</ul>}<div className="space-y-3">{([['allDeliverablesIncluded', 'All agreed deliverables are included'], ['filesReviewed', 'I reviewed every submitted file or link'], ['noUnrelatedPrivateInfo', 'No unrelated private information is included'], ['readyForReview', 'This delivery is ready for client review']] as const).map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm text-[#374151]"><input type="checkbox" checked={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))} className="mt-0.5 size-4 accent-[#3C61DD]" /><span>{label}</span></label>)}<label className="flex items-start gap-3 text-sm text-[#374151]"><input type="checkbox" checked={form.majorScopeVersion} onChange={(event) => setForm((current) => ({ ...current, majorScopeVersion: event.target.checked }))} className="mt-0.5 size-4 accent-[#3C61DD]" /><span>This is a major-scope version rather than a normal revision.</span></label></div>{error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}</div><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={submit.isPending || upload.isPending}>Cancel</Button><Button type="button" onClick={deliver} disabled={!valid || submit.isPending || upload.isPending}>{submit.isPending ? 'Submitting…' : 'Submit delivery'}</Button></DialogFooter></DialogContent></Dialog>;
}

function RevisionCard({ revision }: { revision: WorkroomDetail['revisionRequests'][number] }) {
  return <SpCard><div className="flex items-start justify-between gap-4"><div><h2 className="font-heading text-lg font-semibold text-[#171717]">Revision request</h2><p className="mt-2 text-sm leading-6 text-[#6B7280]">{revision.description}</p></div><SpStatusBadge tone="warning">{words(revision.scopeClassification)}</SpStatusBadge></div>{revision.requestedChanges.length > 0 && <ul className="mt-4 space-y-2 text-sm text-[#374151]">{revision.requestedChanges.map((item) => <li key={item} className="rounded-lg bg-[#F9FAFB] px-3 py-2">{item}</li>)}</ul>}<p className="mt-4 text-xs text-[#6B7280]">Status: {words(revision.revisionRequestStatus)} · Due {formatDate(revision.dueDate)}</p></SpCard>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[#171717]">{value}</dd></div>; }

function SimpleConfirmation({ kind, pending, onClose, onConfirm }: { kind: Confirmation; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!kind) return null;
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{kind === 'activate' ? 'Start this milestone?' : 'Start revision work?'}</DialogTitle><DialogDescription>{kind === 'activate' ? 'The backend will set the start date and calculate the due date from the accepted contract. The payment state shown is STUB-backed.' : 'The revision request will move to In Progress. No scope or pricing decision is made automatically.'}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button type="button" onClick={onConfirm} disabled={pending}>{pending ? 'Working…' : kind === 'activate' ? 'Start milestone' : 'Start revision'}</Button></DialogFooter></DialogContent></Dialog>;
}

function ExtensionDialog({ open, form, setForm, pending, onClose, onConfirm }: { open: boolean; form: { days: string; reason: string }; setForm: (value: { days: string; reason: string }) => void; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent><DialogHeader><DialogTitle>Request a deadline extension</DialogTitle><DialogDescription>The client must decide. Submitting this request does not change the due date.</DialogDescription></DialogHeader><SpFormField id="extension-days" label="Requested days" required><Input type="number" min={1} max={365} value={form.days} onChange={(event) => setForm({ ...form, days: event.target.value })} /></SpFormField><SpFormField id="extension-reason" label="Reason" required><Textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={4} /></SpFormField><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button type="button" onClick={onConfirm} disabled={pending || Number(form.days) < 1 || !form.reason.trim()}>{pending ? 'Sending…' : 'Send request'}</Button></DialogFooter></DialogContent></Dialog>;
}

function DisputeDialog({ open, reason, setReason, pending, onClose, onConfirm }: { open: boolean; reason: string; setReason: (value: string) => void; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent><DialogHeader><DialogTitle>Open a milestone dispute?</DialogTitle><DialogDescription>This places the STUB-backed payment state on hold and sends the milestone to support review. It does not initiate a real refund or payment operation.</DialogDescription></DialogHeader><SpFormField id="dispute-reason" label="Reason" required><Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} /></SpFormField><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button type="button" variant="destructive" onClick={onConfirm} disabled={pending || !reason.trim()}>{pending ? 'Opening…' : 'Open dispute'}</Button></DialogFooter></DialogContent></Dialog>;
}
