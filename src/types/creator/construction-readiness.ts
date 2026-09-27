export interface ReadinessArtifactCard {
  id: string; // "brand_kit" | "financial_forecast" | "operational_roadmap" | "pricing_decision" | "launch_strategy" | "launch_website"
  title: string;
  status: string; // "Available" | "Generated" | "Active" | "Selected" | "Saved" | "Draft available" | "Missing" | "Update available"
  statusColor: 'emerald' | 'blue' | 'amber' | 'gray' | string;
  description: string;
  actionLabel: string;
  actionRoute: string;
}

export interface ReadinessAttentionIssue {
  id: string;
  priority: 'critical' | 'medium' | 'low' | string;
  title: string;
  subtitle: string;
  badge: string; // "Critical priority" | "Asset action" | "Selection" | "Needs validation" | "Commercial detail"
  badgeColor: 'rose' | 'amber' | 'blue' | 'gray' | string;
  whyItMatters: string;
  whatIsAlreadyDecided: string;
  whatIsStillNeeded: string;
  whatThisAffects: string[];
  connectedWork?: string;
  connectedTaskId?: string;
  sourcesText?: string;
  actionLabel?: string;
  actionRoute?: string;
  secondaryActionLabel?: string;
  secondaryActionRoute?: string;
  extraInfo?: string;
}

export interface ReadinessNextAction {
  type: string; // "Existing roadmap task" | "Source review action"
  estimatedEffort?: string; // "1.5 hours"
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionRoute: string;
  secondaryActionLabel?: string;
  secondaryActionRoute?: string;
  taskId?: string;
}

export interface ConstructionReadinessReview {
  id: string;
  status: string; // "Preparation in progress"
  overallScore: number | null; // explicitly nullable!
  scoreStatus: 'NotCalculated' | 'Calculated' | string;
  scoreAvailabilityExplanation: string;
  positionHeadline: string;
  currentActionGuidance: string;
  dependencyGuidance: string;
  savedArtifactsCount: number;
  artifacts: ReadinessArtifactCard[];
  issues: ReadinessAttentionIssue[];
  nextAction?: ReadinessNextAction | null;
  reviewedAt?: string | null;
  evaluatedAt: string;
  policyVersion: string;
  sourceFingerprint: string;
  updateAvailable?: boolean;
  changedSources?: string[];
  ideaVersion?: number;
}

export interface SaveConstructionReadinessRequest {
  ideaId?: string;
  expectedVersion?: number;
  sourceFingerprint?: string;
}

export interface ConstructionReadinessResponse {
  review: ConstructionReadinessReview;
  isSaved: boolean;
  updateAvailable: boolean;
  changedSources: string[];
  ideaVersion: number;
}
