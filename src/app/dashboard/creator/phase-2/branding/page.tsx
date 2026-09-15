"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";

const STUDIO_DELIVERABLES = [
  "Brand strategy confirmed (positioning, target audience, traits & avoid list)",
  "Curated visual direction & moodboard",
  "Architectural logo concepts in your chosen mark archetype",
  "Full set of 7 canonical logo variations (including transparent checkerboard)",
  "5-role colour system with deterministic WCAG contrast evaluation",
  "4-role typography system with optical role specimens",
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
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Progress Bar (78% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "78%" }} />
      </div>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-border/80 bg-card/60 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/creator/phase-2/concept-name")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — Visual Identity
        </div>
      </header>

      {/* Section Heading */}
      <div className="px-6 pt-10 pb-6 sm:px-10 max-w-2xl mx-auto w-full text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          Step 2.3
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 leading-tight">
          Build your brand identity
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Craft a complete, production-ready brand identity kit in a guided 7-step studio session.
        </p>
      </div>

      {/* Single Primary Studio Card */}
      <div className="flex-1 flex flex-col items-center px-6 sm:px-10 pb-12 max-w-3xl mx-auto w-full space-y-6">
        <Card className="w-full rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Compass className="size-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      7-Step Guided Session
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Brand Visual Identity Studio
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A comprehensive, interactive studio session producing a cohesive brand kit across logo, colour, and typography systems.
                  </p>
                </div>
              </div>
            </div>

            {/* Deliverables Box */}
            <div className="bg-muted/30 border border-border/60 rounded-xl p-5 space-y-3">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                What you will produce (6 concrete deliverables)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STUDIO_DELIVERABLES.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
              <span className="text-xs text-muted-foreground font-mono">
                Estimated time: ~5 minutes
              </span>
              <Button
                onClick={handleOpenStudio}
                size="lg"
                className="w-full sm:w-auto px-8 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm inline-flex items-center justify-center gap-2"
              >
                <span>Open Brand Studio</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Secondary Row (Skip) & Marketplace Notice */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={skipping}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            {skipping ? "Skipping…" : "Skip for now"}
            <ArrowRight className="size-3.5 ml-1.5" />
          </Button>

          {skipError && (
            <p className="text-xs text-destructive">{skipError}</p>
          )}

          <p className="text-xs text-muted-foreground/70 max-w-md">
            Prefer a human designer? Hiring verified designers arrives when the marketplace opens.
          </p>
        </div>
      </div>
    </div>
  );
}

