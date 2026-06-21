"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, BarChart3, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

import { useState, useEffect } from "react";

export default function Phase2CompletePage() {
  const router = useRouter();
  const { state, advancePhase } = useCreatorProgress();
  const project = state.project;
  const branding = project.branding;
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleNextPhase = () => {
    setIsNavigating(true);
    advancePhase(2);
  };

  const handleSkip = () => {
    setIsSkipping(true);
    advancePhase(2);
  };

  useEffect(() => {
    if (isNavigating && state.journeyState.phase3.status === 'available') {
      router.push("/dashboard/creator/phase-3");
    }
  }, [isNavigating, state.journeyState.phase3.status, router]);

  useEffect(() => {
    if (isSkipping && state.journeyState.phase3.status === 'available') {
      router.push("/dashboard/creator");
    }
  }, [isSkipping, state.journeyState.phase3.status, router]);

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-xs gap-4">
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
      </div>

      {/* Progress bar (100% for Phase 2) */}
      <div className="w-full h-[3px] bg-muted">
        <div className="h-full bg-primary rounded-r" style={{ width: "100%" }} />
      </div>

      {/* Main Content */}
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
                  {branding.logoType === "ai" ? (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-amber-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-sm select-none">
                      {project.name?.charAt(0) || "A"}
                    </div>
                  ) : branding.logoType === "designer" ? (
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
          <Button variant="ghost" onClick={() => router.push("/dashboard/creator/myideas")} className="text-xs font-semibold self-start sm:self-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to My Idea
          </Button>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto border-border rounded-xl text-xs py-5 px-5 font-bold bg-card text-foreground hover:bg-muted/30">
              Skip
            </Button>
            <Button onClick={handleNextPhase} className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-sm flex items-center justify-center gap-1.5 shadow-sm">
              Launch Project Intelligence <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
