"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

export default function IdeaSummaryPage() {
  const router = useRouter();
  const { state, setState, refetch } = useCreatorProgress();
  const [isLoading, setIsLoading] = useState(true);

  // Sync with backend, but don't block rendering if we have local data
  useEffect(() => {
    (async () => {
      // If we already have data from clarifier, show it immediately
      const hasLocalData = state.project?.concept && (state.project?.clarityScore ?? 0) > 0;
      if (hasLocalData) {
        setIsLoading(false);
      } else {
        // Otherwise wait for refetch from backend
        await refetch();
        setIsLoading(false);
      }
    })();
  }, [refetch, state.project?.concept, state.project?.clarityScore]);

  const project = state.project ?? {};
  const entryPath = state.journeyState?.phase2?.selectedEntryPath;

  // Use only real project data — no fallback strings
  const conceptVal = project.concept ?? "";
  const targetUserVal = project.targetUser ?? "";
  const problemVal = project.problem ?? "";
  const solutionVal = project.solution ?? "";
  const marketGapVal = project.marketGap ?? "";
  const edgeVal = project.creatorEdge ?? "";
  const clarityScore = project.clarityScore ?? 0;

  // Check if we have required data
  const hasData = conceptVal && clarityScore > 0;

  // Synthesis progression label
  const progressionLabel =
    clarityScore >= 85 ? "Sharp" : clarityScore >= 50 ? "Developing" : "Vague";
  const progressionPercent =
    clarityScore >= 85 ? 100 : clarityScore >= 50 ? 66 : 33;

  const canvasItems = [
    { title: "CONCEPT", value: conceptVal },
    { title: "TARGET USER", value: targetUserVal },
    { title: "CORE PROBLEM", value: problemVal },
    { title: "YOUR SOLUTION", value: solutionVal },
    { title: "MARKET GAP", value: marketGapVal },
    { title: "YOUR EDGE", value: edgeVal },
  ];

  const handleRevisit = () => {
    if (entryPath === "already_have_idea") {
      router.push("/dashboard/creator/phase-2/clarifier");
    } else {
      router.push("/dashboard/creator/phase-2/idea-cards");
    }
  };

  const handleContinue = () => {
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase2: {
          ...prev.journeyState.phase2,
          currentStep: 8,
        },
      },
    }));
    router.push("/dashboard/creator/phase-2/concept-name");
  };

  // Ring geometry (drawn as vector — the design exports it as an image).
  const ringR = 44;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - clarityScore / 100);

  return (
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-[768px] px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading your idea summary…</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && !hasData && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "color-mix(in srgb, var(--destructive) 12%, transparent)", color: "var(--destructive)" }}
            >
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>No idea summary available</h3>
              <p className="text-sm max-w-md" style={{ color: "var(--muted-foreground)" }}>
                Complete the idea selection and confirmation steps to generate a summary.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/creator/phase-2")}
              className="rounded-xl px-6 py-5 text-sm font-semibold flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Phase 2
            </Button>
          </div>
        )}

        {/* ── Summary ── */}
        {!isLoading && hasData && (
          <div className="flex flex-col gap-8">

            {/* ── Header block ── */}
            <div className="flex flex-col gap-2">
              <div
                className="inline-flex self-start items-center gap-1.5 rounded-full pr-3 py-1"
              >
                <span
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: "var(--primary)",
                    border: "2px solid color-mix(in srgb, var(--primary) 50%, transparent)",
                  }}
                />
                <span className="text-[11px] font-medium" style={{ color: "var(--primary)" }}>
                  Synthesis Complete
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
                Your Idea - First draft.
              </h1>
              <p className="text-base max-w-[548px]" style={{ color: "var(--muted-foreground)" }}>
                Extracted from your own insights. AI provided the structure — the ownership is yours.
              </p>
            </div>

            {/* ── Summary card (grid + metrics) ── */}
            <div
              className="rounded-2xl border shadow-sm p-4 sm:p-6 flex flex-col gap-6"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
            >
              {/* Detail grid — 3 columns, stacks below sm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {canvasItems.map((block) => (
                  <div
                    key={block.title}
                    className="rounded-xl border px-4 py-3 flex flex-col gap-1.5"
                    style={{ backgroundColor: "var(--popover)", borderColor: "var(--stroke-10)" }}
                  >
                    <span className="text-[13px] font-medium uppercase tracking-wide" style={{ color: "var(--foreground)" }}>
                      {block.title}
                    </span>
                    <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                      {block.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Metrics card */}
              <div
                className="rounded-xl border flex flex-col md:flex-row overflow-hidden"
                style={{ backgroundColor: "var(--popover)", borderColor: "var(--stroke-10)" }}
              >
                {/* Left: clarity score */}
                <div
                  className="flex flex-col items-center justify-center gap-4 p-5 sm:p-7 shrink-0 border-b md:border-b-0 md:border-r"
                  style={{ borderColor: "var(--stroke-10)" }}
                >
                  <span className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                    iDeal Clarity Score
                  </span>
                  <div className="relative" style={{ width: 100, height: 100 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r={ringR} fill="none" strokeWidth="8" stroke="var(--muted)" />
                      <circle
                        cx="50"
                        cy="50"
                        r={ringR}
                        fill="none"
                        strokeWidth="8"
                        stroke="var(--primary)"
                        strokeLinecap="round"
                        strokeDasharray={ringC}
                        strokeDashoffset={ringOffset}
                        transform="rotate(-90 50 50)"
                        style={{ transition: "stroke-dashoffset 700ms ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-medium tabular-nums" style={{ color: "var(--foreground)" }}>
                        {clarityScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" style={{ color: "var(--p8-green)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--p8-green)" }}>
                      Ready For Naming
                    </span>
                  </div>
                </div>

                {/* Right: synthesis progression + stats */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-5 p-5 sm:p-7">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span style={{ color: "var(--muted-foreground)" }}>Synthesis Progression</span>
                      <span className="font-semibold" style={{ color: "var(--primary)" }}>{progressionLabel}</span>
                    </div>
                    {/* Progression bar */}
                    <div className="h-2 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--stroke-10)" }}>
                      <div
                        className="h-full rounded-xl transition-all duration-700 ease-out"
                        style={{ width: `${progressionPercent}%`, backgroundColor: "var(--primary)" }}
                      />
                    </div>
                    {/* Axis labels */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex-1" style={{ color: "var(--muted-foreground)" }}>Vague</span>
                      <span className="flex-1 text-center" style={{ color: "var(--primary)" }}>Developing</span>
                      <span className="flex-1 text-right" style={{ color: "var(--p8-green)" }}>Sharp</span>
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="flex gap-3">
                    <div
                      className="flex-1 min-w-0 rounded-lg border p-3 flex flex-col gap-2"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--stroke-10)" }}
                    >
                      <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>AI confidence</span>
                      <span className="text-base font-semibold text-center tabular-nums" style={{ color: "var(--foreground)" }}>89.4%</span>
                    </div>
                    <div
                      className="flex-1 min-w-0 rounded-lg border p-3 flex flex-col gap-2"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--stroke-10)" }}
                    >
                      <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>Latency</span>
                      <span className="text-base font-semibold text-center tabular-nums" style={{ color: "var(--foreground)" }}>89.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Continue CTA (pill-in-pill) ── */}
            <div className="rounded-full p-2" style={{ backgroundColor: "var(--card)" }}>
              <Button
                onClick={handleContinue}
                className="w-full rounded-full px-6 py-6 text-base font-medium flex items-center justify-center gap-2"
              >
                Looks Good - Continue
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
