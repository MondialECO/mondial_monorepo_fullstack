'use client';

import { Users, TrendingUp } from 'lucide-react';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

function Phase8PageContent() {
  const router = useRouter();
  const { progress } = useEntrepreneurProgress();

  if (!progress) return null;

  return (
    <EntrepreneurLayout>
      <div className="space-y-8">
        <PhaseHeader
          title="Investor Matching"
          subtitle="Connect with investors who are interested in companies like yours."
          progressLabel="PROGRESS"
          progressValue="Phase 8 of 9"
          progressPercentage={89}
        />

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <Users className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-neutral-1">Investor Matching</h2>
            <p className="text-neutral-5">
              Our AI analyzes your company profile and matches you with investors that fit your stage and industry.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
          <Button onClick={() => router.push('/dashboard/entrepreneur/phase-9')}>
            Go to Phase 9 <TrendingUp className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase8Page() {
  return (
    <RouteGuard requiredPhase={8} requiredStep={0}>
      <Phase8PageContent />
    </RouteGuard>
  );
}
