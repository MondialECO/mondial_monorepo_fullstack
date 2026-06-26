import api from "@/lib/axios";
import type { PendingProvider } from "@/types/admin-service-provider";
import type {
  ApiEnvelope,
  VerificationStatusResponse,
} from "@/types/service-provider";

// REST client for admin moderation of Service Provider verification. Mirrors
// ServiceProviderAdminController routes (api/admin/service-provider/*). Responses
// use the shared ApiResponse envelope, so each call unwraps `data`. Errors
// propagate — TanStack Query surfaces them.

const unwrap = <T>(envelope: ApiEnvelope<T>): T => envelope.data;

export async function getPendingProviders(): Promise<PendingProvider[]> {
  const res = await api.get<ApiEnvelope<PendingProvider[]>>(
    "/admin/service-provider/pending"
  );
  return unwrap(res.data);
}

export async function approveProvider(
  userId: string
): Promise<VerificationStatusResponse> {
  const res = await api.post<ApiEnvelope<VerificationStatusResponse>>(
    `/admin/service-provider/verification/${userId}/approve`
  );
  return unwrap(res.data);
}

export async function rejectProvider(
  userId: string,
  reason: string
): Promise<VerificationStatusResponse> {
  const res = await api.post<ApiEnvelope<VerificationStatusResponse>>(
    `/admin/service-provider/verification/${userId}/reject`,
    { reason }
  );
  return unwrap(res.data);
}
