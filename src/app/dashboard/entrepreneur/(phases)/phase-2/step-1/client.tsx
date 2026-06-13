'use client';

import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { usePhase2Step1Form } from '@/hooks/usePhase2Step1Form';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWatch } from 'react-hook-form';

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

  const { register } = form;
  const formValues = useWatch({ control: form.control });
  const isFormFilled = !!(formValues?.companyName?.trim() && formValues?.registrationNumber?.trim());

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
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8">
          {/* Section 1: Company Identity */}
          <div className="space-y-4 pb-6 border-b border-neutral-2">
            <h3 className="text-xs font-semibold text-neutral-5 uppercase tracking-wide">Company Identity</h3>
            <div className="space-y-4">
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
                <Select value={formValues?.legalForm || ''} onValueChange={(value) => {
                  form.setValue('legalForm', value);
                }}>
                  <SelectTrigger className="h-12 bg-background border-neutral-2">
                    <SelectValue placeholder="Select legal structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SARL">SARL</SelectItem>
                    <SelectItem value="SAS">SAS</SelectItem>
                    <SelectItem value="EIRL">EIRL</SelectItem>
                    <SelectItem value="SA">SA</SelectItem>
                    <SelectItem value="MICRO">Micro-Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Registration Details */}
          <div className="space-y-4 py-6 border-b border-neutral-2">
            <h3 className="text-xs font-semibold text-neutral-5 uppercase tracking-wide">Registration Details</h3>
            <div className="space-y-4">
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
                <Select value={formValues?.countryOfRegistration || ''} onValueChange={(value) => {
                  form.setValue('countryOfRegistration', value);
                }}>
                  <SelectTrigger className="h-12 bg-background border-neutral-2">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                    <SelectItem value="Belgium">Belgium</SelectItem>
                    <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                    <SelectItem value="Spain">Spain</SelectItem>
                    <SelectItem value="Italy">Italy</SelectItem>
                    <SelectItem value="Austria">Austria</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="Greece">Greece</SelectItem>
                    <SelectItem value="Ireland">Ireland</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Denmark">Denmark</SelectItem>
                    <SelectItem value="Sweden">Sweden</SelectItem>
                    <SelectItem value="Norway">Norway</SelectItem>
                    <SelectItem value="Switzerland">Switzerland</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 3: Business Information */}
          <div className="space-y-4 pt-6">
            <h3 className="text-xs font-semibold text-neutral-5 uppercase tracking-wide">Business Information</h3>
            <div className="space-y-4">
              {/* Registered Address */}
              <div>
                <label className="block text-sm font-semibold text-neutral-1 mb-2">
                  Registered Address
                </label>
                <Textarea
                  {...register('registeredAddress')}
                  placeholder="Full registered address including street, postal code, city"
                  className="bg-background border-neutral-2 placeholder:text-neutral-5 min-h-[100px] resize-none"
                />
                <p className="text-xs text-neutral-5 mt-1">Include street address, postal code, and city</p>
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

        <StepFooter
          backUrl="/dashboard/entrepreneur"
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
