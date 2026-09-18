"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Info,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";

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
  const { setState } = useCreatorProgress();
  const [skipping, setSkipping] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);

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
    router.push("/dashboard/creator/phase-2/brand-studio");
  };

  const handleSkip = async () => {
    if (skipping) return;
    setSkipping(true);
    setSkipError(null);
    try {
      await creatorJourneyApi.skipBranding();
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
        },
        exists: true,
      },
    }));
    router.push("/dashboard/creator/phase-2/complete");
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
            One guided session gives you a logo, colours and typography. Every generator after this reads from it automatically.
          </p>
        </div>

        {/* Main Studio Card */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-6 sm:p-9 shadow-xs space-y-6">
          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-section-title font-semibold text-foreground tracking-tight font-heading">
              Brand Visual Identity Studio
            </h2>
            <p className="text-body text-muted-foreground font-sans leading-relaxed">
              A guided studio that builds your full identity step by step, using the idea details you&apos;ve already given.
            </p>
          </div>

          {/* Studio Details Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-3 py-1.5 rounded-lg bg-muted/70 text-foreground/85 text-xs font-medium border border-border/40 font-sans">
              <span className="font-mono font-semibold text-foreground">6</span> steps
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-muted/70 text-foreground/85 text-xs font-medium border border-border/40 font-sans">
              ~<span className="font-mono font-semibold text-foreground">5</span>minutes
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-muted/70 text-foreground/85 text-xs font-medium border border-border/40 font-sans">
              Editable later
            </span>
          </div>

          {/* Hairline Divider */}
          <div className="h-px w-full bg-border/60" />

          {/* Deliverables Checklist */}
          <ul className="space-y-3.5">
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

          {/* Hairline Divider */}
          <div className="h-px w-full bg-border/60" />

          {/* Information Line */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
            <Info className="size-3.5 shrink-0 text-muted-foreground/80" />
            <span>Everything lands in My Brand Kit — you can change any part of it later.</span>
          </div>

          {/* Primary Action Button (The single filled blue element on screen) */}
          <Button
            onClick={handleOpenStudio}
            size="lg"
            className="w-full h-13 sm:h-14 rounded-xl font-medium text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Brand Studio</span>
            <ArrowRight className="size-4.5" />
          </Button>
        </div>

        {/* Step Navigation Card */}
        <div className="w-full rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/creator/phase-2/concept-name")}
            className="text-sm font-medium text-foreground hover:text-foreground inline-flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSkip}
            disabled={skipping}
            className="rounded-full border-border/90 px-5 py-2 text-sm font-medium text-foreground hover:bg-muted/60 inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{skipping ? "Skipping…" : "Skip Branding for Now"}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {skipError && (
          <p className="text-xs text-destructive text-center">{skipError}</p>
        )}

        {/* Footer - Additional Information */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 font-sans text-center pt-1 pb-2">
          <Clock className="size-3.5 shrink-0" />
          <span>Prefer a human designer? Hiring verified designers arrives when the marketplace opens.</span>
        </div>
      </div>
    </div>
  );
}

