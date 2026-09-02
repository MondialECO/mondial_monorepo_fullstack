import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, renderHook, act } from '@testing-library/react';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { usePhase2Step1Form } from '@/hooks/usePhase2Step1Form';
import Phase2Step1Client from '@/app/dashboard/entrepreneur/(phases)/phase-2/step-1/client';
import Phase2Step2Page from '@/app/dashboard/entrepreneur/(phases)/phase-2/step-2/page';
import Phase2Step3Page from '@/app/dashboard/entrepreneur/(phases)/phase-2/step-3/page';
import Phase2Step4Page from '@/app/dashboard/entrepreneur/(phases)/phase-2/step-4/page';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard/entrepreneur/phase-2/step-1',
}));

// Mock AuthProvider
vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'usr-1', onboardingPhase: 2 },
    token: 'test-token',
  }),
}));

// Mock useEntrepreneurProgress
let mockProgressState: any = {};
const mockSavePhaseData = vi.fn();
const mockMoveToNextStep = vi.fn();

vi.mock('@/hooks/useEntrepreneurProgress', () => ({
  useEntrepreneurProgress: () => ({
    progress: mockProgressState.progress ?? {
      currentPhase: 2,
      currentStep: 2,
      completedPhases: new Set([1]),
      completedSteps: new Set(['2-1']),
      phaseData: mockProgressState.phaseData ?? { __companyId: 'comp-101' },
    },
    currentPhase: mockProgressState.progress?.currentPhase ?? 2,
    activeCompanyId: mockProgressState.activeCompanyId ?? 'comp-101',
    getPhaseData: (phase: number) => {
      if (phase === 2) return mockProgressState.phase2Data ?? { __companyId: 'comp-101' };
      return null;
    },
    savePhaseData: mockSavePhaseData,
    moveToNextStep: mockMoveToNextStep,
    applyBackendResponse: vi.fn(),
    isLoading: false,
    backendFetchFailed: false,
    switchCompany: vi.fn(),
    isSwitching: false,
  }),
}));

describe('Phase 2 Remediation — Step 1 Existing Company Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 2,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1']),
        phaseData: { __companyId: 'comp-101' },
      },
      activeCompanyId: 'comp-101',
      phase2Data: { __companyId: 'comp-101' },
    };
  });

  it('Phase2_ExistingCompany_NextCallsUpdateLegalInfo', async () => {
    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);
    const createCompanySpy = vi.spyOn(entrepreneurApi, 'createCompany');

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'Acme Corp SAS');
      result.current.form.setValue('registrationNumber', '987654321');
      result.current.form.setValue('legalForm', 'SAS');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '10 Rue de Paris');
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('industryCode', '62.01Z');
    });

    await act(async () => {
      await result.current.handleNextClick();
    });

    expect(createCompanySpy).not.toHaveBeenCalled();
    expect(updateLegalSpy).toHaveBeenCalledTimes(1);
    expect(updateLegalSpy).toHaveBeenCalledWith(
      'comp-101',
      expect.objectContaining({
        legalName: 'Acme Corp SAS',
        registrationNumber: '987654321',
        legalStructure: 'SAS',
        country: 'France',
        registeredAddress: '10 Rue de Paris',
        incorporationDate: '2024-01-01',
        nafCode: '62.01Z',
      })
    );
    expect(mockSavePhaseData).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        companyName: 'Acme Corp SAS',
        __companyId: 'comp-101',
      })
    );
    expect(mockMoveToNextStep).toHaveBeenCalledWith(2, 1);
    expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-2/step-2');
  });

  it('Phase2_ExistingCompany_SaveUsesCorrectCompanyId', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        completedPhases: new Set([1]),
        phaseData: { __companyId: 'comp-creator-505' },
      },
      activeCompanyId: 'comp-creator-505',
      phase2Data: { __companyId: 'comp-creator-505' },
    };

    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'Creator Studio Inc');
      result.current.form.setValue('registrationNumber', '555666777');
      result.current.form.setValue('legalForm', 'SAS');
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '10 Rue de Paris');
    });

    await act(async () => {
      await result.current.handleNextClick();
    });

    expect(updateLegalSpy).toHaveBeenCalledWith(
      'comp-creator-505',
      expect.objectContaining({
        legalName: 'Creator Studio Inc',
        registrationNumber: '555666777',
      })
    );
  });

  it('Phase2_ExistingCompany_SaveUsesCurrentFormValues', async () => {
    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'Updated Legal Entity');
      result.current.form.setValue('registrationNumber', '112233445');
      result.current.form.setValue('legalForm', 'SARL');
      result.current.form.setValue('countryOfRegistration', 'Germany');
      result.current.form.setValue('registeredAddress', 'Musterstrasse 1, Berlin');
    });

    await act(async () => {
      await result.current.handleSaveDraft();
    });

    expect(updateLegalSpy).toHaveBeenCalledWith(
      'comp-101',
      expect.objectContaining({
        legalName: 'Updated Legal Entity',
        registrationNumber: '112233445',
        legalStructure: 'SARL',
        country: 'Germany',
        registeredAddress: 'Musterstrasse 1, Berlin',
      })
    );
  });

  it('Phase2_ExistingCompany_DoesNotNavigateBeforeSaveSuccess', async () => {
    let resolver: any;
    const pendingPromise = new Promise((resolve) => {
      resolver = resolve;
    });

    vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockReturnValue(pendingPromise as any);

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'Slow Save Corp');
      result.current.form.setValue('registrationNumber', '123456789');
      result.current.form.setValue('legalForm', 'SAS');
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '10 Rue de Paris');
    });

    let nextPromise: Promise<void>;
    act(() => {
      nextPromise = result.current.handleNextClick();
    });

    // While save is in flight, router.push has not been called
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockMoveToNextStep).not.toHaveBeenCalled();

    // Now resolve
    await act(async () => {
      resolver({});
      await nextPromise;
    });

    expect(mockMoveToNextStep).toHaveBeenCalledWith(2, 1);
    expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-2/step-2');
  });

  it('Phase2_ExistingCompany_SaveFailureStaysOnStep1', async () => {
    vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockRejectedValue(new Error('Network Database Error'));

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'Error Corp');
      result.current.form.setValue('registrationNumber', '123456789');
      result.current.form.setValue('legalForm', 'SAS');
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '10 Rue de Paris');
    });

    await act(async () => {
      await result.current.handleNextClick();
    });

    expect(result.current.formState.error).toBe('Network Database Error');
    expect(mockMoveToNextStep).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('Phase2_ExistingCompany_DoubleSubmitBlocked', async () => {
    let callCount = 0;
    vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockImplementation(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 100));
      return {} as any;
    });

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'Rapid Submit LLC');
      result.current.form.setValue('registrationNumber', '123456789');
      result.current.form.setValue('legalForm', 'SAS');
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '10 Rue de Paris');
    });

    await act(async () => {
      const p1 = result.current.handleNextClick();
      const p2 = result.current.handleNextClick();
      await Promise.all([p1, p2]);
    });

    expect(callCount).toBe(1);
  });

  it('Phase2_ExistingCompany_RefreshRehydratesSavedValues', async () => {
    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-101',
      legalName: 'Server Persisted Name',
      registrationNumber: '999888777',
      legalStructure: 'SAS',
      incorporationDate: '2023-05-10',
      country: 'France',
      registeredAddress: '15 Boulevard Haussmann',
      nafCode: '70.22Z',
    } as any);

    // Initial state with empty local form data
    mockProgressState = {
      progress: {
        currentPhase: 2,
        completedPhases: new Set([1]),
        phaseData: { __companyId: 'comp-101' },
      },
      phase2Data: { __companyId: 'comp-101' },
    };

    const { result } = renderHook(() => usePhase2Step1Form());

    await waitFor(() => {
      expect(result.current.form.getValues('companyName')).toBe('Server Persisted Name');
      expect(result.current.form.getValues('registrationNumber')).toBe('999888777');
      expect(result.current.form.getValues('legalForm')).toBe('SAS');
      expect(result.current.form.getValues('countryOfRegistration')).toBe('France');
      expect(result.current.form.getValues('registeredAddress')).toBe('15 Boulevard Haussmann');
    });
  });
});

describe('Phase 2 Source Paths (Creator Build, Full Buyout, Co-Founder)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Creator Build existing Company legal save uses canonical updateLegalInfo', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        completedPhases: new Set([1]),
        phaseData: { __companyId: 'comp-creator-from-idea-88' },
      },
      phase2Data: { __companyId: 'comp-creator-from-idea-88' },
    };

    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'AI Idea Brand SAS');
      result.current.form.setValue('registrationNumber', '123123123');
      result.current.form.setValue('legalForm', 'SAS');
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '10 Rue de Paris');
    });

    await act(async () => {
      await result.current.handleNextClick();
    });

    expect(updateLegalSpy).toHaveBeenCalledWith(
      'comp-creator-from-idea-88',
      expect.objectContaining({
        legalName: 'AI Idea Brand SAS',
        registrationNumber: '123123123',
      })
    );
  });

  it('Full Buyout existing Company legal save uses canonical updateLegalInfo', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        completedPhases: new Set([1]),
        phaseData: { __companyId: 'comp-buyout-deal-99' },
      },
      phase2Data: { __companyId: 'comp-buyout-deal-99' },
    };

    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'Acquired Project Holding SA');
      result.current.form.setValue('registrationNumber', '456456456');
      result.current.form.setValue('legalForm', 'SA');
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '10 Rue de Paris');
    });

    await act(async () => {
      await result.current.handleNextClick();
    });

    expect(updateLegalSpy).toHaveBeenCalledWith(
      'comp-buyout-deal-99',
      expect.objectContaining({
        legalName: 'Acquired Project Holding SA',
        registrationNumber: '456456456',
      })
    );
  });

  it('Co-Founder existing Company legal save uses canonical updateLegalInfo', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        completedPhases: new Set([1]),
        phaseData: { __companyId: 'comp-cofounder-deal-77' },
      },
      phase2Data: { __companyId: 'comp-cofounder-deal-77' },
    };

    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', 'Partnership Tech Ltd');
      result.current.form.setValue('registrationNumber', '789789789');
      result.current.form.setValue('legalForm', 'SAS');
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '10 Rue de Paris');
    });

    await act(async () => {
      await result.current.handleNextClick();
    });

    expect(updateLegalSpy).toHaveBeenCalledWith(
      'comp-cofounder-deal-77',
      expect.objectContaining({
        legalName: 'Partnership Tech Ltd',
        registrationNumber: '789789789',
      })
    );
  });
});

describe('Phase 2 Country-Aware Document Labels (Step 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 2,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1']),
        phaseData: { __companyId: 'comp-fr-1' },
      },
      activeCompanyId: 'comp-fr-1',
      phase2Data: { __companyId: 'comp-fr-1' },
    };
  });

  it('Phase2_France_ShowsFrenchAwareDocumentLabels', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 2,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1']),
        phaseData: { __companyId: 'comp-fr-1' },
      },
      activeCompanyId: 'comp-fr-1',
      phase2Data: {
        __companyId: 'comp-fr-1',
        countryOfRegistration: 'France',
      },
    };

    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-fr-1',
      country: 'France',
    } as any);
    vi.spyOn(entrepreneurApi, 'getDocuments').mockResolvedValue([]);

    render(<Phase2Step2Page />);

    await waitFor(() => {
      expect(screen.getByText('KBIS / Company Registry Extract')).toBeInTheDocument();
      expect(screen.getByText('Bank RIB / Bank Account Certificate')).toBeInTheDocument();
      expect(screen.getByText('Tax Certificate / Attestation Fiscale')).toBeInTheDocument();
      expect(screen.getByText('Professional Insurance / RC Pro')).toBeInTheDocument();
      expect(screen.getByText('Upload the French equivalent shown above.')).toBeInTheDocument();
    });
  });

  it('Phase2_NonFrance_ShowsGenericInternationalLabels', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 2,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1']),
        phaseData: { __companyId: 'comp-de-1' },
      },
      activeCompanyId: 'comp-de-1',
      phase2Data: {
        __companyId: 'comp-de-1',
        countryOfRegistration: 'Germany',
      },
    };

    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-de-1',
      country: 'Germany',
    } as any);
    vi.spyOn(entrepreneurApi, 'getDocuments').mockResolvedValue([]);

    render(<Phase2Step2Page />);

    await waitFor(() => {
      expect(screen.getByText('Company Registry Extract / Certificate of Incorporation')).toBeInTheDocument();
      expect(screen.getByText('Business Bank Account Certificate')).toBeInTheDocument();
      expect(screen.getByText('Company Tax Registration / Tax Certificate')).toBeInTheDocument();
      expect(screen.getByText('Professional / Business Liability Insurance')).toBeInTheDocument();
      expect(screen.getByText('Upload the equivalent official document issued in your country.')).toBeInTheDocument();
    });
  });

  it('Phase2_DocumentInternalKeysRemainCanonical', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 2,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1']),
        phaseData: { __companyId: 'comp-uk-1' },
      },
      activeCompanyId: 'comp-uk-1',
      phase2Data: {
        __companyId: 'comp-uk-1',
        countryOfRegistration: 'United Kingdom',
      },
    };

    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-uk-1',
      country: 'United Kingdom',
    } as any);
    vi.spyOn(entrepreneurApi, 'getDocuments').mockResolvedValue([]);
    const uploadSpy = vi.spyOn(entrepreneurApi, 'uploadDocument').mockResolvedValue({
      documentId: 'doc-1',
      type: 'kbis',
      status: 'pending',
    } as any);

    const { container } = render(<Phase2Step2Page />);

    await waitFor(() => {
      expect(screen.getByText('Company Registry Extract / Certificate of Incorporation')).toBeInTheDocument();
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const file = new File(['dummy content'], 'registry_cert.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(
        'comp-uk-1',
        expect.any(FormData)
      );
    });

    const uploadedFormData = uploadSpy.mock.calls[0][1] as FormData;
    expect(uploadedFormData.get('documentType')).toBe('kbis');
  });

  it('Phase2_CountryChangeUpdatesDocumentLabels', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 2,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1']),
        phaseData: { __companyId: 'comp-es-1' },
      },
      activeCompanyId: 'comp-es-1',
      phase2Data: {
        __companyId: 'comp-es-1',
        countryOfRegistration: 'Spain',
      },
    };

    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-es-1',
      country: 'Spain',
    } as any);
    vi.spyOn(entrepreneurApi, 'getDocuments').mockResolvedValue([]);

    const { rerender } = render(<Phase2Step2Page />);

    await waitFor(() => {
      expect(screen.getByText('Company Registry Extract / Certificate of Incorporation')).toBeInTheDocument();
    });

    // Now switch to France
    mockProgressState.phase2Data.countryOfRegistration = 'France';
    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-es-1',
      country: 'France',
    } as any);

    rerender(<Phase2Step2Page />);

    await waitFor(() => {
      expect(screen.getByText('KBIS / Company Registry Extract')).toBeInTheDocument();
    });
  });

  it('Phase2_Step1_EmptyCompanyName_ShowsValidationFeedback', async () => {
    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo');

    const { result } = renderHook(() => usePhase2Step1Form());

    act(() => {
      result.current.form.setValue('companyName', '');
      result.current.form.setValue('registrationNumber', '');
    });

    await act(async () => {
      await result.current.handleNextClick();
    });

    expect(result.current.formState.error).toBe('Official Company Name is required.');
    expect(updateLegalSpy).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('Phase2_Step1_ZeroCompanyUser_StartsEmptyWithoutError', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 1,
        completedPhases: new Set(),
        completedSteps: new Set(),
        phaseData: {},
      },
      activeCompanyId: null,
      phase2Data: {},
    };

    vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockResolvedValue({
      companyId: '',
      currentPhase: 1,
      completedPhases: [],
      overallProgressPercent: 0,
      trustScore: 0,
      isInvestorReady: false,
      createdAt: '',
      lastUpdatedAt: '',
    });
    vi.spyOn(entrepreneurApi, 'getMyCompanies').mockResolvedValue([]);

    const { result } = renderHook(() => usePhase2Step1Form());

    await waitFor(() => {
      expect(result.current.isLoadingData).toBe(false);
    });

    expect(result.current.loadError).toBeNull();
    expect(result.current.form.getValues('companyName')).toBe('');
    expect(result.current.form.getValues('registrationNumber')).toBe('');
  });

  it('Phase2_Step1_GetCompanyFailure_SetsLoadErrorWithoutFakeBlankState', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        completedPhases: new Set([1]),
        phaseData: { __companyId: 'comp-err-500' },
      },
      activeCompanyId: 'comp-err-500',
      phase2Data: { __companyId: 'comp-err-500' },
    };

    vi.spyOn(entrepreneurApi, 'getCompany').mockRejectedValue(new Error('Network connection timeout'));

    const { result } = renderHook(() => usePhase2Step1Form());

    await waitFor(() => {
      expect(result.current.isLoadingData).toBe(false);
    });

    expect(result.current.loadError).toBe('Network connection timeout');
  });

  it('Phase2_Step1_RetryAfterFailure_SuccessfullyHydrates', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        completedPhases: new Set([1]),
        phaseData: { __companyId: 'comp-retry-1' },
      },
      activeCompanyId: 'comp-retry-1',
      phase2Data: { __companyId: 'comp-retry-1' },
    };

    const getCompanySpy = vi.spyOn(entrepreneurApi, 'getCompany')
      .mockRejectedValueOnce(new Error('Temporary 503 error'))
      .mockResolvedValueOnce({
        id: 'comp-retry-1',
        companyName: 'Recovered Enterprise',
        registrationNumber: '777888999',
        country: 'France',
        legalStructure: 'SAS',
      } as any);

    const { result } = renderHook(() => usePhase2Step1Form());

    await waitFor(() => {
      expect(result.current.loadError).toBe('Temporary 503 error');
    });

    await act(async () => {
      await result.current.retryLoad();
    });

    await waitFor(() => {
      expect(result.current.loadError).toBeNull();
      expect(result.current.form.getValues('companyName')).toBe('Recovered Enterprise');
      expect(result.current.form.getValues('registrationNumber')).toBe('777888999');
    });
  });

  it('Phase2_Step3_RendersCanonicalLayout', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 3,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1', '2-2']),
        phaseData: { __companyId: 'comp-step-3' },
      },
      activeCompanyId: 'comp-step-3',
      phase2Data: { __companyId: 'comp-step-3' },
    };

    vi.spyOn(entrepreneurApi, 'getBeneficialOwners').mockResolvedValue([
      {
        fullName: 'Alice Founder',
        email: 'alice@company.com',
        ownershipPercent: 60,
        nationality: 'France',
        role: 'CEO',
      },
    ] as any);

    render(<Phase2Step3Page />);

    await waitFor(() => {
      expect(screen.getByText('Ownership & KYC')).toBeDefined();
      expect(screen.getByText('1 Owner Added')).toBeDefined();
      expect(screen.getByText('Why need this information')).toBeDefined();
      expect(screen.getByText('Compliance Review & Certification')).toBeDefined();
      expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Save Draft/i })).toBeDefined();
    });
  });

  it('Phase2_Step4_RendersCanonicalLayout', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 4,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1', '2-2', '2-3']),
        phaseData: { __companyId: 'comp-step-4' },
      },
      activeCompanyId: 'comp-step-4',
      phase2Data: { __companyId: 'comp-step-4' },
    };

    render(<Phase2Step4Page />);

    await waitFor(() => {
      expect(screen.getByText('Company Verification')).toBeDefined();
      expect(screen.getByText(/Verification Roadmap/i)).toBeDefined();
      expect(screen.getByText('Why need this information')).toBeDefined();
      expect(screen.getByText('Financial Valuation & KPI')).toBeDefined();
      expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Download Certificate/i })).toBeDefined();
    });
  });

  it('Phase2_Step1_MissingRequiredFields_BlocksNextWithErrorMessage', async () => {
    const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo');

    const { result } = renderHook(() => usePhase2Step1Form());

    // 1. Missing companyName
    act(() => {
      result.current.form.setValue('companyName', '');
    });
    await act(async () => {
      await result.current.handleNextClick();
    });
    expect(result.current.formState.error).toBe('Official Company Name is required.');
    expect(updateLegalSpy).not.toHaveBeenCalled();

    // 2. Missing registrationNumber
    act(() => {
      result.current.form.setValue('companyName', 'Acme SAS');
      result.current.form.setValue('registrationNumber', '');
    });
    await act(async () => {
      await result.current.handleNextClick();
    });
    expect(result.current.formState.error).toBe('Company registration number (SIREN/SIRET) is required.');
    expect(updateLegalSpy).not.toHaveBeenCalled();

    // 3. Missing incorporationDate
    act(() => {
      result.current.form.setValue('registrationNumber', '123456789');
      result.current.form.setValue('legalForm', 'SAS');
      result.current.form.setValue('incorporationDate', '');
    });
    await act(async () => {
      await result.current.handleNextClick();
    });
    expect(result.current.formState.error).toBe('Incorporation date is required.');
    expect(updateLegalSpy).not.toHaveBeenCalled();

    // 4. Missing registeredAddress
    act(() => {
      result.current.form.setValue('incorporationDate', '2024-01-01');
      result.current.form.setValue('countryOfRegistration', 'France');
      result.current.form.setValue('registeredAddress', '');
    });
    await act(async () => {
      await result.current.handleNextClick();
    });
    expect(result.current.formState.error).toBe('Registered address is required.');
    expect(updateLegalSpy).not.toHaveBeenCalled();
  });

  it('Phase2_Step4_MissingLegalFieldsOnAuthoritativeBackend_BlocksAdvancePhase', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 4,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1', '2-2', '2-3']),
        phaseData: { __companyId: 'comp-step-4-missing' },
      },
      activeCompanyId: 'comp-step-4-missing',
      phase2Data: { __companyId: 'comp-step-4-missing' },
    };

    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-step-4-missing',
      companyName: 'Acme Inc',
      legalName: 'Acme Inc',
      registrationNumber: '',
      incorporationDate: '',
      registeredAddress: '',
      country: 'France',
      legalStructure: 'SAS',
    } as any);

    const advancePhaseSpy = vi.spyOn(entrepreneurApi, 'advancePhase');

    render(<Phase2Step4Page />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit & Complete Phase 2/i })).toBeDefined();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit & Complete Phase 2/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Cannot advance: Required company legal fields are missing/i)).toBeDefined();
      expect(advancePhaseSpy).not.toHaveBeenCalled();
    });
  });

  it('Phase2_Step4_Backend400_RendersControlledErrorWithoutCrashing', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 4,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1', '2-2', '2-3']),
        phaseData: { __companyId: 'comp-step-4-400' },
      },
      activeCompanyId: 'comp-step-4-400',
      phase2Data: { __companyId: 'comp-step-4-400' },
    };

    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-step-4-400',
      companyName: 'Acme Inc',
      legalName: 'Acme Inc',
      registrationNumber: '123456789',
      incorporationDate: '2024-01-01',
      registeredAddress: '10 Rue de Paris',
      country: 'France',
      legalStructure: 'SAS',
    } as any);

    vi.spyOn(entrepreneurApi, 'advancePhase').mockRejectedValue({
      response: {
        status: 400,
        data: {
          error: 'Cannot advance: Required document \'kbis\' is missing or rejected',
        },
      },
    });

    render(<Phase2Step4Page />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit & Complete Phase 2/i })).toBeDefined();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit & Complete Phase 2/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Cannot advance: Required document 'kbis' is missing or rejected")).toBeDefined();
    });
  });

  it('Phase2_Step4_ValidCompany_CallsAdvancePhaseAndNavigatesPhase3', async () => {
    mockProgressState = {
      progress: {
        currentPhase: 2,
        currentStep: 4,
        completedPhases: new Set([1]),
        completedSteps: new Set(['2-1', '2-2', '2-3']),
        phaseData: { __companyId: 'comp-step-4-valid' },
      },
      activeCompanyId: 'comp-step-4-valid',
      phase2Data: { __companyId: 'comp-step-4-valid' },
    };

    vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
      id: 'comp-step-4-valid',
      companyName: 'Acme Inc',
      legalName: 'Acme Inc',
      registrationNumber: '123456789',
      incorporationDate: '2024-01-01',
      registeredAddress: '10 Rue de Paris',
      country: 'France',
      legalStructure: 'SAS',
    } as any);

    vi.spyOn(entrepreneurApi, 'advancePhase').mockResolvedValue({
      companyId: 'comp-step-4-valid',
      currentPhase: 3,
      completedPhases: [1, 2],
    } as any);

    render(<Phase2Step4Page />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit & Complete Phase 2/i })).toBeDefined();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit & Complete Phase 2/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockMoveToNextStep).toHaveBeenCalledWith(2, 4);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-3');
    });
  });

  describe('Registration Number (SIREN/SIRET) Normalization & Validation', () => {
    it('accepts 9-digit SIREN with spaces and normalizes in payload', async () => {
      const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

      const { result } = renderHook(() => usePhase2Step1Form());

      act(() => {
        result.current.form.setValue('companyName', 'French Tech SAS');
        result.current.form.setValue('registrationNumber', '987 654 321');
        result.current.form.setValue('legalForm', 'SAS');
        result.current.form.setValue('countryOfRegistration', 'France');
        result.current.form.setValue('incorporationDate', '2024-01-01');
        result.current.form.setValue('registeredAddress', '10 Rue de Paris');
      });

      await act(async () => {
        await result.current.handleNextClick();
      });

      expect(result.current.formState.error).toBeNull();
      expect(updateLegalSpy).toHaveBeenCalledWith(
        'comp-fr-1',
        expect.objectContaining({
          registrationNumber: '987654321',
        })
      );
    });

    it('accepts 14-digit SIRET with spaces and normalizes in payload', async () => {
      const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

      const { result } = renderHook(() => usePhase2Step1Form());

      act(() => {
        result.current.form.setValue('companyName', 'French Tech SAS');
        result.current.form.setValue('registrationNumber', '123 456 789 00012');
        result.current.form.setValue('legalForm', 'SAS');
        result.current.form.setValue('countryOfRegistration', 'France');
        result.current.form.setValue('incorporationDate', '2024-01-01');
        result.current.form.setValue('registeredAddress', '10 Rue de Paris');
      });

      await act(async () => {
        await result.current.handleNextClick();
      });

      expect(result.current.formState.error).toBeNull();
      expect(updateLegalSpy).toHaveBeenCalledWith(
        'comp-fr-1',
        expect.objectContaining({
          registrationNumber: '12345678900012',
        })
      );
    });

    it('distinguishes invalid length from missing required error', async () => {
      const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo');

      const { result } = renderHook(() => usePhase2Step1Form());

      // 1. Invalid length (e.g. 5 digits in France)
      act(() => {
        result.current.form.setValue('companyName', 'French Tech SAS');
        result.current.form.setValue('registrationNumber', '12345');
        result.current.form.setValue('legalForm', 'SAS');
        result.current.form.setValue('countryOfRegistration', 'France');
        result.current.form.setValue('incorporationDate', '2024-01-01');
        result.current.form.setValue('registeredAddress', '10 Rue de Paris');
      });

      await act(async () => {
        await result.current.handleNextClick();
      });

      expect(result.current.formState.error).toBe('Enter a 9-digit SIREN or 14-digit SIRET.');
      expect(updateLegalSpy).not.toHaveBeenCalled();

      // 2. Empty registration number
      act(() => {
        result.current.form.setValue('registrationNumber', '   ');
      });

      await act(async () => {
        await result.current.handleNextClick();
      });

      expect(result.current.formState.error).toBe('Company registration number (SIREN/SIRET) is required.');
      expect(updateLegalSpy).not.toHaveBeenCalled();
    });

    it('DOM Integration: types SIREN into input, clicks Next, fires updateLegalInfo and navigates', async () => {
      mockProgressState = {
        progress: {
          currentPhase: 2,
          currentStep: 1,
          completedPhases: new Set([1]),
          completedSteps: new Set([]),
          phaseData: { __companyId: 'comp-dom-test' },
        },
        activeCompanyId: 'comp-dom-test',
        phase2Data: { __companyId: 'comp-dom-test' },
      };

      vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
        id: 'comp-dom-test',
        companyName: '',
        legalName: '',
        registrationNumber: '',
        legalStructure: 'SAS',
        incorporationDate: '',
        country: 'France',
        registeredAddress: '',
      } as any);

      const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

      render(<Phase2Step1Client />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter official company name')).toBeDefined();
      });

      const companyNameInput = screen.getByPlaceholderText('Enter official company name');
      const regInput = screen.getByPlaceholderText('e.g., 987 876 5684');
      const addrInput = screen.getByPlaceholderText('Full registered address including street, postal code, city');
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;

      fireEvent.change(companyNameInput, { target: { value: 'Runtime Company' } });
      fireEvent.change(regInput, { target: { value: '987654321' } });
      fireEvent.change(addrInput, { target: { value: '10 Rue Runtime Test' } });
      if (dateInput) {
        fireEvent.change(dateInput, { target: { value: '2024-01-01' } });
      }

      const nextBtn = screen.getByRole('button', { name: /Next/i });
      await act(async () => {
        fireEvent.click(nextBtn);
      });

      await waitFor(() => {
        expect(updateLegalSpy).toHaveBeenCalledWith(
          'comp-dom-test',
          expect.objectContaining({
            legalName: 'Runtime Company',
            registrationNumber: '987654321',
            legalStructure: 'SAS',
            country: 'France',
            registeredAddress: '10 Rue Runtime Test',
            incorporationDate: '2024-01-01',
          })
        );
        expect(mockMoveToNextStep).toHaveBeenCalledWith(2, 1);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-2/step-2');
      });
    });

    it('Save Draft: persists all live values without advancing step or navigating', async () => {
      mockPush.mockClear();
      mockMoveToNextStep.mockClear();

      mockProgressState = {
        progress: {
          currentPhase: 2,
          currentStep: 1,
          completedPhases: new Set([1]),
          completedSteps: new Set([]),
          phaseData: { __companyId: 'comp-draft-test' },
        },
        activeCompanyId: 'comp-draft-test',
        phase2Data: { __companyId: 'comp-draft-test' },
      };

      vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
        id: 'comp-draft-test',
        companyName: 'Idealy',
        legalName: 'Idealy',
        registrationNumber: '',
        legalStructure: 'SAS',
        incorporationDate: '',
        country: 'France',
        registeredAddress: '',
      } as any);

      const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

      render(<Phase2Step1Client />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter official company name')).toBeDefined();
      });

      const regInput = screen.getByPlaceholderText('e.g., 987 876 5684');
      const addrInput = screen.getByPlaceholderText('Full registered address including street, postal code, city');
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;

      fireEvent.change(regInput, { target: { value: '987654321' } });
      fireEvent.change(addrInput, { target: { value: '10 Rue Runtime Paris' } });
      if (dateInput) {
        fireEvent.change(dateInput, { target: { value: '2024-01-01' } });
      }

      const saveDraftBtn = screen.getByRole('button', { name: /Save Draft/i });
      await act(async () => {
        fireEvent.click(saveDraftBtn);
      });

      await waitFor(() => {
        expect(updateLegalSpy).toHaveBeenCalledWith(
          'comp-draft-test',
          expect.objectContaining({
            legalName: 'Idealy',
            registrationNumber: '987654321',
            legalStructure: 'SAS',
            country: 'France',
            registeredAddress: '10 Rue Runtime Paris',
            incorporationDate: '2024-01-01',
          })
        );
        expect(mockMoveToNextStep).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('Retry Validation: empty submit shows error, typing valid SIREN clears error and Next succeeds', async () => {
      mockPush.mockClear();
      mockMoveToNextStep.mockClear();

      mockProgressState = {
        progress: {
          currentPhase: 2,
          currentStep: 1,
          completedPhases: new Set([1]),
          completedSteps: new Set([]),
          phaseData: { __companyId: 'comp-retry-test' },
        },
        activeCompanyId: 'comp-retry-test',
        phase2Data: { __companyId: 'comp-retry-test' },
      };

      vi.spyOn(entrepreneurApi, 'getCompany').mockResolvedValue({
        id: 'comp-retry-test',
        companyName: 'Localwise',
        legalName: 'Localwise',
        registrationNumber: '',
        legalStructure: 'SAS',
        incorporationDate: '2024-01-01',
        country: 'France',
        registeredAddress: '10 Rue Runtime Paris',
      } as any);

      const updateLegalSpy = vi.spyOn(entrepreneurApi, 'updateLegalInfo').mockResolvedValue({} as any);

      render(<Phase2Step1Client />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter official company name')).toBeDefined();
      });

      const nextBtn = screen.getByRole('button', { name: /Next/i });

      // 1. Submit empty -> error is rendered
      await act(async () => {
        fireEvent.click(nextBtn);
      });

      expect(screen.getByText('Company registration number (SIREN/SIRET) is required.')).toBeDefined();
      expect(updateLegalSpy).not.toHaveBeenCalled();

      // 2. Type valid SIREN -> error clears
      const regInput = screen.getByPlaceholderText('e.g., 987 876 5684');
      fireEvent.change(regInput, { target: { value: '987654321' } });

      await waitFor(() => {
        expect(screen.queryByText('Company registration number (SIREN/SIRET) is required.')).toBeNull();
      });

      // 3. Click Next again -> successfully persists and advances
      await act(async () => {
        fireEvent.click(nextBtn);
      });

      await waitFor(() => {
        expect(updateLegalSpy).toHaveBeenCalledWith(
          'comp-retry-test',
          expect.objectContaining({
            legalName: 'Localwise',
            registrationNumber: '987654321',
            legalStructure: 'SAS',
            country: 'France',
            registeredAddress: '10 Rue Runtime Paris',
            incorporationDate: '2024-01-01',
          })
        );
        expect(mockMoveToNextStep).toHaveBeenCalledWith(2, 1);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-2/step-2');
      });
    });
  });
});
