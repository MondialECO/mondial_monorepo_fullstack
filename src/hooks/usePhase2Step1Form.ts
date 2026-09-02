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


function buildLegalPayload(formData: LegalIdentityFormData) {
  const rawCompanyName = (formData.companyName || '').trim();
  const rawReg = (formData.registrationNumber || '').trim();
  const normalizedReg = rawReg ? rawReg.replace(/[\s.-]/g, '') : '';

  return {
    legalName: rawCompanyName || 'Unnamed Company',
    registrationNumber: normalizedReg,
    legalStructure: (formData.legalForm || '').trim(),
    incorporationDate: (formData.incorporationDate || '').trim(),
    registeredAddress: (formData.registeredAddress || '').trim(),
    country: (formData.countryOfRegistration || '').trim(),
    nafCode: (formData.industryCode || '').trim(),
  };
}

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
  const {
    progress,
    activeCompanyId,
    isLoading: isProgressLoading,
    getPhaseData,
    savePhaseData,
    moveToNextStep,
  } = useEntrepreneurProgress();

  const [formState, setFormState] = useState<FormState>({
    status: 'idle',
    error: null,
  });
  const [autosave, setAutosave] = useState<AutosaveState>({
    status: 'idle',
    lastSavedAt: null,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isSubmittingRef = useRef(false);
  const savedFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedCompanyIdRef = useRef<string | null>(null);
  const hasHydratedRef = useRef(false);

  const getPhaseDataRef = useRef(getPhaseData);
  getPhaseDataRef.current = getPhaseData;
  const savePhaseDataRef = useRef(savePhaseData);
  savePhaseDataRef.current = savePhaseData;
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // No resolver / no validation — just a typed data container.
  const form = useForm<LegalIdentityFormData>({
    defaultValues: initialData ? { ...EMPTY_FORM_DATA, ...initialData } : EMPTY_FORM_DATA,
  });

  const loadData = useCallback(async () => {
    // If progress is still loading from backend, wait
    if (isProgressLoading) return;
    if (hasHydratedRef.current) return;

    try {
      setIsLoadingData(true);
      setLoadError(null);

      // If initialData was explicitly provided (e.g. in tests/storybook), use it
      if (initialData && Object.keys(initialData).length > 0) {
        form.reset({ ...EMPTY_FORM_DATA, ...initialData });
        hasHydratedRef.current = true;
        setIsLoadingData(false);
        return;
      }

      // Step 1: Resolve company ID
      let companyId: string | undefined = activeCompanyId || undefined;

      if (!companyId) {
        const localPhase2: any = getPhaseDataRef.current(2);
        if (typeof localPhase2?.__companyId === 'string') {
          companyId = localPhase2.__companyId;
        }
      }

      if (!companyId && typeof progressRef.current?.phaseData?.__companyId === 'string') {
        companyId = progressRef.current.phaseData.__companyId;
      }

      if (!companyId) {
        // Query backend for active/current company
        const phaseProgress = await entrepreneurApi.getCurrentPhase().catch(() => null);
        if (typeof phaseProgress?.companyId === 'string') {
          companyId = phaseProgress.companyId;
        }
      }

      if (!companyId) {
        const myCompanies = await entrepreneurApi.getMyCompanies().catch(() => []);
        const active = myCompanies.find((c) => c.isActive) || myCompanies[0];
        if (active?.id) {
          companyId = active.id;
        }
      }

      // Step 2: If company exists, fetch authoritative data from GET /api/companies/{companyId}
      if (companyId) {
        loadedCompanyIdRef.current = companyId;
        const company = await entrepreneurApi.getCompany(companyId);
        if (company) {
          const hydratedData: LegalIdentityFormData = {
            companyName: company.companyName || company.legalName || '',
            registrationNumber: company.registrationNumber || '',
            legalForm: company.legalStructure || '',
            incorporationDate: company.incorporationDate || '',
            countryOfRegistration: company.country || '',
            registeredAddress: company.registeredAddress || '',
            industryCode: company.nafCode || '',
          };

          form.reset(hydratedData);
          savePhaseDataRef.current(2, {
            ...hydratedData,
            __companyId: companyId,
          });
        }
      } else {
        // Step 3: Zero-company fresh state: check if there is unsaved local draft
        const localDraft: any = getPhaseDataRef.current(2);
        if (localDraft?.companyName) {
          form.reset({ ...EMPTY_FORM_DATA, ...localDraft });
        } else {
          form.reset(EMPTY_FORM_DATA);
        }
      }

      hasHydratedRef.current = true;
    } catch (error) {
      console.warn('Failed to load company data:', error);
      let errorMsg = 'Failed to load company details. Please check your connection and retry.';
      if (error instanceof Error) errorMsg = error.message;
      setLoadError(errorMsg);
    } finally {
      setIsLoadingData(false);
    }
  }, [isProgressLoading, activeCompanyId, initialData, form]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const retryLoad = useCallback(() => {
    hasHydratedRef.current = false;
    return loadData();
  }, [loadData]);

  const handleSaveDraft = useCallback(async () => {
    if (isSubmittingRef.current || formState.status === 'saving' || formState.status === 'navigating') return;
    isSubmittingRef.current = true;
    setFormState({ status: 'saving', error: null });
    try {
      const formData = form.getValues();
      const payload = buildLegalPayload(formData);

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

      if (!companyId) {
        const createResponse = await entrepreneurApi.createCompany({
          companyName: payload.legalName || 'Unnamed Company',
          industry: 'Technology',
          website: 'https://example.com',
          tagline: 'Company draft created during Phase 2 verification',
        });

        companyId = (createResponse as any)?.companyId || (createResponse as any)?.id;
        if (!companyId || typeof companyId !== 'string') {
          throw new Error('No company ID returned from creation');
        }
      }

      await entrepreneurApi.updateLegalInfo(companyId, payload);

      savePhaseData(2, {
        ...formData,
        registrationNumber: payload.registrationNumber,
        __companyId: companyId,
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

    const formData = form.getValues();
    const payload = buildLegalPayload(formData);
    const rawCompanyName = payload.legalName;
    const normalizedRegNumber = payload.registrationNumber;

    if (!formData.companyName?.trim()) {
      setFormState({
        status: 'idle',
        error: 'Official Company Name is required.',
      });
      return;
    }

    if (!normalizedRegNumber) {
      setFormState({
        status: 'idle',
        error: 'Company registration number (SIREN/SIRET) is required.',
      });
      return;
    }

    const isFrance = (formData.countryOfRegistration || '').trim().toLowerCase() === 'france';
    if (isFrance && /^\d+$/.test(normalizedRegNumber)) {
      if (normalizedRegNumber.length !== 9 && normalizedRegNumber.length !== 14) {
        setFormState({
          status: 'idle',
          error: 'Enter a 9-digit SIREN or 14-digit SIRET.',
        });
        return;
      }
    }

    if (!formData.legalForm?.trim()) {
      setFormState({
        status: 'idle',
        error: 'Legal form is required.',
      });
      return;
    }
    if (!formData.incorporationDate?.trim()) {
      setFormState({
        status: 'idle',
        error: 'Incorporation date is required.',
      });
      return;
    }
    if (!formData.countryOfRegistration?.trim()) {
      setFormState({
        status: 'idle',
        error: 'Country of registration is required.',
      });
      return;
    }
    if (!formData.registeredAddress?.trim()) {
      setFormState({
        status: 'idle',
        error: 'Registered address is required.',
      });
      return;
    }

    isSubmittingRef.current = true;
    setFormState({ status: 'navigating', error: null });

    try {
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
          companyName: rawCompanyName,
          industry: 'Technology', // Placeholder - Phase 1 field
          website: 'https://example.com', // Placeholder - Phase 1 field
          tagline: 'Company created during Phase 2 verification',
        });

        companyId = (createResponse as any)?.companyId || (createResponse as any)?.id;
        if (!companyId || typeof companyId !== 'string') {
          throw new Error('No company ID returned from creation');
        }
      }

      // 2. Persist legal identity data via authoritative updateLegalInfo endpoint
      await entrepreneurApi.updateLegalInfo(companyId, payload);

      // 3. Update local phase data with authoritative companyId
      savePhaseData(2, {
        ...formData,
        registrationNumber: normalizedRegNumber,
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

  const clearError = useCallback(() => {
    setFormState((prev) => (prev.error ? { ...prev, error: null } : prev));
  }, []);

  return {
    form,
    formState,
    autosave,
    isLoadingData,
    loadError,
    retryLoad,
    handleSaveDraft,
    handleNextClick,
    clearError,
    isDirty: form.formState.isDirty,
  };
}
