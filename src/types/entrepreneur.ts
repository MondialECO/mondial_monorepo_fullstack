export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type StepNumber = 1 | 2 | 3 | 4;
export type PhaseStatus = 'completed' | 'active' | 'locked';

export interface EntrepreneurProgress {
  currentPhase: PhaseNumber;
  currentStep: StepNumber;
  completedPhases: Set<PhaseNumber>;
  completedSteps: Set<string>; // Format: "2-1", "2-2", etc.
  phaseData: Record<string, unknown>;
  trustScore: number;
  lastUpdated: number;
}

export interface PhaseConfig {
  phase: PhaseNumber;
  title: string;
  description: string;
  trustScore: number;
  hasSteps: boolean;
  stepCount?: number;
}

export interface StepConfig {
  phase: PhaseNumber;
  step: StepNumber;
  title: string;
  description: string;
}

// Phase 2 specific types
export interface LegalIdentityData {
  companyName: string;
  legalStructure: string;
  registrationNumber: string;
  foundedDate: string;
  country: string;
  state: string;
}

export interface DocumentUploadData {
  documents: DocumentItem[];
}

export interface DocumentItem {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'verified';
  uploadedDate?: string;
  fileSize?: number;
}

export interface BeneficialOwner {
  id: string;
  name: string;
  role: string;
  ownershipPercentage: string;
  nationality: string;
  documentType?: string;
  documentNumber?: string;
  dateOfBirth?: string;
}

export interface OwnershipData {
  owners: BeneficialOwner[];
  kycStatus: 'pending' | 'in_progress' | 'verified';
  biometricVerified: boolean;
}

export interface FinancialPreviewData {
  annualRevenue: string;
  monthlyBurnRate: string;
  cashRunway: string;
  currentFunding: string;
}

export interface Phase6Data {
  __companyId?: string;
  documentsUploadedCount?: number;
  accessGrantsCount?: number;
  dataRoomPublishedAt?: string;
  submittedAt?: string;
}

export interface Phase5Data {
  __companyId?: string;
  fundingAskSavedAt?: string;
  pitchDeckUploadedAt?: string;
  narrativeSavedAt?: string;
  outreachCampaignSavedAt?: string;
  submittedAt?: string;
}

export interface Phase4Data {
  __companyId?: string;
  capTableSubmittedAt?: string;
  capTableVersion?: number;
  vestingSavedAt?: string;
  ownershipHistorySavedAt?: string;
  shareIssuancesCount?: number;
  submittedAt?: string;
}

export interface Phase3Data {
  __companyId?: string;
  revenueSavedAt?: string;
  cashPositionSavedAt?: string;
  valuationCalculatedAt?: string;
  equitySavedAt?: string;
  fundingAskSavedAt?: string;
  kpiBaselineSavedAt?: string;
  reportsSubmittedCount?: number;
  submittedAt?: string;
}

export interface Phase2Data {
  legalIdentity?: LegalIdentityData;
  documents?: DocumentUploadData;
  ownership?: OwnershipData;
  financial?: FinancialPreviewData;
  // Runtime metadata persisted in phaseData by the Phase 2 step pages
  __companyId?: string;
  documentsVerified?: boolean;
  beneficialOwnersSaved?: boolean;
  verifiedAt?: string;
}

