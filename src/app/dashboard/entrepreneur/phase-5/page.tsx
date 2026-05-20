'use client';

import { useRouter } from 'next/navigation';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const PHASE_5_STEPS = [
  { step: 1 as const, title: 'Legal Identity', subtitle: 'Enter company info' },
  { step: 2 as const, title: 'Required Documentation', subtitle: 'Upload documents' },
  { step: 3 as const, title: 'Ownership & KYC', subtitle: 'Verify owners' },
  { step: 4 as const, title: 'Financial Preview', subtitle: 'Review summary' },
  { step: 5 as const, title: 'Resource Allocation', subtitle: 'Budget planning' },
];

function Phase5PageContent() {
  const router = useRouter();
  const { progress } = useEntrepreneurProgress();

  if (!progress) return null;

  return (
    <EntrepreneurLayout>
      <div className="space-y-8 md:space-y-12">
        <PhaseHeader
          title="Advisor Matching"
          subtitle="Connect with experienced advisors and mentors who can guide your company's growth."
          progressLabel="PROGRESS"
          progressValue="Phase 5 of 9"
          progressPercentage={56}
        />

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-2xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-purple-100 dark:bg-purple-900/40 rounded-full p-4">
                <Lightbulb className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-1 dark:text-white">Coming Soon</h2>
              <p className="text-lg text-neutral-5 dark:text-neutral-4">Advisor matching is currently in development</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => router.push('/dashboard/entrepreneur')}>
                Back to Dashboard
              </Button>
              <Button onClick={() => router.push('/dashboard/entrepreneur/phase-2/step-6')} className="gap-2">
                Go to Phase 6 <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase5Page() {
  return (
    <RouteGuard requiredPhase={5} requiredStep={0}>
      <Phase5PageContent />
    </RouteGuard>
  );
}
