"use client";

import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

export default function IdeaSummaryPage() {
  const router = useRouter();
  const { state } = useCreatorProgress();

  const project = state.project;
  const entryPath = state.journeyState?.phase2?.selectedEntryPath;

  const conceptVal = project.concept || "A collaborative sustainability platform aligning local businesses with carbon offset programs.";
  const targetUserVal = project.targetUser || "Small shop owners and local entrepreneurs in emerging markets.";
  const problemVal = project.problem || "Businesses operate without any brand identity, losing credibility and customers to professional competitors.";
  const solutionVal = project.solution || "AI-generated complete brand kits in under 5 minutes, tailored to local business culture.";
  const marketGapVal = project.marketGap || "No AI-first solution exists that is hyper-localized for emerging market businesses.";
  const edgeVal = project.creatorEdge || "Founder's deep understanding of regional languages, aesthetics, and business culture.";
  const clarityScore = project.clarityScore || 72;

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
      router.push("/dashboard/creator/phase-2/ai-chat");
    }
  };

  const handleContinue = () => {
    router.push("/dashboard/creator/phase-2/concept-name");
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
      {/* ── HEADER ── */}
      <header className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6 py-3 shrink-0">
        <div />
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          <span className="hidden sm:inline">Phase 2 of 6 —</span> Idea Summary
        </div>
      </header>

      {/* ── PROGRESS BAR ── */}
      <div className="h-[3px] w-full bg-muted shrink-0">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: "60%" }} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-10">
        <div className="w-full max-w-[860px] space-y-6">

          {/* ── Title Section ── */}
          <div>
            <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Synthesis Complete
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Your Idea - First draft.
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
              Extracted from your own insights. AI provided the structure — the ownership is yours.
            </p>
          </div>

          {/* ── Canvas Grid (inside a card) ── */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {canvasItems.map((block) => (
                <div
                  key={block.title}
                  className="border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow duration-200"
                >
                  <span className="block text-[11px] font-bold text-foreground tracking-wide uppercase mb-1.5">
                    {block.title}
                  </span>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-3">
                    {block.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Analytics Panel (Clarity Score + Synthesis Progression) ── */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <div className="flex flex-col md:flex-row gap-6 md:gap-0 md:divide-x divide-border">

              {/* Left: Clarity Score */}
              <div className="flex flex-col items-center justify-center md:pr-8 shrink-0">
                <span className="text-xs font-bold text-foreground mb-3">iDeal Clarity Score</span>
                <div className="relative w-[120px] h-[120px] flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="text-primary transition-all duration-700 ease-out"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - clarityScore / 100)}
                    />
                  </svg>
                  <span className="absolute text-3xl font-extrabold text-foreground tabular-nums">
                    {clarityScore}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    Ready For Naming
                  </span>
                </div>
              </div>

              {/* Right: Synthesis Progression + Stats */}
              <div className="flex-1 md:pl-8 flex flex-col justify-center gap-5">
                {/* Synthesis Progression Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">Synthesis Progression</span>
                    <span className="text-xs font-bold text-primary">{progressionLabel}</span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{ width: `${progressionPercent}%` }}
                    />
                    {/* Knob indicator */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-card shadow-md transition-all duration-700 ease-out"
                      style={{ left: `calc(${progressionPercent}% - 8px)` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className={`text-[10px] font-semibold ${progressionLabel === "Vague" ? "text-primary" : "text-muted-foreground"}`}>Vague</span>
                    <span className={`text-[10px] font-semibold ${progressionLabel === "Developing" ? "text-primary" : "text-muted-foreground"}`}>Developing</span>
                    <span className={`text-[10px] font-semibold ${progressionLabel === "Sharp" ? "text-primary" : "text-muted-foreground"}`}>Sharp</span>
                  </div>
                </div>

                {/* Stat boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border rounded-xl p-3.5 bg-card">
                    <span className="block text-[10px] text-muted-foreground font-medium mb-0.5">
                      AI confidence
                    </span>
                    <span className="text-lg font-extrabold text-foreground tabular-nums">89.4%</span>
                  </div>
                  <div className="border border-border rounded-xl p-3.5 bg-card">
                    <span className="block text-[10px] text-muted-foreground font-medium mb-0.5">
                      Latency
                    </span>
                    <span className="text-lg font-extrabold text-foreground tabular-nums">89.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Continue Button ── */}
          <div className="flex justify-end pt-2 pb-4">
            <Button
              onClick={handleContinue}
              size="lg"
              className="rounded-full px-8 py-3 text-sm font-bold flex items-center gap-2 shadow-sm"
            >
              Looks Good - Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

    </div>
  );
}
