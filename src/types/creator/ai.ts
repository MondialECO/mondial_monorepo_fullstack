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

export const isTerminalStatus = (s?: AiSessionStatus | null | string): boolean => {
  if (!s) return false;
  const lower = s.toLowerCase();
  return lower === "completed" || lower === "failed" || lower === "needsreview";
};

export const hasAiOutput = (s?: AiSessionStatus | null): boolean =>
  s === "Completed" || s === "NeedsReview";

// ---------- C-2 Idea Clarifier ----------

export interface RawIdeaInput {
  title: string;
  problemStatement: string;
  targetAudience: string;
  description?: string;
  existingAlternatives?: string;
  whyNow?: string;
  riskiestAssumption?: string;
  founderAdvantage?: string;
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

// ---------- Phase 3.1 Market Study ----------

export interface MarketSizingNode {
  value: number;
  currency: string;
  label: string;
  derivation: string;
  sourceAttribution: string;
  percentageOfTam?: number;
  percentageOfSam?: number;
}

export interface DirectCompetitor {
  name: string;
  segment?: string;
  estimatedMarketShare?: string;
  pricingModel?: string;
  strengths: string[];
  weaknesses: string[];
  exploitableGap: string;
  sourceAttribution?: string;
}

export interface IndirectCompetitor {
  name: string;
  substituteApproach: string;
  threatLevel: "low" | "medium" | "high";
}

export interface CompetitorLandscape {
  summary: string;
  directCompetitors: DirectCompetitor[];
  indirectCompetitors: IndirectCompetitor[];
}

export interface DemandSignal {
  signal: string;
  evidence: string;
  sourceAttribution: string;
  relevanceScore: number;
}

export interface SizingRisk {
  risk: string;
  impactOnSom: "low" | "medium" | "high";
  mitigation: string;
}

export interface MarketGapValidation {
  primaryGap: string;
  validationRationale: string;
  confidenceLevel: "high" | "moderate" | "speculative";
}

export interface MarketStudyOutput {
  schemaVersion?: number;
  marketSizing?: {
    tam?: MarketSizingNode;
    sam?: MarketSizingNode;
    som?: MarketSizingNode;
    methodology?: string;
  };
  competitorLandscape?: CompetitorLandscape;
  demandSignals?: DemandSignal[];
  sizingRisks?: SizingRisk[];
  marketGapValidation?: MarketGapValidation;
}

export interface MarketStudyVersion {
  version: number;
  isEdited?: boolean;
  requestId?: string;
  content?: MarketStudyOutput | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketStudySession {
  sessionId: string;
  status: AiSessionStatus;
  clarifierSessionId: string;
  businessIdeaId?: string | null;
  currentVersion: number;
  schemaVersion: number;
  output?: MarketStudyOutput | null;
  versions?: MarketStudyVersion[];
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartMarketStudyRequest {
  clarifierSessionId: string;
  businessIdeaId?: string;
}

// ---------- Phase 3.2 Business Model ----------

export interface CanvasValueProposition {
  headline: string;
  details: string;
  marketStudyFootnote?: string;
}

export interface CanvasCustomerSegment {
  segment: string;
  marketStudyFootnote?: string;
}

export interface CanvasRevenueStream {
  stream: string;
  marketStudyFootnote?: string;
}

export interface BusinessModelCanvas {
  keyPartners?: string[];
  keyActivities?: string[];
  keyResources?: string[];
  valuePropositions?: CanvasValueProposition[];
  customerRelationships?: string[];
  channels?: string[];
  customerSegments?: CanvasCustomerSegment[];
  costStructure?: string[];
  revenueStreams?: CanvasRevenueStream[];
}

export interface RevenueTier {
  tierName: string;
  pricing: string;
  targetSegment: string;
  features: string[];
  projectedContributionPct?: number;
}

export interface UnitEconomicsMetric {
  amount: number;
  currency: string;
  period?: "monthly" | "annual";
  isModelled?: boolean;
}

export interface UnitEconomics {
  arpu?: UnitEconomicsMetric;
  cac?: UnitEconomicsMetric;
  ltv?: UnitEconomicsMetric;
  ltvToCacRatio?: number;
  paybackPeriodMonths?: number;
  commentary?: string;
}

export interface BusinessModelAssumption {
  category: string;
  assumption: string;
  evidenceLevel: "evidenced" | "modelled" | "untested";
}

export interface BusinessModelOutput {
  schemaVersion?: number;
  canvas?: BusinessModelCanvas;
  revenueTiers?: RevenueTier[];
  unitEconomics?: UnitEconomics;
  assumptions?: BusinessModelAssumption[];
}

export interface BusinessModelVersion {
  version: number;
  isEdited?: boolean;
  requestId?: string;
  content?: BusinessModelOutput | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessModelSession {
  sessionId: string;
  status: AiSessionStatus;
  marketStudySessionId: string;
  clarifierSessionId?: string;
  businessIdeaId?: string | null;
  currentVersion: number;
  schemaVersion: number;
  output?: BusinessModelOutput | null;
  versions?: BusinessModelVersion[];
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartBusinessModelRequest {
  marketStudySessionId: string;
  businessIdeaId?: string;
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
  problemSolution?: {
    problem?: string;
    solution?: string;
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
  legalFramework?: LegalRegulatoryFramework;
  // Per-section provenance, keyed by C-3 field name (e.g. "executiveSummary").
  // Stamped server-side by the shared splice: "generated" (AI rewrite) | "edited" (manual).
  _sectionMeta?: Record<string, { status?: 'generated' | 'edited' | 'reviewed'; lastEditedAt?: string }>;
}

export interface LegalFrameworkSubsection {
  subsectionKey: string;
  title: string;
  summary: string;
  keyObligations: string[];
  applicableAuthorities: string[];
  requirementCount: number;
  addressedCount: number;
  status: string;
}

export interface LegalRoadmapStageSummary {
  stage: string;
  stageTitle: string;
  addressedCount: number;
  totalCount: number;
  completionPercentage: number;
  status: string;
}

export interface LegalPriorityOpenItem {
  requirementId: string;
  title: string;
  stage: string;
  priority: string;
  status: string;
  recommendedAction: string;
  officialAuthority: string;
}

export interface LegalNeedsInformationItem {
  requirementId: string;
  title: string;
  stage: string;
  clarificationGuidance: string;
}

export interface LegalOfficialSource {
  authorityName: string;
  documentTitle: string;
  url: string;
  description: string;
}

export interface LegalEvidenceSummary {
  totalRequirementsWithEvidence: number;
  totalDocumentsLinked: number;
  needsReviewCount: number;
  acceptedForPlanningCount: number;
  summaryText: string;
}

export interface LegalSignalDiff {
  signalKey: string;
  humanLabel: string;
  previousValue: boolean;
  currentValue: boolean;
  changeType: 'added' | 'removed' | 'modified';
  humanDescription: string;
}

export interface LegalStaleMetadata {
  isStale: boolean;
  staleReason: string;
  staleDetectedAt?: string | null;
  lastEvaluatedAt?: string | null;
  currentRulesVersion: string;
  assessmentRulesVersion: string;
  diffs: LegalSignalDiff[];
  humanChangeDescriptions: string[];
}

export interface ReconciliationRequirementItem {
  id: string;
  title: string;
  stage: string;
  priority: string;
  category: string;
}

export interface LegalReconciliationSummary {
  addedRequirements: ReconciliationRequirementItem[];
  removedRequirements: ReconciliationRequirementItem[];
  unchangedRequirementsCount: number;
  totalApplicableCount: number;
  reconciledAt: string;
}

export interface Phase3FreshnessOverview {
  anyStale: boolean;
  forecastNeedsReview: boolean;
  forecastReviewReason: string;
  isTamOverridden: boolean;
  marketStudyTam?: number | null;
  forecastTam?: number | null;
  legalIsStale: boolean;
  legalStaleReason: string;
  legalStaleMetadata?: LegalStaleMetadata | null;
  businessPlanIsStale: boolean;
  businessPlanStaleSections: string[];
  section12IsStale: boolean;
  section12HasUserEdits: boolean;
  readinessUpdateAvailable: boolean;
  readinessChangedSources: string[];
}

export interface LegalRegulatoryFramework {
  summary: string;
  jurisdiction: string;
  rulesVersion?: string;
  assessmentVersion?: number;
  businessProfileSnapshotHash?: string;
  generatedAt?: string;
  assessmentDateUtc?: string;
  isStale?: boolean;
  staleReason?: string;
  changedSignals?: string[];
  staleMetadata?: LegalStaleMetadata | null;
  planningReadinessPercentage: number;
  addressedRequirementsCount: number;
  totalApplicableRequirementsCount: number;
  proposedLegalStructure: string;
  primaryRegulations: string[];
  roadmapHighlights: string[];
  intellectualPropertyStrategy: string;
  complianceGovernanceNote: string;
  disclaimerNotice?: string;
  subsections?: LegalFrameworkSubsection[];
  roadmapSummary?: LegalRoadmapStageSummary[];
  priorityOpenItems?: LegalPriorityOpenItem[];
  needsInformationItems?: LegalNeedsInformationItem[];
  officialSources?: LegalOfficialSource[];
  evidenceSummary?: LegalEvidenceSummary;
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
  businessPlanSessionId?: string;
  businessIdeaId?: string;
  startingBudget?: number;
  launchSubscribers?: number;
  variableCost?: number;
  arpu?: number;
  opex?: number;
  monthlyGrowthPct?: number;
  tam?: number;
  // Monthly churn as a percent (e.g. 3 = 3%/month). Drives the readiness LTV/CAC.
  monthlyChurnPct?: number;
  averageOrderValue?: number;
  takeRatePct?: number;
  taxRatePct?: number;
  businessModelType?: string;
  provenance?: Record<string, string>;
}

export interface BudgetSuggestionDto {
  suggestedBudget: number;
  rationale: string;
  runwayMonths: number;
  provenance: string;
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

export interface ForecastInputs {
  startingBudget?: number | null;
  startingBudgetRationale?: string | null;
  startingBudgetProvenance?: string | null;
  launchSubscribers?: number | null;
  variableCost?: number | null;
  arpu?: number | null;
  opex?: number | null;
  monthlyGrowthPct?: number | null;
  tam?: number | null;
  monthlyChurnPct?: number | null;
  businessModelType?: string | null;
  marketStudyVersion?: number | null;
  businessModelVersion?: number | null;
  provenance?: Record<string, string> | null;
  rationales?: Record<string, string> | null;
  needsFounderInput?: Record<string, boolean> | null;
  activeDrivers?: Record<string, boolean> | null;
  averageOrderValue?: number | null;
  takeRatePct?: number | null;
  taxRatePct?: number | null;
  hasCompletedForecast?: boolean | null;
  updatedAt?: string | null;
}

export interface UpdateFinancialAssumptionsDto {
  businessIdeaId?: string | null;
  startingBudget?: number | null;
  launchSubscribers?: number | null;
  variableCost?: number | null;
  arpu?: number | null;
  opex?: number | null;
  monthlyGrowthPct?: number | null;
  monthlyChurnPct?: number | null;
  averageOrderValue?: number | null;
  takeRatePct?: number | null;
  taxRatePct?: number | null;
  businessModelType?: string | null;
  activeDrivers?: Record<string, boolean> | null;
  provenance?: Record<string, string> | null;
  confirmAll?: boolean;
}

export interface ForecastSessionVersion {
  version: number;
  isEdited?: boolean;
  requestId?: string;
  content?: ForecastOutput | null;
  generatedContent?: ForecastOutput | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ForecastSession {
  sessionId: string;
  status: AiSessionStatus;
  businessPlanSessionId: string;
  businessIdeaId?: string | null;
  currentVersion: number;
  latestValidVersion?: number | null;
  hasValidCompletedForecast?: boolean | null;
  schemaVersion: number;
  output?: ForecastOutput | null;
  versions?: ForecastSessionVersion[];
  error?: string | null;
  inputs?: ForecastInputs | null;
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

// ---------- Credit Balance (single source of truth: GET /ai/credits) ----------

export interface AiCreditBalance {
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  /** Per-capability cost table — keys are capability names (e.g. "Forecast", "BusinessPlan"). */
  costs: Record<string, number>;
}
