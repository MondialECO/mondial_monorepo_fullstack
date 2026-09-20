import { StaticImageData } from 'next/image';

export type ConstructionStatus =
  | 'Ready'
  | 'Partial'
  | 'Missing'
  | 'Critical'
  | 'Optional'
  | 'NeedsReview';

export type ConstructionPriority =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Optional';

export type ConstructionCategory =
  | 'Business Foundation'
  | 'Brand'
  | 'Market'
  | 'Business Model'
  | 'Finance'
  | 'Legal & Administration'
  | 'Team'
  | 'Skills'
  | 'Services'
  | 'Technology'
  | 'Funding'
  | 'Pricing'
  | 'Go-to-Market'
  | 'Launch Assets'
  | 'Operations';

export interface ConstructionSnapshotItem {
  key: string;
  category: ConstructionCategory;
  title: string;
  status: ConstructionStatus;
  priority: ConstructionPriority;
  reason: string;
  source: string[];
  sourceReference: string[];
  recommendedNextStep: string;
  blocking: boolean;
  generatedAt: string;
}

export interface Phase4SourceVersions {
  projectVersion?: string;
  projectUpdatedAt?: string;
  marketStudyId?: string;
  marketStudyUpdatedAt?: string;
  businessModelId?: string;
  businessModelUpdatedAt?: string;
  forecastId?: string;
  forecastUpdatedAt?: string;
  legalAssessmentId?: string;
  legalAssessmentUpdatedAt?: string;
  formationId?: string;
  formationUpdatedAt?: string;
  businessPlanId?: string;
  businessPlanUpdatedAt?: string;
  profileUpdatedAt?: string;
  profileHash?: string;
  investorReadinessScore?: number;
  investorReadinessUpdatedAt?: string;
}

export interface ConstructionSnapshot {
  status: string;
  generatedAt: string;
  updatedAt: string;
  overallSummary: string;
  readyItems: ConstructionSnapshotItem[];
  partialItems: ConstructionSnapshotItem[];
  missingItems: ConstructionSnapshotItem[];
  criticalItems: ConstructionSnapshotItem[];
  optionalItems: ConstructionSnapshotItem[];
  categories: string[];
  sourceReferences: Record<string, string>;
  profileVersion?: string;
  founderEdited: boolean;
}

export interface ConstructionSnapshotResponse {
  snapshot?: ConstructionSnapshot | null;
  updateAvailable: boolean;
  changedSources: string[];
}
