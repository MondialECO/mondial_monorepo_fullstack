"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Handshake,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  Clock,
  History,
  Check,
  Building,
  User,
  Percent,
  Coins,
  ShieldCheck,
  Hourglass,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { EquityDeal, EquityOfferRevision, CounterEquityOfferRequest } from "@/lib/api-marketplace-projects";
import { EquityOfferForm } from "@/components/marketplace/EquityOfferForm";

interface EquityOfferReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: EquityDeal;
  currentUserId?: string;
  isCreator: boolean;
  onAccept: () => Promise<void>;
  onCounter: (request: CounterEquityOfferRequest) => Promise<void>;
  onReject: () => Promise<void>;
}

export function EquityOfferReviewModal({
  isOpen,
  onClose,
  deal,
  currentUserId,
  isCreator,
  onAccept,
  onCounter,
  onReject,
}: EquityOfferReviewModalProps) {
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

  const isAccepted = deal.dealStage === "ROLES_PENDING" || deal.status === "accepted";
  const isRejected = deal.dealStage === "REJECTED" || deal.status === "rejected";

  const latestRevision = deal.revisions?.length ? deal.revisions[deal.revisions.length - 1] : null;
  const terms = deal.activeTerms || latestRevision?.terms;

  const isExpired =
    terms?.expiresAt && new Date(terms.expiresAt).getTime() < Date.now() && !isAccepted;

  const handleAccept = async () => {
    setActionError(null);
    setLoadingAction("accept");
    try {
      await onAccept();
      onClose();
    } catch (err: unknown) {
      setActionError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Failed to accept offer.");
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
      setActionError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Failed to reject offer.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCounterSubmit = async (req: CounterEquityOfferRequest) => {
    setActionError(null);
    await onCounter(req);
    setIsCountering(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Handshake className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                  {deal.projectName}
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                    Co-founder / Equity Deal
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Bilateral term negotiation between Creator and Entrepreneur.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAccepted ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Accepted (Roles Pending)
                </Badge>
              ) : isRejected ? (
                <Badge variant="destructive" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" /> Rejected
                </Badge>
              ) : isExpired ? (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
                  <Clock className="h-3 w-3 mr-1" /> Expired
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isMyTurn
                      ? "text-primary border-primary/40 bg-primary/10 font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {isMyTurn ? "Your Turn to Respond" : `Waiting for ${deal.currentTurn}`}
                </Badge>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {actionError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Parties & Stage Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-muted/40 p-3 rounded-xl border border-border">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Entrepreneur</span>
                <div className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 text-primary" /> {deal.entrepreneurName}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Creator</span>
                <div className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 text-primary" /> {deal.creatorName}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Company Status</span>
                <div className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Building className="h-3 w-3 text-muted-foreground" /> Not yet incorporated
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-border gap-2">
              <button
                onClick={() => setActiveTab("current")}
                className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "current"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Current Terms (V{deal.currentRevisionNumber})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === "history"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <History className="h-3 w-3" /> Revision History ({deal.revisions?.length || 1})
              </button>
            </div>

            {/* TAB: Current Terms */}
            {activeTab === "current" && (
              <div className="space-y-4 pt-1">
                {/* Economics Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Card className="p-3 bg-background border-border rounded-xl">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[10px] uppercase font-bold">Equity</span>
                      <Percent className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-lg font-extrabold text-foreground font-mono">
                      {terms?.equityPercentage ?? 0}%
                    </div>
                    <span className="text-[10px] text-muted-foreground">Creator Stake</span>
                  </Card>

                  <Card className="p-3 bg-background border-border rounded-xl">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[10px] uppercase font-bold">Role</span>
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-sm font-bold text-foreground truncate">
                      {terms?.creatorRole || "Co-founder"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{terms?.timeCommitment || "Part-time"}</span>
                  </Card>

                  <Card className="p-3 bg-background border-border rounded-xl">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[10px] uppercase font-bold">Cash Component</span>
                      <Coins className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-base font-extrabold text-foreground font-mono">
                      {terms?.cashComponent ? `€${terms.cashComponent.toLocaleString()}` : "€0"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Upfront / Bonus</span>
                  </Card>

                  <Card className="p-3 bg-background border-border rounded-xl">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[10px] uppercase font-bold">Vesting</span>
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {terms?.vestingEnabled ? `${Math.round(terms.vestingMonths / 12)} Years` : "None"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {terms?.vestingEnabled ? `${terms.cliffMonths}m Cliff` : "Immediate"}
                    </span>
                  </Card>
                </div>

                {/* Responsibilities & Deliverables */}
                <div className="space-y-2 rounded-xl border border-border bg-background p-4 text-xs">
                  <span className="font-semibold text-foreground">Agreed / Proposed Responsibilities</span>
                  {terms?.responsibilities?.length ? (
                    <ul className="space-y-1.5 pt-1">
                      {terms.responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">Standard co-founder responsibilities apply.</p>
                  )}
                </div>

                {/* Notes & Validity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {terms?.notes && (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                      <span className="font-semibold text-foreground">Note from Proposer</span>
                      <p className="text-muted-foreground italic">"{terms.notes}"</p>
                    </div>
                  )}
                  {terms?.expiresAt && (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Hourglass className="h-3.5 w-3.5 text-muted-foreground" /> Offer Expiry
                      </span>
                      <p className="text-muted-foreground">
                        Valid until {new Date(terms.expiresAt).toLocaleDateString()} (
                        {new Date(terms.expiresAt) > new Date() ? "Active" : "Expired"})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Revision History */}
            {activeTab === "history" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-2.5">
                  {(deal.revisions || []).map((rev) => (
                    <div
                      key={rev.revisionNumber}
                      className={`rounded-xl border p-3 text-xs space-y-2 transition-all ${
                        rev.revisionNumber === deal.currentRevisionNumber
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono font-bold text-[10px]">
                            V{rev.revisionNumber}
                          </Badge>
                          <span className="font-semibold capitalize text-foreground">
                            {rev.offeredByRole === "creator" ? deal.creatorName : deal.entrepreneurName} ({rev.offeredByRole})
                          </span>
                        </div>
                        <Badge
                          variant={
                            rev.status === "accepted"
                              ? "default"
                              : rev.status === "rejected"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[10px] uppercase font-semibold"
                        >
                          {rev.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-muted-foreground text-[11px] bg-muted/40 p-2 rounded-lg">
                        <div>
                          Equity: <strong className="text-foreground">{rev.terms.equityPercentage}%</strong>
                        </div>
                        <div>
                          Role: <strong className="text-foreground">{rev.terms.creatorRole}</strong>
                        </div>
                        <div>
                          Cash: <strong className="text-foreground">{rev.terms.cashComponent ? `€${rev.terms.cashComponent}` : "€0"}</strong>
                        </div>
                      </div>

                      {rev.note && <p className="italic text-muted-foreground text-[11px]">"{rev.note}"</p>}

                      <div className="text-[10px] text-muted-foreground">
                        Submitted: {new Date(rev.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-border bg-muted/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/chat"
                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background text-xs font-medium hover:bg-muted/60 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5 text-primary" /> Ask Question
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {isMyTurn && !isExpired && (
                <>
                  {!confirmReject ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmReject(true)}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Reject
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={loadingAction === "reject"}
                      onClick={handleReject}
                      className="h-8 text-xs"
                    >
                      {loadingAction === "reject" ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      Confirm Reject
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCountering(true)}
                    className="h-8 gap-1 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" /> Counter Offer
                  </Button>

                  <Button
                    size="sm"
                    variant="default"
                    disabled={loadingAction === "accept"}
                    onClick={handleAccept}
                    className="h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loadingAction === "accept" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Accept Offer (V{deal.currentRevisionNumber})
                  </Button>
                </>
              )}

              {(!isMyTurn || isExpired || isAccepted || isRejected) && (
                <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs">
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested Counter Form Modal */}
      {isCountering && (
        <EquityOfferForm
          isOpen={isCountering}
          onClose={() => setIsCountering(false)}
          onSubmit={handleCounterSubmit}
          projectName={deal.projectName}
          creatorName={deal.creatorName}
          isCounter={true}
          initialTerms={terms}
          currentRevisionNumber={deal.currentRevisionNumber}
        />
      )}
    </>
  );
}
