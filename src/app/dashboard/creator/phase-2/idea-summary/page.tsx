"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

export default function IdeaSummaryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const needsReview = params.get("review") === "1";
  const { state, completeStep } = useCreatorProgress();
  const { project } = state;

  const score = project.clarityScore || 0;
  const label = score >= 75 ? "Sharp" : score >= 55 ? "Developing" : "Vague";
  const labelColor = score >= 75 ? "text-primary" : score >= 55 ? "text-warning" : "text-destructive";

  const fields: { label: string; value: string }[] = [
    { label: "Core Problem", value: project.problem },
    { label: "Target User", value: project.targetUser },
    { label: "Proposed Solution", value: project.solution },
  ];

  const handleContinue = () => {
    completeStep(2, 7); // advance local cursor; status stays derived server-side
    router.push("/dashboard/creator/phase-2/concept-name");
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/creator/phase-2/clarifier")} className="gap-2 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to chat
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Idea Summary
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 space-y-6">
        {needsReview && (
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>We couldn&apos;t fully structure your answers. Please review and edit your summary below before continuing.</p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clarity Score</div>
            <div className={`text-sm font-semibold ${labelColor}`}>{label}</div>
          </div>
          <div className="text-4xl font-extrabold text-primary">{score}</div>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{f.label}</div>
              <p className="text-sm text-foreground leading-relaxed">{f.value || <span className="text-muted-foreground italic">Not captured — edit on the previous step.</span>}</p>
            </div>
          ))}
          {project.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/creator/phase-2/clarifier")}>Edit answers</Button>
          <Button onClick={handleContinue} className="gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </main>
    </div>
  );
}
