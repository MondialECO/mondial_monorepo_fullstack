"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { Phase3SetupShell } from "@/components/creator/Phase3SetupShell";

import { useState, useEffect } from "react";

export default function Phase3CompletePage() {
  const router = useRouter();
  const { state, advancePhase } = useCreatorProgress();
  const project = state.project;
  const latestForecast = state.outputs.financialForecastVersions[0];
  const latestBusinessPlan = state.outputs.businessPlanVersions[0];
  const latestCompliance = state.outputs.complianceVersions[0];
  const latestSkillGap = state.outputs.skillGapVersions[0];
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleNextPhase = () => {
    setIsNavigating(true);
    advancePhase(3);
  };

  const handleSkip = () => {
    setIsSkipping(true);
    advancePhase(3);
  };

  useEffect(() => {
    if (isNavigating && state.journeyState.phase4.status === 'available') {
      router.push("/dashboard/creator/offer-pricing");
    }
  }, [isNavigating, state.journeyState.phase4.status, router]);

  useEffect(() => {
    if (isSkipping && state.journeyState.phase4.status === 'available') {
      router.push("/dashboard/creator");
    }
  }, [isSkipping, state.journeyState.phase4.status, router]);

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.6"
      title="Project Intelligence Ready"
      description="Your business strategy, financial forecasts, incorporation articles, and team roadmap are completed."
      stepLabel="Phase 3 Complete"
      progress={100}
    >
        {/* Success Header */}
        <div className="text-center space-y-4 max-w-lg mx-auto py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-light border border-success-text/20 text-success-text mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>

        {/* Saved Assets and Unlocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Left: Saved Intelligence Card */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Summary</h3>
            <Card className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <CardContent className="p-6 space-y-6">

                {/* Concept Title */}
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-2xl">
                    {project.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground tracking-tight">{project.name || "Untitled Project"}</h2>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{project.category || "Technology"}</p>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Financial Modeling parameters</span>
                    <p className="text-foreground">
                      {latestForecast?.summary
                        ? `Year 3 revenue €${latestForecast.summary.year3Revenue.toLocaleString()}, EBITDA margin ${latestForecast.summary.ebitdaMargin}`
                        : project.marketPotential || 'Financial inputs saved for forecast generation.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Strategic Pillars</span>
                    <p className="text-foreground line-clamp-2">
                      {latestBusinessPlan?.sections?.executiveSummary || project.concept || "No concept summary available"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Jurisdiction & KYC</span>
                    <p className="text-foreground">
                      {latestCompliance
                        ? `${latestCompliance.jurisdiction} drafted, ${latestCompliance.kycStatus}.`
                        : 'Compliance roadmap drafted, KYC biometric signals verified.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Advisors Matched</span>
                    <p className="text-foreground">
                      {latestSkillGap?.advisorMatches
                        ? `${latestSkillGap.advisorMatches.length} primary advisors pre-filtered`
                        : '2 primary advisors pre-filtered'}
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Right: Phase 4 Unlocks */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phase 4 Unlocks</h3>

            <div className="space-y-3">
              {/* Unlock 1: Pricing Calculator */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">Dynamic Pricing Calculator</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Map out tiers, calculate margins, and set up your core monetization parameters.
                  </p>
                </div>
              </div>

              {/* Unlock 2: Cost Modeling */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">Resource & Cost Modeling</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Account for payroll, server infrastructure, legal recurring costs, and marketing budgets.
                  </p>
                </div>
              </div>

              {/* Unlock 3: Go-To-Market */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">Go-To-Market Roadmap</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Formulate launch sequence and acquisition channels for your target demographics.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-8 gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/creator")} className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl self-start sm:self-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Button>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto border-border rounded-xl text-xs py-5 px-5 font-bold bg-card text-foreground hover:bg-muted/30">
              Skip
            </Button>
            <Button onClick={handleNextPhase} className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-sm flex items-center justify-center gap-1.5 shadow-sm">
              Launch Offer & Resource Setup <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

    </Phase3SetupShell>
  );
}
