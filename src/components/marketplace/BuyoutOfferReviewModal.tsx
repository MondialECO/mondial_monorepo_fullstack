"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  Clock,
  History,
  Check,
  Building,
  User,
  ShieldCheck,
  Hourglass,
  Loader2,
  X,
  AlertTriangle,
  FolderArchive,
  ArrowRight,
} from "lucide-react";
import { EquityDeal, EquityOfferRevision, CounterBuyoutOfferRequest } from "@/lib/api-marketplace-projects";
import { BuyoutOfferForm } from "@/components/marketplace/BuyoutOfferForm";

interface BuyoutOfferReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: EquityDeal;
  currentUserId?: string;
  isCreator: boolean;
  askingPrice?: number;
  onAccept: () => Promise<void>;
  onCounter: (request: CounterBuyoutOfferRequest) => Promise<void>;
  onReject: () => Promise<void>;
}

export function BuyoutOfferReviewModal({
  isOpen,
  onClose,
  deal,
  currentUserId,
  isCreator,
  askingPrice,
  onAccept,
  onCounter,
  onReject,
}: BuyoutOfferReviewModalProps) {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [isCountering, setIsCountering] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !deal) return null;

  const isMyTurn =
    deal.dealStage === "OFFER_NEGOTIATION" &&
    ((isCreator && deal.currentTurn?.toLowerCase() === "creator") ||
      (!isCreator && deal.currentTurn?.toLowerCase() === "entrepreneur"));

  const isAccepted = deal.dealStage === "BUYOUT_TERMS_ACCEPTED" || deal.status === "completed";
  const isRejected = deal.dealStage === "REJECTED" || deal.status === "rejected";

  const latestRevision = deal.revisions?.length ? deal.revisions[deal.revisions.length - 1] : null;
  const buyoutTerms = deal.buyoutTerms || latestRevision?.buyoutTerms;

  const isExpired =
    buyoutTerms?.expiresAt && new Date(buyoutTerms.expiresAt).getTime() < Date.now() && !isAccepted;

  const fmt = (val?: number) => (val !== undefined ? `€${val.toLocaleString()}` : "—");

  const handleAccept = async () => {
    setActionError(null);
    setLoadingAction("accept");
    try {
      await onAccept();
      onClose();
    } catch (err: unknown) {
      setActionError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          "Failed to accept buyout offer."
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setActionError(null);
    setLoadingAction("reject");
    try {
      await onReject();
      setConfirmReject(false);
      onClose();
    } catch (err: unknown) {
      setActionError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          "Failed to reject buyout offer."
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCounterSubmit = async (req: CounterBuyoutOfferRequest) => {
    setActionError(null);
    setLoadingAction("counter");
    try {
      await onCounter(req);
      setIsCountering(false);
      onClose();
    } catch (err: unknown) {
      setActionError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          "Failed to submit counter-offer."
      );
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border bg-muted/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs font-semibold">
                    Full Buyout Acquisition
                  </Badge>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Revision V{latestRevision?.revisionNumber ?? deal.currentRevisionNumber}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {deal.projectName || "Project Buyout Offer"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Counterparty:{" "}
                  <strong className="text-foreground">
                    {isCreator ? deal.entrepreneurName || "Entrepreneur" : deal.creatorName || "Creator"}
                  </strong>
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conceptual Full Buyout Stage Visualizer */}
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="flex h-5 w-5 rounded-full bg-emerald-600 text-white items-center justify-center text-[10px]">
                  {isAccepted ? "✓" : "1"}
                </span>
                Commercial Offer
              </div>
              <div className="h-0.5 w-6 bg-border" />
              <div className={`flex items-center gap-1.5 ${isAccepted ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                <span className={`flex h-5 w-5 rounded-full ${isAccepted ? "bg-primary text-white" : "bg-muted text-muted-foreground"} items-center justify-center text-[10px]`}>
                  2
                </span>
                Legal & Transfer
              </div>
              <div className="h-0.5 w-6 bg-border" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="flex h-5 w-5 rounded-full bg-muted text-muted-foreground items-center justify-center text-[10px]">
                  3
                </span>
                Closing
              </div>
              <div className="h-0.5 w-6 bg-border" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="flex h-5 w-5 rounded-full bg-muted text-muted-foreground items-center justify-center text-[10px]">
                  4
                </span>
                Sold
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setActiveTab("current")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "current"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Current Terms
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === "history"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <History className="h-3.5 w-3.5" /> Revision History ({deal.revisions?.length ?? 1})
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {actionError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {activeTab === "current" ? (
              <>
                {/* Status Notice */}
                {isAccepted ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Buyout Commercial Terms Agreed</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Both parties agreed to Revision V{latestRevision?.revisionNumber ?? deal.acceptedRevisionNumber ?? 1}. The next phase prepares the Asset Purchase Agreement and IP Assignment.
                      </p>
                    </div>
                  </div>
                ) : isRejected ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive flex items-center gap-3">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Offer Declined</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        This buyout negotiation was closed. The marketplace listing remains active for other buyers.
                      </p>
                    </div>
                  </div>
                ) : isExpired ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive flex items-center gap-3">
                    <Clock className="h-5 w-5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Offer Expired</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        This buyout revision has expired. Please submit a new counter-offer to reopen terms.
                      </p>
                    </div>
                  </div>
                ) : !isMyTurn ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 flex items-center gap-3">
                    <Hourglass className="h-5 w-5 shrink-0 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold">
                        Waiting for {isCreator ? deal.entrepreneurName || "Buyer" : deal.creatorName || "Creator"} Response
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        You will receive an update as soon as the other party responds or counters.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Economic Terms Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 rounded-xl border-border bg-card/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Purchase Price
                      </span>
                      {askingPrice && (
                        <span className="text-[10px] text-muted-foreground">
                          Asking: {fmt(askingPrice)}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      {fmt(buyoutTerms?.purchasePrice)}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      100% full acquisition & IP ownership
                    </p>
                  </Card>

                  <Card className="p-4 rounded-xl border-border bg-card/50">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium mb-1">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Handover & Support
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {buyoutTerms?.handoverPeriodWeeks ?? 2} weeks handover
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      + {buyoutTerms?.transitionSupportWeeks ?? 4} weeks transition support
                    </p>
                  </Card>
                </div>

                {/* Included Assets Checklist */}
                <Card className="p-4 rounded-xl border-border bg-card/50 space-y-2.5">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FolderArchive className="h-4 w-4 text-primary" />
                    Included Project Assets in Bundle
                  </div>
                  {buyoutTerms?.includedAssets && buyoutTerms.includedAssets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {buyoutTerms.includedAssets.map((asset, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{asset}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Standard project IP bundle (Full Intellectual Property & Concept Ownership)
                    </p>
                  )}
                </Card>

                {/* Expiry and Notes */}
                <div className="space-y-3 text-xs">
                  {buyoutTerms?.expiresAt && (
                    <div className="flex items-center justify-between text-muted-foreground border-b border-border/50 pb-2">
                      <span>Offer Expiration:</span>
                      <span className="font-semibold text-foreground">
                        {new Date(buyoutTerms.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {latestRevision?.note && (
                    <div className="space-y-1">
                      <span className="font-semibold text-foreground">Notes / Message:</span>
                      <p className="text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/40 italic">
                        &quot;{latestRevision.note}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Revision History */
              <div className="space-y-3">
                {deal.revisions?.map((rev: EquityOfferRevision) => (
                  <div
                    key={rev.revisionNumber}
                    className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          Revision V{rev.revisionNumber}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          Offered by {rev.offeredByRole}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold ${
                          rev.status === "accepted"
                            ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                            : rev.status === "rejected"
                            ? "text-destructive border-destructive/30"
                            : rev.status === "countered"
                            ? "text-amber-500 border-amber-500/30"
                            : "text-primary border-primary/30"
                        }`}
                      >
                        {rev.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-foreground font-semibold flex items-center justify-between pt-1">
                      <span>Purchase Price: {fmt(rev.buyoutTerms?.purchasePrice ?? (rev.terms as unknown as { purchasePrice?: number })?.purchasePrice)}</span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Handover: {rev.buyoutTerms?.handoverPeriodWeeks ?? 2} wks
                      </span>
                    </div>

                    {rev.note && (
                      <p className="text-[11px] text-muted-foreground italic">&quot;{rev.note}&quot;</p>
                    )}

                    <div className="text-[10px] text-muted-foreground">
                      Submitted: {new Date(rev.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border bg-muted/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground">
                <Link href={isCreator ? "/dashboard/creator/messages" : "/dashboard/entrepreneur/messages"}>
                  <MessageSquare className="h-3.5 w-3.5" /> Ask Question
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {isMyTurn && !isAccepted && !isRejected && !isExpired && (
                <>
                  {confirmReject ? (
                    <div className="flex items-center gap-2 animate-in fade-in duration-150">
                      <span className="text-xs text-destructive font-medium">Decline offer?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleReject}
                        disabled={loadingAction !== null}
                        className="text-xs font-semibold"
                      >
                        {loadingAction === "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm Decline"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmReject(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmReject(true)}
                      className="text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCountering(true)}
                    className="text-xs font-semibold border-border hover:bg-muted"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Counter Offer
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleAccept}
                    disabled={loadingAction !== null}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm gap-1.5"
                  >
                    {loadingAction === "accept" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Accept Buyout Terms
                  </Button>
                </>
              )}

              {(!isMyTurn || isAccepted || isRejected || isExpired) && (
                <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Counter Modal Form */}
      {isCountering && (
        <BuyoutOfferForm
          isOpen={isCountering}
          onClose={() => setIsCountering(false)}
          onSubmit={handleCounterSubmit}
          projectName={deal.projectName}
          askingPrice={askingPrice}
          initialTerms={{
            purchasePrice: buyoutTerms?.purchasePrice ?? askingPrice ?? 25000,
            handoverPeriodWeeks: buyoutTerms?.handoverPeriodWeeks ?? 2,
            transitionSupportWeeks: buyoutTerms?.transitionSupportWeeks ?? 4,
            includedAssets: buyoutTerms?.includedAssets,
            notes: "",
          }}
          isCounter={true}
        />
      )}
    </>
  );
}
