import api from "@/lib/axios";
import type { ApiEnvelope } from "@/types/service-provider";
import type {
  PricingGuidance,
  ProviderCapacity,
  PublishPackageRequest,
  PublishPackageResult,
  ReorderFaqsRequest,
  ServiceFaq,
  ServiceListing,
  ServiceListingDetail,
  ServicePackage,
  UpdateProviderCapacityRequest,
  UpsertServiceFaqRequest,
  UpsertServiceListingRequest,
  UpsertServicePackageRequest,
} from "@/types/service-catalog";

// REST client for Module 2 — Service Catalog. Mirrors ServiceCatalogController
// (api/service-provider/catalog/*). Every payload is wrapped in the shared
// ApiResponse envelope, so each call unwraps `data`.

const unwrap = <T>(env: ApiEnvelope<T>): T => env.data;
const BASE = "/service-provider/catalog";

// ---- Listings ----
export async function getListings(): Promise<ServiceListing[]> {
  const res = await api.get<ApiEnvelope<ServiceListing[]>>(`${BASE}/listings`);
  return unwrap(res.data);
}

export async function getListing(id: string): Promise<ServiceListingDetail> {
  const res = await api.get<ApiEnvelope<ServiceListingDetail>>(`${BASE}/listings/${id}`);
  return unwrap(res.data);
}

export async function createListing(payload: UpsertServiceListingRequest): Promise<ServiceListing> {
  const res = await api.post<ApiEnvelope<ServiceListing>>(`${BASE}/listings`, payload);
  return unwrap(res.data);
}

export async function updateListing(id: string, payload: UpsertServiceListingRequest): Promise<ServiceListing> {
  const res = await api.put<ApiEnvelope<ServiceListing>>(`${BASE}/listings/${id}`, payload);
  return unwrap(res.data);
}

export async function publishListing(id: string): Promise<ServiceListing> {
  const res = await api.post<ApiEnvelope<ServiceListing>>(`${BASE}/listings/${id}/publish`, {});
  return unwrap(res.data);
}

export async function unpublishListing(id: string): Promise<ServiceListing> {
  const res = await api.post<ApiEnvelope<ServiceListing>>(`${BASE}/listings/${id}/unpublish`, {});
  return unwrap(res.data);
}

// ---- Packages ----
export async function addPackage(listingId: string, payload: UpsertServicePackageRequest): Promise<ServicePackage> {
  const res = await api.post<ApiEnvelope<ServicePackage>>(`${BASE}/listings/${listingId}/packages`, payload);
  return unwrap(res.data);
}

export async function updatePackage(id: string, payload: UpsertServicePackageRequest): Promise<ServicePackage> {
  const res = await api.put<ApiEnvelope<ServicePackage>>(`${BASE}/packages/${id}`, payload);
  return unwrap(res.data);
}

export async function publishPackage(id: string, payload: PublishPackageRequest): Promise<PublishPackageResult> {
  const res = await api.post<ApiEnvelope<PublishPackageResult>>(`${BASE}/packages/${id}/publish`, payload);
  return unwrap(res.data);
}

export async function unpublishPackage(id: string): Promise<ServicePackage> {
  const res = await api.post<ApiEnvelope<ServicePackage>>(`${BASE}/packages/${id}/unpublish`, {});
  return unwrap(res.data);
}

// ---- FAQs ----
export async function addFaq(listingId: string, payload: UpsertServiceFaqRequest): Promise<ServiceFaq> {
  const res = await api.post<ApiEnvelope<ServiceFaq>>(`${BASE}/listings/${listingId}/faqs`, payload);
  return unwrap(res.data);
}

export async function updateFaq(id: string, payload: UpsertServiceFaqRequest): Promise<ServiceFaq> {
  const res = await api.put<ApiEnvelope<ServiceFaq>>(`${BASE}/faqs/${id}`, payload);
  return unwrap(res.data);
}

export async function duplicateFaq(id: string): Promise<ServiceFaq> {
  const res = await api.post<ApiEnvelope<ServiceFaq>>(`${BASE}/faqs/${id}/duplicate`, {});
  return unwrap(res.data);
}

export async function publishFaq(id: string): Promise<ServiceFaq> {
  const res = await api.post<ApiEnvelope<ServiceFaq>>(`${BASE}/faqs/${id}/publish`, {});
  return unwrap(res.data);
}

export async function unpublishFaq(id: string): Promise<ServiceFaq> {
  const res = await api.post<ApiEnvelope<ServiceFaq>>(`${BASE}/faqs/${id}/unpublish`, {});
  return unwrap(res.data);
}

export async function deleteFaq(id: string): Promise<boolean> {
  const res = await api.delete<ApiEnvelope<boolean>>(`${BASE}/faqs/${id}`);
  return unwrap(res.data);
}

export async function reorderFaqs(listingId: string, payload: ReorderFaqsRequest): Promise<ServiceFaq[]> {
  const res = await api.put<ApiEnvelope<ServiceFaq[]>>(`${BASE}/listings/${listingId}/faqs/reorder`, payload);
  return unwrap(res.data);
}

// ---- Capacity ----
export async function getCapacity(): Promise<ProviderCapacity> {
  const res = await api.get<ApiEnvelope<ProviderCapacity>>(`${BASE}/capacity`);
  return unwrap(res.data);
}

export async function updateCapacity(payload: UpdateProviderCapacityRequest): Promise<ProviderCapacity> {
  const res = await api.put<ApiEnvelope<ProviderCapacity>>(`${BASE}/capacity`, payload);
  return unwrap(res.data);
}

// ---- Pricing guidance (deterministic, no AI) ----
export async function getPricingGuidance(category: string, pricingModel?: string): Promise<PricingGuidance> {
  const res = await api.get<ApiEnvelope<PricingGuidance>>(`${BASE}/pricing-guidance`, {
    params: { category, pricingModel },
  });
  return unwrap(res.data);
}
