import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NDAStatusChip from "@/components/investor/NDAStatusChip";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface DataRoomHeaderProps {
  detail: OpportunityDetail;
}

const STAGE_LABEL: Record<string, string> = {
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function DataRoomHeader({ detail }: DataRoomHeaderProps) {
  const stage = detail.fundingRoundType
    ? STAGE_LABEL[detail.fundingRoundType] ?? detail.fundingRoundType
    : null;

  return (
    <div className="space-y-3">
      <Link
        href={`/dashboard/investor/discovery/${detail.companyId}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to {detail.companyName}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-sm font-semibold"
            aria-hidden
          >
            {initials(detail.companyName)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
              {detail.companyName} · Data Room
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {detail.industry ? <Badge variant="secondary">{detail.industry}</Badge> : null}
              {stage ? <Badge variant="outline">{stage}</Badge> : null}
              {detail.country ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {detail.country}
                </span>
              ) : null}
              <NDAStatusChip
                ndaRequired={detail.ndaRequired}
                ndaAccepted={detail.ndaAccepted}
              />
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-border/50 pt-4">
          {detail.documentsCount ? (
            <div className="text-xs">
              <span className="text-muted-foreground">Documents ready:</span>
              <span className="ml-2 font-semibold text-foreground">{detail.documentsCount}</span>
            </div>
          ) : null}
          <div className="text-xs">
            <span className="text-muted-foreground">Access:</span>
            <span className="ml-2 font-semibold text-foreground">
              {detail.ndaAccepted ? "Unlocked" : "NDA required"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
