import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import Phase9Client from './client';

export default function Phase9Page() {
  return (
    <RouteGuard requiredPhase={9}>
      <EntrepreneurLayout sidebar={<div />}>
        <div className="space-y-6 md:space-y-8">
          <PhaseHeader
            title="Deal Execution"
            subtitle="Deterministic deal pipeline. Status transitions, term sheets, due diligence, and documents are backend-authoritative; the timeline is derived from the activity log."
            progressLabel="PROGRESS"
            progressValue="Phase 9 of 10"
            progressPercentage={90}
          />
          <Phase9Client />
        </div>
      </EntrepreneurLayout>
    </RouteGuard>
  );
}
