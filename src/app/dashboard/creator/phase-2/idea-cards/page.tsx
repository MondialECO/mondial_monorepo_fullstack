"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { mapGeneratedIdeas } from "@/lib/creator/map-generated-ideas";
import type { UiConcept } from "@/lib/creator/map-generated-ideas";

// One concept card, styled to the Figma "Article - Card". Selected → primary
// border + soft shadow, and the "Got My Idea" button flips to filled primary.
function ConceptCard({ concept, isSelected, onSelect, onConfirm }: { concept: UiConcept; isSelected: boolean; onSelect: () => void; onConfirm: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="w-full flex flex-col gap-6 rounded-2xl border p-[17px] cursor-pointer transition-all"
      style={{
        backgroundColor: "var(--card)",
        borderColor: isSelected ? "var(--primary)" : "var(--card-edge)",
        boxShadow: isSelected ? "0 0 22px rgba(0,0,0,0.06)" : undefined,
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          {/* Title + tags + score */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <span className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{concept.title}</span>
              <div className="flex flex-wrap gap-2">
                <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: "var(--muted)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--stroke-10)", color: "var(--muted-foreground)" }}>
                  {concept.category}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between self-stretch gap-2 shrink-0">
              <div className="rounded-full flex items-center justify-center" style={{ width: 39, height: 38, backgroundColor: "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)" }}>
                <span className="text-base font-semibold" style={{ color: "var(--primary)" }}>{concept.score}</span>
              </div>
              <span className="text-xs font-medium text-right" style={{ color: "var(--primary)" }}>Clarity Score</span>
            </div>
          </div>
          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{concept.description}</p>
        </div>

        {/* Metrics */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex-1" style={{ color: "var(--muted-foreground)" }}>Market Size (TAM)</span>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>{concept.tam}</span>
          </div>
          <div className="h-1 rounded-xl w-full overflow-hidden" style={{ backgroundColor: "var(--stroke-10)" }}>
            <div className="h-full rounded-xl" style={{ width: "70%", backgroundColor: "var(--primary)" }} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--muted-foreground)" }}>Competitor Saturation</span>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>{concept.saturation}</span>
          </div>
        </div>
      </div>

      {/* Footer — select on first click, confirm (proceed) when already selected */}
      <div className="flex flex-col gap-3">
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Similar to: {concept.similarTo}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (isSelected) onConfirm(); else onSelect(); }}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors"
          style={{
            backgroundColor: isSelected ? "var(--primary)" : "var(--muted)",
            borderWidth: isSelected ? "0" : "1px",
            borderStyle: "solid",
            borderColor: "var(--border)",
            color: isSelected ? "var(--primary-foreground)" : "var(--muted-foreground)",
          }}
        >
          Got My Idea
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

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
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-10">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>Synthesis result</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full pl-2 pr-3 py-1" style={{ backgroundColor: "var(--secondary)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)" }}>
              <CheckCircle2 className="w-3 h-3" style={{ color: "var(--primary)" }} />
              <span className="text-[11px] font-medium" style={{ color: "var(--primary)" }}>Analysis Complete</span>
            </span>
          </div>
          <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
            AI synthesis of your inputs. Concepts optimized for validation.
          </p>
        </div>

        {/* Loading state — fetching the AI session */}
        {hydrating && concepts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ color: "var(--muted-foreground)" }}>
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--primary)" }} />
            <p className="text-sm font-semibold">Loading your generated concepts…</p>
          </div>
        )}

        {/* Empty state — no concepts and nothing in flight */}
        {!hydrating && concepts.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)" }}>
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>No concepts to show</h3>
              <p className="text-sm max-w-md" style={{ color: "var(--muted-foreground)" }}>
                We couldn&apos;t load generated concepts for this session. Head back to Discovery to generate a fresh set.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/creator/phase-2/discovery")}
              className="rounded-xl px-6 py-5 text-sm font-semibold flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Discovery
            </Button>
          </div>
        )}

        {/* Concept Cards */}
        {concepts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {concepts.map((concept) => (
              <ConceptCard
                key={concept.id}
                concept={concept}
                isSelected={selected === concept.id}
                onSelect={() => handleSelect(concept.id)}
                onConfirm={handleConfirm}
              />
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/creator/phase-2/discovery")}
              className="inline-flex items-center gap-2 py-3 text-base font-medium transition-colors"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ArrowLeft className="w-5 h-5" />
              Edit Inputs
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium transition-colors"
              style={{ color: "var(--primary)" }}
            >
              None of this — describe your new idea
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          {/* Selection-save failure — visible, non-blocking (confirm carries the id explicitly). */}
          {selectSaveError && <p className="text-xs text-center" style={{ color: "var(--destructive)" }}>{selectSaveError}</p>}
        </div>
      </div>

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
