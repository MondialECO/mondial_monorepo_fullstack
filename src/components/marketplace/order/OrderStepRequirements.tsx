'use client';

import { Info, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderStepCard } from './OrderStepCard';
import type { MarketplacePackage, MarketplaceRequirementsField } from '@/lib/api-marketplace';

interface Props {
  pkg: MarketplacePackage;
  answers: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** File answers are collected in the workroom after the order starts (M3). */
function isAnswerable(field: MarketplaceRequirementsField) {
  return field.fieldType !== 'File';
}

export function OrderStepRequirements({ pkg, answers, onChange, onBack, onContinue }: Props) {
  const fields = pkg.requirementsTemplate ?? [];

  const missingRequired = fields.some(
    (f) => f.required && isAnswerable(f) && !(answers[f.fieldId] ?? '').trim()
  );

  if (fields.length === 0) {
    return (
      <OrderStepCard
        title="Provider requirements"
        subtitle="This package needs no extra details from you."
        footer={
          <>
            <Button variant="outline" onClick={onBack} className="h-11">
              Back
            </Button>
            <Button onClick={onContinue} className="h-11">
              Continue to confirmation
            </Button>
          </>
        }
      >
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          No requirements needed for this package — you can go straight to confirmation.
        </p>
      </OrderStepCard>
    );
  }

  return (
    <OrderStepCard
      title="Provider requirements"
      subtitle="Answer the questions below so the provider can start work on your project."
      footer={
        <>
          <Button variant="outline" onClick={onBack} className="h-11">
            Back
          </Button>
          <Button onClick={onContinue} disabled={missingRequired} className="h-11">
            Continue to confirmation
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {fields.map((field) => {
          const value = answers[field.fieldId] ?? '';
          const label = (
            <label htmlFor={field.fieldId} className="mb-1 block text-sm font-medium text-foreground">
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </label>
          );

          if (field.fieldType === 'File') {
            return (
              <div key={field.fieldId} className="rounded-lg border border-border p-4">
                {label}
                <div className="flex items-center gap-2 rounded-md border border-dashed border-input bg-muted/40 p-3 text-sm text-muted-foreground">
                  <Paperclip className="size-4 shrink-0" />
                  File upload available after your order starts — you&apos;ll be asked for
                  this in the workroom.
                </div>
              </div>
            );
          }

          if (field.fieldType === 'Boolean') {
            return (
              <div key={field.fieldId} className="rounded-lg border border-border p-4">
                {label}
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    id={field.fieldId}
                    type="checkbox"
                    checked={value === 'true'}
                    onChange={(e) => onChange(field.fieldId, e.target.checked ? 'true' : 'false')}
                    className="rounded border border-input"
                  />
                  Yes
                </label>
              </div>
            );
          }

          if (field.fieldType === 'Date') {
            return (
              <div key={field.fieldId} className="rounded-lg border border-border p-4">
                {label}
                <Input
                  id={field.fieldId}
                  type="date"
                  value={value}
                  onChange={(e) => onChange(field.fieldId, e.target.value)}
                />
              </div>
            );
          }

          return (
            <div key={field.fieldId} className="rounded-lg border border-border p-4">
              {label}
              <Input
                id={field.fieldId}
                type="text"
                inputMode={field.fieldType === 'Number' ? 'numeric' : undefined}
                value={value}
                onChange={(e) => onChange(field.fieldId, e.target.value)}
                placeholder={field.fieldType === 'Choice' ? 'Type your answer' : undefined}
              />
              {field.fieldType === 'Choice' && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="size-3 shrink-0" />
                  Dropdown options coming soon — type your answer for now.
                </p>
              )}
            </div>
          );
        })}
      </div>

    </OrderStepCard>
  );
}
