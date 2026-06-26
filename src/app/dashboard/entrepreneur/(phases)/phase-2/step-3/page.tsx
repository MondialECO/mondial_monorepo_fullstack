'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Shield, Lock, AlertCircle, Plus, Trash2, Edit2, X, Zap, ChevronDown } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phase2Data } from '@/types/entrepreneur';

const PHASE_2_STEPS = [
  { step: 1 as const, title: 'Legal Identity', subtitle: 'Enter company info' },
  { step: 2 as const, title: 'Required Documentation', subtitle: 'Upload documents' },
  { step: 3 as const, title: 'Ownership & KYC', subtitle: 'Verify owners' },
  { step: 4 as const, title: 'Financial Preview', subtitle: 'Review summary' },
];

interface Owner {
  name: string;
  email: string;
  ownership: string;
  nationality: string;
  role?: string;
}

function Phase2Step3PageContent() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [newOwner, setNewOwner] = useState<Owner>({ name: '', email: '', ownership: '', nationality: '', role: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  // Fetch existing beneficial owners on mount
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setIsLoading(true);
        const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};
        let companyId = existingData.__companyId;

        if (!companyId) {
          const phaseProgress = await entrepreneurApi.getCurrentPhase();
          companyId = phaseProgress?.companyId;
        }

        if (companyId) {
          const beneficialOwners = await entrepreneurApi.getBeneficialOwners(companyId);
          if (beneficialOwners && beneficialOwners.length > 0) {
            setOwners(
              beneficialOwners.map((owner: any) => ({
                name: owner.fullName || '',
                email: owner.email || '',
                ownership: String(owner.ownershipPercent || ''),
                nationality: owner.nationality || '',
              }))
            );
          }
        }
      } catch (error) {
        console.warn('Failed to fetch beneficial owners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (progress) {
      fetchOwners();
    }
  }, [progress, getPhaseData]);

  const allOwnersVerified = owners.length > 0;

  const handleAddShareholderClick = () => {
    setIsAdding(true);
    setNewOwner({ name: '', email: '', ownership: '', nationality: '', role: '' });
    setEditingIndex(null);
    setValidationError('');
  };

  const handleAddOwner = () => {
    const parsed = parseFloat(newOwner.ownership);
    if (!newOwner.name || !newOwner.ownership || !newOwner.nationality) {
      setValidationError('Please fill all required fields (Name, Ownership %, Nationality)');
      return;
    }
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 100) {
      setValidationError('Ownership must be between 0 and 100');
      return;
    }

    // Auto-generate email from name if not provided
    const ownerWithEmail = {
      ...newOwner,
      email: newOwner.email || `${newOwner.name.toLowerCase().replace(/\s+/g, '.')}@company.local`,
    };

    if (editingIndex !== null) {
      const updatedOwners = [...owners];
      updatedOwners[editingIndex] = ownerWithEmail;
      setOwners(updatedOwners);
      setEditingIndex(null);
    } else {
      setOwners([...owners, ownerWithEmail]);
    }
    setNewOwner({ name: '', email: '', ownership: '', nationality: '', role: '' });
    setIsAdding(false);
    setValidationError('');
  };

  const handleEditOwner = (index: number) => {
    setNewOwner(owners[index]);
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setNewOwner({ name: '', email: '', ownership: '', nationality: '', role: '' });
    setEditingIndex(null);
    setIsAdding(false);
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

      // Canonical DTO contract: fullName, email, ownershipPercent, nationality (required)
      await entrepreneurApi.updateBeneficialOwners(companyId, {
        owners: owners.map((o) => ({
          fullName: o.name,
          email: o.email,
          ownershipPercent: parseFloat(o.ownership),
          nationality: o.nationality,
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

  if (!progress || isLoading) return null;

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

        {/* Main Container - Ownership Table & KYC Section */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
          {/* Ownership Section Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-neutral-1 mb-1">Beneficial Ownership</h3>
              <p className="text-sm text-neutral-5">Identify beneficial owners and complete biometric identity verification.</p>
            </div>
            <Button
              onClick={handleAddShareholderClick}
              variant="default"
              size="sm"
              className="gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Shareholder
            </Button>
          </div>

          {/* Add/Edit Owner Form - Horizontal Row */}
          {(isAdding || editingIndex !== null) && (
            <div className="flex items-end gap-6 pb-4 border-b border-neutral-2">
              {/* Full Name Field */}
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-semibold text-neutral-1 uppercase">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={newOwner.name}
                  onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                  className="h-12 bg-background border-neutral-3 placeholder:text-neutral-5"
                />
              </div>

              {/* Ownership % Field */}
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-semibold text-neutral-1 uppercase">Ownership (%)</label>
                <Input
                  placeholder="20"
                  type="number"
                  min="0"
                  max="100"
                  value={newOwner.ownership}
                  onChange={(e) => setNewOwner({ ...newOwner, ownership: e.target.value })}
                  className="h-12 bg-background border-neutral-3 placeholder:text-neutral-5"
                />
              </div>

              {/* Nationality Select */}
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-semibold text-neutral-1 uppercase">Nationality</label>
                <Select value={newOwner.nationality} onValueChange={(value) => {
                  setNewOwner({ ...newOwner, nationality: value });
                }}>
                  <SelectTrigger className="h-12 bg-background border-neutral-3">
                    <SelectValue placeholder="United States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="Switzerland">Switzerland</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Select */}
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-semibold text-neutral-1 uppercase">Role</label>
                <Select value={newOwner.role || ''} onValueChange={(value) => {
                  setNewOwner({ ...newOwner, role: value });
                }}>
                  <SelectTrigger className="h-12 bg-background border-neutral-3">
                    <SelectValue placeholder="CEO" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEO">CEO</SelectItem>
                    <SelectItem value="CFO">CFO</SelectItem>
                    <SelectItem value="COO">COO</SelectItem>
                    <SelectItem value="CMO">CMO</SelectItem>
                    <SelectItem value="CTO">CTO</SelectItem>
                    <SelectItem value="General Manager">General Manager</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Shareholder">Shareholder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-6">
                <Button
                  onClick={handleAddOwner}
                  size="sm"
                  className="h-10 px-4 gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="h-10 px-4"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Owners Table */}
          <div className="border border-neutral-2 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="bg-neutral-100 flex items-center border-b border-neutral-2">
              <div className="flex-1 px-6 py-3 text-xs font-semibold text-neutral-5 uppercase">Full Name</div>
              <div className="w-32 px-4 py-3 text-xs font-semibold text-neutral-5 uppercase">Ownership</div>
              <div className="w-40 px-4 py-3 text-xs font-semibold text-neutral-5 uppercase">Nationality</div>
              <div className="w-24 px-4 py-3 text-xs font-semibold text-neutral-5 uppercase text-center">Actions</div>
            </div>

            {/* Table Body */}
            {owners.length > 0 ? (
              owners.map((owner, index) => (
                <div key={index} className="flex items-center border-b border-neutral-2 hover:bg-neutral-50 transition">
                  <div className="flex-1 px-6 py-4">
                    <p className="text-sm font-semibold text-neutral-1">{owner.name}</p>
                    <p className="text-xs text-neutral-5 mt-0.5">{owner.email || 'No email'}</p>
                  </div>
                  <div className="w-32 px-4 py-4">
                    <p className="text-sm text-neutral-1">{owner.ownership}%</p>
                  </div>
                  <div className="w-40 px-4 py-4">
                    <p className="text-sm text-neutral-1">{owner.nationality}</p>
                  </div>
                  <div className="w-24 px-4 py-4 flex items-center justify-center gap-2">
                    <Button
                      onClick={() => handleEditOwner(index)}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleRemoveOwner(index)}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-neutral-5">
                No beneficial owners added yet
              </div>
            )}
          </div>

          {owners.length > 0 && (
            <Button
              onClick={handleSaveOwnersClick}
              variant="outline"
              className="w-full"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Shareholders'}
            </Button>
          )}
        </div>

        {/* Representative KYC Section */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
          <div className="flex items-start gap-4">
            {/* Left: KYC Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-1 mb-1">Representative KYC</h3>
                <p className="text-sm text-neutral-5">Verify owners and conduct biometric checks for KYC.</p>
              </div>

              <div className="bg-background border border-neutral-2 rounded-2xl p-6 space-y-4">
                {/* Applicant Card */}
                <div className="border-b border-neutral-2 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-1">Primary Applicant</p>
                      <p className="text-xs text-neutral-5 mt-0.5">Company Representative</p>
                    </div>
                    <div className="bg-blue-100 px-3 py-1 rounded-full">
                      <p className="text-xs font-semibold text-blue-600">NOT STARTED</p>
                    </div>
                  </div>
                </div>

                {/* KYC Description */}
                <p className="text-sm text-neutral-4">
                  Complete the biometric identity verification using your mobile device or webcam.
                </p>

                {/* Start Verification Button */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Start Identity Verification
                </Button>
              </div>
            </div>

            {/* Right: Security & Privacy */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-neutral-1 mb-1">Security & Privacy</h3>
                <p className="text-sm text-neutral-5">Verify ownership and complete KYC for better security.</p>
              </div>

              <div className="bg-background border border-neutral-2 rounded-2xl p-6 space-y-4">
                <div className="border-b border-neutral-2 pb-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-1">Regular Compliance</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-neutral-4">
                  Your personal data is encrypted and handled by our certified KYC partner to ensure strict regulatory compliance (AML/CFT).
                </p>

                {/* Certifications */}
                <div className="flex items-center gap-4 text-xs text-neutral-5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    ISO 27001
                  </div>
                  <div className="w-px h-4 bg-neutral-2" />
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    GDPR
                  </div>
                  <div className="w-px h-4 bg-neutral-2" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    SOC2
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-2">Why need this information</p>
            <p className="text-sm text-blue-800">
              These documents are required for legal compliance and to protect the mondial.eco ecosystem. We use them to verify that your business is in good standing before unlocking access to specialized eco-funding and commercial partnerships.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-2 pt-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (owners.length > 0) {
                handleSaveOwnersClick();
              }
            }}
            className="text-sm text-neutral-4 font-medium hover:text-neutral-1 transition"
          >
            Save Draft
          </button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/entrepreneur/phase-2/step-2')}
              className="px-6"
            >
              Back to Uploads
            </Button>
            <Button
              onClick={handleNextClick}
              disabled={!allOwnersVerified || isValidating}
              className="px-6 gap-2"
            >
              Continue
            </Button>
          </div>
        </div>
        {validationError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {validationError}
          </div>
        )}
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
