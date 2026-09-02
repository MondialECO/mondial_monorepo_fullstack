"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import DealCardBase from "@/components/investor/DealCardBase";
import MatchScoreBadge from "@/components/investor/MatchScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OpportunityCard } from "@/types/investor/opportunities";

interface DealCardCompactProps {
  card: OpportunityCard;
  columnStatus?: "new" | "review" | "nda" | "dataroom" | "negotiation" | "won" | "lost" | "closed";
}

const STAGE_LABEL: Record<string, string> = {
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  series_c: "Series C",
};

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n.toLocaleString()}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function resolveDestinations(card: OpportunityCard, columnStatus?: string) {
  const status = columnStatus || card.stage || "new";
  switch (status) {
    case "won":
      return {
        primaryHref: card.holdingId
          ? `/dashboard/investor/portfolio?holding=${card.holdingId}`
          : "/dashboard/investor/portfolio",
        primaryLabel: "View Investment",
        secondaryHref: `/dashboard/investor/discovery/${card.companyId}`,
        secondaryLabel: "View Company",
        badge: "Portfolio",
        badgeClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      };
    case "negotiation":
      return {
        primaryHref: card.dealId
          ? `/dashboard/investor/deals?d=${card.dealId}`
          : "/dashboard/investor/deals",
        primaryLabel: "Open Deal",
        secondaryHref: `/dashboard/investor/discovery/${card.companyId}`,
        secondaryLabel: "View Company",
        badge: null,
        badgeClass: "",
      };
    case "dataroom":
      return {
        primaryHref: `/dashboard/investor/discovery/${card.companyId}/dataroom`,
        primaryLabel: "Open Data Room",
        secondaryHref: `/dashboard/investor/discovery/${card.companyId}`,
        secondaryLabel: "View Company",
        badge: null,
        badgeClass: "",
      };
    case "nda":
      return {
        primaryHref: `/dashboard/investor/discovery/${card.companyId}`,
        primaryLabel: "Continue Access",
        secondaryHref: null,
        secondaryLabel: null,
        badge: null,
        badgeClass: "",
      };
    case "review":
      return {
        primaryHref: `/dashboard/investor/discovery/${card.companyId}`,
        primaryLabel: "Continue Review",
        secondaryHref: null,
        secondaryLabel: null,
        badge: null,
        badgeClass: "",
      };
    case "lost":
      return {
        primaryHref: `/dashboard/investor/discovery/${card.companyId}`,
        primaryLabel: "View History",
        secondaryHref: null,
        secondaryLabel: null,
        badge: null,
        badgeClass: "",
      };
    default:
      return {
        primaryHref: `/dashboard/investor/discovery/${card.companyId}`,
        primaryLabel: "View Opportunity",
        secondaryHref: null,
        secondaryLabel: null,
        badge: null,
        badgeClass: "",
      };
  }
}

export default function DealCardCompact({ card, columnStatus }: DealCardCompactProps) {
  const stage = card.fundingRoundType
    ? STAGE_LABEL[card.fundingRoundType] ?? card.fundingRoundType
    : null;

  const dest = resolveDestinations(card, columnStatus);
  const isWon = (columnStatus || card.stage) === "won";
  const isNegotiation = (columnStatus || card.stage) === "negotiation";

  return (
    <DealCardBase className="p-3.5 space-y-3 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold"
          aria-hidden
        >
          {initials(card.companyName)}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-1.5">
            <Link
              href={dest.primaryHref}
              className="text-sm font-semibold text-foreground truncate hover:underline"
            >
              {card.companyName}
            </Link>
            {dest.badge ? (
              <Badge className={`shrink-0 text-[9px] px-1.5 py-0.5 font-medium ${dest.badgeClass}`}>
                {dest.badge}
              </Badge>
            ) : card.matchScore != null ? (
              <MatchScoreBadge score={card.matchScore} className="shrink-0 text-[10px]" />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {card.industry ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                {card.industry}
              </Badge>
            ) : null}
            {stage ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                {stage}
              </Badge>
            ) : null}
            {card.country ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground ml-1">
                <MapPin className="h-2.5 w-2.5" aria-hidden />
                {card.country}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Financial & lifecycle details */}
      <div className="rounded-lg bg-muted/40 p-2 text-xs flex items-center justify-between">
        <span className="text-muted-foreground text-[11px]">
          {isWon
            ? "Invested"
            : isNegotiation
            ? "Offer / Ask"
            : "Target Raise"}
        </span>
        <div className="flex items-center gap-1.5 font-medium text-foreground tabular-nums">
          <span>{formatCurrency(card.investmentAmount ?? card.fundingAskAmount)}</span>
          {card.equityPercentage != null && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ({card.equityPercentage}%)
            </span>
          )}
        </div>
      </div>

      {/* Action row with primary CTA and secondary link */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <Button
          size="sm"
          variant={isWon ? "default" : isNegotiation ? "default" : "outline"}
          className="h-7 text-xs px-2.5 gap-1"
          asChild
        >
          <Link href={dest.primaryHref}>
            {dest.primaryLabel}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>

        {dest.secondaryHref && (
          <Link
            href={dest.secondaryHref}
            className="text-[11px] text-muted-foreground hover:text-primary hover:underline transition-colors"
          >
            {dest.secondaryLabel}
          </Link>
        )}
      </div>
    </DealCardBase>
  );
}
