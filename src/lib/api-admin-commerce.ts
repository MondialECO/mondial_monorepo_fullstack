import api from '@/lib/axios';
import type {
  AdminCommerceMetrics,
  AdminEngagementListItem,
  AdminEngagementDetail,
  AdminDisputeListItem,
  AdminDisputeDetail,
  AdminFinancialTransaction,
  AdminPayoutListItem,
  AdminPayoutRequestDto,
  AdminPayoutDetail,
  AdminEscrowMilestoneItem,
  AdminCommissionConfigDto,
  PaginatedResult,
} from '@/types/admin-commerce';
import type { ApiEnvelope } from '@/types/service-provider';

export type {
  AdminCommerceMetrics,
  AdminEngagementListItem,
  AdminEngagementDetail,
  AdminDisputeListItem,
  AdminDisputeDetail,
  AdminFinancialTransaction,
  AdminPayoutListItem,
  AdminPayoutRequestDto,
  AdminPayoutDetail,
  AdminEscrowMilestoneItem,
  AdminCommissionConfigDto,
  PaginatedResult,
};

export async function fetchCommerceMetrics(): Promise<AdminCommerceMetrics> {
  const res = await api.get<ApiEnvelope<AdminCommerceMetrics>>('/admin/commerce/metrics');
  return res.data.data;
}

export async function fetchAdminEngagements(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  clientId?: string;
  providerId?: string;
  status?: string;
  hasDispute?: boolean;
}): Promise<PaginatedResult<AdminEngagementListItem>> {
  const res = await api.get<{
    success: boolean;
    message: string;
    data: PaginatedResult<AdminEngagementListItem>;
  }>('/admin/engagements', { params });
  return res.data.data;
}

export async function fetchAdminEngagementDetail(id: string): Promise<AdminEngagementDetail> {
  const res = await api.get<ApiEnvelope<AdminEngagementDetail>>(`/admin/engagements/${id}`);
  return res.data.data;
}

export async function fetchAdminEscrows(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<AdminEscrowMilestoneItem>> {
  const res = await api.get<ApiEnvelope<PaginatedResult<AdminEscrowMilestoneItem>>>('/admin/escrows', { params });
  return res.data.data;
}

export async function fetchAdminDisputes(): Promise<AdminDisputeListItem[]> {
  const res = await api.get<ApiEnvelope<AdminDisputeListItem[]>>('/admin/disputes');
  return res.data.data;
}

export async function fetchAdminDisputeDetail(milestoneId: string): Promise<AdminDisputeDetail> {
  const res = await api.get<ApiEnvelope<AdminDisputeDetail>>(`/admin/disputes/${milestoneId}`);
  return res.data.data;
}

export async function resolveAdminDispute(milestoneId: string, outcome: string, reason: string): Promise<void> {
  await api.post(`/admin/disputes/${milestoneId}/resolve`, { outcome, reason });
}

export async function fetchAdminTransactions(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  userId?: string;
  engagementId?: string;
  transactionType?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
}): Promise<PaginatedResult<AdminFinancialTransaction>> {
  const res = await api.get<{
    success: boolean;
    message: string;
    data: PaginatedResult<AdminFinancialTransaction>;
  }>('/admin/transactions', { params });
  return res.data.data;
}

export async function fetchAdminPayouts(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  providerId?: string;
}): Promise<PaginatedResult<AdminPayoutListItem>> {
  const res = await api.get<{
    success: boolean;
    message: string;
    data: PaginatedResult<AdminPayoutListItem>;
  }>('/admin/payouts', { params });
  return res.data.data;
}

export async function fetchAdminPayoutRequests(status?: string): Promise<AdminPayoutRequestDto[]> {
  const res = await api.get<ApiEnvelope<AdminPayoutRequestDto[]>>('/admin/payouts', {
    params: { status: status && status !== 'all' ? status : undefined },
  });
  return (res.data.data as any)?.items || res.data.data || [];
}

export async function fetchAdminPayoutDetail(id: string): Promise<AdminPayoutDetail> {
  const res = await api.get<ApiEnvelope<AdminPayoutDetail>>(`/admin/payouts/${id}`);
  return res.data.data;
}

export async function approveAdminPayout(id: string, reason?: string): Promise<void> {
  await api.post(`/admin/payouts/${id}/approve`, { reason: reason || 'Approved by Admin' });
}

export async function completeAdminPayout(id: string, reference?: string, notes?: string): Promise<void> {
  await api.post(`/admin/payouts/${id}/process`, { reference, reason: notes || 'Processed by Admin' });
}

export async function rejectAdminPayout(id: string, reason: string): Promise<void> {
  await api.post(`/admin/payouts/${id}/reject`, { reason });
}

export const approvePayout = approveAdminPayout;
export const rejectPayout = rejectAdminPayout;
export const markPayoutProcessed = completeAdminPayout;

export async function fetchAdminCommissionConfig(): Promise<AdminCommissionConfigDto> {
  const res = await api.get<ApiEnvelope<AdminCommissionConfigDto>>('/admin/commission/config');
  return res.data.data;
}

export async function updateAdminCommissionConfig(config: AdminCommissionConfigDto): Promise<AdminCommissionConfigDto> {
  const res = await api.put<ApiEnvelope<AdminCommissionConfigDto>>('/admin/commission/config', config);
  return res.data.data;
}
