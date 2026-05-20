'use client';

import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { usePhase2Step1Form } from '@/hooks/usePhase2Step1Form';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { LegalIdentityForm } from '@/components/entrepreneur/LegalIdentityForm';
import { PHASE_2_STEPS } from '@/constants/entrepreneur';

const stepIndicators = PHASE_2_STEPS.map((step) => ({
  ...step,
  status: 'pending' as const,
}));

export default function Phase2Step1Client() {
  const { progress } = useEntrepreneurProgress();
  const {
    form,
    formState,
    autosave,
    handleSaveDraft,
    handleNextClick,
  } = usePhase2Step1Form();

  // Update step indicators based on progress
  const statusMap = progress
    ? {
        1: progress.completedSteps.has('2-1')
          ? 'completed'
          : progress.currentStep === 1
            ? 'current'
            : 'pending',
        2: progress.completedSteps.has('2-2')
          ? 'completed'
          : progress.currentStep === 2
            ? 'current'
            : 'pending',
        3: progress.completedSteps.has('2-3')
          ? 'completed'
          : progress.currentStep === 3
            ? 'current'
            : 'pending',
        4: progress.completedSteps.has('2-4')
          ? 'completed'
          : progress.currentStep === 4
            ? 'current'
            : 'pending',
      }
    : null;

  const updatedStepIndicators = statusMap
    ? stepIndicators.map((step) => ({
        ...step,
        status: statusMap[step.step as keyof typeof statusMap] as any,
      }))
    : stepIndicators;

  const sidebarContent = progress ? (
    <ProgressSidebar
      title="Verification Progress"
      steps={updatedStepIndicators}
      overallScore={progress.overallScore ?? 20}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Complete Step 1 to unlock to identity checks module."
    />
  ) : null;

  // Show loading state while progress is loading
  if (!progress) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-neutral-5 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <EntrepreneurLayout sidebar={sidebarContent || <div />}>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Phase Header */}
        <PhaseHeader
          title="Legal Identity"
          subtitle="Enter your company's official registered information. This data will be automatically verified against the national trade registry."
          progressLabel="PROGRESS"
          progressValue="From 80% Filled"
          progressPercentage={80}
        />

        {/* Form */}
        <LegalIdentityForm
          form={form}
          isLoading={formState.status === 'navigating'}
          isSaving={formState.status === 'saving'}
          autosaveStatus={autosave.status}
          onSubmit={handleNextClick}
          onSaveDraft={handleSaveDraft}
        />
      </div>
    </EntrepreneurLayout>
  );
}
