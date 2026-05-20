'use client';

import { UseFormReturn } from 'react-hook-form';
import { Lightbulb, ChevronDown, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { COUNTRIES, LEGAL_FORMS } from '@/constants/entrepreneur';
import type { LegalIdentityFormData } from '@/lib/schemas/entrepreneur';

interface LegalIdentityFormProps {
  form: UseFormReturn<LegalIdentityFormData>;
  isLoading?: boolean;
  isSaving?: boolean;
  /** Status of the debounced background autosave. */
  autosaveStatus?: 'idle' | 'pending' | 'saved';
  onSubmit: () => void;
  onSaveDraft: () => void;
}

const inputClasses =
  'w-full bg-neutral-4 border border-neutral-2 rounded-lg px-3 py-2.5 sm:px-4 text-sm text-neutral-1 placeholder-neutral-5';
const labelClasses =
  'text-xs font-medium uppercase tracking-wide text-neutral-1 block mb-2';
const selectClasses = cn(
  inputClasses,
  'appearance-none cursor-pointer pr-9 bg-no-repeat bg-[right_0.75rem_center]'
);
const selectChevronStyle: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>\")",
  backgroundSize: '1rem 1rem',
};

export function LegalIdentityForm({
  form,
  isLoading = false,
  isSaving = false,
  autosaveStatus = 'idle',
  onSubmit,
  onSaveDraft,
}: LegalIdentityFormProps) {
  const { register } = form;

  return (
    <div className="space-y-4 md:space-y-6 opacity-animation">
      {/* Main Form Container */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-5 md:p-6">
        {/* Autosave indicator */}
        <div className="mb-4 flex justify-end h-5">
          {autosaveStatus === 'pending' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </span>
          )}
          {autosaveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 transition-opacity">
              <Check className="w-3.5 h-3.5" />
              Auto-saved
            </span>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Company Name */}
          <div>
            <Label htmlFor="companyName" className={labelClasses}>
              Official Company Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="companyName"
              {...register('companyName')}
              placeholder="Enter company name"
              aria-label="Official Company Name"
              autoComplete="organization"
              className={inputClasses}
            />
          </div>

          {/* Registration + Legal Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <div>
              <Label htmlFor="registrationNumber" className={labelClasses}>
                Registration (SIREN/SIRET) <span className="text-red-600">*</span>
              </Label>
              <Input
                id="registrationNumber"
                {...register('registrationNumber')}
                placeholder="e.g., 987 876 5684"
                aria-label="Registration Number"
                inputMode="numeric"
                className={inputClasses}
              />
            </div>

            <div>
              <Label htmlFor="legalForm" className={labelClasses}>
                Legal Form <span className="text-red-600">*</span>
              </Label>
              <select
                id="legalForm"
                {...register('legalForm')}
                aria-label="Legal Form"
                className={selectClasses}
                style={selectChevronStyle}
              >
                <option value="">Select legal form</option>
                {LEGAL_FORMS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Incorporation Date + Country */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <div>
              <Label htmlFor="incorporationDate" className={labelClasses}>
                Incorporation Date <span className="text-red-600">*</span>
              </Label>
              <Input
                id="incorporationDate"
                {...register('incorporationDate')}
                type="date"
                aria-label="Incorporation Date"
                className={cn(inputClasses, 'text-neutral-1')}
              />
            </div>

            <div>
              <Label htmlFor="countryOfRegistration" className={labelClasses}>
                Country of Registration <span className="text-red-600">*</span>
              </Label>
              <select
                id="countryOfRegistration"
                {...register('countryOfRegistration')}
                aria-label="Country of Registration"
                className={selectClasses}
                style={selectChevronStyle}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Registered Address */}
          <div>
            <Label htmlFor="registeredAddress" className={labelClasses}>
              Registered Address <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="registeredAddress"
              {...register('registeredAddress')}
              placeholder="Enter full registered address"
              aria-label="Registered Address"
              autoComplete="street-address"
              className="text-sm min-h-[100px] resize-none"
            />
          </div>

          {/* Industry Code */}
          <div>
            <Label htmlFor="industryCode" className={labelClasses}>
              Industry Code (NAF / APE) <span className="text-red-600">*</span>
            </Label>
            <Input
              id="industryCode"
              {...register('industryCode')}
              placeholder="e.g., 90.875"
              aria-label="Industry Code"
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 sm:p-5 md:p-6 flex gap-3 sm:gap-4">
        <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-semibold text-neutral-1">
            Why we need this information
          </h3>
          <p className="text-sm text-neutral-3 leading-relaxed">
            Legal details are used to verify your business status with
            governmental APIs. This ensures all entrepreneurs on{' '}
            <span className="text-primary font-medium">mondial.eco</span> are
            legally compliant and eligible for eco-grants.
          </p>
        </div>
      </div>

      {/* Next Step Preview */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 opacity-60">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-neutral-4 border border-neutral-2 flex items-center justify-center text-xs font-semibold text-neutral-1 flex-shrink-0">
            2
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-neutral-1">
              Required Documentation
            </p>
            <p className="text-sm text-neutral-5 mt-0.5">
              KIBS, RIB, Insurance, Tax Certificates
            </p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-neutral-5 flex-shrink-0" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
        <Button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving || isLoading}
          variant="outline"
          className={cn(
            'flex-1 gap-2',
            isSaving && 'opacity-50 cursor-not-allowed',
            autosaveStatus === 'saved' &&
              !isSaving &&
              'border-green-500 text-green-700'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : autosaveStatus === 'saved' ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            'Save Draft'
          )}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || isSaving}
          className={cn(
            'flex-1 gap-2',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Processing…' : 'Next'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
