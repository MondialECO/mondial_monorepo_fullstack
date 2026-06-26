import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import Phase8Client from './client';

export default function Phase8Page() {
  return (
    <RouteGuard requiredPhase={8}>
      {/* <EntrepreneurLayout sidebar={<div />}> */}
        <div className="space-y-6 md:space-y-8">
          <Phase8Client />
        </div>
      {/* </EntrepreneurLayout> */}
    </RouteGuard>
  );
}
