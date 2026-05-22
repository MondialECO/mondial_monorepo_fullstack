'use client';

import Link from 'next/link';
import { Briefcase, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const phaseSteps = [
  {
    step: 1,
    title: 'Legal Identity',
    description: 'Register your company legal structure',
    href: '/dashboard/entrepreneur/phase-2/step-1',
  },
  {
    step: 2,
    title: 'Document Upload',
    description: 'Upload company documents and certificates',
    href: '/dashboard/entrepreneur/phase-2/step-2',
  },
  {
    step: 3,
    title: 'Ownership & KYC',
    description: 'Verify ownership and beneficial owners',
    href: '/dashboard/entrepreneur/phase-2/step-3',
  },
  {
    step: 4,
    title: 'Financial Preview',
    description: 'Preview your financial information',
    href: '/dashboard/entrepreneur/phase-2/step-4',
  },
];

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  href: string;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
}

function StepCard({
  step,
  title,
  description,
  href,
  isActive,
  isCompleted,
  isLocked,
}: StepCardProps) {
  return (
    <Link href={isLocked ? '#' : href}>
      <div
        className={`border rounded-2xl p-6 transition-all ${
          isLocked
            ? 'border-border bg-neutral-100 opacity-50 cursor-not-allowed'
            : isActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background hover:border-primary hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                isCompleted
                  ? 'bg-green-100 text-green-700'
                  : isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {isActive && <Clock className="w-5 h-5 text-primary animate-pulse" />}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className={`text-xs font-semibold ${
            isCompleted
              ? 'text-green-600'
              : isActive
              ? 'text-primary'
              : 'text-muted-foreground'
          }`}>
            {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Locked'}
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

function Phase2PageContent() {
  const { progress } = useEntrepreneurProgress();

  if (!progress) return null;

  const completedSteps = Array.from(progress.completedSteps).filter(
    (step) => step.startsWith('2-')
  ).length;
  const totalSteps = phaseSteps.length;
  const progressPercent = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Phase 2: Company Verification
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Get your company verified with an official badge
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">PROGRESS</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {completedSteps} of {totalSteps} Steps
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground font-medium">COMPLETION</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {Math.round(progressPercent)}%
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(progressPercent)}% complete
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Steps</h2>
          <div className="space-y-4">
            {phaseSteps.map((step) => {
              const isCompleted = progress.completedSteps.has(`2-${step.step}`);
              const isActive = progress.currentStep === step.step && progress.currentPhase === 2;

              // Find the highest completed step
              const completedStepNumbers = Array.from(progress.completedSteps)
                .filter(s => s.startsWith('2-'))
                .map(s => parseInt(s.split('-')[1]));
              const maxCompletedStep = completedStepNumbers.length > 0
                ? Math.max(...completedStepNumbers)
                : 0;

              // A step is locked only if it comes after an incomplete step
              // Allow the next step after completed ones to be accessible
              const isLocked = step.step > maxCompletedStep + 1;

              return (
                <StepCard
                  key={step.step}
                  {...step}
                  isCompleted={isCompleted}
                  isActive={isActive}
                  isLocked={isLocked}
                />
              );
            })}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
          <div className="text-blue-600 flex-shrink-0 mt-1">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Company Verification Benefits
            </h3>
            <p className="text-sm text-blue-800">
              Once verified, your company will display a verified badge, increasing investor trust and unlocking access to Phase 3 (Financial Valuation & KPI). This badge is visible to all investors on the platform.
            </p>
          </div>
        </div>

        {/* Back to Overview */}
        <div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/entrepreneur">
              Back to Overview
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Phase2Page() {
  return (
    <RouteGuard requiredPhase={2}>
      <Phase2PageContent />
    </RouteGuard>
  );
}
