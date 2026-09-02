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
import OfferDiffCard from "./OfferDiffCard";
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
  // Prefer the real counterparty name; fall back to the role + short id only
  // when the snapshot is absent (legacy deals).
  const cpName =
    (myRole === "investor"
      ? deal.companyName?.trim()
      : deal.investors[0]?.investorName?.trim()) ||
    `${cpLabel} · ${shortId(deal.dealId)}`;
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
      {/* Header — pinned at top, never compressed */}
      <div className="shrink-0 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {cpName}
          </div>
          <div className="text-xs text-muted-foreground">
            {latest ? `Offer ${latest.revisionNumber} • ` : ""}
            <span className="capitalize">{deal.status.replace(/_/g, " ")}</span>
            {myTurn && open ? " • Your move" : ""}
          </div>
        </div>
        {isClosed(deal) ? (
          <Badge variant="success">Completed</Badge>
        ) : myTurn && open ? (
          <Badge variant="warning">Your move</Badge>
        ) : open ? (
          <Badge variant="secondary">Awaiting {cpLabel.toLowerCase()}</Badge>
        ) : null}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-5 p-4 sm:p-6 pb-10">
          {myTurn && open ? (
            <DealCardBase className="border-l-4 border-l-primary bg-primary/5">
              <p className="text-sm font-medium text-primary">Next action: Your move</p>
              <p className="text-xs text-muted-foreground mt-1">Review the offer and choose to accept, counter, or reject.</p>
            </DealCardBase>
          ) : open && !isClosed(deal) ? (
            <DealCardBase className="border-l-4 border-l-muted bg-muted/5">
              <p className="text-sm font-medium text-foreground">Waiting for {cpLabel.toLowerCase()}</p>
              <p className="text-xs text-muted-foreground mt-1">They will respond to your offer.</p>
            </DealCardBase>
          ) : null}

          {/* Activity timeline — visible early for deal momentum */}
          <DealCardBase>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Timeline</h3>
            <DealActivityTimeline entries={activity} isLoading={activityLoading} />
          </DealCardBase>

          {/* Offer diff — show what changed from previous revision */}
          {latest && latest.revisionNumber > 1 && deal.revisions.length >= 2 ? (
            <OfferDiffCard
              current={latest}
              previous={deal.revisions[deal.revisions.length - 2]}
            />
          ) : null}

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
