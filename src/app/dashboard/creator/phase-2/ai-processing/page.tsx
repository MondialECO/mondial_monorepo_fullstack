"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Brain, Cpu, BarChart3, Network, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { mapGeneratedIdeas } from "@/lib/creator/map-generated-ideas";
import { toAiError } from "@/lib/ai-errors";
import { useSignalRHub, hubEvent } from "@/lib/realtime";
import type { IdeaGenerationSession } from "@/types/creator/ai";
// Shared R12 AI-session poll policy (60 attempts / 3-minute wall-clock / 2500ms).
import {
  POLL_INTERVAL_MS,
  POLL_MAX_ATTEMPTS,
  POLL_MAX_MS,
} from "@/hooks/queries/creator-ai";

const PROCESSING_STAGES = [
  { icon: Brain, label: "Market calibration", delay: 0 },
  { icon: Network, label: "Pattern recognition", delay: 2500 },
  { icon: BarChart3, label: "Competitor analysis", delay: 4500 },
  { icon: Cpu, label: "Concept synthesis", delay: 6000 },
];

export default function AIProcessingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session");
  // The idea this generation was STARTED for (captured at initiation on the
  // discovery form). Writes below are scoped to it — never to live active state.
  const ideaId = params.get("idea");
  const { setState } = useCreatorProgress();
  const [activeStage, setActiveStage] = useState(0);
  const [done, setDone] = useState(false);
  const [dots, setDots] = useState(".");
  const [error, setError] = useState<string | null>(null);
  // Generation SUCCEEDED but persisting the concepts failed — distinct from a
  // generation failure: retrying re-saves from memory, never regenerates.
  const [saveError, setSaveError] = useState<string | null>(null);
  const [poke, setPoke] = useState(0); // bumped by SignalR to trigger an immediate poll

  const settledRef = useRef(false); // complete/fail exactly once
  const pendingSaveRef = useRef<{ concepts: ReturnType<typeof mapGeneratedIdeas>; navSessionId: string } | null>(null);
  const attemptsRef = useRef(0);

  // Animated ellipsis
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 400);
    return () => clearInterval(id);
  }, []);

  // Decorative stage cycling while the real job runs.
  useEffect(() => {
    if (done || error) return;
    const id = setInterval(() => setActiveStage((s) => (s + 1) % PROCESSING_STAGES.length), 1500);
    return () => clearInterval(id);
  }, [done, error]);

  // Persist + navigate. BLOCKING on the save: finalize-discovery resolves the
  // chosen concept from the PERSISTED GeneratedConcepts, so proceeding past a
  // failed save guarantees a dead-end 404 at confirm. On failure the generated
  // output stays safe in the AI session — Retry re-saves without regenerating.
  const persistAndProceed = useCallback(
    async (concepts: ReturnType<typeof mapGeneratedIdeas>, navSessionId: string) => {
      setSaveError(null);
      try {
        await creatorJourneyApi.saveGeneratedConcepts(concepts, ideaId ?? undefined);
      } catch {
        pendingSaveRef.current = { concepts, navSessionId };
        setSaveError("Your concepts were generated, but saving them failed. Retry to continue — nothing needs regenerating.");
        return;
      }
      setActiveStage(PROCESSING_STAGES.length - 1);
      setDone(true);
      setTimeout(() => router.push(`/dashboard/creator/phase-2/idea-cards?session=${navSessionId}${ideaId ? `&idea=${ideaId}` : ""}`), 900);
    },
    [router, ideaId],
  );

  const handleCompleted = useCallback(
    (session: IdeaGenerationSession) => {
      if (settledRef.current) return;
      settledRef.current = true;
      const concepts = mapGeneratedIdeas(session.output?.ideas ?? [], session.input?.sectors ?? []);
      setState((prev) => ({
        ...prev,
        journeyState: {
          ...prev.journeyState,
          phase2: { ...prev.journeyState.phase2, generatedConcepts: concepts, currentStep: 4 },
        },
      }));

      void persistAndProceed(concepts, session.sessionId);
    },
    [setState, persistAndProceed],
  );

  const handleFailed = useCallback((msg: string) => {
    if (settledRef.current) return;
    settledRef.current = true;
    setError(msg);
  }, []);

  // One poll tick — fetch + act on terminal status.
  const poll = useCallback(async () => {
    if (settledRef.current || !sessionId) return;
    try {
      const session = await creatorAiApi.getIdeaGeneration(sessionId);
      if (session.status === "Completed") {
        handleCompleted(session);
      } else if (session.status === "Failed" || session.status === "NeedsReview") {
        handleFailed(session.errorMessage || "We couldn't generate concepts this time. Please try again.");
      }
    } catch (err) {
      // Credits exhausted is terminal; everything else is transient → keep polling.
      const aiErr = toAiError(err);
      if (aiErr.kind === "credits") handleFailed(aiErr.message);
    }
  }, [sessionId, handleCompleted, handleFailed]);

  // Polling loop — shared R12 policy: 2500ms interval, capped at POLL_MAX_ATTEMPTS
  // or POLL_MAX_MS (wall-clock), whichever comes first. Values are the shared
  // constants in creator-ai.ts (kept above the backend worst case so we never
  // abandon a job that still succeeds).
  useEffect(() => {
    if (!sessionId) {
      setError("Missing session. Please restart discovery.");
      return;
    }
    const startTime = Date.now();
    void poll();
    const id = setInterval(() => {
      if (settledRef.current) {
        clearInterval(id);
        return;
      }
      attemptsRef.current += 1;
      if (attemptsRef.current >= POLL_MAX_ATTEMPTS || Date.now() - startTime >= POLL_MAX_MS) {
        clearInterval(id);
        handleFailed("This is taking longer than expected. Please try again.");
        return;
      }
      void poll();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sessionId, poll, handleFailed]);

  // SignalR accelerator — AI-job events bump a poke; the effect below polls at once.
  useSignalRHub("notifications", {
    enabled: !!sessionId,
    events: [
      hubEvent("AiJobCompleted", () => setPoke((p) => p + 1)),
      hubEvent("AiJobUpdate", () => setPoke((p) => p + 1)),
    ],
  });

  useEffect(() => {
    if (poke > 0) void poll();
  }, [poke, poll]);

  const progress = done || error ? 100 : Math.min(Math.round(((activeStage + 1) / PROCESSING_STAGES.length) * 100), 95);

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
          Phase 2 of 6 — Processing
        </div>
      </header> */}

      {/* Progress Bar (Simulated Synthesis progression) */}
      <div className="h-[3px] w-full bg-muted">
        <div
          className={`h-full transition-all duration-700 ease-out ${error ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-16 max-w-2xl mx-auto w-full text-center">
        {saveError ? (
          /* Generation SUCCEEDED, persistence failed — retry saves from memory. */
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-destructive/10 text-destructive">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Concepts generated — saving failed</h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{saveError}</p>
            </div>
            <Button
              onClick={() => {
                const pending = pendingSaveRef.current;
                if (pending) void persistAndProceed(pending.concepts, pending.navSessionId);
              }}
              className="rounded-xl px-6 py-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95"
            >
              Retry saving
            </Button>
          </div>
        ) : error ? (
          /* Failure state — generation failed, timed out, or credits exhausted */
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-destructive/10 text-destructive">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Concept synthesis failed</h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/creator/phase-2/discovery")}
              className="rounded-xl px-6 py-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95"
            >
              Back to Discovery
            </Button>
          </div>
        ) : (
          <>
            {/* Animated Orbs */}
            <div className="relative flex items-center justify-center mb-10">
              {!done && (
                <>
                  <span className="absolute w-44 h-44 rounded-full border border-primary/10 animate-ping duration-2000" />
                  <span className="absolute w-32 h-32 rounded-full border border-primary/20 animate-ping duration-1500" />
                </>
              )}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                done ? "bg-green-500 text-white" : "bg-primary text-primary-foreground animate-pulse"
              }`}>
                {done ? <CheckCircle2 className="w-10 h-10" /> : <Brain className="w-10 h-10" />}
              </div>
            </div>

            {/* Copywriting */}
            <div className="space-y-4 mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {done ? "Synthesis Complete!" : `Synthesizing venture concepts${dots}`}
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Our Project Intelligence engine cross-references your observations with global trends. Mondial analyzes market signals to ensure each venture path is grounded in real-world demand.
              </p>
            </div>

            {/* Synthesis Steps List */}
            <div className="w-full max-w-sm space-y-3">
              {PROCESSING_STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isActive = i === activeStage && !done;
                const isDone = i < activeStage || done;
                return (
                  <div
                    key={stage.label}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
                      isDone
                        ? "border-green-200 dark:border-green-950 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                        : isActive
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card/40 opacity-40 text-muted-foreground"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDone
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-bold flex-1 text-left">
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
