'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useEntrepreneurProgress } from './useEntrepreneurProgress';
import entrepreneurApi from '@/lib/api-entrepreneur';
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

      // CRITICAL: If company doesn't exist, create it now with Phase 2 legal data
      if (!progress?.phaseData?.__companyId) {
        try {
          console.log('🔧 Creating company with Phase 1 basic data...');
          // Step 1: Create company with Phase 1 basic fields
          const createResponse = await entrepreneurApi.createCompany({
            companyName: formData.companyName || 'Unnamed Company',
            industry: 'Technology', // Placeholder - Phase 1 field
            website: 'https://example.com', // Placeholder - Phase 1 field
            tagline: 'Company created during Phase 2 verification',
          });

          if (!createResponse?.companyId) {
            throw new Error('No company ID returned from creation');
          }

          const companyId = createResponse.companyId;
          console.log('✅ Company created:', companyId);

          // Step 2: Immediately update with Phase 2 legal identity data
          console.log('🔧 Updating company with Phase 2 legal identity data...');
          await entrepreneurApi.updateLegalInfo(companyId, {
            legalName: formData.companyName || 'Unnamed Company',
            registrationNumber: formData.registrationNumber || '',
            legalStructure: formData.legalForm || '',
            incorporationDate: formData.incorporationDate || '',
            registeredAddress: formData.registeredAddress || '',
            country: formData.countryOfRegistration || '',
            nafCode: formData.industryCode || '',
          });
          console.log('✅ Legal info updated');

          // Step 3: Verify company exists in backend by fetching current phase
          console.log('🔧 Verifying company in backend...');
          const phaseProgress = await entrepreneurApi.getCurrentPhase();
          if (phaseProgress?.companyId !== companyId) {
            throw new Error('Company verification failed - company not found in backend');
          }
          console.log('✅ Company verified in backend');

          // Save to local state with companyId
          savePhaseData(2, {
            ...formData,
            __companyId: companyId,
          });
        } catch (createError) {
          const msg = createError instanceof Error ? createError.message : 'Failed to create company';
          console.error('❌ Company creation failed:', msg);
          throw new Error(`Could not create company: ${msg}`);
        }
      } else {
        // Company exists, just save the phase 2 data
        savePhaseData(2, formData);
      }

      // Allow state updates to flush
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Mark step 2-1 complete and advance currentStep -> 2
      moveToNextStep(2, 1);

      // Allow moveToNextStep to flush
      await new Promise((resolve) => setTimeout(resolve, 100));

      await router.push('/dashboard/entrepreneur/phase-2/step-2');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An error occurred';
      setFormState({ status: 'idle', error: message });
    }
  }, [form, progress, savePhaseData, moveToNextStep, router]);

  return {
    form,
    formState,
    autosave,
    handleSaveDraft,
    handleNextClick,
    isDirty: form.formState.isDirty,
  };
}
