import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  return (
    <Card className="border-border bg-card rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-center">
          <MatchScoreDonut score={detail.matchScore} size={112} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {tierLabel(detail.matchScore)}
          </p>
          <p className="text-xs text-muted-foreground">
            Based on your investment thesis
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScoreBreakdownPanel breakdown={detail.scoreBreakdown} />
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
