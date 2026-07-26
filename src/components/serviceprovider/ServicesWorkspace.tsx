'use client';

import { useState } from 'react';
import { ArrowLeft, LayoutGrid, Plus, Eye, MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import {
  useServiceListings,
  useServiceListing,
} from '@/hooks/queries/service-catalog';
import type { ServiceListing } from '@/types/service-catalog';
import { ListingEditor } from './catalog/ListingEditor';
import { ListingDetail } from './catalog/ListingDetail';

type View =
  | { mode: 'list' }
  | { mode: 'new' }
  | { mode: 'detail'; id: string };

export function ServicesWorkspace() {
  const [view, setView] = useState<View>({ mode: 'list' });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">
            Build service listings with Basic / Standard / Premium packages. Clients
            discover and buy these once you publish.
          </p>
        </div>
        {view.mode === 'list' && (
          <Button onClick={() => setView({ mode: 'new' })}>
            <Plus className="h-4 w-4" /> New service
          </Button>
        )}
        {view.mode !== 'list' && (
          <Button variant="ghost" onClick={() => setView({ mode: 'list' })}>
            <ArrowLeft className="h-4 w-4" /> All services
          </Button>
        )}
      </div>

      {view.mode === 'list' && <ListingsList onOpen={(id) => setView({ mode: 'detail', id })} />}
      {view.mode === 'new' && (
        <ListingEditor onDone={(id) => setView({ mode: 'detail', id })} onCancel={() => setView({ mode: 'list' })} />
      )}
      {view.mode === 'detail' && <ListingDetailLoader id={view.id} />}
    </div>
  );
}

function ListingsList({ onOpen }: { onOpen: (id: string) => void }) {
  const { data: listings, isLoading, isError } = useServiceListings();

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (isError)
    return (
      <p className="text-sm text-destructive">Couldn&apos;t load your services. Try again.</p>
    );

  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No Published Services"
        description="Create your first service listing to start receiving briefs."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} onOpen={() => onOpen(l.id)} />
      ))}
    </div>
  );
}

function ListingCard({ listing, onOpen }: { listing: ServiceListing; onOpen: () => void }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{listing.title || 'Untitled service'}</CardTitle>
          <StatusBadge status={listing.status} />
        </div>
        <CardDescription className="line-clamp-2">
          {listing.description || 'No description yet.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{listing.impressions}</span>
          <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" />{listing.clicks}</span>
          <span>{listing.category}</span>
        </div>
        <Button size="sm" variant="outline" onClick={onOpen}>Manage</Button>
      </CardContent>
    </Card>
  );
}

function ListingDetailLoader({ id }: { id: string }) {
  const { data, isLoading, isError } = useServiceListing(id);
  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (isError || !data)
    return <p className="text-sm text-destructive">Couldn&apos;t load this service. Try again.</p>;
  return <ListingDetail detail={data} />;
}

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'Published' ? 'success' : status === 'Unpublished' ? 'warning' : 'secondary';
  return <Badge variant={variant as 'success' | 'warning' | 'secondary'}>{status}</Badge>;
}
