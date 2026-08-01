'use client';

import { Check, Clock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/marketplace-format';
import type { MarketplacePackage } from '@/lib/api-marketplace';

interface Props {
  packages: MarketplacePackage[];
  selectedTier: string;
  selectedPackage?: MarketplacePackage;
  selectedAddOnNames: Set<string>;
  total: number;
  onTierChange: (tier: string) => void;
  onToggleAddOn: (name: string) => void;
  onOrder: () => void;
  onMessage: () => void;
}

export function PackageSelectorCard({
  packages,
  selectedTier,
  selectedPackage,
  selectedAddOnNames,
  total,
  onTierChange,
  onToggleAddOn,
  onOrder,
  onMessage,
}: Props) {
  if (!selectedPackage) return null;

  const pkg = selectedPackage;
  const currency = pkg.currency;

  const revisions = pkg.unlimitedRevisions
    ? 'Unlimited revisions'
    : `${pkg.includedRevisionCount} revision${pkg.includedRevisionCount === 1 ? '' : 's'}`;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <Tabs value={selectedTier} onValueChange={onTierChange} defaultValue={selectedTier}>
        <TabsList className="w-full">
          {packages.map((p) => (
            <TabsTrigger key={p.id} value={p.tier} className="flex-1">
              <span className="inline-flex items-center gap-1.5">
                {p.tier}
                {p.tier === 'Standard' && (
                  <Badge className="bg-primary px-1.5 text-[10px] uppercase tracking-wide text-primary-foreground">
                    Rec
                  </Badge>
                )}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-5 space-y-5">
        {/* Price + delivery, then the two secondary facts underneath. */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Starting from</p>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(pkg.price, currency)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 pt-4 text-sm text-muted-foreground">
              <Clock className="size-4" />
              {pkg.deliveryTimeValue} {pkg.deliveryTimeUnit}
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {revisions}
            {pkg.screensIncluded != null && ` · ${pkg.screensIncluded} screens`}
          </p>

          {pkg.title && <p className="mt-2 text-sm font-medium text-foreground">{pkg.title}</p>}
        </div>

        {(pkg.includedFeatures.length > 0 || pkg.excludedFeatures.length > 0) && (
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">What&apos;s included</p>
            <ul className="space-y-2">
              {pkg.includedFeatures.map((f, i) => (
                <li key={`in-${i}`} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
              {pkg.excludedFeatures.map((f, i) => (
                <li
                  key={`ex-${i}`}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <X className="mt-0.5 size-4 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pkg.addOns.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Add-ons</p>
            <div className="space-y-2">
              {pkg.addOns.map((addon) => (
                <label
                  key={addon.name}
                  className="flex cursor-pointer items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedAddOnNames.has(addon.name)}
                      onChange={() => onToggleAddOn(addon.name)}
                    />
                    <span className="text-foreground">{addon.name}</span>
                  </span>
                  <span className="shrink-0 font-medium text-foreground">
                    +{formatPrice(addon.price, currency)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium text-foreground">Total</span>
            <span className="text-xl font-bold text-foreground">
              {formatPrice(total, currency)}
            </span>
          </div>

          <div className="space-y-2">
            <Button onClick={onOrder} className="h-11 w-full rounded-lg">
              Continue ({formatPrice(total, currency)})
            </Button>
            <Button onClick={onMessage} variant="outline" className="h-11 w-full rounded-lg">
              Message provider
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
