"use client";

import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  FileText,
  Users,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Palette,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { apiCreatorBrandKit } from "@/lib/api-creator-brand-kit";
import { BrandKit } from "@/types/creator/brand-kit";
import { resolveMediaUrl } from "@/lib/brand-kit-media";
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

  // Backend-derived status fetched fresh
  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Real BrandKit fetched from the Brand Studio server state
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

  useEffect(() => {
    let active = true;
    const ideaId =
      state.activeIdeaId ||
      state.project?.projectId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("activeIdeaId") || undefined
        : undefined);

    setStatusLoading(true);
    setStatusError(false);

    creatorJourneyApi
      .get(ideaId)
      .then(({ computedStatus }) => {
        if (!active) return;
        setComputed(computedStatus);
      })
      .catch(() => {
        if (active) {
          if (state.journeyState) {
            setComputed(state.journeyState);
          } else {
            setStatusError(true);
          }
        }
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt, state.activeIdeaId, state.project?.projectId, state.journeyState]);

  useEffect(() => {
    let active = true;
    const ideaId =
      state.activeIdeaId ||
      state.project?.projectId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("activeIdeaId") || undefined
        : undefined);

    apiCreatorBrandKit
      .getBrandKit(ideaId)
      .then((kit) => {
        if (active && kit) {
          setBrandKit(kit);
        }
      })
      .catch(() => {
        // Silently fall back to context data if BrandKit is not yet initialized
      });
    return () => {
      active = false;
    };
  }, [state.activeIdeaId, state.project?.projectId]);

  // Eligibility: Phase 3 is anything other than `locked`.
  const canContinue = !!computed && computed.phase3.status !== 'locked';

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

  // Hydration failed — show an honest error/retry state.
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

  // Real BrandKit properties with robust fallbacks
  const brandName =
    brandKit?.strategy?.businessName ||
    brandKit?.strategy?.nameDisplayForm ||
    project.name ||
    "Untitled Project";

  const brandTagline =
    brandKit?.strategy?.positioning?.value ||
    brandKit?.strategy?.concept?.value ||
    project.tagline ||
    project.solution ||
    "Your project identity is ready.";

  const selectedConcept =
    brandKit?.logo?.concepts?.find(
      (c) => c.key === brandKit?.logo?.selectedConceptKey
    ) || brandKit?.logo?.concepts?.[0];

  const primaryVariationSvg =
    brandKit?.logo?.variations?.primary?.svgUri ||
    brandKit?.logo?.variations?.horizontal?.svgUri ||
    selectedConcept?.lockupAssetUri ||
    selectedConcept?.markAssetUri ||
    branding?.logoAsset;

  const CANONICAL_ROLES = ["Primary", "Secondary", "Accent", "Background", "Text"] as const;
  const rawColorRoles = brandKit?.colors?.roles ?? [];

  const orderedColorRoles = CANONICAL_ROLES.map((roleName) => {
    const found = rawColorRoles.find(
      (r) => r.roleName?.trim().toLowerCase() === roleName.toLowerCase()
    );
    if (found) return found;
    const paletteIndex =
      roleName === "Primary"
        ? 0
        : roleName === "Secondary"
        ? 1
        : roleName === "Accent"
        ? 2
        : roleName === "Background"
        ? 3
        : 4;
    const candidateHex = brandKit?.direction?.candidates?.[0]?.colorPalette?.[paletteIndex];
    return {
      roleName,
      hex: candidateHex || (roleName === "Background" ? "#FFFFFF" : roleName === "Accent" ? "#10B981" : "#0F172A"),
    };
  });

  const displayFont =
    brandKit?.typography?.roles?.find((r) => r.roleName === "Heading")?.family ||
    brandKit?.direction?.candidates?.[0]?.displayTypeface ||
    "Space Grotesk";

  const textFont =
    brandKit?.typography?.roles?.find((r) => r.roleName === "Body")?.family ||
    brandKit?.direction?.candidates?.[0]?.textTypeface ||
    "Plus Jakarta Sans";

  const effectiveIdeaId = brandKit?.ideaId || state.activeIdeaId || state.project?.projectId;
  const hubUrl = `/dashboard/creator/phase-2/brand-kit${
    effectiveIdeaId ? `?ideaId=${encodeURIComponent(effectiveIdeaId)}` : ""
  }`;

  const handleNextPhase = () => {
    if (!canContinue) return;
    setIsNavigating(true);
    if (state.journeyState.phase3.status === 'locked') advancePhase(2);
    router.push('/dashboard/creator/phase-3');
  };

  const handleSkip = () => {
    setIsSkipping(true);
    if (canContinue && state.journeyState.phase3.status === 'locked') advancePhase(2);
    router.push('/dashboard/creator');
  };

  return (
    <div className="w-full" style={{ backgroundColor: "var(--background)" }}>
      {/* Gating fetch in flight */}
      {statusLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" /> Checking your progress…
        </div>
      )}

      {/* Status-fetch failure */}
      {!statusLoading && statusError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
          <p className="text-sm text-destructive">Couldn&apos;t check your progress. This doesn&apos;t mean anything is missing — please retry.</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setAttempt((a) => a + 1)}>Retry</Button>
            <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isSkipping}>Skip to dashboard</Button>
          </div>
        </div>
      )}

      {/* Not eligible */}
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

      {/* Eligible — completion screen */}
      {!statusLoading && !statusError && canContinue && (
        <div className="mx-auto w-full max-w-[640px] px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
          {/* Success Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                backgroundColor: "var(--popover)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border)",
              }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: "var(--p8-green)" }} />
            </div>
            <div className="inline-flex items-center gap-1.5 pr-3 py-1">
              <Sparkles className="w-3 h-3" style={{ color: "var(--primary)" }} />
              <span className="text-[11px] font-medium" style={{ color: "var(--primary)" }}>
                Branding Complete
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
              Project Identity Ready.
            </h1>
            <p className="text-base max-w-[548px]" style={{ color: "var(--muted-foreground)" }}>
              Your project name and brand are set. Phase 3-A AI will create a complete business package.
            </p>
          </div>

          {/* Card group */}
          <div className="flex flex-col gap-4">
            {/* Identity card */}
            <div
              className="rounded-2xl border shadow-sm p-5 sm:p-6 flex flex-col gap-5"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  {primaryVariationSvg && !logoError ? (
                    <div
                      className="rounded-xl border border-border/60 bg-white p-2 flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
                      style={{ width: 72, height: 72 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveMediaUrl(primaryVariationSvg)}
                        alt={brandName}
                        className="max-h-full max-w-full object-contain"
                        onError={() => setLogoError(true)}
                      />
                    </div>
                  ) : (
                    <div
                      className="rounded-xl flex items-center justify-center shrink-0 text-3xl font-semibold select-none shadow-xs bg-primary/10 text-primary border border-primary/20"
                      style={{ width: 72, height: 72 }}
                    >
                      {brandName?.charAt(0) || "A"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-lg font-semibold text-foreground truncate">
                      {brandName}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {brandTagline}
                    </span>
                  </div>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 shrink-0 self-start"
                  style={{ backgroundColor: "var(--dr-bg-green)" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--p8-green)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--p8-green)" }}>
                    Identity ready
                  </span>
                </div>
              </div>

              {/* Compact Visual Identity Preview Strip (Colours + Typography + Hub Link) */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Swatches */}
                  <div className="flex items-center gap-1.5">
                    <Palette className="size-3.5 text-muted-foreground" />
                    <div className="flex items-center -space-x-1">
                      {orderedColorRoles.map((c) => (
                        <div
                          key={c.roleName}
                          className="size-5 rounded-full border border-zinc-200 dark:border-zinc-800 ring-1 ring-white dark:ring-zinc-900 shadow-2xs shrink-0"
                          style={{ backgroundColor: c.hex }}
                          title={`${c.roleName}: ${c.hex}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="h-4 w-px bg-border/80 hidden sm:block" />

                  {/* Typography Pairings */}
                  <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                    <Type className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground font-semibold">{displayFont}</span>
                    <span>/</span>
                    <span>{textFont}</span>
                  </div>
                </div>

                {/* Hub Link */}
                <button
                  type="button"
                  onClick={() => router.push(hubUrl)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline self-start sm:self-auto cursor-pointer"
                >
                  <span>View full Brand Kit</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div
                  className="rounded-xl border p-4 flex flex-col gap-1"
                  style={{ backgroundColor: "var(--muted)", borderColor: "var(--stroke-10)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Core Problem
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {project.problem || "Not specified"}
                  </span>
                </div>
                <div
                  className="rounded-xl border p-4 flex flex-col gap-1"
                  style={{ backgroundColor: "var(--muted)", borderColor: "var(--stroke-10)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Solutions
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {project.solution || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Masterplan card */}
            <div
              className="rounded-2xl border shadow-sm p-5 flex flex-col gap-5"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--card-edge)" }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                  Phase 3 Unlocked!
                </span>
                <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                  The Masterplan
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {MASTERPLAN_ITEMS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3.5 rounded-lg border p-4"
                    style={{ backgroundColor: "var(--muted)", borderColor: "var(--stroke-10)" }}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Single Primary Action Button */}
          <Button
            onClick={handleNextPhase}
            disabled={isNavigating || isSkipping}
            className="w-full rounded-xl py-4 h-auto text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
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

