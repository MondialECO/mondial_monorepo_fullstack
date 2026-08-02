'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SpCard,
  SpMutationFeedback,
} from '@/components/serviceprovider/ui';
import type { ServicePackage, PackageType } from '@/types/service-catalog';
import {
  useAddPackage,
  useUpdatePackage,
  useServiceListing,
} from '@/hooks/queries/service-catalog';

const PACKAGE_TYPES: PackageType[] = ['Basic', 'Standard', 'Premium'];
const PLATFORM_FEE_PERCENT = 0.12;

export function WizardStep2Pricing({
  listingId,
  onNext,
  onBack,
}: {
  listingId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const listingDetail = useServiceListing(listingId);
  const addPackage = useAddPackage();
  const updatePackage = useUpdatePackage();

  const createDefaultPackages = () =>
    PACKAGE_TYPES.map((type) => ({
      id: `temp-${type}-${Date.now()}`,
      serviceId: listingId,
      packageName: type,
      packageType: type,
      packageTitle: `${type} Package`,
      packageDescription: '',
      price: 0,
      currency: 'EUR',
      pricingModel: null,
      deliveryTimeValue: 5,
      deliveryTimeUnit: 'Days' as const,
      deliveryDayType: 'CalendarDays' as const,
      deliveryStartRule: 'AfterEscrowFunding' as const,
      deliveryTimezone: 'UTC',
      dailyCutoffTime: '17:00',
      includedRevisionCount: 1,
      unlimitedRevisions: false,
      revisionRequestWindowDays: 3,
      additionalRevisionAvailable: false,
      additionalRevisionPrice: 0,
      additionalRevisionDeliveryTime: 1,
      revisionScopeDescription: '',
      deliverables: [],
      includedFeatures: [],
      excludedFeatures: [],
      screensIncluded: null,
      addOns: [],
      requirementsTemplate: [],
      cancellationPolicy: 'FlexibleFullRefundBeforeStart' as const,
      instantOrderEnabled: false,
      manualApprovalRequired: false,
      maximumActiveOrders: 10,
      status: 'Draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ServicePackage));

  const [packages, setPackages] = useState<ServicePackage[]>(createDefaultPackages());
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // If query has real packages, use them. Otherwise keep the defaults.
    if (listingDetail.data?.packages && listingDetail.data.packages.length > 0) {
      setPackages(listingDetail.data.packages);
    }
  }, [listingDetail.data?.packages]);

  const getPackageByType = (type: PackageType) =>
    packages.find((p) => p.packageType === type);

  // Local state update only — no network call
  const updatePackageLocal = (type: PackageType, updates: Partial<ServicePackage>) => {
    setPackages((prev) =>
      prev.map((p) =>
        p.packageType === type ? { ...p, ...updates } : p
      )
    );
  };

  // Check if an ID is a real MongoDB ObjectId (24-char hex string)
  const isRealObjectId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

  // Batch save on Next Step click
  const handleNext = async () => {
    if (packages.length === 0) {
      setError('Please create at least one package before proceeding.');
      return;
    }

    if (packages.some((p) => p.includedRevisionCount === 0)) {
      setError('Number of revisions included is strictly required for all packages.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Save all packages (POST for new, PUT for existing)
      const savedPackages = await Promise.all(
        packages.map(async (pkg) => {
          // Build merge-preserved payload
          const payload = {
            packageType: pkg.packageType,
            packageName: pkg.packageName,
            packageTitle: pkg.packageTitle,
            packageDescription: pkg.packageDescription,
            price: pkg.price,
            currency: pkg.currency,
            pricingModel: pkg.pricingModel ?? null,
            deliveryTimeValue: pkg.deliveryTimeValue,
            deliveryTimeUnit: pkg.deliveryTimeUnit,
            deliveryDayType: pkg.deliveryDayType,
            deliveryStartRule: pkg.deliveryStartRule,
            deliveryTimezone: pkg.deliveryTimezone,
            dailyCutoffTime: pkg.dailyCutoffTime,
            includedRevisionCount: pkg.includedRevisionCount,
            unlimitedRevisions: pkg.unlimitedRevisions,
            revisionRequestWindowDays: pkg.revisionRequestWindowDays,
            additionalRevisionAvailable: pkg.additionalRevisionAvailable,
            additionalRevisionPrice: pkg.additionalRevisionPrice,
            additionalRevisionDeliveryTime: pkg.additionalRevisionDeliveryTime,
            revisionScopeDescription: pkg.revisionScopeDescription,
            deliverables: pkg.deliverables,
            includedFeatures: pkg.includedFeatures,
            excludedFeatures: pkg.excludedFeatures,
            screensIncluded: pkg.screensIncluded ?? null,
            addOns: pkg.addOns,
            requirementsTemplate: pkg.requirementsTemplate,
            cancellationPolicy: pkg.cancellationPolicy,
            instantOrderEnabled: pkg.instantOrderEnabled,
            manualApprovalRequired: pkg.manualApprovalRequired,
            maximumActiveOrders: pkg.maximumActiveOrders,
          };

          // POST for new (temp ID), PUT for existing (real ObjectId)
          if (isRealObjectId(pkg.id)) {
            // Existing package — PUT
            return await updatePackage.mutateAsync([pkg.id, payload]);
          } else {
            // New package — POST
            return await addPackage.mutateAsync([listingId, payload]);
          }
        })
      );

      // Update local state with saved packages (which have real IDs from backend)
      setPackages(savedPackages);
      onNext();
    } catch (err) {
      let errorMsg = 'Unknown error occurred';

      // Try to extract backend error message from response
      const anyErr = err as any;
      if (anyErr?.response?.data?.message) {
        errorMsg = anyErr.response.data.message;
      } else if (anyErr?.response?.data?.error) {
        errorMsg = anyErr.response.data.error;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      setError(`Could not save packages: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const defaultFeatures = ['Source Files', 'Responsive Design', 'Interactive Prototype'];
  const allFeatures = Array.from(
    new Set([
      ...defaultFeatures,
      ...packages.flatMap((p) => p.includedFeatures),
      ...customFeatures,
    ])
  ).sort();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Scope & Pricing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create pricing tiers for your service. Each tier includes delivery time, revisions, and features.
        </p>
      </div>

      {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}

      {/* Pricing Guidance - Correction #2: "Pricing Guidance" not "AI Pricing Assistant" */}
      <div className="rounded-lg border border-[#CAD4FA] bg-accent p-4">
        <p className="text-sm font-medium text-primary">Pricing Guidance</p>
        <p className="mt-1 text-sm text-primary">
          12% platform fee applies to every order, regardless of your tier.
        </p>
      </div>

      {/* Comparison Table - ALL FIELDS INLINE EDITABLE, NO POPUP */}
      <SpCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold text-foreground py-3 px-4">Features</th>
                {PACKAGE_TYPES.map((type) => (
                  <th key={type} className="text-center font-semibold text-foreground py-3 px-4 relative">
                    {type}
                    {type === 'Standard' && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-block bg-primary text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                        POPULAR
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price Row - INLINE INPUT */}
              <tr className="border-b border-border">
                <td className="font-medium text-foreground py-4 px-4">Price</td>
                {PACKAGE_TYPES.map((type) => {
                  const pkg = getPackageByType(type);
                  return (
                    <td key={type} className="text-center py-4 px-4">
                      {pkg && (
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.price}
                          onChange={(e) => {
                            updatePackageLocal(type, { price: parseFloat(e.target.value) || 0 });
                          }}
                          disabled={isSaving}
                          className="text-center font-bold text-lg"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Net Payout Row - CALCULATED DISPLAY */}
              <tr className="border-b border-border">
                <td className="font-medium text-foreground py-4 px-4">Net Payout (Flat 12% Platform Fee)</td>
                {PACKAGE_TYPES.map((type) => {
                  const pkg = getPackageByType(type);
                  if (!pkg) {
                    return <td key={type} className="text-center py-4 px-4 text-muted-foreground">—</td>;
                  }
                  const netPayout = pkg.price * (1 - PLATFORM_FEE_PERCENT);
                  const fee = pkg.price * PLATFORM_FEE_PERCENT;
                  return (
                    <td key={type} className="text-center py-4 px-4">
                      <div className="font-semibold text-[#10B981]">${netPayout.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Fee ${fee.toFixed(2)}</div>
                    </td>
                  );
                })}
              </tr>

              {/* Delivery Time Row - INLINE DROPDOWN */}
              <tr className="border-b border-border">
                <td className="font-medium text-foreground py-4 px-4">Delivery Time</td>
                {PACKAGE_TYPES.map((type) => {
                  const pkg = getPackageByType(type);
                  return (
                    <td key={type} className="text-center py-4 px-4">
                      {pkg ? (
                        <select
                          value={`${pkg.deliveryTimeValue}|${pkg.deliveryTimeUnit}`}
                          onChange={(e) => {
                            const [value, unit] = e.target.value.split('|');
                            updatePackageLocal(type, {
                              deliveryTimeValue: parseInt(value, 10),
                              deliveryTimeUnit: unit as any,
                            });
                          }}
                          disabled={isSaving}
                          className="border border-input rounded px-2 py-1 text-sm w-full"
                        >
                          {[1, 2, 3, 4, 5, 7, 10].map((d) => (
                            <option key={d} value={`${d}|Days`}>{d} Days</option>
                          ))}
                        </select>
                      ) : (
                        '—'
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Revisions Included Row - INLINE DROPDOWN */}
              <tr className="border-b border-border">
                <td className="font-medium text-foreground py-4 px-4">Revisions Included</td>
                {PACKAGE_TYPES.map((type) => {
                  const pkg = getPackageByType(type);
                  return (
                    <td key={type} className="text-center py-4 px-4">
                      {pkg ? (
                        <select
                          value={pkg.includedRevisionCount}
                          onChange={(e) => {
                            updatePackageLocal(type, {
                              includedRevisionCount: parseInt(e.target.value, 10),
                            });
                          }}
                          disabled={isSaving}
                          className="border border-input rounded px-2 py-1 text-sm w-full"
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3 Max</option>
                          <option value="5">5 Max</option>
                        </select>
                      ) : (
                        '—'
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Screens Included Row - INLINE INPUT */}
              <tr className="border-b border-border">
                <td className="font-medium text-foreground py-4 px-4">Screens Included</td>
                {PACKAGE_TYPES.map((type) => {
                  const pkg = getPackageByType(type);
                  return (
                    <td key={type} className="text-center py-4 px-4">
                      {pkg ? (
                        <Input
                          type="number"
                          min="0"
                          value={pkg.screensIncluded ?? ''}
                          onChange={(e) => {
                            updatePackageLocal(type, {
                              screensIncluded: e.target.value ? parseInt(e.target.value, 10) : null,
                            });
                          }}
                          disabled={isSaving}
                          placeholder="—"
                          className="text-center"
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Feature Rows - INLINE CHECKBOXES */}
              {allFeatures.map((feature) => (
                <tr key={feature} className="border-b border-border">
                  <td className="text-foreground py-4 px-4">{feature}</td>
                  {PACKAGE_TYPES.map((type) => {
                    const pkg = getPackageByType(type);
                    const included = pkg?.includedFeatures.includes(feature) ?? false;
                    return (
                      <td key={type} className="text-center py-4 px-4">
                        {pkg ? (
                          <input
                            type="checkbox"
                            checked={included}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...(pkg.includedFeatures || []), feature]
                                : (pkg.includedFeatures || []).filter((f) => f !== feature);
                              updatePackageLocal(type, { includedFeatures: updated });
                            }}
                            disabled={isSaving}
                            className="size-4 cursor-pointer"
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Add Custom Feature Row */}
              <tr className="border-b border-border">
                <td colSpan={4} className="py-4 px-4">
                  <div className="flex gap-2 items-center max-w-md">
                    <Input
                      type="text"
                      placeholder="Feature Title"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                          const newFeature = (e.target as HTMLInputElement).value.trim();
                          if (!customFeatures.includes(newFeature)) {
                            setCustomFeatures([...customFeatures, newFeature]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        if (input?.value.trim() && !customFeatures.includes(input.value.trim())) {
                          setCustomFeatures([...customFeatures, input.value.trim()]);
                          input.value = '';
                        }
                      }}
                      className="text-primary text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="size-4" />
                      Add Custom Feature Row
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Validation Warning */}
        {packages.some((p) => p.includedRevisionCount === 0) && (
          <div className="mt-4 rounded-lg border border-[#FBBF24] bg-[#FEF3C7] p-4">
            <div className="text-sm text-[#92400E]">
              ⚠️ <strong>Number of revisions included is strictly required for package publishing.</strong> Please ensure all tiers have a specified revision limit.
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">12% platform fee applies to every order, regardless of your tier.</p>
      </SpCard>

      {/* Additional Revision Section (Separate from Add-ons per Correction #5) */}
      <SpCard className="space-y-4">
        <h3 className="font-semibold text-foreground">Additional Revision</h3>
        <p className="text-sm text-muted-foreground">
          Set pricing for clients who request extra revisions beyond what's included.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {PACKAGE_TYPES.map((type) => {
            const pkg = getPackageByType(type);
            if (!pkg) return null;
            return (
              <div key={type}>
                <label className="block text-sm font-medium text-foreground mb-2">{type}</label>
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground">+</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pkg.additionalRevisionPrice}
                    onChange={(e) => {
                      updatePackageLocal(type, {
                        additionalRevisionPrice: parseFloat(e.target.value) || 0,
                      });
                    }}
                    disabled={isSaving}
                    placeholder="$0.00"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SpCard>

      {/* Service Add-ons Section (Separate from Additional Revision) */}
      <SpCard className="space-y-4">
        <h3 className="font-semibold text-foreground">Service Add-ons</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {PACKAGE_TYPES.map((type) => {
            const pkg = getPackageByType(type);
            if (!pkg) return null;
            return (
              <div key={type} className="border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-foreground text-sm">{type} Package</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updatePackageLocal(type, {
                        addOns: [...(pkg.addOns || []), {
                          name: 'New Add-on',
                          price: 0,
                          deliveryTimeAdjustmentDays: 0,
                          enabled: true,
                        }],
                      });
                    }}
                    disabled={isSaving}
                    className="p-0 h-6"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>

                {pkg.addOns && pkg.addOns.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {pkg.addOns.slice(0, 2).map((addon, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-foreground">{addon.name}</span>
                        <span className="text-primary font-medium">+${addon.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {pkg.addOns.length > 2 && (
                      <a href="#" className="text-primary font-medium text-xs mt-2 block">
                        Configure Pricing
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No add-ons configured.</p>
                )}
              </div>
            );
          })}
        </div>
      </SpCard>

      {/* Navigation */}
      <SpCard>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onBack} variant="outline" disabled={isSaving}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={isSaving || packages.length === 0}>
            {isSaving ? 'Saving…' : 'Next: Description & FAQ'}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </SpCard>
    </div>
  );
}
