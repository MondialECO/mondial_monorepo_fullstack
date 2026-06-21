import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DealCardBase from "@/components/investor/DealCardBase";
import MatchScoreBadge from "@/components/investor/MatchScoreBadge";
import MessageFounderButton from "@/components/messaging/MessageFounderButton";
import type { OpportunityCard } from "@/types/investor/opportunities";

interface OpportunityCardListItemProps {
  card: OpportunityCard;
}

const STAGE_LABEL: Record<string, string> = {
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  series_c: "Series C",
};

function formatCurrency(n: number | null): string {
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

export default function OpportunityCardListItem({ card }: OpportunityCardListItemProps) {
  const stage = card.fundingRoundType
    ? STAGE_LABEL[card.fundingRoundType] ?? card.fundingRoundType
    : null;
  const href = `/dashboard/investor/discovery/${card.companyId}`;

  return (
    <DealCardBase interactive>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold"
            aria-hidden
          >
            {initials(card.companyName)}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-semibold text-foreground truncate">
                <Link
                  href={href}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring/40 rounded"
                >
                  {card.companyName}
                </Link>
              </h3>
              {card.isInvestorReady ? (
                <span className="inline-flex items-center gap-1 text-xs text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Investor-Ready
                </span>
              ) : null}
            </div>

            {card.tagline ? (
              <p className="text-sm text-muted-foreground line-clamp-2">{card.tagline}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-1.5">
              {card.industry ? <Badge variant="secondary">{card.industry}</Badge> : null}
              {stage ? <Badge variant="outline">{stage}</Badge> : null}
              {card.country ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {card.country}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          <MatchScoreBadge score={card.matchScore} />
          <div className="flex items-baseline gap-3 text-xs">
            <div className="text-right">
              <div className="text-muted-foreground">Asking</div>
              <div className="text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(card.fundingAskAmount)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground">Valuation</div>
              <div className="text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(card.valuation)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageFounderButton companyId={card.companyId} label="Message" />
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View details
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </DealCardBase>
  );
}
