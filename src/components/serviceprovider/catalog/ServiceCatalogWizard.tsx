'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpMutationFeedback, SpPage, SpPageHeader } from '@/components/serviceprovider/ui';
import { useCreateListing, useServiceListing } from '@/hooks/queries/service-catalog';
import type { ServiceListing } from '@/types/service-catalog';
import { WizardStep1Overview } from './wizard/WizardStep1Overview';
import { WizardStep2Pricing } from './wizard/WizardStep2Pricing';
import { WizardStep3Description } from './wizard/WizardStep3Description';
import { WizardStep4Requirements } from './wizard/WizardStep4Requirements';
import { WizardStep5Gallery } from './wizard/WizardStep5Gallery';
import { WizardStep6Review } from './wizard/WizardStep6Review';

const BASE_ROUTE = '/dashboard/serviceprovider/services';
const STEPS = ['Overview', 'Scope & Pricing', 'Description & FAQ', 'Client Requirements', 'Gallery & Video', 'Review & Publish'];

export function ServiceCatalogWizard({ onExit }: { onExit: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStepParam = searchParams.get('step') || '1';
  const currentStep = Math.max(1, Math.min(3, parseInt(currentStepParam, 10)));
  const draftId = searchParams.get('draftId');

  const createListing = useCreateListing();
  const draftQuery = useServiceListing(draftId ?? '');

  const [error, setError] = useState<string | null>(null);
  const [savedDraft, setSavedDraft] = useState<ServiceListing | null>(null);

  // On mount or when draftId changes, fetch/initialize draft
  useEffect(() => {
    if (draftId && draftQuery.data?.listing) {
      setSavedDraft(draftQuery.data.listing);
    }
  }, [draftId, draftQuery.data]);

  // Initialize draft if none exists and we're at step 1
  useEffect(() => {
    if (!draftId && currentStep === 1 && !savedDraft) {
      const initDraft = async () => {
        try {
          const result = await createListing.mutateAsync([
            {
              serviceType: '',
              title: '',
              description: '',
              category: 'Development',
              industryFocus: [],
              geographicCoverage: [],
            },
          ]);
          setSavedDraft(result);
          // Update URL to include draftId for future navigation
          router.replace(`${BASE_ROUTE}?view=new&step=1&draftId=${encodeURIComponent(result.id)}`);
        } catch {
          setError('Could not initialize draft. Please try again.');
        }
      };
      initDraft();
    }
  }, [draftId, currentStep, savedDraft, createListing, router]);

  const goToStep = (step: number) => {
    if (draftId) {
      router.push(
        `${BASE_ROUTE}?view=new&step=${step}&draftId=${encodeURIComponent(draftId)}`
      );
    }
  };

  const handleExit = () => {
    // Draft is already persisted, just exit to list
    onExit();
  };

  const renderStep = () => {
    if (!savedDraft) return <div className="text-center py-8">Loading draft...</div>;

    switch (currentStep) {
      case 1:
        return (
          <WizardStep1Overview
            draft={savedDraft}
            onDraftUpdate={setSavedDraft}
            onNext={() => goToStep(2)}
          />
        );
      case 2:
        return (
          <WizardStep2Pricing
            listingId={savedDraft.id}
            onNext={() => goToStep(3)}
            onBack={() => goToStep(1)}
          />
        );
      case 3:
        return (
          <WizardStep3Description
            listingId={savedDraft.id}
            draft={savedDraft}
            onDraftUpdate={setSavedDraft}
            onNext={() => goToStep(4)}
            onBack={() => goToStep(2)}
          />
        );
      case 4:
        return (
          <WizardStep4Requirements
            listingId={savedDraft.id}
            onNext={() => goToStep(5)}
            onBack={() => goToStep(3)}
          />
        );
      case 5:
        return (
          <WizardStep5Gallery
            listing={savedDraft}
            onListingUpdate={setSavedDraft}
            onNext={() => goToStep(6)}
            onBack={() => goToStep(4)}
          />
        );
      case 6:
        return (
          <WizardStep6Review
            listing={savedDraft}
            onBack={() => goToStep(5)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SpPage>
      <SpPageHeader
        title={`Create Service - Step ${currentStep}: ${STEPS[currentStep - 1]}`}
        description="Create your service listing step by step."
        actions={
          <Button type="button" variant="outline" onClick={handleExit}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back to services
          </Button>
        }
      />

      {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}

      <div className="mx-auto max-w-4xl">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            return (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                    isActive
                      ? 'bg-[#3C61DD] text-white'
                      : isCompleted
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#E5E7EB] text-[#6B7280]'
                  }`}
                >
                  {isCompleted ? '✓' : stepNum}
                </div>
                {stepNum < STEPS.length && (
                  <div
                    className={`h-1 w-12 ${
                      isCompleted ? 'bg-[#10B981]' : 'bg-[#E5E7EB]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {renderStep()}
      </div>
    </SpPage>
  );
}
