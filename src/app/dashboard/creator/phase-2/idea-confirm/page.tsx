"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Sparkles, ArrowLeft, ArrowRight, Target, Compass, Heart, Rocket, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { toAiError } from "@/lib/ai-errors";

export default function IdeaConfirmPage() {
  const router = useRouter();
  const params = useSearchParams();
  // The idea this Discovery run was initiated for (URL-carried through the chain).
  const flowIdeaId = params.get("idea");
  const { state, setState, isLoading, error, refetch } = useCreatorProgress();
  const [finalizing, setFinalizing] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const selectedConceptId = state.journeyState?.phase2?.selectedConceptId;
  const concepts = state.journeyState?.phase2?.generatedConcepts ?? [];
  const concept = concepts.find((c) => c.id === selectedConceptId);

  const handleConfirm = async () => {
    if (!concept || finalizing) return;
    setConfirmError(null);

    // GUARD: finalize-discovery converges on the ACTIVE idea server-side (mint/
    // converge semantics — it ignores explicit ids). If the active idea changed
    // since this Discovery run started, confirming would map the concept onto the
    // WRONG idea — block with an honest message instead of silently converging.
    if (flowIdeaId && state.activeIdeaId && flowIdeaId !== state.activeIdeaId) {
      setConfirmError("This discovery belongs to a different idea. Switch back to it in My Ideas, then confirm.");
      return;
    }

    setFinalizing(true);
    try {
      // Discovery skips the clarifier: the backend seeds a completed clarifier session
      // from this concept (satisfying the Phase 3 prerequisite) and maps it onto the
      // project. On success we go straight to the idea-summary → name → branding tail.
      const result = await creatorJourneyApi.finalizeDiscovery(concept.id);

      setState((prev) => ({
        ...prev,
        journeyState: {
          ...prev.journeyState,
          phase2: {
            ...prev.journeyState.phase2,
            clarifierSessionId: result.clarifierSessionId,
            currentStep: 7,
          },
        },
        project: {
          ...prev.project,
          ...(result.project || {}),
          exists: true,
        },
      }));

      router.push("/dashboard/creator/phase-2/idea-summary");
    } catch (err) {
      setConfirmError(toAiError(err).message);
      setFinalizing(false);
    }
  };

  // Gate AFTER all hooks (rules-of-hooks). While hydrating, show the spinner —
  // NOT the "No concept selected" empty state, which is a genuinely-absent state.
  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your idea...</p>
      </div>
    );
  }

  // Hydration failed — show an honest error/retry state, never empty data as if real.
  if (error) {
    return (
      <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen items-center justify-center gap-3">
        <p className="text-destructive text-sm">Couldn&apos;t load your data. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      {/* <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/phase-2/idea-cards")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — Confirm Idea
        </div>
      </header> */}

      {/* Progress Bar (42% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "42%" }} />
      </div>

      <main className="flex-1 max-w-[1140px] mx-auto w-full px-6 py-10 space-y-8">

        {/* Page title */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Venture Concept Canvas</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Idea Selected</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Review the synthesized canvas below and verify the strategic parameters before continuing to deep dive chats.
          </p>
        </div>

        {/* Empty state — no concept selected */}
        {!concept && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No concept selected</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Go back to the candidates page and select an idea to continue.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/creator/phase-2/idea-cards")}
              className="rounded-xl px-6 py-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Candidates
            </Button>
          </div>
        )}

        {/* 2 Column Details */}
        {concept && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Concept Details (Spans 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border-primary bg-primary/5 border-2 overflow-hidden shadow-md shadow-primary/5">
              <CardContent className="p-6 space-y-6">
                
                {/* Header info */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-4">
                  <div className="space-y-1">
                    <span className="rounded-full bg-primary/10 border border-primary/20 text-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {concept.category}
                    </span>
                    <h2 className="text-2xl font-extrabold">{concept.title}</h2>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Clarity Score</span>
                    <span className="text-3xl font-extrabold text-primary">{concept.score}%</span>
                  </div>
                </div>

                {/* Structured Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-primary" /> Core Value Proposition
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">{concept.description}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-primary" /> Key Strategic Levers
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      {concept.founderEdge?.trim() || <span className="text-muted-foreground italic">Not specified</span>}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-primary" /> Target Customer Segment
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">{concept.targetUser}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Rocket className="h-4 w-4 text-primary" /> Proposed Solution
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">{concept.solution}</p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Intelligence Panel (Spans 1/3) */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border-border bg-card sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm uppercase tracking-wider">Intelligence Panel</span>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <div className="space-y-1 flex justify-between items-center border-b border-border pb-2">
                    <span className="font-semibold text-muted-foreground text-xs">Market TAM</span>
                    <span className="font-bold text-foreground">{concept.tam}</span>
                  </div>

                  <div className="space-y-1 flex justify-between items-center border-b border-border pb-2">
                    <span className="font-semibold text-muted-foreground text-xs">Competitor Saturation</span>
                    <span className="font-bold text-foreground">{concept.saturation}</span>
                  </div>

                  <div className="space-y-1 flex justify-between items-center pb-2">
                    <span className="font-semibold text-muted-foreground text-xs">Comparable Company</span>
                    <span className="font-bold text-foreground italic">{concept.similarTo}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
                  Roadmap: Verify baseline value prop → Clarify target audience → Define brand & launch identity kit.
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
        )}

        {/* Action Panel */}
        {concept && (
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          {confirmError && (
            <p className="text-xs text-destructive text-center sm:text-right">{confirmError}</p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              variant="ghost"
              disabled={finalizing}
              className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
              onClick={() => router.push("/dashboard/creator/phase-2/idea-cards")}
            >
              Change My Idea
            </Button>

            <Button
              onClick={handleConfirm}
              disabled={finalizing}
              className="rounded-xl px-6 py-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2 disabled:opacity-60"
            >
              {finalizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  {confirmError ? "Try again" : "Confirm & continue"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
        )}

      </main>
    </div>
  );
}
