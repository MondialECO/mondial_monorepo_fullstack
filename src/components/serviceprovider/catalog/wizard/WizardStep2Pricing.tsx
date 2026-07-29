'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  SpCard,
  SpFormField,
  SpMutationFeedback,
} from '@/components/serviceprovider/ui';
import type { ServicePackage, PackageType } from '@/types/service-catalog';
import {
  useAddPackage,
  useUpdatePackage,
  useDeletePackage,
  useServiceListingDetail,
} from '@/hooks/queries/service-catalog';

const PACKAGE_TYPES: PackageType[] = ['Basic', 'Standard', 'Premium'];
const PRICING_MODELS = [
  { value: '', label: 'Not set' },
  { value: 'FixedPrice', label: 'Fixed Price' },
  { value: 'Hourly', label: 'Hourly Rate' },
  { value: 'MonthlyRetainer', label: 'Monthly Retainer' },
  { value: 'ProjectBased', label: 'Project Based' },
  { value: 'EquityCompensation', label: 'Equity Compensation' },
  { value: 'RevenueShare', label: 'Revenue Share' },
  { value: 'Other', label: 'Other' },
];

const DELIVERY_UNITS = [
  { value: 'Hours', label: 'Hours' },
  { value: 'Days', label: 'Days' },
  { value: 'Weeks', label: 'Weeks' },
];

export function WizardStep2Pricing({
  listingId,
  onNext,
  onBack,
}: {
  listingId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const listingDetail = useServiceListingDetail(listingId);
  const addPackage = useAddPackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing packages
  useEffect(() => {
    if (listingDetail.data?.packages) {
      setPackages(listingDetail.data.packages);
    }
  }, [listingDetail.data]);

  const getPackageByType = (type: PackageType) =>
    packages.find((p) => p.packageType === type);

  const handleSavePackage = async (type: PackageType, pkg: Partial<ServicePackage>) => {
    setIsSaving(true);
    setError(null);

    try {
      const existing = getPackageByType(type);
      const payload = {
        packageType: type,
        packageName: pkg.packageName || type,
        packageTitle: pkg.packageTitle || `${type} Package`,
        packageDescription: pkg.packageDescription || '',
        price: pkg.price ?? 0,
        currency: pkg.currency || 'USD',
        pricingModel: pkg.pricingModel ?? null,
        deliveryTimeValue: pkg.deliveryTimeValue ?? 5,
        deliveryTimeUnit: pkg.deliveryTimeUnit || 'Days',
        deliveryDayType: pkg.deliveryDayType || 'CalendarDays',
        deliveryStartRule: pkg.deliveryStartRule || 'AfterEscrowFunding',
        deliveryTimezone: pkg.deliveryTimezone || 'UTC',
        dailyCutoffTime: pkg.dailyCutoffTime || '17:00',
        includedRevisionCount: pkg.includedRevisionCount ?? 1,
        unlimitedRevisions: pkg.unlimitedRevisions ?? false,
        revisionRequestWindowDays: pkg.revisionRequestWindowDays ?? 3,
        additionalRevisionAvailable: pkg.additionalRevisionAvailable ?? false,
        additionalRevisionPrice: pkg.additionalRevisionPrice ?? 0,
        additionalRevisionDeliveryTime: pkg.additionalRevisionDeliveryTime ?? 1,
        revisionScopeDescription: pkg.revisionScopeDescription || '',
        deliverables: pkg.deliverables ?? [],
        includedFeatures: pkg.includedFeatures ?? [],
        excludedFeatures: pkg.excludedFeatures ?? [],
        addOns: pkg.addOns ?? [],
        requirementsTemplate: pkg.requirementsTemplate ?? [],
        cancellationPolicy: pkg.cancellationPolicy || 'FlexibleFullRefundBeforeStart',
        instantOrderEnabled: pkg.instantOrderEnabled ?? false,
        manualApprovalRequired: pkg.manualApprovalRequired ?? false,
        maximumActiveOrders: pkg.maximumActiveOrders ?? 10,
      };

      if (existing) {
        const updated = await updatePackage.mutateAsync([existing.id, payload]);
        setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await addPackage.mutateAsync([listingId, payload]);
        setPackages((prev) => [...prev, created]);
      }
    } catch {
      setError(`Could not save ${type} package. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePackage = async (type: PackageType) => {
    const pkg = getPackageByType(type);
    if (!pkg) return;

    setIsSaving(true);
    setError(null);

    try {
      await deletePackage.mutateAsync([pkg.id]);
      setPackages((prev) => prev.filter((p) => p.packageType !== type));
    } catch {
      setError(`Could not delete ${type} package. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    // Validate at least one package exists
    if (packages.length === 0) {
      setError('Please create at least one package before proceeding.');
      return;
    }

    setIsSaving(true);
    try {
      // All packages already saved individually, just proceed
      setError(null);
      onNext();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SpCard className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#171717]">Scope & Pricing</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Create pricing tiers for your service. Each tier includes delivery time, revisions, and
          features.
        </p>
      </div>

      {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}

      <div className="space-y-8">
        {PACKAGE_TYPES.map((type) => (
          <PackageTierEditor
            key={type}
            type={type}
            pkg={getPackageByType(type)}
            onSave={(updated) => handleSavePackage(type, updated)}
            onDelete={() => handleDeletePackage(type)}
            isSaving={isSaving}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-5">
        <Button onClick={onBack} variant="outline" disabled={isSaving}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={isSaving || packages.length === 0}>
          {isSaving ? 'Saving…' : 'Next: Description & FAQ'}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </SpCard>
  );
}

function PackageTierEditor({
  type,
  pkg,
  onSave,
  onDelete,
  isSaving,
}: {
  type: PackageType;
  pkg?: ServicePackage;
  onSave: (pkg: Partial<ServicePackage>) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(pkg?.packageTitle || `${type} Package`);
  const [description, setDescription] = useState(pkg?.packageDescription || '');
  const [price, setPrice] = useState(String(pkg?.price ?? 0));
  const [currency, setCurrency] = useState(pkg?.currency || 'USD');
  const [pricingModel, setPricingModel] = useState(pkg?.pricingModel || '');
  const [deliveryValue, setDeliveryValue] = useState(String(pkg?.deliveryTimeValue ?? 5));
  const [deliveryUnit, setDeliveryUnit] = useState(pkg?.deliveryTimeUnit || 'Days');
  const [revisions, setRevisions] = useState(String(pkg?.includedRevisionCount ?? 1));
  const [additionalRevisionPrice, setAdditionalRevisionPrice] = useState(
    String(pkg?.additionalRevisionPrice ?? 0)
  );
  const [additionalRevisionDelivery, setAdditionalRevisionDelivery] = useState(
    String(pkg?.additionalRevisionDeliveryTime ?? 1)
  );

  const handleSave = async () => {
    await onSave({
      packageTitle: title,
      packageDescription: description,
      price: parseFloat(price) || 0,
      currency,
      pricingModel: pricingModel || null,
      deliveryTimeValue: parseInt(deliveryValue, 10) || 1,
      deliveryTimeUnit,
      includedRevisionCount: parseInt(revisions, 10) || 0,
      additionalRevisionPrice: parseFloat(additionalRevisionPrice) || 0,
      additionalRevisionDeliveryTime: parseInt(additionalRevisionDelivery, 10) || 1,
    });
    setIsOpen(false);
  };

  const bgColor =
    type === 'Basic'
      ? 'bg-[#F9FAFB]'
      : type === 'Standard'
        ? 'bg-[#F3F4F6]'
        : 'bg-[#EEF2FF]';

  return (
    <div className={`rounded-lg border border-[#E5E7EB] p-5 ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[#171717]">{type} Package</h3>
          {pkg && (
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-[#171717]">
                <span className="font-medium">${pkg.price.toFixed(2)}</span> / {pkg.deliveryTimeValue}{' '}
                {pkg.deliveryTimeUnit.toLowerCase()}
              </p>
              <p className="text-[#6B7280]">{pkg.includedRevisionCount} revisions included</p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant={pkg ? 'outline' : 'default'}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {pkg ? 'Edit' : 'Create'}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-5 space-y-4 border-t border-[#E5E7EB] pt-5">
          <SpFormField id={`${type}-title`} label="Package title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </SpFormField>

          <SpFormField id={`${type}-description`} label="Package description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </SpFormField>

          <div className="grid gap-3 sm:grid-cols-3">
            <SpFormField id={`${type}-price`} label="Price" required>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </div>
            </SpFormField>

            <SpFormField id={`${type}-delivery`} label="Delivery time" required>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={deliveryValue}
                  onChange={(e) => setDeliveryValue(e.target.value)}
                />
                <select
                  value={deliveryUnit}
                  onChange={(e) => setDeliveryUnit(e.target.value)}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
                >
                  {DELIVERY_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </SpFormField>

            <SpFormField id={`${type}-model`} label="Pricing model">
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
              >
                {PRICING_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </SpFormField>
          </div>

          <div className="space-y-3 border-t border-[#E5E7EB] pt-3">
            <h4 className="text-sm font-medium text-[#171717]">Revisions</h4>
            <SpFormField id={`${type}-revisions`} label="Revisions included">
              <Input
                type="number"
                min="0"
                value={revisions}
                onChange={(e) => setRevisions(e.target.value)}
              />
            </SpFormField>

            <div className="rounded-lg bg-white p-3">
              <h5 className="mb-2 text-sm font-medium text-[#171717]">Additional Revision</h5>
              <div className="grid gap-3 sm:grid-cols-2">
                <SpFormField id={`${type}-add-revision-price`} label="Additional revision price">
                  <Input
                    type="number"
                    step="0.01"
                    value={additionalRevisionPrice}
                    onChange={(e) => setAdditionalRevisionPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </SpFormField>
                <SpFormField
                  id={`${type}-add-revision-delivery`}
                  label="Additional revision delivery time (days)"
                >
                  <Input
                    type="number"
                    min="1"
                    value={additionalRevisionDelivery}
                    onChange={(e) => setAdditionalRevisionDelivery(e.target.value)}
                  />
                </SpFormField>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !price}
            >
              Save package
            </Button>
            {pkg && (
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                disabled={isSaving}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
