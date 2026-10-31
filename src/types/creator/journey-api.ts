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
  existingAlternatives: string;
  whyNow: string;
  riskiestAssumption: string;
  sourceMethod: 'clarifier' | 'discovery' | '';
  targetMarket: string;
  geography: string;
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

export type ClarifierAnswerStatus = 'pending' | 'accepted' | 'accepted_weak';

/** One record per clarifier topic (1–6). No record = empty; pending = unclear; accepted_weak = weak; accepted = clear. */
export type ClarifierAnswer = {
  questionIndex: number;
  status: ClarifierAnswerStatus;
  attempts: number;
  rawAnswer: string;
  aiExtracted: Record<string, string>;
  userEdited: Record<string, string> | null;
  language: string | null;
  /** The topic's single AI follow-up has been asked. */
  followUpUsed?: boolean;
  updatedAt: string;
};

export type ClarifierChatMessage = {
  id: string;
  /** "system" = a transcript note such as a Skip, never a Creator answer. */
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp?: string;
  /** Turn kind; "feedback" only on older fixed-question transcripts; "skip" on a Skip note; absent on legacy messages. */
  kind?: 'question' | 'followup' | 'nudge' | 'feedback' | 'ack' | 'skip' | null;
  /** Topic (1–6) the message asks about or answers. */
  questionIndex?: number | null;
  /** Tappable answer options offered with an AI follow-up. */
  chips?: string[] | null;
};

export type BackendCreatorJourney = {
  id: string;
  userId: string;
  businessIdeaId: string | null;
  companyId: string | null;
  /** The user's active CreatorIdea id (multi-idea step 5). Backend-authoritative. */
  activeIdeaId: string | null;
  /** The idea taken through Level Up, if any. Backend-authoritative. */
  leveledUpIdeaId: string | null;
  /** Optimistic-concurrency version of the idea represented by this response. */
  ideaVersion: number;
  project: JourneyProject;
  phase2Data: {
    selectedEntryPath: string | null;
    chatMessages: ClarifierChatMessage[];
    clarifierAnswers?: ClarifierAnswer[];
    clarifierSessionId: string | null;
    clarifierSummarizedAt?: string | null;
    discoveryInputs?: { sectors?: string[]; observedProblem?: string; strengths?: string[] };
    generatedConcepts?: Array<{ id: string; title: string; category: string; description: string; score: number; tam: string; saturation: string; similarTo: string; concept: string; targetUser: string; coreProblem: string; solution: string; marketGap: string; founderEdge: string }>;
    selectedConceptId?: string | null;
  };
  phase3Data: Record<string, unknown>;
  phase4Data: Record<string, unknown>;
  phase5Data: {
    chosenPath: 'sell' | 'build' | 'sell_license' | null;
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
