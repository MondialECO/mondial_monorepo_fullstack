// Canonical Phase 4.4 Skills & Training / Learn · Delegate · Verify Engine Types

export type ResolutionMode = 'LEARN' | 'DELEGATE' | 'VERIFY' | 'COVERED' | 'NEEDS_REVIEW';

export type ResolutionConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type LearningFeasibility = 'FEASIBLE' | 'TIGHT' | 'UNFEASIBLE';

export type SuggestedResourceType =
  | 'SPECIALIST_FREELANCER'
  | 'AGENCY'
  | 'CERTIFIED_PROFESSIONAL'
  | 'COACH_CONSULTANT'
  | 'FRACTIONAL_EXECUTIVE';

export type VerificationType =
  | 'LEGAL_COMPLIANCE'
  | 'REGULATORY_APPROVAL'
  | 'IDENTITY_VERIFICATION'
  | 'QUALIFICATION_VERIFICATION'
  | 'SECURITY_COMPLIANCE'
  | 'FINANCIAL_AUDIT';

export type FounderDecisionChoice =
  | 'ChooseLearn'
  | 'ChooseDelegate'
  | 'ChooseVerify'
  | 'AcceptCovered'
  | 'ResetRecommendation';

export interface LearningAction {
  id?: string;
  resolutionKey?: string;
  topic?: string;
  capability?: string;
  objective: string;
  currentLevel?: string;
  targetLevel: string;
  estimatedHours?: number;
  estimatedLearningEffort?: string;
  recommendedFormat?: string;
  learningFormat?: string;
  timing?: string;
  suggestedTopics?: string[];
  learningTopics?: string[];
  completionCriteria?: string[];
  priority?: string;
  feasibility?: string;
  whatYoullBeAbleToDo?: string;
  whatYoullCreate?: string;
  suggestedEffortText?: string;
  practicalSteps?: Array<{ step: string; title: string }>;
  trainingOptions?: {
    status?: string;
    courseName?: string;
    providerAndCost?: string;
  };
  workloadImpact?: {
    weeklyAvailabilityHours?: number;
    alreadyPlannedHours?: number;
    proposedLearningHours?: number;
    totalIfAcceptedHours?: number;
    weeklyBufferHours?: number;
  };
}

export interface DelegationRequirement {
  id?: string;
  resolutionKey?: string;
  roleTitle?: string;
  capability?: string;
  suggestedResourceType: string;
  estimatedBudgetTier?: string;
  timing?: string;
  urgency?: string;
  delegationScope?: string;
  requirementSummary?: string;
  expectedOutcome: string;
  targetTiming?: string;
  workingLanguage?: string;
  estimatedWeeklyTime?: string;
  expectedDeliverable?: string;
  blocking?: boolean;
}

export interface VerificationRequirement {
  id?: string;
  resolutionKey?: string;
  requirement?: string;
  verificationType: string;
  authoritySource?: string;
  requiredEvidence?: string;
  evidenceRequired?: string[];
  whyRequired?: string;
  isMandatory: boolean;
  statutoryDeadline?: string;
  optionalLearningSupplement?: LearningAction;
  whatNeedsChecking?: string;
  whatYouCanShare?: string;
  whatIsStillUnclear?: string;
  timing?: string;
  blocking?: boolean;
}

export interface CoveredCapability {
  id?: string;
  key?: string;
  resolutionKey?: string;
  needKey?: string;
  capability: string;
  category?: string;
  evidence?: string;
  source?: string | string[];
  coverageSource?: string;
  currentLevel?: string;
  skillLevel?: string;
  yearsOfExperience?: number;
  resolvedAt?: string;
  matchReason?: string;
}

export interface CapabilityResolution {
  id?: string;
  key: string;
  needKey: string;
  capability: string;
  needCategory: string;
  priority: string;
  timing: string;
  blocking: boolean;
  relatedRoadmapTaskKeys: string[];
  resolutionMode: ResolutionMode;
  confidence: ResolutionConfidence;
  reasonCode: string;
  why: string;
  currentSkillLevel?: string;
  targetSkillLevel?: string;
  requiredCapabilityLevel?: string;
  estimatedLearningHours?: number;
  estimatedEffort?: string;
  learningFeasibility?: string;
  learningAction?: LearningAction;
  delegationRequirement?: DelegationRequirement;
  verificationRequirement?: VerificationRequirement;
  isMandatoryVerification: boolean;
  authoritySource?: string;
  founderDecision?: string;
  founderNotes?: string;
  customTargetLevel?: string;
  founderEdited: boolean;
  source: string[];
  sourceReference: string[];
  generatedAt: string;
  updatedAt?: string;
}

export interface SkillsSourceVersions {
  needsAnalysisUpdatedAt?: string;
  operationalRoadmapUpdatedAt?: string;
  professionalProfileUpdatedAt?: string;
  weeklyAvailability?: string;
  learningPreference?: string;
  delegationPreference?: string;
  legalAssessmentUpdatedAt?: string;
  formationUpdatedAt?: string;
}

export interface FounderProfileSummaryDto {
  headline?: string;
  weeklyAvailability?: string;
  learningPreference?: string;
  delegationPreference?: string;
  preferredApproach?: string;
  currentSituation?: string;
  topSkills?: string[];
  strongestRelevantCapabilities?: string[];
  yearsOfExperienceTotal?: number;
  isProfileComplete?: boolean;
}

export interface SkillsPlanMetrics {
  totalRequirements?: number;
  learnCount: number;
  delegateCount: number;
  verifyCount: number;
  coveredCount: number;
  needsReviewCount: number;
  mandatoryVerificationCount?: number;
  totalEstimatedLearningHours?: number;
  immediateActionCount?: number;
}

export interface SkillsPlan {
  version?: number;
  generatedAt: string;
  updatedAt: string;
  status: string;
  sourceVersions?: SkillsSourceVersions;
  resolutions: CapabilityResolution[];
  learningPlan?: LearningAction[];
  delegationPlan?: DelegationRequirement[];
  verificationPlan?: VerificationRequirement[];
  coveredCapabilities: CoveredCapability[];
  founderProfileSummary?: FounderProfileSummaryDto;
  summary: SkillsPlanMetrics;
  founderEdited?: boolean;
  totalResolutions?: number;
  learnCount?: number;
  delegateCount?: number;
  verifyCount?: number;
  coveredCount?: number;
  needsReviewCount?: number;
}

export interface SkillsPlanResponse {
  skillsPlan: SkillsPlan | null;
  updateAvailable: boolean;
  changedSources: string[];
  founderProfileSummary?: FounderProfileSummaryDto;
  profileContext?: FounderProfileSummaryDto;
  learnCount?: number;
  delegateCount?: number;
  verifyCount?: number;
  coveredCount?: number;
  needsReviewCount?: number;
  ideaVersion?: number;
  error?: string;
}

export interface UpdateResolutionRequest {
  ideaId?: string;
  founderDecision?: string;
  founderNotes?: string;
  customTargetLevel?: string;
  expectedVersion?: number;
}

