'use client';

import { PieChart, TrendingUp } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseTemplate } from '@/components/entrepreneur/PhaseTemplate';

export default function Phase4Page() {
  const { progress } = useEntrepreneurProgress();
  if (!progress) return null;
  const isPhase3Complete = progress.completedPhases.has(3);
  return (
    <PhaseTemplate
      phaseNumber={4}
      title="Phase 4: Equity Structure & Ownership"
      subtitle="Define cap table, ESOP, and analyze dilution scenarios"
      icon={PieChart}
      trustScore={12}
      isLocked={!isPhase3Complete}
      requirements={[
        { icon: PieChart, title: 'Cap Table', description: 'Document all shares, options, and equity allocations' },
        { icon: TrendingUp, title: 'ESOP Program', description: 'Employee Stock Ownership Plan structure' },
        { icon: PieChart, title: 'Dilution Analysis', description: 'Model future funding rounds' },
        { icon: TrendingUp, title: 'Shareholder Rights', description: 'Define voting and preference terms' },
      ]}
      features={[
        { title: 'Cap Table Management', description: 'Track equity across all shareholders' },
        { title: 'Dilution Simulator', description: 'Visualize funding impact' },
        { title: 'ESOP Calculator', description: 'Vesting and incentive modeling' },
        { title: 'Waterfall Analysis', description: 'Exit scenario modeling' },
      ]}
    />
  );
}
