"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/shared/ErrorState";
import { useOpportunity } from "@/hooks/queries/investor-opportunities";
import { useCreateInvestorOffer } from "@/hooks/queries/deals";
import BuilderStepper from "./_components/BuilderStepper";
import StepCoreEconomics from "./_components/StepCoreEconomics";
import StepRightsGovernance from "./_components/StepRightsGovernance";
import StepReviewSend from "./_components/StepReviewSend";
import LiveTermSheetPreview from "./_components/LiveTermSheetPreview";
import {
  draftFromOpportunity,
  draftToOfferTerms,
  coreEconomicsValid,
  type TermSheetDraft,
} from "./_components/builder-model";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

const TOTAL_STEPS = 3;

const STEP_META = [
  { title: "Core economics", subtitle: "Set the investment, valuation, and share class." },
  { title: "Rights & governance", subtitle: "Board, protective provisions, and closing terms." },
  { title: "Review & send", subtitle: "Confirm the term sheet and send your offer." },
];

function extractApiError(err: unknown): string {
  const e = err as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error ??
    e?.response?.data?.message ??
    e?.message ??
    "Could not send the offer. Please try again."
  );
}

export default function TermSheetBuilderPage({ params }: PageProps) {
  const { companyId } = use(params);
  const router = useRouter();

  const { data: detail, isLoading, isError, refetch } = useOpportunity(companyId);
  const create = useCreateInvestorOffer();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<TermSheetDraft | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const draftKey = `ts-builder:${companyId}`;

  // Seed once: resume a locally-saved draft for this company if present,
  // otherwise prefill from the founder's real published ask.
  useEffect(() => {
    if (!detail || draft !== null) return;
    let restored: TermSheetDraft | null = null;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) restored = JSON.parse(raw) as TermSheetDraft;
    } catch {
      restored = null;
    }
    setDraft(restored ?? draftFromOpportunity(detail));
  }, [detail, draft, draftKey]);

  // Auto-save the draft locally (debounced) so the form survives reloads.
  useEffect(() => {
    if (draft === null) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(draft));
        setSavedAt(Date.now());
      } catch {
        /* storage unavailable — non-fatal */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [draft, draftKey]);

  if (isLoading || draft === null) {
    return (
      <div className="mx-auto w-full max-w-[1100px] space-y-6 pb-8">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-[460px] rounded-2xl" />
          <Skeleton className="h-[360px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="mx-auto w-full max-w-[1100px] space-y-4 pb-8">
        <ErrorState
          title="Couldn't load this opportunity"
          message="Either it doesn't exist, you're not matched to it, or the API is unreachable."
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const patch = (p: Partial<TermSheetDraft>) =>
    setDraft((d) => ({ ...(d as TermSheetDraft), ...p }));

  const canProceed = step === 1 ? coreEconomicsValid(draft) : true;
  const meta = STEP_META[step - 1];

  const onSend = () => {
    setSubmitError(null);
    create.mutate(
      { companyId, terms: draftToOfferTerms(draft) },
      {
        onSuccess: (deal) => {
          try {
            window.localStorage.removeItem(draftKey);
          } catch {
            /* non-fatal */
          }
          router.push(`/dashboard/investor/deals?d=${deal.dealId}`);
        },
        onError: (err) => setSubmitError(extractApiError(err)),
      }
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 pb-8">
      <Link
        href={`/dashboard/investor/discovery/${companyId}/term-sheet`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to {detail.companyName} term sheet
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <BuilderStepper
          step={step}
          totalSteps={TOTAL_STEPS}
          title={meta.title}
          subtitle={meta.subtitle}
          savedAt={savedAt}
          canProceed={canProceed}
          isSending={create.isPending}
          isError={create.isError || !!submitError}
          errorMessage={submitError ?? create.error?.message}
          onBack={() => setStep((s) => Math.max(1, s - 1))}
          onNext={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
          onSubmit={onSend}
        >
          {step === 1 ? <StepCoreEconomics draft={draft} update={patch} /> : null}
          {step === 2 ? <StepRightsGovernance draft={draft} update={patch} /> : null}
          {step === 3 ? (
            <StepReviewSend detail={detail} draft={draft} update={patch} />
          ) : null}
        </BuilderStepper>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <LiveTermSheetPreview detail={detail} draft={draft} />
        </aside>
      </div>
    </div>
  );
}
