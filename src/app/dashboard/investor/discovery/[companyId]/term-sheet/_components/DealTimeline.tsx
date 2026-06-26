import { Check, Circle, Dot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type DealStage,
  DEAL_STAGES,
  STAGE_LABEL,
  describeStage,
} from "@/lib/term-sheet-derivation";

interface DealTimelineProps {
  currentStage: DealStage;
}

export default function DealTimeline({ currentStage }: DealTimelineProps) {
  const currentIdx = DEAL_STAGES.indexOf(currentStage);

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Deal Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-5">
          {DEAL_STAGES.map((stage, i) => {
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isFuture = i > currentIdx;
            const isLast = i === DEAL_STAGES.length - 1;

            return (
              <li key={stage} className="relative flex items-start gap-3">
                {/* Connector line behind icon (hidden on last step) */}
                {!isLast ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[11px] top-7 h-[calc(100%+0.5rem)] w-px",
                      isPast ? "bg-primary" : "bg-border"
                    )}
                  />
                ) : null}

                <span
                  aria-hidden
                  className={cn(
                    "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                    isPast && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    isFuture && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isPast ? (
                    <Check className="h-3 w-3" />
                  ) : isCurrent ? (
                    <Dot className="h-5 w-5" />
                  ) : (
                    <Circle className="h-2 w-2" />
                  )}
                </span>

                <div className="min-w-0 pt-0.5">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isFuture ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {STAGE_LABEL[stage]}
                    {isCurrent ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/30">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {describeStage(stage)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
