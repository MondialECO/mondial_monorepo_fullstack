'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SpCard,
  SpFormField,
  SpMutationFeedback,
} from '@/components/serviceprovider/ui';
import type { RequirementsField } from '@/types/service-catalog';
import { REQUIREMENTS_FIELD_TYPES } from '@/types/service-catalog';
import { useServiceListingDetail, useUpdatePackage } from '@/hooks/queries/service-catalog';

export function WizardStep4Requirements({
  listingId,
  onNext,
  onBack,
}: {
  listingId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const listingDetail = useServiceListingDetail(listingId);
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

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= requirements.length) return;
    setRequirements((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
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
    } catch {
      setError('Could not save requirements. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SpCard className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#171717]">Client Requirements</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Define what information you need from clients before starting work. This questionnaire
          will be applied to all your packages.
        </p>
      </div>

      {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}

      <div className="space-y-4">
        {requirements.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] p-8 text-center">
            <p className="text-sm text-[#6B7280]">No questions yet. Add one to get started.</p>
          </div>
        ) : (
          requirements.map((question, index) => (
            <RequirementQuestionCard
              key={question.fieldId}
              question={question}
              index={index}
              total={requirements.length}
              onUpdate={(updates) => updateQuestion(index, updates)}
              onDelete={() => deleteQuestion(index)}
              onMove={(direction) => moveQuestion(index, direction)}
            />
          ))
        )}

        <Button
          type="button"
          variant="outline"
          onClick={addQuestion}
          className="w-full"
          disabled={isSaving}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Requirement Question
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-5">
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
  );
}

function RequirementQuestionCard({
  question,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
}: {
  question: RequirementsField;
  index: number;
  total: number;
  onUpdate: (updates: Partial<RequirementsField>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [isOpen, setIsOpen] = useState(index === 0);

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-[#171717]">
            Question {index + 1}: {question.label || '(Untitled)'}
          </h4>
          <p className="mt-1 text-xs text-[#6B7280]">
            Type: {question.fieldType} {question.required ? '• Required' : '• Optional'}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="Move up"
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title="Move down"
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? '−' : '+'}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-3 border-t border-[#E5E7EB] pt-4">
          <SpFormField id={`q-label-${question.fieldId}`} label="Question" required>
            <Input
              value={question.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="e.g. What are your brand colors?"
            />
          </SpFormField>

          <SpFormField id={`q-type-${question.fieldId}`} label="Answer type">
            <select
              value={question.fieldType}
              onChange={(e) =>
                onUpdate({ fieldType: e.target.value as RequirementsField['fieldType'] })
              }
              className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
            >
              {REQUIREMENTS_FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </SpFormField>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="size-4 rounded border-[#D1D5DB]"
            />
            <span className="text-sm text-[#171717]">Client must answer this question</span>
          </label>

          <div className="flex gap-2 border-t border-[#E5E7EB] pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
