"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, ArrowRight, Loader2, Lightbulb, Compass, Building2, Settings,
  Laptop, HeartPulse, ShoppingBag, BookOpen, Music, Leaf, Landmark, Gamepad2,
  Briefcase, Video, Globe, Bot, Palette, Code, TrendingUp, Handshake, BarChart3, Brain, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { toAiError } from "@/lib/ai-errors";

const TOPICS = [
  { id: "tech", label: "Technology", icon: Laptop },
  { id: "health", label: "Health & Wellness", icon: HeartPulse },
  { id: "ecom", label: "E-Commerce", icon: ShoppingBag },
  { id: "edu", label: "Education", icon: BookOpen },
  { id: "music", label: "Music & Arts", icon: Music },
  { id: "env", label: "Environment", icon: Leaf },
  { id: "finance", label: "Finance & Fintech", icon: Landmark },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "biz", label: "Business Tools", icon: Briefcase },
  { id: "content", label: "Content Creation", icon: Video },
  { id: "social", label: "Social Impact", icon: Globe },
  { id: "ai", label: "AI & Automation", icon: Bot },
];

const COMPLEMENTS = [
  { id: "design", label: "UI/UX Design", icon: Palette },
  { id: "coding", label: "Software Development", icon: Code },
  { id: "marketing", label: "Growth & Marketing", icon: TrendingUp },
  { id: "sales", label: "B2B Sales", icon: Handshake },
  { id: "operations", label: "Operations & Logistics", icon: Settings },
  { id: "finance", label: "Financial Modeling", icon: BarChart3 },
  { id: "domain", label: "Domain Expertise", icon: Brain },
  { id: "community", label: "Community Building", icon: Users },
];

const HOW_STEPS = [
  { icon: Lightbulb, title: "Your inputs", desc: "We collect signals based on your interests." },
  { icon: Sparkles, title: "AI Analysis", desc: "Our engine cross-references gaps in the market." },
  { icon: Compass, title: "Idea cards", desc: "You receive actionable concepts to explore." },
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
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto w-full max-w-[980px] px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ backgroundColor: "var(--secondary)", borderWidth: "1px", borderStyle: "solid", borderColor: "color-mix(in srgb, var(--primary) 50%, transparent)", color: "var(--primary)" }}
          >
            Idea Discovery
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
            Let&apos;s find your idea together
          </h1>
          <p className="text-base max-w-[434px]" style={{ color: "var(--muted-foreground)" }}>
            Provide core perimeters to collaborate. We need 3 data points to synthesize.
          </p>
        </div>

        {/* Two columns: form + how-it-works */}
        <div className="flex flex-col lg:flex-row lg:justify-center gap-6 items-start">

          {/* Form column */}
          <div className="w-full lg:max-w-[600px] flex flex-col gap-6">

            {error && (
              <div className="rounded-xl border p-4 text-sm" style={{ backgroundColor: "color-mix(in srgb, var(--destructive) 6%, transparent)", borderColor: "var(--destructive)", color: "var(--destructive)" }}>
                {error}
              </div>
            )}

            {/* Card: Market vertical */}
            <div className="rounded-2xl border shadow-sm p-5 sm:p-6 flex flex-col gap-6" style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 shrink-0" style={{ color: "var(--foreground)" }} />
                  <span className="flex-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>Market vertical</span>
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    <span className="font-semibold" style={{ color: "var(--primary)" }}>{sectors.length}</span>/3
                  </span>
                </div>
                <span className="text-base" style={{ color: "var(--muted-foreground)" }}>Select up to 3 sectors for initial analysis</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {TOPICS.map((t) => {
                  const sel = sectors.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleSector(t.id)}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                      style={{ backgroundColor: sel ? "var(--primary)" : "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: sel ? "var(--primary)" : "var(--border)", color: sel ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                    >
                      <t.icon className="w-4 h-4 shrink-0" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card: Problem */}
            <div className="rounded-2xl border shadow-sm p-5 sm:p-6 flex flex-col gap-6" style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Problem you have noticed</span>
                <span className="text-base" style={{ color: "var(--muted-foreground)" }}>What frustrates you, your friends, or people around you? (min 10 characters)</span>
              </div>
              <textarea
                value={observedProblem}
                onChange={(e) => setObservedProblem(e.target.value)}
                onBlur={() => saveInputsToProvider(sectors, observedProblem, strengths)}
                placeholder="Type your text...."
                rows={6}
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none placeholder:text-muted-foreground"
                style={{ backgroundColor: "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", color: "var(--foreground)", minHeight: 160 }}
              />
            </div>

            {/* Card: Core Complements */}
            <div className="rounded-2xl border shadow-sm p-5 sm:p-6 flex flex-col gap-6" style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 shrink-0" style={{ color: "var(--foreground)" }} />
                  <span className="flex-1 text-lg font-semibold" style={{ color: "var(--foreground)" }}>Core Complements</span>
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    <span className="font-semibold" style={{ color: "var(--primary)" }}>{strengths.length}</span>/3
                  </span>
                </div>
                <span className="text-base" style={{ color: "var(--muted-foreground)" }}>Select up to 3 capabilities for initial analysis</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {COMPLEMENTS.map((c) => {
                  const sel = strengths.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleStrength(c.id)}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                      style={{ backgroundColor: sel ? "var(--primary)" : "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: sel ? "var(--primary)" : "var(--border)", color: sel ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                    >
                      <c.icon className="w-4 h-4 shrink-0" />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Initialize button (pill-in-pill) */}
            <div className="rounded-full p-2" style={{ backgroundColor: "var(--card)" }}>
              <Button
                onClick={handleNext}
                disabled={!isFormValid || loading}
                className="w-full rounded-full py-4 h-auto text-base font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Initialize Generation
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* How this works panel */}
          <aside className="w-full lg:w-[336px] shrink-0 rounded-xl border shadow-sm px-4 pt-5 pb-4 flex flex-col gap-6" style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}>
            <div className="border-b pb-4" style={{ borderColor: "var(--stroke-10)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>HOW THIS WORKS</span>
            </div>
            <div className="flex flex-col gap-5">
              {HOW_STEPS.map((s) => (
                <div key={s.title} className="flex gap-4 items-start">
                  <div className="rounded shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, backgroundColor: "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--stroke-10)" }}>
                    <s.icon className="w-4 h-4" style={{ color: "var(--foreground)" }} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{s.title}</span>
                    <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4" style={{ borderColor: "var(--stroke-10)" }}>
              <span className="text-[13px] italic" style={{ color: "var(--muted-foreground)" }}>You pick what resonates. AI gives options, not answers.</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
