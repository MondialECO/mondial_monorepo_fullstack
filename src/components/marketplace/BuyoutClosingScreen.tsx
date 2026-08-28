"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ShieldCheck,
  CreditCard,
  Building,
  ArrowRight,
  Info,
  RefreshCw,
  Upload,
  AlertCircle,
} from "lucide-react";
import marketplaceProjectsApi, {
  BuyoutClosing,
  SubmitBuyoutPaymentRequest,
  ConfirmBuyoutPaymentRequest,
  DisputeBuyoutPaymentRequest,
} from "@/lib/api-marketplace-projects";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BuyoutClosingScreenProps {
  dealId: string;
  isCreator: boolean;
  onRefreshDeal?: () => void;
  onProceedToHandover?: () => void;
}

export const BuyoutClosingScreen: React.FC<BuyoutClosingScreenProps> = ({
  dealId,
  isCreator,
  onRefreshDeal,
  onProceedToHandover,
}) => {
  const [closing, setClosing] = useState<BuyoutClosing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Buyer form state
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [documentReference, setDocumentReference] = useState<string>("");
  const [documentName, setDocumentName] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Dispute modal / form state
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [disputeReason, setDisputeReason] = useState<string>("");

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmNotes, setConfirmNotes] = useState<string>("");

  const loadClosing = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceProjectsApi.getBuyoutClosing(dealId);
      setClosing(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load buyout closing details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClosing();
  }, [dealId]);

  const handleBuyerSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentReference.trim()) {
      setError("Please enter a transaction reference or confirmation code.");
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const req: SubmitBuyoutPaymentRequest = {
        paymentMethod,
        paymentReference: paymentReference.trim(),
        documentReference: documentReference.trim() || undefined,
        documentName: documentName.trim() || "Payment Transfer Confirmation",
        notes: paymentNotes.trim() || undefined,
        expectedVersion: closing?.version,
      };
      const updated = await marketplaceProjectsApi.submitBuyoutPayment(dealId, req);
      setClosing(updated);
      setSuccessMsg("Payment confirmation submitted successfully! Waiting for Creator receipt verification.");
      onRefreshDeal?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to submit payment information.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatorConfirmPayment = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const req: ConfirmBuyoutPaymentRequest = {
        notes: confirmNotes.trim() || undefined,
        expectedVersion: closing?.version,
      };
      const updated = await marketplaceProjectsApi.confirmBuyoutPayment(dealId, req);
      setClosing(updated);
      setShowConfirmModal(false);
      setSuccessMsg("Payment receipt confirmed! Deal has transitioned to Handover stage.");
      onRefreshDeal?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to confirm payment receipt.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputePayment = async () => {
    if (!disputeReason.trim()) {
      setError("Please specify the reason for reporting a payment issue.");
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const req: DisputeBuyoutPaymentRequest = {
        disputeReason: disputeReason.trim(),
        expectedVersion: closing?.version,
      };
      const updated = await marketplaceProjectsApi.disputeBuyoutPayment(dealId, req);
      setClosing(updated);
      setShowDisputeModal(false);
      setSuccessMsg("Payment issue recorded. Handover is paused until resolution.");
      onRefreshDeal?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to record payment issue.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !closing) {
    return (
      <Card className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
        <p className="text-sm font-medium">Loading Full Buyout Closing details...</p>
      </Card>
    );
  }

  if (error && !closing) {
    return (
      <Card className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-foreground shadow-sm">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Closing Access Error</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={loadClosing}>
          Try Again
        </Button>
      </Card>
    );
  }

  if (!closing) return null;

  const isPaymentSubmitted =
    closing.paymentStatus === "PAYMENT_SUBMITTED" || closing.paymentStatus === "PAYMENT_VERIFICATION_PENDING";
  const isPaymentConfirmed = closing.paymentStatus === "PAYMENT_CONFIRMED";
  const isPaymentDisputed = closing.paymentStatus === "PAYMENT_DISPUTED";
  const isPaymentPending = closing.paymentStatus === "NOT_STARTED" || closing.paymentStatus === "PAYMENT_PENDING";

  return (
    <div className="space-y-6 text-foreground">
      {/* 1. Stage Progress Header */}
      <Card className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                FULL BUYOUT — STAGE 5 OF 6
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Rev V{closing.acceptedRevisionNumber}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground mt-1 flex items-center gap-2">
              Closing &amp; Payment Verification
              <Lock className="w-4 h-4 text-muted-foreground" />
            </h2>
          </div>

          {/* Stepper Breadcrumbs */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-muted-foreground">
            <span className="text-success-strong flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success-strong" /> Offer
            </span>
            <span>→</span>
            <span className="text-success-strong flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success-strong" /> Legal
            </span>
            <span>→</span>
            <span className="text-success-strong flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success-strong" /> Signed
            </span>
            <span>→</span>
            <span className="text-primary font-bold flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
              ● Payment
            </span>
            <span>→</span>
            <span>Handover</span>
            <span>→</span>
            <span>Completed</span>
          </div>
        </div>
      </Card>

      {/* Manual Payment Verification & Closing Notice */}
      <div className="bg-muted/40 border border-border rounded-lg p-4 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Manual Payment Verification &amp; Closing State:</span>{" "}
          The platform registers transaction references, timestamps, and bilateral confirmations. Financial transactions are conducted directly between Creator and Buyer (e.g., Bank Transfer / Wire).
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="bg-success-light border border-success-strong/30 text-success-strong rounded-lg p-4 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Top Overview Grid: Locked Commercials & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Locked Purchase Price Card */}
        <Card className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Locked Purchase Price
            </span>
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            €{closing.purchasePrice.toLocaleString()} {closing.currency}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-success-strong" />
            Binding price locked from signed agreement
          </p>
          <div className="mt-3 pt-3 border-t border-border text-[11px] font-mono text-muted-foreground truncate">
            Manifest: {closing.manifestHash.slice(0, 16)}...
          </div>
        </Card>

        {/* Payment State Card */}
        <Card className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment State
            </span>
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isPaymentConfirmed && (
              <Badge variant="outline" className="bg-success-light text-success-strong border-success-strong/30 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PAYMENT CONFIRMED
              </Badge>
            )}
            {isPaymentSubmitted && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                VERIFICATION PENDING
              </Badge>
            )}
            {isPaymentPending && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                PAYMENT PENDING
              </Badge>
            )}
            {isPaymentDisputed && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                PAYMENT DISPUTED
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Method: <span className="font-mono text-foreground font-semibold">{closing.paymentMethod.replace("_", " ")}</span>
          </p>
          {closing.paymentReference && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Ref: <span className="font-mono text-foreground">{closing.paymentReference}</span>
            </p>
          )}
        </Card>

        {/* Closing Gate Status */}
        <Card className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Handover Gate
            </span>
            <Building className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            {closing.canProceedToHandover ? (
              <Badge variant="outline" className="bg-success-light text-success-strong border-success-strong/30 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                READY FOR HANDOVER
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                HANDOVER LOCKED
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {closing.canProceedToHandover
              ? "All closing prerequisites met. Asset handover can proceed."
              : "Payment verification required to unlock asset transfer."}
          </p>
        </Card>
      </div>

      {/* 3. Dispute Active Warning Banner */}
      {isPaymentDisputed && (
        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-destructive">
                Payment Dispute Active — Handover Paused
              </h4>
              <p className="text-sm text-foreground">
                {closing.disputeReason || "An issue regarding payment receipt has been registered."}
              </p>
              {closing.disputedAt && (
                <p className="text-xs text-muted-foreground">
                  Reported at: {new Date(closing.disputedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Action Area: Buyer vs Creator View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Role Action Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* BUYER ACTION CARD */}
          {!isCreator && (
            <Card className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Buyer Payment Submission
              </h3>

              {isPaymentPending ? (
                <form onSubmit={handleBuyerSubmitPayment} className="space-y-4">
                  <div className="bg-muted/40 p-4 rounded-lg border border-border text-xs text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">Transfer Instructions:</p>
                    <p>
                      Please transfer the locked purchase price of{" "}
                      <strong className="text-foreground">€{closing.purchasePrice.toLocaleString()} {closing.currency}</strong> to the Creator ({closing.creatorName}) via your agreed payment channel. Once sent, provide the transaction reference below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="BANK_TRANSFER">Bank Wire / SEPA Transfer</option>
                        <option value="PAYMENT_PROVIDER">Payment Provider / Online Wire</option>
                        <option value="ESCROW">Third-Party Escrow (External)</option>
                        <option value="OTHER">Other External Channel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Transfer Reference / Transaction ID <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SEPA-TX-892301934"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Evidence Document ID / Receipt Reference
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DOC-WIRE-RECEIPT-001"
                        value={documentReference}
                        onChange={(e) => setDocumentReference(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Receipt / Document Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bank Wire Confirmation Receipt"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Notes for Creator (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Wire initiated from Deutsche Bank; expected arrival within 24-48 hours."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={actionLoading || !paymentReference.trim()}
                      className="w-full sm:w-auto gap-2"
                    >
                      {actionLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" /> Submit Payment Confirmation
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/40 p-4 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Payment Status</span>
                      <span className="text-xs font-bold text-primary">
                        {closing.paymentStatus.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Transaction Reference</span>
                      <span className="text-xs font-mono text-foreground">
                        {closing.paymentReference || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-semibold">Stated Amount</span>
                      <span className="text-xs font-bold text-foreground">
                        €{closing.purchasePrice.toLocaleString()} {closing.currency}
                      </span>
                    </div>
                    {closing.buyerConfirmedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-semibold">Submitted At</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(closing.buyerConfirmedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {isPaymentSubmitted && (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 text-xs text-foreground flex items-start gap-3">
                      <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <div>
                        <strong>Awaiting Creator Confirmation:</strong> The Seller ({closing.creatorName}) has been notified to verify receipt of funds in their account.
                      </div>
                    </div>
                  )}

                  {isPaymentConfirmed && (
                    <div className="p-4 rounded-lg bg-success-light border border-success-strong/30 text-xs text-success-strong flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
                      <div>
                        <strong>Payment Verified:</strong> Creator confirmed funds receipt on{" "}
                        {closing.creatorConfirmedAt ? new Date(closing.creatorConfirmedAt).toLocaleString() : "recently"}.
                      </div>
                    </div>
                  )}

                  {!isPaymentConfirmed && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDisputeModal(true)}
                        className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Report Issue / Update Payment Info
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* CREATOR ACTION CARD */}
          {isCreator && (
            <Card className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-success-strong" />
                Creator Payment Receipt Verification
              </h3>

              {isPaymentPending && (
                <div className="p-5 rounded-lg bg-muted/40 border border-border text-sm text-foreground space-y-2">
                  <p className="font-semibold text-foreground">Awaiting Buyer Payment:</p>
                  <p className="text-xs text-muted-foreground">
                    The Buyer ({closing.entrepreneurName}) has signed the agreement and is preparing to send the agreed purchase price of{" "}
                    <strong className="text-foreground">€{closing.purchasePrice.toLocaleString()} {closing.currency}</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You will be notified once the buyer submits payment reference details.
                  </p>
                </div>
              )}

              {isPaymentSubmitted && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <p className="text-xs font-semibold text-primary flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      Buyer Submitted Payment Details:
                    </p>
                    <div className="bg-background p-3 rounded border border-border text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-semibold text-foreground">{closing.paymentMethod.replace("_", " ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction Reference:</span>
                        <span className="font-mono text-primary font-bold">{closing.paymentReference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stated Amount:</span>
                        <span className="font-bold text-foreground">
                          €{closing.purchasePrice.toLocaleString()} {closing.currency}
                        </span>
                      </div>
                      {closing.buyerConfirmedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Submitted At:</span>
                          <span className="text-muted-foreground">{new Date(closing.buyerConfirmedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Please check your bank account or payment provider balance. Once you have verified full receipt of funds, click below to confirm.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={actionLoading}
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verify &amp; Confirm Payment Receipt
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setShowDisputeModal(true)}
                      disabled={actionLoading}
                      className="border-destructive/40 hover:bg-destructive/10 text-destructive text-sm gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-destructive" /> Report Issue / Dispute
                    </Button>
                  </div>
                </div>
              )}

              {isPaymentConfirmed && (
                <div className="p-5 rounded-lg bg-success-light border border-success-strong/30 space-y-2">
                  <div className="flex items-center gap-2 text-success-strong font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-success-strong" />
                    Payment Confirmed by You
                  </div>
                  <p className="text-xs text-foreground">
                    Receipt confirmed on{" "}
                    {closing.creatorConfirmedAt ? new Date(closing.creatorConfirmedAt).toLocaleString() : "recently"}.
                    Closing is finalized. Asset Handover (Phase 5) is now ready.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* 5. Payment Evidence Entries Card */}
          <Card className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Payment Records &amp; Audit Trail
            </h4>

            {closing.evidence && closing.evidence.length > 0 ? (
              <div className="space-y-2">
                {closing.evidence.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="bg-background border border-border p-3 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{ev.documentName}</p>
                      <p className="text-muted-foreground font-mono">Ref: {ev.documentReference}</p>
                      {ev.notes && <p className="text-muted-foreground italic">"{ev.notes}"</p>}
                    </div>
                    <div className="text-right text-muted-foreground space-y-0.5">
                      <Badge variant="outline" className="text-[10px]">
                        {ev.uploadedByRole}
                      </Badge>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(ev.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No payment evidence records uploaded yet.
              </p>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Closing Checklist & Next Phase Gate */}
        <div className="space-y-6">
          {/* Closing Checklist */}
          <Card className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Closing Stage Checklist
            </h4>

            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">1. Final Transfer Agreement Signed</span>
                  <p className="text-muted-foreground">Bilateral e-signatures verified with ManifestHash</p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                {isPaymentSubmitted || isPaymentConfirmed ? (
                  <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-foreground">2. Buyer Payment Submitted</span>
                  <p className="text-muted-foreground">
                    {isPaymentSubmitted || isPaymentConfirmed
                      ? `Submitted by ${closing.entrepreneurName}`
                      : "Pending submission from Buyer"}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                {isPaymentConfirmed ? (
                  <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-foreground">3. Creator Receipt Verification</span>
                  <p className="text-muted-foreground">
                    {isPaymentConfirmed
                      ? `Confirmed by ${closing.creatorName}`
                      : "Awaiting Creator confirmation"}
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                {closing.canProceedToHandover ? (
                  <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-foreground">4. Handover Authorization</span>
                  <p className="text-muted-foreground">
                    {closing.canProceedToHandover
                      ? "Closing prerequisites cleared"
                      : "Locked until payment confirmed"}
                  </p>
                </div>
              </li>
            </ul>
          </Card>

          {/* Handover Ready Banner / Next Step */}
          {closing.canProceedToHandover && (
            <Card className="rounded-xl border border-success-strong/30 bg-success-light p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-success-strong font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-success-strong" />
                Phase 5 Complete — Payment Confirmed
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Payment has been fully verified and confirmed. The deal has transitioned to <strong>BUYOUT_HANDOVER_PENDING</strong>.
              </p>
              {onProceedToHandover && (
                <Button
                  onClick={onProceedToHandover}
                  className="w-full mt-2 gap-2"
                >
                  Proceed to Asset Handover <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </Card>
          )}

          {/* Blockers list if any */}
          {closing.blockers && closing.blockers.length > 0 && !closing.canProceedToHandover && (
            <Card className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs space-y-2">
              <span className="font-semibold text-warning flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                Active Blockers ({closing.blockers.length})
              </span>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {closing.blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="rounded-xl border border-border bg-card p-6 max-w-md w-full shadow-2xl space-y-4 text-foreground">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success-strong" />
              Confirm Payment Receipt
            </h3>
            <p className="text-xs text-muted-foreground">
              You are confirming that you have received the full purchase price of{" "}
              <strong className="text-foreground">€{closing.purchasePrice.toLocaleString()} {closing.currency}</strong> from Buyer {closing.entrepreneurName}.
            </p>
            <p className="text-xs text-muted-foreground">
              Confirming this will transition the deal to the <strong>Handover</strong> stage, authorizing the asset transfer process.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Confirmation Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Funds verified in account."
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreatorConfirmPayment}
                disabled={actionLoading}
                className="gap-2"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm Funds Received
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="rounded-xl border border-border bg-card p-6 max-w-md w-full shadow-2xl space-y-4 text-foreground">
            <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Report Payment Issue / Dispute
            </h3>
            <p className="text-xs text-muted-foreground">
              Please describe the issue with this payment (e.g. transaction not found, wrong amount, delayed transfer). Reporting an issue will pause the transition to Handover until resolved.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Dispute Reason <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Bank transfer reference not located after 5 business days..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-destructive"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDisputeModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisputePayment}
                disabled={actionLoading || !disputeReason.trim()}
                className="gap-2"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                Submit Payment Issue
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BuyoutClosingScreen;
