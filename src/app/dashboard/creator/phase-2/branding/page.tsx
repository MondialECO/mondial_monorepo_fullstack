"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, Users, Wand2, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

export default function BrandingOptionsPage() {
  const router = useRouter();
  const { state, setState } = useCreatorProgress();
  const [hoveredCard, setHoveredCard] = useState<"designer" | "ai" | null>(null);

  const handleSelectDesigner = () => {
    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        branding: {
          ...prev.project.branding,
          logoType: "designer",
        },
        exists: true,
      },
    }));
    router.push("/dashboard/creator/phase-2/hire-designer");
  };

  const handleSelectAI = () => {
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
    router.push("/dashboard/creator/phase-2/logo-tool");
  };

  const handleSkip = () => {
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
      {/* Isolated Onboarding Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/phase-2/concept-name")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6 — Branding Options
        </div>
      </header>

      {/* Progress Bar (78% filled) */}
      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "78%" }} />
      </div>

      {/* Section Header */}
      <div className="px-6 py-8 sm:px-10 max-w-2xl mx-auto w-full text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2.3</span>
        <h1 className="text-3xl font-extrabold text-foreground mt-2 leading-tight">
          Build your brand identity
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          A visual identity is essential for your project. Choose one of the two options below to move forward.
        </p>
      </div>

      {/* Choice Cards Container */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 px-6 sm:px-10 pb-10 max-w-4xl mx-auto w-full">
        {/* LEFT CARD — M50 Designer */}
        <Card
          onClick={handleSelectDesigner}
          onMouseEnter={() => setHoveredCard("designer")}
          onMouseLeave={() => setHoveredCard(null)}
          className={`flex-1 flex flex-col justify-between rounded-2xl border p-6 cursor-pointer transition-all duration-300 ${
            hoveredCard === "designer"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 -translate-y-0.5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <CardContent className="p-0 flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                  <Star className="w-3 h-3 fill-current" /> Recommended
                </span>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <Users className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-foreground sm:text-xl mb-2">
                Hire Verified Designer
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Directly connect with top-tier verified designers. AI pre-filters the best branding specialists for your sector.
              </p>

              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">What you get</span>
                <div className="space-y-1.5">
                  {["Professional logo concepts", "Brand color, palette and typography", "Full brand guideline documentation", "Source files"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">
                €200–500 · 3–7 days
              </span>
              <Button size="sm" className="rounded-lg font-bold bg-primary text-primary-foreground hover:bg-primary/95">
                Browse Designers <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT CARD — AI Logo Tool */}
        <Card
          onClick={handleSelectAI}
          onMouseEnter={() => setHoveredCard("ai")}
          onMouseLeave={() => setHoveredCard(null)}
          className={`flex-1 flex flex-col justify-between rounded-2xl border p-6 cursor-pointer transition-all duration-300 ${
            hoveredCard === "ai"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 -translate-y-0.5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <CardContent className="p-0 flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-600">
                  Free · Instant
                </span>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-600 mb-4">
                <Wand2 className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-foreground sm:text-xl mb-2">
                Use AI Logo Tool
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Free and instant branding kit. Good for early validation. AI generates logo options based on your name and sector.
              </p>

              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">What you get</span>
                <div className="space-y-1.5">
                  {["AI-generated logo options", "Automated color palette generation", "Basic font pairing suggestions", "SVG and PNG exports"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-xs font-semibold text-green-600">
                Free · Instant
              </span>
              <Button size="sm" variant="outline" className="rounded-lg font-bold border-primary text-primary hover:bg-primary/5">
                Generate with AI <Sparkles className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
        <Button variant="ghost" onClick={() => router.push("/dashboard/creator/phase-2/concept-name")} className="text-xs font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>
        <Button variant="ghost" onClick={handleSkip} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          Skip Branding for Now <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
