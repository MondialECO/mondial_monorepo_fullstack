'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import Step1Profile from './Step1Profile';
import Step2Capacity from './Step2Capacity';
import Step3SourceOfFunds from './Step3SourceOfFunds';
import Step4Evidence from './Step4Evidence';
import Step5Review from './Step5Review';
import type { InvestorFinanceVerification } from '@/types/investor/finance';
import {
  useSaveInvestorFinanceDraft,
  useUploadInvestorFinanceDocument,
  useDeleteInvestorFinanceDocument,
  useSubmitInvestorFinanceVerification,
} from '@/hooks/queries/investor-finance';

interface WizardProps {
  initialData: InvestorFinanceVerification;
  onSubmitted: () => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: 'Classification', desc: 'Investor Profile' },
  { id: 2, title: 'Capacity', desc: 'Check Sizes & Horizon' },
  { id: 3, title: 'Source of Funds', desc: 'Capital Origin' },
  { id: 4, title: 'Evidence', desc: 'Supporting Docs' },
  { id: 5, title: 'Review', desc: 'Declaration & Submit' },
];

export default function FinanceVerificationWizard({
  initialData,
  onSubmitted,
  onCancel,
}: WizardProps) {
  const [step, setStep] = useState(1);

  // Form State
  const [investorType, setInvestorType] = useState(initialData.investorType || 'angel');
  const [currency, setCurrency] = useState(initialData.currency || 'EUR');
  const [declaredAvailableCapital, setDeclaredAvailableCapital] = useState(
    initialData.declaredAvailableCapital || 250000
  );
  const [minTicket, setMinTicket] = useState(initialData.minTicket || 10000);
  const [maxTicket, setMaxTicket] = useState(initialData.maxTicket || 50000);
  const [deploymentPeriodMonths, setDeploymentPeriodMonths] = useState(
    initialData.deploymentPeriodMonths || 12
  );
  const [sourceOfFunds, setSourceOfFunds] = useState<string[]>(
    initialData.sourceOfFunds?.length ? initialData.sourceOfFunds : ['Personal Savings']
  );
  const [sourceOfFundsExplanation, setSourceOfFundsExplanation] = useState(
    initialData.sourceOfFundsExplanation || ''
  );
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Mutations
  const saveDraftMutation = useSaveInvestorFinanceDraft();
  const uploadDocMutation = useUploadInvestorFinanceDocument();
  const deleteDocMutation = useDeleteInvestorFinanceDocument();
  const submitMutation = useSubmitInvestorFinanceVerification();

  const handleStep2Change = (field: string, val: any) => {
    if (field === 'currency') setCurrency(val);
    if (field === 'declaredAvailableCapital') setDeclaredAvailableCapital(val);
    if (field === 'minTicket') setMinTicket(val);
    if (field === 'maxTicket') setMaxTicket(val);
    if (field === 'deploymentPeriodMonths') setDeploymentPeriodMonths(val);
  };

  const handleStep3Change = (field: string, val: any) => {
    if (field === 'sourceOfFunds') setSourceOfFunds(val);
    if (field === 'sourceOfFundsExplanation') setSourceOfFundsExplanation(val);
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraftMutation.mutateAsync({
        investorType,
        currency,
        declaredAvailableCapital,
        minTicket,
        maxTicket,
        deploymentPeriodMonths,
        sourceOfFunds,
        sourceOfFundsExplanation,
      });
    } catch {
      // Ignored
    }
  };

  const handleNext = async () => {
    setFormError(null);

    // Validate current step
    if (step === 1) {
      if (!investorType) {
        setFormError('Please select your investor classification.');
        return;
      }
    } else if (step === 2) {
      if (declaredAvailableCapital <= 0) {
        setFormError('Available investment capital must be greater than 0.');
        return;
      }
      if (minTicket <= 0) {
        setFormError('Minimum ticket size must be greater than 0.');
        return;
      }
      if (maxTicket < minTicket) {
        setFormError('Maximum check size cannot be less than minimum check size.');
        return;
      }
    } else if (step === 3) {
      if (sourceOfFunds.length === 0) {
        setFormError('Please select at least one source of funds.');
        return;
      }
    } else if (step === 4) {
      if (!initialData.documents || initialData.documents.length === 0) {
        setFormError('Please upload at least one supporting document before proceeding to review.');
        return;
      }
    }

    // Auto-save draft on step change
    handleSaveDraft();
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => {
    setFormError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!declarationConfirmed) {
      setFormError('Please confirm the accuracy declaration.');
      return;
    }

    if (!initialData.documents || initialData.documents.length === 0) {
      setFormError('At least one supporting document must be uploaded.');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        investorType,
        currency,
        declaredAvailableCapital,
        minTicket,
        maxTicket,
        deploymentPeriodMonths,
        sourceOfFunds,
        sourceOfFundsExplanation,
        declarationConfirmed,
      });
      onSubmitted();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || 'Failed to submit verification. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Investor Finance Verification
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Step {step} of {STEPS.length}: {STEPS[step - 1].title}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
                Cancel
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
              className="text-xs"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save Draft
            </Button>
          </div>
        </div>

        {/* Step Progress Pills */}
        <div className="grid grid-cols-5 gap-2 mt-6">
          {STEPS.map((s) => {
            const isDone = s.id < step;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="space-y-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isDone
                      ? 'bg-emerald-600'
                      : isCurrent
                      ? 'bg-emerald-600/70 dark:bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
                <div className="hidden sm:block">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isCurrent
                        ? 'text-slate-900 dark:text-white'
                        : isDone
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 md:p-8">
        {step === 1 && (
          <Step1Profile investorType={investorType} onChange={setInvestorType} />
        )}

        {step === 2 && (
          <Step2Capacity
            currency={currency}
            declaredAvailableCapital={declaredAvailableCapital}
            minTicket={minTicket}
            maxTicket={maxTicket}
            deploymentPeriodMonths={deploymentPeriodMonths}
            onChange={handleStep2Change}
          />
        )}

        {step === 3 && (
          <Step3SourceOfFunds
            sourceOfFunds={sourceOfFunds}
            sourceOfFundsExplanation={sourceOfFundsExplanation}
            onChange={handleStep3Change}
          />
        )}

        {step === 4 && (
          <Step4Evidence
            documents={initialData.documents || []}
            onUpload={async (file, docType) => {
              await uploadDocMutation.mutateAsync({ file, documentType: docType });
            }}
            onDelete={async (docId) => {
              await deleteDocMutation.mutateAsync(docId);
            }}
            isUploading={uploadDocMutation.isPending}
          />
        )}

        {step === 5 && (
          <Step5Review
            investorType={investorType}
            currency={currency}
            declaredAvailableCapital={declaredAvailableCapital}
            minTicket={minTicket}
            maxTicket={maxTicket}
            deploymentPeriodMonths={deploymentPeriodMonths}
            sourceOfFunds={sourceOfFunds}
            sourceOfFundsExplanation={sourceOfFundsExplanation}
            documents={initialData.documents || []}
            declarationConfirmed={declarationConfirmed}
            onDeclarationChange={setDeclarationConfirmed}
          />
        )}

        {/* Global Form Error */}
        {formError && (
          <div className="mt-6 flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {step < 5 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !declarationConfirmed}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 shadow-sm"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting Verification...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
