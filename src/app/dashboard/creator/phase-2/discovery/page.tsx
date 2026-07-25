"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, ArrowRight, Lightbulb, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { toAiError } from "@/lib/ai-errors";

const TOPICS = [
  { id: "tech", label: "Technology", emoji: "💻" },
  { id: "health", label: "Health & Wellness", emoji: "🏥" },
  { id: "ecom", label: "E-Commerce", emoji: "🛍️" },
  { id: "edu", label: "Education", emoji: "📚" },
  { id: "music", label: "Music & Arts", emoji: "🎵" },
  { id: "env", label: "Environment", emoji: "🌿" },
  { id: "finance", label: "Finance & Fintech", emoji: "💰" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "biz", label: "Business Tools", emoji: "💼" },
  { id: "content", label: "Content Creation", emoji: "📸" },
  { id: "social", label: "Social Impact", emoji: "🌍" },
  { id: "ai", label: "AI & Automation", emoji: "🤖" },
];

const COMPLEMENTS = [
  { id: "design", label: "UI/UX Design", emoji: "🎨" },
  { id: "coding", label: "Software Development", emoji: "💻" },
  { id: "marketing", label: "Growth & Marketing", emoji: "📈" },
  { id: "sales", label: "B2B Sales", emoji: "🤝" },
  { id: "operations", label: "Operations & Logistics", emoji: "⚙️" },
  { id: "finance", label: "Financial Modeling", emoji: "📊" },
  { id: "domain", label: "Domain Expertise", emoji: "🧠" },
  { id: "community", label: "Community Building", emoji: "👥" },
];

// AI prompt wants human-readable text, not internal ids.
const sectorLabel = (id: string) => TOPICS.find((t) => t.id === id)?.label ?? id;
const strengthLabel = (id: string) => COMPLEMENTS.find((c) => c.id === id)?.label ?? id;

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

const discoveryInputsEqual = (
  current: { sectors: string[]; observedProblem: string; strengths: string[] },
  next: { sectors: string[]; observedProblem: string; strengths: string[] }
) =>
  current.observedProblem === next.observedProblem &&
  arraysEqual(current.sectors, next.sectors) &&
  arraysEqual(current.strengths, next.strengths);

export default function IdeaDiscoveryPage() {
  const router = useRouter();
  const { state, setState, isLoading } = useCreatorProgress();

  const [sectors, setSectors] = useState<string[]>([]);
  const [observedProblem, setObservedProblem] = useState("");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasHydratedInputsRef = useRef(false);
  const savedInputs = state.journeyState?.phase2?.discoveryInputs;

  // Load saved inputs once after the provider finishes localStorage hydration.
  useEffect(() => {
    if (isLoading || hasHydratedInputsRef.current) return;

    if (savedInputs) {
      setSectors(savedInputs.sectors || []);
      setObservedProblem(savedInputs.observedProblem || "");
      setStrengths(savedInputs.strengths || []);
      hasHydratedInputsRef.current = true;
    }
  }, [isLoading, savedInputs]);

  const saveInputsToProvider = (nextSectors: string[], nextProblem: string, nextStrengths: string[]) => {
    setState((prev) => {
      const currentInputs = prev.journeyState.phase2.discoveryInputs;
      const nextInputs = { sectors: nextSectors, observedProblem: nextProblem, strengths: nextStrengths };

      if (currentInputs && discoveryInputsEqual(
        { sectors: currentInputs.sectors ?? [], observedProblem: currentInputs.observedProblem ?? "", strengths: currentInputs.strengths ?? [] },
        nextInputs,
      )) {
        return prev;
      }

      return {
        ...prev,
        journeyState: {
          ...prev.journeyState,
          phase2: {
            ...prev.journeyState.phase2,
            discoveryInputs: nextInputs,
          },
        },
      };
    });
  };

  const toggleSector = (id: string) => {
    const next = sectors.includes(id)
      ? sectors.filter((sector) => sector !== id)
      : sectors.length < 3
        ? [...sectors, id]
        : sectors;

    setSectors(next);
    saveInputsToProvider(next, observedProblem, strengths);
  };

  const toggleStrength = (id: string) => {
    const next = strengths.includes(id)
      ? strengths.filter((strength) => strength !== id)
      : strengths.length < 3
        ? [...strengths, id]
        : strengths;

    setStrengths(next);
    saveInputsToProvider(sectors, observedProblem, next);
  };

  const isFormValid =
    sectors.length >= 1 &&
    sectors.length <= 3 &&
    observedProblem.trim().length >= 10 &&
    strengths.length >= 1 &&
    strengths.length <= 3;

  const handleNext = async () => {
    if (!isFormValid || loading) return;
    setError(null);
    setLoading(true);
    saveInputsToProvider(sectors, observedProblem, strengths);
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase2: {
          ...prev.journeyState.phase2,
          currentStep: 3,
        },
      },
    }));

    try {
      // Capture the target idea at INITIATION (the user is unambiguously on it
      // here) and carry it through the whole Discovery chain via the URL — so an
      // in-flight generation can never write onto a different idea after a
      // switch/tab change. Null (zero-idea user / pre-hydration) → omitted; the
      // backend's active/mint fallback is correct for that case.
      const targetIdeaId = state.activeIdeaId ?? undefined;

      // Persist discovery inputs to backend before generating concepts
      await creatorJourneyApi.saveDiscoveryInputs({
        sectors,
        observedProblem,
        strengths,
      }, targetIdeaId);

      const result = await creatorAiApi.startIdeaGeneration({
        sectors: sectors.map(sectorLabel),
        observedProblem,
        strengths: strengths.map(strengthLabel),
      });
      const ideaQ = targetIdeaId ? `&idea=${targetIdeaId}` : "";
      router.push(`/dashboard/creator/phase-2/ai-processing?session=${result.sessionId}${ideaQ}`);
    } catch (err) {
      setError(toAiError(err).message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    saveInputsToProvider(sectors, observedProblem, strengths);
    router.push("/dashboard/creator/phase-2");
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      {/* <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — Idea Discovery
        </div>
      </header> */}

      {/* Progress Bar (28% filled for Step 2) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: "28%" }} />
      </div>

      <main className="flex-1 max-w-[1140px] mx-auto w-full px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Form (Left Column, spans 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Idea Discovery</h1>
              <p className="text-sm text-muted-foreground">
                Let&apos;s find your idea together. Provide three inputs to collaborate. We need three data points to synthesize.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Section 1: Market Verticals */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Market vertical <span className="text-red-500 font-bold">*</span>
                </h3>
                <span className="text-xs text-muted-foreground">Select up to 3 sectors for initial analysis</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {TOPICS.map((topic) => {
                  const isSelected = sectors.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleSector(topic.id)}
                      className={`flex items-center gap-2 p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <span className="text-lg">{topic.emoji}</span>
                      <span className="truncate flex-1">{topic.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Problem Description */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">
                  Problem you have noticed <span className="text-red-500 font-bold">*</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  What frustrates you, your friends, or people around you? (Min 10 characters)
                </p>
              </div>
              <textarea
                value={observedProblem}
                onChange={(e) => setObservedProblem(e.target.value)}
                onBlur={() => saveInputsToProvider(sectors, observedProblem, strengths)}
                placeholder="e.g., Small retail shops struggle to manage inventory and sales, often relying on paper ledgers which leads to errors and lost revenue..."
                rows={4}
                className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
              />
              <p className="text-xs text-muted-foreground text-right">{observedProblem.length} chars</p>
            </div>

            {/* Section 3: Core Complements / Strengths */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Core complements <span className="text-red-500 font-bold">*</span>
                </h3>
                <span className="text-xs text-muted-foreground">Select up to 3 capabilities for initial analysis</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {COMPLEMENTS.map((strength) => {
                  const isSelected = strengths.includes(strength.id);
                  return (
                    <button
                      key={strength.id}
                      type="button"
                      onClick={() => toggleStrength(strength.id)}
                      className={`flex items-center gap-2 p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <span className="text-lg">{strength.emoji}</span>
                      <span className="truncate flex-1">{strength.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={handleNext}
                disabled={!isFormValid || loading}
                className="rounded-xl px-6 py-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2 disabled:opacity-40"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Initialize Generation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Explanation Panel (Right Column, spans 1/3) */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border-border bg-card sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Lightbulb className="h-5 w-5" />
                  <span className="text-sm uppercase tracking-wider">How this works</span>
                </div>

                <div className="space-y-4 text-sm leading-relaxed">
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground">Your inputs</h4>
                    <p className="text-xs text-muted-foreground">We collect signals based on your interests and capabilities.</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground">AI analysis</h4>
                    <p className="text-xs text-muted-foreground">Our engine cross-references gaps in the market based on real-world demand patterns.</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground">Idea cards</h4>
                    <p className="text-xs text-muted-foreground">You receive actionable venture concepts optimized for viability, TAM, and competitor saturation.</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 text-xs font-semibold text-primary/80 italic">
                  You choose what resonates. AI gives options, not answers.
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
