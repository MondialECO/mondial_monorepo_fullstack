// Canonical Phase 4.5 Aids, Grants & Support Engine Types

export type SupportType =
  | 'Grant'
  | 'Subsidy'
  | 'SocialContributionExemption'
  | 'TaxRelief'
  | 'TaxCredit'
  | 'Allowance'
  | 'Loan'
  | 'HonorLoan'
  | 'Guarantee'
  | 'Advance'
  | 'EquitySupport'
  | 'EmploymentSupport'
  | 'InnovationSupport'
  | 'TrainingFunding'
  | 'ExportSupport'
  | 'RegionalSupport'
  | 'EuropeanFunding'
  | 'CompetitionOrPrize'
  | 'Incubation'
  | 'Mentoring'
  | 'AdvisorySupport'
  | 'Other';

export type EligibilityStatus =
  | 'Eligible'
  | 'EligibleToApply'
  | 'PotentiallyEligible'
  | 'NeedsInformation'
  | 'NotYetEligible'
  | 'NotEligible'
  | 'Awarded'
  | 'Expired'
  | 'NeedsReview';

export type SelectionMode =
  | 'Entitlement'
  | 'Discretionary'
  | 'Competitive'
  | 'CreditAssessment'
  | 'NeedsReview';

export type RuleNormalizationStatus =
  | 'VerifiedStructured'
  | 'HumanValidated'
  | 'Ambiguous'
  | 'Rejected';

export type MatchConfidence = 'High' | 'Medium' | 'Low' | 'NeedsReview';

export type ApplicationReadiness =
  | 'ReadyToApply'
  | 'AlmostReady'
  | 'MissingInformation'
  | 'PrerequisiteRequired'
  | 'NotYetEligible'
  | 'NotApplicable';

export type FounderApplicationState =
  | 'NotStarted'
  | 'Reviewing'
  | 'Preparing'
  | 'ReadyToApply'
  | 'Applied'
  | 'Awarded'
  | 'Rejected'
  | 'Withdrawn'
  | 'Skipped';

export interface ApplicationTiming {
  earliestApplyAt?: string;
  latestApplyAt?: string;
  mustApplyBeforeExpense: boolean;
  mustApplyBeforeCreation: boolean;
  mustApplyAfterCreation: boolean;
  rolling: boolean;
  timingNotes?: string;
}

export interface SupportMatch {
  key: string;
  opportunityId: string;
  name: string;
  description: string;
  supportType: SupportType;
  selectionMode: SelectionMode;

  programmeOwner: string;
  managingAuthority: string;
  applicationAuthority: string;
  catalogueSource: string;
  sourceAuthority: string;
  officialReference: string;
  officialUrl: string;

  eligibilityStatus: EligibilityStatus;
  matchConfidence: MatchConfidence;
  whyMatched: string[];
  conditionsMet: string[];
  conditionsMissing: string[];
  conditionsFailed: string[];
  reasonCodes: string[];

  relatedNeedKeys: string[];
  relatedRoadmapTaskKeys: string[];

  estimatedSupportValue?: number;
  supportValueDescription: string;
  supportValueType: string;

  timing: ApplicationTiming;
  applicationReadiness: ApplicationReadiness;
  recommendedNextStep: string;
  sourceReferences: string[];
  evaluatedAt: string;
  ruleVersion: string;

  founderApplicationState: FounderApplicationState;
  founderNotes?: string;
  founderEdited: boolean;

  sourceLastCheckedAt?: string;
  opportunityLastVerifiedAt: string;
}

export interface MissingEligibilityFact {
  key: string;
  question: string;
  whyNeeded: string;
  relatedOpportunityIds: string[];
  dataType: 'boolean' | 'select' | 'text' | 'number';
  allowedValues?: string[];
  currentValue?: string;
  required: boolean;
}

export interface ApplicationChecklistItem {
  key: string;
  label: string;
  required: boolean;
  status: 'Ready' | 'Missing' | 'InProgress' | 'NotRequired';
  existingArtifactReference?: string;
  missingInformationKey?: string;
  notes?: string;
}

export interface SupportApplicationChecklist {
  opportunityId: string;
  opportunityKey: string;
  opportunityName: string;
  items: ApplicationChecklistItem[];
  readyCount: number;
  missingCount: number;
  readinessStatus: ApplicationReadiness;
}

export interface SupportSourceVersions {
  snapshotGeneratedAt?: string;
  roadmapGeneratedAt?: string;
  needsGeneratedAt?: string;
  skillsGeneratedAt?: string;
  profileUpdatedAt?: string;
  forecastUpdatedAt?: string;
  catalogueRuleVersion: string;
}

export interface SupportSourceFreshness {
  lastCheckedAt: string;
  isFresh: boolean;
  unverifiedSources: string[];
}

export interface SupportPlanSummary {
  eligibleCount: number;
  potentialCount: number;
  needsInfoCount: number;
  readyToPrepareCount: number;
  actionCount: number;
  topMatchCount: number;
  totalEvaluatedCount: number;
}

export interface PrerequisiteGateDto {
  canAccess: boolean;
  phase3Completed: boolean;
  humainXReady: boolean;
  constructionSnapshotExists: boolean;
  operationalRoadmapExists: boolean;
  needsAnalysisExists: boolean;
  needsAnalysisCurrent: boolean;
  skillsPlanExists: boolean;
  skillsPlanCurrent: boolean;
  blockingReasons: string[];
}

export interface FounderProfileSummaryDto {
  currentSituation: string;
  weeklyAvailability: string;
  preferredApproach: string;
  strongestRelevantCapabilities: string[];
}

export interface SupportPlan {
  status: string;
  generatedAt: string;
  updatedAt: string;
  summary: SupportPlanSummary;
  matches: SupportMatch[];
  topMatches: SupportMatch[];
  missingEligibilityFacts: MissingEligibilityFact[];
  applicationChecklists: SupportApplicationChecklist[];
  sourceVersions: SupportSourceVersions;
  sourceFreshness: SupportSourceFreshness;
  founderEdited: boolean;
  recordedEligibilityFacts: Record<string, string>;
}

export interface SupportPlanResponse {
  supportPlan: SupportPlan | null;
  updateAvailable: boolean;
  changedSources: string[];
  summary: SupportPlanSummary;
  founderProfileSummary?: FounderProfileSummaryDto;
  prerequisiteGate?: PrerequisiteGateDto;
  error?: string;
}

export interface UpdateFounderSupportStateRequest {
  ideaId?: string;
  applicationState: FounderApplicationState;
  founderNotes?: string;
}

export interface AnswerEligibilityFactRequest {
  ideaId?: string;
  factKey: string;
  value: string;
}
