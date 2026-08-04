"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi, type InvestorReadinessScore } from "@/lib/api-creator-journey";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";
import { cn } from "@/lib/utils";

type UnlockItem = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tone: "blue" | "gold";
};

const UNLOCKS: UnlockItem[] = [
  {
    icon: BarChart3,
    title: "Dynamic Pricing Calculator",
    body: "Map tiers, calculate margins, and monetization.",
    tone: "gold",
  },
  {
    icon: FileText,
    title: "Resource & Cost Modeling",
    body: "Payroll, infra, legal, and marketing budgets.",
    tone: "blue",
  },
  {
    icon: ArrowRight,
    title: "Go-To-Market",
    body: "Launch sequence and acquisition channels.",
    tone: "gold",
  },
];

const gradeForScore = (score: number) => {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
};

const displayScore = (score: number) => Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1);

function ProgressTrack({ value, max, prominent = false }: { value: number; max: number; prominent?: boolean }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("overflow-hidden rounded-full bg-black/[0.08]", prominent ? "h-2" : "h-1")}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percentage}%` }} />
    </div>
  );
}

export default function Phase3CompletePage() {
  const router = useRouter();
  const { advancePhase } = useCreatorProgress();

  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [readiness, setReadiness] = useState<InvestorReadinessScore | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        try {
          const { investorReadinessScore } = await creatorJourneyApi.completeMasterplan();
          if (active) setReadiness(investorReadinessScore);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 422) {
            const message = (error.response.data?.message as string) ?? "A module is missing.";
            if (active) setMissing(message.replace("Missing module: ", ""));
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

  const canContinue = computed?.phase3.status === "completed" && computed?.phase4.status === "available";

  const handleContinue = async () => {
    if (!canContinue) return;
    setIsNavigating(true);
    advancePhase(3);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const { computedStatus } = await creatorJourneyApi.get();
        if (computedStatus?.phase4?.status === "available") break;
      } catch {
        // Keep polling briefly; the destination performs its own backend gate too.
      }
    }

    router.push("/dashboard/creator/offer-pricing");
  };

  const breakdown = readiness ? [
    { label: "General Clarity", value: readiness.breakdown.conceptClarity, max: 20 },
    { label: "Market Evidence", value: readiness.breakdown.marketEvidence, max: 20 },
    { label: "Monetization", value: readiness.breakdown.financialModel, max: 25 },
    { label: "Legal Readiness", value: readiness.breakdown.legalReadiness, max: 15 },
    { label: "Team Credibility", value: readiness.breakdown.teamCredibility, max: 20 },
  ] : [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 px-5 py-12 text-foreground sm:px-8 lg:py-16">
      <main className="mx-auto flex w-full max-w-[600px] flex-1 flex-col gap-10">
        <header className="mx-auto flex w-full max-w-[503px] flex-col items-center gap-4 text-center">
          <div className="flex size-[72px] items-center justify-center rounded-full border border-white bg-card">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#14835f] text-white">
              <Check className="size-4 stroke-[3]" aria-hidden="true" />
            </span>
          </div>
          <h1 className="text-[32px] font-semibold leading-10 tracking-normal text-foreground">
            Project intelligence Ready
          </h1>
          <p className="text-base leading-6 text-muted-foreground">
            Your forecast, business plan, legal checklist and information are assembled into your AI Masterplan
          </p>
        </header>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Scoring your masterplan…
          </div>
        )}

        {!loading && missing && (
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
            <AlertTriangle className="size-5 shrink-0" />
            <p>
              One module still needs attention: <strong>{missing.replace(/_/g, " ")}</strong>. Finish it to unlock Phase 4.
            </p>
          </div>
        )}

        {!loading && (
          <section className="space-y-3" aria-labelledby="investor-readiness-heading">
            <h2 id="investor-readiness-heading" className="text-xs font-medium uppercase leading-4 text-primary">
              Investor Readiness
            </h2>

            <div className="overflow-hidden rounded-[20px] border border-white bg-card/75">
              {readiness ? (
                <>
                  <div className="space-y-4 border-b border-black/[0.06] p-6">
                    <div className="flex items-end justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium leading-4 text-muted-foreground">Overall Readiness</p>
                        <p className="text-[56px] font-extrabold leading-[64px] text-foreground">
                          {displayScore(readiness.total)}
                        </p>
                      </div>
                      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/5 px-2.5 py-1.5 text-[11px] font-semibold leading-4 text-primary">
                        <span>{gradeForScore(readiness.total)}</span>
                        <span>{readiness.label}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium leading-4 text-muted-foreground">
                        <span>Progress</span>
                        <span>{displayScore(readiness.total)}%</span>
                      </div>
                      <ProgressTrack value={readiness.total} max={100} prominent />
                    </div>
                  </div>

                  <div>
                    {breakdown.map((item, index) => (
                      <div
                        key={item.label}
                        className={cn(
                          "flex items-center justify-between gap-6 px-6 py-4",
                          index < breakdown.length - 1 && "border-b border-black/[0.06]",
                        )}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-base font-medium leading-6 text-foreground">{item.label}</h3>
                          <p className="text-xs leading-4 text-muted-foreground">
                            {displayScore(item.value)} / {item.max}
                          </p>
                        </div>
                        <div className="w-[42%] max-w-[220px] min-w-[120px]">
                          <ProgressTrack value={item.value} max={item.max} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="p-6 text-sm leading-6 text-muted-foreground">
                  Complete the business plan, forecast, and formation modules to compute your readiness score.
                </p>
              )}
            </div>
          </section>
        )}

        <section className="space-y-3" aria-labelledby="unlocks-heading">
          <h2 id="unlocks-heading" className="text-xs font-medium uppercase leading-4 text-primary">Unlock</h2>
          <div className="space-y-3">
            {UNLOCKS.map(({ icon: Icon, title, body, tone }) => (
              <div key={title} className="flex items-center gap-2 rounded-xl border border-white bg-card/75 p-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border border-black/[0.08]",
                    tone === "blue" ? "bg-primary/5 text-primary" : "bg-[#f9f2e8] text-[#a66a14]",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 space-y-1 text-xs leading-4">
                  <h3 className="font-medium text-foreground">{title}</h3>
                  <p className="text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/creator")}
            disabled={isNavigating}
            className="h-10 rounded-xl border-border px-4 text-sm font-medium text-muted-foreground shadow-none"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Button>
          <Button
            onClick={handleContinue}
            disabled={isNavigating || !canContinue}
            className="h-10 gap-2 rounded-xl px-4 text-[13px] font-semibold disabled:opacity-60"
          >
            {isNavigating && <Loader2 className="size-4 animate-spin" />}
            Launch Offer &amp; Resource Setup
            {!isNavigating && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </main>
    </div>
  );
}
