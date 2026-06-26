'use client';

import { ReactNode } from 'react';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhaseFormWrapper } from '@/components/entrepreneur/PhaseFormWrapper';

interface FormPageProps {
  phaseTitle: string;
  stepNumber: number;
  stepTotal: number;
  formTitle: string;
  formDescription: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  successMessage: string;
  onDismissError: () => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  children: ReactNode;
  submitButtonLabel?: string;
  nextPath?: string;
}

export function FormPage({
  phaseTitle,
  stepNumber,
  stepTotal,
  formTitle,
  formDescription,
  isLoading,
  error,
  success,
  successMessage,
  onDismissError,
  onBack,
  onSubmit,
  children,
  submitButtonLabel = 'Next',
  nextPath,
}: FormPageProps) {
  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header - Fixed for performance */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1 truncate">
              {phaseTitle}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-5 mt-0.5">
              Step {stepNumber} of {stepTotal}: {formDescription}
            </p>
          </div>
        </div>
      </header>

      {/* Progress Bar - Visual indicator */}
      <div className="h-1 bg-neutral-2">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(stepNumber / stepTotal) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <PhaseFormWrapper
          title={formTitle}
          description={formDescription}
          isLoading={isLoading}
          error={error}
          success={success}
          successMessage={successMessage}
          onDismissError={onDismissError}
        >
          <form onSubmit={onSubmit} className="space-y-6 sm:space-y-8">
            {children}

            {/* Action Buttons - Mobile optimized */}
            <div className="flex gap-3 pt-6 sm:pt-8 flex-col sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 h-12 sm:h-13 gap-2 font-medium"
                onClick={onBack}
                type="button"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 sm:h-13 gap-2 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{submitButtonLabel}</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </PhaseFormWrapper>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  isRequired?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, isRequired = false, hint, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <label className="text-xs sm:text-sm font-semibold text-neutral-1 uppercase block">
        {label} {isRequired && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-5">{hint}</p>}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function FormSelect({ value, onChange, options, placeholder = 'Select an option', disabled = false }: FormSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface FormInputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
}

export function FormInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  maxLength,
  pattern,
}: FormInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      pattern={pattern}
      className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

interface FormTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
}

export function FormTextArea({
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  rows = 3,
  maxLength,
}: FormTextAreaProps) {
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className="w-full bg-neutral-3 border border-neutral-2 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base text-neutral-1 placeholder-neutral-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {maxLength && (
        <p className="text-xs text-neutral-5">
          {value.length}/{maxLength} characters
        </p>
      )}
    </>
  );
}
