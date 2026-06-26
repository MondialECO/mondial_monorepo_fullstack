"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, ArrowRight, Check, RefreshCw, BarChart2, ShieldAlert, Award, AlertTriangle } from "lucide-react";
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
  {
    id: "concept-2",
    title: "FreelanceSync CRM",
    category: "Business Tools",
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
    category: "AI & Automation",
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

export default function IdeaCardsPage() {
  const router = useRouter();
  const { state, setState, resetJourney } = useCreatorProgress();
  const [selected, setSelected] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const concepts = state.journeyState?.phase2?.generatedConcepts || DEFAULT_CONCEPTS;

  useEffect(() => {
    if (state.journeyState?.phase2?.selectedConceptId) {
      setSelected(state.journeyState.phase2.selectedConceptId);
    }
  }, [state]);

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
  };

  const handleConfirm = () => {
    if (!selected) return;
    router.push("/dashboard/creator/phase-2/idea-confirm");
  };

  const handleCreateNew = () => {
    resetJourney();
    setShowConfirmReset(false);
    router.push("/dashboard/creator/phase-2");
  };

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
          Phase 2 of 6 — Idea Candidates
        </div>
      </header>

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

        {/* Concept Cards Grid */}
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
                      <span className="font-medium text-foreground italic">{concept.similarTo}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
          <div className="text-xs text-muted-foreground">
            None of these?{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-primary font-bold inline-flex items-center gap-0.5 hover:underline"
              onClick={() => router.push("/dashboard/creator/phase-2/clarifier")}
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
