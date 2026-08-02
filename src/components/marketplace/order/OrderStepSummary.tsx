'use client';

import { Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace-format';
import { OrderStepCard, SectionLabel } from './OrderStepCard';
import type { MarketplacePackage } from '@/lib/api-marketplace';

interface Props {
  pkg: MarketplacePackage;
  selectedAddOnNames: string[];
  total: number;
  onContinue: () => void;
}

export function OrderStepSummary({ pkg, selectedAddOnNames, total, onContinue }: Props) {
  const selectedAddOns = pkg.addOns.filter((a) => selectedAddOnNames.includes(a.name));

  return (
    <OrderStepCard
      title="Review your order"
      subtitle="Confirm the package and add-ons before continuing."
      footer={
        <>
          <span />
          <Button onClick={onContinue} className="h-11">
            Continue to requirements
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <p className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-foreground">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          Estimated delivery: {pkg.deliveryTimeValue} {pkg.deliveryTimeUnit}
        </p>

        <div>
          <SectionLabel>Package</SectionLabel>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{pkg.title || pkg.tier}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pkg.tier} ·{' '}
                {pkg.unlimitedRevisions
                  ? 'Unlimited revisions'
                  : `${pkg.includedRevisionCount} revision${pkg.includedRevisionCount === 1 ? '' : 's'}`}
                {pkg.screensIncluded != null && ` · ${pkg.screensIncluded} screens`}
              </p>
            </div>
            <span className="shrink-0 font-medium text-foreground">
              {formatPrice(pkg.price, pkg.currency)}
            </span>
          </div>
        </div>

        {selectedAddOns.length > 0 && (
          <div>
            <SectionLabel>Add-ons</SectionLabel>
            <ul className="space-y-2">
              {selectedAddOns.map((addon) => (
                <li
                  key={addon.name}
                  className="flex items-center justify-between gap-3 text-sm text-foreground"
                >
                  {addon.name}
                  <span className="shrink-0 font-medium">
                    + {formatPrice(addon.price, pkg.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pkg.includedFeatures.length > 0 && (
          <div>
            <SectionLabel>What&apos;s included</SectionLabel>
            <ul className="space-y-1.5">
              {pkg.includedFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success-text" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-medium text-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">
            {formatPrice(total, pkg.currency)}
          </span>
        </div>
      </div>
    </OrderStepCard>
  );
}
