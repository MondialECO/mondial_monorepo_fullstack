'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useEntrepreneurProgress } from './useEntrepreneurProgress';
import type { LegalIdentityFormData } from '@/lib/schemas/entrepreneur';

type FormState = {
  status: 'idle' | 'saving' | 'navigating';
  error: string | null;
};

type AutosaveState = {
  // 'idle' = nothing pending, 'pending' = debounce timer scheduled,
  // 'saved' = just persisted (used to flash an "Auto-saved" indicator)
  status: 'idle' | 'pending' | 'saved';
  lastSavedAt: number | null;
};

interface UsePhase2Step1FormProps {
  initialData?: Partial<LegalIdentityFormData>;
}

const EMPTY_FORM_DATA: LegalIdentityFormData = {
  companyName: '',
  registrationNumber: '',
  legalForm: '',
  incorporationDate: '',
  countryOfRegistration: '',
  registeredAddress: '',
  industryCode: '',
};

const AUTOSAVE_DEBOUNCE_MS = 400;

/**
 * Phase 2 / Step 1 form hook.
 *
 * Design goals:
 *  - Fast: react-hook-form (uncontrolled inputs, minimal re-renders) + a
 *    debounced autosave so we don't churn progress state on every keystroke.
 *  - No validation: zod and resolvers were intentionally removed. The user
 *    can submit any values; downstream verification is server-side.
 *  - Robust navigation: handleNextClick waits for setProgress updates to
 *    flush before pushing to step-2 so step-2's RouteGuard sees the new
 *    progress (currentStep === 2, completedSteps contains '2-1') instead of
 *    redirecting back.
 */
export function usePhase2Step1Form({
  initialData,
}: UsePhase2Step1FormProps = {}) {
  const router = useRouter();
  const { progress, getPhaseData, savePhaseData, moveToNextStep } =
    useEntrepreneurProgress();

  const [formState, setFormState] = useState<FormState>({
    status: 'idle',
    error: null,
  });
  const [autosave, setAutosave] = useState<AutosaveState>({
    status: 'idle',
    lastSavedAt: null,
  });

  const isInitializedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // No resolver / no validation — just a typed data container.
  const form = useForm<LegalIdentityFormData>({
    defaultValues: EMPTY_FORM_DATA,
  });

  // Hydrate the form ONCE from saved progress (if any).
  useEffect(() => {
    if (!progress || isInitializedRef.current) return;
    isInitializedRef.current = true;

    const savedData =
      (initialData as LegalIdentityFormData | undefined) ||
      (getPhaseData(2) as LegalIdentityFormData | undefined);

    if (savedData) {
      form.reset({ ...EMPTY_FORM_DATA, ...savedData });
    }
  }, [progress, initialData, form, getPhaseData]);

  // Debounced autosave so progress state doesn't update on every keystroke.
  // Surfaces an "Auto-saved" indicator for ~1.5s after each persist.
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      setAutosave((s) => ({ ...s, status: 'pending' }));
      autosaveTimerRef.current = setTimeout(() => {
        savePhaseData(2, values);
        setAutosave({ status: 'saved', lastSavedAt: Date.now() });
        if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
        savedFlashTimerRef.current = setTimeout(() => {
          setAutosave((s) => ({ ...s, status: 'idle' }));
        }, 1500);
      }, AUTOSAVE_DEBOUNCE_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
    };
  }, [form, savePhaseData]);

  const handleSaveDraft = useCallback(async () => {
    setFormState({ status: 'saving', error: null });
    try {
      savePhaseData(2, form.getValues());
      setFormState({ status: 'idle', error: null });
      setAutosave({ status: 'saved', lastSavedAt: Date.now() });
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = setTimeout(() => {
        setAutosave((s) => ({ ...s, status: 'idle' }));
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save draft';
      setFormState({ status: 'idle', error: message });
    }
  }, [form, savePhaseData]);

  const handleNextClick = useCallback(async () => {
    setFormState({ status: 'navigating', error: null });

    try {
      const formData = form.getValues();

      // Final save of the latest values.
      savePhaseData(2, formData);

      // Allow the savePhaseData state update to flush.
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Mark step 2-1 complete and advance currentStep -> 2.
      moveToNextStep(2, 1);

      // Allow moveToNextStep to flush so step-2's RouteGuard sees the
      // updated progress; without this it would redirect back to step-1.
      await new Promise((resolve) => setTimeout(resolve, 100));

      await router.push('/dashboard/entrepreneur/phase-2/step-2');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An error occurred';
      setFormState({ status: 'idle', error: message });
    }
  }, [form, savePhaseData, moveToNextStep, router]);

  return {
    form,
    formState,
    autosave,
    handleSaveDraft,
    handleNextClick,
    isDirty: form.formState.isDirty,
  };
}
