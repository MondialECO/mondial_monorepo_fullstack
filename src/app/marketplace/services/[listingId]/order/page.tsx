'use client';

import { useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketplaceListingDetail } from '@/hooks/queries/marketplace';
import { OrderSummaryWidget } from '@/components/marketplace/order/OrderSummaryWidget';
import { OrderStepSummary } from '@/components/marketplace/order/OrderStepSummary';

const STEP_LABELS = ['Review', 'Requirements', 'Confirm'];

export default function MarketplaceOrderPage() {
  return (
    <AuthGuard>
      <MarketplaceOrderContent />
    </AuthGuard>
  );
}

function MarketplaceOrderContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const listingId = Array.isArray(params.listingId)
    ? params.listingId[0]
    : params.listingId ?? null;

  const packageId = searchParams.get('packageId');
  const addonsParam = searchParams.get('addons');
  const step = Math.min(3, Math.max(1, parseInt(searchParams.get('step') ?? '1', 10) || 1));

  const selectedAddOnNames = useMemo(
    () => (addonsParam ? addonsParam.split(',').filter(Boolean) : []),
    [addonsParam]
  );

  const { data: listing, isLoading, isError } = useMarketplaceListingDetail(listingId);
  const pkg = listing?.packages.find((p) => p.id === packageId);

  const total = useMemo(() => {
    if (!pkg) return 0;
    const addOnTotal = pkg.addOns
      .filter((a) => selectedAddOnNames.includes(a.name))
      .reduce((sum, a) => sum + a.price, 0);
    return pkg.price + addOnTotal;
  }, [pkg, selectedAddOnNames]);

  // URL is the single source of truth for step position, so back/forward work.
  const goToStep = useCallback(
    (next: number) => {
      const qs = new URLSearchParams(searchParams.toString());
      qs.set('step', String(next));
      router.push(`/marketplace/services/${listingId}/order?${qs.toString()}`);
    },
    [router, searchParams, listingId]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !listing || !pkg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
          <h1 className="mb-2 text-xl font-semibold text-foreground">
            This package isn&apos;t available
          </h1>
          <p className="mb-6 text-muted-foreground">
            It may have been unpublished, or the link is incomplete.
          </p>
          <Link href={`/marketplace/services/${listingId ?? ''}`}>
            <Button variant="outline">Back to service</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={`/marketplace/services/${listingId}`}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to service
        </Link>

        <ol className="mb-6 flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    n <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {n}
                </span>
                <span
                  className={`text-xs font-medium ${
                    n === step ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mb-6">
          <OrderSummaryWidget
            listing={listing}
            pkg={pkg}
            selectedAddOnNames={selectedAddOnNames}
            total={total}
          />
        </div>

        {step === 1 && (
          <OrderStepSummary
            pkg={pkg}
            selectedAddOnNames={selectedAddOnNames}
            total={total}
            onContinue={() => goToStep(2)}
          />
        )}
      </div>
    </div>
  );
}
