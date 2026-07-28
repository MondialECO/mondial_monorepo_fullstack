import api from '@/lib/axios';
import type { ApiEnvelope } from '@/types/service-provider';
import type { ClientInput, CreateClientInputPayload, CreateTaskPayload, CreateTimeEntryPayload, Engagement, FinancialSettings, FinancialStatement, FinancialSummary, HourlyTimeEntry, Payout, Review, SubmitDeliverablePayload, TaxSettingsPayload, WorkroomDetail, WorkroomTask } from '@/types/workroom';

const unwrap = <T>(value: ApiEnvelope<T>) => value.data;
export async function getEngagements(): Promise<Engagement[]> { return unwrap((await api.get<ApiEnvelope<Engagement[]>>('/workroom/engagements')).data); }
export async function getEngagement(id: string): Promise<WorkroomDetail> { return unwrap((await api.get<ApiEnvelope<WorkroomDetail>>(`/workroom/engagements/${id}`)).data); }
export async function confirmContract(id: string): Promise<unknown> { return unwrap((await api.post<ApiEnvelope<unknown>>(`/workroom/engagements/${id}/contract/confirm`, { explicitlyConfirmed: true })).data); }
export async function activateMilestone(id: string): Promise<unknown> { return unwrap((await api.post<ApiEnvelope<unknown>>(`/workroom/milestones/${id}/activate`, {})).data); }
export async function submitDeliverable(id: string, payload: SubmitDeliverablePayload): Promise<WorkroomDetail> { return unwrap((await api.post<ApiEnvelope<WorkroomDetail>>(`/workroom/milestones/${id}/deliverables`, payload)).data); }
export async function startRevision(id: string): Promise<WorkroomDetail> { return unwrap((await api.post<ApiEnvelope<WorkroomDetail>>(`/workroom/revisions/${id}/start`, {})).data); }
export async function uploadFile(engagementId: string, milestoneId: string, file: File): Promise<{ id: string }> { const body = new FormData(); body.append('file', file); body.append('milestoneId', milestoneId); return unwrap((await api.post<ApiEnvelope<{ id: string }>>(`/workroom/engagements/${engagementId}/files`, body)).data); }
export async function completeEngagement(id: string): Promise<Engagement> { return unwrap((await api.post<ApiEnvelope<Engagement>>(`/workroom/engagements/${id}/complete`, {})).data); }
export async function pauseEngagement(id: string, reason: string): Promise<Engagement> { return unwrap((await api.post<ApiEnvelope<Engagement>>(`/workroom/engagements/${id}/pause`, { reason })).data); }
export async function resumeEngagement(id: string): Promise<Engagement> { return unwrap((await api.post<ApiEnvelope<Engagement>>(`/workroom/engagements/${id}/resume`, {})).data); }
export async function requestExtension(id: string, payload: { days: number; reason: string }): Promise<unknown> { return unwrap((await api.post<ApiEnvelope<unknown>>(`/workroom/milestones/${id}/extension`, payload)).data); }
export async function openDispute(id: string, reason: string): Promise<WorkroomDetail> { return unwrap((await api.post<ApiEnvelope<WorkroomDetail>>(`/workroom/milestones/${id}/disputes`, { reason })).data); }
export async function createTask(id: string, payload: CreateTaskPayload): Promise<WorkroomTask> { return unwrap((await api.post<ApiEnvelope<WorkroomTask>>(`/workroom/engagements/${id}/tasks`, payload)).data); }
export async function requestClientInput(id: string, payload: CreateClientInputPayload): Promise<ClientInput> { return unwrap((await api.post<ApiEnvelope<ClientInput>>(`/workroom/engagements/${id}/client-input`, payload)).data); }
export async function addTimeEntry(id: string, payload: CreateTimeEntryPayload): Promise<HourlyTimeEntry> { return unwrap((await api.post<ApiEnvelope<HourlyTimeEntry>>(`/workroom/engagements/${id}/time-entries`, payload)).data); }
export async function respondToReview(id: string, response: string): Promise<Review> { return unwrap((await api.post<ApiEnvelope<Review>>(`/workroom/reviews/${id}/response`, { response })).data); }
export async function getEarnings(currency = 'EUR'): Promise<FinancialSummary> { return unwrap((await api.get<ApiEnvelope<FinancialSummary>>('/earnings', { params: { currency } })).data); }
export async function getStatement(from: string, to: string, currency: string): Promise<FinancialStatement> { return unwrap((await api.get<ApiEnvelope<FinancialStatement>>('/earnings/statements', { params: { from, to, currency } })).data); }
export async function addPayoutMethod(payload: { rail: string; displayName: string; maskedDescriptor: string }): Promise<FinancialSettings> { return unwrap((await api.post<ApiEnvelope<FinancialSettings>>('/earnings/payout-methods', payload)).data); }
export async function setDefaultPayoutMethod(id: string): Promise<FinancialSettings> { return unwrap((await api.put<ApiEnvelope<FinancialSettings>>(`/earnings/payout-methods/${id}/default`, {})).data); }
export async function removePayoutMethod(id: string): Promise<FinancialSettings> { return unwrap((await api.delete<ApiEnvelope<FinancialSettings>>(`/earnings/payout-methods/${id}`)).data); }
export async function requestPayout(payload: { amount: number; currency: string; payoutMethodId?: string }): Promise<Payout> { return unwrap((await api.post<ApiEnvelope<Payout>>('/earnings/payouts', payload)).data); }
export async function updateTaxSettings(payload: TaxSettingsPayload): Promise<FinancialSettings> { return unwrap((await api.put<ApiEnvelope<FinancialSettings>>('/earnings/tax-settings', payload)).data); }
