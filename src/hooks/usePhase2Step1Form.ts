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
  const isSubmittingRef = useRef(false);
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

  const handleSaveDraft = useCallback(async () => {
    if (isSubmittingRef.current || formState.status === 'saving' || formState.status === 'navigating') return;
    isSubmittingRef.current = true;
    setFormState({ status: 'saving', error: null });
    try {
      const formData = form.getValues();
      let companyId: string | undefined =
        typeof progress?.phaseData?.__companyId === 'string'
          ? progress.phaseData.__companyId
          : undefined;

      if (!companyId) {
        const existingData: any = getPhaseData(2) ?? {};
        if (typeof existingData?.__companyId === 'string') {
          companyId = existingData.__companyId;
        }
      }
      if (!companyId) {
        const phaseProgress = await entrepreneurApi.getCurrentPhase().catch(() => null);
        if (typeof phaseProgress?.companyId === 'string') {
          companyId = phaseProgress.companyId;
        }
      }

      if (companyId) {
        await entrepreneurApi.updateLegalInfo(companyId, {
          legalName: formData.companyName || 'Unnamed Company',
          registrationNumber: formData.registrationNumber || '',
          legalStructure: formData.legalForm || '',
          incorporationDate: formData.incorporationDate || '',
          registeredAddress: formData.registeredAddress || '',
          country: formData.countryOfRegistration || '',
          nafCode: formData.industryCode || '',
        });
      }

      savePhaseData(2, {
        ...formData,
        ...(companyId ? { __companyId: companyId } : {}),
      });
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
    } finally {
      isSubmittingRef.current = false;
    }
  }, [form, formState.status, progress, getPhaseData, savePhaseData]);

  const handleNextClick = useCallback(async () => {
    if (isSubmittingRef.current || formState.status === 'saving' || formState.status === 'navigating') return;
    isSubmittingRef.current = true;
    setFormState({ status: 'navigating', error: null });

    try {
      const formData = form.getValues();

      let companyId: string | undefined =
        typeof progress?.phaseData?.__companyId === 'string'
          ? progress.phaseData.__companyId
          : undefined;

      if (!companyId) {
        const existingData: any = getPhaseData(2) ?? {};
        if (typeof existingData?.__companyId === 'string') {
          companyId = existingData.__companyId;
        }
      }
      if (!companyId) {
        const phaseProgress = await entrepreneurApi.getCurrentPhase().catch(() => null);
        if (typeof phaseProgress?.companyId === 'string') {
          companyId = phaseProgress.companyId;
        }
      }

      // 1. If company doesn't exist, create it first (Zero-Company Direct Entrepreneur path)
      if (!companyId) {
        const createResponse = await entrepreneurApi.createCompany({
          companyName: formData.companyName || 'Unnamed Company',
          industry: 'Technology', // Placeholder - Phase 1 field
          website: 'https://example.com', // Placeholder - Phase 1 field
          tagline: 'Company created during Phase 2 verification',
        });

        companyId = (createResponse as any)?.companyId || (createResponse as any)?.id;
        if (!companyId || typeof companyId !== 'string') {
          throw new Error('No company ID returned from creation');
        }

        // Verify company is active in backend
        const phaseProgress = await entrepreneurApi.getCurrentPhase();
        if (phaseProgress?.companyId !== companyId) {
          throw new Error('Company verification failed - company not found in backend');
        }
      }

      // 2. Persist legal identity data via authoritative updateLegalInfo endpoint
      await entrepreneurApi.updateLegalInfo(companyId, {
        legalName: formData.companyName || 'Unnamed Company',
        registrationNumber: formData.registrationNumber || '',
        legalStructure: formData.legalForm || '',
        incorporationDate: formData.incorporationDate || '',
        registeredAddress: formData.registeredAddress || '',
        country: formData.countryOfRegistration || '',
        nafCode: formData.industryCode || '',
      });

      // 3. Update local phase data with authoritative companyId
      savePhaseData(2, {
        ...formData,
        __companyId: companyId,
      });

      // 4. Mark step 2-1 complete and advance currentStep -> 2
      moveToNextStep(2, 1);

      // Allow moveToNextStep to flush through React state batching
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      await router.push('/dashboard/entrepreneur/phase-2/step-2');
    } catch (error) {
      let message = 'An error occurred';
      if (error instanceof Error) {
        message = error.message;
      }
      const anyErr = error as any;
      if (anyErr?.response?.data?.error) {
        message = anyErr.response.data.error;
      } else if (anyErr?.response?.data?.message) {
        message = anyErr.response.data.message;
      }
      setFormState({ status: 'idle', error: message });
    } finally {
      isSubmittingRef.current = false;
    }
  }, [form, formState.status, progress, getPhaseData, savePhaseData, moveToNextStep, router]);

  return {
    form,
    formState,
    autosave,
    handleSaveDraft,
    handleNextClick,
    isDirty: form.formState.isDirty,
  };
}
