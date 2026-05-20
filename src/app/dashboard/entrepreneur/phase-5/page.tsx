import { Lightbulb, ArrowRight } from 'lucide-react';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { Button } from '@/components/ui/button';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import Phase5Client from './client';

export default function Phase5Page() {
  return (
    <RouteGuard requiredPhase={5} requiredStep={0}>
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

              <Phase5Client />
            </div>
          </div>
        </div>
      </EntrepreneurLayout>
    </RouteGuard>
  );
}
