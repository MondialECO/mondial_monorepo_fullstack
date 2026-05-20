'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Shield, Lock, AlertCircle } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Button } from '@/components/ui/button';

const beneficiaryOwners = [
  { id: '1', name: 'John Smith', role: 'Founder & CEO', ownership: '60%', verified: false },
  { id: '2', name: 'Jane Doe', role: 'Co-Founder & CTO', ownership: '40%', verified: false },
];

const PHASE_2_STEPS = [
  { step: 1 as const, title: 'Legal Identity', subtitle: 'Enter company info' },
  { step: 2 as const, title: 'Required Documentation', subtitle: 'Upload documents' },
  { step: 3 as const, title: 'Ownership & KYC', subtitle: 'Verify owners' },
  { step: 4 as const, title: 'Financial Preview', subtitle: 'Review summary' },
];

function Phase2Step3PageContent() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

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
        ...existingData,
        owners: beneficiaryOwners.map((owner) => ({
          ...owner,
          verified: verifiedOwners.has(owner.id),
        })),
        kycStatus: 'verified',
        biometricVerified: true,
      };

      savePhaseData(2, formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      const moveResult = moveToNextStep(2, 3);

      if (!moveResult) {
        setValidationError('Failed to advance to next step');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/dashboard/entrepreneur/phase-2/step-4');
    } catch (error) {
      setValidationError('Failed to proceed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (!progress) return null;

  const statusMap = {
    1: progress.completedSteps.has('2-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('2-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('2-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
    4: progress.completedSteps.has('2-4') ? 'completed' : progress.currentStep === 4 ? 'current' : 'pending',
  };

  const stepIndicators = PHASE_2_STEPS.map((step) => ({
    ...step,
    status: statusMap[step.step as keyof typeof statusMap] as any,
  }));

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
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Ownership & KYC Verification"
          subtitle="Verify all beneficial owners and complete KYC checks to ensure regulatory compliance."
          progressLabel="PROGRESS"
          progressValue="Step 3 of 4"
          progressPercentage={75}
        />

        {/* Ownership Section */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-1 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Beneficial Owners
            </h3>
            <p className="text-sm text-neutral-5 mb-4">
              Verify each beneficial owner (>25% stake) to complete KYC requirements.
            </p>

            <div className="space-y-3">
              {beneficiaryOwners.map((owner) => {
                const isVerified = verifiedOwners.has(owner.id);
                return (
                  <div
                    key={owner.id}
                    className={`border-2 rounded-xl p-4 transition ${
                      isVerified
                        ? 'bg-green-50 border-green-200'
                        : 'bg-background border-neutral-2 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isVerified ? 'bg-green-100' : 'bg-neutral-100'
                        }`}>
                          {isVerified ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Users className="w-6 h-6 text-neutral-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-neutral-1">{owner.name}</h4>
                          <p className="text-xs sm:text-sm text-neutral-5 mt-1">{owner.role}</p>
                          <p className="text-xs sm:text-sm text-neutral-5 mt-0.5 font-medium">{owner.ownership} ownership</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleOwnerVerify(owner.id)}
                        variant={isVerified ? 'outline' : 'default'}
                        size="sm"
                        className="w-full sm:w-auto gap-2"
                        disabled={isVerified}
                      >
                        {isVerified ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Verified
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            Verify
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security & Privacy Section */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-1 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Security & Compliance
            </h3>

            <div className="space-y-3">
              {[
                { icon: Lock, label: 'Data Encryption', description: 'AES-256 encryption for all data' },
                { icon: Shield, label: 'GDPR Compliant', description: 'Full data protection compliance' },
                { icon: Users, label: 'KYC/AML', description: 'AMLD5 verified identity checks' },
              ].map(({ icon: Icon, label, description }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-neutral-2">
                  <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-1">{label}</p>
                    <p className="text-xs text-neutral-5 mt-0.5">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">KYC Verification</p>
            <p className="text-sm text-blue-800">
              Each beneficial owner will undergo identity verification. This is a regulatory requirement to prevent fraud and money laundering.
            </p>
          </div>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-2/step-2"
          onNextClick={handleNextClick}
          isLoading={isValidating}
          isNextDisabled={!allOwnersVerified}
          nextLabel="Next"
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
