'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/marketplace-format';
import { formatDate } from '@/lib/workroom-format';
import { statusChipClass } from '@/lib/workroom-status';
import { useClientEngagements } from '@/hooks/queries/workroom-client';
import { PendingProposalsSection } from '@/components/marketplace/PendingProposalsSection';
import type { Engagement } from '@/types/workroom';

/**
 * Everything contracted but not yet finished or terminated. Includes the two
 * pre-work states (ContractPending before signature, EscrowPending before the
 * first milestone is funded) — every engagement starts in one of them, so
 * omitting them made brand-new orders visible only under "All". Paused is here
 * too: halted work is still in flight, and excluding it would make an
 * engagement vanish from the tab the moment a buyer paused it.
 *
 * MilestoneReview intentionally appears here and in the narrower "In review"
 * tab, which acts as a shortcut to what needs the buyer's attention.
 *
 * Cancelled is deliberately in no bucket: it has no server-side writer
 * (canon §10.7), so it surfaces only under "All" if it ever occurs.
 */
const ACTIVE_STATUSES = [
  'ContractPending',
  'EscrowPending',
  'ReadyToStart',
  'Active',
  'MilestoneReview',
  'RevisionInProgress',
  'FinalDelivery',
  'ClientInputRequired',
  'Paused',
];

const FILTERS: { key: string; label: string; match: (e: Engagement) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'active', label: 'Active', match: (e) => ACTIVE_STATUSES.includes(e.engagementStatus) },
  { key: 'review', label: 'In review', match: (e) => e.engagementStatus === 'MilestoneReview' },
  {
    key: 'completed',
    label: 'Completed',
    match: (e) => ['Completed', 'Archived'].includes(e.engagementStatus),
  },
  { key: 'disputed', label: 'Disputed', match: (e) => e.engagementStatus === 'Disputed' },
];

export function EngagementsList({ basePath }: { basePath: string }) {
  return (
    <AuthGuard>
      <EngagementsListContent basePath={basePath} />
    </AuthGuard>
  );
}

function EngagementsListContent({ basePath }: { basePath: string }) {
  const { data, isLoading, isError } = useClientEngagements();
  const [filter, setFilter] = useState('all');

  const engagements = useMemo(() => data ?? [], [data]);
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const visible = engagements.filter(active.match);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Engagements</h1>
        <p className="mt-1 text-muted-foreground">
          Orders you&apos;ve placed and work in progress.
        </p>
      </header>

      <PendingProposalsSection basePath={basePath} />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full max-w-lg" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-destructive">
          Could not load your engagements.
        </p>
      ) : engagements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
          <FolderOpen className="mb-3 size-10 text-muted-foreground" />
          <p className="font-medium text-foreground">No engagements yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Start by ordering a service from the marketplace.
          </p>
          <Link href="/marketplace/services" className="mt-4">
            <Button variant="outline">Browse the marketplace</Button>
          </Link>
        </div>
      ) : (
        <>
          <Tabs value={filter} onValueChange={setFilter} defaultValue="all" className="mb-6">
            <TabsList>
              {FILTERS.map((f) => (
                <TabsTrigger key={f.key} value={f.key}>
                  {f.label} ({engagements.filter(f.match).length})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No engagements match this filter.
            </p>
          ) : (
            <div className="space-y-4">
              {visible.map((e) => (
                <EngagementCard key={e.id} engagement={e} basePath={basePath} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EngagementCard({
  engagement: e,
  basePath,
}: {
  engagement: Engagement;
  basePath: string;
}) {
  const progress = Math.min(100, Math.max(0, e.completionPercentage));

  return (
    <Link
      href={`${basePath}/${e.id}`}
      className="block rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* No avatar: the engagement carries the provider's name but no image
              reference, and this is a buyer surface, so the counterparty is the
              provider rather than the client name the SP workroom shows. */}
          {e.providerDisplayName && (
            <p className="truncate text-xs font-medium text-muted-foreground">
              {e.providerDisplayName}
            </p>
          )}
          <h3 className="truncate text-lg font-semibold text-foreground">{e.title}</h3>
          {e.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusChipClass(
            e.engagementStatus
          )}`}
        >
          {e.engagementStatus}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">Progress {Math.round(progress)}%</span>
          <span className="font-semibold text-foreground">
            {formatPrice(e.contractValue, e.currency)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Started {formatDate(e.startDate)}
        <span aria-hidden className="mx-1.5">
          ·
        </span>
        Expected {formatDate(e.expectedEndDate)}
      </p>
    </Link>
  );
}
