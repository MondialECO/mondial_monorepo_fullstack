"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft, Store, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { CrossroadsPathA } from "@/components/creator/phase5/CrossroadsPathA";
import { CrossroadsPathB } from "@/components/creator/phase5/CrossroadsPathB";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";

export default function CrossroadsPage() {
  const router = useRouter();
  const { state, setCrossroadsPath, error: progressError } = useCreatorProgress();
  const { project, journeyState } = state;
  const activeIdeaId = state.activeIdeaId;

  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectingPath, setSelectingPath] = useState(false);
  const [phase5Data, setPhase5Data] = useState<Record<string, unknown> | null>(null);
  const [phase3Data, setPhase3Data] = useState<Record<string, unknown> | null>(null);
  const path = journeyState.phase5.selectedPath;

  const refresh = () =>
    creatorJourneyApi.get(activeIdeaId).then(({ journey, computedStatus }) => {
      setComputed(computedStatus);
      setPhase5Data(journey.phase5Data);
      setPhase3Data(journey.phase3Data);
    }).finally(() => setLoading(false));
  useEffect(() => {
    setLoading(true);
    setPhase5Data(null);
    setPhase3Data(null);
    refresh();
    /* eslint-disable-next-line */
  }, [activeIdeaId]);

  // Recommendation: Path B when readiness high & clarity sharp; Path A when low/reopening.
  const readiness = (project as { investorReadinessScore?: { total?: number } })?.investorReadinessScore?.total ?? 0;
  const recommendB = readiness > 65 && project.clarityScore > 70;

  const choose = async (p: "sell" | "build") => {
    if (selectingPath) return;
    setSelectingPath(true);
    try {
      if (await setCrossroadsPath(p)) await refresh();
    } finally {
      setSelectingPath(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      {/* <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <h1 className="text-sm font-bold">Phase 5 — The Crossroads</h1>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Decision point
        </div>
      </header> */}

      <main className="max-w-5xl mx-auto w-full p-6 space-y-6">
        {/* Project strip */}
        <Card className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between">
          <div>
            <div className="text-lg font-extrabold">{project.name || "Your idea"}</div>
            <p className="text-sm text-muted-foreground">{project.tagline || project.solution}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Clarity {project.clarityScore} · Readiness {readiness}</div>
            <div className="text-xs text-muted-foreground">Choose how you move forward</div>
          </div>
        </Card>

        {/* Decision cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card onClick={() => void choose("sell")}
            className={`cursor-pointer rounded-2xl border-2 p-6 space-y-3 transition-all ${path === "sell" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning"><Store className="h-6 w-6" /></div>
              {path === "sell" && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </div>
            <h3 className="text-lg font-bold">Sell the Project</h3>
            <p className="text-sm text-muted-foreground">Transfer the project through a Full Buyout and make it available to potential buyers.</p>
            <Button variant={path === "sell" ? "default" : "outline"} className="w-full" disabled={selectingPath}>Explore Full Buyout</Button>
          </Card>

          <Card onClick={() => void choose("build")}
            className={`cursor-pointer rounded-2xl border-2 p-6 space-y-3 transition-all ${path === "build" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>
              {path === "build" && <CheckCircle2 className="h-5 w-5 text-primary" />}
              {recommendB && path !== "build" && <Badge className="bg-primary text-primary-foreground">Recommended</Badge>}
            </div>
            <h3 className="text-lg font-bold">Build the Company</h3>
            <p className="text-sm text-muted-foreground">Continue as founder and prepare ownership, team, funding and your launch plan.</p>
            <Button variant={path === "build" ? "default" : "outline"} className="w-full" disabled={selectingPath}>{selectingPath ? "Saving choice…" : "Continue Building"}</Button>
          </Card>
        </div>

        {progressError && <p role="alert" className="text-sm text-destructive">{progressError.message || "Couldn't save your Crossroads choice. Please retry."}</p>}

        {path === "sell_license" && (
          <Card className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">
            This idea has a historical licensing intent. It has been preserved and has not been converted into a Full Buyout listing. Choose “Sell the Project” to start a new Full Buyout flow.
          </Card>
        )}

        {/* Path-specific flow */}
        {path === "sell" && !selectingPath && <CrossroadsPathA ideaId={activeIdeaId} initial={phase5Data?.pathA as Record<string, unknown> | undefined} onChanged={refresh} />}
        {path === "build" && !selectingPath && <CrossroadsPathB ideaId={activeIdeaId} initial={phase5Data?.pathB as Record<string, unknown> | undefined} formationContext={phase3Data?.formationGenerator as Record<string, unknown> | undefined} onChanged={refresh} />}

        {/* Derived completion gate */}
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard/creator")}><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Button>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : path === "build" && computed?.phase6.status !== "locked" ? (
            <Button onClick={() => router.push("/dashboard/creator/investors")} className="gap-2">Continue to Matchmaking <ArrowRight className="h-4 w-4" /></Button>
          ) : path === "sell" && computed?.phase5.status === "completed" ? (
            <Badge className="bg-success-light text-success-text">Listing live — you remain a Creator</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Complete your chosen path to continue.</span>
          )}
        </div>
      </main>
    </div>
  );
}
