"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Brain, Cpu, BarChart3, Network, CheckCircle2, AlertTriangle } from "lucide-react";
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
  { icon: Brain, label: "Market Collaboration", delay: 0 },
  { icon: Network, label: "Pattern Recognition", delay: 2500 },
  { icon: BarChart3, label: "Competitor Analysis", delay: 4500 },
  { icon: Cpu, label: "Concept Synthesis", delay: 6000 },
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

  return (
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-[600px] px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center gap-12 text-center">
        {saveError ? (
          /* Generation SUCCEEDED, persistence failed — retry saves from memory. */
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)" }}>
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>Concepts generated — saving failed</h1>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--muted-foreground)" }}>{saveError}</p>
            </div>
            <Button
              onClick={() => {
                const pending = pendingSaveRef.current;
                if (pending) void persistAndProceed(pending.concepts, pending.navSessionId);
              }}
              className="rounded-xl px-6 py-5 text-sm font-semibold"
            >
              Retry saving
            </Button>
          </div>
        ) : error ? (
          /* Failure state — generation failed, timed out, or credits exhausted */
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)" }}>
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>Concept synthesis failed</h1>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--muted-foreground)" }}>{error}</p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/creator/phase-2/discovery")}
              className="rounded-xl px-6 py-5 text-sm font-semibold"
            >
              Back to Discovery
            </Button>
          </div>
        ) : (
          <>
            <div className="w-full max-w-[468px] flex flex-col items-center gap-8">
              {/* Heading */}
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
                  {done ? "Synthesis Complete!" : `Synthesizing venture Concepts${dots}`}
                </h1>
                <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
                  Our Project Intelligence engine cross-references your observations with global trends.
                </p>
              </div>

              {/* Illustration — DELIBERATE raster artwork exception to the lucide-only rule
                  (the library has no equivalent AI-head illustration). 456x456 native,
                  rendered at 174px. Source: exported from Figma. */}
              <Image src="/icons/phase2/digital-ai-green.png" alt="" width={174} height={174} className="object-contain" aria-hidden />

              {/* Synthesis progress card */}
              <div className="w-full rounded-xl border p-6 flex flex-col gap-5" style={{ backgroundColor: "var(--card)", borderColor: "var(--primary)" }}>
                <span className="text-center text-base" style={{ color: "var(--muted-foreground)" }}>SYNTHESIS PROGRESS</span>
                <div className="flex flex-col gap-4">
                  {PROCESSING_STAGES.map((stage, i) => {
                    const isActive = i === activeStage && !done;
                    const isDone = i < activeStage || done;
                    return (
                      <div key={stage.label} className={`flex items-center gap-2 ${!isDone && !isActive ? "opacity-40" : ""}`}>
                        {isActive ? (
                          <span className="rounded-full shrink-0 flex items-center justify-center" style={{ width: 12, height: 12, borderWidth: "2px", borderStyle: "solid", borderColor: "var(--primary)" }}>
                            <span className="rounded-full" style={{ width: 5, height: 5, backgroundColor: "var(--primary)" }} />
                          </span>
                        ) : (
                          <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                        )}
                        <span className="flex-1 text-left text-xs" style={{ color: isActive ? "var(--primary)" : "var(--foreground)" }}>
                          {stage.label}
                        </span>
                        <span className="text-xs" style={{ color: isActive ? "var(--primary)" : isDone ? "var(--muted-foreground)" : "var(--dr-yellow)" }}>
                          {isDone ? "100%" : isActive ? "Processing..." : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pro tip */}
            <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              <span className="font-semibold">Pro tip </span>: Mondial OS analyzes over 10M+ data points to ensure every venture path is backed by real-world market demand.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
