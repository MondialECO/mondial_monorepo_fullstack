'use client';

import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { usePhase2Step1Form } from '@/hooks/usePhase2Step1Form';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const PHASE_2_STEPS = [
  { step: 1 as const, title: 'Legal Identity', subtitle: 'Enter company info' },
  { step: 2 as const, title: 'Required Documentation', subtitle: 'Upload documents' },
  { step: 3 as const, title: 'Ownership & KYC', subtitle: 'Verify owners' },
  { step: 4 as const, title: 'Financial Preview', subtitle: 'Review summary' },
];

export default function Phase2Step1Client() {
  const { progress } = useEntrepreneurProgress();
  const { form, formState, autosave, handleSaveDraft, handleNextClick } = usePhase2Step1Form();

  const statusMap = progress
    ? {
        1: progress.completedSteps.has('2-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
        2: progress.completedSteps.has('2-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
        3: progress.completedSteps.has('2-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
        4: progress.completedSteps.has('2-4') ? 'completed' : progress.currentStep === 4 ? 'current' : 'pending',
      }
    : null;

  const stepIndicators = PHASE_2_STEPS.map((step) => ({
    ...step,
    status: statusMap ? (statusMap[step.step as keyof typeof statusMap] as any) : 'pending',
  }));

  const sidebarContent = progress ? (
    <ProgressSidebar
      title="Verification Progress"
      steps={stepIndicators}
      overallScore={20}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Complete Step 1 to unlock identity checks."
    />
  ) : null;

  if (!progress) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-neutral-5 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const { register, watch } = form;
  const formValues = watch();
  const isFormFilled = formValues.companyName && formValues.registrationNumber;

  return (
    <EntrepreneurLayout sidebar={sidebarContent || <div />}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Legal Identity"
          subtitle="Enter your company's official registered information. This data will be verified against the national trade registry."
          progressLabel="PROGRESS"
          progressValue="Step 1 of 4"
          progressPercentage={25}
        />

        {/* Main Form Card */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Company Legal Name
            </label>
            <Input
              {...register('companyName')}
              placeholder="Enter official company name"
              className="h-12 bg-background border-neutral-2 placeholder:text-neutral-5"
            />
            <p className="text-xs text-neutral-5 mt-1">Must match your official registration documents</p>
          </div>

          {/* Registration Number (SIRET) */}
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Registration Number (SIRET)
            </label>
            <Input
              {...register('registrationNumber')}
              placeholder="e.g., 12345678901234"
              maxLength={14}
              className="h-12 bg-background border-neutral-2 placeholder:text-neutral-5 font-mono"
            />
            <p className="text-xs text-neutral-5 mt-1">14-digit SIRET number for verification</p>
          </div>

          {/* Legal Form */}
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Legal Structure
            </label>
            <select
              {...register('legalForm')}
              className="w-full h-12 px-4 bg-background border border-neutral-2 rounded-lg text-neutral-1 text-sm"
            >
              <option value="">Select legal structure</option>
              <option value="SARL">SARL</option>
              <option value="SAS">SAS</option>
              <option value="EIRL">EIRL</option>
              <option value="SA">SA</option>
              <option value="MICRO">Micro-Enterprise</option>
            </select>
          </div>

          {/* Incorporation Date */}
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Incorporation Date
            </label>
            <Input
              {...register('incorporationDate')}
              type="date"
              className="h-12 bg-background border-neutral-2"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Country of Registration
            </label>
            <Input
              {...register('countryOfRegistration')}
              placeholder="e.g., France"
              className="h-12 bg-background border-neutral-2 placeholder:text-neutral-5"
            />
          </div>

          {/* Registered Address */}
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Registered Address
            </label>
            <Input
              {...register('registeredAddress')}
              placeholder="Full address"
              className="h-12 bg-background border-neutral-2 placeholder:text-neutral-5"
            />
          </div>

          {/* Industry Code */}
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Industry Code (NAF)
            </label>
            <Input
              {...register('industryCode')}
              placeholder="e.g., 6202A"
              className="h-12 bg-background border-neutral-2 placeholder:text-neutral-5"
            />
          </div>
        </div>

        {/* Auto-save indicator */}
        {autosave.status === 'saved' && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Auto-saved successfully
          </div>
        )}

        {formState.error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {formState.error}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Verification Required</p>
            <p className="text-sm text-blue-800">
              Your company will be automatically verified against the national trade registry. This helps ensure all information on the platform is accurate and trustworthy.
            </p>
          </div>
        </div>

        {/* Footer */}
        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-2"
          onNextClick={handleNextClick}
          isLoading={formState.status === 'navigating'}
          isNextDisabled={!isFormFilled}
          showSaveDraft={true}
          onSaveDraft={handleSaveDraft}
          nextLabel="Next"
          nextValidationError={formState.error || undefined}
        />
      </div>
    </EntrepreneurLayout>
  );
}
