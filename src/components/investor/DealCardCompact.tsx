import Link from "next/link";
import { MapPin } from "lucide-react";
import DealCardBase from "@/components/investor/DealCardBase";
import MatchScoreBadge from "@/components/investor/MatchScoreBadge";
import { Badge } from "@/components/ui/badge";
import type { OpportunityCard } from "@/types/investor/opportunities";

interface DealCardCompactProps {
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

export default function DealCardCompact({ card }: DealCardCompactProps) {
  const stage = card.fundingRoundType
    ? STAGE_LABEL[card.fundingRoundType] ?? card.fundingRoundType
    : null;
  const href = `/dashboard/investor/discovery/${card.companyId}`;

  return (
    <DealCardBase interactive className="p-3">
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-lg"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold"
            aria-hidden
          >
            {initials(card.companyName)}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {card.companyName}
              </h4>
              <MatchScoreBadge score={card.matchScore} className="shrink-0 text-[10px]" />
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
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              {card.country ? (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {card.country}
                </span>
              ) : (
                <span />
              )}
              <span className="font-medium text-foreground tabular-nums">
                {formatCurrency(card.fundingAskAmount)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </DealCardBase>
  );
}
