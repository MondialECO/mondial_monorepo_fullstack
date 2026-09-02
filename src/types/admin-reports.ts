export type ReportTargetType = 'ServiceListing' | 'CreatorOffer' | 'Review' | 'UserProfile';

export type ReportCategory =
  | 'Spam'
  | 'MisleadingContent'
  | 'HarassmentOrAbuse'
  | 'InappropriateContent'
  | 'FraudOrScamConcern'
  | 'Impersonation'
  | 'Other';

export type ReportStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Dismissed';

export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  description: string;
}

export interface AdminReportItem {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetSummary: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  resolution?: string;
}

export interface AdminReportDetail {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  resolution?: string;
  adminNotes?: string;
  targetData?: Record<string, any>;
  isTargetCurrentlyHidden: boolean;
  previousReportsCountOnTarget: number;
}

export interface ResolveReportPayload {
  resolutionAction: 'none' | 'hide' | 'dismiss';
  notes?: string;
}

export interface DismissReportPayload {
  notes?: string;
}

export interface PagedReportsResult {
  items: AdminReportItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
