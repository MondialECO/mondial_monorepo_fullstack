"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Package,
  Calendar,
  User,
  RefreshCw,
  FileCheck,
  Handshake,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight
} from "lucide-react";
import marketplaceProjectsApi, {
  BuyoutSaleRecord,
  EquityDeal
} from "@/lib/api-marketplace-projects";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function getBuyoutStageBadge(stage?: string): {
  label: string;
  badgeClass: string;
} {
  switch (stage) {
    case "BUYOUT_TERMS_ACCEPTED":
      return {
        label: "Buyout Terms Accepted",
        badgeClass: "bg-warning/10 text-warning border-warning/30"
      };
    case "BUYOUT_LEGAL_REVIEW_PENDING":
      return {
        label: "Legal & Transfer",
        badgeClass: "bg-primary/10 text-primary border-primary/20"
      };
    case "BUYOUT_SIGNATURE_PENDING":
      return {
        label: "Agreement Signing",
        badgeClass: "bg-primary/10 text-primary border-primary/20"
      };
    case "BUYOUT_CLOSING_PENDING":
      return {
        label: "Payment Confirmation",
        badgeClass: "bg-primary/10 text-primary border-primary/20"
      };
    case "BUYOUT_HANDOVER_PENDING":
      return {
        label: "Asset Handover",
        badgeClass: "bg-primary/10 text-primary border-primary/20"
      };
    case "SOLD":
    case "BUYOUT_COMPLETED":
      return {
        label: "Sale Completed",
        badgeClass: "bg-success-light text-success-strong border-success-strong/30"
      };
    case "OFFER_SUBMITTED":
    case "TERMS_COUNTERED":
    case "OFFER_NEGOTIATION":
    case "TERMS_NEGOTIATION":
    case "OFFER":
    default:
      return {
        label: "Terms Negotiation",
        badgeClass: "bg-warning/10 text-warning border-warning/30"
      };
  }
}

export default function MySalesPage() {
  const [sales, setSales] = useState<BuyoutSaleRecord[] | null>(null);
  const [activeDeals, setActiveDeals] = useState<EquityDeal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesData, activeData] = await Promise.all([
        marketplaceProjectsApi.getMyBuyoutSales(),
        marketplaceProjectsApi.getMyActiveBuyoutDeals().catch(() => [] as EquityDeal[])
      ]);

      // Filter active deals to strictly exclude terminal SOLD / completed deals
      // and ensure dealType is FULL_BUYOUT only
      const sanitizedActive = (activeData || []).filter(
        (d) =>
          d.dealType === "FULL_BUYOUT" &&
          d.dealStage !== "SOLD" &&
          d.dealStage !== "BUYOUT_COMPLETED" &&
          d.dealStage !== "CANCELLED" &&
          d.dealStage !== "REJECTED" &&
          d.status !== "CANCELLED" &&
          d.status !== "REJECTED" &&
          d.status !== "UNAVAILABLE"
      );

      setSales(salesData || []);
      setActiveDeals(sanitizedActive);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load sales records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hasActive = Boolean(activeDeals && activeDeals.length > 0);
  const hasCompleted = Boolean(sales && sales.length > 0);
  const hasNeither = !loading && !hasActive && !hasCompleted;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16 text-foreground font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                My Sales &amp; Buyouts
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track your active Full Buyout deals and review completed sale records.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2 self-start md:self-auto text-xs bg-background border-border text-foreground hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadData} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading sales and buyout deals...</p>
        </div>
      )}

      {/* GLOBAL EMPTY STATE (Neither active deals nor completed sales exist) */}
      {hasNeither && (
        <Card className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-foreground font-heading">No Buyout Deals Yet</h3>
            <p className="text-xs text-muted-foreground">
              When an entrepreneur enters a Full Buyout deal for one of your marketplace ventures, it will appear here.
            </p>
          </div>
          <div className="pt-2">
            <Button asChild variant="default" size="sm" className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard/creator/myideas">View My Ideas</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: ACTIVE BUYOUT DEALS */}
      {/* ======================================================== */}
      {!loading && !hasNeither && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Handshake className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold font-heading text-foreground">
                Active Buyouts {hasActive ? `(${activeDeals!.length})` : "(0)"}
              </h2>
            </div>
            {hasActive && (
              <span className="text-xs text-muted-foreground font-medium">
                In-progress transaction workspaces
              </span>
            )}
          </div>

          {!hasActive ? (
            <Card className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">No Active Buyouts</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You currently have no active buyout negotiations or in-progress transactions.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeDeals!.map((deal) => {
                const stageInfo = getBuyoutStageBadge(deal.dealStage);
                const price =
                  deal.buyoutTerms?.purchasePrice ??
                  (deal.buyoutTerms as any)?.buyoutPrice ??
                  deal.activeTerms?.cashComponent;
                const currency = deal.buyoutTerms?.currency || (deal.activeTerms as any)?.currency || "EUR";

                return (
                  <Card
                    key={deal.id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between space-y-5 text-foreground"
                  >
                    {/* TOP ROW: PROJECT + STAGE BADGE */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground font-heading truncate max-w-[280px]">
                            {deal.projectName || "Untitled Venture"}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                              <Layers className="h-3 w-3" />
                              Full Buyout
                            </span>
                            <span className="text-muted-foreground/60 text-xs">•</span>
                            <span className="text-[11px] text-muted-foreground">
                              Rev #{deal.currentRevisionNumber || 1}
                            </span>
                          </div>
                        </div>

                        <Badge
                          className={`${stageInfo.badgeClass} text-[10px] font-bold uppercase tracking-wider shrink-0 px-2.5 py-0.5 rounded-full border`}
                        >
                          {stageInfo.label}
                        </Badge>
                      </div>

                      {/* METRICS GRID */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-background border border-border rounded-xl">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider block">
                            Purchase Price
                          </span>
                          <span className="text-base font-extrabold text-foreground mt-0.5 block">
                            {price !== undefined && price !== null
                              ? `€${price.toLocaleString()} ${currency}`
                              : "In Negotiation"}
                          </span>
                        </div>

                        <div className="p-3 bg-background border border-border rounded-xl">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider block">
                            Last Updated
                          </span>
                          <span className="text-xs font-bold text-foreground mt-1 block truncate">
                            {new Date(deal.updatedAt || deal.createdAt).toLocaleDateString(undefined, {
                              dateStyle: "medium"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* BUYER DETAILS */}
                      <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>
                            Buyer: <strong className="text-foreground">{deal.entrepreneurName || "Entrepreneur"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTON */}
                    <div className="pt-3 border-t border-border flex items-center justify-end">
                      <Button
                        asChild
                        size="sm"
                        variant="default"
                        className="w-full sm:w-auto text-xs font-bold shadow-sm gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Link href={`/dashboard/creator/sales/${deal.id}`}>
                          <span>Open Deal</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: COMPLETED SALES */}
      {/* ======================================================== */}
      {!loading && !hasNeither && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-success-light text-success-strong">
                <FileCheck className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold font-heading text-foreground">
                Completed Sales {hasCompleted ? `(${sales!.length})` : "(0)"}
              </h2>
            </div>
            {hasCompleted && (
              <span className="text-xs text-muted-foreground font-medium">
                Canonical finalized transaction ledger
              </span>
            )}
          </div>

          {!hasCompleted ? (
            <Card className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">No Completed Sales Yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Completed buyout transactions and final asset transfer records will appear here.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sales!.map((sale) => (
                <Card
                  key={sale.id || sale.dealId}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between space-y-5 text-foreground"
                >
                  {/* TOP ROW: PROJECT + STATUS */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground font-heading truncate max-w-[280px]">
                          {sale.projectName}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          Ref: {sale.auditReference || sale.dealId.slice(0, 8)}
                        </p>
                      </div>
                      <Badge className="bg-success-light text-success-strong border-success-strong/30 text-[10px] font-black uppercase tracking-wider shrink-0 px-2.5 py-0.5 rounded-full border">
                        {sale.status || "SOLD"}
                      </Badge>
                    </div>

                    {/* METRICS GRID */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-background border border-border rounded-xl">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider block">
                          Sale Price
                        </span>
                        <span className="text-base font-extrabold text-foreground mt-0.5 block">
                          €{sale.purchasePrice.toLocaleString()} {sale.currency}
                        </span>
                      </div>

                      <div className="p-3 bg-background border border-border rounded-xl">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider block">
                          Sold Date
                        </span>
                        <span className="text-xs font-bold text-foreground mt-1 block truncate">
                          {new Date(sale.soldAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </span>
                      </div>
                    </div>

                    {/* BUYER & ASSETS DETAILS */}
                    <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                          Buyer: <strong className="text-foreground">{sale.buyerName || "Entrepreneur"}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                          Transferred:{" "}
                          <strong className="text-foreground">
                            {sale.transferredAssets?.length || 0} Assets Delivered
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="pt-3 border-t border-border flex items-center justify-end">
                    <Button
                      asChild
                      size="sm"
                      variant="default"
                      className="w-full sm:w-auto text-xs font-bold shadow-sm gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Link href={`/dashboard/creator/sales/${sale.dealId}`}>
                        <FileCheck className="h-3.5 w-3.5" />
                        View Sale Record
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
