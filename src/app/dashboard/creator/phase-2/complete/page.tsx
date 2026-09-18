"use client";

import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  Users,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { apiCreatorBrandKit } from "@/lib/api-creator-brand-kit";
import { BrandKit } from "@/types/creator/brand-kit";
import { resolveMediaUrl } from "@/lib/brand-kit-media";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";
import { useState, useEffect } from "react";

// Phase 3 Tools as specified in Figma node 57007:12780
const PHASE3_TOOLS = [
  {
    icon: TrendingUp,
    title: "Financial forecast",
    subtitle: "1-3 year projection",
  },
  {
    icon: FileText,
    title: "Business plan",
    subtitle: "Investor-ready document",
  },
  {
    icon: ShieldCheck,
    title: "Legal checklist",
    subtitle: "Structure and filings",
  },
  {
    icon: Users,
    title: "Formation generator",
    subtitle: "Skill gaps and matches",
  },
] as const;

export default function Phase2CompletePage() {
  const router = useRouter();
  const { state, isLoading, error, refetch, advancePhase } = useCreatorProgress();

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
          setStatusError(true);
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
  const canContinue = !computed || computed.phase3?.status !== "locked";

  const notReady =
    computed?.phase2?.currentStep === 8
      ? {
          message:
            "You haven't named your concept yet. Finish naming it to unlock Project Intelligence.",
          cta: "Name your concept",
          href: "/dashboard/creator/phase-2/concept-name",
        }
      : computed?.phase2?.currentStep === 9
      ? {
          message:
            "Your branding decision isn't complete yet. Finish it to unlock Project Intelligence.",
          cta: "Finish branding",
          href: "/dashboard/creator/phase-2/branding",
        }
      : {
          message:
            "Your idea setup isn't finished yet. Complete the remaining Phase 2 steps to unlock Project Intelligence.",
          cta: "Finish idea setup",
          href: "/dashboard/creator/phase-2",
        };

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
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const project = state.project || {};
  const branding = project.branding;

  // Real BrandKit properties with robust fallbacks
  const brandName =
    brandKit?.strategy?.businessName ||
    brandKit?.strategy?.nameDisplayForm ||
    project.name ||
    "AutoInvoice";

  const brandTagline =
    brandKit?.strategy?.positioning?.value ||
    brandKit?.strategy?.concept?.value ||
    project.tagline ||
    project.solution ||
    "Automated invoicing and payment chasing for freelance teams.";

  const industry =
    brandKit?.strategy?.industry?.value ||
    project.category ||
    project.sector ||
    "FinTech SaaS";

  const targetAudience =
    brandKit?.strategy?.targetAudience?.value ||
    project.targetUser ||
    project.targetMarket ||
    "Freelancers and 2-10 person agencies who bill hourly.";

  const positioning =
    brandKit?.strategy?.positioning?.value ||
    project.marketGap ||
    project.solution ||
    "The invoicing tool that does the awkward follow-up for you.";

  const coreProblem =
    project.problem ||
    brandKit?.strategy?.concept?.value ||
    "Chasing late payments costs time and strains client relationships.";

  const personalityTraits =
    brandKit?.strategy?.personalityTraits && brandKit.strategy.personalityTraits.length > 0
      ? brandKit.strategy.personalityTraits
      : ["Direct", "Calm", "Practical", "Modern", "Trustworthy"];

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

  const iconOnlySvg =
    brandKit?.logo?.variations?.icon_only?.svgUri ||
    selectedConcept?.markAssetUri ||
    primaryVariationSvg;

  const logoForms = {
    horizontal: brandKit?.logo?.variations?.horizontal?.svgUri || brandKit?.logo?.variations?.primary?.svgUri || selectedConcept?.lockupAssetUri || primaryVariationSvg,
    stacked: brandKit?.logo?.variations?.stacked?.svgUri || selectedConcept?.lockupAssetUri || primaryVariationSvg,
    mark: brandKit?.logo?.variations?.icon_only?.svgUri || selectedConcept?.markAssetUri || iconOnlySvg,
    wordmark: brandKit?.logo?.variations?.wordmark_only?.svgUri || primaryVariationSvg,
  };

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
      hex:
        candidateHex ||
        (roleName === "Primary"
          ? "#2563EB"
          : roleName === "Secondary"
          ? "#0F172A"
          : roleName === "Accent"
          ? "#6366F1"
          : roleName === "Background"
          ? "#F8FAFC"
          : "#09090B"),
    };
  });

  const displayFont =
    brandKit?.typography?.roles?.find((r) => r.roleName === "Heading")?.family ||
    brandKit?.direction?.candidates?.[0]?.displayTypeface ||
    "Syne";

  const textFont =
    brandKit?.typography?.roles?.find((r) => r.roleName === "Body")?.family ||
    brandKit?.direction?.candidates?.[0]?.textTypeface ||
    "DM Sans";

  const effectiveIdeaId = brandKit?.ideaId || state.activeIdeaId || state.project?.projectId;
  const hubUrl = `/dashboard/creator/phase-2/brand-kit${
    effectiveIdeaId ? `?ideaId=${encodeURIComponent(effectiveIdeaId)}` : ""
  }`;

  const logoCount = Object.keys(brandKit?.logo?.variations ?? {}).length || 7;
  const colorCount = orderedColorRoles.length || 5;
  const fontCount = brandKit?.typography?.roles?.length || 2;

  const handleNextPhase = () => {
    if (!canContinue) return;
    setIsNavigating(true);
    if (state.journeyState?.phase3?.status === "locked") advancePhase(2);
    router.push("/dashboard/creator/phase-3");
  };

  const handleSkip = () => {
    setIsSkipping(true);
    if (canContinue && state.journeyState?.phase3?.status === "locked") advancePhase(2);
    router.push("/dashboard/creator");
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col items-center justify-start">
      {/* Gating fetch in flight */}
      {statusLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">Checking your progress…</span>
        </div>
      )}

      {/* Status-fetch failure */}
      {!statusLoading && statusError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 px-4 text-center">
          <p className="text-sm text-destructive">
            Couldn&apos;t check your progress. This doesn&apos;t mean anything is missing — please
            retry.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setAttempt((a) => a + 1)}>
              Retry
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isSkipping}>
              Skip to dashboard
            </Button>
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
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Phase 2 isn&apos;t finished yet
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{notReady.message}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isSkipping}
                className="text-xs font-semibold"
              >
                {isSkipping && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Skip to
                dashboard
              </Button>
              <Button onClick={() => router.push(notReady.href)} className="gap-1.5">
                {notReady.cta} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button disabled className="gap-1.5 disabled:opacity-50">
                Launch Masterplan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Eligible — Figma matching completion screen */}
      {!statusLoading && !statusError && canContinue && (
        <main className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-6 sm:space-y-8">
          {/* =========================================================================
              HEADER BLOCK (Centred text, no card — Figma matching)
             ========================================================================= */}
          <header className="flex flex-col items-center text-center space-y-3">
            {/* 56px circular tile with hairline border and 24px green check */}
            <div className="size-14 rounded-full bg-card border border-border/80 flex items-center justify-center shadow-xs">
              <Check className="size-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>

            {/* Green outline pill */}
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                ✓ Phase 2 complete
              </span>
            </div>

            {/* Heading 1 */}
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
              Your identity is ready
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-xl mx-auto leading-relaxed">
              {brandName} now has a name, a concept and a full brand identity. Phase 3 turns that
              into an investor-ready business package.
            </p>
          </header>

          {/* =========================================================================
              CARD 1: BRAND KIT SHOWCASE (The Hero: 16px radius, 32px padding)
             ========================================================================= */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-card-foreground">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold font-heading text-foreground">Your Brand Kit</h2>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-muted/70 text-badge font-semibold text-muted-foreground border border-border/60 uppercase tracking-wider font-mono">
                  {logoCount} LOGOS · {colorCount} COLOURS · {fontCount} FONTS
                </span>

                <button
                  type="button"
                  onClick={() => router.push(hubUrl)}
                  className="text-badge sm:text-body font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Open Brand Kit</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </div>

            {/* Logo Hero Band (200px tall, 8px radius, near-white ground) */}
            <div className="h-[200px] w-full rounded-xl border border-border/60 bg-white dark:bg-zinc-950 flex items-center justify-center p-6 shadow-xs overflow-hidden">
              {primaryVariationSvg && !logoError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={resolveMediaUrl(primaryVariationSvg)}
                  alt={`${brandName} Master Lockup`}
                  className="max-h-[120px] max-w-[85%] object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl font-heading">
                    {brandName.charAt(0)}
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold font-heading text-zinc-900 dark:text-white tracking-tight">
                    {brandName}
                  </span>
                </div>
              )}
            </div>

            {/* Row of three equal columns separated by hairline vertical dividers */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60 pt-2 gap-6 md:gap-0">
              {/* Column 1: COLOURS */}
              <div className="md:pr-6 space-y-3 pt-4 md:pt-0">
                <span className="text-badge font-bold tracking-wider text-muted-foreground uppercase">
                  COLOURS
                </span>
                <div className="flex items-center gap-2">
                  {orderedColorRoles.map((c) => (
                    <div
                      key={c.roleName}
                      className="size-9 sm:size-10 rounded-lg border border-border/60 shadow-xs shrink-0 cursor-pointer transition-transform hover:scale-105"
                      style={{ backgroundColor: c.hex }}
                      title={`${c.roleName}: ${c.hex}`}
                    />
                  ))}
                </div>
                <p className="text-caption text-muted-foreground font-sans">
                  Primary, Secondary, Accent, Background, Text
                </p>
              </div>

              {/* Column 2: TYPOGRAPHY */}
              <div className="md:px-6 space-y-3 pt-4 md:pt-0">
                <span className="text-badge font-bold tracking-wider text-muted-foreground uppercase">
                  TYPOGRAPHY
                </span>
                <div className="flex items-baseline gap-2 text-lg sm:text-xl font-medium text-foreground">
                  <span className="font-heading font-bold">{displayFont}</span>
                  <span className="text-muted-foreground text-sm font-sans">+</span>
                  <span className="font-sans">{textFont}</span>
                </div>
                <p className="text-caption text-muted-foreground font-sans">
                  Display and text, open licence
                </p>
              </div>

              {/* Column 3: LOGO FORMS */}
              <div className="md:pl-6 space-y-3 pt-4 md:pt-0">
                <span className="text-badge font-bold tracking-wider text-muted-foreground uppercase">
                  LOGO FORMS
                </span>
                <div className="flex items-center gap-2">
                  {/* 1. Horizontal */}
                  <div
                    className="w-10 h-8 rounded-lg border border-border/80 bg-white dark:bg-zinc-900 flex items-center justify-center p-1 shadow-2xs shrink-0"
                    title="Horizontal Lockup"
                  >
                    {logoForms?.horizontal ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={resolveMediaUrl(logoForms.horizontal)}
                        alt="Horizontal"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-badge text-muted-foreground font-mono">H</span>
                    )}
                  </div>
                  {/* 2. Stacked */}
                  <div
                    className="w-10 h-8 rounded-lg border border-border/80 bg-white dark:bg-zinc-900 flex items-center justify-center p-1 shadow-2xs shrink-0"
                    title="Stacked Lockup"
                  >
                    {logoForms?.stacked ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={resolveMediaUrl(logoForms.stacked)}
                        alt="Stacked"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-badge text-muted-foreground font-mono">V</span>
                    )}
                  </div>
                  {/* 3. Mark */}
                  <div
                    className="w-10 h-8 rounded-lg border border-border/80 bg-white dark:bg-zinc-900 flex items-center justify-center p-1 shadow-2xs shrink-0"
                    title="Symbol / Icon Mark"
                  >
                    {logoForms?.mark ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={resolveMediaUrl(logoForms.mark)}
                        alt="Mark"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-badge text-muted-foreground font-mono">M</span>
                    )}
                  </div>
                  {/* 4. Wordmark */}
                  <div
                    className="w-10 h-8 rounded-lg border border-border/80 bg-white dark:bg-zinc-900 flex items-center justify-center p-1 shadow-2xs shrink-0"
                    title="Wordmark"
                  >
                    {logoForms?.wordmark ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={resolveMediaUrl(logoForms.wordmark)}
                        alt="Wordmark"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-badge text-muted-foreground font-mono">W</span>
                    )}
                  </div>
                </div>
                <p className="text-caption text-muted-foreground font-sans">
                  Horizontal, stacked, mark, wordmark
                </p>
              </div>
            </div>
          </section>

          {/* =========================================================================
              CARD 2: CORE BRAND IDENTITY (white card, 16px radius, standard padding)
             ========================================================================= */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-card-foreground">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-card-title font-bold font-heading text-foreground">
                Core Brand Identity
              </h3>

              <button
                type="button"
                onClick={() => router.push("/dashboard/creator/phase-2/brand-studio?step=strategy")}
                className="text-badge sm:text-body font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Edit Strategy</span>
                <ArrowRight className="size-3" />
              </button>
            </div>

            {/* Tagline callout banner */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5">
              <p className="text-base sm:text-lg font-medium text-foreground italic font-sans leading-relaxed">
                &ldquo;{brandTagline}&rdquo;
              </p>
            </div>

            {/* 2x2 grid of four facts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* TARGET AUDIENCE */}
              <div className="space-y-1">
                <span className="text-badge font-bold tracking-wider text-muted-foreground uppercase">
                  TARGET AUDIENCE
                </span>
                <p className="text-body text-foreground font-sans leading-relaxed">
                  {targetAudience}
                </p>
              </div>

              {/* POSITIONING */}
              <div className="space-y-1">
                <span className="text-badge font-bold tracking-wider text-muted-foreground uppercase">
                  POSITIONING
                </span>
                <p className="text-body text-foreground font-sans leading-relaxed">
                  {positioning}
                </p>
              </div>

              {/* CORE PROBLEM */}
              <div className="space-y-1">
                <span className="text-badge font-bold tracking-wider text-muted-foreground uppercase">
                  CORE PROBLEM
                </span>
                <p className="text-body text-foreground font-sans leading-relaxed">
                  {coreProblem}
                </p>
              </div>

              {/* PERSONALITY */}
              <div className="space-y-1">
                <span className="text-badge font-bold tracking-wider text-muted-foreground uppercase">
                  PERSONALITY
                </span>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {personalityTraits.map((trait) => (
                    <span
                      key={trait}
                      className="px-2.5 py-0.5 rounded-full border border-border/80 bg-muted/40 text-badge text-muted-foreground font-sans"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              CARD 3: NEXT PHASE STRIP (white card, 16px radius, deliberately compact)
             ========================================================================= */}
          <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4 text-card-foreground">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h4 className="text-card-title font-semibold font-heading text-foreground">
                Next: Phase 3 — Business plan
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-badge font-semibold text-muted-foreground border border-border/60 uppercase font-mono">
                4 TOOLS
              </span>
            </div>

            {/* 4 Compact items separated by hairline vertical dividers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60 gap-4 sm:gap-0 pt-1">
              {PHASE3_TOOLS.map(({ icon: Icon, title, subtitle }, idx) => (
                <div
                  key={title}
                  className={`flex items-start gap-3 pt-3 sm:pt-0 ${
                    idx === 0
                      ? "sm:pr-4"
                      : idx === PHASE3_TOOLS.length - 1
                      ? "sm:pl-4"
                      : "sm:px-4"
                  }`}
                >
                  <Icon className="size-4.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-label font-semibold text-foreground block">{title}</span>
                    <span className="text-caption text-muted-foreground block font-sans">
                      {subtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Beneath row note */}
            <p className="text-caption text-muted-foreground font-sans pt-1 border-t border-border/40">
              Each one reads from your Brand Kit automatically.
            </p>
          </section>

          {/* =========================================================================
              FOOTER ACTIONS (centred, 32px below the last card)
             ========================================================================= */}
          <footer className="flex flex-col items-center gap-4 pt-4">
            <Button
              type="button"
              onClick={handleNextPhase}
              disabled={isNavigating || isSkipping}
              className="h-12 sm:h-13 px-8 text-base font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isNavigating && <Loader2 className="size-4 animate-spin" />}
              <span>Continue to Phase 3</span>
              {!isNavigating && <ArrowRight className="size-4.5" />}
            </Button>

            {/* 16px below: two ghost text links side by side */}
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-sans">
              <button
                type="button"
                onClick={handleSkip}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Back to dashboard
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => router.push(hubUrl)}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Edit Brand Kit
              </button>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}
