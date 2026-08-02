import { Check, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { InvestorProfile } from "@/types/investor/profile";

function buildChecklist(p: InvestorProfile) {
  return [
    { label: "Headline added", done: !!p.headline?.trim() },
    { label: "Bio written", done: !!p.bio?.trim() },
    { label: "Website or social link", done: !!p.website?.trim() || Object.keys(p.socialLinks ?? {}).length > 0 },
    { label: "Sectors selected", done: p.preferredSectors.length > 0 },
    { label: "Stages selected", done: p.preferredStages.length > 0 },
    { label: "Check size set", done: p.minCheckSize > 0 || p.maxCheckSize > 0 },
    { label: "Thesis statement", done: !!p.thesisStatement?.trim() },
  ];
}

export default function ProfileCompletionCard({ profile }: { profile: InvestorProfile }) {
  const items = buildChecklist(profile);
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle>Profile Completion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-5">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Sections complete</span>
              <span className="tabular-nums text-muted-foreground">
                {done} / {total}
              </span>
            </div>
            <Progress value={pct} />
          </div>
        </div>

        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.label} className="flex items-center gap-2 text-sm">
              {i.done ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/50" />
              )}
              <span className={cn(i.done ? "text-foreground" : "text-muted-foreground")}>
                {i.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
