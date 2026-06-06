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
  businessPlanSessionId: string;
  businessIdeaId?: string;
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
