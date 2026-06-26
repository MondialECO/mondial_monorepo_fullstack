"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, ArrowRight, BarChart3, FileText, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phase3SetupShell } from "@/components/creator/Phase3SetupShell";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi, type InvestorReadinessScore } from "@/lib/api-creator-journey";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";
import axios from "axios";

const UNLOCKS = [
  { icon: BarChart3, title: "Dynamic Pricing Calculator", body: "Map tiers, calculate margins, set monetization." },
  { icon: FileText, title: "Resource & Cost Modeling", body: "Payroll, infra, legal, and marketing budgets." },
  { icon: ShieldCheck, title: "Go-To-Market Roadmap", body: "Launch sequence and acquisition channels." },
];

export default function Phase3CompletePage() {
  const router = useRouter();
  const { state, advancePhase } = useCreatorProgress();
  const project = state.project;

  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [readiness, setReadiness] = useState<InvestorReadinessScore | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // Try to complete the masterplan (compute readiness). Then read derived status.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        try {
          const { investorReadinessScore } = await creatorJourneyApi.completeMasterplan();
          if (active) setReadiness(investorReadinessScore);
        } catch (e) {
          // 422 → a module is missing; surface which one, don't block the page.
          if (axios.isAxiosError(e) && e.response?.status === 422) {
            const msg = (e.response.data?.message as string) ?? "A module is missing.";
            if (active) setMissing(msg.replace("Missing module: ", ""));
          }
        }
        const { computedStatus } = await creatorJourneyApi.get();
        if (active) setComputed(computedStatus);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Derived gate — no manual status write anywhere.
  const canContinue = computed?.phase3.status === "completed" && computed?.phase4.status === "available";

  const handleContinue = async () => {
    setIsNavigating(true);
    advancePhase(3);

    // Poll backend to confirm phase 4 is unlocked before navigating
    let unlocked = false;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const { computedStatus } = await creatorJourneyApi.get();
        if (computedStatus?.phase4?.status === "available") {
          unlocked = true;
          break;
        }
      } catch (e) {
        // continue polling on error
      }
    }

    router.push("/dashboard/creator/offer-pricing");
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.6"
      title="Project Intelligence Ready"
      description="Your forecast, business plan, legal checklist, and formation are assembled into your AI Masterplan."
    >
      <div className="text-center space-y-3 max-w-lg mx-auto py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-light border border-success-text/20 text-success-text">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      </div>

      {loading && <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Scoring your masterplan…</div>}

      {!loading && missing && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning max-w-2xl mx-auto">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>One module still needs attention: <strong>{missing.replace(/_/g, " ")}</strong>. Finish it to unlock Phase 4.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-4">
        {/* Readiness + summary */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Investor Readiness</h3>
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="p-6 space-y-4">
              {readiness ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-extrabold text-primary">{readiness.total}</div>
                      <div className="text-sm font-semibold text-muted-foreground">{readiness.label}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-2xl">
                      {project.name?.charAt(0) || "P"}
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    {([
                      ["Concept Clarity", readiness.breakdown.conceptClarity, 20],
                      ["Market Evidence", readiness.breakdown.marketEvidence, 20],
                      ["Financial Model", readiness.breakdown.financialModel, 25],
                      ["Legal Readiness", readiness.breakdown.legalReadiness, 15],
                      ["Team Credibility", readiness.breakdown.teamCredibility, 20],
                    ] as const).map(([label, val, max]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{val}/{max}</span></div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(val / max) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Complete all four modules to compute your readiness score.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Phase 4 unlocks */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phase 4 Unlocks</h3>
          <div className="space-y-3">
            {UNLOCKS.map((u) => (
              <div key={u.title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><u.icon className="w-5 h-5" /></div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-foreground">{u.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{u.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-8 gap-4 mt-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/creator")} disabled={isNavigating} className="text-xs font-bold text-muted-foreground self-start sm:self-center">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Button>
        <Button onClick={handleContinue} disabled={isNavigating} className="gap-1.5 disabled:opacity-60">
          Launch Offer &amp; Resource Setup {!isNavigating && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </Phase3SetupShell>
  );
}
