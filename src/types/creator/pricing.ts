// ============================================================================
// MONDIAL BUSINESS CREATION (MBC) — Phase 4.6 Pricing Strategy Types
// Single Source of Truth for Creator Phase 4.6 Commercial Launch Layer
// ============================================================================

export type RevenueModelType =
  | 'Subscription'
  | 'OneTime'
  | 'UsageBased'
  | 'MarketplaceCommission'
  | 'TieredService'
  | 'Retainer'
  | 'Licensing'
  | 'Freemium'
  | 'Hybrid';

export type MarginTargetType =
  | 'Percentage'
  | 'AbsoluteAmount';

export type ForecastAlignmentBasis =
  | 'MonthlyRevenuePerCustomer'
  | 'AnnualRevenuePerCustomer'
  | 'AverageOrderValue'
  | 'RevenuePerTransaction'
  | 'TakeRate'
  | 'RevenuePerProject'
  | 'NeedsReview';

export type PriceValidationStatus =
  | 'Valid'
  | 'BelowFloor'
  | 'ForecastMismatch'
  | 'NeedsReview';

export type PricingRiskSeverity =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low';

export type PricingExperimentType =
  | 'A_B_Test'
  | 'PilotDiscount'
  | 'FeatureGating'
  | 'UsageTiering'
  | 'PricePointTesting';

export type MarketPriceEvidenceType =
  | 'CompetitorObserved'
  | 'CustomerInterview'
  | 'CustomerSurvey'
  | 'HistoricalSale'
  | 'PaidPilot'
  | 'PreOrder'
  | 'QuoteAccepted'
  | 'MarketStudyEstimate'
  | 'ModelEstimate'
  | 'Unknown';

export type MarketPriceValidationLevel =
  | 'EmpiricallyValidated'
  | 'Supported'
  | 'Indicative'
  | 'Unvalidated'
  | 'Unknown';

export type TaxMode =
  | 'TaxExclusive'
  | 'TaxInclusive'
  | 'Exempt'
  | 'NotApplicableOrUnknown';

export interface PricePresentation {
  currency: string;
  taxMode: TaxMode;
  taxRateReference?: number | null;
  displayPrice: string;
}

export type CostBasisState =
  | 'UnknownOrIncomplete'
  | 'ExplicitZero'
  | 'ValidPositive'
  | 'InvalidNegative';

export interface UnitEconomics {
  variableCostPerUnit: number;
  deliveryCostPerUnit: number;
  marginTargetType: MarginTargetType;
  targetMarginRate?: number | null;
  targetMarginAmount?: number | null;
  minimumPriceFloor: number;
  contributionMarginAmount: number;
  contributionMarginRate: number;
  breakevenUnitsPerMonth?: number | null;
  economicsValidation: string;
  isCostBasisConfigured?: boolean;
  costBasisState?: CostBasisState;
  validationStatus?: string;
}

export interface ForecastAlignment {
  alignmentBasis: ForecastAlignmentBasis;
  forecastBenchmarkValue: number;
  normalizedOfferValue: number;
  varianceAmount: number;
  variancePercentage: number;
  isAligned: boolean;
  notes: string;
}

export interface PricingRisk {
  id: string;
  riskType: string;
  description: string;
  severity: PricingRiskSeverity;
  mitigationSuggestion: string;
}

export interface PricingExperiment {
  id: string;
  hypothesis: string;
  experimentType: PricingExperimentType;
  testDurationDays: number;
  successMetric: string;
  targetSegment: string;
  suggestedAction: string;
}

export type PricingEvidenceRecordType =
  | 'Feedback'
  | 'PreOrder'
  | 'Sale'
  | 'Commitment';

export interface PricingEvidenceRecord {
  id: string;
  type: PricingEvidenceRecordType;
  amount?: number | null;
  currency: string;
  participantOrCustomer: string;
  channel: string;
  notes: string;
  isPaid: boolean;
  isFounderReported: boolean;
  recordedAt: string;
}

export interface PricingOffer {
  key: string;
  name: string;
  tier: string;
  targetSegment: string;
  revenueModel: RevenueModelType;
  billingPeriod?: string | null;
  presentation: PricePresentation;
  unitEconomics: UnitEconomics;
  forecastAlignment: ForecastAlignment;
  recommendedPrice: number;
  founderPrice?: number | null;
  marketReferencePrice?: number | null;
  validatedMarketPrice?: number | null;
  marketPriceEvidenceType?: MarketPriceEvidenceType;
  marketPriceValidationLevel?: MarketPriceValidationLevel;
  effectivePrice: number;
  featuresIncluded: string[];
  launchDiscountPercentage?: number | null;
  isRecommendedDefault: boolean;
  status: PriceValidationStatus;
  founderNotes?: string | null;
  recordedEvidence?: PricingEvidenceRecord[];
}

export interface PricingSourceVersions {
  projectVersion?: string | null;
  projectUpdatedAt?: string | null;
  marketStudyId?: string | null;
  marketStudyUpdatedAt?: string | null;
  businessModelId?: string | null;
  businessModelUpdatedAt?: string | null;
  forecastId?: string | null;
  forecastUpdatedAt?: string | null;
  needsAnalysisUpdatedAt?: string | null;
  supportPlanUpdatedAt?: string | null;
  supportPlanConsumed?: boolean;
  consumedSources: string[];
}

export interface LaunchPricingRecommendation {
  summary: string;
  primaryRationale: string;
  keyActionItems: string[];
  recommendedModel: RevenueModelType;
  recommendedOffers: string[];
}

export interface PricingStrategy {
  status: string;
  generatedAt: string;
  updatedAt: string;
  summary?: string;
  primaryRevenueModel: RevenueModelType;
  revenueModels: RevenueModelType[];
  offers: PricingOffer[];
  risks: PricingRisk[];
  experiments: PricingExperiment[];
  recommendation: LaunchPricingRecommendation;
  sourceVersions: PricingSourceVersions;
  founderEdited: boolean;
  overallHealthStatus: string;
}

export interface PricingStrategyResponse {
  pricingStrategy?: PricingStrategy | null;
  strategy?: PricingStrategy | null;
  updateAvailable: boolean;
  changedSources: string[];
  prerequisiteGate?: any;
  ideaVersion?: number;
}

export type BillingPeriod =
  | 'Monthly'
  | 'Annual'
  | 'Retainer'
  | 'Milestone'
  | 'OneOff'
  | 'PerUse';

export interface UpdatePricingOfferRequest {
  ideaId?: string;
  expectedVersion?: number;
  founderPrice?: number | null;
  billingFrequency?: BillingPeriod | string | null;
  featuresIncluded?: string[] | null;
  launchDiscountPercentage?: number | null;
  founderNotes?: string | null;
  newEvidenceRecord?: PricingEvidenceRecord;
  recordedEvidence?: PricingEvidenceRecord[];
}

