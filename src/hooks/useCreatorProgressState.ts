'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  CreatorDocument,
  CreatorJourneyData,
  CreatorJourneyState,
  CreatorOutputKey,
  CreatorProject,
} from '@/types/creator/creator-journey';
import api from '@/lib/axios';

const STORAGE_KEY = 'mondial_creator_progress_draft';
const SAVE_DEBOUNCE_MS = 500;

const INITIAL_STATE: CreatorJourneyData = {
  journeyState: {
    phase1: { status: 'locked', currentStep: 1, completedSteps: [] },
    phase2: {
      status: 'locked',
      currentStep: 1,
      completedSteps: [],
      selectedEntryPath: null,
      discoveryInputs: { sectors: [], observedProblem: '', strengths: [] },
      chatMessages: [],
      generatedConcepts: [],
      selectedConceptId: null,
    },
    phase3: { status: 'locked', currentStep: 1, completedSteps: [] },
    phase4: { status: 'locked', currentStep: 1, completedSteps: [] },
    phase5: { status: 'locked', currentStep: 1, completedSteps: [], selectedPath: null },
    phase6: { status: 'locked', currentStep: 1, completedSteps: [] },
  },
  project: {
    exists: false,
    projectId: null,
    name: '',
    tagline: '',
    concept: '',
    targetUser: '',
    problem: '',
    solution: '',
    marketGap: '',
    creatorEdge: '',
    category: '',
    tags: [],
    clarityScore: 0,
    validationScore: 0,
    marketPotential: '',
    feasibilityScore: 0,
    branding: {
      logoType: null,
      logoAsset: null,
      colorPalette: [],
      paletteName: '',
      typographyPairing: '',
    },
    currentVersion: 1,
  },
  outputs: {
    financialForecastVersions: [],
    businessPlanVersions: [],
    complianceVersions: [],
    skillGapVersions: [],
    pricingVersions: [],
    resourcePlanVersions: [],
    gtmPlanVersions: [],
    valuationVersions: [],
    marketplaceListingVersions: [],
    companyFormationVersions: [],
    fundingAskVersions: [],
    matchingRuns: [],
  },
  assets: [],
  documents: [],
  conversations: [],
  notifications: [],
  activityHistory: [],
};

export function useCreatorProgressState() {
  const [state, setState] = useState<CreatorJourneyData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage or initialize
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let loadedState = INITIAL_STATE;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        loadedState = {
          ...INITIAL_STATE,
          ...parsed,
          journeyState: {
            ...INITIAL_STATE.journeyState,
            ...parsed.journeyState,
            phase2: {
              ...INITIAL_STATE.journeyState.phase2,
              ...parsed.journeyState?.phase2,
            },
            phase3: {
              ...INITIAL_STATE.journeyState.phase3,
              ...parsed.journeyState?.phase3,
            },
          },
          project: {
            ...INITIAL_STATE.project,
            ...parsed.project,
            branding: {
              ...INITIAL_STATE.project.branding,
              ...parsed.project?.branding,
            },
          },
          outputs: {
            ...INITIAL_STATE.outputs,
            ...parsed.outputs,
          },
          documents: Array.isArray(parsed.documents) ? parsed.documents : INITIAL_STATE.documents,
        };
      } catch (e) {
        console.error('Failed to parse creator progress draft', e);
      }
    }

    // Check backend onboarding status to verify Phase 1 completeness
    const checkVerification = async () => {
      try {
        const res = await api.get('/onboarding/status');
        const obStatus = res.data?.data ?? res.data;
        const phase1Complete = obStatus && obStatus.phase >= 1;

        setState(() => {
          const updatedState = { ...loadedState };
          if (phase1Complete) {
            updatedState.journeyState.phase1.status = 'completed';
            if (updatedState.journeyState.phase2.status === 'locked') {
              updatedState.journeyState.phase2.status = 'available';
            }
          } else {
            updatedState.journeyState.phase1.status = 'in_progress';
          }
          return updatedState;
        });
      } catch (err) {
        console.error('Failed to fetch onboarding status', err);
        setState(loadedState);
      } finally {
        setIsLoading(false);
      }
    };

    void checkVerification();
  }, []);

  // Debounced save to localStorage
  useEffect(() => {
    if (isLoading) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isLoading]);

  const updateProject = useCallback((fields: Partial<CreatorProject>) => {
    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        ...fields,
        exists: true,
      },
    }));
  }, []);

  const saveOutputVersion = useCallback((outputKey: CreatorOutputKey, payload: Record<string, unknown>) => {
    setState((prev) => {
      const now = new Date().toISOString();
      const version = {
        id: `${outputKey}-${Date.now()}`,
        phase: 3,
        createdAt: now,
        ...payload,
      };

      return {
        ...prev,
        outputs: {
          ...prev.outputs,
          [outputKey]: [version, ...(prev.outputs[outputKey] ?? [])],
        },
      };
    });
  }, []);

  const upsertDocument = useCallback((document: Omit<CreatorDocument, 'createdAt'> & { createdAt?: string }) => {
    setState((prev) => {
      const nextDocument = {
        ...document,
        createdAt: document.createdAt ?? new Date().toISOString(),
      };
      const documents = prev.documents.filter((item: CreatorDocument) => item.id !== nextDocument.id);

      return {
        ...prev,
        documents: [nextDocument, ...documents],
      };
    });
  }, []);

  const completeStep = useCallback((phaseNum: number, stepNum: number) => {
    setState((prev) => {
      const phaseKey = `phase${phaseNum}` as keyof CreatorJourneyState;
      const phase = prev.journeyState[phaseKey];
      const stepId = `${phaseNum}-${stepNum}`;
      
      const newCompletedSteps = phase.completedSteps.includes(stepId)
        ? phase.completedSteps
        : [...phase.completedSteps, stepId];

      return {
        ...prev,
        journeyState: {
          ...prev.journeyState,
          [phaseKey]: {
            ...phase,
            completedSteps: newCompletedSteps,
            currentStep: stepNum + 1,
            status: 'in_progress',
          },
        },
      };
    });
  }, []);

  const setEntryPath = useCallback((path: 'already_have_idea' | 'needs_discovery' | null) => {
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase2: {
          ...prev.journeyState.phase2,
          selectedEntryPath: path,
          status: 'in_progress',
          currentStep: path === 'already_have_idea' ? 6 : 2,
        },
      },
    }));
  }, []);

  const setCrossroadsPath = useCallback((path: 'buyout' | 'build' | null) => {
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase5: {
          ...prev.journeyState.phase5,
          selectedPath: path,
          status: 'in_progress',
          currentStep: 2,
        },
      },
    }));
  }, []);

  const advancePhase = useCallback((phaseNum: number) => {
    setState((prev) => {
      const currentKey = `phase${phaseNum}` as keyof CreatorJourneyState;
      const nextKey = `phase${phaseNum + 1}` as keyof CreatorJourneyState;

      const updatedJourneyState = {
        ...prev.journeyState,
        [currentKey]: {
          ...prev.journeyState[currentKey],
          status: 'completed',
          completedAt: new Date().toISOString(),
        },
      };

      if (updatedJourneyState[nextKey]) {
        updatedJourneyState[nextKey] = {
          ...prev.journeyState[nextKey],
          status: 'available',
          currentStep: 1,
        };
      }

      return {
        ...prev,
        journeyState: updatedJourneyState,
      };
    });
  }, []);

  const resetJourney = useCallback(() => {
    setState({
      ...INITIAL_STATE,
      journeyState: {
        ...INITIAL_STATE.journeyState,
        phase1: { ...state.journeyState.phase1 }, // Keep verification status
      },
    });
    localStorage.removeItem(STORAGE_KEY);
  }, [state.journeyState.phase1]);

  return {
    state,
    setState,
    updateProject,
    saveOutputVersion,
    upsertDocument,
    completeStep,
    setEntryPath,
    setCrossroadsPath,
    advancePhase,
    resetJourney,
    isLoading,
  };
}
