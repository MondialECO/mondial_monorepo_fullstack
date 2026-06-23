"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, BarChart3, FileText, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";

const PHASE3_PREVIEW = [
  { icon: BarChart3, label: "3.1 Financial Forecast" },
  { icon: FileText, label: "3.2 Business Plan" },
  { icon: ShieldCheck, label: "3.3 Legal Checklist" },
  { icon: Users, label: "3.4 Formation & Team" },
];

export default function Phase2CompletePage() {
  const router = useRouter();
  const { state } = useCreatorProgress();
  const { project } = state;
  const branding = project.branding;

  // Gate the CTA on the SERVER-DERIVED status — never write status here.
  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    creatorJourneyApi.get()
      .then(({ computedStatus }) => { if (active) setComputed(computedStatus); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const canContinue =
    computed?.phase2.status === "completed" && computed?.phase3.status === "available";

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Phase 2 Complete
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full p-6 space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-extrabold tracking-tight">Your project identity is set</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s your assembled identity. Phase 3 builds your AI masterplan.</p>
        </div>

        {/* Identity card */}
        <Card className="rounded-2xl border border-border bg-card p-6">
          <CardContent className="p-0 space-y-3">
            <div className="flex items-center gap-4">
              {branding.logoAsset ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoAsset} alt="logo" className="h-14 w-14 rounded-xl object-contain bg-white border border-border" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-extrabold">
                  {(project.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-lg font-extrabold">{project.name || "Untitled"}</div>
                <div className="text-sm text-muted-foreground">{project.tagline || project.solution}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
              <div><span className="text-muted-foreground">Sector:</span> {project.sector || "—"}</div>
              <div><span className="text-muted-foreground">Audience:</span> {project.targetUser || "—"}</div>
              <div className="col-span-2"><span className="text-muted-foreground">Problem:</span> {project.problem || "—"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 3 unlock preview */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Up next — Phase 3</div>
          <div className="grid grid-cols-2 gap-3">
            {PHASE3_PREVIEW.map((p) => (
              <div key={p.label} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <p.icon className="h-4 w-4 text-primary" /> {p.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 pt-2">
          <Button
            onClick={() => router.push("/dashboard/creator/phase-3")}
            disabled={!canContinue}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue to Phase 3 <ArrowRight className="h-4 w-4" />
          </Button>
          {!loading && !canContinue && (
            <p className="text-xs text-muted-foreground">
              Finish your idea (name + clarity) and resolve branding to unlock Phase 3.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
