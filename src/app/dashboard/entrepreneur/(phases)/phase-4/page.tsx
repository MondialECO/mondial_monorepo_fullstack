'use client';

import Link from 'next/link';
import { ArrowRight, PieChart, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const PHASE_4_STEPS = [
  { step: 1, title: 'Founder & Investor Equity', description: 'Define founder and investor grants', icon: Users },
  { step: 2, title: 'ESOP, Issuance & Vesting', description: 'Allocate the option pool, record issuances, declare vesting', icon: PieChart },
  { step: 3, title: 'Ownership History & Submit', description: 'Record dilution events and submit the cap table for review', icon: ShieldCheck },
];

function Phase4PageContent() {
  const { progress } = useEntrepreneurProgress();
  if (!progress) return null;

  const isPhase3Complete = progress.completedPhases.has(3);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">
            Phase 4: Cap Table Submission
          </h1>
          <p className="text-lg text-muted-foreground">
            Submit your founder, investor, and ESOP grants with vesting schedules and ownership history.
            All data is persisted to the backend and validated server-side.
          </p>
        </div>

        <div className="space-y-3">
          {PHASE_4_STEPS.map(({ step, title, description, icon: Icon }) => (
            <div
              key={step}
              className="bg-background border border-border rounded-2xl p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {step}
                </p>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happens after submission</h3>
          <p className="text-sm text-blue-800">
            Submitting your cap table sends it to compliance review and unlocks Phase 5. Vesting is
            calculated by the backend from the schedules you declare. Verified status is awarded
            separately after a reviewer approves your submission.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/entrepreneur">Back to overview</Link>
          </Button>
          <Button asChild disabled={!isPhase3Complete}>
            <Link href="/dashboard/entrepreneur/phase-4/step-1">
              {isPhase3Complete ? 'Start submission' : 'Complete Phase 3 first'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Phase4Page() {
  return (
    <RouteGuard requiredPhase={4}>
      <Phase4PageContent />
    </RouteGuard>
  );
}
