'use client';

import { BarChart3, TrendingUp, Lightbulb } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseTemplate } from '@/components/entrepreneur/PhaseTemplate';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

function Phase3PageContent() {
  const { progress } = useEntrepreneurProgress();

  if (!progress) return null;

  const isPhase2Complete = progress.completedPhases.has(2);

  return (
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
  );
}

export default function Phase3Page() {
  return (
    <RouteGuard requiredPhase={3}>
      <Phase3PageContent />
    </RouteGuard>
  );
}
