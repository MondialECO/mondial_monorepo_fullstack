import { CheckCircle2, Loader2, Circle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DiligenceProgress } from "@/types/investor/opportunities";

interface DiligenceProgressCardProps {
  progress: DiligenceProgress;
}

const ROWS: Array<{
  key: keyof Pick<DiligenceProgress, "completed" | "inProgress" | "pending" | "flagged">;
  label: string;
  icon: typeof CheckCircle2;
  tone: string;
}> = [
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    tone: "text-primary",
  },
  {
    key: "inProgress",
    label: "In Progress",
    icon: Loader2,
    tone: "text-foreground",
  },
  {
    key: "pending",
    label: "Pending",
    icon: Circle,
    tone: "text-muted-foreground",
  },
  {
    key: "flagged",
    label: "Flagged",
    icon: AlertTriangle,
    tone: "text-destructive",
  },
];

export default function DiligenceProgressCard({ progress }: DiligenceProgressCardProps) {
  const noDeal = progress.totalItems === 0;

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Diligence Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {noDeal ? (
          <p className="text-xs text-muted-foreground">
            Diligence tracking begins after a deal is opened with this company.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">
                  {progress.completed} of {progress.totalItems} items completed
                </span>
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  {progress.percentComplete}%
                </span>
              </div>
              <Progress
                value={progress.percentComplete}
                aria-label={`Diligence ${progress.percentComplete} percent complete`}
              />
            </div>

            <ul className="space-y-2">
              {ROWS.map(({ key, label, icon: Icon, tone }) => (
                <li
                  key={key}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Icon className={cn("h-3.5 w-3.5", tone)} aria-hidden />
                    {label}
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {progress[key]}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
