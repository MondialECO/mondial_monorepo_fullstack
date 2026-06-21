import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Users,
  Lightbulb,
  ShieldAlert,
  ListChecks,
  Layers,
} from "lucide-react";
import type { ClarifierOutput } from "@/types/creator/ai";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Target;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" aria-hidden />
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

const likelihoodVariant = (v?: string) => {
  const s = v?.toLowerCase();
  if (s === "high") return "destructive" as const;
  if (s === "medium") return "warning" as const;
  return "secondary" as const;
};

export function ClarifierResultsCard({
  output,
  clarityScore,
}: {
  output: ClarifierOutput;
  clarityScore?: number | null;
}) {
  const score = output.clarityScore ?? clarityScore ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">Clarifier Results</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Clarity Score
            </span>
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
        <Progress value={score} className="mt-2 h-2" />
        {output.clarityRationale && (
          <p className="mt-2 text-sm text-muted-foreground">
            {output.clarityRationale}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {output.problemDefinition && (
          <Section icon={Target} title="Problem Definition">
            {output.problemDefinition.statement && (
              <p>{output.problemDefinition.statement}</p>
            )}
            {!!output.problemDefinition.painPoints?.length && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {output.problemDefinition.painPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
            {output.problemDefinition.severity && (
              <Badge variant="info" className="mt-2">
                Severity: {output.problemDefinition.severity}
              </Badge>
            )}
          </Section>
        )}

        {output.targetAudience && (
          <Section icon={Users} title="Target Audience">
            {output.targetAudience.primarySegment && (
              <p className="font-medium text-foreground">
                {output.targetAudience.primarySegment}
              </p>
            )}
            {!!output.targetAudience.characteristics?.length && (
              <div className="mt-2 flex flex-wrap gap-2">
                {output.targetAudience.characteristics.map((c, i) => (
                  <Badge key={i} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
            {output.targetAudience.sizeQualitative && (
              <p className="mt-2">{output.targetAudience.sizeQualitative}</p>
            )}
          </Section>
        )}

        {output.proposedSolution && (
          <Section icon={Lightbulb} title="Solution Summary">
            {output.proposedSolution.summary && (
              <p>{output.proposedSolution.summary}</p>
            )}
            {output.proposedSolution.valueProposition && (
              <p className="mt-2">
                <span className="font-medium text-foreground">
                  Value:{" "}
                </span>
                {output.proposedSolution.valueProposition}
              </p>
            )}
            {output.proposedSolution.differentiation && (
              <p className="mt-2">
                <span className="font-medium text-foreground">
                  Differentiation:{" "}
                </span>
                {output.proposedSolution.differentiation}
              </p>
            )}
          </Section>
        )}

        {!!output.existingAlternatives?.length && (
          <Section icon={Layers} title="Existing Alternatives">
            <ul className="space-y-1">
              {output.existingAlternatives.map((a, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{a.name}</span>
                  {a.gap ? ` — ${a.gap}` : ""}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {!!output.riskAssessment?.length && (
          <Section icon={ShieldAlert} title="Risk Assessment">
            <div className="space-y-3">
              {output.riskAssessment.map((r, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {r.category}
                    </span>
                    {r.likelihood && (
                      <Badge variant={likelihoodVariant(r.likelihood)}>
                        {r.likelihood}
                      </Badge>
                    )}
                  </div>
                  {r.description && <p className="mt-1">{r.description}</p>}
                  {r.mitigation && (
                    <p className="mt-1 text-xs">
                      <span className="font-medium text-foreground">
                        Mitigation:{" "}
                      </span>
                      {r.mitigation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {!!output.assumptions?.length && (
          <Section icon={ListChecks} title="Assumptions">
            <ul className="list-disc space-y-1 pl-5">
              {output.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </Section>
        )}

        {!!output.tags?.length && (
          <div className="flex flex-wrap gap-2 pt-2">
            {output.tags.map((t, i) => (
              <Badge key={i} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ClarifierResultsCard;
