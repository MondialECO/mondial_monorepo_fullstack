'use client';

import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { usePhase2Step1Form } from '@/hooks/usePhase2Step1Form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, FileText, ArrowRight, Lightbulb, Lock } from 'lucide-react';
import { useWatch } from 'react-hook-form';

const labelClass = 'block text-sm font-medium text-foreground uppercase tracking-wide mb-2';
const inputClass =
  'h-auto bg-popover border-border rounded-lg px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground';

export default function Phase2Step1Client() {
  const { progress } = useEntrepreneurProgress();
  const { form, formState, autosave, handleSaveDraft, handleNextClick } = usePhase2Step1Form();

  const { register } = form;
  const formValues = useWatch({ control: form.control });
  const isFormFilled = !!(formValues?.companyName?.trim() && formValues?.registrationNumber?.trim());

  if (!progress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1072px] space-y-6">
      {/* Main Card */}
      <div className="flex flex-col gap-8 bg-card border-2 border-background rounded-[20px] shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-end md:gap-8">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight">Legal Identity</h1>
            <p className="text-sm text-muted-foreground">
              Enter your company&apos;s official registered information. This data will be automatically verified against the national trade registry.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-[18px]">
            <div className="flex flex-col items-end gap-1 text-right">
              <p className="text-[13px] text-muted-foreground">PROGRESS</p>
              <p className="text-base font-medium text-foreground">From 80% Filled</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-secondary">
              <FileText className="size-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex flex-col gap-6 px-6">
          {/* Company Name */}
          <div>
            <label className={labelClass}>Official Company Name</label>
            <Input
              {...register('companyName')}
              placeholder="Enter official company name"
              className={inputClass}
            />
          </div>

          {/* Registration + Legal Form */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>Registration (SIREN/SIRET)</label>
              <Input
                {...register('registrationNumber')}
                placeholder="e.g., 987 876 5684"
                maxLength={14}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>Legal Form</label>
              <Select value={formValues?.legalForm || ''} onValueChange={(value) => form.setValue('legalForm', value)}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select legal form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SARL">SARL</SelectItem>
                  <SelectItem value="SAS">SAS / SASU</SelectItem>
                  <SelectItem value="EIRL">EIRL</SelectItem>
                  <SelectItem value="SA">SA</SelectItem>
                  <SelectItem value="MICRO">Micro-Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Incorporation Date + Country */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>Incorporation Date</label>
              <Input {...register('incorporationDate')} type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Country of Registration</label>
              <Select
                value={formValues?.countryOfRegistration || ''}
                onValueChange={(value) => form.setValue('countryOfRegistration', value)}
              >
                <SelectTrigger className={inputClass}>
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

          {/* Registered Address */}
          <div>
            <label className={labelClass}>Registered Address</label>
            <Textarea
              {...register('registeredAddress')}
              placeholder="Full registered address including street, postal code, city"
              className={`${inputClass} min-h-[100px] resize-none`}
            />
          </div>

          {/* Industry Code */}
          <div className="md:max-w-[486px]">
            <label className={labelClass}>Industry Code (NAF / APE)</label>
            <Input {...register('industryCode')} placeholder="e.g., 90.875" className={inputClass} />
          </div>
        </div>

        {/* Auto-save + error indicators */}
        {(autosave.status === 'saved' || formState.error) && (
          <div className="px-6 space-y-3">
            {autosave.status === 'saved' && (
              <div className="flex items-center gap-2 rounded-lg border border-success-text/20 bg-success-light p-3 text-sm text-success-text">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Auto-saved successfully
              </div>
            )}
            {formState.error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {formState.error}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t-2 border-background p-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            className="border-primary px-6 py-3 font-medium text-primary hover:bg-primary/5"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={handleNextClick}
            disabled={!isFormFilled || formState.status === 'navigating'}
            className="gap-2 px-6 py-3"
          >
            {formState.status === 'navigating' ? 'Processing…' : 'Next'}
            {formState.status !== 'navigating' && <ArrowRight className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex gap-4 rounded-2xl border border-border bg-secondary p-6">
        <Lightbulb className="h-6 w-6 flex-shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Why need this information</p>
          <p className="text-sm text-muted-foreground">
            Legal details are used to verify your business status with governmental APIs. This ensures all entrepreneurs on{' '}
            <span className="font-medium text-primary">mondial.eco</span> are legally compliant and eligible for eco-grants.
          </p>
        </div>
      </div>

      {/* Next Step Preview (locked) */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 opacity-60">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
            2
          </div>
          <div>
            <p className="font-semibold text-foreground">Required Documentation</p>
            <p className="text-sm text-muted-foreground">KIBS, RIB, Insurance, Tax Certificates</p>
          </div>
        </div>
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}
