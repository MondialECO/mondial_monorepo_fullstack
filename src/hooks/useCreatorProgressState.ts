'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  CreatorDocument,
  CreatorJourneyData,
  CreatorJourneyState,
  CreatorOutputKey,
  CreatorProject,
  PhaseState,
} from '@/types/creator/creator-journey';
import type {
  BackendCreatorJourney,
  ComputedJourneyStatus,
  JourneyOutputKey,
} from '@/types/creator/journey-api';
import { creatorJourneyApi, type UpdateProjectPayload } from '@/lib/api-creator-journey';

const STORAGE_KEY = 'mondial_creator_progress_draft';
const SAVE_DEBOUNCE_MS = 500;

/**
 * Honest hydration result: callers that navigate after a refetch MUST be able to
 * tell whether state actually updated (a swallowed failure once left state on the
 * previous idea while navigation proceeded on a second, successful fetch).
 */
export type HydrateResult = { ok: true; activeIdeaId: string | null } | { ok: false };

// Deep clone helper — NEVER hand back a reference to the module constant
// (audit R1: shallow-copy + nested mutation used to corrupt INITIAL_STATE).
const fresh = <T,>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const INITIAL_STATE: CreatorJourneyData = {
  activeIdeaId: null,
  leveledUpIdeaId: null,
  journeyState: {
    phase1: { status: 'locked', currentStep: 1, completedSteps: [] },
    phase2: {
      status: 'locked',
      currentStep: 1,
      completedSteps: [],
      selectedEntryPath: null,
      clarifierSessionId: null,
      chatMessages: [],
      discoveryInputs: undefined,
      generatedConcepts: undefined,
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

// The cache stores ONLY progress-tracking per phase (status/currentStep/completedSteps
// + optional progress timestamps). All content — project, chat, discovery, phase5 path,
// outputs, documents, conversations — is backend-sourced on every load and never cached.
// Read back via readCache(), which re-inflates missing content fields from INITIAL_STATE.
function pickPhaseProgress(p: PhaseState): PhaseState {
  return {
    status: p.status,
    currentStep: p.currentStep,
    completedSteps: p.completedSteps,
    ...(p.startedAt !== undefined ? { startedAt: p.startedAt } : {}),
    ...(p.lastSavedAt !== undefined ? { lastSavedAt: p.lastSavedAt } : {}),
    ...(p.completedAt !== undefined ? { completedAt: p.completedAt } : {}),
  };
}

function trimForCache(state: CreatorJourneyData): { journeyState: CreatorJourneyState } {
  const js = state.journeyState;
  return {
    journeyState: {
      phase1: pickPhaseProgress(js.phase1),
      phase2: pickPhaseProgress(js.phase2),
      phase3: pickPhaseProgress(js.phase3),
      phase4: pickPhaseProgress(js.phase4),
      phase5: pickPhaseProgress(js.phase5),
      phase6: pickPhaseProgress(js.phase6),
    },
  };
}

// Overlay the backend-authoritative journey + derived status onto a local state.
// Backend owns: phase statuses (DERIVED), project fields, entry path, chosen path.
// Local cache keeps: progress-tracking only (status/currentStep/completedSteps).
function reconcile(prev: CreatorJourneyData, backend: BackendCreatorJourney, computed: ComputedJourneyStatus): CreatorJourneyData {
  const next = fresh(prev);
  const js = next.journeyState;

  // Multi-idea ids: backend-authoritative, unconditional overwrite (never cached,
  // so the backend's value — including null — always wins over anything local).
  next.activeIdeaId = backend.activeIdeaId ?? null;
  next.leveledUpIdeaId = backend.leveledUpIdeaId ?? null;

  (['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'phase6'] as const).forEach((k) => {
    js[k].status = computed[k].status;
    js[k].currentStep = computed[k].currentStep;
  });
  const entry = backend.phase2Data?.selectedEntryPath;
  if (entry === 'already_have_idea') js.phase2.selectedEntryPath = entry;
  if (backend.phase5Data?.chosenPath) js.phase5.selectedPath = backend.phase5Data.chosenPath;

  // Phase 2 hydration: restore persisted fields from backend.
  // chatMessages is append-only: only hydrate if backend has equal-or-more messages
  // (prevents data loss if reconcile races with in-flight edits).
  const backendChatMessages = backend.phase2Data?.chatMessages ?? [];
  const localChatMessages = js.phase2.chatMessages ?? [];
  if (backendChatMessages.length >= localChatMessages.length) {
    js.phase2.chatMessages = backendChatMessages;
  }
  // Other phase2 fields: backend-authoritative snapshots, backend wins if present.
  if (backend.phase2Data?.clarifierSessionId) {
    js.phase2.clarifierSessionId = backend.phase2Data.clarifierSessionId;
  }
  if (backend.phase2Data?.discoveryInputs) {
    js.phase2.discoveryInputs = backend.phase2Data.discoveryInputs;
  }
  if (backend.phase2Data?.generatedConcepts) {
    js.phase2.generatedConcepts = backend.phase2Data.generatedConcepts;
  }
  if (backend.phase2Data?.selectedConceptId !== undefined) {
    js.phase2.selectedConceptId = backend.phase2Data.selectedConceptId;
  }

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
  // First paint: seed progress (phase status/currentStep/completedSteps) from the
  // trimmed cache so navigation paints fast. readCache() re-inflates all content
  // fields from INITIAL_STATE, so content is empty until hydrate() fetches the
  // backend and reconcile() overrides everything. Cache is never authoritative.
  const [state, setState] = useState<CreatorJourneyData>(() => readCache() ?? fresh(INITIAL_STATE));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const projectPatchRef = useRef<UpdateProjectPayload>({});
  // Multi-idea correctness: the current idea (for capture-at-queue-time), the
  // pending patch's TARGET idea, and a DEDICATED debounce timer for the project
  // PATCH (previously shared with the cache write-through, which could cancel a
  // pending save). A queued write always fires against the idea it was typed on.
  const activeIdeaIdRef = useRef<string | null>(null);
  const projectPatchTargetRef = useRef<string | null>(null);
  const projectSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => { activeIdeaIdRef.current = state.activeIdeaId; }, [state.activeIdeaId]);

  const hydrate = useCallback(async (): Promise<HydrateResult> => {
    // Backend is the authoritative source of truth. Fetch + reconcile from a clean
    // base, then render THAT — the cache is never read/rendered as truth here.
    // (The debounced write-through effect below persists state to cache for the
    // next-load speedup once loading completes.)
    try {
      const { journey, computedStatus } = await creatorJourneyApi.get();
      setState(reconcile(INITIAL_STATE, journey, computedStatus));
      setError(null);
      return { ok: true, activeIdeaId: journey.activeIdeaId ?? null };
    } catch (err) {
      // Backend error: surface an honest error state AND report failure to the
      // awaiter — never resolve identically whether hydration worked or not.
      setError(err as Error);
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced write-through cache — progress-tracking ONLY (see trimForCache).
  // Content is backend-authoritative and is never written here.
  useEffect(() => {
    if (isLoading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimForCache(state)));
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
      setState((prev) => {
        // CROSS-IDEA GUARD: a response composed for a different idea (a stale
        // in-flight mutator from before a switch, or a flushed debounced write to
        // the previous idea) must never MERGE into this idea's state — reconcile's
        // same-idea race guards would let old values survive the new idea's nulls.
        // The data is already persisted server-side; the next hydrate shows it.
        // Idea switches themselves go through refetch() = clean full replace.
        if (prev.activeIdeaId && journey.activeIdeaId && journey.activeIdeaId !== prev.activeIdeaId) {
          return prev;
        }
        return reconcile(prev, journey, computedStatus);
      });
    },
    [],
  );

  // ---- Mutators (same surface as before; now sync to backend) ----

  // Send the accumulated patch to ITS captured target idea (never the current one).
  const flushProjectPatch = useCallback(async () => {
    const payload = projectPatchRef.current;
    // Target = the idea captured at queue time; a patch queued BEFORE the first
    // hydration (null capture) re-resolves at flush time. Both null → no param
    // (backend active fallback — correct for a not-yet-hydrated single state).
    const target = projectPatchTargetRef.current ?? activeIdeaIdRef.current;
    projectPatchRef.current = {};
    projectPatchTargetRef.current = null;
    if (Object.keys(payload).length === 0) return;
    try {
      const { journey, computedStatus } = await creatorJourneyApi.updateProject(payload, target ?? undefined);
      // If this flushed to a PREVIOUS idea, the cross-idea guard in applyResponse
      // drops the stale response — the write still persisted to the right idea.
      applyResponse(journey, computedStatus);
    } catch (err) {
      setError(err as Error);
    }
  }, [applyResponse]);

  const updateProject = useCallback((fields: Partial<CreatorProject>) => {
    // Optimistic local update.
    setState((prev) => ({ ...prev, project: { ...prev.project, ...fields, exists: true } }));

    const currentIdeaId = activeIdeaIdRef.current;
    // The pending patch belongs to a DIFFERENT idea (user switched mid-debounce):
    // flush it to its original target NOW so the two ideas' edits never merge.
    if (projectPatchTargetRef.current && projectPatchTargetRef.current !== currentIdeaId
        && Object.keys(projectPatchRef.current).length > 0) {
      if (projectSaveTimerRef.current) clearTimeout(projectSaveTimerRef.current);
      void flushProjectPatch();
    }

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

    // Capture the target at QUEUE time — a later idea switch can't redirect it.
    projectPatchTargetRef.current = currentIdeaId;
    if (projectSaveTimerRef.current) clearTimeout(projectSaveTimerRef.current);
    projectSaveTimerRef.current = setTimeout(() => { void flushProjectPatch(); }, SAVE_DEBOUNCE_MS);
  }, [flushProjectPatch]);

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
    if (path !== 'already_have_idea') return; // Discovery deliberately sets no server entry path (2C-2); only Path-B does
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
