"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/shared/ErrorState";
import {
  useDiligenceProgress,
  useInvestorSession,
  useOpportunity,
  useOpportunityDocuments,
} from "@/hooks/queries/investor-opportunities";
import DataRoomHeader from "./_components/DataRoomHeader";
import DocumentsSection from "./_components/DocumentsSection";
import SessionActivityCard from "./_components/SessionActivityCard";
import DiligenceProgressCard from "./_components/DiligenceProgressCard";
import NDALockedScreen from "./_components/NDALockedScreen";
import DataRoomSkeleton from "./_components/DataRoomSkeleton";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default function DataRoomPage({ params }: PageProps) {
  const { companyId } = use(params);

  // Opportunity drives the entire NDA-gate decision; everything else is
  // either rendered when NDA is signed or shown as a locked screen.
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useOpportunity(companyId);

  // These three queries fire in parallel only when NDA is accepted. Until
  // then the hooks are still invoked (avoids a hook-order trap on re-render)
  // but the `enabled` flag prevents the actual HTTP requests.
  const ndaOk = !!detail && (!detail.ndaRequired || detail.ndaAccepted);
  const enabledCompanyId = ndaOk ? companyId : null;

  const {
    data: docs,
    isLoading: docsLoading,
    isError: docsError,
  } = useOpportunityDocuments(enabledCompanyId);

  const {
    data: session,
    isLoading: sessionLoading,
    isError: sessionError,
  } = useInvestorSession(enabledCompanyId);

  const {
    data: diligence,
    isLoading: diligenceLoading,
    isError: diligenceError,
  } = useDiligenceProgress(enabledCompanyId);

  if (detailLoading) {
    return <DataRoomSkeleton />;
  }

  if (detailError || !detail) {
    return (
      <div className="w-full max-w-[1280px] mx-auto space-y-4 pb-8">
        <ErrorState
          title="Couldn't load the data room"
          message="Either the opportunity doesn't exist, you're not matched to it, or the API is unreachable."
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => refetchDetail()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (detail.ndaRequired && !detail.ndaAccepted) {
    return (
      <div className="w-full max-w-[1280px] mx-auto space-y-6 pb-8">
        <DataRoomHeader detail={detail} />
        <NDALockedScreen companyId={detail.companyId} companyName={detail.companyName} />
      </div>
    );
  }

  // NDA path: render the 2-column data room. Sub-section loading is
  // independent so the page can stream in piece-by-piece.
  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-6 pb-8">
      <DataRoomHeader detail={detail} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          {docsLoading ? (
            <DataRoomSkeleton />
          ) : docsError || !docs ? (
            <ErrorState
              title="Couldn't load documents"
              message="The document list didn't respond. Try refreshing the page."
            />
          ) : (
            <DocumentsSection companyId={detail.companyId} items={docs.items} />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {sessionLoading ? (
            <div className="h-48 rounded-2xl border border-border bg-muted/30" />
          ) : sessionError || !session ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
              Couldn&apos;t load session activity.
            </div>
          ) : (
            <SessionActivityCard session={session} />
          )}

          {diligenceLoading ? (
            <div className="h-44 rounded-2xl border border-border bg-muted/30" />
          ) : diligenceError || !diligence ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
              Couldn&apos;t load diligence progress.
            </div>
          ) : (
            <DiligenceProgressCard progress={diligence} />
          )}
        </aside>
      </div>
    </div>
  );
}
