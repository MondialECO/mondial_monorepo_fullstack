import { Sparkles, Compass } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MatchScoreDonut from "@/components/investor/MatchScoreDonut";
import ScoreBreakdownPanel from "@/components/investor/ScoreBreakdownPanel";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface MatchScoreCardProps {
  detail: OpportunityDetail;
}

function tierLabel(score: number): string {
  if (score >= 90) return "Excellent Match";
  if (score >= 80) return "Strong Match";
  return "Match";
}

export default function MatchScoreCard({ detail }: MatchScoreCardProps) {
  const isDirectDiscovery = detail.matchScore == null || detail.matchStatus === "direct_discovery";

  if (isDirectDiscovery) {
    return (
      <Card className="border-border bg-card rounded-2xl">
        <CardHeader className="pb-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground mb-2">
            <Compass className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <div className="space-y-1">
            <div className="flex justify-center">
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5">
                Direct discovery
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Personalized match score not calculated yet.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            You accessed this opportunity directly. You can review the company profile, request Data Room access, or engage with the founder.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-center">
          <MatchScoreDonut score={detail.matchScore!} size={112} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {tierLabel(detail.matchScore!)}
          </p>
          <p className="text-xs text-muted-foreground">
            Based on your investment thesis
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail.scoreBreakdown ? (
          <ScoreBreakdownPanel breakdown={detail.scoreBreakdown} />
        ) : null}
        {detail.matchRationale ? (
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              Why this deal?
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {detail.matchRationale}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

