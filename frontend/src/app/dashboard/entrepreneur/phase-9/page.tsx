'use client';

import { Users, TrendingUp } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseTemplate } from '@/components/entrepreneur/PhaseTemplate';

export default function Phase9Page() {
  const { progress } = useEntrepreneurProgress();
  if (!progress) return null;
  const isPhase8Complete = progress.completedPhases.has(8);
  return (
    <PhaseTemplate
      phaseNumber={9}
      title="Phase 9: Deal Execution"
      subtitle="Term sheets, negotiations, and round close"
      icon={Users}
      trustScore={0}
      isLocked={!isPhase8Complete}
      requirements={[
        { icon: Users, title: 'Term Sheet', description: 'Negotiate investment terms' },
        { icon: TrendingUp, title: 'Legal Review', description: 'Lawyer-reviewed documentation' },
        { icon: Users, title: 'Due Diligence', description: 'Complete investor DD process' },
        { icon: TrendingUp, title: 'Closing', description: 'Final docs and fund transfer' },
      ]}
      features={[
        { title: 'Term Sheet Library', description: 'Standard terms and conditions' },
        { title: 'Negotiation Tracker', description: 'Track key terms and progress' },
        { title: 'Document Management', description: 'Organize all legal agreements' },
        { title: 'Closing Checklist', description: 'Ensure nothing is missed' },
      ]}
    />
  );
}
