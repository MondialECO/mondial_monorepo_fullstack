"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Target, KeyRound, Users, Lightbulb, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-8">

        {!concept ? (
          /* Empty state — no concept selected */
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)" }}>
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>No concept selected</h3>
              <p className="text-sm max-w-md" style={{ color: "var(--muted-foreground)" }}>
                Go back to the candidates page and select an idea to continue.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/creator/phase-2/idea-cards")}
              className="rounded-xl px-6 py-5 text-sm font-semibold flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Candidates
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>{concept.title}</h1>
              <p className="text-base" style={{ color: "var(--muted-foreground)" }}>{concept.description}</p>
            </div>

            {/* Canvas panel */}
            <div className="rounded-2xl border shadow-sm p-4 sm:p-6" style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}>
              <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* LEFT: concept canvas */}
                <div className="w-full lg:flex-1 min-w-0 rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--popover)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between px-5 py-5 border-b" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" style={{ color: "var(--foreground)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>CONCEPT CANVAS</span>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Target, label: "Core Value Proposition", text: concept.description },
                      { icon: KeyRound, label: "Key Strategic Levers", text: concept.founderEdge?.trim() },
                      { icon: Users, label: "Target Customer Segment", text: concept.targetUser },
                      { icon: Lightbulb, label: "Proposed Solution", text: concept.solution },
                    ].map(({ icon: Icon, label, text }) => (
                      <div key={label} className="rounded-xl border p-4 flex flex-col gap-3" style={{ backgroundColor: "var(--card)", borderColor: "var(--stroke-10)" }}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 shrink-0" style={{ color: "var(--primary)" }} />
                          <span className="text-[13px] font-medium uppercase" style={{ color: "var(--foreground)" }}>{label}</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                          {text || <span className="italic">Not specified</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: intelligence column */}
                <div className="w-full lg:w-[363px] shrink-0 flex flex-col gap-4">
                  <div className="flex gap-3">
                    {/* Clarity score */}
                    <div className="flex-1 min-w-0 rounded-xl border flex flex-col items-center justify-center gap-4 px-3 py-5" style={{ backgroundColor: "var(--popover)", borderColor: "var(--stroke-10)" }}>
                      <span className="text-[13px] font-medium text-center" style={{ color: "var(--foreground)" }}>CLARITY SCORE</span>
                      <div className="relative" style={{ width: 100, height: 100 }}>
                        <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
                          <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" stroke="var(--muted)" />
                          <circle
                            cx="50" cy="50" r="44" fill="none" strokeWidth="8" stroke="var(--primary)" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 44}
                            strokeDashoffset={2 * Math.PI * 44 * (1 - concept.score / 100)}
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-medium tabular-nums" style={{ color: "var(--foreground)" }}>{concept.score}</span>
                        </div>
                      </div>
                      <span className="text-[13px] font-medium text-center" style={{ color: "var(--foreground)" }}>Precision Rating</span>
                    </div>
                    {/* Market TAM */}
                    <div className="flex-1 min-w-0 rounded-xl border flex flex-col items-center justify-center gap-4 px-3 py-5 text-center" style={{ backgroundColor: "var(--popover)", borderColor: "var(--stroke-10)" }}>
                      <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>MARKET TAM</span>
                      <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{concept.tam}</span>
                      <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>Estimated</span>
                    </div>
                  </div>
                  {/* Metrics box */}
                  <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--popover)", borderColor: "var(--border)" }}>
                    <div className="rounded-lg px-4 py-3 flex flex-col gap-4 text-sm" style={{ backgroundColor: "var(--card)" }}>
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--muted-foreground)" }}>Competitor Saturation</span>
                        <span className="font-semibold" style={{ color: "var(--foreground)" }}>{concept.saturation}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--muted-foreground)" }}>Comparable Company</span>
                        <span className="font-semibold" style={{ color: "var(--foreground)" }}>{concept.similarTo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom pill bar */}
            <div className="flex flex-col gap-2">
              <div className="rounded-full flex flex-wrap items-center justify-between gap-2 p-2" style={{ backgroundColor: "var(--card)" }}>
                <button
                  type="button"
                  disabled={finalizing}
                  onClick={() => router.push("/dashboard/creator/phase-2/idea-cards")}
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium disabled:opacity-50"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <ArrowLeft className="w-5 h-5" /> Change My idea
                </button>
                <Button
                  onClick={handleConfirm}
                  disabled={finalizing}
                  className="rounded-full px-6 py-3 h-auto text-base font-medium flex items-center gap-2 disabled:opacity-60"
                >
                  {finalizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Confirming…
                    </>
                  ) : (
                    <>
                      {confirmError ? "Try again" : "Let's Go - Name My project"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
              {confirmError && <p className="text-xs text-center sm:text-right" style={{ color: "var(--destructive)" }}>{confirmError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
