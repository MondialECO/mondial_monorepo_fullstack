'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, AlertCircle, Check } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  SpCard,
  SpMutationFeedback,
} from '@/components/serviceprovider/ui';
import type { ServiceListing, ServicePackage } from '@/types/service-catalog';
import {
  useServiceListingDetail,
  usePublishPackage,
  usePublishListing,
} from '@/hooks/queries/service-catalog';

const BASE_ROUTE = '/dashboard/serviceprovider/services';

export function WizardStep6Review({
  listing,
  onBack,
}: {
  listing: ServiceListing;
  onBack: () => void;
}) {
  const router = useRouter();
  const listingDetail = useServiceListingDetail(listing.id);
  const publishPackage = usePublishPackage();
  const publishListing = usePublishListing();

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Validate packages on load
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

    // Validate each package has required fields (§6.2)
    packages.forEach((pkg) => {
      if (!pkg.packageTitle?.trim()) errors.push(`${pkg.packageType} package: title is required.`);
      if (!pkg.packageDescription?.trim()) errors.push(`${pkg.packageType} package: description is required.`);
      if (pkg.price <= 0) errors.push(`${pkg.packageType} package: price must be > 0.`);
      if (!pkg.currency?.trim()) errors.push(`${pkg.packageType} package: currency is required.`);
      if (pkg.deliveryTimeValue <= 0) errors.push(`${pkg.packageType} package: delivery time is required.`);
      if (pkg.deliverables.length === 0) errors.push(`${pkg.packageType} package: at least one deliverable is required.`);
      if (!pkg.unlimitedRevisions && pkg.revisionRequestWindowDays <= 0)
        errors.push(`${pkg.packageType} package: revision policy is required.`);
    });

    // Cross-package validation (§6.2)
    const basicPkg = packages.find((p) => p.packageType === 'Basic');
    const standardPkg = packages.find((p) => p.packageType === 'Standard');
    const premiumPkg = packages.find((p) => p.packageType === 'Premium');

    // All must share currency
    const currencies = [...new Set(packages.map((p) => p.currency))];
    if (currencies.length > 1) {
      errors.push('All packages must use the same currency.');
    }

    // Unique titles
    const titles = packages.map((p) => p.packageTitle);
    if (new Set(titles).size !== titles.length) {
      errors.push('Package titles must be unique.');
    }

    // Feature hierarchy (Standard >= Basic, Premium >= Standard)
    if (basicPkg && standardPkg && standardPkg.includedFeatures.length < basicPkg.includedFeatures.length) {
      warnings.push('Standard package has fewer features than Basic.');
    }
    if (standardPkg && premiumPkg && premiumPkg.includedFeatures.length < standardPkg.includedFeatures.length) {
      warnings.push('Premium package has fewer features than Standard.');
    }

    // Price hierarchy
    if (basicPkg && standardPkg && standardPkg.price < basicPkg.price) {
      warnings.push('Standard package is priced lower than Basic.');
    }
    if (standardPkg && premiumPkg && premiumPkg.price < standardPkg.price) {
      warnings.push('Premium package is priced lower than Standard.');
    }

    // Delivery time hierarchy (require confirmation if violated)
    if (basicPkg && standardPkg) {
      const basicDays = basicPkg.deliveryTimeValue;
      const standardDays = standardPkg.deliveryTimeValue;
      if (standardDays < basicDays) {
        warnings.push('Standard package has a shorter delivery time than Basic.');
      }
    }
    if (standardPkg && premiumPkg) {
      const standardDays = standardPkg.deliveryTimeValue;
      const premiumDays = premiumPkg.deliveryTimeValue;
      if (premiumDays < standardDays) {
        warnings.push('Premium package has a shorter delivery time than Standard.');
      }
    }

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
      // Publish all packages first
      if (listingDetail.data?.packages) {
        await Promise.all(
          listingDetail.data.packages.map((pkg) =>
            publishPackage.mutateAsync([pkg.id, { confirmShorterDelivery: true }])
          )
        );
      }

      // Then publish the listing
      await publishListing.mutateAsync([listing.id]);

      // Redirect to services listing on success
      router.push(BASE_ROUTE);
    } catch {
      setPublishError('Could not publish service. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!listingDetail.data) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  const { packages } = listingDetail.data;

  return (
    <div className="space-y-6">
      <SpCard className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#171717]">Review & Publish</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Review your service listing before publishing it to the marketplace.
          </p>
        </div>

        {publishError && <SpMutationFeedback status="error">{publishError}</SpMutationFeedback>}

        {/* Service Summary */}
        <div className="rounded-lg bg-[#F9FAFB] p-5">
          <h3 className="font-semibold text-[#171717]">{listing.title}</h3>
          <p className="mt-2 text-sm text-[#6B7280]">{listing.description}</p>
          {listing.galleryImages && listing.galleryImages.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {listing.galleryImages.slice(0, 3).map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={img.publicUrl}
                    alt={`Gallery preview ${img.displayOrder + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Validation Results */}
        {(validationErrors.length > 0 || validationWarnings.length > 0) && (
          <div className="space-y-3">
            {validationErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex gap-2">
                  <AlertCircle className="size-5 flex-shrink-0 text-red-600" aria-hidden="true" />
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
                  <AlertCircle className="size-5 flex-shrink-0 text-yellow-600" aria-hidden="true" />
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

        {validationErrors.length === 0 && validationWarnings.length === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex gap-2">
              <Check className="size-5 flex-shrink-0 text-green-600" aria-hidden="true" />
              <div>
                <h4 className="font-medium text-green-900">Ready to publish</h4>
                <p className="mt-1 text-sm text-green-700">All validation checks passed.</p>
              </div>
            </div>
          </div>
        )}
      </SpCard>

      {/* Package Summary Cards */}
      <div className="space-y-4">
        {packages.map((pkg) => (
          <SpCard key={pkg.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-[#171717]">{pkg.packageType} Package</h3>
                <p className="mt-1 text-sm text-[#6B7280]">{pkg.packageTitle}</p>
                <p className="mt-2">
                  <span className="font-medium text-[#171717]">
                    ${pkg.price.toFixed(2)} {pkg.currency}
                  </span>
                  <span className="ml-3 text-sm text-[#6B7280]">
                    • {pkg.deliveryTimeValue} {pkg.deliveryTimeUnit}
                  </span>
                  <span className="ml-3 text-sm text-[#6B7280]">
                    • {pkg.includedRevisionCount} revisions
                  </span>
                </p>
                {pkg.includedFeatures.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {pkg.includedFeatures.slice(0, 3).map((feature, i) => (
                      <li key={i} className="text-xs text-[#6B7280]">
                        ✓ {feature}
                      </li>
                    ))}
                    {pkg.includedFeatures.length > 3 && (
                      <li className="text-xs text-[#6B7280]">... and {pkg.includedFeatures.length - 3} more</li>
                    )}
                  </ul>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm">
                ✏️ Edit
              </Button>
            </div>
          </SpCard>
        ))}
      </div>

      {/* Publish Button */}
      <SpCard>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onBack} variant="outline" disabled={isPublishing}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || validationErrors.length > 0}
            className="bg-[#10B981] hover:bg-[#059669]"
          >
            {isPublishing ? 'Publishing…' : 'Publish Service Listing'}
          </Button>
        </div>
      </SpCard>
    </div>
  );
}
