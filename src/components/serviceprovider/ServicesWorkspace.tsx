'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  LayoutGrid,
  MessageSquare,
  MousePointerClick,
  Percent,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  useServiceListings,
} from '@/hooks/queries/service-catalog';
import {
  useAnalyticsListings,
  useAnalyticsSummary,
  useAnalyticsTimeseries,
} from '@/hooks/queries/analytics';
import type { CatalogStatus, ServiceListing } from '@/types/service-catalog';
import type { AnalyticsRange } from '@/lib/api-analytics';
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
  const serviceId = searchParams.get('serviceId');
  const legacyService = searchParams.get('service');
  const isCreating = view === 'new';
  const isEditing = view === 'edit' && serviceId;
  const wizardStep = searchParams.get('step');
  const isWizard = (isCreating || isEditing) && wizardStep;
  const listingsQuery = useServiceListings();
  const listings = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data]);
  const atCapacity = listings.length >= 4;

  // Redirect legacy ?service={id} URLs to wizard edit mode
  useEffect(() => {
    if (legacyService && !view) {
      router.replace(`${BASE_ROUTE}?view=edit&step=1&serviceId=${encodeURIComponent(legacyService)}`);
    }
  }, [legacyService, view, router]);

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
      {!isWizard && (
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
                <p className="text-xs text-muted-foreground">Maximum of 4 services reached</p>
              )}
            </div>
          }
        />
      )}

      {!isCreating && !serviceId && <ListingsList onOpen={showService} onCreate={showNew} />}
      {isWizard && <ServiceCatalogWizard onExit={showList} />}
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
  const listingsQuery = useAnalyticsListings();
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [range, setRange] = useState<AnalyticsRange>('30d');

  const listings = useMemo(() => listingsQuery.data?.listings ?? [], [listingsQuery.data]);

  // Auto-select "all" when listings load
  useEffect(() => {
    if (listings.length > 0 && selectedListingId === null) {
      setSelectedListingId('all');
    }
  }, [listings, selectedListingId]);

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(selectedListingId, range);
  const { data: timeseries, isLoading: timeseriesLoading } = useAnalyticsTimeseries(selectedListingId, range);

  const rangeLabels: Record<AnalyticsRange, string> = {
    today: 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  };

  const chartData = useMemo(() => {
    if (!timeseries?.buckets) return [];
    return timeseries.buckets.map((point) => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Impressions: point.impressions,
      Clicks: point.clicks,
    }));
  }, [timeseries]);

  const allZero = !chartData || chartData.every((p) => p.Impressions === 0 && p.Clicks === 0);

  const selectedListingTitle = selectedListingId === 'all'
    ? 'All services'
    : listings.find((l) => l.id === selectedListingId)?.title || 'Select a service';

  if (listingsQuery.isLoading) {
    return (
      <div className="space-y-8" aria-label="Loading analytics">
        <Skeleton className="h-10 rounded-lg w-64" />
        <div className="grid gap-4 grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (listingsQuery.isError) {
    return (
      <SpMutationFeedback status="error">
        <div className="flex flex-wrap items-center gap-3">
          <span>Analytics could not be loaded.</span>
          <button
            type="button"
            onClick={() => listingsQuery.refetch()}
            className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Try again
          </button>
        </div>
      </SpMutationFeedback>
    );
  }

  if (listings.length === 0) {
    return (
      <SpEmptyState
        icon={LayoutGrid}
        title="No Published Services"
        description="Create your first service listing to start receiving briefs."
        action={
          <Button type="button" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Create Service
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Service selector and Edit button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="listing-select" className="text-sm font-semibold text-muted-foreground">
            Service
          </label>
          <select
            id="listing-select"
            value={selectedListingId || 'all'}
            onChange={(e) => setSelectedListingId(e.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {listings.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.title}
              </option>
            ))}
            <option value="all">All services</option>
          </select>
        </div>
        {selectedListingId && selectedListingId !== 'all' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const id = selectedListingId;
              onOpen(id);
            }}
          >
            Edit this service
          </Button>
        )}
      </div>

      {/* Time range tabs */}
      <div className="flex gap-2">
        {(Object.keys(rangeLabels) as AnalyticsRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              range === r
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCardWithDelta
          label="Impressions"
          value={summary?.impressions ?? 0}
          delta={summary?.impressionsDelta}
          icon={Eye}
          isLoading={summaryLoading}
        />
        <MetricCardWithDelta
          label="Clicks"
          value={summary?.clicks ?? 0}
          delta={summary?.clicksDelta}
          icon={MousePointerClick}
          isLoading={summaryLoading}
        />
        <MetricCardWithDelta
          label="Inquiries"
          value={summary?.inquiries ?? 0}
          delta={summary?.inquiriesDelta}
          icon={MessageSquare}
          isLoading={summaryLoading}
        />
        <MetricCardWithDelta
          label="Conversion Rate"
          value={summary?.conversionRate}
          delta={summary?.conversionRateDelta}
          icon={Percent}
          isLoading={summaryLoading}
          isPercentage
        />
      </div>

      {/* Chart */}
      <SpCard className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Impressions vs Clicks ({rangeLabels[range]})
        </h3>
        {timeseriesLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : allZero ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p className="text-center">No activity yet for this range. Data will appear as visitors interact with your listings.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Impressions" stroke="#3C61DD" dot={false} />
              <Line type="monotone" dataKey="Clicks" stroke="#93C5FD" dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SpCard>
    </div>
  );
}

function MetricCardWithDelta({
  label,
  value,
  delta,
  icon: Icon,
  isLoading,
  isPercentage,
}: {
  label: string;
  value: number | null | undefined;
  delta: number | null | undefined;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  isPercentage?: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-32 rounded-lg" />;
  }

  const displayValue = value === 0 && !delta ? '—' : (
    isPercentage ? `${Number((value ?? 0).toFixed(2))}%` : String(value ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  );

  const showDelta = delta !== null && delta !== undefined && value !== 0;

  return (
    <SpCard className="p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="text-3xl font-bold text-foreground mb-2">{displayValue}</p>
      {showDelta && delta !== null && delta !== undefined && (
        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          delta >= 0
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {delta >= 0 ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {Math.abs(delta).toFixed(0)}%
        </div>
      )}
    </SpCard>
  );
}

