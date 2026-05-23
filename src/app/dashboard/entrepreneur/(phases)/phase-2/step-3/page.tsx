'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Shield, Lock, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phase2Data } from '@/types/entrepreneur';

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
  const [owners, setOwners] = useState<Array<{ name: string; email: string; ownership: string }>>([]);
  const [newOwner, setNewOwner] = useState({ name: '', email: '', ownership: '' });
  const [isSaving, setIsSaving] = useState(false);
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const allOwnersVerified = owners.length > 0;

  const handleAddOwner = () => {
    const parsed = parseFloat(newOwner.ownership);
    if (!newOwner.name || !newOwner.email || !newOwner.ownership) {
      setValidationError('Please fill all owner fields');
      return;
    }
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 100) {
      setValidationError('Ownership must be between 0 and 100');
      return;
    }

    setOwners([...owners, newOwner]);
    setNewOwner({ name: '', email: '', ownership: '' });
    setValidationError('');
  };

  const handleRemoveOwner = (index: number) => {
    setOwners(owners.filter((_, i) => i !== index));
  };

  const handleSaveOwners = async (): Promise<void> => {
    if (owners.length === 0) {
      throw new Error('At least one beneficial owner is required');
    }

    setIsSaving(true);
    try {
      const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};
      let companyId = existingData.__companyId;

      if (!companyId) {
        const phaseProgress = await entrepreneurApi.getCurrentPhase();
        companyId = phaseProgress?.companyId;
        if (!companyId) throw new Error('No company found');
      }

      // Canonical DTO contract: fullName, email, ownershipPercent (required);
      // role + nationality optional.
      await entrepreneurApi.updateBeneficialOwners(companyId, {
        owners: owners.map((o) => ({
          fullName: o.name,
          email: o.email,
          ownershipPercent: parseFloat(o.ownership),
        })),
      });

      savePhaseData(2, { ...existingData, beneficialOwnersSaved: true });
      setValidationError('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextClick = async () => {
    setValidationError('');
    setIsValidating(true);

    try {
      if (owners.length === 0) {
        setValidationError('At least one beneficial owner is required');
        setIsValidating(false);
        return;
      }

      // Backend persistence is required. If save fails, do NOT advance.
      await handleSaveOwners();
      moveToNextStep(2, 3);

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push('/dashboard/entrepreneur/phase-2/step-4');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to proceed';
      setValidationError(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveOwnersClick = async () => {
    try {
      await handleSaveOwners();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save owners';
      setValidationError(msg);
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
              Add all beneficial owners ({`>`}25% stake) for KYC verification.
            </p>

            {/* Add Owner Form */}
            <div className="bg-background border-2 border-neutral-2 rounded-xl p-4 mb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Full name"
                  value={newOwner.name}
                  onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                  className="text-sm"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newOwner.email}
                  onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-4">
                <Input
                  placeholder="Ownership %"
                  type="number"
                  min="0"
                  max="100"
                  value={newOwner.ownership}
                  onChange={(e) => setNewOwner({ ...newOwner, ownership: e.target.value })}
                  className="text-sm"
                />
                <Button
                  onClick={handleAddOwner}
                  variant="default"
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add Owner
                </Button>
              </div>
            </div>

            {/* Owners List */}
            {owners.length > 0 ? (
              <div className="space-y-3">
                {owners.map((owner, index) => (
                  <div
                    key={index}
                    className="border-2 border-green-200 bg-green-50 rounded-xl p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-100">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-semibold text-neutral-1">{owner.name}</h4>
                          <p className="text-xs sm:text-sm text-neutral-5 mt-1">{owner.email}</p>
                          <p className="text-xs sm:text-sm text-neutral-5 mt-0.5 font-medium">{owner.ownership}% ownership</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveOwner(index)}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-neutral-5">
                No beneficial owners added yet
              </div>
            )}

            {owners.length > 0 && (
              <Button
                onClick={handleSaveOwnersClick}
                variant="outline"
                className="w-full mt-4"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save to Backend'}
              </Button>
            )}
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
