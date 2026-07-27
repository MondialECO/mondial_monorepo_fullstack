'use client';

import { useState } from 'react';
import { Eye, MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePublishListing, useUnpublishListing } from '@/hooks/queries/service-catalog';
import type { ServiceListingDetail } from '@/types/service-catalog';
import { ListingEditor } from './ListingEditor';
import { PackageBuilder } from './PackageBuilder';
import { FaqBuilder } from './FaqBuilder';
import { CapacityPanel } from './CapacityPanel';

type Tab = 'packages' | 'faqs' | 'capacity';

export function ListingDetail({ detail }: { detail: ServiceListingDetail }) {
  const { listing, packages, faqs } = detail;
  const publish = usePublishListing();
  const unpublish = useUnpublishListing();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>('packages');

  if (editing) {
    return <ListingEditor existing={listing} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />;
  }

  const badgeVariant =
    listing.status === 'Published' ? 'success' : listing.status === 'Unpublished' ? 'warning' : 'secondary';

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-xl">{listing.title || 'Untitled service'}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">{listing.description || 'No description yet.'}</p>
            </div>
            <Badge variant={badgeVariant as 'success' | 'warning' | 'secondary'}>{listing.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{listing.category}</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{listing.impressions}</span>
            <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" />{listing.clicks}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit details</Button>
            {listing.status === 'Published'
              ? <Button size="sm" variant="outline" onClick={() => unpublish.mutate([listing.id])}>Unpublish</Button>
              : <Button size="sm" onClick={() => publish.mutate([listing.id])}>Publish service</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b border-border">
        {(['packages', 'faqs', 'capacity'] as Tab[]).map((t) => (
          <Button
            key={t}
            variant="ghost"
            onClick={() => setTab(t)}
            className={cn(
              'h-auto rounded-none border-b-2 px-4 py-2 text-sm font-medium capitalize -mb-px',
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
          </Button>
        ))}
      </div>

      {tab === 'packages' && <PackageBuilder listingId={listing.id} packages={packages} category={listing.category} />}
      {tab === 'faqs' && <FaqBuilder listingId={listing.id} faqs={faqs} packages={packages} />}
      {tab === 'capacity' && <CapacityPanel />}
    </div>
  );
}
