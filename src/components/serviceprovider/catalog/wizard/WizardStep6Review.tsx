'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, AlertCircle, Check, Edit2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SpMutationFeedback } from '@/components/serviceprovider/ui';
import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';
import type { ServiceListing, ServicePackage } from '@/types/service-catalog';
import {
  useServiceListing,
  usePublishPackage,
  usePublishListing,
} from '@/hooks/queries/service-catalog';

const BASE_ROUTE = '/dashboard/serviceprovider/services';

export function WizardStep6Review({
  listing,
  onBack,
  onEditStep,
}: {
  listing: ServiceListing;
  onBack: () => void;
  onEditStep?: (step: number) => void;
}) {
  const router = useRouter();
  const listingDetail = useServiceListing(listing.id);
  const publishPackage = usePublishPackage();
  const publishListing = usePublishListing();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    if (listingDetail.data?.packages) {
      validatePackages(listingDetail.data.packages);
    }
  }, [listingDetail.data?.packages]);

  const validatePackages = (packages: ServicePackage[]) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (packages.length === 0) {
      errors.push('At least one package is required.');
      setValidationErrors(errors);
      setValidationWarnings(warnings);
      return;
    }

    packages.forEach((pkg) => {
      if (!pkg.packageTitle?.trim()) errors.push(`${pkg.packageType} package: title is required.`);
      if (pkg.price <= 0) errors.push(`${pkg.packageType} package: price must be > 0.`);
      if (!pkg.currency?.trim()) errors.push(`${pkg.packageType} package: currency is required.`);
      if (pkg.deliveryTimeValue <= 0) errors.push(`${pkg.packageType} package: delivery time is required.`);
      if (!pkg.unlimitedRevisions && pkg.revisionRequestWindowDays <= 0)
        errors.push(`${pkg.packageType} package: revision policy is required.`);
    });

    const basicPkg = packages.find((p) => p.packageType === 'Basic');
    const standardPkg = packages.find((p) => p.packageType === 'Standard');
    const premiumPkg = packages.find((p) => p.packageType === 'Premium');

    const currencies = [...new Set(packages.map((p) => p.currency))];
    if (currencies.length > 1) errors.push('All packages must use the same currency.');

    const titles = packages.map((p) => p.packageTitle);
    if (new Set(titles).size !== titles.length) errors.push('Package titles must be unique.');

    if (basicPkg && standardPkg && standardPkg.includedFeatures.length < basicPkg.includedFeatures.length)
      warnings.push('Standard package has fewer features than Basic.');
    if (standardPkg && premiumPkg && premiumPkg.includedFeatures.length < standardPkg.includedFeatures.length)
      warnings.push('Premium package has fewer features than Standard.');

    if (basicPkg && standardPkg && standardPkg.price < basicPkg.price)
      warnings.push('Standard package is priced lower than Basic.');
    if (standardPkg && premiumPkg && premiumPkg.price < standardPkg.price)
      warnings.push('Premium package is priced lower than Standard.');

    if (basicPkg && standardPkg && standardPkg.deliveryTimeValue < basicPkg.deliveryTimeValue)
      warnings.push('Standard package has a shorter delivery time than Basic.');
    if (standardPkg && premiumPkg && premiumPkg.deliveryTimeValue < standardPkg.deliveryTimeValue)
      warnings.push('Premium package has a shorter delivery time than Standard.');

    setValidationErrors(errors);
    setValidationWarnings(warnings);
  };

  const handlePublish = async () => {
    if (validationErrors.length > 0) {
      setPublishError('Fix all validation errors before publishing.');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      const isPublished = listing.status === 'Published';

      if (isPublished) {
        router.push(BASE_ROUTE);
      } else {
        if (listingDetail.data?.packages) {
          await Promise.all(
            listingDetail.data.packages.map((pkg) =>
              publishPackage.mutateAsync([pkg.id, { confirmShorterDelivery: true }])
            )
          );
        }
        await publishListing.mutateAsync([listing.id]);
        router.push(BASE_ROUTE);
      }
    } catch {
      setPublishError('Could not save/publish service. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!listingDetail.data) return <div className="py-8 text-center">Loading...</div>;

  const { packages } = listingDetail.data;

  return (
    <div className="space-y-6 pb-24">
      {publishError && <SpMutationFeedback status="error">{publishError}</SpMutationFeedback>}

      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="space-y-3">
          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="size-5 flex-shrink-0 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">Issues to fix before publishing:</h4>
                  <ul className="mt-2 space-y-1">
                    {validationErrors.map((error, i) => (
                      <li key={i} className="text-sm text-red-700">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {validationWarnings.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="size-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-900">Review these before publishing:</h4>
                  <ul className="mt-2 space-y-1">
                    {validationWarnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-700">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
              <button
                onClick={() => onEditStep?.(1)}
                className="flex items-center gap-1 text-primary hover:text-[#2E4CC1]"
              >
                <Edit2 className="size-4" />
                <span className="text-sm font-medium">EDIT</span>
              </button>
            </div>

            {listing.galleryImages && listing.galleryImages.length > 0 && (
              <div className="mt-6 flex gap-3 overflow-x-auto">
                {listing.galleryImages.slice(0, 4).map((img) => (
                  <div key={img.id} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={resolveProviderMediaUrl(img.publicUrl)!}
                      alt="Gallery"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
                {listing.galleryImages.length >= 4 && (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded border-2 border-dashed border-input bg-muted text-xs text-muted-foreground">
                    +{listing.galleryImages.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-lg border bg-white p-4 ${
                pkg.packageType === 'Standard'
                  ? 'border-2 border-primary'
                  : 'border border-border'
              }`}
            >
              {pkg.packageType === 'Standard' && (
                <div className="mb-2 inline-block rounded bg-primary px-2 py-1 text-xs font-bold text-white">
                  RECOMMENDED
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{pkg.packageType}</h3>
                  <div className="mt-3 text-3xl font-bold text-foreground">
                    ${pkg.price.toFixed(2)}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {pkg.screensIncluded ? `${pkg.screensIncluded} Dashboard Pages • ` : ''}
                    {pkg.includedRevisionCount} Revisions • {pkg.deliveryTimeValue} {pkg.deliveryTimeUnit} Delivery
                  </div>
                </div>
                <button
                  onClick={() => onEditStep?.(2)}
                  className="text-muted-foreground hover:text-[#374151]"
                >
                  <Edit2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {validationErrors.length === 0 && validationWarnings.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex gap-2">
            <Check className="size-5 flex-shrink-0 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Ready to publish</h4>
              <p className="mt-1 text-sm text-green-700">All validation checks passed.</p>
            </div>
          </div>
        </div>
      )}

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-white p-4">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button onClick={onBack} variant="outline" disabled={isPublishing}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || validationErrors.length > 0}
            className="ml-auto bg-primary hover:bg-[#2E4CC1]"
          >
            {(() => {
              if (isPublishing) return listing.status === 'Published' ? 'Saving…' : 'Publishing…';
              if (listing.status === 'Published') return 'Save Changes';
              if (listing.status === 'Archived') return 'Republish Service Listing';
              return 'Publish Service Listing';
            })()}
          </Button>
        </div>
      </div>
    </div>
  );
}
