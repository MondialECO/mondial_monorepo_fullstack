'use client';

import { FolderOpen, TrendingUp } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { PhaseTemplate } from '@/components/entrepreneur/PhaseTemplate';

export default function Phase6Page() {
  const { progress } = useEntrepreneurProgress();
  if (!progress) return null;
  const isPhase5Complete = progress.completedPhases.has(5);
  return (
    <PhaseTemplate
      phaseNumber={6}
      title="Phase 6: Data Room"
      subtitle="Secure document vault for investor due diligence"
      icon={FolderOpen}
      trustScore={3}
      isLocked={!isPhase5Complete}
      requirements={[
        { icon: FolderOpen, title: 'Legal Documents', description: 'Articles, bylaws, cap table' },
        { icon: TrendingUp, title: 'Financial Records', description: 'Historical financials and tax filings' },
        { icon: FolderOpen, title: 'IP & Patents', description: 'Intellectual property documentation' },
        { icon: TrendingUp, title: 'Team Information', description: 'Bios, backgrounds, and org chart' },
      ]}
      features={[
        { title: 'Secure Storage', description: 'Bank-grade encryption for all documents' },
        { title: 'Access Control', description: 'Granular permissions for different stakeholders' },
        { title: 'Activity Tracking', description: 'Monitor who accessed which documents' },
        { title: 'Version Management', description: 'Track document versions and updates' },
      ]}
    />
  );
}
