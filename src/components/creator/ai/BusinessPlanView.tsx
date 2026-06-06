import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  BarChart3,
  Swords,
  Coins,
  Rocket,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import type { BusinessPlanOutput } from "@/types/creator/ai";

function PlanSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

function Bullets({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

const likelihoodVariant = (v?: string) => {
  const s = v?.toLowerCase();
  if (s === "high") return "destructive" as const;
  if (s === "medium") return "warning" as const;
  return "secondary" as const;
};

export function BusinessPlanView({ output }: { output: BusinessPlanOutput }) {
  return (
    <div className="space-y-4">
      {output.executiveSummary && (
        <PlanSection icon={FileText} title="Executive Summary">
          {output.executiveSummary.overview && (
            <p>{output.executiveSummary.overview}</p>
          )}
          {output.executiveSummary.valueProposition && (
            <p>
              <span className="font-medium text-foreground">
                Value Proposition:{" "}
              </span>
              {output.executiveSummary.valueProposition}
            </p>
          )}
          <Bullets items={output.executiveSummary.highlights} />
        </PlanSection>
      )}

      {output.marketAnalysis && (
        <PlanSection icon={BarChart3} title="Market Analysis">
          {output.marketAnalysis.overview && (
            <p>{output.marketAnalysis.overview}</p>
          )}
          {!!output.marketAnalysis.targetSegments?.length && (
            <div className="flex flex-wrap gap-2">
              {output.marketAnalysis.targetSegments.map((s, i) => (
                <Badge key={i} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          )}
          {output.marketAnalysis.marketSizeQualitative && (
            <p>
              <span className="font-medium text-foreground">Market size: </span>
              {output.marketAnalysis.marketSizeQualitative}
            </p>
          )}
          {!!output.marketAnalysis.trends?.length && (
            <div>
              <p className="font-medium text-foreground">Trends</p>
              <Bullets items={output.marketAnalysis.trends} />
            </div>
          )}
        </PlanSection>
      )}

      {output.competitorAnalysis && (
        <PlanSection icon={Swords} title="Competitor Analysis">
          {output.competitorAnalysis.overview && (
            <p>{output.competitorAnalysis.overview}</p>
          )}
          <div className="space-y-3">
            {output.competitorAnalysis.competitors?.map((c, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{c.name}</span>
                  {c.positioning && (
                    <Badge variant="outline">{c.positioning}</Badge>
                  )}
                </div>
                {!!c.strengths?.length && (
                  <p className="mt-1">
                    <span className="font-medium text-foreground">
                      Strengths:{" "}
                    </span>
                    {c.strengths.join(", ")}
                  </p>
                )}
                {!!c.weaknesses?.length && (
                  <p>
                    <span className="font-medium text-foreground">
                      Weaknesses:{" "}
                    </span>
                    {c.weaknesses.join(", ")}
                  </p>
                )}
                {c.ourAdvantage && (
                  <p>
                    <span className="font-medium text-foreground">
                      Our advantage:{" "}
                    </span>
                    {c.ourAdvantage}
                  </p>
                )}
              </div>
            ))}
          </div>
        </PlanSection>
      )}

      {output.revenueModel && (
        <PlanSection icon={Coins} title="Revenue Model">
          {output.revenueModel.summary && <p>{output.revenueModel.summary}</p>}
          {!!output.revenueModel.revenueStreams?.length && (
            <div className="space-y-1">
              {output.revenueModel.revenueStreams.map((r, i) => (
                <p key={i}>
                  <span className="font-medium text-foreground">{r.name}</span>
                  {r.description ? ` — ${r.description}` : ""}
                </p>
              ))}
            </div>
          )}
          {output.revenueModel.pricingStrategy && (
            <p>
              <span className="font-medium text-foreground">Pricing: </span>
              {output.revenueModel.pricingStrategy}
            </p>
          )}
          {!!output.revenueModel.keyMetrics?.length && (
            <div className="flex flex-wrap gap-2">
              {output.revenueModel.keyMetrics.map((m, i) => (
                <Badge key={i} variant="info">
                  {m}
                </Badge>
              ))}
            </div>
          )}
        </PlanSection>
      )}

      {output.goToMarket && (
        <PlanSection icon={Rocket} title="Go To Market">
          {output.goToMarket.strategy && <p>{output.goToMarket.strategy}</p>}
          {!!output.goToMarket.channels?.length && (
            <div className="flex flex-wrap gap-2">
              {output.goToMarket.channels.map((c, i) => (
                <Badge key={i} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          )}
          {!!output.goToMarket.phases?.length && (
            <ol className="list-decimal space-y-1 pl-5">
              {output.goToMarket.phases.map((p, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{p.name}</span>
                  {p.description ? ` — ${p.description}` : ""}
                </li>
              ))}
            </ol>
          )}
        </PlanSection>
      )}

      {output.operationsPlan && (
        <PlanSection icon={Settings2} title="Operations Plan">
          {output.operationsPlan.overview && (
            <p>{output.operationsPlan.overview}</p>
          )}
          {!!output.operationsPlan.keyActivities?.length && (
            <div>
              <p className="font-medium text-foreground">Key activities</p>
              <Bullets items={output.operationsPlan.keyActivities} />
            </div>
          )}
          {!!output.operationsPlan.resources?.length && (
            <div>
              <p className="font-medium text-foreground">Resources</p>
              <Bullets items={output.operationsPlan.resources} />
            </div>
          )}
          {!!output.operationsPlan.milestones?.length && (
            <div className="space-y-1">
              {output.operationsPlan.milestones.map((m, i) => (
                <p key={i}>
                  <span className="font-medium text-foreground">{m.title}</span>
                  {m.timeframe ? ` (${m.timeframe})` : ""}
                  {m.description ? ` — ${m.description}` : ""}
                </p>
              ))}
            </div>
          )}
        </PlanSection>
      )}

      {!!output.risks?.length && (
        <PlanSection icon={ShieldAlert} title="Risks">
          <div className="space-y-3">
            {output.risks.map((r, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {r.category}
                  </span>
                  {r.likelihood && (
                    <Badge variant={likelihoodVariant(r.likelihood)}>
                      L: {r.likelihood}
                    </Badge>
                  )}
                  {r.impact && <Badge variant="outline">I: {r.impact}</Badge>}
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
        </PlanSection>
      )}
    </div>
  );
}

export default BusinessPlanView;
