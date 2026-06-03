"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/shared/ErrorState";
import {
  useDiligenceProgress,
  useInvestorSession,
  useOpportunity,
} from "@/hooks/queries/investor-opportunities";
import {
  buildActivityFeed,
  deriveDealStage,
} from "@/lib/term-sheet-derivation";
import TermSheetHeader from "./_components/TermSheetHeader";
import InvestmentSummaryGrid from "./_components/InvestmentSummaryGrid";
import DealTermsSection from "./_components/DealTermsSection";
import DealTimeline from "./_components/DealTimeline";
import ActivityFeed from "./_components/ActivityFeed";
import ReadOnlyActionsRow from "./_components/ReadOnlyActionsRow";
import TermSheetSkeleton from "./_components/TermSheetSkeleton";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default function TermSheetPage({ params }: PageProps) {
  const { companyId } = use(params);

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    refetch,
  } = useOpportunity(companyId);

  // These are independently enabled — the page tolerates each missing
  // without breaking. NDA-gated reads simply return empty payloads when
  // the investor hasn't signed yet; the derivation collapses to the
  // earliest stage in that case.
  const { data: session } = useInvestorSession(detail ? companyId : null);
  const { data: diligence } = useDiligenceProgress(detail ? companyId : null);

  if (detailLoading) {
    return <TermSheetSkeleton />;
  }

  if (detailError || !detail) {
    return (
      <div className="w-full max-w-[1280px] mx-auto space-y-4 pb-8">
        <ErrorState
          title="Couldn't load the term sheet"
          message="Either the opportunity doesn't exist, you're not matched to it, or the API is unreachable."
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const stage = deriveDealStage(detail, session, diligence);
  const activity = buildActivityFeed(detail, session, diligence);

  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-6 pb-8">
      <TermSheetHeader detail={detail} stage={stage} />

      <InvestmentSummaryGrid detail={detail} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <DealTermsSection detail={detail} />
          <ActivityFeed entries={activity} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <DealTimeline currentStage={stage} />
          <ReadOnlyActionsRow />
        </aside>
      </div>
    </div>
  );
}
