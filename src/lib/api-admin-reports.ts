import axios from '@/lib/axios';
import {
  CreateReportPayload,
  AdminReportItem,
  AdminReportDetail,
  ResolveReportPayload,
  DismissReportPayload,
  PagedReportsResult,
} from '@/types/admin-reports';

// User reporting API
export const submitUserReport = async (payload: CreateReportPayload): Promise<{ id: string; status: string; createdAt: string }> => {
  const response = await axios.post('/reports', payload);
  return response.data?.data;
};

// Admin Reports Queue
export const getAdminReports = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  targetType?: string;
}): Promise<PagedReportsResult> => {
  const response = await axios.get('/admin/reports', { params });
  return response.data?.data;
};

// Admin Report Detail
export const getAdminReportDetail = async (id: string): Promise<AdminReportDetail> => {
  const response = await axios.get(`/admin/reports/${id}`);
  return response.data?.data;
};

// Move to Under Review
export const markReportUnderReview = async (id: string): Promise<{ id: string; status: string }> => {
  const response = await axios.post(`/admin/reports/${id}/under-review`);
  return response.data?.data;
};

// Dismiss Report
export const dismissReport = async (id: string, payload?: DismissReportPayload): Promise<{ id: string; status: string; resolution: string }> => {
  const response = await axios.post(`/admin/reports/${id}/dismiss`, payload || {});
  return response.data?.data;
};

// Resolve Report (with optional moderation hide)
export const resolveReport = async (id: string, payload: ResolveReportPayload): Promise<{ id: string; status: string; resolution: string }> => {
  const response = await axios.post(`/admin/reports/${id}/resolve`, payload);
  return response.data?.data;
};
