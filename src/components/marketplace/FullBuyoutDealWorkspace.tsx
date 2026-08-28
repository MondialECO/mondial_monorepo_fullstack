"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  marketplaceProjectsApi,
  EquityDeal,
  BuyoutLegalPackage,
  InviteBuyoutLegalProviderRequest,
  ReviewBuyoutLegalPackageRequest,
  RequestBuyoutLegalChangesRequest,
  ReviseBuyoutDocumentRequest,
} from "@/lib/api-marketplace-projects";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  FileCheck,
  CreditCard,
  Package,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Handshake,
  DollarSign,
  AlertTriangle,
  User,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { BuyoutLegalReviewScreen } from "./BuyoutLegalReviewScreen";
import { BuyoutAgreementSigningScreen } from "./BuyoutAgreementSigningScreen";
import { BuyoutClosingScreen } from "./BuyoutClosingScreen";
import { BuyoutHandoverScreen } from "./BuyoutHandoverScreen";
import { BuyoutSaleRecordScreen } from "./BuyoutSaleRecordScreen";

interface FullBuyoutDealWorkspaceProps {
  dealId: string;
  isCreator: boolean;
  currentUserId?: string;
  backUrl?: string;
  backLabel?: string;
}

export const BUYOUT_STAGES = [
  { id: 1, key: "TERMS", label: "1. Buyout Terms", shortLabel: "Terms", icon: DollarSign },
  { id: 2, key: "LEGAL", label: "2. Legal & Transfer", shortLabel: "Legal & Transfer", icon: Scale },
  { id: 3, key: "SIGNING", label: "3. Agreement Signing", shortLabel: "Signing", icon: FileCheck },
  { id: 4, key: "CLOSING", label: "4. Payment Confirmation", shortLabel: "Payment", icon: CreditCard },
  { id: 5, key: "HANDOVER", label: "5. Asset Handover", shortLabel: "Handover", icon: Package },
  { id: 6, key: "SOLD", label: "6. Sale Completed", shortLabel: "Completed", icon: CheckCircle2 },
] as const;

export function getStageNumberFromDealStage(stage?: string): number {
  switch (stage) {
    case "OFFER_SUBMITTED":
    case "TERMS_COUNTERED":
    case "OFFER_NEGOTIATION":
      return 1;
    case "BUYOUT_TERMS_ACCEPTED":
    case "BUYOUT_LEGAL_REVIEW_PENDING":
      return 2;
    case "BUYOUT_SIGNATURE_PENDING":
      return 3;
    case "BUYOUT_CLOSING_PENDING":
      return 4;
    case "BUYOUT_HANDOVER_PENDING":
      return 5;
    case "SOLD":
    case "BUYOUT_COMPLETED":
      return 6;
    default:
      return 1;
  }
}

export const FullBuyoutDealWorkspace: React.FC<FullBuyoutDealWorkspaceProps> = ({
  dealId,
  isCreator,
  currentUserId = "",
  backUrl = isCreator ? "/dashboard/creator/sales" : "/dashboard/entrepreneur/acquisitions",
  backLabel = isCreator ? "Back to My Sales" : "Back to My Acquisitions",
}) => {
  const router = useRouter();
  const [deal, setDeal] = useState<EquityDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStageTab, setActiveStageTab] = useState<number>(2);

  // Legal Package state
  const [legalPkg, setLegalPkg] = useState<BuyoutLegalPackage | null>(null);
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);

  const loadDeal = async () => {
    if (!dealId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await marketplaceProjectsApi.getDeal(dealId);
      setDeal(res);
      const currentStageNum = getStageNumberFromDealStage(res.dealStage);
      setActiveStageTab(currentStageNum);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to load Full Buyout deal.");
    } finally {
      setLoading(false);
    }
  };

  const loadLegalPackage = async () => {
    if (!dealId) return;
    try {
      setLegalLoading(true);
      setLegalError(null);
      const res = await marketplaceProjectsApi.getBuyoutLegalPackage(dealId);
      setLegalPkg(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setLegalError(e.response?.data?.message || e.message || "Failed to load legal & transfer review package.");
    } finally {
      setLegalLoading(false);
    }
  };

  useEffect(() => {
    loadDeal();
  }, [dealId]);

  useEffect(() => {
    if (activeStageTab === 2 && dealId) {
      loadLegalPackage();
    }
  }, [activeStageTab, dealId]);

  const handleApproveLegal = async () => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.approveBuyoutLegalPackage(dealId, {
      legalPackageVersion: legalPkg?.version,
    });
    setLegalPkg(updated);
    await loadDeal();
  };

  const handleRequestLegalChanges = async (req: RequestBuyoutLegalChangesRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.requestBuyoutLegalChanges(dealId, req);
    setLegalPkg(updated);
  };

  const handleInviteLegalProvider = async (req: InviteBuyoutLegalProviderRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.inviteBuyoutLegalProvider(dealId, req);
    setLegalPkg(updated);
  };

  const handleProviderLegalReview = async (req: ReviewBuyoutLegalPackageRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.reviewBuyoutLegalPackage(dealId, req);
    setLegalPkg(updated);
  };

  const handleReviseLegalDoc = async (docId: string, req: ReviseBuyoutDocumentRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.reviseBuyoutDocument(dealId, docId, req);
    setLegalPkg(updated);
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading Full Buyout Workspace...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backUrl)}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
        <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <h3 className="text-base font-bold text-foreground">Deal Not Available</h3>
          <p className="text-sm text-muted-foreground">{error || "Could not retrieve the specified Full Buyout deal record."}</p>
          <Button variant="outline" size="sm" onClick={loadDeal} className="text-xs">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const currentStageNum = getStageNumberFromDealStage(deal.dealStage);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 text-foreground">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backUrl)}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={loadDeal}
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Deal
        </Button>
      </div>

      {/* Main Deal Header Card */}
      <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                Full Buyout
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  deal.dealStage === "SOLD" || deal.dealStage === "BUYOUT_COMPLETED"
                    ? "bg-success-light text-success-strong border-success-strong/30"
                    : "bg-warning/10 text-warning border-warning/30"
                }`}
              >
                {deal.dealStage.replace(/_/g, " ")}
              </Badge>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{deal.projectName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Deal Reference: {deal.id}
            </p>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Agreed Purchase Price</div>
              <div className="text-xl font-extrabold text-foreground">
                {deal.buyoutTerms?.purchasePrice ? `€${deal.buyoutTerms.purchasePrice.toLocaleString()} EUR` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Counterpart Information */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>
              {isCreator ? (
                <>Acquiring Buyer: <strong className="text-foreground">{deal.entrepreneurName || "Entrepreneur"}</strong></>
              ) : (
                <>Project Creator / Seller: <strong className="text-foreground">{deal.creatorName || "Creator"}</strong></>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-success-strong" />
            <span>Canonical IP &amp; Asset Handover Package</span>
          </div>
        </div>
      </Card>

      {/* 6-Stage Full Buyout Stepper / Timeline */}
      <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="text-xs font-bold text-foreground mb-3 flex items-center justify-between">
          <span>Full Buyout Lifecycle Progress</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            Stage {Math.min(currentStageNum, 6)} of 6
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {BUYOUT_STAGES.map((step) => {
            const isDealSold = deal.dealStage === "SOLD" || deal.dealStage === "BUYOUT_COMPLETED";
            const isCompleted = step.id < currentStageNum || (step.id === 6 && isDealSold);
            const isCurrent = step.id === currentStageNum && !isDealSold;
            const isLocked = step.id > currentStageNum;
            const isSelected = activeStageTab === step.id;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => setActiveStageTab(step.id)}
                className={`text-left rounded-xl p-3 border transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : isCompleted
                    ? "border-border bg-card hover:border-primary/40"
                    : isCurrent
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/60 bg-muted/20 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-1.5 rounded-lg text-xs ${
                      isCompleted
                        ? "bg-success-light text-success-strong"
                        : isCurrent || isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success-strong" />
                  ) : isLocked ? (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  ) : null}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground truncate">{step.shortLabel}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {isCompleted ? (isDealSold && step.id === 6 ? "Sale Completed" : "Completed") : isCurrent ? "Active Stage" : "Upcoming"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* STAGE TAB 1: BUYOUT TERMS */}
      {activeStageTab === 1 && (
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Commercial Buyout Terms</h2>
            </div>
            <Badge className="bg-success-light text-success-strong border-success-strong/30 text-xs">
              Terms Agreed &amp; Binding
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border bg-background">
              <span className="text-xs text-muted-foreground block">Agreed Purchase Price</span>
              <span className="text-xl font-extrabold text-foreground mt-1 block">
                €{deal.buyoutTerms?.purchasePrice ? deal.buyoutTerms.purchasePrice.toLocaleString() : "0"} EUR
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-background">
              <span className="text-xs text-muted-foreground block">Handover Duration</span>
              <span className="text-xl font-bold text-foreground mt-1 block">
                {deal.buyoutTerms?.handoverPeriodWeeks ?? 2} Weeks
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-background">
              <span className="text-xs text-muted-foreground block">Transition Support</span>
              <span className="text-xl font-bold text-foreground mt-1 block">
                {deal.buyoutTerms?.transitionSupportWeeks ?? 0} Weeks
              </span>
            </div>
          </div>

          {deal.buyoutTerms?.notes && (
            <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs space-y-1">
              <span className="font-semibold text-foreground">Terms Notes:</span>
              <p className="text-muted-foreground">{deal.buyoutTerms.notes}</p>
            </div>
          )}

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Commercial terms agreed by both parties.</span>
            <Button
              variant="default"
              size="sm"
              onClick={() => setActiveStageTab(2)}
              className="text-xs font-semibold"
            >
              Continue to Legal &amp; Transfer <Scale className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE TAB 2: LEGAL & TRANSFER REVIEW */}
      {activeStageTab === 2 && (
        <div className="space-y-4">
          {currentStageNum < 2 ? (
            <Card className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Legal &amp; Transfer Locked</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Legal &amp; Transfer schedules will automatically generate as soon as commercial buyout terms are accepted.
              </p>
            </Card>
          ) : legalLoading && !legalPkg ? (
            <Card className="rounded-2xl border border-border bg-card p-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Loading Legal &amp; Asset Transfer Package...</p>
            </Card>
          ) : legalError ? (
            <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
              <div className="text-sm font-semibold text-destructive">{legalError}</div>
              <Button variant="outline" size="sm" onClick={loadLegalPackage} className="text-xs">
                Retry Loading Legal Package
              </Button>
            </Card>
          ) : legalPkg ? (
            <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <BuyoutLegalReviewScreen
                pkg={legalPkg}
                dealId={dealId}
                isCreator={isCreator}
                currentUserId={currentUserId}
                onApprove={handleApproveLegal}
                onRequestChanges={handleRequestLegalChanges}
                onInviteProvider={handleInviteLegalProvider}
                onProviderReview={handleProviderLegalReview}
                onReviseDocument={handleReviseLegalDoc}
                onRefresh={loadLegalPackage}
              />
            </Card>
          ) : null}
        </div>
      )}

      {/* STAGE TAB 3: AGREEMENT SIGNING */}
      {activeStageTab === 3 && (
        <div className="space-y-4">
          {currentStageNum < 3 ? (
            <Card className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Agreement Signing Locked</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Bilateral agreement signing will unlock once both Creator and Buyer have approved the Legal &amp; Asset Transfer review package.
              </p>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <BuyoutAgreementSigningScreen
                dealId={dealId}
                isCreator={isCreator}
                currentUserId={currentUserId}
                onCompleted={async () => {
                  await loadDeal();
                  setActiveStageTab(4);
                }}
                onNavigateToClosing={async () => {
                  await loadDeal();
                  setActiveStageTab(4);
                }}
              />
            </Card>
          )}
        </div>
      )}

      {/* STAGE TAB 4: CLOSING & PAYMENT */}
      {activeStageTab === 4 && (
        <div className="space-y-4">
          {currentStageNum < 4 ? (
            <Card className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Closing &amp; Payment Locked</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Closing and payment confirmation will unlock once agreement signing is complete by both parties.
              </p>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <BuyoutClosingScreen
                dealId={dealId}
                isCreator={isCreator}
                onRefreshDeal={loadDeal}
                onProceedToHandover={async () => {
                  await loadDeal();
                  setActiveStageTab(5);
                }}
              />
            </Card>
          )}
        </div>
      )}

      {/* STAGE TAB 5: ASSET HANDOVER */}
      {activeStageTab === 5 && (
        <div className="space-y-4">
          {currentStageNum < 5 ? (
            <Card className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Asset Handover Locked</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Asset handover will unlock upon bilateral payment submission and receipt confirmation.
              </p>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <BuyoutHandoverScreen
                dealId={dealId}
                isCreator={isCreator}
                onRefreshDeal={loadDeal}
                onViewSaleRecord={async () => {
                  await loadDeal();
                  setActiveStageTab(6);
                }}
              />
            </Card>
          )}
        </div>
      )}

      {/* STAGE TAB 6: SALE COMPLETED / SALE RECORD */}
      {activeStageTab === 6 && (
        <div className="space-y-4">
          {currentStageNum < 6 ? (
            <Card className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Sale Record In Progress</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                The canonical sale record will be sealed upon completion of all asset handover steps.
              </p>
            </Card>
          ) : (
            <BuyoutSaleRecordScreen
              dealId={dealId}
              onClose={() => router.push(backUrl)}
            />
          )}
        </div>
      )}
    </div>
  );
};
