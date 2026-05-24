import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import Phase8Client from './client';

export default function Phase8Page() {
  return (
    <RouteGuard requiredPhase={8}>
      <EntrepreneurLayout sidebar={<div />}>
        <div className="space-y-6 md:space-y-8">
          <PhaseHeader
            title="Automated Investor Matching"
            subtitle="Deterministic backend matching against real investor profiles. LLM-driven personalised matching will replace this when AI provider credentials are configured."
            progressLabel="PROGRESS"
            progressValue="Phase 8 of 9"
            progressPercentage={89}
          />
          <Phase8Client />
        </div>
      </EntrepreneurLayout>
    </RouteGuard>
  );
}
