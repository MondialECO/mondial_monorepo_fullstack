'use client';

import { useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, CheckCircle2, CirclePause, CirclePlay, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  SpCard,
  SpEmptyState,
  SpMutationFeedback,
  SpPage,
  SpPageHeader,
  SpStatusBadge,
  SpTabBar,
} from '@/components/serviceprovider/ui';
import { useAuth } from '@/app/_providers/AuthProvider';
import { useCompleteEngagement, useEngagement, usePauseEngagement, useResumeEngagement } from '@/hooks/queries/workroom';
import type { WorkroomDetail as WorkroomDetailType } from '@/types/workroom';
import { ContractPanel } from './ContractPanel';
import { CoordinationPanel } from './CoordinationPanel';
import { DeliveriesPanel } from './DeliveriesPanel';
import { MilestonesPanel } from './MilestonesPanel';
import { TimeEntriesPanel } from './TimeEntriesPanel';
import {
  apiError,
  engagementTone,
  formatDate,
  isRefundedMilestone,
  milestoneBadge,
  money,
  providerActionsLocked,
  words,
} from './_shared';

export type WorkroomTab = 'overview' | 'milestones' | 'deliveries' | 'coordination' | 'contract' | 'time';
type Confirmation = 'pause' | 'resume' | 'complete' | null;

export function ProjectDetail({
  id,
  view,
  tab,
  milestoneId,
  onBack,
  onTab,
  onMilestone,
}: {
  id: string;
  view: 'active' | 'completed';
  tab: WorkroomTab;
  milestoneId: string | null;
  onBack: () => void;
  onTab: (tab: WorkroomTab) => void;
  onMilestone: (id: string) => void;
}) {
  const { user } = useAuth();
  const query = useEngagement(id);
  const pause = usePauseEngagement();
  const resume = useResumeEngagement();
  const complete = useCompleteEngagement();
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const pending = pause.isPending || resume.isPending || complete.isPending;

  if (query.isLoading) return <DetailSkeleton />;
  if (query.isError || !query.data) {
    return <SpPage><BackButton onClick={onBack} /><SpEmptyState icon={BriefcaseBusiness} title="Project unavailable" description="The Workroom could not be loaded." action={<Button type="button" variant="outline" onClick={() => query.refetch()}>Try again</Button>} /></SpPage>;
  }

  // Direct-URL guard: a provider landing on an engagement they bought rather than sold
  // would otherwise get the delivery UI — submit, request extension, complete — for work
  // that is not theirs to deliver, and every action would fail server-side. Wording stays
  // vague about existence, matching the backend's NotFound for non-participants and the
  // buyer-side guard in EngagementDetail.
  if (user && query.data.engagement.providerId !== user.id) {
    return <SpPage><BackButton onClick={onBack} /><SpEmptyState icon={BriefcaseBusiness} title="Project unavailable" description="This engagement isn't part of your provider activity." /></SpPage>;
  }

  const data = query.data;
  const engagement = data.engagement;
  const closed = providerActionsLocked(engagement);
  const canComplete = !closed && data.milestones.length > 0 && data.milestones.every((item) => item.status === 'Paid') && !data.revisionRequests.some((item) => !['Resolved', 'Cancelled'].includes(item.revisionRequestStatus));
  const isHourly = data.contract.terms.pricingType === 'Hourly';
  const activeTab = tab === 'time' && !isHourly ? 'overview' : tab;

  const confirmAction = async () => {
    if (!confirmation) return;
    setFeedback(null);
    try {
      if (confirmation === 'pause') await pause.mutateAsync({ id, reason: pauseReason.trim() });
      if (confirmation === 'resume') await resume.mutateAsync(id);
      if (confirmation === 'complete') await complete.mutateAsync(id);
      setFeedback({ status: 'success', message: confirmation === 'pause' ? 'Project paused. Active delivery clocks are frozen.' : confirmation === 'resume' ? 'Project resumed. The backend shifted active deadlines by the frozen duration.' : 'Project marked complete.' });
      setConfirmation(null);
      setPauseReason('');
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The project action could not be completed.') });
      setConfirmation(null);
    }
  };

  const base = `/dashboard/serviceprovider/workroom?view=${view}&project=${id}`;
  const tabs = [
    { label: 'Overview', href: base, active: activeTab === 'overview', value: 'overview' as const },
    { label: 'Milestones', href: `${base}&tab=milestones`, active: activeTab === 'milestones', value: 'milestones' as const },
    { label: 'Deliveries', href: `${base}&tab=deliveries`, active: activeTab === 'deliveries', value: 'deliveries' as const },
    { label: 'Tasks & Inputs', href: `${base}&tab=coordination`, active: activeTab === 'coordination', value: 'coordination' as const },
    { label: 'Contract', href: `${base}&tab=contract`, active: activeTab === 'contract', value: 'contract' as const },
    ...(isHourly ? [{ label: 'Time Entries', href: `${base}&tab=time`, active: activeTab === 'time', value: 'time' as const }] : []),
  ];

  return (
    <SpPage>
      <BackButton onClick={onBack} />
      <SpPageHeader
        title={engagement.title}
        description={`${engagement.clientDisplayName || 'Client'} · ${words(engagement.engagementStatus)}`}
        actions={(
          <>
            {!closed && engagement.engagementStatus !== 'Paused' && engagement.engagementStatus !== 'Disputed' && <Button type="button" variant="outline" onClick={() => setConfirmation('pause')}><CirclePause className="size-4" aria-hidden="true" /> Pause</Button>}
            {engagement.engagementStatus === 'Paused' && <Button type="button" variant="outline" onClick={() => setConfirmation('resume')}><CirclePlay className="size-4" aria-hidden="true" /> Resume</Button>}
            {canComplete && <Button type="button" onClick={() => setConfirmation('complete')}><CheckCircle2 className="size-4" aria-hidden="true" /> Confirm completion</Button>}
          </>
        )}
      />

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
      <SpMutationFeedback status="info">Payment and protected-funds states in this Workroom are STUB-backed. They do not represent real money authorisation, custody, release, refund, or payout.</SpMutationFeedback>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric icon={UserRound} label="Client" value={engagement.clientDisplayName || 'Client'} />
        <SummaryMetric icon={WalletCards} label="Contract value" value={money(engagement.contractValue, engagement.currency)} />
        <SummaryMetric icon={CalendarDays} label="Schedule" value={`${formatDate(engagement.startDate)} – ${formatDate(engagement.actualEndDate ?? engagement.expectedEndDate)}`} />
        <SummaryMetric icon={ShieldCheck} label="Protected-payment state" value={`${words(engagement.escrowStatus)} · STUB-backed`} />
      </div>

      <SpTabBar label="Project sections" items={tabs.map(({ label, href, active }) => ({ label, href, active }))} />

      {activeTab === 'overview' && <ProjectOverview data={data} onOpenMilestones={() => onTab('milestones')} onSelectMilestone={onMilestone} />}
      {activeTab === 'milestones' && <MilestonesPanel data={data} selectedId={milestoneId} onSelect={onMilestone} readOnly={closed} />}
      {activeTab === 'deliveries' && <DeliveriesPanel data={data} readOnly={closed} />}
      {activeTab === 'coordination' && <CoordinationPanel data={data} readOnly={closed} />}
      {activeTab === 'contract' && <ContractPanel data={data} readOnly={closed} />}
      {activeTab === 'time' && isHourly && <TimeEntriesPanel data={data} readOnly={closed} />}

      <ActionDialog kind={confirmation} pauseReason={pauseReason} setPauseReason={setPauseReason} pending={pending} canComplete={canComplete} onClose={() => setConfirmation(null)} onConfirm={confirmAction} />
    </SpPage>
  );
}

function ProjectOverview({ data, onOpenMilestones, onSelectMilestone }: { data: WorkroomDetailType; onOpenMilestones: () => void; onSelectMilestone: (id: string) => void }) {
  const current = data.milestones.find((item) => item.id === data.engagement.currentMilestoneId) ?? data.milestones.find((item) => !['Paid', 'Cancelled'].includes(item.status));
  const progress = Math.max(0, Math.min(100, data.engagement.completionPercentage));
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
      <div className="space-y-6">
        <SpCard>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div><SpStatusBadge tone={engagementTone(data.engagement.engagementStatus)}>{words(data.engagement.engagementStatus)}</SpStatusBadge><h2 className="mt-4 font-heading text-xl font-semibold text-[#171717]">Project summary</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4B5563]">{data.engagement.description || 'No project description.'}</p></div>
            <div className="min-w-40"><div className="flex justify-between gap-3 text-xs"><span className="text-[#6B7280]">Progress</span><span className="font-semibold text-[#171717]">{Math.round(progress)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ECEEF2]" role="progressbar" aria-label="Project completion" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#3C61DD]" style={{ width: `${progress}%` }} /></div></div>
          </div>
        </SpCard>

        {current ? (
          <SpCard>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">Current milestone</p><h2 className="mt-2 font-heading text-xl font-semibold text-[#171717]">{current.title}</h2><p className="mt-2 text-sm leading-6 text-[#6B7280]">{current.description || current.completionCriteria}</p></div><SpStatusBadge tone={milestoneBadge(current).tone}>{milestoneBadge(current).label}</SpStatusBadge></div>
            <dl className="mt-5 grid gap-4 border-t border-[#E5E7EB] pt-5 sm:grid-cols-3"><SmallMetric label="Amount" value={money(current.amount, current.currency)} /><SmallMetric label="Due" value={formatDate(current.dueDate)} /><SmallMetric label="Delivery clock" value={words(current.deliveryClockState)} /></dl>
            <Button type="button" variant="outline" className="mt-5" onClick={() => onSelectMilestone(current.id)}>Open milestone</Button>
          </SpCard>
        ) : <SpEmptyState title="No current milestone" description="All project milestones are complete or no milestone plan exists." className="min-h-52" />}
      </div>

      <aside className="space-y-6">
        <SpCard>
          <h2 className="font-heading text-lg font-semibold text-[#171717]">Milestone progress</h2>
          <ol className="mt-5 space-y-4">{data.milestones.map((item, index) => <li key={item.id} className="flex items-start gap-3"><span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${item.status === 'Paid' && !isRefundedMilestone(item) ? 'bg-[#E8F7F0] text-[#157A55]' : 'bg-[#F3F4F6] text-[#4B5563]'}`}>{index + 1}</span><button type="button" onClick={() => onSelectMilestone(item.id)} className="min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"><span className="block text-sm font-semibold text-[#171717]">{item.title}</span><span className="mt-0.5 block text-xs text-[#6B7280]">{milestoneBadge(item).label}</span></button></li>)}</ol>
          <Button type="button" variant="outline" className="mt-5 w-full" onClick={onOpenMilestones}>View all milestones</Button>
        </SpCard>
        {data.engagement.engagementStatus === 'Completed' && <ReviewSummary data={data} />}
      </aside>
    </div>
  );
}

function ReviewSummary({ data }: { data: WorkroomDetailType }) {
  if (!data.review) return <SpCard><h2 className="font-heading text-lg font-semibold text-[#171717]">Client review</h2><p className="mt-3 text-sm leading-6 text-[#6B7280]">No verified client review has been submitted.</p></SpCard>;
  return <SpCard><div className="flex items-center justify-between gap-4"><h2 className="font-heading text-lg font-semibold text-[#171717]">Client review</h2><SpStatusBadge tone="positive">★ {data.review.overallRating}/5</SpStatusBadge></div><p className="mt-4 text-sm italic leading-7 text-[#374151]">“{data.review.writtenReview || 'No written review.'}”</p>{data.review.providerResponse && <div className="mt-4 rounded-xl bg-[#F9FAFB] p-4"><p className="text-xs font-semibold text-[#6B7280]">Your response</p><p className="mt-1 text-sm leading-6 text-[#374151]">{data.review.providerResponse}</p></div>}</SpCard>;
}

function SummaryMetric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <SpCard className="min-h-32"><span className="flex size-9 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#3C61DD]"><Icon className="size-4" aria-hidden="true" /></span><p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">{label}</p><p className="mt-1.5 text-sm font-semibold leading-6 text-[#171717]">{value}</p></SpCard>;
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[#171717]">{value}</dd></div>;
}

function ActionDialog({ kind, pauseReason, setPauseReason, pending, canComplete, onClose, onConfirm }: { kind: Confirmation; pauseReason: string; setPauseReason: (value: string) => void; pending: boolean; canComplete: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!kind) return null;
  const copy = kind === 'pause' ? { title: 'Pause this project?', description: 'The backend will freeze active delivery clocks until either participant resumes the Workroom.', action: 'Pause project' } : kind === 'resume' ? { title: 'Resume this project?', description: 'The backend will shift active due dates by the exact paused duration.', action: 'Resume project' } : { title: 'Confirm project completion?', description: 'Completion is allowed only after every milestone and payment-release state is resolved and no revision remains open.', action: 'Complete project' };
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{copy.title}</DialogTitle><DialogDescription>{copy.description}</DialogDescription></DialogHeader>{kind === 'pause' && <div><label htmlFor="pause-reason" className="text-sm font-semibold text-[#374151]">Reason</label><Textarea id="pause-reason" value={pauseReason} onChange={(event) => setPauseReason(event.target.value)} className="mt-2" rows={4} /></div>}<DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button type="button" onClick={onConfirm} disabled={pending || kind === 'pause' && !pauseReason.trim() || kind === 'complete' && !canComplete}>{pending ? 'Working…' : copy.action}</Button></DialogFooter></DialogContent></Dialog>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" variant="ghost" className="w-fit px-0 hover:bg-transparent" onClick={onClick}><ArrowLeft className="size-4" aria-hidden="true" /> Back to projects</Button>;
}

function DetailSkeleton() {
  return <SpPage aria-label="Loading project Workroom"><Skeleton className="h-10 w-44" /><Skeleton className="h-20 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}</div><Skeleton className="h-[520px] rounded-2xl" /></SpPage>;
}
