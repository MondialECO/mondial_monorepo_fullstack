import Link from "next/link";
import { ArrowLeft, MapPin, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NDAStatusChip from "@/components/investor/NDAStatusChip";
import type { OpportunityDetail } from "@/types/investor/opportunities";
import type { DiligenceSummary } from "@/lib/api-investor-diligence";

interface DataRoomHeaderProps {
  detail: OpportunityDetail;
  diligenceSummary?: DiligenceSummary | null;
  onOpenQuestions?: () => void;
  onMakeOfferClick?: () => void;
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

export default function DataRoomHeader({
  detail,
  diligenceSummary,
  onOpenQuestions,
  onMakeOfferClick,
}: DataRoomHeaderProps) {
  const stage = detail.fundingRoundType
    ? STAGE_LABEL[detail.fundingRoundType] ?? detail.fundingRoundType
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/investor/discovery/${detail.companyId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to {detail.companyName}
        </Link>

        {onMakeOfferClick && (
          <Button size="sm" onClick={onMakeOfferClick}>
            Make Offer / Term Sheet
          </Button>
        )}
      </div>

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

        {/* Diligence summary badges */}
        {diligenceSummary && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div>
                <span className="text-muted-foreground">Diligence: </span>
                <span className="font-semibold text-foreground">
                  {diligenceSummary.percentComplete}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <div>
                <span className="text-muted-foreground">Reviewed: </span>
                <span className="font-semibold text-foreground">
                  {diligenceSummary.reviewedDocuments}/{diligenceSummary.totalDocuments}
                </span>
              </div>
            </div>

            {onOpenQuestions && (
              <button
                type="button"
                onClick={onOpenQuestions}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 shadow-sm hover:bg-muted/40 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-amber-500" />
                <div>
                  <span className="text-muted-foreground">Q&A: </span>
                  <span className="font-semibold text-primary">
                    {diligenceSummary.openQuestionsCount} Open
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
