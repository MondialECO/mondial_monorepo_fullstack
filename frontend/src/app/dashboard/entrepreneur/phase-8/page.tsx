'use client';

import { Handshake, TrendingUp } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseTemplate } from '@/components/entrepreneur/PhaseTemplate';

export default function Phase8Page() {
  const { progress } = useEntrepreneurProgress();
  if (!progress) return null;
  const isPhase7Complete = progress.completedPhases.has(7);
  return (
    <PhaseTemplate
      phaseNumber={8}
      title="Phase 8: Investor Matching"
      subtitle="AI-matched investors and handshakes"
      icon={Handshake}
      trustScore={5}
      isLocked={!isPhase7Complete}
      requirements={[
        { icon: Handshake, title: 'Investor-Ready Badge', description: 'Earn from Phase 7 completion' },
        { icon: TrendingUp, title: 'Investor Profile', description: 'Types and ticket sizes sought' },
        { icon: Handshake, title: 'Pitch Deck', description: 'Professional presentation ready' },
        { icon: TrendingUp, title: 'Supporting Materials', description: 'One-pagers and executive summary' },
      ]}
      features={[
        { title: 'AI Matching', description: 'Algorithm matches you with relevant investors' },
        { title: 'Handshake System', description: 'Express interest and request intros' },
        { title: 'Investor Directory', description: 'Browse vetted investor profiles' },
        { title: 'Communication Tools', description: 'Built-in messaging and scheduling' },
      ]}
    />
  );
}
