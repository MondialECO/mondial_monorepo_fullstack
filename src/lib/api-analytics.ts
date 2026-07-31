import api from '@/lib/axios';
import type { ApiEnvelope } from '@/types/service-provider';
import type { AnalyticsDashboard, AnalyticsFilters, CreateGrowthTaskPayload, GrowthTask, ProviderDashboard } from '@/types/analytics';

const unwrap = <T>(value: ApiEnvelope<T>) => value.data;

export async function getAnalytics(filters: AnalyticsFilters): Promise<AnalyticsDashboard> {
  return unwrap((await api.get<ApiEnvelope<AnalyticsDashboard>>('/service-provider/analytics', { params: filters })).data);
}

export async function getProviderOverview(currency = 'EUR'): Promise<ProviderDashboard> {
  return unwrap((await api.get<ApiEnvelope<ProviderDashboard>>('/service-provider/analytics/overview', { params: { currency } })).data);
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

// Phase B read endpoints
export interface AnalyticsListingOption {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  impressions30d: number;
}

export interface AnalyticsListingsResponse {
  listings: AnalyticsListingOption[];
}

export interface AnalyticsSummaryResponse {
  impressions: number;
  impressionsDelta: number | null;
  clicks: number;
  clicksDelta: number | null;
  inquiries: number;
  inquiriesDelta: number | null;
  conversionRate: number | null;
  conversionRateDelta: number | null;
}

export interface AnalyticsBucketPoint {
  date: string;
  impressions: number;
  clicks: number;
}

export interface AnalyticsTimeseriesResponse {
  buckets: AnalyticsBucketPoint[];
}

export type AnalyticsRange = 'today' | '7d' | '30d' | '90d';

export async function getAnalyticsListings(): Promise<AnalyticsListingsResponse> {
  return unwrap((await api.get<ApiEnvelope<AnalyticsListingsResponse>>('/service-provider/analytics/listings')).data);
}

export async function getAnalyticsSummary(listingId: string, range: AnalyticsRange): Promise<AnalyticsSummaryResponse> {
  return unwrap((await api.get<ApiEnvelope<AnalyticsSummaryResponse>>(
    `/service-provider/analytics/summary?listingId=${encodeURIComponent(listingId)}&range=${range}`
  )).data);
}

export async function getAnalyticsTimeseries(listingId: string, range: AnalyticsRange): Promise<AnalyticsTimeseriesResponse> {
  return unwrap((await api.get<ApiEnvelope<AnalyticsTimeseriesResponse>>(
    `/service-provider/analytics/timeseries?listingId=${encodeURIComponent(listingId)}&range=${range}`
  )).data);
}
