import api from "@/lib/axios";
import type { ApiEnvelope } from "@/types/service-provider";
import type { ClientBrief, LeadQuery, Proposal, UpsertProposalRequest } from "@/types/leads";

const BASE = "/leads";
const unwrap = <T>(env: ApiEnvelope<T>) => env.data;

export async function getInbox(query: LeadQuery = {}): Promise<ClientBrief[]> {
  const res = await api.get<ApiEnvelope<ClientBrief[]>>(`${BASE}/inbox`, { params: query });
  return unwrap(res.data);
}
export async function getBrief(id: string): Promise<ClientBrief> {
  const res = await api.get<ApiEnvelope<ClientBrief>>(`${BASE}/briefs/${id}`); return unwrap(res.data);
}
export async function updateInteraction(id: string, payload: { saved?: boolean; dismissed?: boolean }): Promise<ClientBrief> {
  const res = await api.put<ApiEnvelope<ClientBrief>>(`${BASE}/briefs/${id}/interaction`, payload); return unwrap(res.data);
}
export async function getProposals(): Promise<Proposal[]> {
  const res = await api.get<ApiEnvelope<Proposal[]>>(`${BASE}/proposals`); return unwrap(res.data);
}
export async function getProposal(id: string): Promise<Proposal> {
  const res = await api.get<ApiEnvelope<Proposal>>(`${BASE}/proposals/${id}`); return unwrap(res.data);
}
export async function createProposal(payload: UpsertProposalRequest): Promise<Proposal> {
  const res = await api.post<ApiEnvelope<Proposal>>(`${BASE}/proposals`, payload); return unwrap(res.data);
}
export async function updateProposal(id: string, payload: UpsertProposalRequest): Promise<Proposal> {
  const res = await api.put<ApiEnvelope<Proposal>>(`${BASE}/proposals/${id}`, payload); return unwrap(res.data);
}
export async function submitProposal(id: string): Promise<Proposal> {
  const res = await api.post<ApiEnvelope<Proposal>>(`${BASE}/proposals/${id}/submit`, {}); return unwrap(res.data);
}
export async function withdrawProposal(id: string): Promise<Proposal> {
  const res = await api.post<ApiEnvelope<Proposal>>(`${BASE}/proposals/${id}/withdraw`, {}); return unwrap(res.data);
}
export async function duplicateProposal(id: string): Promise<Proposal> {
  const res = await api.post<ApiEnvelope<Proposal>>(`${BASE}/proposals/${id}/duplicate`, {}); return unwrap(res.data);
}
export async function reviseProposal(id: string, payload: UpsertProposalRequest): Promise<Proposal> {
  const res = await api.post<ApiEnvelope<Proposal>>(`${BASE}/proposals/${id}/revise`, payload); return unwrap(res.data);
}
export async function reviewOrderRequest(id: string, accept: boolean): Promise<Proposal> {
  const res = await api.post<ApiEnvelope<Proposal>>(`${BASE}/proposals/${id}/${accept ? "provider-approve" : "provider-decline"}`, {}); return unwrap(res.data);
}
