import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, renderHook, act } from '@testing-library/react';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { usePhase2Step1Form } from '@/hooks/usePhase2Step1Form';
import Phase2Step2Page from '@/app/dashboard/entrepreneur/(phases)/phase-2/step-2/page';

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
    activeCompanyId: mockProgressState.activeCompanyId ?? 'comp-101',
    getPhaseData: (phase: number) => {
      if (phase === 2) return mockProgressState.phase2Data ?? { __companyId: 'comp-101' };
      return null;
    },
    savePhaseData: mockSavePhaseData,
    moveToNextStep: mockMoveToNextStep,
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
});
