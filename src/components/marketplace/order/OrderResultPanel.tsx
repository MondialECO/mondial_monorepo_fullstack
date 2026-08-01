'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PackagePurchaseResponse } from '@/types/package-purchase';

interface Props {
  result: PackagePurchaseResponse;
  engagementsHref: string;
  isPolling: boolean;
  isTimedOut: boolean;
}

export function OrderResultPanel({ result, engagementsHref, isPolling, isTimedOut }: Props) {
  if (result.autoAccepted) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success-text" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Order accepted</h2>
          <p className="text-sm text-muted-foreground">
            Your payment is authorised in escrow and the provider has been notified.
          </p>
        </div>

        {isPolling && !isTimedOut && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Setting up your workroom...
          </p>
        )}

        {isTimedOut && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your order is being set up — check your engagements shortly.
            </p>
            <Link href={engagementsHref}>
              <Button variant="outline">Go to my engagements</Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="mx-auto mb-3 size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Awaiting provider approval</h2>
        <p className="text-sm text-muted-foreground">
          Your order request was sent. The provider needs to review it before it starts.
        </p>
      </div>

      {result.failedConditions.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-sm font-medium text-foreground">
            Your order needs provider review because:
          </p>
          <ul className="list-inside list-disc space-y-1">
            {result.failedConditions.map((condition, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {condition}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center">
        <Link href={engagementsHref}>
          <Button variant="outline">Go to my engagements</Button>
        </Link>
      </div>
    </div>
  );
}
