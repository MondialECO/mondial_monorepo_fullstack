"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CreatorForecastVersion, CreatorJourneyState } from "@/types/creator/creator-journey";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { getNextCreatorAction } from "@/lib/creator-state-resolver";
import { creatorJourneyApi, type IdeaCard } from "@/lib/api-creator-journey";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  ArrowRight,
  Pencil,
  FileText,
  TrendingUp,
  Flame,
  Layout,
  Plus,
  Loader2,
  Repeat
} from "lucide-react";

// Coarse phaseReached → card label. Display hint only — never gates anything.
const PHASE_LABEL: Record<number, string> = {
  2: "Phase 2 · Identity",
  3: "Phase 3 · Masterplan",
  4: "Phase 4 · Offer & Resources",
  5: "Phase 5 · Crossroads",
  6: "Phase 6 · Matchmaking",
};

export default function MyIdeasPage() {
  const router = useRouter();
  const { state, resetJourney, updateProject, setEntryPath, refetch } = useCreatorProgress();
  const { journeyState, project } = state;
  const [showConfirmStartOver, setShowConfirmStartOver] = useState(false);

  // ---- Multi-idea (step 6iv): the ideas list + switching ----
  const [ideas, setIdeas] = useState<IdeaCard[] | null>(null);
  // ideaId being switched/continued, or "new" while minting — guards double-fire.
  const [busy, setBusy] = useState<string | null>(null);
  // A FAILED list load is distinct from an empty list (an empty [] means "no
  // ideas"; a failure must show an error + retry, never masquerade as empty —
  // the swallowed [] previously hid a 500 route collision for hours).
  const [listError, setListError] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadIdeas = useCallback(async () => {
    try {
      setListError(false);
      setIdeas(await creatorJourneyApi.listIdeas());
    } catch {
      setIdeas(null);
      setListError(true);
    }
  }, []);
  useEffect(() => { void loadIdeas(); }, [loadIdeas]);

  // Route for the CURRENT (post-switch) idea via the existing resolver. Context
  // state updates async after refetch(), so build the resolver input from a fresh
  // fetch — same mapping reconcile() uses; no invented routing.
  const routeForCurrentIdea = useCallback(async (): Promise<string> => {
    const { journey, computedStatus } = await creatorJourneyApi.get();
    const p2 = journey.phase2Data;
    const js = {
      phase1: { status: computedStatus.phase1.status, currentStep: computedStatus.phase1.currentStep ?? 1, completedSteps: [] },
      phase2: {
        status: computedStatus.phase2.status,
        currentStep: computedStatus.phase2.currentStep ?? 1,
        completedSteps: [],
        selectedEntryPath: p2?.selectedEntryPath === "already_have_idea" ? "already_have_idea" : null,
        clarifierSessionId: p2?.clarifierSessionId ?? null,
        chatMessages: p2?.chatMessages ?? [],
        discoveryInputs: p2?.discoveryInputs,
        generatedConcepts: p2?.generatedConcepts,
        selectedConceptId: p2?.selectedConceptId ?? null,
      },
      phase3: { status: computedStatus.phase3.status, currentStep: computedStatus.phase3.currentStep ?? 1, completedSteps: [] },
      phase4: { status: computedStatus.phase4.status, currentStep: computedStatus.phase4.currentStep ?? 1, completedSteps: [] },
      phase5: {
        status: computedStatus.phase5.status,
        currentStep: computedStatus.phase5.currentStep ?? 1,
        completedSteps: [],
        selectedPath: (journey.phase5Data?.chosenPath as "sell_license" | "build" | null) ?? null,
      },
      phase6: { status: computedStatus.phase6.status, currentStep: computedStatus.phase6.currentStep ?? 1, completedSteps: [] },
    } as CreatorJourneyState;
    return getNextCreatorAction(js).route;
  }, []);

  // Switch the active idea; the whole app then renders it (every page shows "the
  // current idea"). The user stays here, with the switched row now marked active.
  // Deterministic switch: verify the hydrated state actually reflects the target
  // (setActiveIdea echoes the id; hydrate reports what it loaded) — never trust
  // timing. On a failed/mismatched hydration, surface it instead of half-state.
  const handleSwitch = async (ideaId: string) => {
    if (busy) return;
    setBusy(ideaId);
    setCreateError(null);
    try {
      const { activeIdeaId } = await creatorJourneyApi.setActiveIdea(ideaId);
      const hydrated = await refetch();
      if (!hydrated.ok || hydrated.activeIdeaId !== activeIdeaId) {
        setCreateError("Switched, but reloading state failed — please retry.");
      }
      await loadIdeas();
    } catch {
      setCreateError("Couldn't switch ideas — please try again.");
    } finally {
      setBusy(null);
    }
  };

  // Continue an idea: switch if needed (verified), then resume where it left off.
  // Navigation only happens once state provably reflects the target idea.
  const handleContinue = async (idea: IdeaCard) => {
    if (busy) return;
    setBusy(idea.ideaId);
    setCreateError(null);
    try {
      if (!idea.isActive) {
        const { activeIdeaId } = await creatorJourneyApi.setActiveIdea(idea.ideaId);
        const hydrated = await refetch();
        if (!hydrated.ok || hydrated.activeIdeaId !== activeIdeaId) {
          setCreateError("Couldn't load that idea's state — please retry.");
          return;
        }
      }
      router.push(await routeForCurrentIdea());
    } catch {
      setCreateError("Couldn't open that idea — please try again.");
    } finally {
      setBusy(null);
    }
  };

  // Determine state
  const hasIdea = project.exists;
  const isPhase2Complete = journeyState.phase2.status === "completed";
  const isPhase3Complete = journeyState.phase3.status === "completed";
  const latestForecast = state.outputs.financialForecastVersions[0] as CreatorForecastVersion | undefined;

  const nextAction = getNextCreatorAction(journeyState);

  // Handlers for empty state
  const handleRefinePath = () => {
    resetJourney();
    setEntryPath("already_have_idea");
    updateProject({ exists: true });
    router.push("/dashboard/creator/phase-2/clarifier");
  };

  // REAL "new idea" (replaces the old client-only resetJourney illusion): mint a
  // blank idea server-side (becomes active), re-hydrate, land on Phase 2 via the
  // resolver. The previous idea stays in the list — switch back anytime.
  const handleStartOver = async () => {
    if (busy) return;
    setBusy("new");
    setCreateError(null);

    // Step 1: create. A failure here is retryable — nothing was made.
    let newIdeaId: string;
    try {
      ({ ideaId: newIdeaId } = await creatorJourneyApi.createIdea());
    } catch {
      setCreateError("Couldn't create a new idea — please try again.");
      setBusy(null);
      return;
    }

    // Step 2: hydrate + VERIFY state reflects the created idea (use the response
    // id directly — never infer success from a second round-trip). Navigation is
    // gated on the verified state; a failed hydration surfaces and stays put
    // (the idea exists — the list below offers it; retrying create would duplicate).
    try {
      const hydrated = await refetch();
      await loadIdeas();
      if (!hydrated.ok || hydrated.activeIdeaId !== newIdeaId) {
        setCreateError("Idea created, but loading it failed — open it from the list below.");
        return;
      }
      setShowConfirmStartOver(false);
      router.push(await routeForCurrentIdea());
    } catch {
      setCreateError("Idea created, but loading it failed — open it from the list below.");
    } finally {
      setBusy(null);
    }
  };

  const handleEditConcept = () => {
    router.push("/dashboard/creator/phase-2/idea-summary");
  };

  const handleStartNewIdea = () => {
    setShowConfirmStartOver(true);
  };

  // Rendered in ALL page branches (a blank new idea has project.exists=false and
  // would otherwise hide the list — stranding the previous idea). A failed load
  // renders an error + retry — visibly distinct from "no ideas yet".
  const ideasSection = listError ? (
    <Card className="rounded-2xl border-border bg-card shadow-xs p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-destructive font-semibold">
          Couldn&apos;t load your ideas — the list may be incomplete.
        </p>
        <Button onClick={() => void loadIdeas()} variant="outline" size="sm" className="rounded-xl text-xs font-bold">
          <Repeat className="w-3.5 h-3.5 mr-1" /> Retry
        </Button>
      </div>
    </Card>
  ) : ideas !== null && ideas.length > 0 && (
    <Card className="rounded-2xl border-border bg-card shadow-xs p-6 space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          My Ideas ({ideas.length})
        </h3>
        <Button
          onClick={handleStartNewIdea}
          disabled={!!busy}
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> New idea
        </Button>
      </div>
      {/* Switch/continue failures surface HERE (the modal isn't open for those). */}
      {createError && !showConfirmStartOver && (
        <p className="text-sm text-destructive font-semibold">{createError}</p>
      )}
      <div className="divide-y divide-border">
        {ideas.map((idea) => (
          <div key={idea.ideaId} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-bold truncate ${idea.name ? "text-foreground" : "text-muted-foreground italic"}`}>
                  {idea.name || "Untitled idea"}
                </span>
                {idea.isActive && (
                  <Badge className="bg-primary/10 hover:bg-primary/10 border-0 text-primary text-[10px] font-bold">Active</Badge>
                )}
                {idea.isLeveledUp && (
                  <Badge className="bg-green-500/10 hover:bg-green-500/10 border-0 text-green-600 dark:text-green-400 text-[10px] font-bold">Leveled up</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {/* Concept → Problem snippet → honest empty (a truly blank idea has neither). */}
                {idea.concept || idea.problem || "No concept yet — continue to define it."}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                {PHASE_LABEL[idea.phaseReached] ?? "Phase 2 · Identity"} · Last active {new Date(idea.lastActiveAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!idea.isActive && (
                <Button
                  onClick={() => handleSwitch(idea.ideaId)}
                  disabled={!!busy}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold"
                >
                  {busy === idea.ideaId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Repeat className="w-3.5 h-3.5 mr-1" />}
                  Switch
                </Button>
              )}
              <Button
                onClick={() => handleContinue(idea)}
                disabled={!!busy}
                size="sm"
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95"
              >
                {busy === idea.ideaId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Continue <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  // 1. EMPTY STATE
  if (!hasIdea) {
    return (
      <div className="mx-auto w-full max-w-[1140px] py-10 px-4 sm:px-6">
        <div className="mb-8 space-y-2">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Phase 2 — Project Identity</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">My Idea</h1>
          <p className="text-sm text-muted-foreground">
            Turn an observation or concept into a clear project identity.
          </p>
        </div>

        {ideasSection}

        <div className="grid grid-cols-1 gap-6 max-w-md mt-10">
          {/* From My Ideas, resume via the Path-B clarifier; the Smart Gate offers both entry paths. */}
          <Card className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8 hover:border-primary/50 hover:shadow-md transition-all duration-300">
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground sm:text-xl">I already have an idea</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  I have a concept in mind — let's refine and sharpen it together through focused questions.
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefinePath}
              className="group mt-6 w-full rounded-xl py-5 text-xs font-bold sm:text-sm bg-primary text-primary-foreground hover:bg-primary/95"
            >
              Refine my idea
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // 2. IN-PROGRESS STATE
  if (!isPhase2Complete) {
    const currentStepLabel = (() => {
      const step = journeyState.phase2.currentStep;
      if (step === 6) return "Refining Concept with AI";
      if (step === 7) return "First Draft Review";
      if (step === 8) return "Project Naming";
      if (step === 9) return "Branding Option Selection";
      if (step === 10) return "Hiring Verified Designer";
      if (step === 11) return "AI Logo Tool Selection";
      if (step === 12) return "Completing Project Identity";
      return "Smart Gate Selection";
    })();

    const progressPercent = Math.round((journeyState.phase2.currentStep / 12) * 100);

    return (
      <div className="mx-auto w-full max-w-[1140px] py-10 px-4 sm:px-6">
        <div className="mb-8 space-y-2">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Phase 2 — Project Identity</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Project Identity in progress</h1>
          <p className="text-sm text-muted-foreground">
            Continue from where you left off.
          </p>
        </div>

        {ideasSection}

        <Card className="max-w-2xl border-border bg-card rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-foreground">Onboarding Progress</span>
              <span className="text-muted-foreground">{progressPercent}% complete</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-xs">
            <div>
              <span className="text-muted-foreground uppercase tracking-wider block font-bold text-[10px]">Current Step</span>
              <span className="text-foreground font-bold text-sm mt-1 block">{currentStepLabel}</span>
            </div>
            <div>
              <span className="text-muted-foreground uppercase tracking-wider block font-bold text-[10px]">Last Saved</span>
              <span className="text-foreground font-medium text-sm mt-1 block">Just now</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => router.push(nextAction.route)}
              className="flex-1 rounded-xl py-5 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/95"
            >
              Resume Setup
            </Button>
            <Button
              onClick={() => setShowConfirmStartOver(true)}
              variant="outline"
              className="rounded-xl py-5 text-sm font-bold text-destructive hover:bg-destructive/5 border-destructive/20"
            >
              Start Over
            </Button>
          </div>
        </Card>

        {/* New-idea confirmation — nothing is deleted; the draft stays switchable. */}
        {showConfirmStartOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <Card className="max-w-md w-full border border-border bg-card p-6 shadow-xl space-y-4 rounded-2xl">
              <div className="flex items-center gap-3 text-primary">
                <Lightbulb className="w-6 h-6" />
                <h3 className="font-extrabold text-lg">Start a new idea?</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your current draft stays in My Ideas — you can switch back to it anytime. We&apos;ll start a fresh journey for the new idea.
              </p>
              {createError && <p className="text-sm text-destructive font-semibold">{createError}</p>}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleStartOver}
                  disabled={!!busy}
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold"
                >
                  {busy === "new" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Yes, start new idea
                </Button>
                <Button
                  onClick={() => { setShowConfirmStartOver(false); setCreateError(null); }}
                  disabled={!!busy}
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

  // 3. COMPLETED STATE
  const brandingMethod = project.branding.logoType === "ai"
    ? "AI Logo Tool"
    : project.branding.logoType === "designer"
    ? "Verified M50 Designer"
    : "Skipped / Not Started";

  return (
    <div className="mx-auto w-full max-w-[1140px] py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
        <div className="space-y-1">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Phase 2 — Project Identity</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">My Idea</h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {project.name || "AutoInvoice"} · {project.category || "FinTech SaaS"} · Idea Clarity {project.clarityScore || 82}/100
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleEditConcept}
            className="flex-1 sm:flex-none rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold h-10 px-4"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit Concept
          </Button>
          <Button
            onClick={handleStartNewIdea}
            variant="outline"
            className="flex-1 sm:flex-none rounded-xl border-border hover:bg-muted text-xs font-bold h-10 px-4"
          >
            Start New Idea
          </Button>
        </div>
      </div>

      {ideasSection}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: First Draft Summary + Clarity Score + Journal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Idea — First Draft */}
          <Card className="rounded-2xl border-border bg-card shadow-xs p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                Your Idea — First Draft
              </h3>
              <Badge variant="outline" className="text-muted-foreground border-border text-[10px] font-bold">
                AI Structured
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 border border-border rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="divide-y divide-border flex flex-col">
                <div className="p-4 flex-1">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">Concept</span>
                  <p className="text-xs sm:text-sm text-foreground font-semibold mt-1 leading-relaxed">{project.concept || "Invoice automation for freelancers"}</p>
                </div>
                <div className="p-4 flex-1">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">Core Problem</span>
                  <p className="text-xs sm:text-sm text-foreground font-semibold mt-1 leading-relaxed">{project.problem || "Hours lost on manual payment follow-ups"}</p>
                </div>
                <div className="p-4 flex-1">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">Market Gap</span>
                  <p className="text-xs sm:text-sm text-foreground font-semibold mt-1 leading-relaxed">{project.marketGap || "Existing tools require manual setup"}</p>
                </div>
              </div>
              <div className="divide-y divide-border flex flex-col">
                <div className="p-4 flex-1">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">Target User</span>
                  <p className="text-xs sm:text-sm text-foreground font-semibold mt-1 leading-relaxed">{project.targetUser || "Freelance designers, studio owners"}</p>
                </div>
                <div className="p-4 flex-1">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">Your Solution</span>
                  <p className="text-xs sm:text-sm text-foreground font-semibold mt-1 leading-relaxed">{project.solution || "Automated reminders + escalation"}</p>
                </div>
                <div className="p-4 flex-1">
                  <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">Your Edge</span>
                  <p className="text-xs sm:text-sm text-foreground font-semibold mt-1 leading-relaxed">{project.creatorEdge || "Built from firsthand freelancer experience"}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Clarity Score Card */}
          <Card className="rounded-2xl border-border bg-card shadow-xs p-6 space-y-6">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Idea Clarity Score
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-6 bg-muted/20 p-4 rounded-xl border border-border/50">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg width="80" height="80" className="-rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5.5" className="text-muted/20" />
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5.5"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - (project.clarityScore || 82) / 100)}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-extrabold text-base text-foreground leading-none">{project.clarityScore || 82}</span>
                  <span className="text-[8px] text-muted-foreground font-bold mt-0.5">/ 100</span>
                </div>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-foreground text-sm">Well-defined, investor-ready</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Strengthen technical feasibility parameters to push this project score past 90.
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
                  <Badge className="bg-green-500/10 hover:bg-green-500/10 border-0 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5">
                    Market ✓
                  </Badge>
                  <Badge className="bg-green-500/10 hover:bg-green-500/10 border-0 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5">
                    Founder ✓
                  </Badge>
                  <Badge className="bg-amber-500/10 hover:bg-amber-500/10 border-0 text-amber-600 dark:text-amber-500 text-[10px] font-bold px-2 py-0.5">
                    Tech ↗
                  </Badge>
                </div>
              </div>
            </div>

            {/* Score bars breakdown */}
            <div className="space-y-3.5">
              {[
                { label: "Target User Clarity", score: 88, color: "bg-green-500" },
                { label: "Problem Concreteness", score: 85, color: "bg-green-500" },
                { label: "Solution Clarity", score: 80, color: "bg-primary" },
                { label: "Technical Feasibility", score: 70, color: "bg-amber-500" },
                { label: "Founder-Market Fit", score: 90, color: "bg-green-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-muted-foreground w-36 shrink-0">{row.label}</span>
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.score}%` }} />
                  </div>
                  <span className="text-foreground w-8 text-right">{row.score}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Idea Journal */}
          <Card className="rounded-2xl border-border bg-card shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Idea Journal
            </h3>
            <div className="border-l-4 border-primary bg-muted/20 p-4 rounded-r-xl space-y-2">
              <h4 className="font-bold text-foreground text-sm">{project.name || "AutoInvoice"}</h4>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Saved today · Round 1 · {project.clarityScore || 82}/100 clarity
              </p>
              <div className="flex gap-1.5">
                <Badge variant="outline" className="text-[9px] font-semibold border-primary/20 bg-primary/5 text-primary">
                  {project.category || "FinTech"}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-semibold border-warning/20 bg-warning/5 text-warning">
                  SaaS
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic pt-1">
                &ldquo;Freelancers lose 15–20% of annual revenue from unpaid invoices due to manual follow-up fatigue.&rdquo;
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Project Identity Details */}
        <div className="space-y-6">
          {/* Project Identity */}
          <Card className="rounded-2xl border-border bg-card shadow-xs p-6 space-y-6">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Layout className="w-4 h-4 text-primary" />
              Project Identity
            </h3>

            <div className="text-center space-y-3.5 border-b border-border/80 pb-6 flex flex-col items-center">
              {project.branding.logoAsset ? (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-warning flex items-center justify-center font-black text-2xl text-white shadow-sm shrink-0">
                  {project.name ? project.name.charAt(0).toUpperCase() : "A"}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-muted border border-dashed border-border flex items-center justify-center font-bold text-muted-foreground text-xs shrink-0">
                  No Logo
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-lg font-black text-foreground tracking-tight">{project.name || "AutoInvoice"}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  {project.tagline || "We help freelancers recover unpaid invoices by automating follow-up sequences."}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <Badge variant="outline" className="text-[10px] font-semibold bg-warning/5 text-warning border-warning/10">
                  {project.category || "FinTech"}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/10">
                  SaaS
                </Badge>
                <Badge className="bg-green-500/10 hover:bg-green-500/10 border-0 text-green-600 dark:text-green-400 text-[10px] font-bold">
                  ✓ Identity ready
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {/* Target Audience */}
              <div className="bg-muted/30 p-3 rounded-xl space-y-1">
                <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">Target Audience</span>
                <p className="text-xs text-foreground font-semibold leading-relaxed">
                  {project.targetUser || "Independent freelancers and small studio owners"}
                </p>
              </div>

              {/* Branding */}
              <div className="bg-muted/30 p-3 rounded-xl space-y-2">
                <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">Branding</span>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{brandingMethod}</span>
                  {project.branding.colorPalette && project.branding.colorPalette.length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      {project.branding.colorPalette.map((color) => (
                        <div key={color} className="w-3.5 h-3.5 rounded-full border border-card shadow-xs" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Market Size */}
              <div className="bg-muted/30 p-3 rounded-xl space-y-1">
                <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">Market Size</span>
                <div className="text-base font-extrabold text-foreground">{project.marketPotential || "€4.8B"}</div>
                <span className="text-[10px] text-muted-foreground block font-medium">Global FinTech SaaS (AI estimate)</span>
              </div>

              {/* Feasibility */}
              <div className="bg-muted/30 p-3 rounded-xl space-y-1">
                <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase">Feasibility Score</span>
                <div className="text-base font-extrabold text-success-text">{project.feasibilityScore || 81} / 100</div>
                <span className="text-[10px] text-muted-foreground block font-medium">Strong foundation</span>
              </div>

              {isPhase3Complete && (
                <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl space-y-1">
                  <span className="text-[9px] text-primary font-bold tracking-wider uppercase">Project Intelligence</span>
                  <div className="text-xs font-bold text-foreground">Phase 3 complete</div>
                  <span className="text-[10px] text-muted-foreground block font-medium">
                    {latestForecast?.summary?.year3Revenue
                      ? `Forecast saved with Year 3 revenue €${latestForecast.summary.year3Revenue.toLocaleString()}.`
                      : 'Forecast, business plan, compliance, and team recommendations are saved.'}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* New-idea confirmation — the current idea stays in My Ideas, switchable. */}
      {showConfirmStartOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border border-border bg-card p-6 shadow-xl space-y-4 rounded-2xl">
            <div className="flex items-center gap-3 text-primary">
              <Lightbulb className="w-6 h-6" />
              <h3 className="font-extrabold text-lg">Start a new idea?</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your current idea stays in My Ideas — you can switch back to it anytime. We&apos;ll start a fresh journey for the new one.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleStartOver}
                disabled={!!busy}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold"
              >
                {busy === "new" ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Yes, start new idea
              </Button>
              <Button
                onClick={() => setShowConfirmStartOver(false)}
                disabled={!!busy}
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
