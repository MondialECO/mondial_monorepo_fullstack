"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowLeft, ArrowRight, Check, RefreshCw, BarChart2, ShieldAlert, Award, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { mapGeneratedIdeas } from "@/lib/creator/map-generated-ideas";
import type { UiConcept } from "@/lib/creator/map-generated-ideas";

export default function IdeaCardsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");
  // The idea this Discovery run belongs to (carried from initiation via the URL).
  const ideaId = params.get("idea");
  const { state, setState, resetJourney } = useCreatorProgress();
  const [selected, setSelected] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  // Selection-save failure: NOT a blocker (idea-confirm passes the concept id
  // explicitly), but it must be visible — a refresh would lose the selection.
  const [selectSaveError, setSelectSaveError] = useState<string | null>(null);

  const concepts: UiConcept[] = state.journeyState?.phase2?.generatedConcepts ?? [];

  useEffect(() => {
    if (state.journeyState?.phase2?.selectedConceptId) {
      setSelected(state.journeyState.phase2.selectedConceptId);
    }
  }, [state]);

  // Source of truth is the AI session. If local state is empty (fresh load, reload,
  // or direct navigation), fetch + map the generated ideas from the backend.
  useEffect(() => {
    const existing = state.journeyState?.phase2?.generatedConcepts;
    if ((existing && existing.length) || !sessionId) return;
    let cancelled = false;
    setHydrating(true);
    creatorAiApi
      .getIdeaGeneration(sessionId)
      .then((session) => {
        if (cancelled || session.status !== "Completed") return;
        const mapped = mapGeneratedIdeas(session.output?.ideas ?? [], session.input?.sectors ?? []);
        if (!mapped.length) return;
        setState((prev) => ({
          ...prev,
          journeyState: {
            ...prev.journeyState,
            phase2: { ...prev.journeyState.phase2, generatedConcepts: mapped },
          },
        }));
      })
      .catch(() => {
        /* network/parse failure — empty state below offers a retry path */
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleSelect = (id: string) => {
    setSelected(id);
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase2: {
          ...prev.journeyState.phase2,
          selectedConceptId: id,
        },
      },
    }));

    // Persist selected concept ID to the ORIGINATING idea (URL-carried) — a
    // switch in another tab must not redirect this write to a different idea.
    setSelectSaveError(null);
    void creatorJourneyApi.saveSelectedConceptId(id, ideaId ?? undefined)
      .then(() => setSelectSaveError(null))
      .catch(() => {
        setSelectSaveError("Your selection couldn't be saved — click the card again to retry. You can still continue; a refresh would lose the selection.");
      });
  };

  const handleConfirm = () => {
    if (!selected) return;
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase2: {
          ...prev.journeyState.phase2,
          currentStep: 5,
        },
      },
    }));
    router.push(`/dashboard/creator/phase-2/idea-confirm?${sessionId ? `session=${sessionId}&` : ""}${ideaId ? `idea=${ideaId}` : ""}`);
  };

  const handleCreateNew = () => {
    resetJourney();
    setShowConfirmReset(false);
    router.push("/dashboard/creator/phase-2");
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      {/* <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/phase-2/discovery")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — Idea Candidates
        </div>
      </header> */}

      {/* Progress Bar (35% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "35%" }} />
      </div>

      <main className="flex-1 max-w-[1140px] mx-auto w-full px-6 py-10 space-y-8">
        
        {/* Title and Top Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-primary uppercase tracking-wider">Synthesis Result</div>
            <h1 className="text-3xl font-extrabold tracking-tight">Analysis Complete</h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              AI synthesis based on your inputs. Concepts are optimized for validation. Select the one that matches your vision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/creator/phase-2/discovery")}
              className="rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Edit Inputs
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowConfirmReset(true)}
              className="rounded-xl text-xs font-bold px-4 py-2 hover:bg-destructive/10 hover:text-destructive"
            >
              Create New
            </Button>
          </div>
        </div>

        {/* Loading state — fetching the AI session */}
        {hydrating && concepts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-semibold">Loading your generated concepts…</p>
          </div>
        )}

        {/* Empty state — no concepts and nothing in flight */}
        {!hydrating && concepts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No concepts to show</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                We couldn&apos;t load generated concepts for this session. Head back to Discovery to generate a fresh set.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/creator/phase-2/discovery")}
              className="rounded-xl px-6 py-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Back to Discovery
            </Button>
          </div>
        )}

        {/* Concept Cards Grid */}
        {concepts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {concepts.map((concept) => {
            const isSelected = selected === concept.id;
            return (
              <Card
                key={concept.id}
                onClick={() => handleSelect(concept.id)}
                className={`flex flex-col justify-between rounded-2xl border p-6 text-left transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5 -translate-y-0.5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <CardContent className="p-0 flex flex-col justify-between h-full min-h-[300px] space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-primary/10 border border-primary/20 text-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {concept.category}
                      </span>
                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {concept.title}
                      </h3>
                      <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {concept.description}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Panel */}
                  <div className="space-y-2.5 border-t border-border pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
                        <Award className="h-4 w-4 text-primary" /> Viability Score
                      </span>
                      <span className="font-bold text-foreground">{concept.score}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
                        <BarChart2 className="h-4 w-4 text-primary" /> Market Size (TAM)
                      </span>
                      <span className="font-bold text-foreground">{concept.tam}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
                        <ShieldAlert className="h-4 w-4 text-primary" /> Competitor Saturation
                      </span>
                      <span className="font-bold text-foreground">{concept.saturation}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
                        Similar to
                      </span>
                      <span className="font-medium text-foreground italic"> {concept.similarTo}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}

        {/* Bottom Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
          <div className="text-xs text-muted-foreground">
            None of these?{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-primary font-bold inline-flex items-center gap-0.5 hover:underline"
              onClick={() => router.push("/dashboard/creator/phase-2/discovery")}
            >
              Describe your own idea
            </Button>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={!selected}
            className="rounded-xl px-6 py-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2 disabled:opacity-40"
          >
            Choose This Idea
            <ArrowRight className="h-4 w-4" />
          </Button>
          {/* Selection-save failure — visible, non-blocking (confirm carries the id explicitly). */}
          {selectSaveError && <p className="text-xs text-destructive text-center">{selectSaveError}</p>}
        </div>

      </main>

      {/* Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border border-border bg-card p-6 shadow-xl space-y-4 rounded-2xl">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-extrabold text-lg">Start over with a new idea?</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              This will discard your current inputs and generated concepts. This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreateNew}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/95 text-white font-bold"
              >
                Discard & Start Over
              </Button>
              <Button
                onClick={() => setShowConfirmReset(false)}
                variant="outline"
                className="flex-1 rounded-xl font-bold border-border"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
