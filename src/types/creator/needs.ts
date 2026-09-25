export type NeedCategory =
  | 'Team'
  | 'Services'
  | 'Technology'
  | 'Finance'
  | 'LegalAdmin'
  | 'Marketing'
  | 'Sales'
  | 'Operations'
  | 'Training'
  | 'Infrastructure';

export type NeedRequirementType =
  | 'Role'
  | 'Capability'
  | 'Service'
  | 'Software'
  | 'Capital'
  | 'Compliance'
  | 'Asset'
  | 'TrainingCandidate'
  | 'Infrastructure';

export type NeedPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type NeedTiming =
  | 'Now'
  | 'Next30Days'
  | 'Days30To60'
  | 'Days60To90'
  | 'BeforeLaunch'
  | 'PostLaunch';

export type NeedSystemStatus =
  | 'Identified'
  | 'NeedsReview'
  | 'Satisfied'
  | 'NotRequired';

export type NeedFounderState =
  | 'Unreviewed'
  | 'Confirmed'
  | 'InProgress'
  | 'Deferred'
  | 'ClaimedSatisfied';

export type NeedFulfillmentMode =
  | 'Unassigned'
  | 'Learn'
  | 'Delegate'
  | 'Verify';

export interface CreatorNeed {
  id: string;
  key: string;
  category: NeedCategory | string;
  title: string;
  description: string;
  whyNeeded: string;
  priority: NeedPriority;
  timing: NeedTiming;
  requirementType: NeedRequirementType;
  estimatedBudget?: number | null;
  budgetConfidence?: string;
  systemStatus: NeedSystemStatus;
  founderState: NeedFounderState;
  fulfillmentMode: NeedFulfillmentMode;
  blocking: boolean;
  notes?: string;
  source: string[];
  sourceReference: string[];
  relatedSnapshotItemKeys: string[];
  relatedRoadmapTaskKeys: string[];
  capabilityRequired?: string;
  founderEdited: boolean;
  customBudget?: number | null;
  customTiming?: string | null;
  whatIsNeeded?: string;
  whyThisApplies?: string;
  whatYouAlreadyHave?: string;
  whatIsStillMissing?: string;
  whatWouldSatisfy?: string;
  founderInformation?: string;
  generatedAt: string;
  updatedAt: string;
}

export interface NeedsSourceVersions {
  constructionSnapshotGeneratedAt?: string;
  constructionSnapshotHash?: string;
  operationalRoadmapUpdatedAt?: string;
  operationalRoadmapHash?: string;
  businessModelVersion: number;
  businessModelUpdatedAt?: string;
  forecastVersion: number;
  forecastUpdatedAt?: string;
  legalAssessmentUpdatedAt?: string;
  formationUpdatedAt?: string;
  professionalProfileUpdatedAt?: string;
  professionalProfileHash?: string;
}

export interface NeedsAnalysis {
  status: string;
  generatedAt: string;
  updatedAt: string;
  summary: string;
  activeNeeds: CreatorNeed[];
  coveredRequirements: CreatorNeed[];
  sourceVersions: NeedsSourceVersions;
}

export interface NeedsAnalysisResponse {
  needsAnalysis: NeedsAnalysis | null;
  updateAvailable: boolean;
  changedSources: string[];
  totalActiveNeeds: number;
  criticalCount: number;
  highCount: number;
  satisfiedCount: number;
  ideaVersion?: number;
}

export interface UpdateNeedStateRequest {
  ideaId?: string;
  founderState?: NeedFounderState;
  notes?: string;
  customBudget?: number | null;
  customTiming?: string | null;
  founderInformation?: string;
  expectedVersion?: number;
}

