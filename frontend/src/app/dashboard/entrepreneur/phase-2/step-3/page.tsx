'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const beneficiaryOwners = [
  { id: '1', name: 'John Smith', ownership: '60%', verified: false },
  { id: '2', name: 'Jane Doe', ownership: '40%', verified: false },
];

function Phase2Step3PageContent() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  // Load previously verified owners from saved data
  const savedData = getPhaseData(2) as { owners?: Array<{ id: string; verified: boolean }> } | undefined;
  const initialVerified = new Set(
    savedData?.owners?.filter((owner) => owner.verified).map((owner) => owner.id) || []
  );
  const [verifiedOwners, setVerifiedOwners] = useState<Set<string>>(initialVerified);

  const allOwnersVerified = verifiedOwners.size === beneficiaryOwners.length;

  const handleOwnerVerify = (ownerId: string) => {
    const newVerified = new Set(verifiedOwners);
    newVerified.add(ownerId);
    setVerifiedOwners(newVerified);
  };

  const handleNextClick = async () => {
    setValidationError('');
    setIsValidating(true);

    try {
      if (!allOwnersVerified) {
        setValidationError('Please verify all beneficial owners');
        setIsValidating(false);
        return;
      }

      const existingData = getPhaseData(2) || {};
      const formData = {
        ...existingData,  // Preserve Step 1 & Step 2 data
        owners: beneficiaryOwners.map((owner) => ({
          ...owner,
          verified: verifiedOwners.has(owner.id),
        })),
        kycStatus: 'verified' as const,
        biometricVerified: true,
      };

      savePhaseData(2, formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      const moveResult = moveToNextStep(2, 3);

      if (!moveResult) {
        setValidationError('Failed to advance to next step');
        return;
      }

      // Wait for state update before navigating
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/dashboard/entrepreneur/phase-2/step-4');
    } catch (error) {
      setValidationError('Failed to proceed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (!progress) return null;

  const stepIndicators = [
    {
      step: 1 as const,
      title: 'Legal Identity',
      subtitle: 'Enter company info',
      status: (progress.completedSteps.has('2-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending') as const,
    },
    {
      step: 2 as const,
      title: 'Required Documentation',
      subtitle: 'Upload documents',
      status: (progress.completedSteps.has('2-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending') as const,
    },
    {
      step: 3 as const,
      title: 'Ownership & KYC',
      subtitle: 'Verify owners',
      status: (progress.completedSteps.has('2-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending') as const,
    },
    {
      step: 4 as const,
      title: 'Financial Preview',
      subtitle: 'Review summary',
      status: (progress.completedSteps.has('2-4') ? 'completed' : progress.currentStep === 4 ? 'current' : 'pending') as const,
    },
  ];

  const sidebarContent = (
    <ProgressSidebar
      title="Verification Progress"
      steps={stepIndicators}
      overallScore={60}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Verify beneficial owners to continue."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebarContent}>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <PhaseHeader
          title="Ownership & KYC Verification"
          subtitle="Verify all beneficial owners and complete KYC checks."
          progressLabel="PROGRESS"
          progressValue="Step 3 of 4"
          progressPercentage={75}
        />

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-3 sm:p-4 md:p-6">
          <div className="space-y-4 sm:space-y-6">
            {beneficiaryOwners.map((owner) => {
              const isVerified = verifiedOwners.has(owner.id);
              return (
                <div
                  key={owner.id}
                  className="border border-neutral-2 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isVerified ? 'bg-green-100' : 'bg-neutral-4'}`}>
                      {isVerified ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Users className="w-5 h-5 text-neutral-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-neutral-1">{owner.name}</h3>
                      <p className="text-sm text-neutral-5 mt-0.5">{owner.ownership} ownership</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOwnerVerify(owner.id)}
                    className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg transition ${isVerified ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary hover:bg-primary/15'}`}
                  >
                    {isVerified ? '✓ Verified' : 'Verify'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-2/step-2"
          nextLabel="Next"
          onNextClick={handleNextClick}
          isLoading={isValidating}
          isNextDisabled={!allOwnersVerified}
          nextValidationError={validationError}
        />
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase2Step3Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={3}>
      <Phase2Step3PageContent />
    </RouteGuard>
  );
}
