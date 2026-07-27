'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SERVICE_CATEGORIES } from '@/types/service-provider';
import type { ServiceListing } from '@/types/service-catalog';
import { useCreateListing, useUpdateListing } from '@/hooks/queries/service-catalog';
import { csv, parseCsv, EnumSelect, Field } from './_shared';

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
  const [industryFocus, setIndustryFocus] = useState(csv(existing?.industryFocus ?? []));
  const [geo, setGeo] = useState(csv(existing?.geographicCoverage ?? []));
  const [error, setError] = useState<string | null>(null);

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
      industryFocus: parseCsv(industryFocus),
      geographicCoverage: parseCsv(geo),
    };
    try {
      const result = existing
        ? await update.mutateAsync([existing.id, payload])
        : await create.mutateAsync([payload]);
      onDone((result as ServiceListing).id);
    } catch {
      setError('Could not save the service. Try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{existing ? 'Edit service' : 'New service'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Title" htmlFor="svc-title">
          <Input id="svc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Product UX Audit" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="svc-cat">
            <EnumSelect labelFor="svc-cat" value={category} onChange={setCategory} options={SERVICE_CATEGORIES} />
          </Field>
          <Field label="Service type" htmlFor="svc-type">
            <Input id="svc-type" value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="e.g. Consulting" />
          </Field>
        </div>
        <Field label="Description" htmlFor="svc-desc">
          <Textarea id="svc-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry focus (comma separated)" htmlFor="svc-ind">
            <Input id="svc-ind" value={industryFocus} onChange={(e) => setIndustryFocus(e.target.value)} placeholder="Fintech, SaaS" />
          </Field>
          <Field label="Geographic coverage (comma separated)" htmlFor="svc-geo">
            <Input id="svc-geo" value={geo} onChange={(e) => setGeo(e.target.value)} placeholder="Remote, EU" />
          </Field>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={pending}>{pending ? 'Saving…' : 'Save service'}</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
