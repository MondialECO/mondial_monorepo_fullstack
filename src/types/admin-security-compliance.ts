import { AdminAuditLogItem } from "./admin-audit";

export interface DeletionDependencyCheck {
  hasActiveWorkroomEngagements: boolean;
  activeEngagementsCount: number;
  hasOpenDisputes: boolean;
  openDisputesCount: number;
  hasPendingPayouts: boolean;
  pendingPayoutsCount: number;
  hasFinancialHistory: boolean;
  transactionCount: number;
  canSafelyDelete: boolean;
  blockers: string[];
}

export interface AdminSecuritySummary {
  failedLoginsTodayCount: number;
  lockedAccountsCount: number;
  suspendedAccountsCount: number;
  securityEventsTodayCount: number;
  openPrivacyRequestsCount: number;
  openComplianceCasesCount: number;
  highRiskAccountsCount: number;
  recentPrivilegedChangesCount: number;
  recentSecurityEvents: AdminAuditLogItem[];
}

export interface UserSecurityReview {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  isLocked: boolean;
  lockoutEnd?: string | null;
  accessFailedCount: number;
  kycStatus: string;
  joinedAt?: string | null;
  lastLogin?: string | null;
  factualSignals: string[];
  dependencyCheck?: DeletionDependencyCheck | null;
  recentAuditHistory: AdminAuditLogItem[];
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  requestType: "DataAccess" | "DataExport" | "Correction" | "AccountDeletion" | "OtherPrivacyRequest" | string;
  status: "Open" | "UnderReview" | "Approved" | "Completed" | "Rejected" | string;
  details: string;
  adminNotes: string;
  rejectionReason?: string | null;
  assignedAdminId?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  exportDownloadUrl?: string | null;
  exportExpiresAt?: string | null;
  dependencyCheck?: DeletionDependencyCheck | null;
  version: number;
}

export interface CreatePrivacyRequestPayload {
  requestType: string;
  details: string;
}

export interface UpdatePrivacyStatusPayload {
  status: string;
  reason?: string;
  adminNotes?: string;
  version: number;
}

export interface ComplianceCaseNote {
  id: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface ComplianceCaseTimelineEvent {
  id: string;
  eventType: string;
  actorEmail: string;
  description: string;
  timestamp: string;
}

export interface ComplianceCase {
  id: string;
  caseType: string;
  targetUserId: string;
  targetUserEmail: string;
  targetUserDisplayName: string;
  sourceType: string;
  sourceId?: string | null;
  status: "Open" | "UnderReview" | "ActionTaken" | "Resolved" | "Dismissed" | string;
  priority: "Low" | "Normal" | "High" | "Critical" | string;
  assignedAdminId?: string | null;
  assignedAdminEmail?: string | null;
  summary: string;
  resolution?: string | null;
  resolvedBy?: string | null;
  notes: ComplianceCaseNote[];
  timeline: ComplianceCaseTimelineEvent[];
  factualSignals: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  version: number;
}

export interface CreateComplianceCasePayload {
  targetUserId: string;
  caseType: string;
  sourceType?: string;
  sourceId?: string;
  priority: string;
  summary: string;
}

export interface AddComplianceCaseNotePayload {
  content: string;
}

export interface UpdateComplianceCaseStatusPayload {
  status: string;
  resolution?: string;
  assignedAdminEmail?: string;
  version: number;
}

export interface DataRetentionPolicy {
  id: string;
  dataCategory: string;
  retentionDays?: number | null;
  actionAfterRetention: string;
  storageAuthority: string;
  dataSensitivity: string;
  accessAuthority: string;
  enabled: boolean;
  updatedBy?: string | null;
  updatedAt: string;
  version: number;
}

export interface DataGovernanceInventoryItem {
  dataCategory: string;
  storageAuthority: string;
  dataSensitivity: string;
  retentionPolicy: string;
  deletionStrategy: string;
  accessAuthority: string;
  estimatedRecordsCount: number;
}

export interface UpdateDataRetentionPoliciesPayload {
  policies: DataRetentionPolicy[];
}
