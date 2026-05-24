import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Button } from '@/components/ui/button';

// Terminal phase. No business logic — this page only confirms that the
// entrepreneur journey is complete. Backend currentPhase=10 after a
// successful advancePhase(9) call; RouteGuard requiredPhase={10} lets a
// company that completed Phase 9 land here.
export default function Phase10Page() {
  return (
    <RouteGuard requiredPhase={10}>
      <EntrepreneurLayout sidebar={<div />}>
        <div className="space-y-6 md:space-y-8">
          <PhaseHeader
            title="Journey Complete"
            subtitle="Round closed and recorded. Every prior phase remains accessible for review."
            progressLabel="STATUS"
            progressValue="Phase 10 of 10"
            progressPercentage={100}
          />

          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-700" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-1">Round closed</h2>
            <p className="text-sm text-neutral-5 max-w-xl mx-auto">
              The deal pipeline has been finalised and the round is closed in the system.
              Submission, review, and execution history is preserved on each phase page.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/entrepreneur/phase-9">Review deal execution</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/entrepreneur">Dashboard home</Link>
              </Button>
            </div>
          </div>
        </div>
      </EntrepreneurLayout>
    </RouteGuard>
  );
}
