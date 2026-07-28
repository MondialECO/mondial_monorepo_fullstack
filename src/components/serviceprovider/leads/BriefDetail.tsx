'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  CalendarClock,
  MapPin,
  WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard,
  SpEmptyState,
  SpMutationFeedback,
  SpPage,
  SpPageHeader,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import { useLeadBrief, useUpdateLeadInteraction } from '@/hooks/queries/leads';
import {
  apiError,
  briefIsExpired,
  expirationLabel,
  formatDate,
  formatEnum,
  money,
} from './_shared';

export function BriefDetail({
  id,
  onBack,
  onStartProposal,
  onViewPipeline,
}: {
  id: string;
  onBack: () => void;
  onStartProposal: () => void;
  onViewPipeline: () => void;
}) {
  const brief = useLeadBrief(id);
  const interaction = useUpdateLeadInteraction();
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  if (brief.isLoading) return <BriefDetailSkeleton />;

  if (brief.isError) {
    return (
      <SpPage>
        <BackButton onClick={onBack} />
        <SpEmptyState
          icon={BriefcaseBusiness}
          title="Client brief unavailable"
          description="The brief could not be loaded. It may no longer be visible to this provider account."
          action={<Button type="button" variant="outline" onClick={() => brief.refetch()}>Try again</Button>}
        />
      </SpPage>
    );
  }

  const item = brief.data;
  if (!item) return null;
  const expiry = expirationLabel(item.expiresAt);
  const expired = briefIsExpired(item);
  const accepting = item.status === 'Open' && !expired;

  const toggleSaved = async () => {
    setFeedback(null);
    try {
      await interaction.mutateAsync({ id: item.id, saved: !item.saved });
      setFeedback({ status: 'success', message: item.saved ? 'Brief removed from Saved.' : 'Brief saved for later.' });
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The saved state could not be updated.') });
    }
  };

  return (
    <SpPage>
      <BackButton onClick={onBack} />
      <SpPageHeader
        title={item.title}
        description="Review the client’s published requirements before preparing a proposal."
        actions={(
          <>
            <Button type="button" variant="outline" aria-pressed={item.saved} onClick={toggleSaved} disabled={interaction.isPending}>
              <Bookmark className={`size-4 ${item.saved ? 'fill-current' : ''}`} aria-hidden="true" />
              {item.saved ? 'Saved' : 'Save brief'}
            </Button>
            {item.proposalSubmitted ? (
              <Button type="button" onClick={onViewPipeline}>View proposal pipeline</Button>
            ) : (
              <Button type="button" onClick={onStartProposal} disabled={!accepting}>Create proposal</Button>
            )}
          </>
        )}
      />

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
      {!accepting && (
        <SpMutationFeedback status="info">
          This brief is {expired ? 'expired' : formatEnum(item.status).toLocaleLowerCase()} and is read-only.
        </SpMutationFeedback>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <div className="space-y-6">
          <SpCard>
            <div className="flex flex-wrap items-center gap-2">
              <SpStatusBadge tone="info">{formatEnum(item.source)}</SpStatusBadge>
              <SpStatusBadge tone={expired ? 'negative' : expiry.urgent ? 'warning' : 'neutral'}>{expiry.label}</SpStatusBadge>
              <SpStatusBadge tone={item.status === 'Open' ? 'positive' : 'neutral'}>{formatEnum(item.status)}</SpStatusBadge>
            </div>
            <h2 className="mt-5 font-heading text-lg font-semibold text-[#171717]">Project brief</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4B5563]">{item.description}</p>
          </SpCard>

          <SpCard>
            <h2 className="font-heading text-lg font-semibold text-[#171717]">Required expertise</h2>
            <div className="mt-5 space-y-5">
              <TagList label="Skills" values={item.requiredSkills} empty="No specific skills listed" />
              <TagList label="Industries" values={item.industries} empty="No industry preference listed" />
              <DetailRow label="Service category" value={formatEnum(item.serviceCategory)} />
            </div>
          </SpCard>
        </div>

        <aside className="space-y-6" aria-label="Client brief summary">
          <SpCard>
            <h2 className="font-heading text-lg font-semibold text-[#171717]">Opportunity summary</h2>
            <dl className="mt-5 space-y-5">
              <IconDetail icon={WalletCards} label="Client budget" value={`${money(item.budgetMinimum, item.currency)} – ${money(item.budgetMaximum, item.currency)}`} />
              <IconDetail icon={BriefcaseBusiness} label="Pricing model" value={formatEnum(item.pricingType)} />
              <IconDetail icon={CalendarClock} label="Expected duration" value={item.expectedDuration || 'Flexible'} />
              <IconDetail icon={MapPin} label="Work location" value={item.remoteAllowed ? 'Remote allowed' : item.location || 'On-site'} />
              <DetailRow label="Published" value={formatDate(item.publishedAt)} />
              <DetailRow label="Proposal deadline" value={formatDate(item.expiresAt)} />
            </dl>
          </SpCard>

          <SpCard className="bg-[#F9FAFB]">
            <p className="text-3xl font-semibold tracking-tight text-[#171717]">{Math.round(item.matchScore * 100)}%</p>
            <p className="mt-1 text-sm font-semibold text-[#374151]">Skill match</p>
            <p className="mt-2 text-xs leading-5 text-[#6B7280]">
              This deterministic score reuses the platform matching formula. Availability is checked before a brief enters the inbox.
            </p>
          </SpCard>
        </aside>
      </div>
    </SpPage>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" className="w-fit px-0 hover:bg-transparent" onClick={onClick}>
      <ArrowLeft className="size-4" aria-hidden="true" /> Back to client briefs
    </Button>
  );
}

function TagList({ label, values, empty }: { label: string; values: string[]; empty: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">{label}</p>
      {values.length ? (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={label}>
          {values.map((value) => <li key={value}><SpStatusBadge>{value}</SpStatusBadge></li>)}
        </ul>
      ) : <p className="mt-2 text-sm text-[#6B7280]">{empty}</p>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4 last:border-0 last:pb-0">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#171717]">{value}</span>
    </div>
  );
}

function IconDetail({ icon: Icon, label, value }: { icon: typeof WalletCards; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#3C61DD]"><Icon className="size-4" aria-hidden="true" /></span>
      <div><span className="block text-xs text-[#6B7280]">{label}</span><span className="mt-0.5 block text-sm font-semibold text-[#171717]">{value}</span></div>
    </div>
  );
}

function BriefDetailSkeleton() {
  return (
    <SpPage aria-label="Loading client brief">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </SpPage>
  );
}
