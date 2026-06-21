"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Compass, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

export default function SmartGatePage() {
  const router = useRouter();
  const { setEntryPath, updateProject } = useCreatorProgress();
  const [hoveredCard, setHoveredCard] = useState<"left" | "right" | null>(null);

  const handleSelectRefinement = () => {
    setEntryPath("already_have_idea");
    updateProject({ exists: true });
    router.push("/dashboard/creator/phase-2/clarifier");
  };

  const handleSelectDiscovery = () => {
    setEntryPath("needs_discovery");
    updateProject({ exists: true });
    router.push("/dashboard/creator/phase-2/discovery");
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/myideas")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Idea
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6
        </div>
      </header>

      {/* Progress Bar (14% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "14%" }} />
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-16 text-center max-w-4xl mx-auto w-full">
        {/* Heading Block */}
        <div className="space-y-4 mb-12 max-w-2xl">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Project Identity</div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Do you have a clear idea in mind?
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
            Welcome Back! Founder. You’re entering Project Identity. Before we proceed, let’s establish your current starting point.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[760px] mb-12">
          {/* LEFT CARD — Active Project Refinement */}
          <Card
            onClick={handleSelectRefinement}
            onMouseEnter={() => setHoveredCard("left")}
            onMouseLeave={() => setHoveredCard(null)}
            className={`flex flex-col justify-between rounded-2xl border p-6 text-left transition-all duration-300 cursor-pointer ${
              hoveredCard === "left"
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 -translate-y-0.5"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <CardContent className="p-0 flex flex-col justify-between h-full min-h-[260px]">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">
                    Active Project Refinement
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    Choose this if you have a defined concept. We’ll use structured logic to sharpen your value proposition.
                  </p>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider mb-4">About 15 minutes · Strategic focus</span>
                <Button
                  variant={hoveredCard === "left" ? "default" : "outline"}
                  className="group w-full rounded-xl py-5 text-xs font-bold sm:text-sm bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  Let's sharpen it
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT CARD — Explore & Discovery */}
          <Card
            onClick={handleSelectDiscovery}
            onMouseEnter={() => setHoveredCard("right")}
            onMouseLeave={() => setHoveredCard(null)}
            className={`flex flex-col justify-between rounded-2xl border p-6 text-left transition-all duration-300 cursor-pointer ${
              hoveredCard === "right"
                ? "border-warning bg-warning/5 shadow-lg shadow-warning/5 -translate-y-0.5"
                : "border-border bg-card hover:border-warning/40"
            }`}
          >
            <CardContent className="p-0 flex flex-col justify-between h-full min-h-[260px]">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Compass className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">
                    Explore & Discovery
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    Not quite sure? We’ll help you connect your interests with real market observations.
                  </p>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider mb-4">Interest mapping · Problem-space discovery</span>
                <Button
                  variant={hoveredCard === "right" ? "default" : "outline"}
                  className="group w-full rounded-xl py-5 text-xs font-bold sm:text-sm border-warning text-warning hover:bg-warning/5"
                >
                  Help me find it
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Note */}
        <div className="w-full max-w-[400px] border-t border-border pt-6 text-xs font-medium text-muted-foreground sm:text-sm">
          Both paths lead to the same destination. There is no wrong choice.
        </div>
      </main>
    </div>
  );
}
