/**
 * Backend creatorJourney contract (camelCase, ASP.NET Web JSON defaults).
 * Mirrors backend/Models/DatabaseModels/CreatorJourney.cs. Phase/step status is
 * NOT part of this document — it is derived server-side and returned separately
 * as ComputedJourneyStatus.
 */

export type ComputedPhaseState = {
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  currentStep: number;
};

export type ComputedJourneyStatus = {
  phase1: ComputedPhaseState;
  phase2: ComputedPhaseState;
  phase3: ComputedPhaseState;
  phase4: ComputedPhaseState;
  phase5: ComputedPhaseState;
  phase6: ComputedPhaseState;
};

export type JourneyBranding = {
  logoType: string | null;
  logoAsset: string | null;
  colorPalette: string[];
  paletteName: string;
  typographyPairing: string;
  brandingMethod: string | null;
};

export type JourneyProject = {
  name: string;
  tagline: string;
  concept: string;
  targetUser: string;
  problem: string;
  solution: string;
  marketGap: string;
  creatorEdge: string;
  category: string;
  tags: string[];
  clarityScore: number;
  sector: string;
  branding: JourneyBranding;
  currentVersion: number;
};

export type OutputVersionEntry = {
  version: number;
  phase: number;
  sessionId: string | null;
  data?: Record<string, unknown> | null;
  createdAt: string;
};

export type BackendCreatorJourney = {
  id: string;
  userId: string;
  businessIdeaId: string | null;
  companyId: string | null;
  project: JourneyProject;
  phase2Data: {
    selectedEntryPath: string | null;
    chatMessages: Array<{ id: string; sender: 'ai' | 'user'; text: string; timestamp: string }>;
    clarifierSessionId: string | null;
    discoveryInputs?: { sectors?: string[]; observedProblem?: string; strengths?: string[] };
    generatedConcepts?: Array<{ id: string; title: string; category: string; description: string; score: number; tam: string; saturation: string; similarTo: string; concept: string; targetUser: string; coreProblem: string; solution: string; marketGap: string; founderEdge: string }>;
    selectedConceptId?: string | null;
  };
  phase3Data: Record<string, unknown>;
  phase4Data: Record<string, unknown>;
  phase5Data: {
    chosenPath: 'sell_license' | 'build' | null;
    pathSelectedAt: string | null;
    completedAt: string | null;
    [k: string]: unknown;
  };
  phase6Data: Record<string, unknown>;
  outputSnapshots: Record<string, OutputVersionEntry[]>;
  createdAt: string;
  updatedAt: string;
};

export type JourneyResponse = {
  journey: BackendCreatorJourney;
  computedStatus: ComputedJourneyStatus;
};


/** Maps a frontend outputs[key] name → the backend outputKey enum. */
export type JourneyOutputKey =
  | 'forecastVersions'
  | 'businessPlanVersions'
  | 'ipValuationVersions'
  | 'legalChecklistVersions'
  | 'formationVersions'
  | 'pricingVersions'
  | 'gtmPlanVersions'
  | 'matchingRuns';
