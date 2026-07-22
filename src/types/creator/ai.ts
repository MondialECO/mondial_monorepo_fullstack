/**
 * Creator AI types — mirror the C-2 / C-3 / C-4 backend DTOs.
 * Session status is the source of truth (PascalCase, lives on the session DTO).
 * Output shapes follow the locked schema-v1 contracts.
 */

export type AiSessionStatus =
  | "Pending"
  | "Processing"
  | "Completed"
  | "Failed"
  | "NeedsReview";

/** A status is terminal when polling should stop. */
export const TERMINAL_AI_STATUSES: AiSessionStatus[] = [
  "Completed",
  "Failed",
  "NeedsReview",
];

export const isTerminalStatus = (s?: AiSessionStatus | null): boolean =>
  !!s && TERMINAL_AI_STATUSES.includes(s);

export const hasAiOutput = (s?: AiSessionStatus | null): boolean =>
  s === "Completed" || s === "NeedsReview";

// ---------- C-2 Idea Clarifier ----------

export interface RawIdeaInput {
  title: string;
  problemStatement: string;
  targetAudience: string;
  description?: string;
  existingAlternatives?: string;
  attachments?: string[];
}

export interface StartClarifierRequest {
  businessIdeaId?: string;
  rawIdea: RawIdeaInput;
}

export interface ClarifierOutput {
  schemaVersion?: number;
  problemDefinition?: {
    statement?: string;
    painPoints?: string[];
    severity?: string;
  };
  targetAudience?: {
    primarySegment?: string;
    characteristics?: string[];
    sizeQualitative?: string;
  };
  existingAlternatives?: { name?: string; gap?: string }[];
  proposedSolution?: {
    summary?: string;
    differentiation?: string;
    valueProposition?: string;
  };
  riskAssessment?: {
    category?: string;
    description?: string;
    likelihood?: string;
    mitigation?: string;
  }[];
  assumptions?: string[];
  clarityScore?: number;
  clarityRationale?: string;
  tags?: string[];
}

export interface ClarifierSession {
  sessionId: string;
  status: AiSessionStatus;
  businessIdeaId?: string | null;
  clarityScore?: number | null;
  output?: ClarifierOutput | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- C-3 Business Plan ----------

export interface StartBusinessPlanRequest {
  clarifierSessionId: string;
  businessIdeaId?: string;
}

export interface BusinessPlanOutput {
  schemaVersion?: number;
  executiveSummary?: {
    overview?: string;
    valueProposition?: string;
    highlights?: string[];
  };
  marketAnalysis?: {
    overview?: string;
    targetSegments?: string[];
    marketSizeQualitative?: string;
    trends?: string[];
  };
  competitorAnalysis?: {
    overview?: string;
    competitors?: {
      name?: string;
      positioning?: string;
      strengths?: string[];
      weaknesses?: string[];
      ourAdvantage?: string;
    }[];
  };
  revenueModel?: {
    summary?: string;
    revenueStreams?: { name?: string; description?: string }[];
    pricingStrategy?: string;
    keyMetrics?: string[];
  };
  goToMarket?: {
    strategy?: string;
    channels?: string[];
    phases?: { name?: string; description?: string }[];
  };
  operationsPlan?: {
    overview?: string;
    keyActivities?: string[];
    resources?: string[];
    milestones?: { title?: string; description?: string; timeframe?: string }[];
  };
  risks?: {
    category?: string;
    description?: string;
    likelihood?: string;
    impact?: string;
    mitigation?: string;
  }[];
  // Per-section provenance, keyed by C-3 field name (e.g. "executiveSummary").
  // Stamped server-side by the shared splice: "generated" (AI rewrite) | "edited" (manual).
  _sectionMeta?: Record<string, { status?: 'generated' | 'edited'; lastEditedAt?: string }>;
}

export interface BusinessPlanSession {
  sessionId: string;
  status: AiSessionStatus;
  clarifierSessionId: string;
  businessIdeaId?: string | null;
  currentVersion: number;
  schemaVersion: number;
  output?: BusinessPlanOutput | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- C-4 Financial Forecast ----------

export interface StartForecastRequest {
  // Forecast requires a completed business plan (enforced at ForecastController.Start,
  // 422 business_plan_required / not_found / not_complete). The businessPlanSessionId
  // is required-in-flow and serves as the authoritative context; it is nullable at
  // the storage layer ([BsonIgnoreIfNull]) for backwards compatibility with older sessions.
  businessPlanSessionId?: string;
  businessIdeaId?: string;
  arpu?: number;
  opex?: number;
  monthlyGrowthPct?: number;
  tam?: number;
  // Monthly churn as a percent (e.g. 3 = 3%/month). Drives the readiness LTV/CAC.
  monthlyChurnPct?: number;
}

export interface ForecastRevenueMonth {
  month: number;
  amount: number;
  notes?: string;
}

export interface ForecastCostMonth {
  month: number;
  fixedCosts: number;
  variableCosts: number;
  notes?: string;
}

export interface ForecastCashFlowMonth {
  month: number;
  netCashFlow: number;
  endingBalance: number;
  notes?: string;
}

export interface ForecastOutput {
  schemaVersion?: number;
  // How many leading months were produced by the AI. Months with month > aiMonthCount
  // are deterministically projected (13-36). Absent on legacy 12-month sessions →
  // consumers default it to the array length, so nothing is flagged as projected.
  aiMonthCount?: number;
  revenueForecast?: {
    currency?: string;
    summary?: string;
    monthly?: ForecastRevenueMonth[];
  };
  costForecast?: {
    currency?: string;
    summary?: string;
    monthly?: ForecastCostMonth[];
  };
  cashFlowProjection?: {
    currency?: string;
    summary?: string;
    monthly?: ForecastCashFlowMonth[];
  };
  breakEvenAnalysis?: {
    breakEvenMonth?: number;
    summary?: string;
    isAchievedWithinHorizon?: boolean;
  };
  assumptions?: string[];
  risks?: {
    category?: string;
    description?: string;
    likelihood?: string;
    impact?: string;
    mitigation?: string;
  }[];
  advisoryNotice?: string;
}

export interface ForecastSession {
  sessionId: string;
  status: AiSessionStatus;
  businessPlanSessionId: string;
  businessIdeaId?: string | null;
  currentVersion: number;
  schemaVersion: number;
  output?: ForecastOutput | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartSessionResult {
  sessionId: string;
  jobId: string;
}

// ---------- Phase 2 Idea Generator (Discovery branch) ----------

export interface GeneratedIdea {
  title: string;
  problem: string;
  solution: string;
  marketGap: string;
  score: number;
  // Intelligence-panel fields (optional — older sessions won't have them).
  tam?: string;
  saturation?: string;
  similarTo?: string;
  targetUser?: string;
  founderEdge?: string;
}

export interface IdeaGenerationInput {
  sectors: string[];
  observedProblem: string;
  strengths: string[];
}

export interface IdeaGenerationOutput {
  ideas: GeneratedIdea[];
  schemaVersion: number;
}

export interface IdeaGenerationSession {
  sessionId: string;
  status: AiSessionStatus;
  businessIdeaId?: string | null;
  input: IdeaGenerationInput;
  output?: IdeaGenerationOutput | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartIdeaGenerationRequest {
  sectors: string[];
  observedProblem: string;
  strengths: string[];
}
