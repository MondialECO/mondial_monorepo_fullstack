/**
 * Creator Phase 4.7 — GTM & Launch Strategy Engine TypeScript Definitions
 * Strictly aligns with backend GtmPlanModels.cs and Refinements 1-7.
 */

export type GtmChannelType =
  | 'FounderLedSales'
  | 'OrganicSocial'
  | 'ColdOutreach'
  | 'InboundContent'
  | 'Partnerships'
  | 'Communities'
  | 'PaidSearch'
  | 'PaidSocial'
  | 'MarketplacePresence'
  | 'EventNetworking'
  | 'ReferralProgram'
  | 'DirectMail';

export type ChannelPriority = 'Primary' | 'Secondary' | 'Later' | 'NotRecommended';

export type EffortLevel = 'Low' | 'Medium' | 'High';

export type GtmBudgetSourceType =
  | 'FounderDeclared'
  | 'ForecastAssumption'
  | 'ExistingCompanyBudget'
  | 'AwardedSupport'
  | 'ConfirmedFinancing'
  | 'Unknown';

export type SpendableStatus = 'ConfirmedAvailable' | 'Planned' | 'Potential' | 'Unknown';

export type GtmBudgetStatus = 'Supported' | 'NeedsValidation' | 'Confirmed';

export type ExperimentThresholdStatus = 'EvidenceBased' | 'FounderDefined' | 'NeedsBaseline' | 'NotApplicable';

export type ExperimentRunOutcome = 'Pending' | 'Validated' | 'Invalidated' | 'Inconclusive';

export type GtmRecommendationReason =
  | 'SEGMENT_REACHABLE'
  | 'FOUNDER_CAPABILITY_MATCH'
  | 'DELEGATION_AVAILABLE'
  | 'BUDGET_COMPATIBLE'
  | 'BUDGET_NOT_CONFIRMED'
  | 'SALES_MOTION_MATCH'
  | 'PRICE_MODEL_MATCH'
  | 'LONG_SALES_CYCLE'
  | 'LOW_FOUNDER_CAPACITY'
  | 'OFFER_NOT_VALIDATED'
  | 'PRICE_NOT_VALIDATED'
  | 'SEARCH_INTENT_SUPPORTED'
  | 'PARTNERSHIP_FIT'
  | 'INSUFFICIENT_EVIDENCE';

export interface GtmPrerequisiteGateResult {
  canAccess: boolean;
  blockingReasons: string[];
}

export interface GtmSegmentStrategy {
  segmentName: string;
  isPrimary: boolean;
  rationale: string;
  problem: string;
  primaryMessage: string;
  offerKey: string;
  offerName: string;
  selectedPrice: number;
  revenueModel: string;
  buyingComplexity: string;
  estimatedSalesCycle: string;
  relevanceScore: number;
}

export interface GtmChannelStrategy {
  key: string;
  channel: GtmChannelType;
  channelName: string;
  category: string;
  priority: ChannelPriority;
  recommendedPriority: ChannelPriority;
  effortLevel: EffortLevel;
  estimatedWeeklyHours: number;
  capacityScore: number;
  setupCostEstimate: number;
  monthlySpendEstimate: number;
  reasonCodes: GtmRecommendationReason[];
  rationale: string;
  whyNow: string;
  evidenceGrounded: string;
  firstStep: string;
  founderEdited: boolean;
  founderNotes?: string | null;
}

export interface GtmCapacityReconciliation {
  weeklyHoursAvailable: number;
  weeklyHoursAllocated: number;
  remainingWeeklyHours: number;
  capacityBand: string;
  isOverloaded: boolean;
  overloadMitigationNotice?: string | null;
  channelEffortPoints: Record<string, number>;
}

export interface GtmDelegatedCapability {
  capabilityKey: string;
  title: string;
  sourceSkillOrNeed: string;
  partnerOrServiceType: string;
  impactOnGtm: string;
  isResolved: boolean;
}

export interface GtmLaunchPhase {
  phaseNumber: number;
  phaseName: string;
  objective: string;
  timeframe: string;
  keyMilestones: string[];
  exitCriteria: string[];
  contingencyTrigger: string;
  fallbackAction: string;
}

export interface GtmLaunchPlan {
  primaryLaunchMonth: string;
  estimatedPreparationWeeks: number;
  phases: GtmLaunchPhase[];
}

export interface GtmMetricObserved {
  metricKey: string;
  metricName: string;
  value: number;
  unit: string;
}

export interface ExperimentRun {
  runId: string;
  startedAt: string;
  completedAt?: string | null;
  actualSpend: number;
  actualEffort: string;
  observations: string;
  metricsObserved: GtmMetricObserved[];
  outcome: ExperimentRunOutcome;
  recordedAt: string;
}

export interface GtmExperiment {
  key: string;
  hypothesis: string;
  segment: string;
  channel: GtmChannelType;
  offer: string;
  messageAngle: string;
  budgetCap: number;
  timebox: string;
  primaryMetric: string;
  targetValue?: number | null;
  targetStatus: ExperimentThresholdStatus;
  successCondition: string;
  stopCondition: string;
  evidenceRequired: string;
  status: string;
  runs: ExperimentRun[];
}

export interface GtmMetricDefinition {
  key: string;
  name: string;
  funnelStage: string;
  definition: string;
  numerator: string;
  denominator: string;
  dataSource: string;
  baseline: string;
  target: string;
  targetStatus: ExperimentThresholdStatus;
  measurementFrequency: string;
}

export interface GtmBudgetPlan {
  currency: string;
  totalAvailableBudget?: number | null;
  forecastCacAssumption?: number | null;
  observedCac?: number | null;
  validatedCac?: number | null;
  budgetSource: GtmBudgetSourceType;
  spendableStatus: SpendableStatus;
  validationStatus: GtmBudgetStatus;
  provenanceExplanation: string;
}

export interface GtmConsumedSources {
  marketStudyVersion: number;
  businessModelVersion: number;
  forecastVersion: number;
  consumedForecastMarketingBudget?: number | null;
  consumedForecastArpu?: number | null;
  consumedForecastCac?: number | null;
  roadmapVersion: number;
  roadmapUpdatedAt?: string | null;
  pricingStrategyUpdatedAt?: string | null;
  pricingOffersFingerprint?: string | null;
  consumedWeeklyAvailability: string;
  supportPlanConsumed: boolean;
  supportPlanUpdatedAt?: string | null;
}

export interface GtmStrategy {
  generatedAt: string;
  updatedAt: string;
  status: string;
  overallMotion: string;
  primarySegment: GtmSegmentStrategy;
  secondarySegments: GtmSegmentStrategy[];
  channelStrategy: GtmChannelStrategy[];
  founderExecutionPlan: GtmCapacityReconciliation;
  delegationPlan: GtmDelegatedCapability[];
  funnelStrategy: string[];
  launchPlan: GtmLaunchPlan;
  experiments: GtmExperiment[];
  metricsFramework: GtmMetricDefinition[];
  budgetPlan: GtmBudgetPlan;
  risks: string[];
  assumptions: string[];
  sourceVersions: GtmConsumedSources;
  founderOverrides: Record<string, string>;
  pricingValidationRequired: boolean;
  pricingValidationNotice?: string | null;
  capacityWarningActive: boolean;
}

export interface GtmStrategyResponse {
  strategy?: GtmStrategy | null;
  updateAvailable: boolean;
  changedSources: string[];
  prerequisiteGate: GtmPrerequisiteGateResult;
}

export interface UpdateGtmChannelRequest {
  ideaId?: string | null;
  priority: ChannelPriority;
  founderNotes?: string | null;
}

export interface RecordExperimentRunRequest {
  ideaId?: string | null;
  actualSpend: number;
  actualEffort: string;
  observations: string;
  metricsObserved?: GtmMetricObserved[];
  outcome: ExperimentRunOutcome;
  statusUpdate?: string | null;
}

export interface UpdateGtmStrategyRequest {
  ideaId?: string | null;
  expectedVersion?: number | null;
  customOutreachMessage?: string | null;
  customCustomerGroup?: string | null;
  weeklyHoursAvailable?: number | null;
  spendableBudget?: number | null;
  targetContacted?: number | null;
  targetReplies?: number | null;
  targetDemos?: number | null;
  targetPurchases?: number | null;
  status?: string | null;
}
