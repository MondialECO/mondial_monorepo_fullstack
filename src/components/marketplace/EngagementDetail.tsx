'use client';

import Link from 'next/link';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/marketplace-format';
import { formatDate } from '@/lib/workroom-format';
import { statusChipClass } from '@/lib/workroom-status';
import { useClientEngagement } from '@/hooks/queries/workroom-client';
import { useAuth } from '@/app/_providers/AuthProvider';
import { ROLE_DASHBOARD_ROUTES } from '@/lib/roles';
import { ContractPanel } from '@/components/marketplace/workroom/ContractPanel';
import { MilestonesPanel } from '@/components/marketplace/workroom/MilestonesPanel';
import { EngagementActions } from '@/components/marketplace/workroom/EngagementActions';
import { FilesPanel } from '@/components/marketplace/workroom/FilesPanel';
import { ReviewPanel } from '@/components/marketplace/workroom/ReviewPanel';
import type { WorkroomDetail } from '@/types/workroom';

const CLOSED = new Set(['Completed', 'Cancelled', 'Archived']);

export function EngagementDetail({
  basePath,
  engagementId,
}: {
  basePath: string;
  engagementId: string;
}) {
  return (
    <AuthGuard>
      <EngagementDetailContent basePath={basePath} engagementId={engagementId} />
    </AuthGuard>
  );
}

function EngagementDetailContent({
  basePath,
  engagementId,
}: {
  basePath: string;
  engagementId: string;
}) {
  const { data, isLoading, isError } = useClientEngagement(engagementId || null);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Skeleton className="mb-6 h-5 w-40" />
        <div className="mb-8 space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto mb-3 size-10 text-destructive" />
        <p className="font-medium text-foreground">Engagement not found</p>
        <Link href={basePath} className="mt-4 inline-block">
          <Button variant="outline">Back to engagements</Button>
        </Link>
      </div>
    );
  }

  // Direct-URL guard: a provider landing here would otherwise get the buyer UI
  // with Fund/Approve/Request-revision controls that all fail server-side.
  // Wording stays vague about existence, matching the backend's NotFound for
  // non-participants.
  if (user && data.engagement.clientId !== user.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted-foreground">
          This engagement isn&apos;t part of your buyer activity.
        </p>
        <Link href={`${ROLE_DASHBOARD_ROUTES[user.role]}/engagements`} className="underline">
          Back to My Engagements
        </Link>
      </div>
    );
  }

  const { engagement, contract } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <Link
        href={basePath}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to engagements
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="min-w-0 text-3xl font-bold text-foreground md:text-4xl">
            {engagement.title}
          </h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${statusChipClass(
              engagement.engagementStatus
            )}`}
          >
            {engagement.engagementStatus}
          </span>
        </div>
        {engagement.description && (
          <p className="mt-2 text-muted-foreground">{engagement.description}</p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Work content stays first on mobile — this is a workroom, so milestones
            and files matter more than the summary sidebar. */}
        <div className="min-w-0 space-y-6">
          <ContractPanel contract={contract} engagementId={engagement.id} />
          <MilestonesPanel detail={data} />
          <FilesPanel detail={data} />
          <ReviewPanel detail={data} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <EngagementSummaryCard detail={data} />
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function EngagementSummaryCard({ detail }: { detail: WorkroomDetail }) {
  const { engagement } = detail;
  const showActions = !CLOSED.has(engagement.engagementStatus);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Summary
      </p>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Contract value</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">
          {formatPrice(engagement.contractValue, engagement.currency)}
        </p>
      </div>

      <div className="my-4 border-t border-border" />

      <div className="space-y-3">
        <SummaryRow label="Escrow">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusChipClass(
              engagement.escrowStatus
            )}`}
          >
            {engagement.escrowStatus}
          </span>
        </SummaryRow>
        <SummaryRow label="Progress">{Math.round(engagement.completionPercentage)}%</SummaryRow>
        <SummaryRow label="Started">{formatDate(engagement.startDate)}</SummaryRow>
        <SummaryRow label="Expected end">{formatDate(engagement.expectedEndDate)}</SummaryRow>
      </div>

      {showActions && (
        <>
          <div className="my-4 border-t border-border" />
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
            Quick actions
          </p>
          <EngagementActions detail={detail} stacked />
        </>
      )}
    </div>
  );
}
