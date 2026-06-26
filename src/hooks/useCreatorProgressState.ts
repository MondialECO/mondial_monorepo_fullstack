'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  CreatorDocument,
  CreatorJourneyData,
  CreatorJourneyState,
  CreatorOutputKey,
  CreatorProject,
} from '@/types/creator/creator-journey';
import type {
  BackendCreatorJourney,
  ComputedJourneyStatus,
  JourneyOutputKey,
} from '@/types/creator/journey-api';
import { creatorJourneyApi, type UpdateProjectPayload } from '@/lib/api-creator-journey';

const STORAGE_KEY = 'mondial_creator_progress_draft';
const SAVE_DEBOUNCE_MS = 500;

// Deep clone helper — NEVER hand back a reference to the module constant
// (audit R1: shallow-copy + nested mutation used to corrupt INITIAL_STATE).
const fresh = <T,>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const INITIAL_STATE: CreatorJourneyData = {
  journeyState: {
    phase1: { status: 'locked', currentStep: 1, completedSteps: [] },
    phase2: {
      status: 'locked',
      currentStep: 1,
      completedSteps: [],
      selectedEntryPath: null,
      chatMessages: [],
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
    sector: '',
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

// Frontend outputs[key] → backend outputKey + the phase it belongs to (R6).
const OUTPUT_KEY_MAP: Partial<Record<CreatorOutputKey, { key: JourneyOutputKey; phase: number }>> = {
  financialForecastVersions: { key: 'forecastVersions', phase: 3 },
  businessPlanVersions: { key: 'businessPlanVersions', phase: 3 },
  complianceVersions: { key: 'legalChecklistVersions', phase: 3 },
  companyFormationVersions: { key: 'formationVersions', phase: 3 },
  skillGapVersions: { key: 'formationVersions', phase: 3 },
  pricingVersions: { key: 'pricingVersions', phase: 4 },
  gtmPlanVersions: { key: 'gtmPlanVersions', phase: 4 },
  valuationVersions: { key: 'ipValuationVersions', phase: 5 },
  matchingRuns: { key: 'matchingRuns', phase: 6 },
};

function readCache(): CreatorJourneyData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // One-time migration: coerce the retired Path-A alias in any old cached draft.
    const cachedPath = parsed.journeyState?.phase5?.selectedPath;
    const migratedPath = cachedPath === 'buyout' ? 'sell_license' : cachedPath;
    return {
      ...fresh(INITIAL_STATE),
      ...parsed,
      journeyState: {
        ...fresh(INITIAL_STATE.journeyState),
        ...parsed.journeyState,
        phase2: { ...INITIAL_STATE.journeyState.phase2, ...parsed.journeyState?.phase2 },
        phase3: { ...INITIAL_STATE.journeyState.phase3, ...parsed.journeyState?.phase3 },
        phase5: { ...INITIAL_STATE.journeyState.phase5, ...parsed.journeyState?.phase5, selectedPath: migratedPath ?? null },
      },
      project: {
        ...INITIAL_STATE.project,
        ...parsed.project,
        branding: { ...INITIAL_STATE.project.branding, ...parsed.project?.branding },
      },
      outputs: { ...INITIAL_STATE.outputs, ...parsed.outputs },
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    };
  } catch {
    return null;
  }
}

// Overlay the backend-authoritative journey + derived status onto a local state.
// Backend owns: phase statuses (DERIVED), project fields, entry path, chosen path.
// Local cache keeps: outputs, documents, chatMessages, completedSteps.
function reconcile(prev: CreatorJourneyData, backend: BackendCreatorJourney, computed: ComputedJourneyStatus): CreatorJourneyData {
  const next = fresh(prev);
  const js = next.journeyState;

  (['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'phase6'] as const).forEach((k) => {
    js[k].status = computed[k].status;
    js[k].currentStep = computed[k].currentStep;
  });
  const entry = backend.phase2Data?.selectedEntryPath;
  if (entry === 'already_have_idea') js.phase2.selectedEntryPath = entry;
  if (backend.phase5Data?.chosenPath) js.phase5.selectedPath = backend.phase5Data.chosenPath;

  const bp = backend.project;
  if (bp) {
    next.project = {
      ...next.project,
      projectId: backend.businessIdeaId ?? next.project.projectId,
      name: bp.name ?? next.project.name,
      tagline: bp.tagline ?? next.project.tagline,
      concept: bp.concept ?? next.project.concept,
      targetUser: bp.targetUser ?? next.project.targetUser,
      problem: bp.problem ?? next.project.problem,
      solution: bp.solution ?? next.project.solution,
      marketGap: bp.marketGap ?? next.project.marketGap,
      creatorEdge: bp.creatorEdge ?? next.project.creatorEdge,
      category: bp.category ?? next.project.category,
      sector: bp.sector ?? next.project.sector,
      tags: bp.tags ?? next.project.tags,
      clarityScore: bp.clarityScore ?? next.project.clarityScore,
      exists: !!(bp.name && bp.name.length > 0) || next.project.exists,
      branding: {
        ...next.project.branding,
        logoType: (bp.branding?.logoType as 'ai' | 'designer' | null) ?? next.project.branding.logoType,
        logoAsset: bp.branding?.logoAsset ?? next.project.branding.logoAsset,
        colorPalette: bp.branding?.colorPalette ?? next.project.branding.colorPalette,
        paletteName: bp.branding?.paletteName ?? next.project.branding.paletteName,
        typographyPairing: bp.branding?.typographyPairing ?? next.project.branding.typographyPairing,
      },
    };
  }
  return next;
}

export function useCreatorProgressState() {
  const [state, setState] = useState<CreatorJourneyData>(() => fresh(INITIAL_STATE));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const projectPatchRef = useRef<UpdateProjectPayload>({});

  const hydrate = useCallback(async () => {
    // 1) Instant load from cache so the UI isn't blocked on the network.
    const cached = readCache();
    if (cached) setState(cached);

    // 2) Backend is the source of truth — fetch and reconcile.
    try {
      const { journey, computedStatus } = await creatorJourneyApi.get();
      setState((prev) => reconcile(cached ?? prev, journey, computedStatus));
      setError(null);
    } catch (err) {
      // Degrade to the cache (offline / transient). Surface the error for UI.
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced write-through cache (instant resume). Backend already persisted.
  useEffect(() => {
    if (isLoading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* quota / private mode — cache is best-effort */
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state, isLoading]);

  const applyResponse = useCallback(
    (journey: BackendCreatorJourney, computedStatus: ComputedJourneyStatus) => {
      setState((prev) => reconcile(prev, journey, computedStatus));
    },
    [],
  );

  // ---- Mutators (same surface as before; now sync to backend) ----

  const updateProject = useCallback((fields: Partial<CreatorProject>) => {
    // Optimistic local update.
    setState((prev) => ({ ...prev, project: { ...prev.project, ...fields, exists: true } }));

    // Accumulate backend-relevant fields, debounced PATCH.
    const map: UpdateProjectPayload = projectPatchRef.current;
    const allow: (keyof UpdateProjectPayload)[] = [
      'name', 'tagline', 'concept', 'targetUser', 'problem', 'solution',
      'marketGap', 'creatorEdge', 'category', 'sector', 'tags', 'clarityScore',
    ];
    for (const k of allow) {
      if (k in fields && (fields as Record<string, unknown>)[k] !== undefined) {
        (map as Record<string, unknown>)[k] = (fields as Record<string, unknown>)[k];
      }
    }
    if (Object.keys(map).length === 0) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const payload = projectPatchRef.current;
      projectPatchRef.current = {};
      try {
        const { journey, computedStatus } = await creatorJourneyApi.updateProject(payload);
        applyResponse(journey, computedStatus);
      } catch (err) {
        setError(err as Error);
      }
    }, SAVE_DEBOUNCE_MS);
  }, [applyResponse]);

  const saveOutputVersion = useCallback((outputKey: CreatorOutputKey, payload: Record<string, unknown>) => {
    // Optimistic local prepend (consumers read [0] as latest).
    setState((prev) => {
      const now = new Date().toISOString();
      const version = { id: `${outputKey}-${Date.now()}`, createdAt: now, ...payload };
      return {
        ...prev,
        outputs: { ...prev.outputs, [outputKey]: [version, ...(prev.outputs[outputKey] ?? [])] },
      };
    });

    // Sync to backend with the correct phase + backend key (R6/R7).
    const mapped = OUTPUT_KEY_MAP[outputKey];
    if (!mapped) return;
    const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : undefined;
    creatorJourneyApi
      .appendOutput(mapped.key, mapped.phase, payload, sessionId)
      .then(({ journey, computedStatus }) => applyResponse(journey, computedStatus))
      .catch((err) => setError(err as Error));
  }, [applyResponse]);

  const upsertDocument = useCallback((document: Omit<CreatorDocument, 'createdAt'> & { createdAt?: string }) => {
    setState((prev) => {
      const nextDocument = { ...document, createdAt: document.createdAt ?? new Date().toISOString() };
      const documents = prev.documents.filter((item: CreatorDocument) => item.id !== nextDocument.id);
      return { ...prev, documents: [nextDocument, ...documents] };
    });
  }, []);

  // Status is DERIVED server-side now; completeStep only advances the local
  // optimistic cursor and is MONOTONIC (never downgrades a completed phase, R2).
  const completeStep = useCallback((phaseNum: number, stepNum: number) => {
    setState((prev) => {
      const phaseKey = `phase${phaseNum}` as keyof CreatorJourneyState;
      const phase = prev.journeyState[phaseKey];
      const stepId = `${phaseNum}-${stepNum}`;
      const completedSteps = phase.completedSteps.includes(stepId)
        ? phase.completedSteps
        : [...phase.completedSteps, stepId];
      const status = phase.status === 'completed' ? 'completed' : 'in_progress';
      return {
        ...prev,
        journeyState: {
          ...prev.journeyState,
          [phaseKey]: { ...phase, completedSteps, currentStep: Math.max(phase.currentStep, stepNum + 1), status },
        },
      };
    });
  }, []);

  const setEntryPath = useCallback((path: 'already_have_idea' | null) => {
    if (path !== 'already_have_idea') return; // discovery path removed
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase2: { ...prev.journeyState.phase2, selectedEntryPath: path, status: 'in_progress', currentStep: 6 },
      },
    }));
    creatorJourneyApi
      .setEntryPath('already_have_idea')
      .then(({ journey, computedStatus }) => applyResponse(journey, computedStatus))
      .catch((err) => setError(err as Error));
  }, [applyResponse]);

  const setCrossroadsPath = useCallback((path: 'sell_license' | 'build' | null) => {
    if (path !== 'sell_license' && path !== 'build') return;
    setState((prev) => ({
      ...prev,
      journeyState: {
        ...prev.journeyState,
        phase5: { ...prev.journeyState.phase5, selectedPath: path, status: 'in_progress', currentStep: 2 },
      },
    }));
    creatorJourneyApi
      .setCrossroadsPath(path)
      .then(({ journey, computedStatus }) => applyResponse(journey, computedStatus))
      .catch((err) => setError(err as Error));
  }, [applyResponse]);

  // With derived status, "advancing" just means the phase's artifacts are
  // complete. Update local state immediately (don't sync backend yet to avoid race).
  const advancePhase = useCallback((phaseNum: number) => {
    setState((prev) => {
      const currentKey = `phase${phaseNum}` as keyof CreatorJourneyState;
      const nextKey = `phase${phaseNum + 1}` as keyof CreatorJourneyState;
      const js = { ...prev.journeyState };
      js[currentKey] = { ...prev.journeyState[currentKey], status: 'completed', completedAt: new Date().toISOString() };
      if (js[nextKey]) js[nextKey] = { ...prev.journeyState[nextKey], status: 'available', currentStep: 1 };
      return { ...prev, journeyState: js };
    });
  }, []);

  const resetJourney = useCallback(() => {
    setState((prev) => ({
      ...fresh(INITIAL_STATE),
      journeyState: { ...fresh(INITIAL_STATE.journeyState), phase1: { ...prev.journeyState.phase1 } },
    }));
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

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
    refetch: hydrate,
    isLoading,
    error,
  };
}
