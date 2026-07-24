"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, BarChart3, FileText, Users, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";
import { useState, useEffect } from "react";

export default function Phase2CompletePage() {
  const router = useRouter();
  const { state, isLoading, error, refetch, advancePhase } = useCreatorProgress();

  // All hooks are declared unconditionally at the top so hook order is stable
  // across every render (rules-of-hooks). The gates below gate only the RENDER.
  const [logoError, setLogoError] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Backend-derived status fetched fresh — NOT read from context, which a prior
  // optimistic advance in this session may have polluted. Eligibility gates both
  // navigation handlers. (attempt drives Retry on a fetch failure.)
  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setStatusLoading(true);
      setStatusError(false);
      try {
        const { computedStatus } = await creatorJourneyApi.get();
        if (!active) return;
        setComputed(computedStatus);
        // Near-unreachable in the normal flow: arriving here with Phase 3 still
        // locked means a Phase 2 write likely didn't land. Surface it — console is
        // the codebase's only runtime-event convention (cf. useEntrepreneurProgressState).
        if (computedStatus.phase3.status === 'locked') {
          console.warn('[phase-2/complete] not-ready state rendered — a Phase 2 write may not have landed', {
            phase2Step: computedStatus.phase2.currentStep,
            phase3Status: computedStatus.phase3.status,
          });
        }
      } catch {
        if (active) setStatusError(true);
      } finally {
        if (active) setStatusLoading(false);
      }
    })();
    return () => { active = false; };
  }, [attempt]);

  // Eligibility: Phase 3 is anything other than `locked`. It becomes `available` the
  // instant Phase 2's three fields persist, then moves to `in_progress`/`completed`
  // once the user enters Phase 3 — so a returning user who already started Phase 3
  // must still pass. (Status set: locked | available | in_progress | completed.)
  const canContinue = !!computed && computed.phase3.status !== 'locked';

  // Not-ready guidance keyed to the Phase 2 step cursor. Only naming (8) and branding
  // (9) can be named specifically; the clarifier/discovery region and the all-complete
  // value (12, only reachable in a contradictory state since it would otherwise be
  // eligible) both fall to honest general wording — never a fabricated clarity-score reason.
  const notReady =
    computed?.phase2.currentStep === 8
      ? { message: "You haven't named your concept yet. Finish naming it to unlock Project Intelligence.", cta: 'Name your concept', href: '/dashboard/creator/phase-2/concept-name' }
      : computed?.phase2.currentStep === 9
      ? { message: "Your branding decision isn't complete yet. Finish it to unlock Project Intelligence.", cta: 'Finish branding', href: '/dashboard/creator/phase-2/branding' }
      : { message: "Your idea setup isn't finished yet. Complete the remaining Phase 2 steps to unlock Project Intelligence.", cta: 'Finish idea setup', href: '/dashboard/creator/phase-2' };

  // Gate: don't render real content until backend hydration completes.
  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your branding...</p>
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

  const project = state.project;
  const branding = project.branding;

  const handleNextPhase = () => {
    // Dual protection with the disabled button: never navigate unless the fetched
    // backend status confirms eligibility.
    if (!canContinue) return;
    setIsNavigating(true);
    // Repair STALE local state ONLY: advance iff local still reports Phase 3 `locked`
    // (context hydrates once per segment entry, so an eligible returning user's local
    // status can lag the backend). If local already shows a non-locked Phase 3, the
    // write would REGRESS it (e.g. in_progress → available) and rewrite completedAt for
    // nothing — skip it. The guard admits any non-locked status, so navigation is safe.
    if (state.journeyState.phase3.status === 'locked') advancePhase(2);
    router.push('/dashboard/creator/phase-3');
  };

  const handleSkip = () => {
    setIsSkipping(true);
    // Same staleness repair as Continue, still gated on eligibility so a not-ready user
    // never advances: write only when eligible AND local Phase 3 is stale (`locked`).
    if (canContinue && state.journeyState.phase3.status === 'locked') advancePhase(2);
    router.push('/dashboard/creator');
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Header */}
      {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-xs gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
          <span>Creator Flow</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
          <span>Phase 2</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
          <span className="text-foreground font-semibold">Branding Complete</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Sparkles className="w-3 h-3" />
          Phase 2 Complete
        </div>
      </div> */}

      {/* Progress bar (100% for Phase 2) */}
      <div className="w-full h-[3px] bg-muted">
        <div className="h-full bg-primary rounded-r" style={{ width: "100%" }} />
      </div>

      {/* Gating fetch in flight (two-layer: after context hydration) */}
      {statusLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" /> Checking your progress…
        </div>
      )}

      {/* Status-fetch failure — Phase 4 treatment. Never co-renders not-ready
          messaging: we don't know what's complete, so we show no reason. */}
      {!statusLoading && statusError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
          <p className="text-sm text-destructive">Couldn&apos;t check your progress. This doesn&apos;t mean anything is missing — please retry.</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setAttempt((a) => a + 1)}>Retry</Button>
            <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isSkipping}>Skip to dashboard</Button>
          </div>
        </div>
      )}

      {/* Not eligible — honest, cursor-specific, never celebratory or failed/processing */}
      {!statusLoading && !statusError && computed && !canContinue && (
        <div className="flex-1 p-6 sm:p-10 max-w-lg mx-auto w-full">
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 border border-warning/20 text-warning mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Phase 2 isn&apos;t finished yet</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{notReady.message}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button variant="ghost" onClick={handleSkip} disabled={isSkipping} className="text-xs font-semibold">
                {isSkipping && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Skip to dashboard
              </Button>
              <Button onClick={() => router.push(notReady.href)} className="gap-1.5">
                {notReady.cta} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button disabled className="gap-1.5 disabled:opacity-50">Launch Project Intelligence</Button>
            </div>
          </div>
        </div>
      )}

      {/* Eligible — the existing completion screen, unchanged */}
      {!statusLoading && !statusError && canContinue && (
      <div className="flex-1 p-6 sm:p-10 max-w-4xl mx-auto w-full space-y-10">

        {/* Success Header */}
        <div className="text-center space-y-4 max-w-lg mx-auto py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Project Identity Ready
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Your project name and identity are successfully established. Project Intelligence is now ready to begin.
          </p>
        </div>

        {/* Saved Assets and Unlocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Left: Brand Card representation */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Identity Ready</h3>
            <Card className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <CardContent className="p-6 space-y-6">

                {/* Concept / Logo Preview */}
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  {branding?.logoAsset && !logoError ? (
                    <img
                      src={branding.logoAsset}
                      alt={project.name || "Project Logo"}
                      className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                      onError={() => setLogoError(true)}
                    />
                  ) : branding?.logoType === "ai" || branding?.colorPalette ? (
                    <div
                      className="w-16 h-16 rounded-2xl text-white flex items-center justify-center font-extrabold text-3xl shadow-sm select-none"
                      style={{ backgroundColor: branding?.colorPalette?.[0] || "#3C61DD" }}
                    >
                      {project.name?.charAt(0) || "A"}
                    </div>
                  ) : branding?.logoType === "designer" ? (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-primary text-white flex items-center justify-center font-extrabold text-3xl shadow-sm select-none">
                      {project.name?.charAt(0) || "D"}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-dashed border-border flex items-center justify-center font-bold text-muted-foreground text-xs select-none">
                      No Brand
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">{project.name || "Untitled Project"}</h2>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{project.category || "Technology"}</p>
                  </div>
                </div>

                {/* Identity Details */}
                <div className="space-y-4 text-xs font-semibold">
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Target Audience</span>
                    <p className="text-foreground">{project.targetUser || "Not specified"}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Core Problem</span>
                    <p className="text-foreground">{project.problem || "Not specified"}</p>
                  </div>

                  {/* Palette */}
                  {branding.colorPalette && branding.colorPalette.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Branding Color Palette</span>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          {branding.colorPalette.map((color) => (
                            <div
                              key={color}
                              className="w-5 h-5 rounded-full border border-border shadow-xs"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                        <span className="text-muted-foreground text-[11px] font-semibold">{branding.paletteName || "Default"}</span>
                      </div>
                    </div>
                  )}

                  {/* Fonts */}
                  {branding.typographyPairing && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Typography Pairing</span>
                      <p className="text-foreground">{branding.typographyPairing}</p>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Right: Phase 3 Unlocks */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Intelligence Unlocked</h3>

            <div className="space-y-3">
              {/* Unlock 1: Forecast */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">AI Financial Forecast</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI-powered runway simulator, dynamic revenue calculators, and cash flow visualizations.
                  </p>
                </div>
              </div>

              {/* Unlock 2: Business Plan */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">AI Business Plan</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Interactive questionnaire generates professional, investor-ready business plan documents.
                  </p>
                </div>
              </div>

              {/* Unlock 3: Compliance */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">Legal & Structural Checklist</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Custom roadmap for SAS/LLC formation and compliance requirements like GDPR and PSD2.
                  </p>
                </div>
              </div>

              {/* Unlock 4: Skill Gaps */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">Formation Generator</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Identify your team's skills gaps, match with partners, and finalize structural setup.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-8 gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/creator/myideas")}
            disabled={isNavigating || isSkipping}
            className="text-xs font-semibold self-start sm:self-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Idea
          </Button>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isNavigating || isSkipping}
              className="w-full sm:w-auto border-border rounded-xl text-xs py-5 px-5 font-bold bg-card text-foreground hover:bg-muted/30 disabled:opacity-50"
            >
              {isSkipping && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Skip
            </Button>
            <Button
              onClick={handleNextPhase}
              disabled={isNavigating || isSkipping}
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-sm flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isNavigating && <Loader2 className="w-4 h-4 animate-spin" />}
              Launch Project Intelligence {!isNavigating && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
