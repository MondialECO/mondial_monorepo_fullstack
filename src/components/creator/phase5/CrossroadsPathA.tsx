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
import {
  Handshake,
  Users,
  PieChart,
  Scale,
  FileCheck,
  Building2,
  Award,
  DollarSign,
  CreditCard,
  Package,
  UsersRound,
  FileSignature,
  History,
  ChevronRight,
} from "lucide-react";

type ListingState = {
  askingPrice?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  status?: string | null;
  saleType?: string | null;
  dealModes?: string[];
  audience?: string | null;
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
  const [listingStatus, setListingStatus] = useState<string>(saved?.marketplaceListing?.status || "available");
  const [publishedAt, setPublishedAt] = useState<string | null>(saved?.marketplaceListing?.publishedAt ?? null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(saved?.marketplaceListing?.updatedAt ?? null);
  const [isEditing, setIsEditing] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
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
          setPublishedAt(s.marketplaceListing.publishedAt);
        }
        if (s.marketplaceListing?.updatedAt != null) {
          setUpdatedAt(s.marketplaceListing.updatedAt);
        }
        if (s.marketplaceListing?.status != null) {
          setListingStatus(s.marketplaceListing.status);
        }
        setIsEditing(false);
        setHydratedIdeaId(ideaId);
      } else {
        setAskingPrice(0);
        setValuation(null);
        setPublished(false);
        setPublishedAt(null);
        setUpdatedAt(null);
        setListingStatus("available");
        setDealModes(["full_buyout"]);
        setIsEditing(false);
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
    setFeedback(null);
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
      const isAlreadyPublished = published;
      setPublished(true);
      setIsEditing(false);
      setListingStatus("available");
      setUpdatedAt(new Date().toISOString());
      setIsEmpty(res.isEmpty);
      setFeedback(isAlreadyPublished ? "Marketplace listing updated." : "Marketplace listing published.");
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

  const toggleListingStatus = async () => {
    if (pausing) return;
    setPausing(true);
    const nextStatus = listingStatus === "paused" ? "available" : "paused";
    try {
      await creatorJourneyApi.setMarketplaceStatus(nextStatus, ideaId);
      setListingStatus(nextStatus);
      setUpdatedAt(new Date().toISOString());
      setFeedback(nextStatus === "paused" ? "Marketplace listing paused." : "Marketplace listing resumed.");
      onChanged();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setPubError(
        err.response?.data?.message ??
          (e instanceof Error ? e.message : "Couldn't update listing status.")
      );
    } finally {
      setPausing(false);
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

      {/* Feedback banner */}
      {feedback && (
        <div className="rounded-xl border border-success-strong/30 bg-success-light p-3 text-xs font-semibold text-success-strong flex items-center justify-between">
          <span>{feedback}</span>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="h-6 px-2 text-xs">Dismiss</Button>
        </div>
      )}

      {/* Marketplace Push Listing Setup */}
      <Card className="rounded-2xl border border-border bg-card p-5 space-y-4">
        {(() => {
          const isSold = (saved as { projectOutcome?: string })?.projectOutcome === "SOLD" || listingStatus === "closed" || activeDeal?.dealStage === "SOLD" || activeDeal?.dealStage === "BUYOUT_COMPLETED";

          if (isSold) {
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-primary" />
                      Marketplace Listing Closed
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This project has been sold via Full Buyout. The marketplace listing is permanently closed.
                    </p>
                  </div>
                  <Badge variant="destructive" className="font-bold text-[10px]">
                    SOLD
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Deal Types</span>
                    <span className="text-xs font-bold text-foreground capitalize">
                      {dealModes.map((m) => m.replace(/_/g, " ")).join(", ")}
                    </span>
                  </div>
                  {hasBuyout && (
                    <div className="rounded-xl border border-border bg-background/50 p-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Asking Price</span>
                      <span className="text-xs font-bold text-primary">€{askingPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Visibility</span>
                    <span className="text-xs font-bold text-foreground capitalize">{audience}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Dates</span>
                    <span className="text-xs font-medium text-muted-foreground block truncate">
                      {publishedAt ? `Published ${new Date(publishedAt).toLocaleDateString()}` : "Published"}
                      {updatedAt ? ` · Updated ${new Date(updatedAt).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          if (published && !isEditing) {
            return (
              /* STATE B — PUBLISHED / ACTIVE VIEW */
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-primary" />
                      {listingStatus === "paused" ? "Marketplace Listing Paused" : "Marketplace Listing Active"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {listingStatus === "paused"
                        ? "Your listing is currently hidden from discovery. You can resume or edit it at any time."
                        : "Your project is live in discovery. Verified entrepreneurs can view your summary and submit interest."}
                    </p>
                  </div>
                  <Badge
                    className={`text-[10px] font-bold ${
                      listingStatus === "paused"
                        ? "bg-warning/10 text-warning border-warning/30"
                        : "bg-success-light text-success-strong border-success-strong/30"
                    }`}
                  >
                    {listingStatus === "paused" ? "PAUSED" : "LIVE"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Deal Types</span>
                    <span className="text-xs font-bold text-foreground capitalize">
                      {dealModes.map((m) => m.replace(/_/g, " ")).join(", ")}
                    </span>
                  </div>
                  {hasBuyout && (
                    <div className="rounded-xl border border-border bg-background/50 p-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Asking Price</span>
                      <span className="text-xs font-bold text-primary">€{askingPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Visibility</span>
                    <span className="text-xs font-bold text-foreground capitalize">{audience}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-background/50 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Dates</span>
                    <span className="text-xs font-medium text-muted-foreground block truncate">
                      {publishedAt ? `Published ${new Date(publishedAt).toLocaleDateString()}` : "Published"}
                      {updatedAt ? ` · Updated ${new Date(updatedAt).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                </div>

                {isEmpty && (
                  <p className="text-xs text-muted-foreground pt-1">
                    No automatic buyer matches yet. Your listing is visible in discovery to verified entrepreneurs.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    className="gap-1.5"
                  >
                    Edit Marketplace Listing
                  </Button>
                  {ideaId && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/entrepreneur/discover/${ideaId}`}>
                        View Public Listing
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleListingStatus}
                    disabled={pausing}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {pausing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    {listingStatus === "paused" ? "Resume Listing" : "Pause Listing"}
                  </Button>
                </div>
              </div>
            );
          }

          return (
            /* STATE A (NOT PUBLISHED) OR EDITING ACTIVE LISTING */
            <div className="space-y-4">
              {published && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground font-bold text-[10px]">Editing Live Listing</Badge>
                    <span className="text-muted-foreground">You are editing a live marketplace listing. Changes update the public listing only. Existing accepted deal terms will not be changed.</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (saved?.marketplaceListing) {
                        setAskingPrice(saved.marketplaceListing.askingPrice ?? 0);
                        setDealModes(saved.marketplaceListing.dealModes ?? ["full_buyout"]);
                      }
                      setIsEditing(false);
                    }}
                    className="text-xs shrink-0"
                  >
                    Cancel
                  </Button>
                </div>
              )}

            <div>
              <div className="text-sm font-bold flex items-center gap-1.5">
                <Store className="h-4 w-4 text-primary" /> {published ? "Edit Marketplace Listing" : "Marketplace Push Listing"}
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
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={publish}
                  disabled={publishing || (hasBuyout && askingPrice <= 0)}
                  className="gap-2"
                >
                  {publishing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save &amp; Update Listing
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (saved?.marketplaceListing) {
                      setAskingPrice(saved.marketplaceListing.askingPrice ?? 0);
                      setDealModes(saved.marketplaceListing.dealModes ?? ["full_buyout"]);
                    }
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
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
          </div>
        );
      })()}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full pt-1">
                              {(activeDeal.dealStage === "BUYOUT_LEGAL_REVIEW_PENDING" || activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING") && (
                                <button
                                  type="button"
                                  onClick={() => setIsBuyoutLegalModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "BUYOUT_LEGAL_REVIEW_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "BUYOUT_LEGAL_REVIEW_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <Scale className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Legal & Transfer Review
                                    </div>
                                    {activeDeal.dealStage === "BUYOUT_LEGAL_REVIEW_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {(activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING" || activeDeal.dealStage === "BUYOUT_CLOSING_PENDING") && (
                                <button
                                  type="button"
                                  onClick={() => setIsBuyoutSigningModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <FileSignature className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Agreement Signing
                                    </div>
                                    {activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {(activeDeal.dealStage === "BUYOUT_CLOSING_PENDING" || activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING") && (
                                <button
                                  type="button"
                                  onClick={() => setIsBuyoutClosingModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "BUYOUT_CLOSING_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "BUYOUT_CLOSING_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <CreditCard className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Closing & Payment
                                    </div>
                                    {activeDeal.dealStage === "BUYOUT_CLOSING_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {(activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING" || activeDeal.dealStage === "SOLD" || activeDeal.dealStage === "BUYOUT_COMPLETED") && (
                                <button
                                  type="button"
                                  onClick={() => setIsBuyoutHandoverModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <Package className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Asset Handover
                                    </div>
                                    {activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {(activeDeal.dealStage === "SOLD" || activeDeal.dealStage === "BUYOUT_COMPLETED") && (
                                <button
                                  type="button"
                                  onClick={() => setIsBuyoutSaleRecordModalOpen(true)}
                                  className="group w-full h-auto min-h-14 p-3 rounded-xl border border-success-strong/40 bg-success-light hover:bg-success-light/80 transition-all text-left flex items-center gap-3 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <div className="h-9 w-9 rounded-xl bg-success-strong text-white flex items-center justify-center shrink-0">
                                    <FileCheck className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-success-strong leading-snug font-sans">
                                      View Sale Record
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-success-strong group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setIsBuyoutReviewModalOpen(true)}
                                className="group w-full h-auto min-h-14 p-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                                  <History className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                    {activeDeal.dealStage === "BUYOUT_TERMS_ACCEPTED" || activeDeal.dealStage === "BUYOUT_SIGNATURE_PENDING" || activeDeal.dealStage === "BUYOUT_CLOSING_PENDING" || activeDeal.dealStage === "BUYOUT_HANDOVER_PENDING" || activeDeal.dealStage === "SOLD"
                                      ? "Agreed Buyout Terms 🔒"
                                      : `Review Buyout Offer (V${activeDeal.currentRevisionNumber})`}
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full pt-1">
                              {(activeDeal.dealStage === "ROLES_PENDING" || activeDeal.dealStage === "CAP_TABLE_PENDING" || activeDeal.dealStage === "LEGAL_REVIEW_PENDING") && (
                                <button
                                  type="button"
                                  onClick={() => setIsRoleModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "ROLES_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "ROLES_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <UsersRound className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Role & Responsibility Agreement
                                    </div>
                                    {activeDeal.dealStage === "ROLES_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {(activeDeal.dealStage === "CAP_TABLE_PENDING" || activeDeal.dealStage === "LEGAL_REVIEW_PENDING" || activeDeal.dealStage === "SIGNATURE_PENDING") && (
                                <button
                                  type="button"
                                  onClick={() => setIsCapTableModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "CAP_TABLE_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "CAP_TABLE_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <PieChart className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Equity & Cap Table Structure
                                    </div>
                                    {activeDeal.dealStage === "CAP_TABLE_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {(activeDeal.dealStage === "LEGAL_REVIEW_PENDING" || activeDeal.dealStage === "SIGNATURE_PENDING" || activeDeal.dealStage === "ACTIVATION_PENDING") && (
                                <button
                                  type="button"
                                  onClick={() => setIsLegalModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "LEGAL_REVIEW_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "LEGAL_REVIEW_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <Scale className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Legal & Shareholder Review
                                    </div>
                                    {activeDeal.dealStage === "LEGAL_REVIEW_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {(activeDeal.dealStage === "SIGNATURE_PENDING" || activeDeal.dealStage === "ACTIVATION_PENDING") && (
                                <button
                                  type="button"
                                  onClick={() => setIsSigningModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "SIGNATURE_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "SIGNATURE_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <FileSignature className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Final Agreement Signing
                                    </div>
                                    {activeDeal.dealStage === "SIGNATURE_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {(activeDeal.dealStage === "ACTIVATION_PENDING" || activeDeal.dealStage === "PARTNERSHIP_ACTIVE") && (
                                <button
                                  type="button"
                                  onClick={() => setIsActivationModalOpen(true)}
                                  className={`group w-full h-auto min-h-14 p-3 rounded-xl border transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                    activeDeal.dealStage === "ACTIVATION_PENDING"
                                      ? "bg-primary/5 border-primary/40 hover:bg-primary/10 hover:border-primary/50 shadow-xs"
                                      : "bg-card border-border hover:bg-muted/60 hover:border-border/80"
                                  }`}
                                >
                                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    activeDeal.dealStage === "ACTIVATION_PENDING"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-success-light text-success-strong border border-success-strong/20"
                                  }`}>
                                    <Building2 className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Company & Project Activation
                                    </div>
                                    {activeDeal.dealStage === "ACTIVATION_PENDING" && (
                                      <div className="text-[10px] font-medium text-primary mt-0.5">
                                        Current Step
                                      </div>
                                    )}
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              {activeDeal.dealStage === "PARTNERSHIP_ACTIVE" && (
                                <button
                                  type="button"
                                  onClick={() => setIsPartnershipModalOpen(true)}
                                  className="group w-full h-auto min-h-14 p-3 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-left flex items-center gap-3 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                                    <Handshake className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                      Active Partnership & Workspace
                                    </div>
                                    <div className="text-[10px] font-medium text-primary mt-0.5">
                                      Current Step
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setIsReviewModalOpen(true)}
                                className="group w-full h-auto min-h-14 p-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-left flex items-center gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                                  <History className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-foreground leading-snug font-sans">
                                    Review Offer & History
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                              </button>
                            </div>
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
