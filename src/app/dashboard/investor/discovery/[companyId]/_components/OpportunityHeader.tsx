import Link from "next/link";
import { ArrowLeft, MapPin, Share2, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NDAStatusChip from "@/components/investor/NDAStatusChip";
import MessageFounderButton from "@/components/messaging/MessageFounderButton";
import MakeOfferButton from "@/components/deals/MakeOfferButton";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface OpportunityHeaderProps {
  detail: OpportunityDetail;
}

const STAGE_LABEL: Record<string, string> = {
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  series_c: "Series C",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function OpportunityHeader({ detail }: OpportunityHeaderProps) {
  const stage = detail.fundingRoundType
    ? STAGE_LABEL[detail.fundingRoundType] ?? detail.fundingRoundType
    : null;

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/investor/discovery"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to Discovery
      </Link>

      {/* HERO BAND — theme-token gradient substitutes for a hero photo */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 sm:p-8">
        {/* Decorative blob — pure CSS, no asset dependency */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <div
              className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl sm:text-2xl font-bold shadow-sm"
              aria-hidden
            >
              {initials(detail.companyName)}
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[32px] truncate">
                {detail.companyName}
              </h1>
              {detail.tagline ? (
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  {detail.tagline}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-1.5">
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

          <div className="flex flex-col gap-2 shrink-0 sm:flex-row">
            <MakeOfferButton companyId={detail.companyId} />
            <MessageFounderButton
              companyId={detail.companyId}
              label="Contact Founder"
              variant="outline"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" type="button" title="Save for later">
                <Bookmark className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline ml-1">Save</span>
              </Button>
              <Button variant="ghost" size="sm" type="button" title="Share this opportunity">
                <Share2 className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline ml-1">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
