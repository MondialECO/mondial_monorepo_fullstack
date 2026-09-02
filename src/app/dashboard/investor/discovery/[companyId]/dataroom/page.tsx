"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ErrorState from "@/components/shared/ErrorState";
import {
  useInvestorSession,
  useOpportunity,
  useOpportunityDocuments,
} from "@/hooks/queries/investor-opportunities";
import { useDiligenceSummary } from "@/hooks/queries/investor-diligence";
import entrepreneurApi, { DataRoomAccessStatusResponse } from "@/lib/api-entrepreneur";
import DataRoomHeader from "./_components/DataRoomHeader";
import DocumentsSection from "./_components/DocumentsSection";
import SessionActivityCard from "./_components/SessionActivityCard";
import DiligenceChecklistCard from "./_components/DiligenceChecklistCard";
import PrivateNoteModal from "./_components/PrivateNoteModal";
import AskFounderModal from "./_components/AskFounderModal";
import DiligenceQuestionsDrawer from "./_components/DiligenceQuestionsDrawer";
import IncompleteDiligenceWarningModal from "./_components/IncompleteDiligenceWarningModal";
import NDALockedScreen from "./_components/NDALockedScreen";
import DataRoomSkeleton from "./_components/DataRoomSkeleton";

interface PageProps {
  params: Promise<{ companyId: string }> | { companyId: string };
}

export default function DataRoomPage({ params }: PageProps) {
  const resolvedParams =
    typeof (params as any)?.then === "function"
      ? use(params as Promise<{ companyId: string }>)
      : (params as { companyId: string });
  const companyId = resolvedParams.companyId;
  const router = useRouter();

  // Modal / Drawer state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [questionsDrawerOpen, setQuestionsDrawerOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState<string | null>(null);

  // Opportunity drives high-level metadata
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useOpportunity(companyId);

  // Fetch verified canonical Data Room Access Status
  const [accessStatus, setAccessStatus] = useState<DataRoomAccessStatusResponse | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);

  const fetchAccessStatus = async () => {
    try {
      const res = await entrepreneurApi.getDataRoomAccessStatus(companyId);
      if (res) {
        setAccessStatus(res);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    if (companyId) {
      void fetchAccessStatus();
    }
  }, [companyId]);

  const accessOk = accessStatus ? accessStatus.accessGranted : (detail ? (!detail.ndaRequired || detail.ndaAccepted) : false);

  const enabledCompanyId = accessOk ? companyId : null;

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
    data: diligenceSummary,
    isLoading: diligenceLoading,
    isError: diligenceError,
  } = useDiligenceSummary(enabledCompanyId);

  function handleOpenNote(docId: string, title: string) {
    setActiveDocId(docId);
    setActiveDocTitle(title);
    setNoteModalOpen(true);
  }

  function handleOpenAskFounder(docId?: string, title?: string) {
    setActiveDocId(docId || null);
    setActiveDocTitle(title || null);
    setAskModalOpen(true);
  }

  function handleMakeOfferClick() {
    if (diligenceSummary && diligenceSummary.status !== "completed") {
      setWarningModalOpen(true);
    } else {
      router.push(`/dashboard/investor/pipeline`);
    }
  }

  function handleProceedToOffer() {
    router.push(`/dashboard/investor/pipeline`);
  }

  if (detailLoading || accessLoading) {
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
          <Button variant="outline" onClick={() => { refetchDetail(); fetchAccessStatus(); }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!accessOk) {
    return (
      <div className="w-full max-w-[1280px] mx-auto space-y-6 pb-8">
        <DataRoomHeader detail={detail} />
        <NDALockedScreen
          companyId={detail.companyId}
          companyName={detail.companyName}
          accessStatus={accessStatus}
          onRefresh={() => {
            refetchDetail();
            fetchAccessStatus();
          }}
        />
      </div>
    );
  }


  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-6 pb-8">
      <DataRoomHeader
        detail={detail}
        diligenceSummary={diligenceSummary}
        onOpenQuestions={() => setQuestionsDrawerOpen(true)}
        onMakeOfferClick={handleMakeOfferClick}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          {docsLoading ? (
            <DataRoomSkeleton />
          ) : docsError || !docs ? (
            <ErrorState
              title="Couldn't load documents"
              message="The document list didn't respond. Try refreshing the page."
            />
          ) : (
            <DocumentsSection
              companyId={detail.companyId}
              items={docs.items}
              reviews={diligenceSummary?.reviews}
              canDownload={accessStatus ? accessStatus.accessLevel !== "view_only" : true}
              onAddNote={handleOpenNote}
              onAskFounder={(docId, title) => handleOpenAskFounder(docId, title)}
            />

          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {diligenceLoading ? (
            <div className="h-64 rounded-2xl border border-border bg-muted/30 animate-pulse" />
          ) : diligenceError || !diligenceSummary ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
              Couldn&apos;t load due diligence checklist.
            </div>
          ) : (
            <DiligenceChecklistCard
              summary={diligenceSummary}
              companyId={detail.companyId}
              onOpenQuestions={() => setQuestionsDrawerOpen(true)}
            />
          )}

          {sessionLoading ? (
            <div className="h-48 rounded-2xl border border-border bg-muted/30" />
          ) : sessionError || !session ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
              Couldn&apos;t load session activity.
            </div>
          ) : (
            <SessionActivityCard session={session} />
          )}
        </aside>
      </div>

      {/* Modals and Drawers */}
      <PrivateNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        companyId={detail.companyId}
        documentId={activeDocId}
        documentTitle={activeDocTitle}
      />

      <AskFounderModal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        companyId={detail.companyId}
        documentId={activeDocId}
        documentTitle={activeDocTitle}
      />

      {diligenceSummary && (
        <DiligenceQuestionsDrawer
          isOpen={questionsDrawerOpen}
          onClose={() => setQuestionsDrawerOpen(false)}
          questions={diligenceSummary.questions}
          onOpenAskModal={() => handleOpenAskFounder()}
        />
      )}

      <IncompleteDiligenceWarningModal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        onProceed={handleProceedToOffer}
        blockedReason={diligenceSummary?.blockedReason}
      />
    </div>
  );
}
