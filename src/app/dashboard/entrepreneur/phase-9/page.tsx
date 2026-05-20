'use client';

import { CheckCircle2, DollarSign, FileText } from 'lucide-react';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

function Phase9PageContent() {
  const router = useRouter();
  const { progress } = useEntrepreneurProgress();

  if (!progress) return null;

  return (
    <EntrepreneurLayout>
      <div className="space-y-8">
        <PhaseHeader
          title="Deal Execution"
          subtitle="Manage term sheets, closing checklists, and finalize your investment deals."
          progressLabel="PROGRESS"
          progressValue="Phase 9 of 9"
          progressPercentage={100}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-xl p-6">
            <DollarSign className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-neutral-1 mb-2">Term Sheet Management</h3>
            <p className="text-sm text-neutral-5">Negotiate and manage investment terms</p>
          </div>

          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-xl p-6">
            <FileText className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-neutral-1 mb-2">Legal Documents</h3>
            <p className="text-sm text-neutral-5">Track and upload closing documents</p>
          </div>

          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-xl p-6">
            <CheckCircle2 className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-neutral-1 mb-2">Closing Checklist</h3>
            <p className="text-sm text-neutral-5">Monitor deal closing milestones</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>Back to Phase 8</Button>
          <Button onClick={() => router.push('/dashboard/entrepreneur')}>Complete & Return Home</Button>
        </div>
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase9Page() {
  return (
    <RouteGuard requiredPhase={9} requiredStep={0}>
      <Phase9PageContent />
    </RouteGuard>
  );
}
