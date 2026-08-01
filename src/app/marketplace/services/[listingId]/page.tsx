'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';
import { formatPrice } from '@/lib/marketplace-format';
import { recordListingImpression, recordListingClick } from '@/lib/api-analytics';
import { MediaCarousel } from '@/components/marketplace/MediaCarousel';
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
  const currency = selectedPackage?.currency ?? 'EUR';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/marketplace/services"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Media Carousel, Description, FAQs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Unified Media Carousel (video first, then gallery images) */}
            <MediaCarousel
              video={listing.previewVideo}
              gallery={listing.gallery}
              altTitle={listing.title}
            />

            {/* Service Info */}
            <div>
              <div className="mb-4">
                <span className="inline-block px-2 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground mb-2">
                  {listing.category}
                </span>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {listing.title}
                </h1>
                <p className="text-muted-foreground">
                  {listing.serviceType}
                </p>
              </div>

              {/* Tags */}
              {(listing.metadataTags.length > 0 || listing.searchTags.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {[...listing.metadataTags, ...listing.searchTags].map(
                    (tag, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

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

            {/* FAQs */}
            {listing.faqs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Frequently asked questions
                </h2>
                <div className="space-y-2 divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {listing.faqs.map((faq) => (
                    <div key={faq.id}>
                      <button
                        onClick={() =>
                          setExpandedFaqId(
                            expandedFaqId === faq.id ? null : faq.id
                          )
                        }
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-sm text-foreground">
                          {faq.question}
                        </span>
                        <ChevronRight
                          className={`size-4 text-muted-foreground transition-transform ${
                            expandedFaqId === faq.id ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {expandedFaqId === faq.id && (
                        <div className="px-4 py-3 bg-muted/30 text-sm text-foreground space-y-3">
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
          </div>

          {/* Right Column: Provider & Package Selector */}
          <div className="lg:col-span-1 space-y-6">
            {/* Provider Card */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex gap-3 mb-4">
                {listing.provider.profileImageUrl && resolveProviderMediaUrl(listing.provider.profileImageUrl) ? (
                  <img
                    src={resolveProviderMediaUrl(listing.provider.profileImageUrl)!}
                    alt={listing.provider.displayName}
                    className="rounded-full size-12 object-cover"
                  />
                ) : (
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {listing.provider.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {listing.provider.displayName}
                  </h3>
                  {listing.provider.headline && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {listing.provider.headline}
                    </p>
                  )}
                  {listing.provider.verified && (
                    <span className="inline-block px-2 py-1 rounded-full bg-green-50 text-xs font-medium text-green-700">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {listing.provider.trustScore != null && (
                <div className="text-sm mb-3">
                  <p className="text-muted-foreground">Trust Score</p>
                  <p className="font-semibold text-foreground">
                    {listing.provider.trustScore.toFixed(1)}/5.0
                  </p>
                </div>
              )}

              {listing.provider.completedOrders != null && (
                <div className="text-sm mb-3">
                  <p className="text-muted-foreground">Completed Orders</p>
                  <p className="font-semibold text-foreground">
                    {listing.provider.completedOrders}
                  </p>
                </div>
              )}

              {listing.provider.medianResponseTime && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Response Time</p>
                  <p className="font-semibold text-foreground">
                    {listing.provider.medianResponseTime}
                  </p>
                </div>
              )}
            </div>

            {/* Package Selector */}
            <div className="border border-border rounded-lg p-4">
              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-border -mx-4 px-4">
                {listing.packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => handlePackageChange(pkg.tier)}
                    className={cn(
                      'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                      selectedPackageTier === pkg.tier
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {pkg.tier}
                    {pkg.tier === 'Standard' && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                        Recommended
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {selectedPackage && (
                <div className="space-y-4">
                  {/* Price */}
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Price</p>
                    <p className="text-3xl font-bold text-foreground">
                      {formatPrice(selectedPackage.price, currency)}
                    </p>
                  </div>

                  {/* Delivery */}
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Delivery Time</p>
                    <p className="font-medium text-foreground">
                      {selectedPackage.deliveryTimeValue}{' '}
                      {selectedPackage.deliveryTimeUnit}
                    </p>
                  </div>

                  {/* Revisions */}
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Revisions</p>
                    <p className="font-medium text-foreground">
                      {selectedPackage.unlimitedRevisions
                        ? 'Unlimited'
                        : `${selectedPackage.includedRevisionCount} included`}
                    </p>
                  </div>

                  {/* Screens */}
                  {selectedPackage.screensIncluded != null && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">
                        Screens Included
                      </p>
                      <p className="font-medium text-foreground">
                        {selectedPackage.screensIncluded}
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <div>
                    <p className="text-muted-foreground text-xs mb-2">
                      What's included
                    </p>
                    <ul className="space-y-2">
                      {selectedPackage.includedFeatures.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <Check className="size-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Excluded */}
                  {selectedPackage.excludedFeatures.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-2">
                        Not included
                      </p>
                      <ul className="space-y-2">
                        {selectedPackage.excludedFeatures.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <X className="size-4 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Add-ons */}
                  {selectedPackage.addOns.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-muted-foreground text-xs mb-2">Add-ons</p>
                      <div className="space-y-2">
                        {selectedPackage.addOns.map((addon, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm"
                          >
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedAddOnNames.has(addon.name)}
                                onChange={() => toggleAddOn(addon.name)}
                                className="rounded border border-input"
                              />
                              <span className="text-foreground">{addon.name}</span>
                            </label>
                            <span className="font-medium text-foreground">
                              +{formatPrice(addon.price, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="text-2xl font-bold text-foreground">
                        {formatPrice(totalPrice, currency)}
                      </span>
                    </div>

                    {/* CTAs */}
                    <div className="space-y-2">
                      <Button
                        onClick={handleOrderClick}
                        className="w-full"
                      >
                        Order for {formatPrice(totalPrice, currency)}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleMessageClick}
                        className="w-full"
                      >
                        Message Provider
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
