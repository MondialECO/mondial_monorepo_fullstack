import api from '@/lib/axios';
import type { ApiEnvelope } from '@/types/service-provider';
import type { Engagement, FinancialSettings, FinancialSummary, SubmitDeliverablePayload, WorkroomDetail } from '@/types/workroom';

const unwrap = <T>(value: ApiEnvelope<T>) => value.data;
export async function getEngagements(): Promise<Engagement[]> { return unwrap((await api.get<ApiEnvelope<Engagement[]>>('/workroom/engagements')).data); }
export async function getEngagement(id: string): Promise<WorkroomDetail> { return unwrap((await api.get<ApiEnvelope<WorkroomDetail>>(`/workroom/engagements/${id}`)).data); }
export async function confirmContract(id: string): Promise<unknown> { return unwrap((await api.post<ApiEnvelope<unknown>>(`/workroom/engagements/${id}/contract/confirm`, { explicitlyConfirmed: true })).data); }
export async function activateMilestone(id: string): Promise<unknown> { return unwrap((await api.post<ApiEnvelope<unknown>>(`/workroom/milestones/${id}/activate`, {})).data); }
export async function submitDeliverable(id: string, payload: SubmitDeliverablePayload): Promise<WorkroomDetail> { return unwrap((await api.post<ApiEnvelope<WorkroomDetail>>(`/workroom/milestones/${id}/deliverables`, payload)).data); }
export async function startRevision(id: string): Promise<WorkroomDetail> { return unwrap((await api.post<ApiEnvelope<WorkroomDetail>>(`/workroom/revisions/${id}/start`, {})).data); }
export async function uploadFile(engagementId: string, milestoneId: string, file: File): Promise<{ id: string }> { const body = new FormData(); body.append('file', file); body.append('milestoneId', milestoneId); return unwrap((await api.post<ApiEnvelope<{ id: string }>>(`/workroom/engagements/${engagementId}/files`, body)).data); }
export async function completeEngagement(id: string): Promise<Engagement> { return unwrap((await api.post<ApiEnvelope<Engagement>>(`/workroom/engagements/${id}/complete`, {})).data); }
export async function getEarnings(currency = 'EUR'): Promise<FinancialSummary> { return unwrap((await api.get<ApiEnvelope<FinancialSummary>>('/earnings', { params: { currency } })).data); }
export async function addPayoutMethod(payload: { rail: string; displayName: string; maskedDescriptor: string }): Promise<FinancialSettings> { return unwrap((await api.post<ApiEnvelope<FinancialSettings>>('/earnings/payout-methods', payload)).data); }
export async function requestPayout(payload: { amount: number; currency: string }): Promise<unknown> { return unwrap((await api.post<ApiEnvelope<unknown>>('/earnings/payouts', payload)).data); }
export async function updateTaxSettings(payload: { legalName: string; countryCode: string; taxIdentifierMasked?: string; vatRegistered: boolean; vatNumberMasked?: string }): Promise<FinancialSettings> { return unwrap((await api.put<ApiEnvelope<FinancialSettings>>('/earnings/tax-settings', payload)).data); }
