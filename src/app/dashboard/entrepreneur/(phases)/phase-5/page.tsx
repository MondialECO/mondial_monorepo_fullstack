import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import Phase5Client from './client';

export default function Phase5Page() {
  return (
    <RouteGuard requiredPhase={5}>
      {/* <EntrepreneurLayout sidebar={<div />}> */}
        <div className="space-y-6 md:space-y-8">
          {/* <PhaseHeader
            title="Funding Submission"
            subtitle="Submit your funding ask, pitch deck, and narrative for compliance review. Verification is awarded separately after review."
          /> */}
          <Phase5Client />
        </div>
      {/* </EntrepreneurLayout> */}
    </RouteGuard>
  );
}
