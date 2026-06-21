"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, ArrowRight, Target, ShieldAlert, Award, Compass, Heart, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

const DEFAULT_CONCEPTS = [
  {
    id: "concept-1",
    title: "EcoRetail Hub",
    category: "Environment",
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
];

export default function IdeaConfirmPage() {
  const router = useRouter();
  const { state, setState } = useCreatorProgress();

  const selectedConceptId = state.journeyState?.phase2?.selectedConceptId;
  const concepts = state.journeyState?.phase2?.generatedConcepts || DEFAULT_CONCEPTS;
  const concept = concepts.find((c) => c.id === selectedConceptId) || concepts[0];

  const handleConfirm = () => {
    // Save concept to project state
    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        concept: concept.concept || concept.description,
        targetUser: concept.targetUser || "",
        problem: concept.coreProblem || "",
        solution: concept.solution || "",
        marketGap: concept.marketGap || "",
        creatorEdge: concept.founderEdge || "",
        category: concept.category || "",
        clarityScore: concept.score || 0,
        exists: true,
      },
    }));

    // Route to discovery AI chat to deep dive on this concept
    router.push("/dashboard/creator/phase-2/ai-chat");
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
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
      </header>

      {/* Progress Bar (42% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "42%" }} />
      </div>

      <main className="flex-1 max-w-[1140px] mx-auto w-full px-6 py-10 space-y-8">
        
        {/* Page title */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Venture Concept Canvas</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Idea Selected</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Review the synthesized canvas below and verify the strategic parameters before continuing to deep dive chats.
          </p>
        </div>

        {/* 2 Column Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Concept Details (Spans 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border-primary bg-primary/5 border-2 overflow-hidden shadow-md shadow-primary/5">
              <CardContent className="p-6 space-y-6">
                
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div className="space-y-1">
                    <span className="rounded-full bg-primary/10 border border-primary/20 text-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {concept.category}
                    </span>
                    <h2 className="text-2xl font-extrabold">{concept.title}</h2>
                  </div>
                  <div className="text-right">
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
                    <p className="text-sm text-foreground leading-relaxed">Leverages customized API feeds and integrations to automate compliance checks for target businesses.</p>
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

                  <div className="space-y-1 flex justify-between items-center border-b border-border pb-2">
                    <span className="font-semibold text-muted-foreground text-xs">Project Validity</span>
                    <span className="font-bold text-green-600 dark:text-green-400">High Confidence</span>
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

        {/* Action Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
          <Button
            variant="ghost"
            className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl"
            onClick={() => router.push("/dashboard/creator/phase-2/idea-cards")}
          >
            Change My Idea
          </Button>

          <Button
            onClick={handleConfirm}
            className="rounded-xl px-6 py-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2"
          >
            Let’s go — Name my project
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

      </main>
    </div>
  );
}
