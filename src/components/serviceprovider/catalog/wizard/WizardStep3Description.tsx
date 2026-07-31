'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpCard } from '@/components/serviceprovider/ui';
import type { ServiceListing, ServiceFaq, UpsertServiceFaqRequest } from '@/types/service-catalog';
import {
  useUpdateListing,
  useServiceListing,
  useAddFaq,
  useUpdateFaq,
  useDeleteFaq,
} from '@/hooks/queries/service-catalog';
import { FaqBuilder } from '../FaqBuilder';
import { ServiceDescriptionEditor } from '../ServiceDescriptionEditor';

// Check if an ID is a real MongoDB ObjectId (24-char hex string)
const isRealObjectId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

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
  const addFaq = useAddFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  const [description, setDescription] = useState(draft.description);
  const [faqs, setFaqs] = useState<ServiceFaq[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize FAQs from query data
  useEffect(() => {
    if (listingDetail.data?.faqs) {
      setFaqs(listingDetail.data.faqs);
    }
  }, [listingDetail.data?.faqs]);

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Save description
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

      // Batch save all FAQs (create/update/delete based on ID shape)
      if (faqs.length > 0 || listingDetail.data?.faqs?.length) {
        await Promise.all([
          // Create new FAQs (temp IDs)
          ...faqs
            .filter((faq) => !isRealObjectId(faq.id))
            .map((faq) =>
              addFaq.mutateAsync([
                listingId,
                {
                  packageId: faq.packageId,
                  question: faq.question,
                  answer: faq.answer,
                  visibility: faq.visibility,
                  displayOrder: faq.displayOrder,
                } as UpsertServiceFaqRequest,
              ])
            ),
          // Update existing FAQs (real ObjectIds)
          ...faqs
            .filter((faq) => isRealObjectId(faq.id))
            .map((faq) =>
              updateFaq.mutateAsync([
                faq.id,
                {
                  packageId: faq.packageId,
                  question: faq.question,
                  answer: faq.answer,
                  visibility: faq.visibility,
                  displayOrder: faq.displayOrder,
                } as UpsertServiceFaqRequest,
              ])
            ),
          // Delete removed FAQs (that had real ObjectIds)
          ...(listingDetail.data?.faqs ?? [])
            .filter((originalFaq) => !faqs.find((f) => f.id === originalFaq.id) && isRealObjectId(originalFaq.id))
            .map((faq) => deleteFaq.mutateAsync([faq.id])),
        ]);
      }

      onDraftUpdate(updated);
      onNext?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const anyErr = err as any;
      const backendMessage = anyErr?.response?.data?.message || anyErr?.response?.data?.error || errorMsg;
      setError(`Could not save step 3: ${backendMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SpCard className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Service Description</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Provide a detailed description of your service. This text will be shown to clients
            discovering your service.
          </p>
        </div>

        <div className="space-y-5">
          <ServiceDescriptionEditor value={description} onChange={setDescription} error={error} />
        </div>
      </SpCard>

      <SpCard className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add FAQs to help clients understand your service better. You can organize them by
            package and visibility.
          </p>
        </div>

        {listingDetail.data && (
          <FaqBuilder
            listingId={listingId}
            faqs={faqs}
            packages={listingDetail.data.packages}
            hideItemActions
            onFaqsChange={setFaqs}
          />
        )}
      </SpCard>

      {error && (
        <SpCard className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </SpCard>
      )}

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
