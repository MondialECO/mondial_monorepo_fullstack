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
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // No resolver / no validation — just a typed data container.
  const form = useForm<LegalIdentityFormData>({
    defaultValues: EMPTY_FORM_DATA,
  });

  // Hydrate the form ONCE from saved progress or database.
  useEffect(() => {
    if (!progress || isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initializeForm = async () => {
      try {
        // 1. Check for local saved data first
        let savedData =
          (initialData as LegalIdentityFormData | undefined) ||
          (getPhaseData(2) as LegalIdentityFormData | undefined);

        // 2. If no local data, try to load from database
        if (!savedData || !savedData.companyName) {
          const phaseData = getPhaseData(2) as any;
          let companyId = phaseData?.__companyId;

          // 3. If no companyId in local state, fetch from backend
          if (!companyId) {
            const phaseProgress = await entrepreneurApi.getCurrentPhase();
            companyId = phaseProgress?.companyId;
          }

          // 4. Fetch company data from database
          if (companyId) {
            const company = await entrepreneurApi.getCompany(companyId);
            if (company) {
              savedData = {
                companyName: company.legalName || company.companyName || '',
                registrationNumber: company.registrationNumber || '',
                legalForm: company.legalStructure || '',
                incorporationDate: company.incorporationDate || '',
                countryOfRegistration: company.country || '',
                registeredAddress: company.registeredAddress || '',
                industryCode: company.nafCode || '',
              };
              // Save companyId to local state for future use
              const existingData = getPhaseData(2) as any;
              if (existingData && !existingData.__companyId) {
                savePhaseData(2, { ...existingData, __companyId: companyId });
              }
            }
          }
        }

        // 5. Reset form with data (local or database)
        if (savedData) {
          form.reset({ ...EMPTY_FORM_DATA, ...savedData });
        }
      } catch (error) {
        console.warn('Failed to load company data:', error);
        // Fall back to empty form
        form.reset(EMPTY_FORM_DATA);
      }
    };

    initializeForm();
  }, [progress, initialData, form, getPhaseData, savePhaseData]);

  // Autosave disabled - only save on explicit button clicks
  // (Save Draft or Next button)

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
          // Step 1: Create company with Phase 1 basic fields
          const createResponse = await entrepreneurApi.createCompany({
            companyName: formData.companyName || 'Unnamed Company',
            industry: 'Technology', // Placeholder - Phase 1 field
            website: 'https://example.com', // Placeholder - Phase 1 field
            tagline: 'Company created during Phase 2 verification',
          });

          // API returns company object — handle both 'id' and 'companyId' field names
          const companyId = (createResponse as any)?.companyId || (createResponse as any)?.id;
          if (!companyId) {
            throw new Error('No company ID returned from creation');
          }

          // Step 2: Immediately update with Phase 2 legal identity data
          await entrepreneurApi.updateLegalInfo(companyId, {
            legalName: formData.companyName || 'Unnamed Company',
            registrationNumber: formData.registrationNumber || '',
            legalStructure: formData.legalForm || '',
            incorporationDate: formData.incorporationDate || '',
            registeredAddress: formData.registeredAddress || '',
            country: formData.countryOfRegistration || '',
            nafCode: formData.industryCode || '',
          });

          // Step 3: Verify company exists in backend by fetching current phase
          const phaseProgress = await entrepreneurApi.getCurrentPhase();
          if (phaseProgress?.companyId !== companyId) {
            throw new Error('Company verification failed - company not found in backend');
          }

          // Save to local state with companyId
          savePhaseData(2, {
            ...formData,
            __companyId: companyId,
          });
        } catch (createError) {
          const msg = createError instanceof Error ? createError.message : 'Failed to create company';
          throw new Error(`Could not create company: ${msg}`);
        }
      } else {
        // Company exists, just save the phase 2 data
        savePhaseData(2, formData);
      }

      // Mark step 2-1 complete and advance currentStep -> 2
      moveToNextStep(2, 1);

      // Allow moveToNextStep to flush through React state batching
      // 500ms ensures the progress state (currentStep, completedSteps) is fully updated
      // before router.push() is called, so step-2's RouteGuard sees the new state
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

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
