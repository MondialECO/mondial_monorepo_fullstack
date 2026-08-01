'use client';

import Link from 'next/link';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/marketplace-format';
import { statusChipClass } from '@/lib/workroom-status';
import { useClientEngagement } from '@/hooks/queries/workroom-client';
import { ContractPanel } from '@/components/marketplace/workroom/ContractPanel';
import { MilestonesPanel } from '@/components/marketplace/workroom/MilestonesPanel';
import { EngagementActions } from '@/components/marketplace/workroom/EngagementActions';
import { FilesPanel } from '@/components/marketplace/workroom/FilesPanel';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
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

  const { engagement, contract } = data;

  return (
    <div className="p-6">
      <Link
        href={basePath}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to engagements
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{engagement.title}</h1>
            {engagement.description && (
              <p className="mt-1 text-sm text-muted-foreground">{engagement.description}</p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${statusChipClass(
              engagement.engagementStatus
            )}`}
          >
            {engagement.engagementStatus}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-border p-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Contract value</dt>
            <dd className="text-sm font-medium text-foreground">
              {formatPrice(engagement.contractValue, engagement.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Escrow</dt>
            <dd className="text-sm font-medium text-foreground">{engagement.escrowStatus}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Started</dt>
            <dd className="text-sm font-medium text-foreground">
              {formatDate(engagement.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Expected end</dt>
            <dd className="text-sm font-medium text-foreground">
              {formatDate(engagement.expectedEndDate)}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <EngagementActions detail={data} />
        </div>
      </header>

      <div className="space-y-6">
        <ContractPanel contract={contract} engagementId={engagement.id} />
        <MilestonesPanel detail={data} />
        <FilesPanel detail={data} />
      </div>
    </div>
  );
}
