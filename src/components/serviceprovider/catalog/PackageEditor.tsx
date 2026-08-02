'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  SpCard,
  SpMutationFeedback,
  SpSectionHeader,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import { PRICING_MODELS } from '@/types/service-provider';
import {
  CANCELLATION_POLICIES,
  DELIVERY_DAY_TYPES,
  DELIVERY_START_RULES,
  DELIVERY_TIME_UNITS,
  REQUIREMENTS_FIELD_TYPES,
  type PackageType,
  type RequirementsField,
  type ServiceAddOn,
  type ServicePackage,
  type UpsertServicePackageRequest,
} from '@/types/service-catalog';
import { usePricingGuidance } from '@/hooks/queries/service-catalog';
import { useSpDirtyFormGuard } from '@/hooks/useSpDirtyFormGuard';
import { csv, parseCsv, EnumSelect, Field } from './_shared';

const NONE = 'None';

function toRequest(pkg: ServicePackage): UpsertServicePackageRequest {
  const { id, serviceId, createdAt, updatedAt, status, ...rest } = pkg;
  void id; void serviceId; void createdAt; void updatedAt; void status;
  return { ...rest, pricingModel: pkg.pricingModel ?? null };
}

function defaults(tier: PackageType): UpsertServicePackageRequest {
  return {
    packageType: tier,
    packageName: '',
    packageTitle: '',
    packageDescription: '',
    price: 0,
    currency: 'EUR',
    pricingModel: null,
    deliveryTimeValue: 5,
    deliveryTimeUnit: 'Days',
    deliveryDayType: 'BusinessDays',
    deliveryStartRule: 'AfterEscrowFunding',
    deliveryTimezone: 'UTC',
    dailyCutoffTime: '17:00',
    includedRevisionCount: 1,
    unlimitedRevisions: false,
    revisionRequestWindowDays: 3,
    additionalRevisionAvailable: false,
    additionalRevisionPrice: 0,
    additionalRevisionDeliveryTime: 0,
    revisionScopeDescription: '',
    deliverables: [],
    includedFeatures: [],
    excludedFeatures: [],
    addOns: [],
    requirementsTemplate: [],
    cancellationPolicy: 'FlexibleFullRefundBeforeStart',
    instantOrderEnabled: false,
    manualApprovalRequired: false,
    maximumActiveOrders: 0,
  };
}

export function PackageEditor({
  tier,
  existing,
  category,
  onSubmit,
  onCancel,
  pending,
}: {
  tier: PackageType;
  existing?: ServicePackage;
  category: string;
  onSubmit: (payload: UpsertServicePackageRequest) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}) {
  const [f, setF] = useState<UpsertServicePackageRequest>(existing ? toRequest(existing) : defaults(tier));
  const [deliverables, setDeliverables] = useState(csv(existing?.deliverables ?? []));
  const [included, setIncluded] = useState(csv(existing?.includedFeatures ?? []));
  const [excluded, setExcluded] = useState(csv(existing?.excludedFeatures ?? []));
  const [error, setError] = useState<string | null>(null);
  const formState = { package: f, deliverables, included, excluded };
  const dirtyGuard = useSpDirtyFormGuard(formState);

  const set = <K extends keyof UpsertServicePackageRequest>(k: K, v: UpsertServicePackageRequest[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const guidance = usePricingGuidance(category, f.pricingModel ?? undefined);

  const submit = async () => {
    setError(null);
    const payload: UpsertServicePackageRequest = {
      ...f,
      deliverables: parseCsv(deliverables),
      includedFeatures: parseCsv(included),
      excludedFeatures: parseCsv(excluded),
    };
    try {
      await onSubmit(payload);
    } catch {
      setError('Could not save the package. Check the fields and try again.');
    }
  };

  return (
    <SpCard className="mx-auto max-w-5xl">
      <SpSectionHeader
        title={existing ? `Edit ${tier} package` : `Add ${tier} package`}
        description="Set the gross price, scope, delivery terms, revisions, add-ons, requirements, and order handling for this package."
        action={<SpStatusBadge>{tier}</SpStatusBadge>}
      />
      <div className="mt-6 space-y-6">
        {/* Basics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Package title" htmlFor="pk-title">
            <Input id="pk-title" value={f.packageTitle} onChange={(e) => set('packageTitle', e.target.value)} />
          </Field>
          <Field label="Internal name" htmlFor="pk-name">
            <Input id="pk-name" value={f.packageName} onChange={(e) => set('packageName', e.target.value)} />
          </Field>
        </div>
        <Field label="Description" htmlFor="pk-desc">
          <Textarea id="pk-desc" rows={2} value={f.packageDescription} onChange={(e) => set('packageDescription', e.target.value)} />
        </Field>

        {/* Pricing */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price" htmlFor="pk-price">
            <Input id="pk-price" type="number" min={0} value={f.price} onChange={(e) => set('price', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Currency" htmlFor="pk-cur">
            <Input id="pk-cur" value={f.currency} onChange={(e) => set('currency', e.target.value)} />
          </Field>
          <Field label="Pricing model" htmlFor="pk-pm">
            <EnumSelect
              labelFor="pk-pm"
              value={f.pricingModel ?? NONE}
              onChange={(v) => set('pricingModel', v === NONE ? null : v)}
              options={[NONE, ...PRICING_MODELS]}
            />
          </Field>
        </div>
        {guidance.data && (
          <SpMutationFeedback status="info">
            Deterministic category guidance: {guidance.data.currency} {guidance.data.min}–{guidance.data.max}. This is guidance, not a quote or net-earnings preview.
          </SpMutationFeedback>
        )}
        {guidance.isError && (
          <SpMutationFeedback status="error">
            Pricing guidance is unavailable. You can still save the package using your own gross price.
          </SpMutationFeedback>
        )}

        <Separator />

        {/* Delivery */}
        <p className="text-sm font-medium text-foreground">Delivery time</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Value" htmlFor="pk-dv">
            <Input id="pk-dv" type="number" min={0} value={f.deliveryTimeValue} onChange={(e) => set('deliveryTimeValue', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Unit" htmlFor="pk-du"><EnumSelect labelFor="pk-du" value={f.deliveryTimeUnit} onChange={(v) => set('deliveryTimeUnit', v)} options={DELIVERY_TIME_UNITS} /></Field>
          <Field label="Day type" htmlFor="pk-dd"><EnumSelect labelFor="pk-dd" value={f.deliveryDayType} onChange={(v) => set('deliveryDayType', v)} options={DELIVERY_DAY_TYPES} /></Field>
          <Field label="Start rule" htmlFor="pk-ds"><EnumSelect labelFor="pk-ds" value={f.deliveryStartRule} onChange={(v) => set('deliveryStartRule', v)} options={DELIVERY_START_RULES} /></Field>
        </div>

        <Separator />

        {/* Revisions */}
        <p className="text-sm font-medium text-foreground">Revisions</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Included" htmlFor="pk-ir">
            <Input id="pk-ir" type="number" min={0} value={f.includedRevisionCount} onChange={(e) => set('includedRevisionCount', Number(e.target.value) || 0)} disabled={f.unlimitedRevisions} />
          </Field>
          <Field label="Request window (days)" htmlFor="pk-rw">
            <Input id="pk-rw" type="number" min={0} value={f.revisionRequestWindowDays} onChange={(e) => set('revisionRequestWindowDays', Number(e.target.value) || 0)} />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <Checkbox checked={f.unlimitedRevisions} onChange={(e) => set('unlimitedRevisions', e.target.checked)} /> Unlimited
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={f.additionalRevisionAvailable} onChange={(e) => set('additionalRevisionAvailable', e.target.checked)} />
          Sell extra revisions
        </label>
        {f.additionalRevisionAvailable && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Extra revision price" htmlFor="pk-arp">
              <Input id="pk-arp" type="number" min={0} value={f.additionalRevisionPrice} onChange={(e) => set('additionalRevisionPrice', Number(e.target.value) || 0)} />
            </Field>
            <Field label="Extra revision +days" htmlFor="pk-ard">
              <Input id="pk-ard" type="number" min={0} value={f.additionalRevisionDeliveryTime} onChange={(e) => set('additionalRevisionDeliveryTime', Number(e.target.value) || 0)} />
            </Field>
          </div>
        )}

        <Separator />

        {/* Scope */}
        <Field label="Deliverables (comma separated)" htmlFor="pk-del">
          <Input id="pk-del" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="Report, Figma file" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Included features (comma separated)" htmlFor="pk-if">
            <Input id="pk-if" value={included} onChange={(e) => setIncluded(e.target.value)} />
          </Field>
          <Field label="Excluded features (comma separated)" htmlFor="pk-ef">
            <Input id="pk-ef" value={excluded} onChange={(e) => setExcluded(e.target.value)} />
          </Field>
        </div>

        <AddOnsEditor value={f.addOns} onChange={(v) => set('addOns', v)} />
        <RequirementsEditor value={f.requirementsTemplate} onChange={(v) => set('requirementsTemplate', v)} />

        <Separator />

        {/* Order handling */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cancellation policy" htmlFor="pk-cp">
            <EnumSelect labelFor="pk-cp" value={f.cancellationPolicy} onChange={(v) => set('cancellationPolicy', v)} options={CANCELLATION_POLICIES} />
          </Field>
          <Field label="Max active orders (0 = no limit)" htmlFor="pk-mo">
            <Input id="pk-mo" type="number" min={0} value={f.maximumActiveOrders} onChange={(e) => set('maximumActiveOrders', Number(e.target.value) || 0)} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={f.instantOrderEnabled} onChange={(e) => set('instantOrderEnabled', e.target.checked)} /> Instant order enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={f.manualApprovalRequired} onChange={(e) => set('manualApprovalRequired', e.target.checked)} /> Manual approval required
          </label>
        </div>

        {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}
        <div className="flex flex-wrap items-center gap-3 border-t border-[#E5E7EB] pt-5">
          <Button type="button" onClick={submit} disabled={pending}>{pending ? 'Saving…' : 'Save package'}</Button>
          <Button type="button" variant="outline" onClick={() => dirtyGuard.confirmDiscard(onCancel)} disabled={pending}>Cancel</Button>
        </div>
      </div>
    </SpCard>
  );
}

function AddOnsEditor({ value, onChange }: { value: ServiceAddOn[]; onChange: (v: ServiceAddOn[]) => void }) {
  const setAt = (i: number, patch: Partial<ServiceAddOn>) => onChange(value.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Add-ons <span className="font-normal text-muted-foreground">(non-revision extras)</span></p>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...value, { name: '', price: 0, deliveryTimeAdjustmentDays: 0, enabled: true }])}>
          <Plus className="h-3.5 w-3.5" /> Add-on
        </Button>
      </div>
      {value.map((a, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center">
          <Input aria-label={`Add-on ${i + 1} name`} placeholder="Name" value={a.name} onChange={(e) => setAt(i, { name: e.target.value })} />
          <Input aria-label={`Add-on ${i + 1} price`} className="sm:w-24" type="number" placeholder="Price" value={a.price} onChange={(e) => setAt(i, { price: Number(e.target.value) || 0 })} />
          <Input aria-label={`Add-on ${i + 1} delivery adjustment in days`} className="sm:w-24" type="number" placeholder="+days" value={a.deliveryTimeAdjustmentDays} onChange={(e) => setAt(i, { deliveryTimeAdjustmentDays: Number(e.target.value) || 0 })} />
          <label className="flex items-center gap-1 text-xs"><Checkbox checked={a.enabled} onChange={(e) => setAt(i, { enabled: e.target.checked })} /> On</label>
          <Button type="button" aria-label={`Remove add-on ${i + 1}`} size="sm" variant="ghost" onClick={() => onChange(value.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" /></Button>
        </div>
      ))}
    </div>
  );
}

function RequirementsEditor({ value, onChange }: { value: RequirementsField[]; onChange: (v: RequirementsField[]) => void }) {
  const setAt = (i: number, patch: Partial<RequirementsField>) => onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Client requirements <span className="font-normal text-muted-foreground">(what you&apos;ll ask the buyer)</span></p>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...value, { fieldId: '', label: '', fieldType: 'Text', required: false }])}>
          <Plus className="h-3.5 w-3.5" /> Field
        </Button>
      </div>
      {value.map((r, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
          <Input aria-label={`Client requirement ${i + 1}`} placeholder="Question / label" value={r.label} onChange={(e) => setAt(i, { label: e.target.value })} />
          <EnumSelect ariaLabel={`Client requirement ${i + 1} field type`} className="sm:w-32" value={r.fieldType} onChange={(v) => setAt(i, { fieldType: v as RequirementsField['fieldType'] })} options={REQUIREMENTS_FIELD_TYPES} />
          <label className="flex items-center gap-1 text-xs"><Checkbox checked={r.required} onChange={(e) => setAt(i, { required: e.target.checked })} /> Required</label>
          <Button type="button" aria-label={`Remove client requirement ${i + 1}`} size="sm" variant="ghost" onClick={() => onChange(value.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" /></Button>
        </div>
      ))}
    </div>
  );
}
