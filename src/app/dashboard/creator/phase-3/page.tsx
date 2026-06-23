'use client';

import { useRouter } from 'next/navigation';
import { Calculator, ArrowRight, ArrowLeft, TrendingUp, ShieldCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';

// Tier-2 reconciliation: this step used to collect price/conversion/churn/growth/
// startup-cost inputs that DEAD-ENDED — the C-4 forecast engine never reads them; it
// owns its own ARPU/OPEX/growth/TAM (persisted to ForecastSession.Inputs, with TAM the
// canonical Tier-1b source). Collecting them here was a false signal (numbers that look
// consequential but are ignored). So there is now ONE authoritative financial-input
// surface — the Forecast step — and this step orients the creator to it instead of
// duplicating it. (Churn is intentionally NOT collected here: wiring churn → forecast
// LTV/CAC is the LTV/CAC gate's job, not this reconciliation.)
export default function Phase3FinancialModelingPage() {
  const router = useRouter();
  const { state, completeStep } = useCreatorProgress();
  const projectName = state.project.name || 'your concept';

  const handleContinue = () => {
    completeStep(3, 1); // Step 3.1 acknowledged
    // New order: business plan (step 2) precedes the forecast (step 3).
    router.push('/dashboard/creator/phase-3/business-plan');
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.1"
      title="Financial Modeling"
      description={`Here's how ${projectName}'s financials are modeled in Phase 3 — and where you enter the numbers.`}
      stepLabel="Phase 3 Step 1 of 6"
      progress={16}
    >
      <Card className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/5 text-primary rounded-lg shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">One place for your financial inputs</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your financial assumptions are entered and owned in the <span className="font-semibold text-foreground">Forecast</span> step.
              That&apos;s the single source for your revenue, costs, growth, and market size — there&apos;s no need to enter
              the same numbers twice.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> You&apos;ll set in the Forecast
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ARPU (price per customer), monthly OPEX, growth rate, and market size (TAM) — fed straight into your
              36-month simulation.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Why it&apos;s here
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The forecast feeds your business plan, readiness score, and investor matching — so your numbers stay
              consistent everywhere they appear.
            </p>
          </div>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-2 text-xs">
          <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Churn isn&apos;t modeled yet.</span> Customer churn (for LTV/CAC)
            is a planned forecast input — it isn&apos;t collected here so nothing implies it affects your numbers before
            it&apos;s wired in.
          </p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-8">
        <Button variant="ghost" onClick={() => router.push('/dashboard/creator')} className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl self-start sm:self-center">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Button>
        <Button onClick={handleContinue} className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-sm flex items-center justify-center gap-1.5 shadow-sm">
          Continue to Business Plan <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Phase3SetupShell>
  );
}
