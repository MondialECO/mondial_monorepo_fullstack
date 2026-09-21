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
  topic: string;
  objective: string;
  currentLevel?: string;
  targetLevel: string;
  estimatedHours: number;
  recommendedFormat: string;
  timing: string;
  suggestedTopics: string[];
  priority: string;
  feasibility: string;
}

export interface DelegationRequirement {
  roleTitle: string;
  suggestedResourceType: string;
  estimatedBudgetTier: string;
  timing: string;
  urgency: string;
  delegationScope: string;
  expectedOutcome: string;
}

export interface VerificationRequirement {
  verificationType: string;
  authoritySource: string;
  requiredEvidence: string;
  isMandatory: boolean;
  statutoryDeadline?: string;
  optionalLearningSupplement?: LearningAction;
}

export interface CoveredCapability {
  key: string;
  needKey?: string;
  capability: string;
  category: string;
  evidence: string;
  source: string;
  skillLevel?: string;
  yearsOfExperience?: number;
  resolvedAt: string;
}

export interface CapabilityResolution {
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
  estimatedLearningHours?: number;
  learningAction?: LearningAction;
  delegationRequirement?: DelegationRequirement;
  verificationRequirement?: VerificationRequirement;
  isMandatoryVerification: boolean;
  founderDecision?: string;
  founderNotes?: string;
  customTargetLevel?: string;
  founderEdited: boolean;
  source: string[];
  sourceReference: string[];
  generatedAt: string;
  updatedAt: string;
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
  topSkills: string[];
  yearsOfExperienceTotal?: number;
  isProfileComplete: boolean;
}

export interface SkillsPlanMetrics {
  totalRequirements: number;
  learnCount: number;
  delegateCount: number;
  verifyCount: number;
  coveredCount: number;
  needsReviewCount: number;
  mandatoryVerificationCount: number;
  totalEstimatedLearningHours: number;
  immediateActionCount: number;
}

export interface SkillsPlan {
  version: number;
  generatedAt: string;
  updatedAt: string;
  status: string;
  sourceVersions: SkillsSourceVersions;
  resolutions: CapabilityResolution[];
  coveredCapabilities: CoveredCapability[];
  founderProfileSummary?: FounderProfileSummaryDto;
  summary: SkillsPlanMetrics;
  founderEdited: boolean;
}

export interface SkillsPlanResponse {
  skillsPlan: SkillsPlan | null;
  updateAvailable: boolean;
  changedSources: string[];
  founderProfileSummary?: FounderProfileSummaryDto;
  error?: string;
}

export interface UpdateResolutionRequest {
  ideaId?: string;
  founderDecision?: string;
  founderNotes?: string;
  customTargetLevel?: string;
}
