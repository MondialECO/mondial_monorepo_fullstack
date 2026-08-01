'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PackagePurchaseResponse } from '@/types/package-purchase';

interface Props {
  result: PackagePurchaseResponse;
  engagementsHref: string;
  isPolling: boolean;
  isTimedOut: boolean;
}

/** All three outcomes share one shell; only icon, copy and action differ. */
function ResultShell({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center md:p-8">
      <div className="mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

export function OrderResultPanel({ result, engagementsHref, isPolling, isTimedOut }: Props) {
  if (result.autoAccepted) {
    if (isTimedOut) {
      return (
        <ResultShell
          icon={<AlertCircle className="mx-auto size-12 text-warning" />}
          title="Your order is being set up"
          description="This is taking longer than usual. You can check progress in My Engagements."
        >
          <Link href={engagementsHref} className="mt-6 inline-block">
            <Button className="h-11">Go to My Engagements</Button>
          </Link>
        </ResultShell>
      );
    }

    return (
      <ResultShell
        icon={<CheckCircle2 className="mx-auto size-12 text-success-text" />}
        title="Order accepted"
        description="Your payment is authorised in escrow and the provider has been notified."
      >
        {isPolling && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Setting up your workroom...
          </p>
        )}
      </ResultShell>
    );
  }

  return (
    <ResultShell
      icon={<Clock className="mx-auto size-12 text-muted-foreground" />}
      title="Awaiting provider approval"
      description="Your order request was sent. The provider needs to review it before work starts."
    >
      {result.failedConditions.length > 0 && (
        <div className="mx-auto mt-6 max-w-md rounded-lg border border-border p-4 text-left">
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

      <Link href={engagementsHref} className="mt-6 inline-block">
        <Button variant="outline" className="h-11">
          View my orders
        </Button>
      </Link>
    </ResultShell>
  );
}
