import axios from "@/lib/axios";
import {
  SystemOverview,
  SystemHealth,
  HangfireStats,
  FailedJobItem,
  RecurringJobItem,
  NotificationStats,
  PagedNotificationLogs,
  OperationalQueuesSummary,
  AdminPlatformSettings,
  UpdatePlatformSettingsPayload,
  EnvironmentInfo,
} from "@/types/admin-system";

// 1. System Overview
export const getSystemOverview = async (): Promise<SystemOverview> => {
  const response = await axios.get("/admin/system/overview");
  return response.data?.data;
};

// 2. Health
export const getSystemHealth = async (): Promise<SystemHealth> => {
  const response = await axios.get("/admin/system/health");
  return response.data?.data;
};

// 3. Hangfire Jobs
export const getJobStats = async (): Promise<HangfireStats> => {
  const response = await axios.get("/admin/system/jobs/stats");
  return response.data?.data;
};

export const getFailedJobs = async (page = 1, pageSize = 25): Promise<FailedJobItem[]> => {
  const response = await axios.get("/admin/system/jobs/failed", {
    params: { page, pageSize },
  });
  return response.data?.data;
};

export const getRecurringJobs = async (): Promise<RecurringJobItem[]> => {
  const response = await axios.get("/admin/system/jobs/recurring");
  return response.data?.data;
};

export const retryJob = async (jobId: string): Promise<{ jobId: string; success: boolean; message: string }> => {
  const response = await axios.post(`/admin/system/jobs/${jobId}/retry`);
  return response.data?.data;
};

// 4. Notifications Operations
export const getNotificationStats = async (): Promise<NotificationStats> => {
  const response = await axios.get("/admin/system/notifications/stats");
  return response.data?.data;
};

export const getNotificationLogs = async (params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  isRead?: boolean;
}): Promise<PagedNotificationLogs> => {
  const response = await axios.get("/admin/system/notifications/logs", { params });
  return response.data?.data;
};

// 5. Operational Queues
export const getOperationalQueues = async (): Promise<OperationalQueuesSummary> => {
  const response = await axios.get("/admin/system/queues");
  return response.data?.data;
};

// 6. Platform Controls
export const getPlatformControls = async (): Promise<AdminPlatformSettings> => {
  const response = await axios.get("/admin/system/controls");
  return response.data?.data;
};

export const updatePlatformControls = async (
  payload: UpdatePlatformSettingsPayload
): Promise<AdminPlatformSettings> => {
  const response = await axios.put("/admin/system/controls", payload);
  return response.data?.data;
};

// 7. Environment Info
export const getEnvironmentInfo = async (): Promise<EnvironmentInfo> => {
  const response = await axios.get("/admin/system/environment");
  return response.data?.data;
};
