import api from "@/lib/axios";
import type {
  AddPortfolioItemRequest,
  ApiEnvelope,
  ServiceProviderProfile,
  SubmitVerificationRequest,
  UpdatePortfolioItemRequest,
  UpsertProfileRequest,
  VerificationStatusResponse,
} from "@/types/service-provider";

// REST client for the Service Provider domain. Mirrors ServiceProviderController
// routes (api/service-provider/*). Unlike most peers, this surface wraps payloads
// in the shared ApiResponse envelope, so every call unwraps `data`. Errors
// propagate — TanStack Query surfaces them.

const unwrap = <T>(envelope: ApiEnvelope<T>): T => envelope.data;

export async function getProfile(): Promise<ServiceProviderProfile> {
  const res = await api.get<ApiEnvelope<ServiceProviderProfile>>(
    "/service-provider/profile"
  );
  return unwrap(res.data);
}

export async function upsertProfile(
  payload: UpsertProfileRequest
): Promise<ServiceProviderProfile> {
  const res = await api.put<ApiEnvelope<ServiceProviderProfile>>(
    "/service-provider/profile",
    payload
  );
  return unwrap(res.data);
}

export async function addPortfolioItem(
  payload: AddPortfolioItemRequest
): Promise<ServiceProviderProfile> {
  const res = await api.post<ApiEnvelope<ServiceProviderProfile>>(
    "/service-provider/portfolio",
    payload
  );
  return unwrap(res.data);
}

export async function updatePortfolioItem(
  payload: UpdatePortfolioItemRequest
): Promise<ServiceProviderProfile> {
  const res = await api.put<ApiEnvelope<ServiceProviderProfile>>(
    "/service-provider/portfolio",
    payload
  );
  return unwrap(res.data);
}

export async function deletePortfolioItem(
  index: number
): Promise<ServiceProviderProfile> {
  const res = await api.delete<ApiEnvelope<ServiceProviderProfile>>(
    `/service-provider/portfolio/${index}`
  );
  return unwrap(res.data);
}

export async function submitVerification(
  payload: SubmitVerificationRequest
): Promise<VerificationStatusResponse> {
  const res = await api.post<ApiEnvelope<VerificationStatusResponse>>(
    "/service-provider/submit-verification",
    payload
  );
  return unwrap(res.data);
}
