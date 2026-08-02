export type CreatorPhaseStatus = 
  | 'locked' 
  | 'available' 
  | 'available_not_started'
  | 'in_progress' 
  | 'completed' 
  | 'skipped_for_now';

// The Phase-2 Discovery card / canvas shape rendered by the idea pages. Mirrors
// the AI-generated ideas mapped onto display fields (see lib/creator/map-generated-ideas).
export interface Phase2Concept {
  id: string;
  title: string;
  category: string;
  description: string;
  score: number;
  tam: string;
  saturation: string;
  similarTo: string;
  concept: string;
  targetUser: string;
  coreProblem: string;
  solution: string;
  marketGap: string;
  founderEdge: string;
}

export interface PhaseState {
  status: CreatorPhaseStatus;
  currentStep: number;
  completedSteps: string[];
  startedAt?: string;
  lastSavedAt?: string;
  completedAt?: string;
  // "already_have_idea" is the only server-side entry-path value: Path-B sets it,
  // while Discovery (also live) deliberately sets no entry path — the backend
  // discriminates a Discovery user by persisted working-state instead (2C-2).
  selectedEntryPath?: 'already_have_idea' | null;
  // Clarifier session ID (backend-authoritative; used by Phase 3 to validate completion).
  clarifierSessionId?: string | null;
  // Conversational clarifier transcript (persisted to CreatorJourneys.phase2Data).
  chatMessages?: Array<{ id: string; sender: 'ai' | 'user'; text: string; timestamp?: string }>;
  // Phase-2 client-cached working state (not backend-authoritative; survives via
  // the localStorage draft). Populated by the Discovery + Naming flows.
  generatedConcepts?: Phase2Concept[];
  selectedConceptId?: string | null;
  nameSuggestions?: string[];
  discoveryInputs?: { sectors?: string[]; observedProblem?: string; strengths?: string[] };
}

export interface CreatorJourneyState {
  phase1: PhaseState;
  phase2: PhaseState;
  phase3: PhaseState;
  phase4: PhaseState;
  // Path A = 'sell_license' (sell OR license), Path B = 'build'. The legacy
  // alias was retired in P1.10; only these two canonical values exist now.
  phase5: PhaseState & { selectedPath?: 'sell_license' | 'build' | null };
  phase6: PhaseState;
}

export interface CreatorProject {
  exists: boolean;
  projectId: string | null;
  name: string;
  tagline: string;
  concept: string;
  targetUser: string;
  problem: string;
  solution: string;
  marketGap: string;
  creatorEdge: string;
  category: string;
  sector: string;
  tags: string[];
  clarityScore: number;
  validationScore: number;
  marketPotential: string;
  feasibilityScore: number;
  branding: {
    logoType: 'ai' | 'designer' | null;
    logoAsset: string | null;
    colorPalette: string[];
    paletteName: string;
    typographyPairing: string;
  };
  currentVersion: number;
}

export interface CreatorJourneyData {
  // Multi-idea (step 5): backend-authoritative, hydrated on every reconcile and
  // NEVER cached (trimForCache persists journeyState progress only, so a stale
  // cached id is structurally impossible). Step 6 threads this into API calls.
  activeIdeaId: string | null;
  leveledUpIdeaId: string | null;
  journeyState: CreatorJourneyState;
  project: CreatorProject;
  outputs: {
    financialForecastVersions: CreatorOutputVersion[];
    businessPlanVersions: CreatorOutputVersion[];
    complianceVersions: CreatorOutputVersion[];
    skillGapVersions: CreatorOutputVersion[];
    pricingVersions: CreatorOutputVersion[];
    resourcePlanVersions: CreatorOutputVersion[];
    gtmPlanVersions: CreatorOutputVersion[];
    valuationVersions: CreatorOutputVersion[];
    marketplaceListingVersions: CreatorOutputVersion[];
    companyFormationVersions: CreatorOutputVersion[];
    fundingAskVersions: CreatorOutputVersion[];
    matchingRuns: CreatorOutputVersion[];
  };
  assets: any[];
  documents: any[];
  conversations: any[];
  notifications: any[];
  activityHistory: any[];
}

/**
 * A locally-cached optimistic output version (closes R8 — no more `any[]`). The
 * AUTHORITATIVE typed output lives on the backend AI session and is re-fetched by
 * `sessionId` (R8's intended design). The metadata fields below are typed; the
 * heterogeneous optimistic payload is exposed as type-safe `unknown` (never `any`),
 * so a consumer must narrow before use.
 */
export interface CreatorOutputVersion {
  id: string;
  createdAt: string;
  // Heterogeneous optimistic payload (sessionId / version / phase / output fields)
  // accessed as type-safe `unknown` — narrow before use. The typed authoritative
  // output is re-fetched by sessionId from the backend AI session.
  [key: string]: unknown;
}

/**
 * The forecast variant of {@link CreatorOutputVersion}. Consumers that read the
 * legacy optimistic forecast shape narrow to this with a typed assertion (a real
 * interface, not `as any`). Fields are optional because the authoritative forecast
 * is re-fetched live by sessionId; this is only the cached display copy.
 */
export interface CreatorForecastVersion extends CreatorOutputVersion {
  data?: Array<Record<string, string | number>>;
  summary?: {
    year3Revenue?: number;
    estimatedBreakeven?: string;
    ebitdaMargin?: string;
  };
}

export type CreatorOutputKey = keyof CreatorJourneyData['outputs'];

export interface CreatorDocument {
  id: string;
  name: string;
  category: string;
  size: string;
  phase: number;
  step: number;
  createdAt: string;
  outputKey?: CreatorOutputKey;
}
