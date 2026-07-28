'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  SpCard,
  SpFormField,
  SpMutationFeedback,
  SpSectionHeader,
  SpTagInput,
} from '@/components/serviceprovider/ui';
import { SERVICE_CATEGORIES } from '@/types/service-provider';
import type { ServiceListing } from '@/types/service-catalog';
import { useCreateListing, useUpdateListing } from '@/hooks/queries/service-catalog';
import { useSpDirtyFormGuard } from '@/hooks/useSpDirtyFormGuard';

export function ListingEditor({
  existing,
  onDone,
  onCancel,
}: {
  existing?: ServiceListing;
  onDone: (id: string) => void;
  onCancel: () => void;
}) {
  const create = useCreateListing();
  const update = useUpdateListing();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [serviceType, setServiceType] = useState(existing?.serviceType ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState(existing?.category ?? SERVICE_CATEGORIES[0]);
  const [industryFocus, setIndustryFocus] = useState(existing?.industryFocus ?? []);
  const [geographicCoverage, setGeographicCoverage] = useState(existing?.geographicCoverage ?? []);
  const [error, setError] = useState<string | null>(null);
  const formState = { title, serviceType, description, category, industryFocus, geographicCoverage };
  const dirtyGuard = useSpDirtyFormGuard(formState);

  const pending = create.isPending || update.isPending;

  const save = async () => {
    if (!title.trim()) {
      setError('A service title is required.');
      return;
    }

    setError(null);
    const payload = {
      serviceType: serviceType.trim(),
      title: title.trim(),
      description: description.trim(),
      category,
      industryFocus,
      geographicCoverage,
    };

    try {
      const result = existing
        ? await update.mutateAsync([existing.id, payload])
        : await create.mutateAsync([payload]);
      dirtyGuard.markClean(formState);
      onDone(result.id);
    } catch {
      setError('The service could not be saved. Review the fields and try again.');
    }
  };

  return (
    <SpCard className="mx-auto max-w-4xl">
      <SpSectionHeader
        title={existing ? 'Service overview' : 'Describe your service'}
        description="Use client-facing language. Packages, requirements, and FAQs are managed after this overview is saved."
      />

      <div className="mt-6 space-y-6">
        <SpFormField id="service-title" label="Service title" required description={`${title.length} characters`}>
          <Input
            value={title}
            maxLength={180}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="For example: Product UX audit for B2B SaaS teams"
          />
        </SpFormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <SpFormField id="service-category" label="Category" required description="The category is used for marketplace discovery and matching.">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
            >
              {SERVICE_CATEGORIES.map((option) => (
                <option key={option} value={option}>{formatEnum(option)}</option>
              ))}
            </select>
          </SpFormField>
          <SpFormField id="service-type" label="Service type" description="A concise delivery format, such as Consulting, Design, or Development.">
            <Input
              value={serviceType}
              maxLength={100}
              onChange={(event) => setServiceType(event.target.value)}
              placeholder="Consulting"
            />
          </SpFormField>
        </div>

        <SpFormField id="service-description" label="Service description" description={`${description.length} characters`}>
          <Textarea
            rows={8}
            value={description}
            maxLength={3000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explain the outcome, working approach, and what a client can expect."
          />
        </SpFormField>

        <div className="grid gap-5 lg:grid-cols-2">
          <SpTagInput
            id="service-industries"
            label="Industry focus"
            value={industryFocus}
            onChange={setIndustryFocus}
            placeholder="Add an industry"
            maxItems={20}
            description="Used by the existing matching and discovery logic."
          />
          <SpTagInput
            id="service-geographies"
            label="Geographic coverage"
            value={geographicCoverage}
            onChange={setGeographicCoverage}
            placeholder="Add a market or region"
            maxItems={20}
            description="Describe the markets or regions this service can support."
          />
        </div>

        {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}

        <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-5">
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? 'Saving…' : existing ? 'Save changes' : 'Save service overview'}
          </Button>
          <Button type="button" variant="outline" onClick={() => dirtyGuard.confirmDiscard(onCancel)} disabled={pending}>
            Cancel
          </Button>
        </div>
      </div>
    </SpCard>
  );
}

function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}
