import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface OverviewTabPanelProps {
  detail: OpportunityDetail;
}

const STAGE_LABEL: Record<string, string> = {
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
};

// NOTE: The "Funding Ask" tile group lifted out of this tab and into the
// top-of-page OpportunityKPIStrip (Phase 2.5 O2) so the deal numbers are
// visible above-the-fold without scrolling into the Overview tab.
export default function OverviewTabPanel({ detail }: OverviewTabPanelProps) {
  const stage = detail.fundingRoundType
    ? STAGE_LABEL[detail.fundingRoundType] ?? detail.fundingRoundType
    : "—";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>{detail.tagline ?? "No description provided."}</p>
          {detail.matchRationale ? (
            <p className="text-xs italic">{detail.matchRationale}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Company Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Sector</dt>
              <dd className="font-medium text-foreground">{detail.industry ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Country</dt>
              <dd className="font-medium text-foreground">{detail.country ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Stage</dt>
              <dd className="font-medium text-foreground">{stage}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Trust Score</dt>
              <dd className="font-medium text-foreground">{detail.trustScore}/100</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
