"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ShieldCheck,
  Send,
  Info,
  RefreshCw,
  XCircle,
  Package,
  Globe,
  Code2,
  Layers,
  Sparkles,
} from "lucide-react";
import marketplaceProjectsApi, {
  BuyoutHandover,
  BuyoutHandoverAsset,
  DeliverBuyoutAssetRequest,
  VerifyBuyoutAssetRequest,
  ReportBuyoutAssetIssueRequest,
  ConfirmBuyoutHandoverRequest,
  CompleteBuyoutSaleRequest,
  BuyoutSaleRecord,
} from "@/lib/api-marketplace-projects";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BuyoutHandoverScreenProps {
  dealId: string;
  isCreator: boolean;
  onRefreshDeal?: () => void;
  onViewSaleRecord?: (record?: BuyoutSaleRecord) => void;
}

export const BuyoutHandoverScreen: React.FC<BuyoutHandoverScreenProps> = ({
  dealId,
  isCreator,
  onRefreshDeal,
  onViewSaleRecord,
}) => {
  const [handover, setHandover] = useState<BuyoutHandover | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delivery modal state (Creator)
  const [deliveringAsset, setDeliveringAsset] = useState<BuyoutHandoverAsset | null>(null);
  const [deliveryRef, setDeliveryRef] = useState<string>("REPO-INVITE-SENT");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [docRef, setDocRef] = useState<string>("");
  const [docName, setDocName] = useState<string>("");

  // Verification modal state (Buyer)
  const [verifyingAsset, setVerifyingAsset] = useState<BuyoutHandoverAsset | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<string>("");

  // Issue modal state (Buyer)
  const [issuingAsset, setIssuingAsset] = useState<BuyoutHandoverAsset | null>(null);
  const [issueReason, setIssueReason] = useState<string>("");

  // Final sale modal
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [completeNotes, setCompleteNotes] = useState<string>("");

  const loadHandover = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceProjectsApi.getBuyoutHandover(dealId);
      setHandover(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load buyout handover details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandover();
  }, [dealId]);

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringAsset) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const req: DeliverBuyoutAssetRequest = {
        deliveryReference: deliveryRef.trim() || undefined,
        notes: deliveryNotes.trim() || undefined,
        documentReference: docRef.trim() || undefined,
        documentName: docName.trim() || undefined,
        expectedVersion: handover?.version,
      };

      const updated = await marketplaceProjectsApi.deliverBuyoutAsset(dealId, deliveringAsset.assetId, req);
      setHandover(updated);
      setDeliveringAsset(null);
      setDeliveryRef("");
      setDeliveryNotes("");
      setDocRef("");
      setDocName("");
      setSuccessMsg(`Asset '${deliveringAsset.displayName}' delivered successfully.`);
      if (onRefreshDeal) onRefreshDeal();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to deliver asset.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingAsset) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const req: VerifyBuyoutAssetRequest = {
        notes: verifyNotes.trim() || undefined,
        expectedVersion: handover?.version,
      };

      const updated = await marketplaceProjectsApi.verifyBuyoutAsset(dealId, verifyingAsset.assetId, req);
      setHandover(updated);
      setVerifyingAsset(null);
      setVerifyNotes("");
      setSuccessMsg(`Asset '${verifyingAsset.displayName}' verified and accepted.`);
      if (onRefreshDeal) onRefreshDeal();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to verify asset.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuingAsset || !issueReason.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const req: ReportBuyoutAssetIssueRequest = {
        issueReason: issueReason.trim(),
        expectedVersion: handover?.version,
      };

      const updated = await marketplaceProjectsApi.reportBuyoutAssetIssue(dealId, issuingAsset.assetId, req);
      setHandover(updated);
      setIssuingAsset(null);
      setIssueReason("");
      setSuccessMsg(`Issue recorded for asset '${issuingAsset.displayName}'.`);
      if (onRefreshDeal) onRefreshDeal();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to record issue.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmHandover = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const req: ConfirmBuyoutHandoverRequest = {
        expectedVersion: handover?.version,
      };
      const updated = await marketplaceProjectsApi.confirmBuyoutHandover(dealId, req);
      setHandover(updated);
      setSuccessMsg("Handover sign-off recorded successfully.");
      if (onRefreshDeal) onRefreshDeal();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to confirm handover.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const req: CompleteBuyoutSaleRequest = {
        notes: completeNotes.trim() || undefined,
        expectedVersion: handover?.version,
      };
      const updatedDeal = await marketplaceProjectsApi.completeBuyoutSale(dealId, req);
      setShowCompleteModal(false);
      setSuccessMsg("FULL BUYOUT SALE COMPLETE! The project is now SOLD.");
      if (onRefreshDeal) onRefreshDeal();
      if (onViewSaleRecord && updatedDeal.buyoutSaleRecord) {
        onViewSaleRecord(updatedDeal.buyoutSaleRecord);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to complete sale.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm font-medium">Loading Asset Handover Workspace...</p>
      </Card>
    );
  }

  if (error && !handover) {
    return (
      <Card className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-foreground shadow-sm">
        <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Handover Access Gate Blocked</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={loadHandover}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </Card>
    );
  }

  if (!handover) return null;

  const isSold = handover.status === "COMPLETED";
  const verifiedCount = handover.assets.filter((a) => a.status === "VERIFIED").length;
  const totalCount = handover.assets.length;
  const progressPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 text-foreground">
      {/* 1. STAGE BREADCRUMBS */}
      <Card className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5 text-success-strong whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4 text-success-strong" />
            <span>Offer</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1.5 text-success-strong whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4 text-success-strong" />
            <span>Legal</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1.5 text-success-strong whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4 text-success-strong" />
            <span>Signing</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1.5 text-success-strong whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4 text-success-strong" />
            <span>Payment</span>
          </div>
          <span>→</span>
          <div className={`flex items-center gap-1.5 ${isSold ? "text-success-strong" : "text-primary font-semibold"} whitespace-nowrap`}>
            {isSold ? (
              <CheckCircle2 className="w-4 h-4 text-success-strong" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
            <span>Asset Handover</span>
          </div>
          <span>→</span>
          <div className={`flex items-center gap-1.5 ${isSold ? "text-success-strong font-bold" : "text-muted-foreground"} whitespace-nowrap`}>
            {isSold ? <CheckCircle2 className="w-4 h-4 text-success-strong" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Sold (Completed)</span>
          </div>
        </div>
      </Card>

      {/* SUCCESS / ERROR ALERTS */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-destructive hover:text-foreground">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-success-light border border-success-strong/30 rounded-xl text-success-strong text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success-strong shrink-0 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
          <button onClick={() => setSuccessMsg(null)} className="text-success-strong hover:text-foreground">✕</button>
        </div>
      )}

      {/* SOLD BANNER IF COMPLETED */}
      {isSold && (
        <Card className="p-6 bg-success-light border border-success-strong/30 rounded-2xl shadow-sm text-foreground">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success-strong/10 border border-success-strong/30 flex items-center justify-center text-success-strong">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success-light text-success-strong border-success-strong/30 font-black text-xs uppercase tracking-wider">
                    SOLD
                  </Badge>
                  <h2 className="text-lg font-bold text-foreground">Full Buyout Transaction Completed</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All transferred assets have been delivered and accepted. Purchase price: <span className="font-semibold text-foreground">€{handover.purchasePrice.toLocaleString()} {handover.currency}</span>.
                </p>
              </div>
            </div>
            {onViewSaleRecord && (
              <Button
                onClick={() => onViewSaleRecord()}
                size="sm"
                className="gap-2 font-bold"
              >
                <FileText className="w-4 h-4" />
                View Canonical Sale Record
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* 2. HEADER & IMMUTABLE SIGNED TERMS */}
      <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground tracking-tight">Phase 6: Asset Handover &amp; Final Completion</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Project: <span className="text-foreground font-medium">{handover.projectName}</span> • Seller: <span className="text-foreground font-medium">{handover.creatorName}</span> • Buyer: <span className="text-foreground font-medium">{handover.entrepreneurName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-background border border-border rounded-lg text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Agreed Price</span>
              <span className="text-sm font-bold text-foreground">€{handover.purchasePrice.toLocaleString()} {handover.currency} 🔒</span>
            </div>
            <div className="px-3 py-1.5 bg-background border border-border rounded-lg text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Handover Timeline</span>
              <span className="text-sm font-bold text-foreground">{handover.handoverPeriodWeeks} Weeks 🔒</span>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR & STATUS */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Handover Progress ({verifiedCount} of {totalCount} Assets Verified)
            </span>
            <span className="font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* TRANSITION SUPPORT NOTICE */}
        {handover.transitionSupportWeeks > 0 && (
          <div className="mt-4 p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <span>Agreed Transition Support Period: <strong className="text-foreground">{handover.transitionSupportWeeks} Weeks</strong> post-completion.</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Signed Term</span>
          </div>
        )}
      </Card>

      {/* 3. PRE-COMPLETION BLOCKERS / STATUS CHECK */}
      {!isSold && (
        <Card className={`p-4 rounded-xl border ${handover.canCompleteSale ? "bg-success-light border-success-strong/30" : "bg-warning/10 border-warning/30"}`}>
          <div className="flex items-start gap-3">
            {handover.canCompleteSale ? (
              <CheckCircle2 className="w-5 h-5 text-success-strong shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {handover.canCompleteSale ? "Ready for Final Sale Completion" : "Handover Incomplete — Pending Items"}
              </h4>
              {handover.canCompleteSale ? (
                <p className="text-xs text-foreground mt-1">
                  All {totalCount} required transfer assets have been delivered and verified by Buyer. Bilateral sign-offs are complete. You may now finalize the sale.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs list-disc list-inside text-muted-foreground">
                  {handover.blockers.map((b, idx) => (
                    <li key={idx} className="text-foreground">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 4. ASSET TRANSFER WORKSPACE LIST */}
      <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Transfer Asset Manifest Bundle</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exact canonical assets bound to signed agreement manifest ({handover.manifestHash.slice(0, 12)}...)
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadHandover}
            className="h-8 w-8 p-0"
            title="Refresh Handover State"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {handover.assets.map((asset) => {
            const isDelivered = asset.status === "DELIVERED" || asset.status === "VERIFIED";
            const isVerified = asset.status === "VERIFIED";
            const isIssue = asset.status === "ISSUE_REPORTED";
            const isPlatform = asset.deliveryType === "AVAILABLE_IN_PLATFORM";

            return (
              <div
                key={asset.assetId}
                className={`p-4 rounded-xl border transition-all ${
                  isVerified
                    ? "bg-success-light/30 border-success-strong/30"
                    : isIssue
                    ? "bg-destructive/5 border-destructive/30"
                    : isDelivered
                    ? "bg-primary/5 border-primary/20"
                    : "bg-background border-border"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg shrink-0 ${
                      isVerified
                        ? "bg-success-light text-success-strong"
                        : isIssue
                        ? "bg-destructive/10 text-destructive"
                        : isDelivered
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {asset.assetType.toLowerCase().includes("domain") ? (
                        <Globe className="w-4 h-4" />
                      ) : asset.assetType.toLowerCase().includes("code") ? (
                        <Code2 className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground">{asset.displayName}</h4>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {asset.assetType}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] uppercase ${
                          isPlatform ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"
                        }`}>
                          {isPlatform ? "Platform Vault" : "External Transfer"}
                        </Badge>
                      </div>

                      {/* DELIVERY / ISSUE NOTES */}
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        {asset.deliveryReference && (
                          <p>
                            <strong className="text-foreground">Reference:</strong> <span className="font-mono text-foreground">{asset.deliveryReference}</span>
                          </p>
                        )}
                        {asset.sellerNotes && (
                          <p className="italic text-foreground">
                            <strong className="text-muted-foreground not-italic">Seller Notes:</strong> {asset.sellerNotes}
                          </p>
                        )}
                        {asset.buyerNotes && (
                          <p className="italic text-foreground">
                            <strong className="text-muted-foreground not-italic">Buyer Notes:</strong> {asset.buyerNotes}
                          </p>
                        )}
                        {asset.issueReason && (
                          <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive mt-1 text-xs">
                            <strong>Issue Reported:</strong> {asset.issueReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STATUS & ACTIONS */}
                  <div className="flex flex-col md:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs font-bold uppercase tracking-wider ${
                        isVerified
                          ? "bg-success-light text-success-strong border-success-strong/30"
                          : isIssue
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : isDelivered
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {asset.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    {!isSold && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* CREATOR ACTION: DELIVER */}
                        {isCreator && asset.status !== "VERIFIED" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setDeliveringAsset(asset);
                              setDeliveryRef(asset.deliveryReference || "REPO-INVITE-SENT");
                              setDeliveryNotes(asset.sellerNotes || "");
                            }}
                            className="text-xs font-semibold gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {isDelivered ? "Update Delivery" : "Deliver Asset"}
                          </Button>
                        )}

                        {/* BUYER ACTIONS: VERIFY & REPORT ISSUE */}
                        {!isCreator && isDelivered && !isVerified && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setVerifyingAsset(asset);
                                setVerifyNotes("");
                              }}
                              className="text-xs font-semibold gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify &amp; Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIssuingAsset(asset);
                                setIssueReason("");
                              }}
                              className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-semibold gap-1.5"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Report Issue
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 5. BILATERAL FINAL CONFIRMATIONS & SALE COMPLETION ACTION */}
      {!isSold && (
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-bold text-foreground">Bilateral Handover Confirmation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Both parties must record final sign-off before the transaction can complete atomically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SELLER SIGN-OFF */}
            <div className="p-4 bg-background border border-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Creator / Seller Sign-Off</span>
                {handover.sellerConfirmedAt ? (
                  <Badge variant="outline" className="bg-success-light text-success-strong border-success-strong/30 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Signed Off
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning border-warning/30 text-xs font-medium">
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {handover.sellerConfirmedAt
                  ? `Recorded on ${new Date(handover.sellerConfirmedAt).toLocaleString()}`
                  : "Creator confirms all deliverables and transfer credentials have been provided."}
              </p>
              {isCreator && !handover.sellerConfirmedAt && (
                <Button
                  onClick={handleConfirmHandover}
                  disabled={actionLoading}
                  className="w-full text-xs font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Handover Complete (Seller)
                </Button>
              )}
            </div>

            {/* BUYER SIGN-OFF */}
            <div className="p-4 bg-background border border-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Buyer Sign-Off</span>
                {handover.buyerConfirmedAt ? (
                  <Badge variant="outline" className="bg-success-light text-success-strong border-success-strong/30 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Signed Off
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning border-warning/30 text-xs font-medium">
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {handover.buyerConfirmedAt
                  ? `Recorded on ${new Date(handover.buyerConfirmedAt).toLocaleString()}`
                  : "Buyer confirms receipt and control of all agreed assets in working condition."}
              </p>
              {!isCreator && !handover.buyerConfirmedAt && (
                <Button
                  onClick={handleConfirmHandover}
                  disabled={actionLoading}
                  className="w-full text-xs font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Receipt of All Assets (Buyer)
                </Button>
              )}
            </div>
          </div>

          {/* FINAL COMPLETE SALE BUTTON */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 inline-block text-success-strong mr-1.5" />
              Final sale completion permanently marks the project as <strong className="text-foreground font-mono">SOLD</strong> and closes marketplace listings.
            </div>
            <Button
              onClick={() => setShowCompleteModal(true)}
              disabled={!handover.canCompleteSale || actionLoading}
              className="text-xs font-bold uppercase tracking-wider gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Finalize Sale &amp; Mark SOLD
            </Button>
          </div>
        </Card>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. DELIVER ASSET MODAL (CREATOR) */}
      {deliveringAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="rounded-2xl border border-border bg-card max-w-lg w-full p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Deliver Asset: {deliveringAsset.displayName}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDeliveringAsset(null)} className="text-muted-foreground hover:text-foreground">✕</Button>
            </div>

            <form onSubmit={handleDeliverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Delivery / Transfer Reference (e.g. Repo link, Export Ref, Transfer Confirmation)
                </label>
                <input
                  type="text"
                  value={deliveryRef}
                  onChange={(e) => setDeliveryRef(e.target.value)}
                  placeholder="e.g. REPO-INVITE-SENT / DOMAIN-AUTH-CODE-SHARED / DOC-BUNDLE-V1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Delivery Notes / Instructions</label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Instructions for the buyer to access or verify the deliverable..."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground">
                <Info className="w-4 h-4 inline-block text-primary mr-1.5" />
                Security Rule: Never transmit registrar passwords or private secret keys.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeliveringAsset(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading}
                  className="gap-1.5 font-bold"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Mark Delivered
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 2. VERIFY ASSET MODAL (BUYER) */}
      {verifyingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="rounded-2xl border border-border bg-card max-w-lg w-full p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-strong" />
                <h3 className="text-base font-bold text-foreground">Verify Asset: {verifyingAsset.displayName}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setVerifyingAsset(null)} className="text-muted-foreground hover:text-foreground">✕</Button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Confirm that you have received and inspected <strong className="text-foreground">{verifyingAsset.displayName}</strong> and that it matches the specifications of the signed agreement.
              </p>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Verification Notes (Optional)</label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Domain transferred to my account successfully, DNS verified."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVerifyingAsset(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading}
                  className="gap-1.5 font-bold"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Confirm Verification
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 3. REPORT ISSUE MODAL (BUYER) */}
      {issuingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="rounded-2xl border border-border bg-card max-w-lg w-full p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="text-base font-bold text-destructive">Report Issue: {issuingAsset.displayName}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIssuingAsset(null)} className="text-muted-foreground hover:text-foreground">✕</Button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Reporting an issue will place this deliverable in <strong className="text-destructive">ISSUE_REPORTED</strong> status and prevent final sale completion until resolved by the seller.
              </p>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Issue Description *</label>
                <textarea
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  placeholder="Explain why the deliverable is incomplete or not working..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIssuingAsset(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={actionLoading || !issueReason.trim()}
                  className="gap-1.5 font-bold"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Submit Issue
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 4. COMPLETE SALE MODAL */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="rounded-2xl border border-border bg-card max-w-lg w-full p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Finalize Full Buyout Sale</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCompleteModal(false)} className="text-muted-foreground hover:text-foreground">✕</Button>
            </div>

            <form onSubmit={handleCompleteSaleSubmit} className="space-y-4">
              <div className="p-4 bg-success-light border border-success-strong/30 rounded-xl text-xs text-success-strong space-y-2">
                <p className="font-bold text-foreground text-sm">Sale Completion Checklist ✓</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>Payment confirmed (€{handover.purchasePrice.toLocaleString()} {handover.currency})</li>
                  <li>All {handover.assets.length} agreed assets verified</li>
                  <li>Signed agreement package binding verified</li>
                  <li>Bilateral sign-off completed</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Final Completion Notes (Optional)</label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="e.g. Transaction finalized smoothly. Handover complete."
                  rows={2}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading}
                  className="gap-1.5 font-bold uppercase tracking-wider"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Confirm &amp; Finalize Sale
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BuyoutHandoverScreen;
