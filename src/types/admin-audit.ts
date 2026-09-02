export interface AdminAuditLogItem {
  id: string;
  action: string;
  actor: string;
  actorEmail?: string;
  actorRole?: string;
  success: boolean;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  correlationId?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface PagedAuditLogResult {
  items: AdminAuditLogItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminGovernanceSummary {
  openReportsCount: number;
  underReviewReportsCount: number;
  resolvedReportsCount: number;
  dismissedReportsCount: number;
  totalReportsCount: number;

  hiddenServicesCount: number;
  hiddenCreatorOffersCount: number;
  hiddenReviewsCount: number;
  suspendedUsersCount: number;

  openDisputesCount: number;
  pendingVerificationsCount: number;
  totalAuditEventsCount: number;
  recentAuditEvents: AdminAuditLogItem[];
}
