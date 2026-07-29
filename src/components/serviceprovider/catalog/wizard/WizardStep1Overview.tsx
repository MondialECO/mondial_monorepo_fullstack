'use client';

import { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  SpCard,
  SpFormField,
  SpMutationFeedback,
  SpTagInput,
} from '@/components/serviceprovider/ui';
import { SERVICE_CATEGORIES } from '@/types/service-provider';
import type { ServiceListing } from '@/types/service-catalog';
import { useUpdateListing } from '@/hooks/queries/service-catalog';
import { getSuggestedKeywordsForCategory } from '@/lib/service-catalog/suggested-keywords';

export function WizardStep1Overview({
  draft,
  onDraftUpdate,
  onNext,
}: {
  draft: ServiceListing;
  onDraftUpdate: (updated: ServiceListing) => void;
  onNext: () => void;
}) {
  const updateListing = useUpdateListing();
  const [title, setTitle] = useState(draft.title);
  const [serviceType, setServiceType] = useState(draft.serviceType);
  const [category, setCategory] = useState(draft.category);
  const [industryFocus, setIndustryFocus] = useState(draft.industryFocus);
  const [geographicCoverage, setGeographicCoverage] = useState(draft.geographicCoverage);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const suggestedKeywords = useMemo(() => getSuggestedKeywordsForCategory(category), [category]);

  const handleNext = async () => {
    if (!title.trim()) {
      setError('Service title is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        serviceType: serviceType.trim(),
        title: title.trim(),
        description: draft.description,
        category,
        industryFocus,
        geographicCoverage,
      };

      const updated = await updateListing.mutateAsync([draft.id, payload]);
      onDraftUpdate(updated);
      onNext();
    } catch {
      setError('Could not save overview. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SpCard className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#171717]">Service Overview</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Describe your service in client-facing language. Packages, requirements, and FAQs
          are managed in the following steps.
        </p>
      </div>

      <div className="space-y-5">
        <SpFormField id="step1-title" label="Service title" required description={`${title.length} / 180`}>
          <Input
            value={title}
            maxLength={180}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Product UX audit for B2B SaaS teams"
          />
        </SpFormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <SpFormField
            id="step1-type"
            label="Service type"
            description="A concise delivery format, such as Consulting, Design, or Development."
          >
            <Input
              value={serviceType}
              maxLength={100}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="e.g. Consulting"
            />
          </SpFormField>

          <div>
            <SpFormField id="step1-category" label="Category" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
              >
                {SERVICE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {formatEnum(option)}
                  </option>
                ))}
              </select>
            </SpFormField>

            {suggestedKeywords.length > 0 && (
              <div className="mt-3 rounded-lg bg-[#F0F9FF] p-3">
                <p className="text-xs font-medium text-[#3C61DD]">
                  Common keywords for this category:
                </p>
                <p className="mt-1 text-sm text-[#3C61DD]">
                  {suggestedKeywords.join(' • ')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <SpTagInput
            id="step1-industries"
            label="Industry focus"
            value={industryFocus}
            onChange={setIndustryFocus}
            placeholder="Add an industry"
            maxItems={20}
            description="Used by the existing matching and discovery logic."
          />
          <SpTagInput
            id="step1-geographies"
            label="Geographic coverage"
            value={geographicCoverage}
            onChange={setGeographicCoverage}
            placeholder="Add a market or region"
            maxItems={20}
            description="Describe the markets or regions this service can support."
          />
        </div>

        {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-5">
        <Button onClick={handleNext} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Next: Scope & Pricing'}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </SpCard>
  );
}

function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}
