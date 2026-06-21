import Link from "next/link";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OpportunityDetail } from "@/types/investor/opportunities";
import {
  type DealStage,
  STAGE_LABEL,
  roundNameFromType,
} from "@/lib/term-sheet-derivation";

interface TermSheetHeaderProps {
  detail: OpportunityDetail;
  stage: DealStage;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRelative(iso: string): string {
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

export default function TermSheetHeader({ detail, stage }: TermSheetHeaderProps) {
  return (
    <div className="space-y-3">
      <Link
        href={`/dashboard/investor/discovery/${detail.companyId}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to {detail.companyName}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-semibold"
            aria-hidden
          >
            {initials(detail.companyName)}
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
              {detail.companyName} · Term Sheet
            </h1>
            <p className="text-sm text-muted-foreground">
              {roundNameFromType(detail.fundingRoundType)}
              {detail.country ? (
                <>
                  {" "}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {detail.country}
                  </span>
                </>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="default">{STAGE_LABEL[stage]}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden />
                Updated {formatRelative(detail.lastUpdatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
