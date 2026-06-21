export type CreatorPhaseStatus = 
  | 'locked' 
  | 'available' 
  | 'available_not_started'
  | 'in_progress' 
  | 'completed' 
  | 'skipped_for_now';

export interface PhaseState {
  status: CreatorPhaseStatus;
  currentStep: number;
  completedSteps: string[];
  startedAt?: string;
  lastSavedAt?: string;
  completedAt?: string;
  selectedEntryPath?: 'already_have_idea' | 'needs_discovery' | null;
  // Temporary fields for Phase 2 onboarding
  discoveryInputs?: {
    sectors: string[];
    observedProblem: string;
    strengths: string[];
  };
  chatMessages?: Array<{ id: string; sender: 'ai' | 'user'; text: string }>;
  generatedConcepts?: any[];
  selectedConceptId?: string | null;
}

export interface CreatorJourneyState {
  phase1: PhaseState;
  phase2: PhaseState;
  phase3: PhaseState;
  phase4: PhaseState;
  phase5: PhaseState & { selectedPath?: 'buyout' | 'build' | null };
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
  journeyState: CreatorJourneyState;
  project: CreatorProject;
  outputs: {
    financialForecastVersions: any[];
    businessPlanVersions: any[];
    complianceVersions: any[];
    skillGapVersions: any[];
    pricingVersions: any[];
    resourcePlanVersions: any[];
    gtmPlanVersions: any[];
    valuationVersions: any[];
    marketplaceListingVersions: any[];
    companyFormationVersions: any[];
    fundingAskVersions: any[];
    matchingRuns: any[];
  };
  assets: any[];
  documents: any[];
  conversations: any[];
  notifications: any[];
  activityHistory: any[];
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
