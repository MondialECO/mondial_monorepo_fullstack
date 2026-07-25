"use client";

import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, BarChart3, FileText, Users, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";
import { useState, useEffect } from "react";

// Phase 3 "Masterplan" unlocks shown on the success screen (labels per Figma).
const MASTERPLAN_ITEMS = [
  { icon: FileText, label: "AI Business Plan" },
  { icon: BarChart3, label: "AI Financial Forecast" },
  { icon: ShieldCheck, label: "Legal & Structural Checklist" },
  { icon: Users, label: "Formation Generator" },
] as const;

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
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
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

      {/* Eligible — completion screen, restyled to the Figma design */}
      {!statusLoading && !statusError && canContinue && (
      <div className="mx-auto w-full max-w-[640px] px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">

        {/* Success Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{ width: 72, height: 72, backgroundColor: "var(--popover)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "var(--p8-green)" }} />
          </div>
          <div className="inline-flex items-center gap-1.5 pr-3 py-1">
            <Sparkles className="w-3 h-3" style={{ color: "var(--primary)" }} />
            <span className="text-[11px] font-medium" style={{ color: "var(--primary)" }}>Branding Complete</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
            Project Identity Ready.
          </h1>
          <p className="text-base max-w-[548px]" style={{ color: "var(--muted-foreground)" }}>
            Your project name and brand are set. Phase 3-A AI will create a complete business package.
          </p>
        </div>

        {/* Card group */}
        <div className="flex flex-col gap-3">

          {/* Identity card */}
          <div
            className="rounded-2xl border shadow-sm p-5 flex flex-col gap-6"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0 flex items-center gap-4">
                {branding?.logoAsset && !logoError ? (
                  <img
                    src={branding.logoAsset}
                    alt={project.name || "Project Logo"}
                    className="rounded-xl object-cover shrink-0"
                    style={{ width: 72, height: 72 }}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div
                    className="rounded-xl flex items-center justify-center shrink-0 text-3xl font-semibold select-none"
                    style={{ width: 72, height: 72, backgroundColor: "var(--muted)", color: "var(--primary)" }}
                  >
                    {project.name?.charAt(0) || "A"}
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <span className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                    {project.name || "Untitled Project"}
                  </span>
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {project.tagline || project.solution || "Your project identity is ready."}
                  </span>
                </div>
              </div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 shrink-0 self-start"
                style={{ backgroundColor: "var(--dr-bg-green)" }}
              >
                <CheckCircle2 className="w-3 h-3" style={{ color: "var(--p8-green)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--p8-green)" }}>Identity ready</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-xl border p-4 flex flex-col gap-1" style={{ backgroundColor: "var(--muted)", borderColor: "var(--stroke-10)" }}>
                <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Core Problem</span>
                <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>{project.problem || "Not specified"}</span>
              </div>
              <div className="rounded-xl border p-4 flex flex-col gap-1" style={{ backgroundColor: "var(--muted)", borderColor: "var(--stroke-10)" }}>
                <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Solutions</span>
                <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>{project.solution || "Not specified"}</span>
              </div>
            </div>
          </div>

          {/* Masterplan card */}
          <div
            className="rounded-2xl border shadow-sm p-5 flex flex-col gap-6"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-sm" style={{ color: "var(--primary)" }}>Phase 3 Unlocked!</span>
              <span className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>The Masterplan</span>
            </div>
            <div className="flex flex-col gap-3">
              {MASTERPLAN_ITEMS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-lg border p-5"
                  style={{ backgroundColor: "var(--muted)", borderColor: "var(--stroke-10)" }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Launch button */}
        <Button
          onClick={handleNextPhase}
          disabled={isNavigating || isSkipping}
          className="w-full rounded-xl py-4 h-auto text-base font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isNavigating && <Loader2 className="w-4 h-4 animate-spin" />}
          Launch Masterplan
          {!isNavigating && <ArrowRight className="w-5 h-5" />}
        </Button>

      </div>
      )}
    </div>
  );
}
