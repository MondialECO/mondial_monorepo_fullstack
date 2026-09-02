export type HealthStatusLevel = "Healthy" | "Degraded" | "Unhealthy" | "Not Monitored";

export interface ComponentHealth {
  status: HealthStatusLevel;
  message: string;
  responseTimeMs?: number;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  overallStatus: HealthStatusLevel;
  api: ComponentHealth;
  database: ComponentHealth;
  hangfire: ComponentHealth;
  notifications: ComponentHealth;
  storage: ComponentHealth;
  timestamp: string;
  version: string;
}

export interface HangfireStats {
  enqueued: number;
  processing: number;
  scheduled: number;
  succeeded: number;
  failed: number;
  serversCount: number;
  recurringJobsCount: number;
  queues: string[];
}

export interface FailedJobItem {
  jobId: string;
  jobType: string;
  method: string;
  queue: string;
  failedAt?: string;
  exceptionType: string;
  exceptionMessage: string;
  retryCount: number;
  canRetry: boolean;
  highRiskReason?: string | null;
}

export interface RecurringJobItem {
  id: string;
  cron: string;
  queue: string;
  jobType: string;
  method: string;
  lastExecution?: string | null;
  nextExecution?: string | null;
  lastJobState?: string | null;
  timeZone: string;
}

export interface NotificationChannelStatus {
  channel: string;
  status: string;
  description: string;
}

export interface NotificationStats {
  totalInApp: number;
  unreadInApp: number;
  readInApp: number;
  createdToday: number;
  channels: NotificationChannelStatus[];
}

export interface AdminNotificationLogItem {
  id: string;
  userId: string;
  title: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface PagedNotificationLogs {
  items: AdminNotificationLogItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface OperationalQueuesSummary {
  pendingKycCount: number;
  pendingInvestorVerificationsCount: number;
  pendingServiceProviderVerificationsCount: number;
  openReportsCount: number;
  openDisputesCount: number;
  pendingPayoutsCount: number;
  failedJobsCount: number;
  generatedAt: string;
}

export interface AdminPlatformSettings {
  registrationEnabled: boolean;
  marketplacePublishingEnabled: boolean;
  payoutRequestsEnabled: boolean;
  reportsEnabled: boolean;
  maintenanceBannerEnabled: boolean;
  maintenanceBannerTitle: string;
  maintenanceBannerMessage: string;
  maintenanceBannerSeverity: "info" | "warning" | "alert";
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface UpdatePlatformSettingsPayload {
  registrationEnabled: boolean;
  marketplacePublishingEnabled: boolean;
  payoutRequestsEnabled: boolean;
  reportsEnabled: boolean;
  maintenanceBannerEnabled: boolean;
  maintenanceBannerTitle: string;
  maintenanceBannerMessage: string;
  maintenanceBannerSeverity: "info" | "warning" | "alert";
  expectedVersion: number;
}

export interface EnvironmentInfo {
  environmentName: string;
  frameworkVersion: string;
  applicationVersion: string;
  commitHash: string;
  serverTimeUtc: string;
  timeZone: string;
  uptime: string;
  hostName: string;
}

export interface SystemOverview {
  overallStatus: HealthStatusLevel;
  health: SystemHealth;
  jobStats: HangfireStats;
  queues: OperationalQueuesSummary;
  notificationStats: NotificationStats;
  environment: EnvironmentInfo;
  platformSettings: AdminPlatformSettings;
}
