"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Brain, Cpu, BarChart3, Network, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

const PROCESSING_STAGES = [
  { icon: Brain, label: "Market calibration", delay: 0 },
  { icon: Network, label: "Pattern recognition", delay: 1500 },
  { icon: BarChart3, label: "Competitor analysis", delay: 3000 },
  { icon: Cpu, label: "Concept synthesis", delay: 4500 },
];

export default function AIProcessingPage() {
  const router = useRouter();
  const { state, setState } = useCreatorProgress();
  const [activeStage, setActiveStage] = useState(0);
  const [done, setDone] = useState(false);
  const [dots, setDots] = useState(".");

  // Animated ellipsis
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    return () => clearInterval(dotsInterval);
  }, []);

  // Stage progression & mock concept generation
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    PROCESSING_STAGES.forEach((stage, i) => {
      if (i === 0) return;
      timers.push(
        setTimeout(() => {
          setActiveStage(i);
        }, stage.delay)
      );
    });

    // Finish
    timers.push(
      setTimeout(() => {
        setDone(true);

        // Generate 3 unique concepts based on discovery inputs (or fallbacks)
        const inputs = state.journeyState?.phase2?.discoveryInputs;
        const selectedSectors = inputs?.sectors || ["tech"];
        const sectorName = selectedSectors[0] ? selectedSectors[0].toUpperCase() : "TECH";

        const mockConcepts = [
          {
            id: "concept-1",
            title: `Eco${sectorName.charAt(0) + sectorName.slice(1).toLowerCase()} Hub`,
            category: selectedSectors[0] || "Technology",
            description: "A collaborative sustainability platform aligning local businesses with carbon offset programs, featuring automated compliance tracking.",
            score: 87,
            tam: "$2.5B",
            saturation: "Low",
            similarTo: "Watershed",
            concept: "A carbon offset matching hub for local retail.",
            targetUser: "Small and medium business owners looking to go green.",
            coreProblem: "High cost and complexity of tracking carbon offsets.",
            solution: "A simple micro-offset engine that calculates footprints automatically.",
            marketGap: "Lack of localized carbon offset micro-transactions.",
            founderEdge: "Proprietary algorithm matching local green initiatives.",
          },
          {
            id: "concept-2",
            title: `${sectorName.charAt(0) + sectorName.slice(1).toLowerCase()}Sync CRM`,
            category: selectedSectors[1] || "Business Tools",
            description: "An AI-powered client interaction pipeline that auto-drafts updates, tracks milestones, and automates invoices.",
            score: 82,
            tam: "$4.1B",
            saturation: "Medium",
            similarTo: "HoneyBook",
            concept: "An automation first CRM for independent professionals.",
            targetUser: "Freelance developers, designers, and consultants.",
            coreProblem: "Wasted hours managing non-billable client interactions.",
            solution: "AI summarizing emails and generating tasks & invoices dynamically.",
            marketGap: "No tool natively connects task tracking directly with auto-invoicing based on email content.",
            founderEdge: "Direct experience with freelance workflow friction.",
          },
          {
            id: "concept-3",
            title: "MicroFlow Analytics",
            category: selectedSectors[2] || "AI & Automation",
            description: "A plug-and-play visual telemetry network designed for small ecommerce operations to track product-market fit.",
            score: 76,
            tam: "$800M",
            saturation: "Low",
            similarTo: "Mixpanel",
            concept: "Ultra-simplified real-time customer behavior maps.",
            targetUser: "Boutique Shopify and WooCommerce merchants.",
            coreProblem: "Standard analytics tools are too complex and expensive.",
            solution: "Three metrics only: absolute visual heat, click friction, and churn alerts.",
            marketGap: "No analytics tool tailored exclusively to non-technical store owners.",
            founderEdge: "Deep understanding of shop merchant workflows.",
          },
        ];

        setState((prev) => ({
          ...prev,
          journeyState: {
            ...prev.journeyState,
            phase2: {
              ...prev.journeyState.phase2,
              generatedConcepts: mockConcepts,
            },
          },
        }));

      }, 6000)
    );

    // Auto redirect after done
    timers.push(
      setTimeout(() => {
        router.push("/dashboard/creator/phase-2/idea-cards");
      }, 7500)
    );

    return () => timers.forEach(clearTimeout);
  }, [router, setState, state.journeyState?.phase2?.discoveryInputs]);

  const progress = done ? 100 : Math.min(Math.round(((activeStage + 1) / PROCESSING_STAGES.length) * 100), 95);

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
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
      </header>

      {/* Progress Bar (Simulated Synthesis progression) */}
      <div className="h-[3px] w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-16 max-w-2xl mx-auto w-full text-center">
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
      </main>
    </div>
  );
}
