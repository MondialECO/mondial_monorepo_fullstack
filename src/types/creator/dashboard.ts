export type Idea = {
  id: string;
  name: string;
  status: string;
  stageLabel: string | null;
  isPublished: boolean;
  createdAt: string;
  creatdate?: string;
  fundingRequired: number;
  equityOffered: number;
  totalRaised: number;
  fundingProgress: number;
  investors: unknown[];
  marketSize?: string;
  views?: number;
  equity?: number;
};


export type CreatorProfile = Record<string, unknown>;

export type BillingInfo = Record<string, unknown>;

export type CreatorSettings = Record<string, unknown>;

// ============================================================================
// CANONICAL CREATOR DASHBOARD SUMMARY CONTRACT (Phase 2 -> Phase 5)
// Source authority: GET /api/creator/dashboard/summary
// ============================================================================

export interface DashboardBrandSummary {
  hasBrandKit: boolean;
  brandKitId?: string | null;
  status: string;
  logoAsset?: string | null;
  logoUrl?: string | null;
  brandName?: string | null;
  colorPalette: string[];
  typographyPairing: string;
}

export interface DashboardProjectSummary {
  id: string;
  name: string;
  tagline?: string | null;
  concept?: string | null;
  category?: string | null;
  sector?: string | null;
  clarityScore?: number | null;
  brand: DashboardBrandSummary;
}

export interface DashboardNextAction {
  type: string;
  phase: number;
  stage: string;
  title: string;
  description: string;
  reason: string;
  href: string;
  priority: string;
  buttonLabel: string;
}

export interface DashboardAttentionItem {
  id: string;
  type: 'BLOCKED' | 'LEGAL_UPDATE' | 'STALE_BLOCKING_DEPENDENCY' | 'NEEDS_REVIEW' | 'VALIDATION_REQUIRED' | 'INFO' | string;
  phase: number;
  title: string;
  description: string;
  href: string;
  severity: 'critical' | 'warning' | 'info' | 'high' | 'medium' | 'low' | string;
  actionLabel?: string;
}

export interface DashboardSubstage {
  key: string;
  id?: string;
  label: string;
  title?: string;
  status: string;
  href: string;
  isCompleted?: boolean;
}

export interface DashboardPhaseMilestone {
  phaseNumber: number;
  phase?: number;
  title: string;
  shortName: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  href: string;
  substageProgress: DashboardSubstage[];
}

export interface DashboardJourneyOverview {
  currentPhase: number;
  overallStatus?: string;
  completedPhasesCount: number;
  totalPhasesCount: number;
  overallProgress?: number;
  phases: DashboardPhaseMilestone[];
  activeSubstages?: DashboardSubstage[];
}

export interface DashboardResultItem {
  key: string;
  id?: string;
  title: string;
  phase: number;
  category?: string;
  status: string;
  updatedAt: string;
  updatedAtUtc?: string;
  isStale: boolean;
  href: string;
  downloadable: boolean;
  exportType: string;
}

export interface DashboardPhase5Summary {
  isUnlocked: boolean;
  status: string;
  chosenPath?: string | null;
  selectedPath?: string | null;
  href: string;
  guidanceText: string;
}

export interface CreatorDashboardSummary {
  updatedAt: string;
  project: DashboardProjectSummary;
  journey: DashboardJourneyOverview;
  nextAction: DashboardNextAction;
  attentionItems: DashboardAttentionItem[];
  results: DashboardResultItem[];
  phase5: DashboardPhase5Summary;
}