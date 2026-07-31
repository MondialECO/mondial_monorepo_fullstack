'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  LayoutGrid,
  MousePointerClick,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard,
  SpEmptyState,
  SpFilterBar,
  SpMetricCard,
  SpMutationFeedback,
  SpPage,
  SpPageHeader,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import {
  useServiceListing,
  useServiceListings,
} from '@/hooks/queries/service-catalog';
import type { CatalogStatus, ServiceListing } from '@/types/service-catalog';
import { ListingDetail } from './catalog/ListingDetail';
import { ServiceCatalogWizard } from './catalog/ServiceCatalogWizard';

const BASE_ROUTE = '/dashboard/serviceprovider/services';
const statusOptions: Array<'All' | CatalogStatus> = [
  'All',
  'Published',
  'Draft',
  'Unpublished',
  'Archived',
];

export function ServicesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || '';
  const serviceId = searchParams.get('serviceId') || searchParams.get('service');
  const isCreating = view === 'new';
  const isEditing = view === 'edit' && serviceId;
  const wizardStep = searchParams.get('step');
  const isWizard = (isCreating || isEditing) && wizardStep;
  const listingsQuery = useServiceListings();
  const listings = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data]);
  const atCapacity = listings.length >= 4;

  // If creating without step param, redirect to step 1 (wizard entry point)
  useEffect(() => {
    if (isCreating && !wizardStep) {
      router.replace(`${BASE_ROUTE}?view=new&step=1`);
    }
  }, [isCreating, wizardStep, router]);

  const showList = () => router.push(BASE_ROUTE);
  const showNew = () => {
    if (!atCapacity) {
      router.push(`${BASE_ROUTE}?view=new&step=1`);
    }
  };
  const showService = (id: string) => {
    const url = `${BASE_ROUTE}?view=edit&step=1&serviceId=${encodeURIComponent(id)}`;
    router.push(url);
  };

  return (
    <SpPage>
      <SpPageHeader
        title={isCreating ? 'Create service' : isEditing ? 'Edit service' : 'Service Catalog'}
        description={
          isCreating
            ? 'Describe the service clients can discover, then add its packages and terms.'
            : isEditing
              ? 'Edit your service listing.'
              : 'Create and manage the services clients can discover in the marketplace.'
        }
        actions={
          isWizard || (serviceId && view !== 'edit') ? (
            <Button type="button" variant="outline" onClick={showList}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              All services
            </Button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                onClick={showNew}
                disabled={atCapacity}
                title={atCapacity ? "Maximum of 4 services reached" : "Create a new service"}
              >
                <Plus className="size-4" aria-hidden="true" />
                New service
              </Button>
              {atCapacity && (
                <p className="text-xs text-[#6B7280]">Maximum of 4 services reached</p>
              )}
            </div>
          )
        }
      />

      {!isCreating && !serviceId && <ListingsList onOpen={showService} onCreate={showNew} />}
      {isWizard && <ServiceCatalogWizard onExit={showList} />}
      {serviceId && view !== 'edit' && <ListingDetailLoader id={serviceId} />}
    </SpPage>
  );
}

function ListingsList({
  onOpen,
  onCreate,
}: {
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const listingsQuery = useServiceListings();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('All');

  const listings = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return listings.filter((listing) => {
      const matchesStatus = status === 'All' || listing.status === status;
      const matchesQuery =
        !needle ||
        listing.title.toLocaleLowerCase().includes(needle) ||
        listing.description.toLocaleLowerCase().includes(needle) ||
        listing.category.toLocaleLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [listings, query, status]);

  if (listingsQuery.isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading service catalog">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-16 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (listingsQuery.isError) {
    return (
      <SpMutationFeedback status="error">
        <div className="flex flex-wrap items-center gap-3">
          <span>Your service catalog could not be loaded.</span>
          <button
            type="button"
            onClick={() => listingsQuery.refetch()}
            className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
          >
            Try again
          </button>
        </div>
      </SpMutationFeedback>
    );
  }

  const atCapacity = listings.length >= 4;

  if (listings.length === 0) {
    return (
      <SpEmptyState
        icon={LayoutGrid}
        title="No Published Services"
        description="Create your first service listing to start receiving briefs."
        action={
          <Button type="button" onClick={onCreate} disabled={atCapacity}>
            <Plus className="size-4" aria-hidden="true" />
            Create Service
          </Button>
        }
      />
    );
  }

  const published = listings.filter((listing) => listing.status === 'Published').length;
  const impressions = listings.reduce((total, listing) => total + listing.impressions, 0);
  const clicks = listings.reduce((total, listing) => total + listing.clicks, 0);

  return (
    <div className="space-y-5">
      {atCapacity && (
        <SpMutationFeedback status="warning">
          You have reached the maximum of 4 services. You cannot create additional listings at this time.
        </SpMutationFeedback>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <SpMetricCard label="Published services" value={published} icon={LayoutGrid} />
        <SpMetricCard label="Lifetime impressions" value={impressions.toLocaleString()} icon={Eye} />
        <SpMetricCard label="Lifetime clicks" value={clicks.toLocaleString()} icon={MousePointerClick} />
      </div>

      <SpFilterBar>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" aria-hidden="true" />
          <Input
            aria-label="Search services"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, description, or category"
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#374151]">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])}
            className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </SpFilterBar>

      {filtered.length === 0 ? (
        <SpEmptyState
          icon={Search}
          title="No services match these filters"
          description="Clear the search or choose another status to see your other listings."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery('');
                setStatus('All');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onOpen={() => onOpen(listing.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, onOpen }: { listing: ServiceListing; onOpen: () => void }) {
  return (
    <SpCard className="flex min-h-64 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
            {formatEnum(listing.category)}
          </p>
          <h2 className="mt-2 font-heading text-lg font-semibold leading-6 text-[#171717]">
            {listing.title || 'Untitled service'}
          </h2>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6B7280]">
        {listing.description || 'Add a description so clients understand the scope of this service.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {listing.industryFocus.slice(0, 3).map((industry) => (
          <SpStatusBadge key={industry}>{industry}</SpStatusBadge>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-[#E5E7EB] pt-5">
        <div className="flex items-center gap-5 text-xs text-[#6B7280]">
          <span className="inline-flex items-center gap-1.5" aria-label={`${listing.impressions} impressions`}>
            <Eye className="size-4" aria-hidden="true" />
            {listing.impressions.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1.5" aria-label={`${listing.clicks} clicks`}>
            <MousePointerClick className="size-4" aria-hidden="true" />
            {listing.clicks.toLocaleString()}
          </span>
          <span>Updated {new Date(listing.updatedAt).toLocaleDateString()}</span>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onOpen}>
          Edit
        </Button>
      </div>
    </SpCard>
  );
}

function ListingDetailLoader({ id }: { id: string }) {
  const listingQuery = useServiceListing(id);

  if (listingQuery.isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading service details">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <SpMutationFeedback status="error">
        <div className="flex flex-wrap items-center gap-3">
          <span>This service could not be loaded.</span>
          <button
            type="button"
            onClick={() => listingQuery.refetch()}
            className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
          >
            Try again
          </button>
        </div>
      </SpMutationFeedback>
    );
  }

  return <ListingDetail detail={listingQuery.data} />;
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'Published'
      ? 'positive'
      : status === 'Unpublished'
        ? 'warning'
        : status === 'Archived'
          ? 'negative'
          : 'neutral';
  return <SpStatusBadge tone={tone}>{status}</SpStatusBadge>;
}

export function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}
