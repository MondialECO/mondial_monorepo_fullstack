'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import AuthGuard from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketplaceListingDetail } from '@/hooks/queries/marketplace';
import {
  usePurchasePackage,
  useProposalConversionPoll,
} from '@/hooks/queries/package-purchase';
import { getEngagements } from '@/lib/api-workroom';
import { recordListingClick } from '@/lib/api-analytics';
import { useAuth } from '@/app/_providers/AuthProvider';
import { ROLE_DASHBOARD_ROUTES } from '@/lib/roles';
import type { PackagePurchaseResponse } from '@/types/package-purchase';
import { OrderSummaryWidget } from '@/components/marketplace/order/OrderSummaryWidget';
import { OrderStepSummary } from '@/components/marketplace/order/OrderStepSummary';
import { OrderStepRequirements } from '@/components/marketplace/order/OrderStepRequirements';
import { OrderStepConfirm } from '@/components/marketplace/order/OrderStepConfirm';
import { OrderResultPanel } from '@/components/marketplace/order/OrderResultPanel';

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

  // Answers are step-local: they exist only for the duration of the flow and are
  // submitted whole at step 3. Keyed by RequirementsField.fieldId.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const setAnswer = useCallback((fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const [confirmations, setConfirmations] = useState({
    reviewedSummary: false,
    explicitlyConfirmed: false,
    noComplianceHold: false,
  });
  const toggleConfirmation = useCallback((key: keyof typeof confirmations) => {
    setConfirmations((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const [result, setResult] = useState<PackagePurchaseResponse | null>(null);
  const purchase = usePurchasePackage();
  const { user } = useAuth();

  // Fire-and-forget: entering the order flow is a distinct funnel signal from the
  // 'order' click on the detail page.
  useEffect(() => {
    if (!listingId) return;
    recordListingClick(listingId, 'order-flow-start').catch(() => {});
  }, [listingId]);

  const engagementsHref = user
    ? `${ROLE_DASHBOARD_ROUTES[user.role]}/engagements`
    : '/marketplace/services';

  // Only the auto-accepted path converts to an engagement; the manual path waits
  // on provider approval, so there is nothing to poll for.
  const pollTarget = result?.autoAccepted ? result.proposal.id : null;
  const { converted, isTimedOut } = useProposalConversionPoll(pollTarget);

  useEffect(() => {
    if (!converted || !result || !user) return;
    let cancelled = false;
    const base = `${ROLE_DASHBOARD_ROUTES[user.role]}/engagements`;
    (async () => {
      try {
        const engagements = await getEngagements();
        const match = engagements.find((e) => e.proposalId === result.proposal.id);
        if (!cancelled) router.push(match ? `${base}/${match.id}` : base);
      } catch {
        // The engagement exists even if this lookup failed — send them to the list.
        if (!cancelled) router.push(base);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [converted, result, user, router]);

  const handleSubmit = useCallback(() => {
    if (!pkg) return;
    const requirements = (pkg.requirementsTemplate ?? [])
      .filter((f) => f.fieldType !== 'File')
      .map((f) => ({
        templateFieldId: f.fieldId,
        fieldType: f.fieldType,
        value: answers[f.fieldId] ?? '',
      }));

    purchase.mutate(
      {
        packageId: pkg.id,
        selectedAddOnNames,
        requirements,
        explicitlyConfirmed: true,
        paymentMethodVerified: true,
        escrowAuthorized: true,
        // Inverted: the UI asks "no compliance issues", the backend field means
        // "a hold exists" and treats true as a gate failure (LeadsService.cs).
        complianceHold: false,
        finalSummaryShown: true,
      },
      {
        onSuccess: (res) => {
          setResult(res);
          if (listingId) recordListingClick(listingId, 'order-placed').catch(() => {});
        },
      }
    );
  }, [pkg, answers, selectedAddOnNames, purchase, listingId]);

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

        {step === 2 && (
          <OrderStepRequirements
            pkg={pkg}
            answers={answers}
            onChange={setAnswer}
            onBack={() => goToStep(1)}
            onContinue={() => goToStep(3)}
          />
        )}

        {step === 3 && !result && (
          <OrderStepConfirm
            pkg={pkg}
            total={total}
            reviewedSummary={confirmations.reviewedSummary}
            explicitlyConfirmed={confirmations.explicitlyConfirmed}
            noComplianceHold={confirmations.noComplianceHold}
            onToggle={toggleConfirmation}
            onBack={() => goToStep(2)}
            onSubmit={handleSubmit}
            isSubmitting={purchase.isPending}
            errorMessage={
              purchase.isError ? 'We could not place your order. Please try again.' : null
            }
          />
        )}

        {result && (
          <OrderResultPanel
            result={result}
            engagementsHref={engagementsHref}
            isPolling={!converted}
            isTimedOut={isTimedOut}
          />
        )}
      </div>
    </div>
  );
}
