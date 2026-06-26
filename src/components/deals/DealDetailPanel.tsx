"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from "@/components/ui/empty-state";
import DealCardBase from "@/components/investor/DealCardBase";
import OfferTermsCard from "./OfferTermsCard";
import OfferActionsRow from "./OfferActionsRow";
import OfferComposerDialog from "./OfferComposerDialog";
import RejectOfferDialog from "./RejectOfferDialog";
import SignaturePanel from "./SignaturePanel";
import DealCompletionPanel from "./DealCompletionPanel";
import RevisionTimeline from "./RevisionTimeline";
import DealActivityTimeline from "./DealActivityTimeline";
import { DealDetailSkeleton } from "./Skeletons";
import {
  useAcceptOffer,
  useCounterOffer,
  useDeal,
  useDealActivity,
  useMarkOfferViewed,
  useRejectOffer,
} from "@/hooks/queries/deals";
import {
  counterpartyLabel,
  isClosed,
  isMyTurn,
  isOfferOpen,
  isReadyForSignatures,
  latestRevision,
  shortId,
} from "@/lib/deal-utils";
import type { DealRole, OfferTermsInput } from "@/types/deals";

interface DealDetailPanelProps {
  dealId: string;
  myRole: DealRole | null;
  onBack: () => void;
}

export default function DealDetailPanel({ dealId, myRole, onBack }: DealDetailPanelProps) {
  const { data: deal, isLoading, isError } = useDeal(dealId);
  const { data: activity = [], isLoading: activityLoading } = useDealActivity(dealId);

  const counter = useCounterOffer(dealId);
  const accept = useAcceptOffer(dealId);
  const reject = useRejectOffer(dealId);
  const markViewed = useMarkOfferViewed(dealId);

  const [counterOpen, setCounterOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Auto-mark the open offer as viewed when the receiving party opens it
  // (the "View" action), once per revision.
  const viewedRef = useRef<string>("");
  useEffect(() => {
    if (!deal || !myRole) return;
    const latest = latestRevision(deal);
    if (!latest || latest.status !== "sent") return;
    if (deal.currentTurn !== myRole) return;
    const key = `${dealId}:${latest.revisionNumber}`;
    if (viewedRef.current === key) return;
    viewedRef.current = key;
    markViewed.mutate();
    // markViewed is stable; intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal, myRole, dealId]);

  if (isLoading) return <DealDetailSkeleton />;
  if (isError || !deal) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon={Handshake} title="Couldn't load this deal" description="Please try again in a moment." />
      </div>
    );
  }

  const latest = latestRevision(deal);
  const myTurn = isMyTurn(deal, myRole);
  const open = isOfferOpen(deal);
  const cpLabel = myRole ? counterpartyLabel(myRole) : "Counterparty";
  const pending = counter.isPending || accept.isPending || reject.isPending;

  const submitCounter = async (terms: OfferTermsInput) => {
    await counter.mutateAsync(terms).catch(() => {});
    setCounterOpen(false);
  };
  const submitReject = async (note: string) => {
    await reject.mutateAsync(note).catch(() => {});
    setRejectOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {cpLabel} · {shortId(deal.dealId)}
          </div>
          <div className="text-xs text-muted-foreground capitalize">Deal status: {deal.status.replace(/_/g, " ")}</div>
        </div>
        {isClosed(deal) ? (
          <Badge variant="success">Completed</Badge>
        ) : myTurn && open ? (
          <Badge variant="warning">Your move</Badge>
        ) : open ? (
          <Badge variant="secondary">Awaiting {cpLabel.toLowerCase()}</Badge>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-4 sm:p-6">
          <OfferTermsCard terms={deal.termSheet} />

          {/* Status / actions */}
          {isReadyForSignatures(deal) ? (
            <>
              <SignaturePanel deal={deal} activity={activity} myRole={myRole} dealId={dealId} />
              <DealCompletionPanel deal={deal} activity={activity} myRole={myRole} dealId={dealId} />
            </>
          ) : latest?.status === "rejected" ? (
            <DealCardBase>
              <p className="text-sm font-medium text-destructive">This offer was rejected.</p>
            </DealCardBase>
          ) : myTurn && open ? (
            <OfferActionsRow
              pending={pending}
              onAccept={() => accept.mutate()}
              onCounter={() => setCounterOpen(true)}
              onReject={() => setRejectOpen(true)}
            />
          ) : open ? (
            <p className="text-sm text-muted-foreground">
              Waiting for the {cpLabel.toLowerCase()} to respond to the latest offer.
            </p>
          ) : null}

          {/* Revision history */}
          <DealCardBase>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Revision history</h3>
            <RevisionTimeline revisions={deal.revisions} />
          </DealCardBase>

          {/* Activity timeline */}
          <DealCardBase>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Activity</h3>
            <DealActivityTimeline entries={activity} isLoading={activityLoading} />
          </DealCardBase>
        </div>
      </ScrollArea>

      <OfferComposerDialog
        open={counterOpen}
        onOpenChange={setCounterOpen}
        title="Counter-offer"
        description="Propose revised terms. This sends a new revision and passes the turn back."
        submitLabel="Send counter-offer"
        pending={counter.isPending}
        initial={deal.termSheet}
        onSubmit={submitCounter}
      />
      <RejectOfferDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        pending={reject.isPending}
        onConfirm={submitReject}
      />
    </div>
  );
}
