'use client';

import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/marketplace-format';
import { statusChipClass } from '@/lib/workroom-status';
import { useClientEngagements } from '@/hooks/queries/workroom-client';
import { PendingProposalsSection } from '@/components/marketplace/PendingProposalsSection';

export function EngagementsList({ basePath }: { basePath: string }) {
  return (
    <AuthGuard>
      <EngagementsListContent basePath={basePath} />
    </AuthGuard>
  );
}

function EngagementsListContent({ basePath }: { basePath: string }) {
  const { data, isLoading, isError } = useClientEngagements();
  const engagements = data ?? [];

  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Engagements</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Orders you&apos;ve placed and the work in progress on them.
      </p>

      {/* Pre-engagement proposals (M2b). Rendered independently of the engagements
          query so an order awaiting confirmation shows while that list loads. */}
      <PendingProposalsSection basePath={basePath} />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load your engagements.</p>
      ) : engagements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border py-12 text-center">
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
                  {e.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {e.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusChipClass(
                      e.engagementStatus
                    )}`}
                  >
                    {e.engagementStatus}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatPrice(e.contractValue, e.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(e.completionPercentage)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, e.completionPercentage))}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
