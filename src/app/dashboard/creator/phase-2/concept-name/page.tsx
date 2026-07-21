"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, RefreshCw, Check, Lightbulb, Type, Globe, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { toAiError } from "@/lib/ai-errors";

type Suggestion = { name: string; tagline: string; score: number };

const DOMAIN_EXTENSIONS = [".com", ".io", ".co", ".ai", ".app"];

function DomainCheck({ name }: { name: string }) {
  const slug = name.toLowerCase().replace(/\s+/g, "");
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Domain Availability (simulated)</span>
      <div className="flex flex-wrap gap-2">
        {DOMAIN_EXTENSIONS.map((ext, i) => {
          const available = i % 2 === 0;
          return (
            <span
              key={ext}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                available
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400"
                  : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-muted-foreground line-through"
              }`}
            >
              {available && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
              {slug}{ext}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function ConceptNamePage() {
  const router = useRouter();
  const { state, isLoading, error, refetch, setState } = useCreatorProgress();

  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [customName, setCustomName] = useState("");
  const [customTagline, setCustomTagline] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [category, setCategory] = useState("SaaS");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const autoFetchedRef = useRef(false);

  // The API returns names only; pair each with the project's value prop as the tagline.
  const mapNames = useCallback((names: string[]): Suggestion[] => {
    const tagline = state.project.tagline || state.project.solution || state.project.concept || "";
    return names.map((name, i) => ({ name, tagline, score: Math.max(95 - i * 5, 70) }));
  }, [state.project]);

  const fetchNames = useCallback(async () => {
    const concept = state.project.concept || state.project.solution || state.project.tagline || state.project.name;
    if (!concept) return;
    setNameError(null);
    setRegenerating(true);
    try {
      const { names } = await creatorJourneyApi.nameSuggestions(concept);
      if (names?.length) {
        setSuggestions(mapNames(names));
        setState((prev) => ({
          ...prev,
          journeyState: {
            ...prev.journeyState,
            phase2: { ...prev.journeyState.phase2, nameSuggestions: names },
          },
        }));
      }
    } catch (err) {
      setNameError(toAiError(err).message);
    } finally {
      setRegenerating(false);
    }
  }, [state.project, mapNames, setState]);

  // Load cached suggestions, or fetch real ones once the concept is available.
  useEffect(() => {
    const cached = state.journeyState?.phase2?.nameSuggestions as string[] | undefined;
    if (cached && cached.length) {
      setSuggestions(mapNames(cached));
      return;
    }
    const concept = state.project.concept || state.project.solution || state.project.tagline || state.project.name;
    if (concept && !autoFetchedRef.current) {
      autoFetchedRef.current = true;
      void fetchNames();
    }
  }, [state.project, state.journeyState?.phase2?.nameSuggestions, mapNames, fetchNames]);

  // Load from state on mount
  useEffect(() => {
    const project = state.project;
    if (project) {
      if (project.name) {
        // Find if name is in suggestions
        const sugIndex = suggestions.findIndex((s) => s.name === project.name);
        if (sugIndex !== -1) {
          setSelectedSuggestion(sugIndex);
          setUseCustom(false);
        } else {
          setCustomName(project.name);
          setCustomTagline(project.tagline || "");
          setUseCustom(true);
        }
      }
      if (project.category) {
        setCategory(project.category);
      }
    }
  }, [state.project, suggestions]);

  const activeName = useCustom
    ? customName
    : selectedSuggestion !== null
    ? suggestions[selectedSuggestion]?.name ?? ""
    : "";
  const activeTagline = useCustom
    ? customTagline
    : selectedSuggestion !== null
    ? suggestions[selectedSuggestion]?.tagline ?? ""
    : "";

  // Enable button if: (1) suggestion selected, or (2) custom name + tagline filled
  const canProceed =
    (!useCustom && selectedSuggestion !== null) ||
    (useCustom && customName.trim().length >= 2 && customTagline.trim().length >= 5);

  const handleProceed = () => {
    if (!canProceed) return;

    // Persist name/tagline/category to the backend project (source of truth).
    void creatorJourneyApi
      .updateProject({ name: activeName, tagline: activeTagline, category })
      .catch(() => {
        /* optimistic local state below still advances the UI */
      });

    // Save selections in project state
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase2: {
          ...prev.journeyState.phase2,
          currentStep: 9,
        },
      },
      project: {
        ...prev.project,
        name: activeName,
        tagline: activeTagline,
        category: category,
        exists: true,
      },
    }));

    router.push("/dashboard/creator/phase-2/branding");
  };

  // Gate: don't render real content until backend hydration completes.
  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your project...</p>
      </div>
    );
  }

  // Hydration failed — show an honest error/retry state, never empty data as if real.
  if (error) {
    return (
      <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen items-center justify-center gap-3">
        <p className="text-destructive text-sm">Couldn&apos;t load your data. Please try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Isolated Onboarding Header */}
      {/* <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/phase-2/idea-summary")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — Project Naming
        </div>
      </header> */}

      {/* Progress Bar (68% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "68%" }} />
      </div>

      <main className="flex-1 max-w-[1140px] mx-auto w-full px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Panel: Stepper & Options (Spans 2/3) */}
          <div className="flex-1 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Type className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step 1 of 2 — Name Your Project</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Name Your Project</h1>
              <p className="text-sm text-muted-foreground">
                AI has suggested 5 names based on your idea description. Pick one or define your own custom name.
              </p>
            </div>

            {/* AI Suggestions Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Suggestions</span>
                <button
                  type="button"
                  onClick={() => void fetchNames()}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 text-xs text-primary font-bold hover:opacity-85 disabled:opacity-50"
                >
                  {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {regenerating ? "Generating…" : "Regenerate"}
                </button>
              </div>
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}

              {suggestions.length === 0 && !nameError && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating name suggestions…
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    onClick={() => { setSelectedSuggestion(i); setUseCustom(false); }}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      !useCustom && selectedSuggestion === i
                        ? "border-primary bg-primary/5 shadow-sm shadow-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                      !useCustom && selectedSuggestion === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {suggestion.score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-extrabold ${!useCustom && selectedSuggestion === i ? "text-primary" : "text-foreground"}`}>
                        {suggestion.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">{suggestion.tagline}</p>
                    </div>
                    {!useCustom && selectedSuggestion === i && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Choice */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setUseCustom(!useCustom)}
                className={`flex items-center gap-2 text-xs font-bold transition-colors ${useCustom ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${useCustom ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                  {useCustom && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                I have my own custom name in mind
              </button>

              {useCustom && (
                <div className="grid grid-cols-1 gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Project Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. My Custom Brand"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Tagline / Value Proposition</label>
                    <input
                      type="text"
                      value={customTagline}
                      onChange={(e) => setCustomTagline(e.target.value)}
                      placeholder="e.g. A localized inventory tool for neighborhood grocery stores."
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Panel: Live Preview & Category (Spans 1/3) */}
          <div className="w-full lg:w-[360px] space-y-6">
            
            {/* Live Preview Card */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Platform Preview</span>
              <div className="p-6 rounded-2xl border border-primary/20 bg-card min-h-[160px] flex flex-col justify-between gap-4 shadow-sm">
                {activeName ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg select-none">
                          {activeName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-foreground leading-tight">{activeName}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{activeTagline}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <Globe className="w-3.5 h-3.5" />
                      {activeName.toLowerCase().replace(/\s+/g, "")}.com
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground text-xs font-bold">
                    <Lightbulb className="w-5 h-5 mr-2 text-primary/40" />
                    Select a suggestion or write your own name
                  </div>
                )}
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Project Category</span>
              <div className="grid grid-cols-2 gap-2">
                {["SaaS", "AI Tool", "Marketplace", "Fintech", "HealthTech", "CleanTech"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                      category === cat
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Domain Check preview */}
            {activeName && <DomainCheck name={activeName} />}

            {/* Next Step Info */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Next Phases (Skippable)</span>
              {["Logo & Branding", "AI Masterplan", "Offer Setup"].map((phase) => (
                <div key={phase} className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                  <Lock className="w-3 h-3" />
                  {phase}
                </div>
              ))}
            </div>

            {/* CTA Proceed */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleProceed}
                disabled={!canProceed}
                className="w-full flex items-center justify-center gap-2 py-5 rounded-xl font-extrabold text-sm shadow-md bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-40"
              >
                Continue to Branding
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
