"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreatorForecastVersion } from "@/types/creator/creator-journey";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { getNextCreatorAction } from "@/lib/creator-state-resolver";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  ArrowRight,
  Pencil,
  FileText,
  TrendingUp,
  AlertTriangle,
  Flame,
  Layout
} from "lucide-react";

export default function MyIdeasPage() {
  const router = useRouter();
  const { state, resetJourney, updateProject, setEntryPath } = useCreatorProgress();
  const { journeyState, project } = state;
  const [showConfirmStartOver, setShowConfirmStartOver] = useState(false);

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

  const handleStartOver = () => {
    resetJourney();
    setShowConfirmStartOver(false);
  };

  const handleEditConcept = () => {
    router.push("/dashboard/creator/phase-2/idea-summary");
  };

  const handleStartNewIdea = () => {
    setShowConfirmStartOver(true);
  };

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

        {/* Start Over Confirmation Modal */}
        {showConfirmStartOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <Card className="max-w-md w-full border border-border bg-card p-6 shadow-xl space-y-4 rounded-2xl">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-extrabold text-lg">Are you absolutely sure?</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                This will delete your current draft project, including your name, logo selections, and AI chat progress. This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleStartOver}
                  className="flex-1 rounded-xl bg-destructive hover:bg-destructive/95 text-white font-bold"
                >
                  Yes, start over
                </Button>
                <Button
                  onClick={() => setShowConfirmStartOver(false)}
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

      {/* Start Over Confirmation Modal (reused here for Starting New Idea) */}
      {showConfirmStartOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full border border-border bg-card p-6 shadow-xl space-y-4 rounded-2xl">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-extrabold text-lg">Create a New Idea?</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              This will archive your current completed project identity and start a fresh onboarding journey. You can access it anytime from project logs.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleStartOver}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/95 text-white font-bold"
              >
                Yes, start new
              </Button>
              <Button
                onClick={() => setShowConfirmStartOver(false)}
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
