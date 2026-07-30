'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  SpCard,
  SpFormField,
  SpMutationFeedback,
} from '@/components/serviceprovider/ui';
import type { ServiceListing } from '@/types/service-catalog';
import { useUpdateListing, useServiceListing } from '@/hooks/queries/service-catalog';
import { FaqBuilder } from '../FaqBuilder';

export function WizardStep3Description({
  listingId,
  draft,
  onDraftUpdate,
  onNext,
  onBack,
}: {
  listingId: string;
  draft: ServiceListing;
  onDraftUpdate: (updated: ServiceListing) => void;
  onNext?: () => void;
  onBack?: () => void;
}) {
  const updateListing = useUpdateListing();
  const listingDetail = useServiceListing(listingId);

  const [description, setDescription] = useState(draft.description);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        serviceType: draft.serviceType,
        title: draft.title,
        description: description.trim(),
        category: draft.category,
        metadataTags: draft.metadataTags,
        searchTags: draft.searchTags,
        industryFocus: draft.industryFocus,
        geographicCoverage: draft.geographicCoverage,
      };

      const updated = await updateListing.mutateAsync([draft.id, payload]);
      onDraftUpdate(updated);
      onNext?.();
    } catch {
      setError('Could not save description. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SpCard className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#171717]">Service Description</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Provide a detailed description of your service. This text will be shown to clients
            discovering your service.
          </p>
        </div>

        <div className="space-y-5">
          <SpFormField
            id="step3-description"
            label="Service description"
            description={`${description.length} / 3000 characters`}
          >
            <Textarea
              value={description}
              maxLength={3000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the outcome, working approach, and what a client can expect."
              rows={8}
            />
            <p className="mt-2 text-xs text-[#6B7280]">Minimum 120 words recommended</p>
          </SpFormField>

          {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}
        </div>
      </SpCard>

      <SpCard className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#171717]">Frequently Asked Questions</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Add FAQs to help clients understand your service better. You can organize them by
            package and visibility.
          </p>
        </div>

        {listingDetail.data && (
          <FaqBuilder
            listingId={listingId}
            faqs={listingDetail.data.faqs}
            packages={listingDetail.data.packages}
          />
        )}
      </SpCard>

      <SpCard>
        <div className="flex flex-wrap gap-2">
          {onBack ? (
            <>
              <Button onClick={onBack} variant="outline" disabled={isSaving}>
                <ChevronLeft className="size-4" aria-hidden="true" />
                Back
              </Button>
              <Button onClick={handleSaveAndContinue} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Next: Client Requirements'}
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </>
          ) : (
            <Button onClick={handleSaveAndContinue} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Draft & Exit'}
            </Button>
          )}
        </div>
      </SpCard>
    </div>
  );
}
