import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ActionItem = {
  label: string;
  description: string;
  href: string;
};

type ChecklistItem = {
  title: string;
  hint: string;
  status: "ready" | "in-progress" | "blocked";
};

type WorkspaceMetric = {
  label: string;
  value: string;
};

const statusStyles: Record<ChecklistItem["status"], string> = {
  ready: "text-green-600",
  "in-progress": "text-primary",
  blocked: "text-muted-foreground",
};

function StatusIcon({ status }: { status: ChecklistItem["status"] }) {
  if (status === "ready") {
    return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  }
  if (status === "in-progress") {
    return <Clock3 className="h-4 w-4 text-primary" />;
  }
  return <Lock className="h-4 w-4 text-muted-foreground" />;
}

export function RoleWorkspacePage({
  roleName,
  heading,
  summary,
  readiness,
  metrics,
  quickActions,
  checklist,
}: {
  roleName: string;
  heading: string;
  summary: string;
  readiness: number;
  metrics: WorkspaceMetric[];
  quickActions: ActionItem[];
  checklist: ChecklistItem[];
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      <Card>
        <CardHeader className="gap-3">
          <Badge variant="secondary" className="w-fit">
            {roleName} workspace
          </Badge>
          <CardTitle className="text-3xl">{heading}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6">
            {summary}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Setup readiness</span>
            <span className="font-semibold text-foreground">{readiness}%</span>
          </div>
          <Progress value={readiness} />
          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => (
          <Card key={action.label}>
            <CardHeader>
              <CardTitle className="text-lg">{action.label}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full sm:w-auto">
                <Link href={action.href}>
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Execution Checklist</CardTitle>
          <CardDescription>
            Team members should understand what to do next without guessing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklist.map((item) => (
            <div
              key={item.title}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="space-y-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.hint}</p>
              </div>
              <div className={`inline-flex items-center gap-2 text-sm ${statusStyles[item.status]}`}>
                <StatusIcon status={item.status} />
                <span className="font-medium capitalize">{item.status.replace("-", " ")}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
