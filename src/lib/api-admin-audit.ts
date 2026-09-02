import axios from '@/lib/axios';
import {
  AdminGovernanceSummary,
  PagedAuditLogResult,
} from '@/types/admin-audit';

export const getAdminAuditLogs = async (params?: {
  page?: number;
  pageSize?: number;
  action?: string;
  actor?: string;
  targetType?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<PagedAuditLogResult> => {
  const response = await axios.get('/admin/audit', { params });
  return response.data?.data || response.data;
};

export const getAdminGovernanceSummary = async (): Promise<AdminGovernanceSummary> => {
  const response = await axios.get('/admin/governance/summary');
  return response.data?.data || response.data;
};
