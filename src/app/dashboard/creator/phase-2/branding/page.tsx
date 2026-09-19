"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { withIdeaContext } from "@/lib/creator-routes";

const STUDIO_DELIVERABLES = [
  "Brand strategy confirmed from your idea",
  "A visual direction you choose",
  "Logo concepts in the style you pick",
  "Seven logo variations — SVG and PNG",
  "Five-role colour system, contrast checked",
  "Four-role typography system, open licence",
];

export default function BrandingOptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setState } = useCreatorProgress();
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);

  const effectiveIdeaId = searchParams.get("ideaId") || state.activeIdeaId;

  const handleOpenStudio = () => {
    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        branding: {
          ...prev.project.branding,
          logoType: "ai",
        },
        exists: true,
      },
    }));
    router.push(withIdeaContext("/dashboard/creator/phase-2/brand-studio", effectiveIdeaId));
  };

  const handleWorkWithDesigner = () => {
    router.push(withIdeaContext("/dashboard/creator/phase-2/hire-designer", effectiveIdeaId));
  };

  const handleSkip = async () => {
    if (skipping) return;
    setSkipping(true);
    setSkipError(null);
    try {
      await creatorJourneyApi.skipBranding(effectiveIdeaId || undefined);
    } catch {
      setSkipError("Couldn't skip branding — please try again.");
      setSkipping(false);
      return;
    }
    setSkipping(false);
    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        branding: {
          ...prev.project.branding,
          logoType: null,
          logoAsset: null,
          colorPalette: [],
          paletteName: "Skipped",
          typographyPairing: "Skipped",
          brandingMethod: "skipped",
        },
        exists: true,
      },
    }));
    router.push(withIdeaContext("/dashboard/creator/phase-2/complete", effectiveIdeaId));
  };

  return (
    <div className="w-full flex-1 min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-[680px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <h1 className="text-page-heading font-semibold tracking-tight text-foreground leading-tight font-heading">
            Build your brand identity
          </h1>
          <p className="text-body text-muted-foreground font-sans leading-relaxed max-w-xl mx-auto">
            Establish a distinctive identity with our AI Brand Studio or collaborate with an M50 designer. Downstream generators automatically read from your brand configuration.
          </p>
        </div>

        {/* Option 1: AI Brand Studio Card */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold font-mono">
              <Palette className="h-3.5 w-3.5" /> Option 1 · Autonomous
            </div>
            <h2 className="text-section-title font-semibold text-foreground tracking-tight font-heading">
              Brand Visual Identity Studio
            </h2>
            <p className="text-body text-muted-foreground font-sans leading-relaxed">
              A guided 7-step studio that builds your full identity step by step, using the clarified idea details you&apos;ve already given.
            </p>
          </div>

          {/* Studio Details Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-3 py-1.5 rounded-lg bg-muted/70 text-foreground/85 text-xs font-medium border border-border/40 font-sans">
              <span className="font-mono font-semibold text-foreground">7</span> steps
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-muted/70 text-foreground/85 text-xs font-medium border border-border/40 font-sans">
              ~<span className="font-mono font-semibold text-foreground">5</span> minutes
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-muted/70 text-foreground/85 text-xs font-medium border border-border/40 font-sans">
              Editable later
            </span>
          </div>

          <div className="h-px w-full bg-border/60" />

          {/* Deliverables Checklist */}
          <ul className="space-y-3">
            {STUDIO_DELIVERABLES.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm font-sans text-foreground/90 leading-relaxed"
              >
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="h-px w-full bg-border/60" />

          <Button
            onClick={handleOpenStudio}
            size="lg"
            className="w-full h-12 sm:h-13 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Brand Studio</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {/* Option 2: Work with an M50 Designer Card */}
        <div className="w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold font-mono">
              <Sparkles className="h-3 w-3" /> Option 2 · Human Expert
            </div>
            <h3 className="text-sm font-bold text-foreground font-heading">
              Work with an M50 Verified Designer
            </h3>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              Match with vetted agency designers on the Mondial network. Completing a designer brief earns full Team Credibility points in your Investor Readiness Audit.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleWorkWithDesigner}
            className="shrink-0 rounded-xl text-xs font-semibold px-4 h-9 gap-1.5 border-border hover:bg-muted"
          >
            <span>Browse Designers</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* Step Navigation & Skip Card */}
        <div className="w-full rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(withIdeaContext("/dashboard/creator/phase-2/concept-name", effectiveIdeaId))}
            className="text-sm font-medium text-foreground hover:text-foreground inline-flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </Button>

          <div className="flex flex-col sm:items-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={skipping}
              className="rounded-full border-border/90 px-5 py-2 text-sm font-medium text-foreground hover:bg-muted/60 inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <span>{skipping ? "Skipping…" : "Skip Branding for Now"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground font-sans">
              Neutral placeholders will be used; you can brand your venture anytime.
            </span>
          </div>
        </div>

        {skipError && (
          <p className="text-xs text-destructive text-center">{skipError}</p>
        )}
      </div>
    </div>
  );
}


