'use client';

import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace-format';
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Confirm and place order</h2>
        <p className="text-sm text-muted-foreground">
          These confirmations are required before the order can be placed.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={reviewedSummary}
            onChange={() => onToggle('reviewedSummary')}
            className="mt-0.5 rounded border border-input"
          />
          {/* finalSummaryShown */}
          <span className="text-foreground">I have reviewed the final summary</span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
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

        <label className="flex cursor-pointer items-start gap-3 text-sm">
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

        <div className="space-y-3 border-t border-border pt-3">
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

          <p className="flex items-start gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3 shrink-0" />
            Payment and escrow are simulated in development — no real payment gateway is
            connected yet (canon §10.8, Phase M8).
          </p>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
          Back
        </Button>
        <Button onClick={onSubmit} disabled={!ready || isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Placing order...
            </>
          ) : (
            `Place order · ${formatPrice(total, pkg.currency)}`
          )}
        </Button>
      </div>
    </div>
  );
}
