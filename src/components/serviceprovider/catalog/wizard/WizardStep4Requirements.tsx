'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpCard } from '@/components/serviceprovider/ui';
import type { RequirementsField } from '@/types/service-catalog';
import { REQUIREMENTS_FIELD_TYPES } from '@/types/service-catalog';
import { useServiceListing, useUpdatePackage } from '@/hooks/queries/service-catalog';

export function WizardStep4Requirements({
  listingId,
  onNext,
  onBack,
}: {
  listingId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const listingDetail = useServiceListing(listingId);
  const updatePackage = useUpdatePackage();

  const [requirements, setRequirements] = useState<RequirementsField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing requirements from first package (all packages will get the same template)
  useEffect(() => {
    if (listingDetail.data?.packages && listingDetail.data.packages.length > 0) {
      const first = listingDetail.data.packages[0];
      setRequirements(first.requirementsTemplate ?? []);
    }
  }, [listingDetail.data]);

  const addQuestion = () => {
    setRequirements((prev) => [
      ...prev,
      {
        fieldId: `field-${Date.now()}`,
        label: '',
        fieldType: 'Text',
        required: false,
      },
    ]);
  };

  const updateQuestion = (index: number, updates: Partial<RequirementsField>) => {
    setRequirements((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const deleteQuestion = (index: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndNext = async () => {
    if (!listingDetail.data?.packages || listingDetail.data.packages.length === 0) {
      setError('No packages found. Please create packages in Step 2 first.');
      return;
    }

    // Validate questions
    if (requirements.some((q) => !q.label.trim())) {
      setError('All questions must have a label.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Apply same requirements template to ALL packages
      const packages = listingDetail.data.packages;
      await Promise.all(
        packages.map((pkg) =>
          updatePackage.mutateAsync([
            pkg.id,
            {
              packageType: pkg.packageType,
              packageName: pkg.packageName,
              packageTitle: pkg.packageTitle,
              packageDescription: pkg.packageDescription,
              price: pkg.price,
              currency: pkg.currency,
              pricingModel: pkg.pricingModel,
              deliveryTimeValue: pkg.deliveryTimeValue,
              deliveryTimeUnit: pkg.deliveryTimeUnit,
              deliveryDayType: pkg.deliveryDayType,
              deliveryStartRule: pkg.deliveryStartRule,
              deliveryTimezone: pkg.deliveryTimezone,
              dailyCutoffTime: pkg.dailyCutoffTime,
              includedRevisionCount: pkg.includedRevisionCount,
              unlimitedRevisions: pkg.unlimitedRevisions,
              revisionRequestWindowDays: pkg.revisionRequestWindowDays,
              additionalRevisionAvailable: pkg.additionalRevisionAvailable,
              additionalRevisionPrice: pkg.additionalRevisionPrice,
              additionalRevisionDeliveryTime: pkg.additionalRevisionDeliveryTime,
              revisionScopeDescription: pkg.revisionScopeDescription,
              deliverables: pkg.deliverables,
              includedFeatures: pkg.includedFeatures,
              excludedFeatures: pkg.excludedFeatures,
              screensIncluded: pkg.screensIncluded,
              addOns: pkg.addOns,
              requirementsTemplate: requirements,
              cancellationPolicy: pkg.cancellationPolicy,
              instantOrderEnabled: pkg.instantOrderEnabled,
              manualApprovalRequired: pkg.manualApprovalRequired,
              maximumActiveOrders: pkg.maximumActiveOrders,
            },
          ])
        )
      );

      onNext();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const anyErr = err as any;
      const backendMessage = anyErr?.response?.data?.message || anyErr?.response?.data?.error || errorMsg;
      setError(`Could not save requirements: ${backendMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">What do you need from the client to start this order?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add questions to gather requirements before you begin working.</p>
      </div>

      {error && (
        <SpCard className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </SpCard>
      )}

      <div className="space-y-3">
        {requirements.length === 0 ? (
          <SpCard className="border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No questions yet. Add one to get started.</p>
          </SpCard>
        ) : (
          requirements.map((question, index) => (
            <RequirementQuestionCard
              key={question.fieldId}
              question={question}
              index={index}
              onUpdate={(updates) => updateQuestion(index, updates)}
              onDelete={() => deleteQuestion(index)}
            />
          ))
        )}

        <Button
          type="button"
          variant="outline"
          onClick={addQuestion}
          disabled={isSaving}
          className="w-full"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Requirement Question
        </Button>
      </div>

      <SpCard>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onBack} variant="outline" disabled={isSaving}>
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <Button onClick={handleSaveAndNext} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Next: Gallery & Video'}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </SpCard>
    </div>
  );
}

function RequirementQuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: RequirementsField;
  index: number;
  onUpdate: (updates: Partial<RequirementsField>) => void;
  onDelete: () => void;
}) {
  const fieldTypeLabels: Record<RequirementsField['fieldType'], string> = {
    Text: 'Free Text',
    File: 'File Upload',
    Choice: 'Choice',
    Number: 'Number',
    Date: 'Date',
    Boolean: 'Yes / No',
  };
  const fieldTypeLabel = fieldTypeLabels[question.fieldType];

  return (
    <SpCard className="p-5">
      <div className="space-y-4">
        {/* Header with number and field type chip */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground">
                {index + 1}. {question.label || '(Untitled question)'}
              </h3>
              <span className="inline-block rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {fieldTypeLabel}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-[#B42318]"
            aria-label="Delete question"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        {/* Question label input */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Question</label>
          <Input
            value={question.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="e.g. What are your brand colors?"
            className="text-sm"
          />
        </div>

        {/* Field type selector and Required toggle */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Field type</label>
            <select
              value={question.fieldType}
              onChange={(e) =>
                onUpdate({ fieldType: e.target.value as RequirementsField['fieldType'] })
              }
              className="h-9 w-full rounded-lg border border-input bg-white px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {REQUIREMENTS_FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'Text' ? 'Free Text' : type === 'File' ? 'File Upload' : type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-0.5">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="size-4 rounded border-input cursor-pointer"
              />
              <span className="text-xs font-medium text-foreground">Required</span>
            </label>
          </div>
        </div>

        {/* Field preview based on type */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Client will see:</p>
          {question.fieldType === 'File' && (
            <div className="rounded-lg border-2 border-dashed border-input bg-muted p-6 text-center">
              <Upload className="mx-auto size-6 text-muted-foreground mb-2" />
              <p className="text-xs font-medium text-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or PDF (max. 10MB)</p>
            </div>
          )}
          {question.fieldType === 'Text' && (
            <div className="rounded-lg border border-border bg-white p-3">
              <input
                type="text"
                disabled
                placeholder="Client will enter text here..."
                className="w-full text-xs text-muted-foreground placeholder-[#9CA3AF] bg-transparent outline-none"
              />
            </div>
          )}
          {question.fieldType === 'Choice' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground italic">Client chooses from:</p>
              <div className="rounded-lg border border-border bg-white overflow-hidden">
                <div className="text-xs text-muted-foreground p-3 text-center">
                  (Define options in edit mode)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SpCard>
  );
}
