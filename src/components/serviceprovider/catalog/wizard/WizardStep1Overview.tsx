'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { getServiceTypes } from '@/lib/api-service-catalog';

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
  const [metadataTags, setMetadataTags] = useState(draft.metadataTags);
  const [searchTags, setSearchTags] = useState(draft.searchTags);
  const [industryFocus, setIndustryFocus] = useState(draft.industryFocus);
  const [geographicCoverage, setGeographicCoverage] = useState(draft.geographicCoverage);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [serviceTypesLookup, setServiceTypesLookup] = useState<Record<string, string[]>>({});

  const suggestedKeywords = useMemo(() => getSuggestedKeywordsForCategory(category), [category]);

  // Fetch service types lookup on mount
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const lookup = await getServiceTypes();
        setServiceTypesLookup(lookup);
      } catch (err) {
        console.error('Failed to fetch service types:', err);
      }
    };
    fetchServiceTypes();
  }, []);

  // When category changes, clear serviceType if it's no longer valid for the new category
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const approvedTypes = serviceTypesLookup[newCategory] || [];
    // If the current serviceType is not in the approved list for the new category, clear it
    if (newCategory !== 'Other' && approvedTypes.length > 0 && !approvedTypes.includes(serviceType)) {
      setServiceType('');
    }
  };

  const approvedServiceTypes = serviceTypesLookup[category] || [];
  const isOtherCategory = category === 'Other';

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
        metadataTags,
        searchTags,
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
        {/* 1. Service Title */}
        <SpFormField id="step1-title" label="Service title" required description={`${title.length} / 180`}>
          <Input
            value={title}
            maxLength={180}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Product UX audit for B2B SaaS teams"
          />
        </SpFormField>

        {/* 2. Category & Sub-Category (side by side) */}
        <div className="grid gap-5 sm:grid-cols-2">
          <SpFormField id="step1-category" label="Category" required>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
            >
              {SERVICE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {formatEnum(option)}
                </option>
              ))}
            </select>
          </SpFormField>

          <SpFormField
            id="step1-type"
            label="Sub-category"
            description={isOtherCategory ? "Enter a custom sub-category." : "Select from approved options."}
          >
            {isOtherCategory ? (
              <Input
                value={serviceType}
                maxLength={100}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g. Custom service type"
              />
            ) : (
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                disabled={approvedServiceTypes.length === 0}
                className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
              >
                <option value="">{approvedServiceTypes.length === 0 ? 'Select a category first' : 'Select sub-category'}</option>
                {approvedServiceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
          </SpFormField>
        </div>

        {/* Suggested keywords (under Category/Sub-Category) */}
        {suggestedKeywords.length > 0 && (
          <div className="rounded-lg bg-[#F0F9FF] p-3">
            <p className="text-xs font-medium text-[#3C61DD]">
              Common keywords for this category:
            </p>
            <p className="mt-1 text-sm text-[#3C61DD]">
              {suggestedKeywords.join(' • ')}
            </p>
          </div>
        )}

        {/* 3. Metadata Tags (capped at 5) */}
        <SpTagInput
          id="step1-metadata"
          label="Metadata tags"
          value={metadataTags}
          onChange={setMetadataTags}
          placeholder="Add a tag"
          maxItems={5}
          description={`Internal/technical tags. ${metadataTags.length}/5 tags used.`}
        />

        {/* 4. Search Tags (capped at 5) */}
        <SpTagInput
          id="step1-search"
          label="Search tags"
          value={searchTags}
          onChange={setSearchTags}
          placeholder="Add a tag"
          maxItems={5}
          description={`Customer-facing search phrases. ${searchTags.length}/5 tags used.`}
        />

        {/* 5-6. Industry Focus & Geographic Coverage */}
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
