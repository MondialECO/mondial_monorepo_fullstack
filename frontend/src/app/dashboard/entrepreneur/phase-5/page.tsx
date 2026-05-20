'use client';

import { Zap, TrendingUp } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseTemplate } from '@/components/entrepreneur/PhaseTemplate';

export default function Phase5Page() {
  const { progress } = useEntrepreneurProgress();
  if (!progress) return null;
  const isPhase4Complete = progress.completedPhases.has(4);
  return (
    <PhaseTemplate
      phaseNumber={5}
      title="Phase 5: Needs & Funding Analysis"
      subtitle="Define funding requirements and use of funds strategy"
      icon={Zap}
      trustScore={8}
      isLocked={!isPhase4Complete}
      requirements={[
        { icon: Zap, title: 'Funding Ask', description: 'Define total capital needed and timeline' },
        { icon: TrendingUp, title: 'Use of Funds', description: 'Breakdown allocation across categories' },
        { icon: Zap, title: 'Financial Projections', description: 'Revenue and profitability timeline' },
        { icon: TrendingUp, title: 'Market Analysis', description: 'TAM, SAM, SOM and competitive positioning' },
      ]}
      features={[
        { title: 'Funding Calculator', description: 'Determine capital needs based on roadmap' },
        { title: 'Use of Funds Template', description: 'Structured allocation breakdown' },
        { title: 'Runway Analysis', description: 'Burn rate and cash runway projection' },
        { title: 'Market Size Estimation', description: 'TAM/SAM sizing tools' },
      ]}
    />
  );
}
