'use client';

import { Zap, TrendingUp } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseTemplate } from '@/components/entrepreneur/PhaseTemplate';

export default function Phase7Page() {
  const { progress } = useEntrepreneurProgress();
  if (!progress) return null;
  const isPhase6Complete = progress.completedPhases.has(6);
  return (
    <PhaseTemplate
      phaseNumber={7}
      title="Phase 7: AI Expert Review"
      subtitle="Get investor-ready badge from AI analysis"
      icon={Zap}
      trustScore={5}
      isLocked={!isPhase6Complete}
      requirements={[
        { icon: Zap, title: 'Business Plan', description: 'Comprehensive pitch and strategy' },
        { icon: TrendingUp, title: 'Market Analysis', description: 'Validated TAM and positioning' },
        { icon: Zap, title: 'Team Profile', description: 'Founder expertise and advisory board' },
        { icon: TrendingUp, title: 'Financial Model', description: 'Complete 3-5 year projections' },
      ]}
      features={[
        { title: 'AI Analysis', description: 'ML-powered assessment of investment readiness' },
        { title: 'Investor-Ready Badge', description: 'Unlock when you meet quality standards' },
        { title: 'Improvement Suggestions', description: 'AI recommendations for stronger pitch' },
        { title: 'Competitive Insights', description: 'Compare against similar startups' },
      ]}
    />
  );
}
