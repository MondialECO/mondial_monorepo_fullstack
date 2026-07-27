import api from '@/lib/axios';
import type { ApiEnvelope } from '@/types/service-provider';
import type { AnalyticsDashboard, AnalyticsFilters, CreateGrowthTaskPayload, GrowthTask } from '@/types/analytics';

const unwrap = <T>(value: ApiEnvelope<T>) => value.data;

export async function getAnalytics(filters: AnalyticsFilters): Promise<AnalyticsDashboard> {
  return unwrap((await api.get<ApiEnvelope<AnalyticsDashboard>>('/service-provider/analytics', { params: filters })).data);
}

export async function getGrowthTasks(): Promise<GrowthTask[]> {
  return unwrap((await api.get<ApiEnvelope<GrowthTask[]>>('/service-provider/analytics/growth-tasks')).data);
}

export async function createGrowthTask(payload: CreateGrowthTaskPayload): Promise<GrowthTask> {
  return unwrap((await api.post<ApiEnvelope<GrowthTask>>('/service-provider/analytics/growth-tasks', payload)).data);
}

export async function updateGrowthTaskStatus(id: string, status: string): Promise<GrowthTask> {
  return unwrap((await api.put<ApiEnvelope<GrowthTask>>(`/service-provider/analytics/growth-tasks/${id}/status`, { status })).data);
}
