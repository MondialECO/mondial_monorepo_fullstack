'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, MousePointerClick, Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SpCard,
  SpMutationFeedback,
  SpSectionHeader,
  SpStatusBadge,
  SpTabBar,
} from '@/components/serviceprovider/ui';
import { usePublishListing, useUnpublishListing } from '@/hooks/queries/service-catalog';
import type { CatalogStatus, ServiceListingDetail, ServicePackage } from '@/types/service-catalog';
import { ListingEditor } from './ListingEditor';
import { PackageBuilder } from './PackageBuilder';
import { FaqBuilder } from './FaqBuilder';
import { CapacityPanel } from './CapacityPanel';

type Tab = 'overview' | 'packages' | 'faqs' | 'capacity';
const tabs: Tab[] = ['overview', 'packages', 'faqs', 'capacity'];
const BASE_ROUTE = '/dashboard/serviceprovider/services';

export function ListingDetail({ detail }: { detail: ServiceListingDetail }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { listing, packages, faqs } = detail;
  const requestedTab = searchParams.get('tab');
  const tab: Tab = tabs.includes(requestedTab as Tab) ? (requestedTab as Tab) : 'overview';
  const editing = searchParams.get('mode') === 'edit';
  const publish = usePublishListing();
  const unpublish = useUnpublishListing();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const hrefFor = (nextTab: Tab) =>
    `${BASE_ROUTE}?service=${encodeURIComponent(listing.id)}&tab=${nextTab}`;
  const closeEditor = () => router.replace(hrefFor(tab));

  if (editing) {
    return (
      <ListingEditor
        existing={listing}
        onDone={closeEditor}
        onCancel={closeEditor}
      />
    );
  }

  const changeStatus = async () => {
    setFeedback(null);
    try {
      if (listing.status === 'Published') {
        await unpublish.mutateAsync([listing.id]);
        setFeedback({ status: 'success', message: 'Service unpublished successfully.' });
      } else {
        await publish.mutateAsync([listing.id]);
        setFeedback({ status: 'success', message: 'Service published successfully.' });
      }
      setConfirmOpen(false);
    } catch {
      setFeedback({
        status: 'error',
        message: listing.status === 'Published'
          ? 'The service could not be unpublished. Try again.'
          : 'The service could not be published. Review its content and try again.',
      });
    }
  };

  const statusPending = publish.isPending || unpublish.isPending;

  return (
    <div className="space-y-5">
      <SpCard>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={listing.status} />
              <SpStatusBadge>{formatEnum(listing.category)}</SpStatusBadge>
            </div>
            <h2 className="mt-4 font-heading text-2xl font-semibold leading-8 text-[#171717]">
              {listing.title || 'Untitled service'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              {listing.description || 'Add a description so clients understand this service.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-4" aria-hidden="true" />
                {listing.impressions.toLocaleString()} lifetime impressions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MousePointerClick className="size-4" aria-hidden="true" />
                {listing.clicks.toLocaleString()} lifetime clicks
              </span>
              <span>Updated {new Date(listing.updatedAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`${hrefFor(tab)}&mode=edit`)}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit overview
            </Button>
            <Button type="button" onClick={() => setConfirmOpen(true)}>
              {listing.status === 'Published' ? 'Unpublish service' : 'Publish service'}
            </Button>
          </div>
        </div>
      </SpCard>

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}

      <SpTabBar
        label="Service management sections"
        items={tabs.map((item) => ({
          label: item === 'faqs' ? 'FAQs' : item[0].toUpperCase() + item.slice(1),
          href: hrefFor(item),
          active: tab === item,
          badge:
            item === 'packages'
              ? <SpStatusBadge className="px-2 py-0.5">{packages.length}</SpStatusBadge>
              : item === 'faqs'
                ? <SpStatusBadge className="px-2 py-0.5">{faqs.length}</SpStatusBadge>
                : undefined,
        }))}
      />

      {tab === 'overview' && <ServiceOverview detail={detail} />}
      {tab === 'packages' && (
        <PackageBuilder listingId={listing.id} packages={packages} category={listing.category} />
      )}
      {tab === 'faqs' && <FaqBuilder listingId={listing.id} faqs={faqs} packages={packages} />}
      {tab === 'capacity' && <CapacityPanel />}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {listing.status === 'Published' ? 'Unpublish this service?' : 'Publish this service?'}
            </DialogTitle>
            <DialogDescription>
              {listing.status === 'Published'
                ? 'Clients will no longer discover this listing. Its stored packages and FAQs will remain available for later editing.'
                : 'This makes the listing discoverable. Package publication is managed separately in the Packages section.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={statusPending}>
              Cancel
            </Button>
            <Button type="button" onClick={changeStatus} disabled={statusPending}>
              {statusPending
                ? 'Updating…'
                : listing.status === 'Published'
                  ? 'Confirm unpublish'
                  : 'Confirm publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceOverview({ detail }: { detail: ServiceListingDetail }) {
  const { listing, packages, faqs } = detail;
  const publishedPackages = packages.filter((item) => item.status === 'Published');

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
      <SpCard>
        <SpSectionHeader
          title="Client-facing overview"
          description="A management preview built only from fields currently stored for this listing."
        />

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">About this service</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#4B5563]">
              {listing.description || 'No description has been added.'}
            </p>
          </div>

          <TokenList title="Industry focus" values={listing.industryFocus} empty="No industries specified." />
          <TokenList title="Geographic coverage" values={listing.geographicCoverage} empty="No geographic coverage specified." />

          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#171717]">Published packages</h3>
              <span className="text-xs text-[#6B7280]">{publishedPackages.length} available</span>
            </div>
            {publishedPackages.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-[#D1D5DB] p-4 text-sm text-[#6B7280]">
                No packages are published yet.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {publishedPackages.map((item) => <PackageSummary key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </div>
      </SpCard>

      <SpCard>
        <SpSectionHeader title="Listing readiness" description="A factual snapshot, not a fabricated quality score." />
        <ul className="mt-5 space-y-3">
          <ReadinessItem label="Service title" ready={!!listing.title.trim()} />
          <ReadinessItem label="Service description" ready={!!listing.description.trim()} />
          <ReadinessItem label="At least one package" ready={packages.length > 0} />
          <ReadinessItem label="Published package" ready={publishedPackages.length > 0} />
          <ReadinessItem label="Client FAQ" ready={faqs.length > 0} optional />
        </ul>
        <p className="mt-5 border-t border-[#E5E7EB] pt-4 text-xs leading-5 text-[#6B7280]">
          Gallery, video, search-tag, subcategory, rating, and public-profile preview fields are not available in the current Service Catalog contract.
        </p>
      </SpCard>
    </div>
  );
}

function TokenList({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#171717]">{title}</h3>
      {values.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={title}>
          {values.map((value) => <li key={value}><SpStatusBadge>{value}</SpStatusBadge></li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#6B7280]">{empty}</p>
      )}
    </div>
  );
}

function PackageSummary({ item }: { item: ServicePackage }) {
  const amount = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: item.currency || 'EUR',
    maximumFractionDigits: 2,
  }).format(item.price);

  return (
    <article className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">{item.packageType}</p>
      <p className="mt-2 text-lg font-semibold text-[#171717]">{amount}</p>
      <p className="mt-2 text-xs leading-5 text-[#6B7280]">
        {item.deliveryTimeValue} {formatEnum(item.deliveryTimeUnit)} · {item.unlimitedRevisions ? 'Unlimited revisions' : `${item.includedRevisionCount} revisions`}
      </p>
    </article>
  );
}

function ReadinessItem({ label, ready, optional }: { label: string; ready: boolean; optional?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-[#F9FAFB] px-4 py-3 text-sm">
      <span className="text-[#374151]">{label}</span>
      <SpStatusBadge tone={ready ? 'positive' : optional ? 'neutral' : 'warning'}>
        {ready ? (
          <><ShieldCheck className="mr-1 size-3.5" aria-hidden="true" />Ready</>
        ) : optional ? 'Optional' : 'Needs attention'}
      </SpStatusBadge>
    </li>
  );
}

function StatusBadge({ status }: { status: CatalogStatus }) {
  const tone = status === 'Published' ? 'positive' : status === 'Unpublished' ? 'warning' : status === 'Archived' ? 'negative' : 'neutral';
  return <SpStatusBadge tone={tone}>{status}</SpStatusBadge>;
}

function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}
