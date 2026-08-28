"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Loader2, Store, Check, MessageSquare, UserCheck, UserX, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  creatorJourneyApi,
  type IpValuation,
  type ProjectInterest,
} from "@/lib/api-creator-journey";
import {
  marketplaceProjectsApi,
  type EquityDeal,
  type CounterEquityOfferRequest,
  type CounterBuyoutOfferRequest,
} from "@/lib/api-marketplace-projects";
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
import { Handshake, Users, PieChart, Scale, FileCheck, Building2, Award, DollarSign, CreditCard, Package } from "lucide-react";

type ListingState = {
  askingPrice?: number | null;
  publishedAt?: string | null;
  saleType?: string | null;
  dealModes?: string[];
};

type PathAState = {
  ipValuation?: IpValuation | null;
  marketplaceListing?: ListingState | null;
};

export function CrossroadsPathA({
  ideaId,
  initial,
  selectedInterestId,
  onChanged,
}: {
  ideaId: string | null;
  initial?: Record<string, unknown>;
  selectedInterestId?: string;
  onChanged: () => void;
}) {
  const saved = initial as PathAState | undefined;
  const [valuation, setValuation] = useState<IpValuation | null>(saved?.ipValuation ?? null);
  const [valuing, setValuing] = useState(false);
  const [valError, setValError] = useState<string | null>(null);

  const initialModes = saved?.marketplaceListing?.dealModes?.length
    ? saved.marketplaceListing.dealModes
    : ["full_buyout"];

  const [dealModes, setDealModes] = useState<string[]>(initialModes);
  const [askingPrice, setAskingPrice] = useState<number>(saved?.marketplaceListing?.askingPrice ?? 0);
  const [nda, setNda] = useState(true);
  const [audience, setAudience] = useState("public");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(Boolean(saved?.marketplaceListing?.publishedAt));
  const [isEmpty, setIsEmpty] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);
  const [hydratedIdeaId, setHydratedIdeaId] = useState<string | null>(null);

  // Interests & Deal state
  const [interests, setInterests] = useState<ProjectInterest[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<EquityDeal | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isBuyoutReviewModalOpen, setIsBuyoutReviewModalOpen] = useState(false);
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

  const loadInterests = useCallback(async () => {
    try {
      setLoadingInterests(true);
      const [res, dealRes] = await Promise.all([
        creatorJourneyApi.getInterests(ideaId),
        ideaId ? marketplaceProjectsApi.getMyDeal(ideaId).catch(() => null) : null,
      ]);
      setInterests(res || []);
      if (dealRes?.deal) {
        setActiveDeal(dealRes.deal);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingInterests(false);
    }
  }, [ideaId]);

  useEffect(() => {
    if (ideaId && hydratedIdeaId !== ideaId) {
      if (initial) {
        const s = initial as PathAState;
        if (s.marketplaceListing?.askingPrice != null) {
          setAskingPrice(s.marketplaceListing.askingPrice);
        }
        if (s.ipValuation != null) {
          setValuation(s.ipValuation);
        }
        if (s.marketplaceListing?.dealModes?.length) {
          setDealModes(s.marketplaceListing.dealModes);
        }
        if (s.marketplaceListing?.publishedAt != null) {
          setPublished(Boolean(s.marketplaceListing.publishedAt));
        }
        setHydratedIdeaId(ideaId);
      } else {
        setAskingPrice(0);
        setValuation(null);
        setPublished(false);
        setDealModes(["full_buyout"]);
      }
      loadInterests();
    }
  }, [initial, ideaId, hydratedIdeaId, loadInterests]);

  useEffect(() => {
    if (selectedInterestId && interests.length > 0) {
      const el = document.getElementById(`interest-${selectedInterestId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedInterestId, interests]);

  const toggleMode = (mode: string) => {
    if (dealModes.includes(mode)) {
      if (dealModes.length > 1) {
        setDealModes(dealModes.filter((m) => m !== mode));
      }
    } else {
      setDealModes([...dealModes, mode]);
    }
  };

  const hasBuyout = dealModes.includes("full_buyout");
  const hasEquity = dealModes.includes("equity_partnership");

  const runValuation = async () => {
    setValuing(true);
    setValError(null);
    try {
      setValuation(await creatorJourneyApi.ipValuation(ideaId));
      onChanged();
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { message?: string } } };
      setValError(
        err.response?.status === 429
          ? "Daily valuation limit reached (10/day)."
          : err.response?.data?.message ?? "Couldn't compute the planning estimate."
      );
    } finally {
      setValuing(false);
    }
  };

  const publish = async () => {
    if (dealModes.length === 0) return;
    if (hasBuyout && askingPrice <= 0) return;

    setPublishing(true);
    setPubError(null);
    try {
      const res = await creatorJourneyApi.publishMarketplace(
        {
          ndaRequired: nda,
          askingPrice: hasBuyout ? askingPrice : undefined,
          audience,
          dealModes,
        },
        ideaId
      );
      setPublished(true);
      setIsEmpty(res.isEmpty);
      onChanged();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setPubError(
        err.response?.data?.message ??
          (e instanceof Error ? e.message : "Couldn't publish the marketplace listing.")
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleAccept = async (interestId: string) => {
    setActioningId(interestId);
    try {
      await creatorJourneyApi.acceptInterest(interestId);
      await loadInterests();
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (interestId: string) => {
    setActioningId(interestId);
    try {
      await creatorJourneyApi.declineInterest(interestId);
      await loadInterests();
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const fmt = (n: number) => `€${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-4">
      {/* Valuation Estimate */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" /> Planning Valuation Estimate
          </div>
          <Button variant="outline" size="sm" onClick={runValuation} disabled={valuing}>
            {valuing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh estimate"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on saved resource investment and project-readiness signals. This is not a certified business or IP valuation.
        </p>
        {valError && <p className="text-sm text-destructive">{valError}</p>}
        {valuation && (
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="text-2xl font-extrabold">
                {fmt(valuation.estimatedMin)}–{fmt(valuation.estimatedMax)}
              </div>
              <Badge variant="outline" className="capitalize">
                {valuation.confidence} confidence
              </Badge>
            </div>
            {valuation.marketOpportunityContext != null && (
              <p className="text-xs text-muted-foreground">
                Target market opportunity: {fmt(valuation.marketOpportunityContext)}. This is context only, not the valuation calculation.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Marketplace Push Listing Setup */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <Store className="h-4 w-4 text-primary" /> Marketplace Push Listing
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Publish your project to discover verified entrepreneurs for a full acquisition or active co-founder equity partnership.
          </p>
        </div>

        {/* Deal Mode Selection */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Available Deal Types
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              onClick={() => toggleMode("full_buyout")}
              className={`cursor-pointer rounded-xl border p-3 transition flex items-start gap-3 ${
                hasBuyout
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-background/50 text-muted-foreground"
              }`}
            >
              <input
                type="checkbox"
                aria-label="Full Buyout"
                checked={hasBuyout}
                onChange={() => {}}
                className="mt-0.5 rounded border-border"
              />
              <div>
                <div className="text-xs font-bold text-foreground">Full Buyout</div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Sell 100% of project IP and assets directly.
                </p>
              </div>
            </div>

            <div
              onClick={() => toggleMode("equity_partnership")}
              className={`cursor-pointer rounded-xl border p-3 transition flex items-start gap-3 ${
                hasEquity
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-background/50 text-muted-foreground"
              }`}
            >
              <input
                type="checkbox"
                aria-label="Co-founder / Equity Partnership"
                checked={hasEquity}
                onChange={() => {}}
                className="mt-0.5 rounded border-border"
              />
              <div>
                <div className="text-xs font-bold text-foreground">Co-founder / Equity</div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Partner with an entrepreneur in exchange for co-founder equity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Asking Price (if Full Buyout) */}
        {hasBuyout && (
          <label className="block text-sm">
            <span className="text-muted-foreground">Asking Price (€)</span>
            <input
              aria-label="Your asking price"
              type="number"
              min="1"
              value={askingPrice || ""}
              onChange={(e) => setAskingPrice(Number(e.target.value))}
              placeholder="e.g. 50000"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={nda}
            onChange={(e) => setNda(e.target.checked)}
          />
          Require NDA before full data room disclosure
        </label>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Audience:</span>
          {["public", "matched", "private"].map((value) => (
            <button
              key={value}
              onClick={() => setAudience(value)}
              className={`rounded-lg border px-3 py-1 text-xs capitalize ${
                audience === value
                  ? "border-primary text-primary font-medium"
                  : "border-border text-muted-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {pubError && <p className="text-sm text-destructive">{pubError}</p>}

        {published ? (
          <div className="space-y-1 pt-1">
            <div className="flex items-center gap-2 text-sm text-primary font-semibold">
              <Check className="h-4 w-4" /> Marketplace listing is published and active.
            </div>
            {isEmpty && (
              <p className="text-xs text-muted-foreground">
                No automatic buyer matches yet. Your listing is visible in discovery to verified entrepreneurs.
              </p>
            )}
          </div>
        ) : (
          <Button
            onClick={publish}
            disabled={publishing || (hasBuyout && askingPrice <= 0)}
            className="w-full sm:w-auto gap-2"
          >
            {publishing && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish to Marketplace
          </Button>
        )}
      </Card>

      {/* Incoming Inquiries / Interests */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" /> Interested Entrepreneurs
          </div>
          {loadingInterests && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>

        {interests.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No inquiries received yet. When entrepreneurs express interest in your project, they will appear here.
          </p>
        ) : (
          <div className="space-y-2.5 pt-1">
            {interests.map((interest) => {
              const isSelected = selectedInterestId === interest.id;
              const itemModes = interest.dealModes?.length
                ? interest.dealModes
                : interest.dealMode
                ? [interest.dealMode]
                : (hasBuyout && hasEquity ? ["full_buyout", "equity_partnership"] : hasBuyout ? ["full_buyout"] : ["equity_partnership"]);

              const isFullBuyout = itemModes.includes("full_buyout");
              const isEquity = itemModes.includes("equity_partnership");
              const modeLabel = isFullBuyout && isEquity
                ? "FULL BUYOUT / EQUITY"
                : isFullBuyout
                ? "FULL BUYOUT"
                : "EQUITY PARTNERSHIP";

              return (
                <div
                  key={interest.id}
                  id={`interest-${interest.id}`}
                  className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">
                        {interest.entrepreneurName}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] uppercase font-bold tracking-wider ${
                          isFullBuyout && isEquity
                            ? "bg-secondary text-secondary-foreground border-border"
                            : isFullBuyout
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-success-light text-success-strong border-success-strong/20"
                        }`}
                      >
                        {modeLabel}
                      </Badge>
                      <Badge
                        variant={
                          interest.status === "accepted"
                            ? "default"
                            : interest.status === "declined"
                            ? "secondary"
                            : "outline"
                        }
                        className={`text-[10px] uppercase font-semibold tracking-wider ${
                          interest.status === "pending"
                            ? "text-warning border-warning/30 bg-warning/10"
                            : interest.status === "accepted"
                            ? "text-success-strong border-success-strong/30 bg-success-light"
                            : interest.status === "declined"
                            ? "text-destructive border-destructive/30 bg-destructive/10"
                            : ""
                        }`}
                      >
                        {interest.status === "pending" && <Clock className="h-2.5 w-2.5 mr-1" />}
                        {interest.status}
                      </Badge>
                      {interest.status === "accepted" && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            interest.accessGranted || interest.ndaSigned
                              ? "text-success-strong border-success-strong/30 bg-success-light"
                              : interest.ndaRequired
                              ? "text-warning border-warning/30 bg-warning/10"
                              : "text-success-strong border-success-strong/30 bg-success-light"
                          }`}
                        >
                          {interest.accessGranted || interest.ndaSigned
                            ? "Private Access Active"
                            : interest.ndaRequired
                            ? "NDA Pending"
                            : "Private Access Active"}
                        </Badge>
                      )}
                    </div>
                    {interest.note && (
                      <p className="text-xs text-muted-foreground italic">"{interest.note}"</p>
                    )}
                    <div className="text-[10px] text-muted-foreground">
                      Received: {new Date(interest.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {interest.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={actioningId === interest.id}
                          onClick={() => handleAccept(interest.id)}
                          className="h-8 gap-1.5 text-xs font-semibold"
                        >
                          {actioningId === interest.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          Accept Interest
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actioningId === interest.id}
                          onClick={() => handleDecline(interest.id)}
                          className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Decline
                        </Button>
                      </>
                    )}

                    {interest.status === "accepted" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                        >
                          <Link href={interest.conversationId ? `/dashboard/creator/messages?conversationId=${interest.conversationId}` : "/dashboard/creator/messages"}>
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            Open Messenger
                          </Link>
                        </Button>
                      {activeDeal && (
                        <>
                          {activeDeal.dealType === "FULL_BUYOUT" ? (
                            <>
                              {(activeDeal.dealStage === "BUYOUT_LEGAL_REVIEW_PENDING" || activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsBuyoutLegalModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <Scale className="h-3.5 w-3.5" />
                                  Legal & Transfer Review
                                </Button>
                              )}
                              {(activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING" || activeDeal.dealStage === "BUYOUT_CLOSING_PENDING") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsBuyoutSigningModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                  Agreement Signing
                                </Button>
                              )}
                              {(activeDeal.dealStage === "BUYOUT_CLOSING_PENDING" || activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsBuyoutClosingModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Closing & Payment
                                </Button>
                              )}
                              {(activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING" || activeDeal.dealStage === "SOLD" || activeDeal.dealStage === "BUYOUT_COMPLETED") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsBuyoutHandoverModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <Package className="h-3.5 w-3.5" />
                                  Asset Handover
                                </Button>
                              )}
                              {(activeDeal.dealStage === "SOLD" || activeDeal.dealStage === "BUYOUT_COMPLETED") && (
                                <Button
                                  size="sm"
                                  onClick={() => setIsBuyoutSaleRecordModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-bold bg-success-strong hover:bg-success-strong/90 text-white shadow-sm"
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                  View Sale Record
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsBuyoutReviewModalOpen(true)}
                                className="h-8 gap-1.5 text-xs font-semibold"
                              >
                                <Handshake className="h-3.5 w-3.5" />
                                {activeDeal.dealStage === "BUYOUT_TERMS_ACCEPTED" || activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING" || activeDeal.dealStage === "BUYOUT_CLOSING_PENDING" || activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING" || activeDeal.dealStage === "SOLD"
                                  ? "Agreed Buyout Terms 🔒"
                                  : `Review Buyout Offer (V${activeDeal.currentRevisionNumber})`}
                              </Button>
                            </>
                          ) : (
                            <>
                              {(activeDeal.dealStage === "ROLES_PENDING" || activeDeal.dealStage === "CAP_TABLE_PENDING" || activeDeal.dealStage === "LEGAL_REVIEW_PENDING") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsRoleModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <Users className="h-3.5 w-3.5" />
                                  Screen 02 Roles
                                </Button>
                              )}
                              {(activeDeal.dealStage === "CAP_TABLE_PENDING" || activeDeal.dealStage === "LEGAL_REVIEW_PENDING" || activeDeal.dealStage === "SIGNATURE_PENDING") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsCapTableModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <PieChart className="h-3.5 w-3.5" />
                                  Screen 03 Equity
                                </Button>
                              )}
                              {(activeDeal.dealStage === "LEGAL_REVIEW_PENDING" || activeDeal.dealStage === "SIGNATURE_PENDING" || activeDeal.dealStage === "ACTIVATION_PENDING") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsLegalModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <Scale className="h-3.5 w-3.5" />
                                  Screen 04 Legal Review
                                </Button>
                              )}
                              {(activeDeal.dealStage === "SIGNATURE_PENDING" || activeDeal.dealStage === "ACTIVATION_PENDING") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsSigningModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <FileCheck className="h-3.5 w-3.5" />
                                  Screen 05 Agreement Signing
                                </Button>
                              )}
                              {(activeDeal.dealStage === "ACTIVATION_PENDING" || activeDeal.dealStage === "PARTNERSHIP_ACTIVE") && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsActivationModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <Building2 className="h-3.5 w-3.5" />
                                  Screen 06 Company Activation
                                </Button>
                              )}
                              {activeDeal.dealStage === "PARTNERSHIP_ACTIVE" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setIsPartnershipModalOpen(true)}
                                  className="h-8 gap-1.5 text-xs font-semibold"
                                >
                                  <Award className="h-3.5 w-3.5" />
                                  Screen 07 Partnership Active
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsReviewModalOpen(true)}
                                className="h-8 gap-1.5 text-xs font-semibold"
                              >
                                <Handshake className="h-3.5 w-3.5" />
                                Offer (V{activeDeal.currentRevisionNumber})
                              </Button>
                            </>
                          )}
                        </>
                      )}

                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Full Buyout Phase 3: Legal & Asset Transfer Review Modal */}
      {isBuyoutLegalModalOpen && activeDeal && (
        <BuyoutLegalReviewModal
          isOpen={isBuyoutLegalModalOpen}
          onClose={() => setIsBuyoutLegalModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onPackageChanged={async () => {
            await loadInterests();
            onChanged();
          }}
        />
      )}
      {/* Full Buyout Phase 4: Agreement Signing Modal */}
      {isBuyoutSigningModalOpen && activeDeal && (
        <BuyoutAgreementSigningModal
          isOpen={isBuyoutSigningModalOpen}
          onClose={() => setIsBuyoutSigningModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onPackageChanged={async () => {
            await loadInterests();
            onChanged();
          }}
          onNavigateToClosing={() => {
            setIsBuyoutSigningModalOpen(false);
            setIsBuyoutClosingModalOpen(true);
          }}
        />
      )}
      {/* Full Buyout Phase 5: Closing & Payment Modal */}
      {isBuyoutClosingModalOpen && activeDeal && (
        <BuyoutClosingModal
          isOpen={isBuyoutClosingModalOpen}
          onClose={() => setIsBuyoutClosingModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onRefreshDeal={async () => {
            await loadInterests();
            onChanged();
          }}
          onProceedToHandover={() => {
            setIsBuyoutClosingModalOpen(false);
            setIsBuyoutHandoverModalOpen(true);
          }}
        />
      )}
      {/* Full Buyout Phase 6: Handover Modal */}
      {isBuyoutHandoverModalOpen && activeDeal && (
        <BuyoutHandoverModal
          isOpen={isBuyoutHandoverModalOpen}
          onClose={() => setIsBuyoutHandoverModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onRefreshDeal={async () => {
            await loadInterests();
            onChanged();
          }}
          onViewSaleRecord={() => {
            setIsBuyoutHandoverModalOpen(false);
            setIsBuyoutSaleRecordModalOpen(true);
          }}
        />
      )}
      {/* Full Buyout Phase 6: Canonical Sale Record Modal */}
      {isBuyoutSaleRecordModalOpen && activeDeal && (
        <BuyoutSaleRecordModal
          isOpen={isBuyoutSaleRecordModalOpen}
          onClose={() => setIsBuyoutSaleRecordModalOpen(false)}
          dealId={activeDeal.id}
        />
      )}
      {/* Buyout Deal Review Modal for Creator */}
      {isBuyoutReviewModalOpen && activeDeal && (
        <BuyoutOfferReviewModal
          isOpen={isBuyoutReviewModalOpen}
          onClose={() => setIsBuyoutReviewModalOpen(false)}
          deal={activeDeal}
          isCreator={true}
          onAccept={async () => {
            if (!activeDeal?.id) return;
            const updated = await marketplaceProjectsApi.acceptOffer(activeDeal.id);
            setActiveDeal(updated);
            await loadInterests();
          }}
          onCounter={async (req: any) => {
            if (!activeDeal?.id) return;
            const updated = await marketplaceProjectsApi.counterOffer(activeDeal.id, req);
            setActiveDeal(updated);
            await loadInterests();
          }}
          onReject={async () => {
            if (!activeDeal?.id) return;
            const updated = await marketplaceProjectsApi.rejectOffer(activeDeal.id);
            setActiveDeal(updated);
            await loadInterests();
          }}
        />
      )}

      {/* Equity Deal Review Modal for Creator */}
      {isReviewModalOpen && activeDeal && (
        <EquityOfferReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          deal={activeDeal}
          isCreator={true}
          onAccept={async () => {
            if (!activeDeal?.id) return;
            const updated = await marketplaceProjectsApi.acceptOffer(activeDeal.id);
            setActiveDeal(updated);
            await loadInterests();
          }}
          onCounter={async (req: CounterEquityOfferRequest) => {
            if (!activeDeal?.id) return;
            const updated = await marketplaceProjectsApi.counterOffer(activeDeal.id, req);
            setActiveDeal(updated);
            await loadInterests();
          }}
          onReject={async () => {
            if (!activeDeal?.id) return;
            const updated = await marketplaceProjectsApi.rejectOffer(activeDeal.id);
            setActiveDeal(updated);
            await loadInterests();
          }}
        />
      )}

      {/* Screen 02: Role & Responsibility Agreement Modal for Creator */}
      {isRoleModalOpen && activeDeal && (
        <RoleAgreementModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onAgreementChanged={async () => {
            await loadInterests();
            onChanged();
          }}
        />
      )}

      {/* Screen 03: Equity & Cap Table Draft Modal for Creator */}
      {isCapTableModalOpen && activeDeal && (
        <CapTableDraftModal
          isOpen={isCapTableModalOpen}
          onClose={() => setIsCapTableModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onDraftChanged={async () => {
            await loadInterests();
            onChanged();
          }}
        />
      )}

      {/* Screen 04: Legal & Shareholder Review Modal for Creator */}
      {isLegalModalOpen && activeDeal && (
        <LegalReviewModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onPackageChanged={async () => {
            await loadInterests();
            onChanged();
          }}
        />
      )}

      {/* Screen 05: Final Agreement Signing Modal for Creator */}
      {isSigningModalOpen && activeDeal && (
        <AgreementSigningModal
          isOpen={isSigningModalOpen}
          onClose={() => setIsSigningModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onPackageChanged={async () => {
            await loadInterests();
            onChanged();
          }}
        />
      )}

      {/* Screen 06: Company & Project Activation Modal for Creator */}
      {isActivationModalOpen && activeDeal && (
        <CompanyActivationModal
          isOpen={isActivationModalOpen}
          onClose={() => setIsActivationModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
          onActivationComplete={async () => {
            await loadInterests();
            onChanged();
          }}
        />
      )}

      {/* Screen 07: Partnership Active & My Equity Modal for Creator */}
      {isPartnershipModalOpen && activeDeal && (
        <PartnershipActiveModal
          isOpen={isPartnershipModalOpen}
          onClose={() => setIsPartnershipModalOpen(false)}
          dealId={activeDeal.id}
          isCreator={true}
        />
      )}
    </div>
  );
}
