'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace-format';
import { computeCommission, PLATFORM_COMMISSION_RATE } from '@/types/package-purchase';
import type { MarketplacePackage } from '@/lib/api-marketplace';

interface Props {
  pkg: MarketplacePackage;
  selectedAddOnNames: string[];
  total: number;
  onContinue: () => void;
}

export function OrderStepSummary({ pkg, selectedAddOnNames, total, onContinue }: Props) {
  const selectedAddOns = pkg.addOns.filter((a) => selectedAddOnNames.includes(a.name));
  const commission = computeCommission(total);
  const providerReceives = total - commission;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review your order</h2>
        <p className="text-sm text-muted-foreground">
          Confirm what you&apos;re buying before providing project details.
        </p>
      </div>

      <div className="rounded-lg border border-border divide-y divide-border">
        <div className="flex items-start justify-between p-4">
          <div>
            <p className="font-medium text-foreground">{pkg.title}</p>
            <p className="text-xs text-muted-foreground">{pkg.tier} package</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Delivery: {pkg.deliveryTimeValue} {pkg.deliveryTimeUnit} ·{' '}
              {pkg.unlimitedRevisions
                ? 'Unlimited revisions'
                : `${pkg.includedRevisionCount} revisions included`}
            </p>
          </div>
          <span className="font-medium text-foreground">{formatPrice(pkg.price, pkg.currency)}</span>
        </div>

        {selectedAddOns.map((addon) => (
          <div key={addon.name} className="flex items-center justify-between p-4">
            <span className="text-sm text-foreground">{addon.name}</span>
            <span className="text-sm font-medium text-foreground">
              +{formatPrice(addon.price, pkg.currency)}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between p-4">
          <span className="font-medium text-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">
            {formatPrice(total, pkg.currency)}
          </span>
        </div>
      </div>

      {pkg.includedFeatures.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">What&apos;s included</p>
          <ul className="space-y-1">
            {pkg.includedFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success-text" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
        You pay {formatPrice(total, pkg.currency)} — the provider receives{' '}
        {formatPrice(providerReceives, pkg.currency, 2)} after the{' '}
        {Math.round(PLATFORM_COMMISSION_RATE * 100)}% platform fee. Final amounts are
        calculated by the server when the order is placed.
      </p>

      <Button onClick={onContinue} className="w-full">
        Continue to Requirements
      </Button>
    </div>
  );
}
