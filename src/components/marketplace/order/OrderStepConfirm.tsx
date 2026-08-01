'use client';

import { Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace-format';
import { OrderStepCard } from './OrderStepCard';
import type { MarketplacePackage } from '@/lib/api-marketplace';

interface Props {
  pkg: MarketplacePackage;
  total: number;
  /** UI-level flags. `noComplianceHold` is inverted before it hits the wire. */
  reviewedSummary: boolean;
  explicitlyConfirmed: boolean;
  noComplianceHold: boolean;
  onToggle: (key: 'reviewedSummary' | 'explicitlyConfirmed' | 'noComplianceHold') => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export function OrderStepConfirm({
  pkg,
  total,
  reviewedSummary,
  explicitlyConfirmed,
  noComplianceHold,
  onToggle,
  onBack,
  onSubmit,
  isSubmitting,
  errorMessage,
}: Props) {
  const ready = reviewedSummary && explicitlyConfirmed && noComplianceHold;

  return (
    <OrderStepCard
      title="Place your order"
      subtitle="Review the final details and confirm."
      footer={
        <>
          <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="h-11">
            Back
          </Button>
          <Button onClick={onSubmit} disabled={!ready || isSubmitting} className="h-11">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Placing order...
              </>
            ) : (
              `Place order · ${formatPrice(total, pkg.currency)}`
            )}
          </Button>
        </>
      }
    >
      <div className="divide-y divide-border">
        <label className="flex cursor-pointer items-start gap-3 py-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={reviewedSummary}
            onChange={() => onToggle('reviewedSummary')}
            className="mt-0.5 rounded border border-input"
          />
          {/* finalSummaryShown */}
          <span className="text-foreground">I have reviewed the final summary</span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 py-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={explicitlyConfirmed}
            onChange={() => onToggle('explicitlyConfirmed')}
            className="mt-0.5 rounded border border-input"
          />
          {/* explicitlyConfirmed */}
          <span className="text-foreground">
            I have explicitly confirmed this order and accept the package terms
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 py-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={noComplianceHold}
            onChange={() => onToggle('noComplianceHold')}
            className="mt-0.5 rounded border border-input"
          />
          {/* Sent as complianceHold: false when checked — see page submit handler. */}
          <span className="text-foreground">
            I confirm there are no outstanding compliance issues with this order
          </span>
        </label>

        <div className="space-y-3 py-3">
          <label className="flex items-start gap-3 text-sm opacity-70">
            <input
              type="checkbox"
              checked
              disabled
              className="mt-0.5 rounded border border-input"
            />
            {/* paymentMethodVerified */}
            <span className="text-foreground">My payment method is verified</span>
          </label>

          <label className="flex items-start gap-3 text-sm opacity-70">
            <input
              type="checkbox"
              checked
              disabled
              className="mt-0.5 rounded border border-input"
            />
            {/* escrowAuthorized */}
            <span className="text-foreground">Escrow authorization approved</span>
          </label>

          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">Payment simulation.</span> This is
              a development environment. No real payment is processed; escrow authorisation
              is simulated (canon §10.8, Phase M8).
            </span>
          </p>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

    </OrderStepCard>
  );
}
