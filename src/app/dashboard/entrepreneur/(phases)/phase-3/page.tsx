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
      title="Phase 3: Financial Submission"
      subtitle="Submit revenue, cash position, KPI baseline, and required financial reports for compliance review"
      icon={BarChart3}
      trustScore={22}
      isLocked={!isPhase2Complete}
      startHref="/dashboard/entrepreneur/phase-3/step-1"
      requirements={[
        {
          icon: TrendingUp,
          title: 'Revenue & Cash',
          description: 'Quarterly revenue, monthly cash on hand, and monthly burn rate',
        },
        {
          icon: BarChart3,
          title: 'Equity Structure',
          description: 'Cap table allocations totalling ~100% of issued shares',
        },
        {
          icon: TrendingUp,
          title: 'KPI Baseline',
          description: 'MRR, ARR, gross margin, CAC, LTV, churn, and active accounts',
        },
        {
          icon: BarChart3,
          title: 'Financial Reports',
          description: 'Upload P&L and balance sheet for compliance review',
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
