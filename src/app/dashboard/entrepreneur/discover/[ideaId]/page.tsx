"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Loader2,
  Send,
  AlertCircle,
  Tag,
  Target,
  Lightbulb,
  FileText,
  TrendingUp,
  CreditCard,
  Users,
  Compass,
  Download,
  Lock,
  FileCheck,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  marketplaceProjectsApi,
  type MarketplaceProject,
  type PrivateMarketplaceProject,
  type NdaStatus,
  type EquityDeal,
  type CreateEquityOfferRequest,
  type CreateBuyoutOfferRequest,
  type CounterEquityOfferRequest,
  type CounterBuyoutOfferRequest,
} from "@/lib/api-marketplace-projects";
import type { ProjectInterest } from "@/lib/api-creator-journey";
import { NdaReviewModal } from "@/components/marketplace/NdaReviewModal";
import { EquityOfferForm } from "@/components/marketplace/EquityOfferForm";
import { BuyoutOfferForm } from "@/components/marketplace/BuyoutOfferForm";
import { EquityOfferReviewModal } from "@/components/marketplace/EquityOfferReviewModal";
import { BuyoutOfferReviewModal } from "@/components/marketplace/BuyoutOfferReviewModal";
import { BuyoutLegalReviewModal } from "@/components/marketplace/BuyoutLegalReviewModal";
import { BuyoutAgreementSigningModal } from "@/components/marketplace/BuyoutAgreementSigningModal";
import { BuyoutClosingModal } from "@/components/marketplace/BuyoutClosingModal";
import { BuyoutHandoverModal } from "@/components/marketplace/BuyoutHandoverModal";
import { BuyoutSaleRecordModal } from "@/components/marketplace/BuyoutSaleRecordModal";
import { RoleAgreementModal } from "@/components/marketplace/RoleAgreementModal";
import { CapTableDraftModal } from "@/components/marketplace/CapTableDraftModal";
import { LegalReviewModal } from "@/components/marketplace/LegalReviewModal";
import { AgreementSigningModal } from "@/components/marketplace/AgreementSigningModal";
import { CompanyActivationModal } from "@/components/marketplace/CompanyActivationModal";
import { PartnershipActiveModal } from "@/components/marketplace/PartnershipActiveModal";
import {
  Handshake,
  RotateCcw,
  PieChart,
  Scale,
  Building2,
  Award,
  Package,
  UsersRound,
  FileSignature,
  History,
  ChevronRight,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = params?.ideaId as string;

  const [project, setProject] = useState<MarketplaceProject | null>(null);
  const [privateProject, setPrivateProject] = useState<PrivateMarketplaceProject | null>(null);
  const [ndaStatus, setNdaStatus] = useState<NdaStatus | null>(null);
  const [deal, setDeal] = useState<EquityDeal | null>(null);
  const [isBuyoutLegalModalOpen, setIsBuyoutLegalModalOpen] = useState(false);
  const [isBuyoutSigningModalOpen, setIsBuyoutSigningModalOpen] = useState(false);
  const [isBuyoutClosingModalOpen, setIsBuyoutClosingModalOpen] = useState(false);
  const [isBuyoutHandoverModalOpen, setIsBuyoutHandoverModalOpen] = useState(false);
  const [isBuyoutSaleRecordModalOpen, setIsBuyoutSaleRecordModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCapTableModalOpen, setIsCapTableModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState(false);
  const [interestState, setInterestState] = useState<{
    hasInterest: boolean;
    interest?: ProjectInterest | null;
  }>({ hasInterest: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEquityFormOpen, setIsEquityFormOpen] = useState(false);
  const [isBuyoutFormOpen, setIsBuyoutFormOpen] = useState(false);
  const [isReviewDealModalOpen, setIsReviewDealModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "overview" | "business_plan" | "financials" | "pricing_resources" | "gtm" | "documents"
  >("overview");

  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false);
  const [selectedDealMode, setSelectedDealMode] = useState<"full_buyout" | "equity_partnership" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!ideaId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [projData, interestData, nda, dealData] = await Promise.all([
        marketplaceProjectsApi.getProjectDetail(ideaId),
        marketplaceProjectsApi.getMyInterest(ideaId),
        marketplaceProjectsApi.getNdaStatus(ideaId).catch(() => null),
        marketplaceProjectsApi.getMyDeal(ideaId).catch(() => null),
      ]);
      setProject(projData);
      setInterestState(interestData);
      setNdaStatus(nda);
      if (dealData?.deal) {
        setDeal(dealData.deal);
      }

      const projModes = projData?.dealModes || (projData?.saleType ? [projData.saleType] : []);
      const onlyBuyout = projModes.includes("full_buyout") && !projModes.includes("equity_partnership");
      const onlyEquity = projModes.includes("equity_partnership") && !projModes.includes("full_buyout");
      if (onlyBuyout) {
        setSelectedDealMode("full_buyout");
      } else if (onlyEquity) {
        setSelectedDealMode("equity_partnership");
      } else {
        setSelectedDealMode(null);
      }

      if (nda?.accessGranted) {
        try {
          const priv = await marketplaceProjectsApi.getPrivateProject(ideaId);
          if (priv) setPrivateProject(priv);
        } catch {
          // Non-critical if private project details fail to load
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Project could not be found or is private.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedDealMode(null);
    setNote("");
    setSubmitError(null);
    loadData();
  }, [ideaId]);

  const handleCreateEquityOffer = async (req: CreateEquityOfferRequest) => {
    if (!ideaId) return;
    const newDeal = await marketplaceProjectsApi.createEquityOffer(ideaId, req);
    setDeal(newDeal);
    await loadData(true);
  };

  const handleCreateBuyoutOffer = async (req: CreateBuyoutOfferRequest) => {
    if (!ideaId) return;
    const newDeal = await marketplaceProjectsApi.createBuyoutOffer(ideaId, req);
    setDeal(newDeal);
    await loadData(true);
  };

  const handleCounterOffer = async (req: CounterEquityOfferRequest) => {
    if (!deal?.id) return;
    const updated = await marketplaceProjectsApi.counterOffer(deal.id, req);
    setDeal(updated);
  };

  const handleCounterBuyoutOffer = async (req: CounterBuyoutOfferRequest) => {
    if (!deal?.id) return;
    const updated = await marketplaceProjectsApi.counterBuyoutOffer(deal.id, req);
    setDeal(updated);
  };

  const handleAcceptOffer = async () => {
    if (!deal?.id) return;
    const updated = await marketplaceProjectsApi.acceptOffer(deal.id);
    setDeal(updated);
  };

  const handleRejectOffer = async () => {
    if (!deal?.id) return;
    const updated = await marketplaceProjectsApi.rejectOffer(deal.id);
    setDeal(updated);
  };

  const handleExpressInterest = async () => {
    if (!ideaId) return;
    const effectiveMode = (hasBuyout && !hasEquity)
      ? "full_buyout"
      : (hasEquity && !hasBuyout)
      ? "equity_partnership"
      : selectedDealMode;

    if (!effectiveMode) {
      setSubmitError("Please select a deal type before expressing interest.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await marketplaceProjectsApi.expressInterest(ideaId, note, effectiveMode);
      setInterestState({ hasInterest: true, interest: res });
      setNote("");
      // Refresh NDA status
      const updatedNda = await marketplaceProjectsApi.getNdaStatus(ideaId).catch(() => null);
      if (updatedNda) setNdaStatus(updatedNda);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSubmitError(
        e.response?.data?.message ?? "Could not send interest inquiry. Please try again."
      );
      marketplaceProjectsApi.getProjectDetail(ideaId).then(setProject).catch(() => null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignNda = async (confirmationText?: string) => {
    if (!ideaId) return;
    const signResult = await marketplaceProjectsApi.signNda(ideaId, confirmationText);
    const freshStatus = await marketplaceProjectsApi.getNdaStatus(ideaId).catch(() => null);
    if (freshStatus) {
      setNdaStatus(freshStatus);
      if (freshStatus.accessGranted) {
        const priv = await marketplaceProjectsApi.getPrivateProject(ideaId).catch(() => null);
        if (priv) setPrivateProject(priv);
      }
    } else if (signResult?.accessGranted) {
      setNdaStatus((prev) =>
        prev
          ? { ...prev, ndaSigned: true, accessGranted: true, ndaSignedAt: signResult.signedAt }
          : {
              ideaId,
              projectName: project?.projectName ?? "",
              creatorName: project?.creatorName ?? "",
              entrepreneurName: "",
              interestId: interestState.interest?.id ?? "",
              interestStatus: "accepted",
              ndaRequired: true,
              ndaSigned: true,
              ndaSignedAt: signResult.signedAt,
              ndaVersion: "1.0",
              accessGranted: true,
            }
      );
      const priv = await marketplaceProjectsApi.getPrivateProject(ideaId).catch(() => null);
      if (priv) setPrivateProject(priv);
    }
    await loadData(true);
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      setDownloadingDocId(documentId);
      const blob = await marketplaceProjectsApi.downloadDocument(ideaId, documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "project-document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: unknown) {
      console.error("Failed to download document", err);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const fmt = (n: number) => `€${Math.round(n).toLocaleString()}`;

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Discovery
          </Button>
          <Card className="p-8 text-center space-y-3 rounded-2xl border-destructive/20 bg-destructive/5">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <h2 className="text-lg font-bold">Project Unavailable</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  const hasBuyout = Boolean(project.dealModes?.includes("full_buyout") || project.saleType === "full_buyout");
  const hasEquity = Boolean(project.dealModes?.includes("equity_partnership") || project.saleType === "equity_partnership");
  const isDualMode = hasBuyout && hasEquity;
  const effectiveSelectedDealMode: "full_buyout" | "equity_partnership" | null = isDualMode
    ? selectedDealMode
    : hasBuyout
    ? "full_buyout"
    : hasEquity
    ? "equity_partnership"
    : null;
  const currentInterest = interestState.interest;
  const isAccepted = currentInterest?.status === "accepted";
  const isAccessGranted = Boolean(ndaStatus?.accessGranted || privateProject);
  const isSold = Boolean(
    project.status === "closed" ||
    deal?.dealStage === "SOLD" ||
    deal?.dealStage === "BUYOUT_COMPLETED" ||
    (project as { outcome?: string }).outcome === "SOLD"
  );

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation back */}
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard/entrepreneur/discover">
              <ArrowLeft className="h-4 w-4" /> Back to Discovery
            </Link>
          </Button>
        </div>

        {/* Hero Card */}
        <Card className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold border-primary/30 bg-primary/10 text-primary">
                {project.sector || "General"}
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                Stage: {project.stage}
              </Badge>
            </div>

            {isAccessGranted ? (
              <Badge variant="outline" className="gap-1.5 text-xs font-medium text-success-strong border-success-strong/30 bg-success-light">
                <FileCheck className="h-3.5 w-3.5" /> Scoped Private Access Granted
              </Badge>
            ) : project.ndaRequired ? (
              <Badge variant="outline" className="gap-1 text-xs text-warning border-warning/30 bg-warning/10">
                <ShieldCheck className="h-3.5 w-3.5" /> NDA Required for Private Data
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                Standard Discovery
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{project.projectName}</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {project.tagline || project.solution}
            </p>
          </div>

          {/* Deal Modes Summary Strip */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Available For:
              </span>
              {hasBuyout && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  Full Buyout
                </Badge>
              )}
              {hasEquity && (
                <Badge className="bg-success-light text-success-strong border-success-strong/20 text-xs">
                  Co-founder / Equity
                </Badge>
              )}
            </div>

            {hasBuyout && project.askingPrice != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Asking Price:</span>
                <span className="text-lg font-black text-foreground">{fmt(project.askingPrice)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* NDA Review Callout Banner (when interest is accepted & NDA required & not yet signed & not sold) */}
        {isAccepted && project.ndaRequired && !isAccessGranted && !isSold && (
          <Card className="p-5 rounded-2xl border-warning/30 bg-warning/5 dark:bg-warning/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-warning/20 text-warning flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground">
                  Sign NDA to Unlock Private Project Materials
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your inquiry was accepted by the creator. Review and sign the standard confidentiality agreement to view the business plan, financials, pricing, and project documents.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                if (!ndaStatus && ideaId) {
                  marketplaceProjectsApi.getNdaStatus(ideaId).then(setNdaStatus).catch(() => {});
                }
                setIsNdaModalOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 whitespace-nowrap shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" /> Review & Sign NDA
            </Button>
          </Card>
        )}

        {/* Unlocked Navigation Tabs (when private access is active) */}
        {isAccessGranted && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border text-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-2 font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Overview & Public
            </button>
            <button
              onClick={() => setActiveTab("business_plan")}
              className={`px-3.5 py-2 font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "business_plan"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Business Plan
            </button>
            <button
              onClick={() => setActiveTab("financials")}
              className={`px-3.5 py-2 font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "financials"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Financial Forecast
            </button>
            <button
              onClick={() => setActiveTab("pricing_resources")}
              className={`px-3.5 py-2 font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "pricing_resources"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Pricing & Resources
            </button>
            <button
              onClick={() => setActiveTab("gtm")}
              className={`px-3.5 py-2 font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "gtm"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Go-To-Market
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-3.5 py-2 font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "documents"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Download className="w-3.5 h-3.5" /> Documents ({privateProject?.documents?.length || 0})
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.8fr)] gap-6 items-start">
          {/* Left Column (Content according to active tab) */}
          <div className="min-w-0 space-y-4">
            {activeTab === "overview" && (
              <>
                {/* Problem & User */}
                <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Target className="h-4 w-4 text-primary" /> Target Audience & Problem
                  </div>

                  {project.targetUser && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Target User
                      </span>
                      <p className="text-sm text-foreground">{project.targetUser}</p>
                    </div>
                  )}

                  {project.problem && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Problem Statement
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">{project.problem}</p>
                    </div>
                  )}
                </Card>

                {/* Solution Summary */}
                <Card className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Lightbulb className="h-4 w-4 text-primary" /> Proposed Solution
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.solution || "No detailed solution summary provided."}
                  </p>
                </Card>

                {/* Signals & Readiness */}
                <Card className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Sparkles className="h-4 w-4 text-primary" /> Validation Signals
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="rounded-xl border border-border p-3.5 bg-background">
                      <div className="text-xs text-muted-foreground">Clarity Score</div>
                      <div className="text-xl font-bold mt-0.5">{project.clarityScore}/100</div>
                    </div>
                    <div className="rounded-xl border border-border p-3.5 bg-background">
                      <div className="text-xs text-muted-foreground">Investor Readiness</div>
                      <div className="text-xl font-bold mt-0.5">{project.readinessScore}/100</div>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* TAB: Business Plan */}
            {activeTab === "business_plan" && privateProject && (
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-3">
                  <FileText className="h-4 w-4 text-primary" /> Business Plan Summary
                </div>

                <div className="space-y-4 text-sm">
                  {privateProject.businessPlan.executiveSummary && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Executive Summary
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {privateProject.businessPlan.executiveSummary}
                      </p>
                    </div>
                  )}

                  {privateProject.businessPlan.marketOpportunity && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Target Market & Opportunity
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {privateProject.businessPlan.marketOpportunity}
                      </p>
                    </div>
                  )}

                  {privateProject.businessPlan.competitiveAdvantage && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Competitive Advantage & Founder Edge
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {privateProject.businessPlan.competitiveAdvantage}
                      </p>
                    </div>
                  )}

                  {privateProject.businessPlan.revenueModel && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Monetization Strategy
                      </h4>
                      <p className="text-muted-foreground leading-relaxed capitalize">
                        Model: {privateProject.businessPlan.revenueModel}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* TAB: Financial Forecast */}
            {activeTab === "financials" && privateProject && (
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-3">
                  <TrendingUp className="h-4 w-4 text-primary" /> Financial Forecast & Unit Economics
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                  {privateProject.financialForecast.tam != null && (
                    <div className="p-3.5 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground">Total Addressable Market</div>
                      <div className="text-lg font-bold mt-1">
                        {fmt(privateProject.financialForecast.tam)}
                      </div>
                    </div>
                  )}

                  {privateProject.financialForecast.projectedArr != null && (
                    <div className="p-3.5 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground">Projected Annual Revenue</div>
                      <div className="text-lg font-bold mt-1 text-emerald-500">
                        {fmt(privateProject.financialForecast.projectedArr)}
                      </div>
                    </div>
                  )}

                  {privateProject.financialForecast.monthlyGrowthPct != null && (
                    <div className="p-3.5 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground">Est. Monthly Growth</div>
                      <div className="text-lg font-bold mt-1">
                        +{privateProject.financialForecast.monthlyGrowthPct}%
                      </div>
                    </div>
                  )}

                  {privateProject.financialForecast.breakEvenMonth != null && (
                    <div className="p-3.5 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground">Break-Even Milestone</div>
                      <div className="text-lg font-bold mt-1">
                        Month {privateProject.financialForecast.breakEvenMonth}
                      </div>
                    </div>
                  )}

                  {privateProject.financialForecast.arpu != null && (
                    <div className="p-3.5 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground">Avg. Revenue Per User</div>
                      <div className="text-lg font-bold mt-1">
                        {fmt(privateProject.financialForecast.arpu)}
                      </div>
                    </div>
                  )}

                  {privateProject.financialForecast.estimatedRunwayMonths != null && (
                    <div className="p-3.5 rounded-xl border border-border bg-background">
                      <div className="text-xs text-muted-foreground">Estimated Runway</div>
                      <div className="text-lg font-bold mt-1">
                        {privateProject.financialForecast.estimatedRunwayMonths} months
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* TAB: Pricing & Resources */}
            {activeTab === "pricing_resources" && privateProject && (
              <div className="space-y-4">
                {/* Pricing Tiers */}
                <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <CreditCard className="h-4 w-4 text-primary" /> Pricing Strategy
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {privateProject.pricing.pricingModel || "Tiered"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {privateProject.pricing.tiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${
                          tier.isHighlighted
                            ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                            : "border-border bg-background"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm">{tier.name}</h4>
                          {tier.isHighlighted && (
                            <Badge className="text-[10px] bg-primary text-primary-foreground">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="text-xl font-black mt-2">
                          {fmt(tier.price)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{tier.billingCycle || "mo"}
                          </span>
                        </div>
                        {tier.features?.length > 0 && (
                          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                            {tier.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Resource Plan */}
                <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-3">
                    <Users className="h-4 w-4 text-primary" /> Launch Budget & Roles Needed
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {privateProject.resourcePlan.launchBudgetMin != null && (
                      <div className="p-3 rounded-xl border border-border bg-background">
                        <div className="text-xs text-muted-foreground">Launch Budget Range</div>
                        <div className="text-sm font-bold mt-1">
                          {fmt(privateProject.resourcePlan.launchBudgetMin)} –{" "}
                          {fmt(privateProject.resourcePlan.launchBudgetMax || 0)}
                        </div>
                      </div>
                    )}

                    {privateProject.resourcePlan.monthlyRunningCost != null && (
                      <div className="p-3 rounded-xl border border-border bg-background">
                        <div className="text-xs text-muted-foreground">Est. Monthly Burn</div>
                        <div className="text-sm font-bold mt-1">
                          {fmt(privateProject.resourcePlan.monthlyRunningCost)}/mo
                        </div>
                      </div>
                    )}

                    {privateProject.resourcePlan.timeToLaunchWeeksMin != null && (
                      <div className="p-3 rounded-xl border border-border bg-background">
                        <div className="text-xs text-muted-foreground">Time to Launch</div>
                        <div className="text-sm font-bold mt-1">
                          {privateProject.resourcePlan.timeToLaunchWeeksMin} –{" "}
                          {privateProject.resourcePlan.timeToLaunchWeeksMax} wks
                        </div>
                      </div>
                    )}
                  </div>

                  {privateProject.resourcePlan.teamRolesNeeded?.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Key Team Roles Required
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {privateProject.resourcePlan.teamRolesNeeded.map((role, rIdx) => (
                          <Badge key={rIdx} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* TAB: Go-To-Market */}
            {activeTab === "gtm" && privateProject && (
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-3">
                  <Compass className="h-4 w-4 text-primary" /> Go-To-Market Plan
                </div>

                {privateProject.gtmPlan.targetAudiences?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Target Audience Segments
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {privateProject.gtmPlan.targetAudiences.map((aud, aIdx) => (
                        <Badge key={aIdx} variant="outline" className="text-xs">
                          {aud}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {privateProject.gtmPlan.primaryChannels?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Primary Acquisition Channels
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {privateProject.gtmPlan.primaryChannels.map((chan, cIdx) => (
                        <Badge key={cIdx} className="bg-primary/10 text-primary border-primary/20 text-xs">
                          {chan}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* TAB: Documents */}
            {activeTab === "documents" && privateProject && (
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-3">
                  <Download className="h-4 w-4 text-primary" /> Approved Project Documents
                </div>

                {privateProject.documents?.length > 0 ? (
                  <div className="space-y-3">
                    {privateProject.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">{doc.title || doc.fileName}</div>
                            <div className="text-xs text-muted-foreground">
                              {doc.documentType} · {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB · Added {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                          disabled={downloadingDocId === doc.id}
                          className="gap-1.5 text-xs font-semibold"
                        >
                          {downloadingDocId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-xl">
                    No approved document attachments have been published for this project.
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right: Express Interest & Status Action Card */}
          <div className="min-w-0 space-y-4">
            <Card data-testid="connect-creator-card" className="rounded-2xl border border-border bg-card p-6 space-y-4 sticky top-6">
              <div>
                <div className="text-base font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Connect with Creator
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Express interest to open direct communication and explore acquisition or co-founder terms.
                </p>
              </div>

              {/* Status handling */}
              {interestState.hasInterest && currentInterest ? (
                (() => {
                  const getInterestDealMode = (): "full_buyout" | "equity_partnership" => {
                    if (deal?.dealType === "FULL_BUYOUT") return "full_buyout";
                    if (deal?.dealType === "EQUITY_PARTNERSHIP") return "equity_partnership";
                    if (currentInterest?.dealMode === "full_buyout") return "full_buyout";
                    if (currentInterest?.dealMode === "equity_partnership") return "equity_partnership";
                    if (currentInterest?.dealModes?.includes("full_buyout") && !currentInterest?.dealModes?.includes("equity_partnership")) return "full_buyout";
                    if (currentInterest?.dealModes?.includes("equity_partnership") && !currentInterest?.dealModes?.includes("full_buyout")) return "equity_partnership";
                    if (hasBuyout && !hasEquity) return "full_buyout";
                    return "equity_partnership";
                  };

                  const interestDealMode = getInterestDealMode();
                  const isBuyoutInquiry = interestDealMode === "full_buyout";
                  const dealModeLabel = isBuyoutInquiry ? "Full Buyout" : "Co-founder / Equity";

                  return (
                    <div className="space-y-3">
                      {currentInterest.status === "pending" && (
                        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-warning" />
                              <div>
                                <div className="text-xs font-bold text-foreground">
                                  Interest Status: Pending
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  Sent {new Date(currentInterest.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-semibold bg-warning/10 text-warning border-warning/30">
                              Pending
                            </Badge>
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Inquiry Type:</span>
                            <span className="font-semibold text-foreground">{dealModeLabel}</span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Your inquiry has been sent to the Creator. You will be notified when they accept.
                          </p>
                        </div>
                      )}

                      {currentInterest.status === "accepted" && (
                        <div className="rounded-xl border border-success-strong/30 bg-success-light/10 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-success-strong" />
                              <div>
                                <div className="text-xs font-bold text-foreground">
                                  Interest Status: Accepted
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  Sent {new Date(currentInterest.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-semibold bg-success-light text-success-strong border-success-strong/30">
                              Accepted
                            </Badge>
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Accepted Deal Type:</span>
                            <span className="font-semibold text-foreground">{dealModeLabel}</span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {isBuyoutInquiry
                              ? "The creator accepted your Full Buyout inquiry. You can now continue the acquisition discussion and use the direct messenger."
                              : "The creator accepted your Co-founder / Equity inquiry. You can now continue the partnership discussion and use the direct messenger."}
                          </p>

                          <Button asChild variant="outline" className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 bg-background border-border text-foreground hover:bg-muted">
                            <Link href={currentInterest.conversationId ? `/dashboard/entrepreneur/messages?conversationId=${currentInterest.conversationId}` : "/dashboard/entrepreneur/messages"}>
                              <MessageSquare className="h-4 w-4 shrink-0" />
                              <span>Open Messenger</span>
                            </Link>
                          </Button>

                          {/* NDA Required Gate (when interest is accepted & NDA required & not yet signed & not sold) */}
                          {project.ndaRequired && !isAccessGranted && !isSold && (
                            <div className="pt-3 border-t border-border space-y-2.5">
                              <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold font-heading text-foreground flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                                    NDA Required
                                  </span>
                                  <Badge variant="outline" className="text-[10px] font-semibold bg-warning/10 text-warning border-warning/30">
                                    Pending
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  The Creator requires a confidentiality agreement before private project materials and acquisition offers can proceed.
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    if (!ndaStatus && ideaId) {
                                      marketplaceProjectsApi.getNdaStatus(ideaId).then(setNdaStatus).catch(() => {});
                                    }
                                    setIsNdaModalOpen(true);
                                  }}
                                  className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                >
                                  <ShieldCheck className="h-4 w-4 shrink-0" />
                                  <span>Review & Sign NDA</span>
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* NDA Status: Signed / Active (when NDA required and access granted) */}
                          {project.ndaRequired && isAccessGranted && (
                            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-success-strong" /> NDA Status:
                              </span>
                              <Badge variant="outline" className="text-[10px] font-semibold bg-success-light text-success-strong border-success-strong/30">
                                Signed
                              </Badge>
                            </div>
                          )}

                          {/* Deal Negotiation Section */}
                          {isAccessGranted && !isSold && (
                            <div className="pt-3 border-t border-border space-y-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Deal Negotiation
                              </span>

                              {deal ? (
                                deal.dealType === "FULL_BUYOUT" ? (
                                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                                        Full Buyout Offer V{deal.currentRevisionNumber}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] uppercase font-semibold ${
                                          deal.dealStage === "ROLES_PENDING" || deal.status === "completed"
                                            ? "text-success-strong border-success-strong/30 bg-success-light"
                                            : deal.dealStage === "REJECTED"
                                            ? "text-destructive border-destructive/30 bg-destructive/10"
                                            : "text-primary border-primary/30 bg-primary/10"
                                        }`}
                                      >
                                        {deal.dealStage === "ROLES_PENDING" ? "Accepted" : deal.dealStage.replace("_", " ")}
                                      </Badge>
                                    </div>

                                    <div className="text-[11px] text-muted-foreground">
                                      Purchase Price: <strong className="text-foreground">{deal.buyoutTerms ? fmt(deal.buyoutTerms.purchasePrice) : "—"}</strong> · Handover: <strong className="text-foreground">{deal.buyoutTerms?.handoverPeriodWeeks ?? 2} weeks</strong>
                                    </div>

                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                      Offer submitted to creator. You will receive notifications when the creator responds or initiates closing steps.
                                    </p>

                                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-1">
                                      {(deal.dealStage === "BUYOUT_TERMS_ACCEPTED" || deal.dealStage === "BUYOUT_SIGNATURE_PENDING") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsBuyoutLegalModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <Scale className="h-4 w-4 shrink-0" />
                                          <span>Legal & Asset Transfer Review</span>
                                        </Button>
                                      )}

                                      {(deal.dealStage === "BUYOUT_SIGNATURE_PENDING" || deal.dealStage === "BUYOUT_CLOSING_PENDING") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsBuyoutSigningModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <FileCheck className="h-4 w-4 shrink-0" />
                                          <span>Agreement Signing</span>
                                        </Button>
                                      )}

                                      {(deal.dealStage === "BUYOUT_CLOSING_PENDING" || deal.dealStage === "BUYOUT_HANDOVER_PENDING") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsBuyoutClosingModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <CreditCard className="h-4 w-4 shrink-0" />
                                          <span>Closing & Payment</span>
                                        </Button>
                                      )}

                                      {(deal.dealStage === "BUYOUT_HANDOVER_PENDING" || deal.dealStage === "SOLD" || deal.dealStage === "BUYOUT_COMPLETED") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsBuyoutHandoverModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <Package className="h-4 w-4 shrink-0" />
                                          <span>Asset Handover</span>
                                        </Button>
                                      )}

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsReviewDealModalOpen(true)}
                                        className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2"
                                      >
                                        <Handshake className="h-4 w-4 shrink-0" />
                                        <span>
                                          {deal.dealStage === "BUYOUT_TERMS_ACCEPTED" || deal.dealStage === "BUYOUT_SIGNATURE_PENDING" || deal.dealStage === "BUYOUT_CLOSING_PENDING" || deal.dealStage === "BUYOUT_HANDOVER_PENDING" || deal.dealStage === "SOLD"
                                            ? "Agreed Buyout Terms 🔒"
                                            : `Review Buyout Offer (V${deal.currentRevisionNumber})`}
                                        </span>
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Handshake className="h-3.5 w-3.5 text-primary" />
                                        Equity Offer V{deal.currentRevisionNumber}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] uppercase font-semibold ${
                                          deal.dealStage === "ROLES_PENDING"
                                            ? "text-success-strong border-success-strong/30 bg-success-light"
                                            : deal.dealStage === "REJECTED"
                                            ? "text-destructive border-destructive/30 bg-destructive/10"
                                            : "text-primary border-primary/30 bg-primary/10"
                                        }`}
                                      >
                                        {deal.dealStage === "ROLES_PENDING" ? "Accepted" : deal.dealStage.replace("_", " ")}
                                      </Badge>
                                    </div>

                                    <div className="text-[11px] text-muted-foreground">
                                      Creator Stake: <strong className="text-foreground">{deal.activeTerms.equityPercentage}%</strong> ·{" "}
                                      Role: <strong className="text-foreground">{deal.activeTerms.creatorRole}</strong>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-1">
                                      {(deal.dealStage === "ROLES_PENDING" || deal.dealStage === "CAP_TABLE_PENDING" || deal.dealStage === "LEGAL_REVIEW_PENDING") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsRoleModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <Users className="h-4 w-4 shrink-0" />
                                          <span>Role & Responsibility Agreement</span>
                                        </Button>
                                      )}

                                      {(deal.dealStage === "CAP_TABLE_PENDING" || deal.dealStage === "LEGAL_REVIEW_PENDING" || deal.dealStage === "SIGNATURE_PENDING") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsCapTableModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <PieChart className="h-4 w-4 shrink-0" />
                                          <span>Equity & Cap Table Structure</span>
                                        </Button>
                                      )}

                                      {(deal.dealStage === "LEGAL_REVIEW_PENDING" || deal.dealStage === "SIGNATURE_PENDING" || deal.dealStage === "ACTIVATION_PENDING") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsLegalModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <Scale className="h-4 w-4 shrink-0" />
                                          <span>Legal & Shareholder Review</span>
                                        </Button>
                                      )}

                                      {(deal.dealStage === "SIGNATURE_PENDING" || deal.dealStage === "ACTIVATION_PENDING") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsSigningModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <FileCheck className="h-4 w-4 shrink-0" />
                                          <span>Final Agreement Signing</span>
                                        </Button>
                                      )}

                                      {(deal.dealStage === "ACTIVATION_PENDING" || deal.dealStage === "PARTNERSHIP_ACTIVE") && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsActivationModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <Building2 className="h-4 w-4 shrink-0" />
                                          <span>Company & Project Activation</span>
                                        </Button>
                                      )}

                                      {deal.dealStage === "PARTNERSHIP_ACTIVE" && (
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setIsPartnershipModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                        >
                                          <Award className="h-4 w-4 shrink-0" />
                                          <span>Active Partnership & Workspace</span>
                                        </Button>
                                      )}

                                      {deal.dealType === "FULL_BUYOUT" ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setIsReviewDealModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2"
                                        >
                                          <DollarSign className="h-4 w-4 shrink-0" />
                                          <span>
                                            {deal.dealStage === "BUYOUT_TERMS_ACCEPTED"
                                              ? `Buyout Terms Agreed (V${deal.acceptedRevisionNumber ?? deal.currentRevisionNumber})`
                                              : `Review Buyout Offer & History (V${deal.currentRevisionNumber})`}
                                          </span>
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setIsReviewDealModalOpen(true)}
                                          className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2"
                                        >
                                          <Handshake className="h-4 w-4 shrink-0" />
                                          <span>Review Offer & History</span>
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )
                              ) : (
                                /* No Deal created yet — Show ONLY the offer CTA for accepted inquiry mode */
                                <div className="space-y-3">
                                  {isBuyoutInquiry ? (
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <DollarSign className="h-3.5 w-3.5 text-primary" /> Propose Full Buyout Acquisition
                                      </div>
                                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Make a direct acquisition offer to purchase 100% ownership and all IP assets for this project.
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => setIsBuyoutFormOpen(true)}
                                        className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                      >
                                        <DollarSign className="h-4 w-4 shrink-0" />
                                        <span>Send Buyout Offer</span>
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Handshake className="h-3.5 w-3.5 text-primary" /> Propose Co-founder Partnership
                                      </div>
                                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Formulate an equity percentage, creator role, vesting terms, and time commitment.
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => setIsEquityFormOpen(true)}
                                        className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2 shadow-sm"
                                      >
                                        <Handshake className="h-4 w-4 shrink-0" />
                                        <span>Send Equity Offer</span>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {currentInterest.status === "declined" && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              <div>
                                <div className="text-xs font-bold text-foreground">
                                  Interest Status: Declined
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  Sent {new Date(currentInterest.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-semibold bg-destructive/10 text-destructive border-destructive/30">
                              Declined
                            </Badge>
                          </div>

                          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Inquiry Type:</span>
                            <span className="font-semibold text-foreground">{dealModeLabel}</span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            The creator is currently not pursuing discussions for this inquiry.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-4">
                  {/* Single Mode: Full Buyout only */}
                  {!isDualMode && hasBuyout && (
                    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Available For</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          Full Buyout
                        </Badge>
                      </div>
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Selected Deal Type:</span>
                        <span className="font-semibold text-foreground">Full Buyout</span>
                      </div>
                    </div>
                  )}

                  {/* Single Mode: Equity only */}
                  {!isDualMode && hasEquity && (
                    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Available For</span>
                        <Badge className="bg-success-light text-success-strong border-success-strong/20 text-xs">
                          Co-founder / Equity
                        </Badge>
                      </div>
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Selected Deal Type:</span>
                        <span className="font-semibold text-foreground">Co-founder / Equity</span>
                      </div>
                    </div>
                  )}

                  {/* Multi-Mode: Both Full Buyout & Equity available */}
                  {isDualMode && (
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Available For
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Select the deal type you wish to explore with this creator:
                        </p>
                      </div>

                      <div
                        role="radiogroup"
                        aria-label="Select deal type"
                        className="grid grid-cols-1 gap-2.5"
                      >
                        {/* Full Buyout Option Card */}
                        <div
                          role="radio"
                          aria-checked={selectedDealMode === "full_buyout"}
                          tabIndex={0}
                          onClick={() => setSelectedDealMode("full_buyout")}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              setSelectedDealMode("full_buyout");
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            selectedDealMode === "full_buyout"
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                                  selectedDealMode === "full_buyout"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/40 bg-background"
                                }`}
                              >
                                {selectedDealMode === "full_buyout" && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <span
                                className={`text-xs font-bold ${
                                  selectedDealMode === "full_buyout" ? "text-primary" : "text-foreground"
                                }`}
                              >
                                Full Buyout
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                              100% Acquisition
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1.5 pl-6 leading-relaxed">
                            Acquire the project and its agreed included assets through a complete purchase.
                          </p>
                        </div>

                        {/* Co-founder / Equity Option Card */}
                        <div
                          role="radio"
                          aria-checked={selectedDealMode === "equity_partnership"}
                          tabIndex={0}
                          onClick={() => setSelectedDealMode("equity_partnership")}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              setSelectedDealMode("equity_partnership");
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            selectedDealMode === "equity_partnership"
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                                  selectedDealMode === "equity_partnership"
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/40 bg-background"
                                }`}
                              >
                                {selectedDealMode === "equity_partnership" && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </div>
                              <span
                                className={`text-xs font-bold ${
                                  selectedDealMode === "equity_partnership" ? "text-primary" : "text-foreground"
                                }`}
                              >
                                Co-founder / Equity
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-success-light text-success-strong border-success-strong/20">
                              Partnership
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1.5 pl-6 leading-relaxed">
                            Partner with the Creator and negotiate an equity-based co-founder relationship.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Message to Creator (optional)
                    </label>
                    <Textarea
                      placeholder="Tell the Creator why you're interested or what you'd like to discuss..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="text-xs bg-background resize-none"
                    />
                  </div>

                  {/* Confirmation or Helper text */}
                  {isDualMode && (
                    <div>
                      {selectedDealMode === "full_buyout" && (
                        <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          You&apos;re expressing interest in a Full Buyout acquisition.
                        </p>
                      )}
                      {selectedDealMode === "equity_partnership" && (
                        <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          You&apos;re expressing interest in a Co-founder / Equity partnership.
                        </p>
                      )}
                      {!selectedDealMode && (
                        <p className="text-xs text-muted-foreground">
                          Choose how you&apos;d like to work with this Creator.
                        </p>
                      )}
                    </div>
                  )}

                  {submitError && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleExpressInterest}
                    disabled={!effectiveSelectedDealMode || submitting}
                    className="w-full sm:w-auto h-auto min-h-10 px-3 py-2 text-sm font-semibold font-sans whitespace-normal text-center leading-snug inline-flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : (
                      <Send className="h-4 w-4 shrink-0" />
                    )}
                    <span>Express Interest</span>
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* NDA Review Modal */}
      <NdaReviewModal
        isOpen={isNdaModalOpen}
        onClose={() => setIsNdaModalOpen(false)}
        ndaStatus={
          ndaStatus ||
          (project
            ? {
                ideaId: project.ideaId,
                projectName: project.projectName,
                creatorName: "Creator",
                entrepreneurName: "Entrepreneur",
                interestId: currentInterest?.id || "",
                interestStatus: currentInterest?.status || "accepted",
                ndaRequired: project.ndaRequired,
                ndaSigned: false,
                ndaVersion: "1.0",
                accessGranted: false,
              }
            : null)
        }
        projectName={project?.projectName}
        onSign={handleSignNda}
      />

      {/* Equity Offer Form Modal */}
      {isEquityFormOpen && (
        <EquityOfferForm
          isOpen={isEquityFormOpen}
          onClose={() => setIsEquityFormOpen(false)}
          onSubmit={handleCreateEquityOffer}
          projectName={project.projectName}
          creatorName="Creator"
          isCounter={false}
          currentRevisionNumber={1}
        />
      )}

      {/* Deal Review Modal (Buyout or Equity) */}
      {isReviewDealModalOpen && deal && (
        deal.dealType === "FULL_BUYOUT" ? (
          <BuyoutOfferReviewModal
            isOpen={isReviewDealModalOpen}
            onClose={() => setIsReviewDealModalOpen(false)}
            deal={deal}
            isCreator={false}
            askingPrice={project.askingPrice ?? undefined}
            onAccept={handleAcceptOffer}
            onCounter={handleCounterBuyoutOffer}
            onReject={handleRejectOffer}
          />
        ) : (
          <EquityOfferReviewModal
            isOpen={isReviewDealModalOpen}
            onClose={() => setIsReviewDealModalOpen(false)}
            deal={deal}
            isCreator={false}
            onAccept={handleAcceptOffer}
            onCounter={handleCounterOffer}
            onReject={handleRejectOffer}
          />
        )
      )}

      {/* Full Buyout Phase 3: Legal & Asset Transfer Review Modal */}
      {isBuyoutLegalModalOpen && deal && (
        <BuyoutLegalReviewModal
          isOpen={isBuyoutLegalModalOpen}
          onClose={() => setIsBuyoutLegalModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onPackageChanged={async () => {
            await loadData();
          }}
        />
      )}

      {/* Full Buyout Phase 4: Agreement Signing Modal */}
      {isBuyoutSigningModalOpen && deal && (
        <BuyoutAgreementSigningModal
          isOpen={isBuyoutSigningModalOpen}
          onClose={() => setIsBuyoutSigningModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onPackageChanged={async () => {
            await loadData();
          }}
          onNavigateToClosing={() => {
            setIsBuyoutSigningModalOpen(false);
            setIsBuyoutClosingModalOpen(true);
          }}
        />
      )}

      {/* Full Buyout Phase 5: Closing & Payment Modal */}
      {isBuyoutClosingModalOpen && deal && (
        <BuyoutClosingModal
          isOpen={isBuyoutClosingModalOpen}
          onClose={() => setIsBuyoutClosingModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onRefreshDeal={async () => {
            await loadData();
          }}
          onProceedToHandover={() => {
            setIsBuyoutClosingModalOpen(false);
            setIsBuyoutHandoverModalOpen(true);
          }}
        />
      )}

      {/* Full Buyout Phase 6: Handover Modal */}
      {isBuyoutHandoverModalOpen && deal && (
        <BuyoutHandoverModal
          isOpen={isBuyoutHandoverModalOpen}
          onClose={() => setIsBuyoutHandoverModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onRefreshDeal={async () => {
            await loadData();
          }}
          onViewSaleRecord={() => {
            setIsBuyoutHandoverModalOpen(false);
            setIsBuyoutSaleRecordModalOpen(true);
          }}
        />
      )}

      {/* Full Buyout Phase 6: Canonical Sale Record Modal */}
      {isBuyoutSaleRecordModalOpen && deal && (
        <BuyoutSaleRecordModal
          isOpen={isBuyoutSaleRecordModalOpen}
          onClose={() => setIsBuyoutSaleRecordModalOpen(false)}
          dealId={deal.id}
        />
      )}

      {/* Screen 02: Role & Responsibility Agreement Modal */}
      {isRoleModalOpen && deal && (
        <RoleAgreementModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onAgreementChanged={async () => {
            await loadData(true);
          }}
        />
      )}

      {/* Screen 03: Equity & Cap Table Draft Modal */}
      {isCapTableModalOpen && deal && (
        <CapTableDraftModal
          isOpen={isCapTableModalOpen}
          onClose={() => setIsCapTableModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onDraftChanged={async () => {
            await loadData(true);
          }}
        />
      )}

      {/* Screen 04: Legal & Shareholder Review Modal */}
      {isLegalModalOpen && deal && (
        <LegalReviewModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onPackageChanged={async () => {
            await loadData(true);
          }}
        />
      )}

      {/* Screen 05: Final Agreement Signing Modal */}
      {isSigningModalOpen && deal && (
        <AgreementSigningModal
          isOpen={isSigningModalOpen}
          onClose={() => setIsSigningModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onPackageChanged={async () => {
            await loadData(true);
          }}
        />
      )}

      {/* Screen 06: Company & Project Activation Modal */}
      {isActivationModalOpen && deal && (
        <CompanyActivationModal
          isOpen={isActivationModalOpen}
          onClose={() => setIsActivationModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
          onActivationComplete={async () => {
            await loadData(true);
          }}
        />
      )}

      {/* Screen 07: Active Partnership & My Equity Modal */}
      {isPartnershipModalOpen && deal && (
        <PartnershipActiveModal
          isOpen={isPartnershipModalOpen}
          onClose={() => setIsPartnershipModalOpen(false)}
          dealId={deal.id}
          isCreator={false}
        />
      )}

      {/* Full Buyout Offer Form Modal */}
      {isBuyoutFormOpen && project && (
        <BuyoutOfferForm
          isOpen={isBuyoutFormOpen}
          onClose={() => setIsBuyoutFormOpen(false)}
          onSubmit={handleCreateBuyoutOffer}
          projectName={project.projectName}
          askingPrice={project.askingPrice}
        />
      )}
    </div>
  );
}
