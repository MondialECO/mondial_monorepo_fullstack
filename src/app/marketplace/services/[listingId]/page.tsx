'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { recordListingImpression, recordListingClick } from '@/lib/api-analytics';
import { MediaCarousel } from '@/components/marketplace/MediaCarousel';
import { ListingHeader } from '@/components/marketplace/detail/ListingHeader';
import { PackageSelectorCard } from '@/components/marketplace/detail/PackageSelectorCard';
import { ComparePackagesTable } from '@/components/marketplace/detail/ComparePackagesTable';
import { ProviderAboutCard } from '@/components/marketplace/detail/ProviderAboutCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/layout/AuthGuard';
import { useMarketplaceListingDetail } from '@/hooks/queries/marketplace';

export default function MarketplaceListingDetailPage() {
  return (
    <AuthGuard>
      <MarketplaceListingDetailContent />
    </AuthGuard>
  );
}

function MarketplaceListingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const listingId = Array.isArray(params.listingId)
    ? params.listingId[0]
    : params.listingId ?? null;

  const { data, isLoading, isError } = useMarketplaceListingDetail(listingId);
  const listing = data;

  // Analytics Phase C: Fire impression on mount
  useEffect(() => {
    if (!listingId) return;
    recordListingImpression(listingId).catch(() => {});
  }, [listingId]);

  const [selectedPackageTier, setSelectedPackageTier] = useState('Basic');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [selectedAddOnNames, setSelectedAddOnNames] = useState<Set<string>>(new Set());

  const selectedPackage = listing?.packages.find((p) => p.tier === selectedPackageTier);

  const fireAnalyticsClick = useCallback(
    (target: string) => {
      if (!listingId) return;
      recordListingClick(listingId, target).catch(() => {});
    },
    [listingId]
  );

  const handleOrderClick = useCallback(() => {
    if (!listingId || !selectedPackage) return;
    fireAnalyticsClick('order');
    const params = new URLSearchParams({ step: '1', packageId: selectedPackage.id });
    if (selectedAddOnNames.size > 0) {
      params.set('addons', Array.from(selectedAddOnNames).join(','));
    }
    router.push(`/marketplace/services/${listingId}/order?${params.toString()}`);
  }, [fireAnalyticsClick, listingId, selectedPackage, selectedAddOnNames, router]);

  const handleMessageClick = useCallback(() => {
    fireAnalyticsClick('message');
  }, [fireAnalyticsClick]);

  const handlePackageChange = useCallback(
    (tier: string) => {
      setSelectedPackageTier(tier);
      fireAnalyticsClick(`tier-${tier.toLowerCase()}`);
      // Add-on names are package-scoped, so a tier switch invalidates the selection.
      setSelectedAddOnNames(new Set());
    },
    [fireAnalyticsClick]
  );

  // Choosing from the compare table selects the tier and returns the user to the
  // sticky selector, which is scrolled past by the time they reach the table.
  const handleChooseTier = useCallback(
    (tier: string) => {
      handlePackageChange(tier);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [handlePackageChange]
  );

  const toggleAddOn = useCallback((name: string) => {
    setSelectedAddOnNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Service not found
          </h1>
          <p className="text-muted-foreground mb-6">
            This service is no longer available.
          </p>
          <Link href="/marketplace/services">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video rounded-lg mb-4" />
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  // Additional revisions are purchased later in the workroom, not at package-purchase
  // time — PackagePurchaseRequest has no field for them (canon §10.6).
  const addOnTotal = (selectedPackage?.addOns ?? [])
    .filter((a) => selectedAddOnNames.has(a.name))
    .reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (selectedPackage?.price ?? 0) + addOnTotal;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* Back Link */}
        <Link
          href="/marketplace/services"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Marketplace
        </Link>

        {/* Title, provider and tags sit above the columns so the offer stays
            adjacent to the media rather than below a wall of metadata. */}
        <ListingHeader listing={listing} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left Column: Media Carousel, Description, FAQs */}
          <div className="min-w-0 space-y-8">
            {/* Unified Media Carousel (video first, then gallery images) */}
            <MediaCarousel
              video={listing.previewVideo}
              gallery={listing.gallery}
              altTitle={listing.title}
            />

            {/* Description */}
            {listing.descriptionHtml && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  About this service
                </h2>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(listing.descriptionHtml),
                  }}
                />
              </div>
            )}

            <ComparePackagesTable
              packages={listing.packages}
              selectedTier={selectedPackageTier}
              onChooseTier={handleChooseTier}
            />

            {/* FAQs */}
            {listing.faqs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Frequently asked questions
                </h2>
                <div className="overflow-hidden rounded-xl border border-border">
                  {listing.faqs.map((faq) => (
                    <div key={faq.id} className="border-t border-border first:border-t-0">
                      <button
                        onClick={() =>
                          setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)
                        }
                        aria-expanded={expandedFaqId === faq.id}
                        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/40"
                      >
                        <span className="text-sm font-medium text-foreground">{faq.question}</span>
                        <ChevronRight
                          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                            expandedFaqId === faq.id ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {expandedFaqId === faq.id && (
                        <div className="bg-muted/30 px-5 py-3 text-sm text-foreground">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(faq.answerHtml),
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ProviderAboutCard provider={listing.provider} onMessage={handleMessageClick} />
          </div>

          {/* Right Column: sticky package selector */}
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <PackageSelectorCard
              packages={listing.packages}
              selectedTier={selectedPackageTier}
              selectedPackage={selectedPackage}
              selectedAddOnNames={selectedAddOnNames}
              total={totalPrice}
              onTierChange={handlePackageChange}
              onToggleAddOn={toggleAddOn}
              onOrder={handleOrderClick}
              onMessage={handleMessageClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
