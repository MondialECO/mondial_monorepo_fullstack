import api from "@/lib/axios";
import type {
  AddPortfolioItemRequest,
  ApiEnvelope,
  ServiceProviderProfile,
  SkillsTestQuestions,
  SkillsTestResult,
  SkillsTestStatus,
  SubmitSkillsTestRequest,
  SubmitVerificationRequest,
  TrustBreakdown,
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

// ---- Module 1: Profile & Trust ----

export async function getTrust(): Promise<TrustBreakdown> {
  const res = await api.get<ApiEnvelope<TrustBreakdown>>(
    "/service-provider/trust"
  );
  return unwrap(res.data);
}

export async function getSkillsTestStatus(): Promise<SkillsTestStatus> {
  const res = await api.get<ApiEnvelope<SkillsTestStatus>>(
    "/service-provider/skills-test/status"
  );
  return unwrap(res.data);
}

export async function getSkillsTestQuestions(
  category: string
): Promise<SkillsTestQuestions> {
  const res = await api.get<ApiEnvelope<SkillsTestQuestions>>(
    "/service-provider/skills-test/questions",
    { params: { category } }
  );
  return unwrap(res.data);
}

export async function submitSkillsTest(
  payload: SubmitSkillsTestRequest
): Promise<SkillsTestResult> {
  const res = await api.post<ApiEnvelope<SkillsTestResult>>(
    "/service-provider/skills-test/submit",
    payload
  );
  return unwrap(res.data);
}
