'use client';

import { BarChart3, TrendingUp, Lightbulb, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseTemplate } from '@/components/entrepreneur/PhaseTemplate';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

function Phase3PageContent() {
  const router = useRouter();
  const { progress } = useEntrepreneurProgress();

  if (!progress) return null;

  const isPhase2Complete = progress.completedPhases.has(2);
  const isPhase3Active = progress.currentPhase === 3;
  const isPhase3Complete = progress.completedPhases.has(3);

  return (
    <div>
      <PhaseTemplate
        phaseNumber={3}
        title="Phase 3: Financial Valuation & KPI"
        subtitle="Submit quarterly revenue, review your AI valuation, enter your KPI baseline, and describe your concept"
        icon={BarChart3}
        trustScore={22}
        isLocked={!isPhase2Complete}
        startHref="/dashboard/entrepreneur/phase-3/step-1"
        requirements={[
          {
            icon: TrendingUp,
            title: 'Revenue Input',
            description: 'Quarterly revenue (Q1–Q4) for the last four quarters',
          },
          {
            icon: BarChart3,
            title: 'Automated Valuation',
            description: 'Review your AI-estimated valuation derived from revenue and sector benchmarks',
          },
          {
            icon: TrendingUp,
            title: 'Live KPI Tracking',
            description: 'MRR, burn rate, CAC, LTV, churn, and NPS traction metrics',
          },
          {
            icon: Lightbulb,
            title: 'Concept Overview',
            description: 'Explain your core concept, problem, solution, market, and stage',
          },
        ]}
        features={[
          {
            title: 'Backend-Calculated Valuation',
            description: 'Valuation is computed by the backend from your submitted financial data',
          },
          {
            title: 'KPI Baseline Tracking',
            description: 'Your baseline metrics are persisted for ongoing growth comparison',
          },
          {
            title: 'Compliance Review',
            description: 'Submitted documents go through compliance review; verification is awarded after approval',
          },
          {
            title: 'Investor-Ready Data',
            description: 'Once reviewed, summaries become exportable for investor conversations',
          },
        ]}
      />

      {(isPhase3Active || isPhase3Complete) && (
        <div className="max-w-4xl mx-auto px-4 py-6 border-t border-neutral-2">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-neutral-1">Live KPI Tracker</h3>
          </div>
          <p className="text-sm text-neutral-5 mb-4">Monitor your key performance indicators in real-time as you progress through Phase 3.</p>
          <Button
            onClick={() => router.push('/dashboard/entrepreneur/phase-3/kpi-tracker')}
          >
            View KPI Tracker
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Phase3Page() {
  return (
    <RouteGuard requiredPhase={3}>
      <Phase3PageContent />
    </RouteGuard>
  );
}
