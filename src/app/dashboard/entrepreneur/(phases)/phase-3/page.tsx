'use client';

import { BarChart3, TrendingUp, Zap } from 'lucide-react';
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
      subtitle="Build credibility with AI-generated valuation and KPI baseline"
      icon={BarChart3}
      trustScore={22}
      isLocked={!isPhase2Complete}
      startHref="/dashboard/entrepreneur/phase-3/step-1"
      requirements={[
        {
          icon: TrendingUp,
          title: 'Revenue Input',
          description: 'Enter revenue and expenses for the last four quarters (Q1–Q4)',
        },
        {
          icon: BarChart3,
          title: 'Automated Valuation',
          description: 'System generates AI-driven valuation based on sector benchmarks',
        },
        {
          icon: TrendingUp,
          title: 'KPI Baseline',
          description: 'Set baseline metrics for growth tracking',
        },
        {
          icon: BarChart3,
          title: 'Projections',
          description: '3-year financial projections and scenario analysis',
        },
      ]}
      features={[
        {
          title: 'AI-Powered Valuation',
          description: 'Automated analysis based on revenue, growth rate, and industry benchmarks',
        },
        {
          title: 'KPI Tracking',
          description: 'Connect Stripe, ChartMogul, or manually enter metrics',
        },
        {
          title: 'Scenario Analysis',
          description: 'Model growth scenarios and funding impact',
        },
        {
          title: 'Investor-Ready Data',
          description: 'Export financial summaries for investor presentations',
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
