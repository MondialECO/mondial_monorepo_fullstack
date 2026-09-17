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
  // Phase 3 AI session IDs (backend-authoritative).
  marketStudySessionId?: string | null;
  businessModelSessionId?: string | null;
  businessPlanSessionId?: string | null;
  forecastSessionId?: string | null;
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
  // New paths are Full Buyout ('sell') and Build. 'sell_license' is read-only
  // compatibility for historical records and is never selected by new UI.
  phase5: PhaseState & { selectedPath?: 'sell' | 'build' | 'sell_license' | null };
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
  existingAlternatives: string;
  whyNow: string;
  riskiestAssumption: string;
  sourceMethod: 'clarifier' | 'discovery' | '';
  targetMarket: string;
  geography: string;
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
 * optimistic forecast cache can access these typed hints directly without casting.
 */
export interface CreatorForecastOutputVersion extends CreatorOutputVersion {
  sessionId?: string;
  version?: number;
  phase?: number;
  revenueYear1?: number;
  revenueYear2?: number;
  revenueYear3?: number;
  breakevenMonth?: number;
  chartData?: Array<{ month: string; revenue: number; costs: number }>;
}

export type CreatorForecastVersion = CreatorForecastOutputVersion;
export type CreatorOutputKey = keyof CreatorJourneyData['outputs'];

