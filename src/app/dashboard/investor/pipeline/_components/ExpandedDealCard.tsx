"use client";

import Link from "next/link";
import { ArrowRight, FileText, PencilRuler, Handshake } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MatchScoreBadge from "@/components/investor/MatchScoreBadge";
import MessageFounderButton from "@/components/messaging/MessageFounderButton";
import { useOpportunity } from "@/hooks/queries/investor-opportunities";
import type { OpportunityCard } from "@/types/investor/opportunities";

interface ExpandedDealCardProps {
  /** First card from `pipeline.columns.negotiation`. If absent, component returns null. */
  card: OpportunityCard | undefined;
}

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
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

function relativeTime(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const mins = Math.round(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } catch {
    return "—";
  }
}

export default function ExpandedDealCard({ card }: ExpandedDealCardProps) {
  // No deal in the negotiation column → render nothing.
  const { data, isLoading, isError } = useOpportunity(card?.companyId);

  if (!card) return null;

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-semibold"
              aria-hidden
            >
              {initials(card.companyName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground truncate">
                  {card.companyName}
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  <Handshake className="h-3 w-3 mr-1" aria-hidden />
                  Negotiation
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {card.industry ?? "—"}
                {card.country ? ` · ${card.country}` : ""}
              </p>
            </div>
          </div>
          <MatchScoreBadge score={card.matchScore} className="shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Financial summary — reads OpportunityDetail for the deal numbers */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : isError || !data ? (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Couldn&apos;t load deal numbers. Refresh to retry.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Offer
              </div>
              <div className="mt-1 text-base font-semibold text-foreground tabular-nums">
                {formatCurrency(data.fundingAskAmount)}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Equity
              </div>
              <div className="mt-1 text-base font-semibold text-foreground tabular-nums">
                {data.equityOfferedPercent != null
                  ? `${data.equityOfferedPercent.toFixed(2)}%`
                  : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Pre-Money
              </div>
              <div className="mt-1 text-base font-semibold text-foreground tabular-nums">
                {formatCurrency(data.preMoneyValuation)}
              </div>
            </div>
          </div>
        )}

        {/* Single-line status using only real timestamps */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
          <div>
            <span className="font-medium text-foreground">Term sheet draft in progress</span>
            <span className="mx-1.5">·</span>
            <span>Last activity {relativeTime(data?.lastUpdatedAt ?? card.lastUpdatedAt)}</span>
          </div>
        </div>

        {/* Action row — Message Founder opens the live thread; View Term Sheet
            routes to the read-only term sheet page. Edit Terms remains
            visual-only until the write path lands. */}
        <div className="flex flex-wrap items-center gap-2">
          <MessageFounderButton companyId={card.companyId} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/investor/discovery/${card.companyId}/term-sheet`}>
              <FileText className="h-4 w-4" aria-hidden />
              View Term Sheet
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled aria-disabled>
            <PencilRuler className="h-4 w-4" aria-hidden />
            Edit Terms
          </Button>
          <Link
            href={`/dashboard/investor/discovery/${card.companyId}`}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open deal
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
