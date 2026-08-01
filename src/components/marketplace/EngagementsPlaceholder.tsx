'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, FolderOpen } from 'lucide-react';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getEngagements } from '@/lib/api-workroom';
import { formatPrice } from '@/lib/marketplace-format';
import { PendingProposalsSection } from '@/components/marketplace/PendingProposalsSection';

const engagementKeys = { list: ['client-engagements'] as const };

function useEngagements() {
  return useQuery({ queryKey: engagementKeys.list, queryFn: getEngagements, staleTime: 30_000 });
}

/**
 * M2 landing target for a placed order. The full engagement-scoped workroom
 * (fund, approve, revisions, chat) is Phase M3 — this only proves the record
 * exists and surfaces its current state.
 */
export function EngagementsList({ basePath }: { basePath: string }) {
  return (
    <AuthGuard>
      <EngagementsListContent basePath={basePath} />
    </AuthGuard>
  );
}

function EngagementsListContent({ basePath }: { basePath: string }) {
  const { data, isLoading, isError } = useEngagements();
  const engagements = data ?? [];

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Engagements</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Orders you&apos;ve placed and the work in progress on them.
      </p>

      {/* Rendered above the list and independent of it, so an order awaiting the
          client's confirmation is visible even while engagements are still loading. */}
      <PendingProposalsSection basePath={basePath} />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load your engagements.</p>
      ) : engagements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border py-12 text-center">
          <FolderOpen className="mb-3 size-10 text-muted-foreground" />
          <p className="font-medium text-foreground">No engagements yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            When you order a service from the marketplace, it appears here once the
            provider workroom is set up.
          </p>
          <Link href="/marketplace/services" className="mt-4">
            <Button variant="outline">Browse the marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {engagements.map((e) => (
            <Link
              key={e.id}
              href={`${basePath}/${e.id}`}
              className="block rounded-lg border border-border p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{e.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.clientDisplayName} · {e.completionPercentage}% complete
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {e.engagementStatus}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatPrice(e.contractValue, e.currency)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
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
  const { data, isLoading, isError } = useEngagements();
  const engagement = data?.find((e) => e.id === engagementId);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !engagement) {
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

  return (
    <div className="p-6">
      <Link
        href={basePath}
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to engagements
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-foreground">{engagement.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{engagement.description}</p>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className="text-sm font-medium text-foreground">{engagement.engagementStatus}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Escrow</dt>
          <dd className="text-sm font-medium text-foreground">{engagement.escrowStatus}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Contract value</dt>
          <dd className="text-sm font-medium text-foreground">
            {formatPrice(engagement.contractValue, engagement.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Progress</dt>
          <dd className="text-sm font-medium text-foreground">
            {engagement.completionPercentage}%
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
        Full workroom experience — funding milestones, reviewing deliveries, requesting
        revisions and messaging — arrives in Phase M3.
      </p>
    </div>
  );
}
