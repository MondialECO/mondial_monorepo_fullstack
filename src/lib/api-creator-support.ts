import api from '@/lib/axios';
import {
  getIdeaVersion,
  setIdeaVersion,
  rememberIdeaVersion,
  creatorJourneyApi,
} from '@/lib/api-creator-journey';
import type {
  SupportPlanResponse,
  UpdateFounderSupportStateRequest,
  AnswerEligibilityFactRequest,
} from '@/types/creator/support';

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
  traceId?: string | null;
}

const unwrap = <T>(body: ApiEnvelope<T> | T): T => {
  if (body && typeof body === 'object' && 'data' in (body as ApiEnvelope<T>)) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
};

async function resolveExpectedVersion(cleanId: string, explicitVersion?: number): Promise<number> {
  if (explicitVersion !== undefined && Number.isSafeInteger(explicitVersion) && explicitVersion > 0) {
    return explicitVersion;
  }
  const cached = getIdeaVersion(cleanId);
  if (cached && Number.isSafeInteger(cached) && cached > 0) {
    return cached;
  }
  const journeyRes = await creatorJourneyApi.get(cleanId);
  const fetchedVersion = journeyRes.journey?.ideaVersion;
  if (fetchedVersion && Number.isSafeInteger(fetchedVersion) && fetchedVersion > 0) {
    setIdeaVersion(cleanId, fetchedVersion);
    return fetchedVersion;
  }
  return 1;
}

export async function getSupportPlan(ideaId: string): Promise<SupportPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load support plan.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    '/creator/phase4/support',
    {
      params: { ideaId: cleanId },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function generateSupportPlan(
  ideaId: string,
  expectedVersion?: number
): Promise<SupportPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to generate support plan.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    '/creator/phase4/support/generate',
    { ideaId: cleanId, expectedVersion: version },
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function refreshSupportPlan(
  ideaId: string,
  expectedVersion?: number
): Promise<SupportPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to refresh support plan.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    '/creator/phase4/support/refresh',
    { ideaId: cleanId, expectedVersion: version },
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function updateFounderSupportState(
  ideaId: string,
  matchKey: string,
  req: UpdateFounderSupportStateRequest,
  expectedVersion?: number
): Promise<SupportPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to update support state.');
  }
  if (!matchKey || typeof matchKey !== 'string' || matchKey.trim() === '') {
    throw new Error('matchKey is required to update support state.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion ?? req?.expectedVersion);

  const res = await api.patch<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    `/creator/phase4/support/${encodeURIComponent(matchKey.trim())}`,
    { ...req, ideaId: cleanId, expectedVersion: version },
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function answerEligibilityFact(
  ideaId: string,
  factKey: string,
  value: string,
  expectedVersion?: number
): Promise<SupportPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to answer eligibility fact.');
  }
  if (!factKey || typeof factKey !== 'string' || factKey.trim() === '') {
    throw new Error('factKey is required to answer eligibility fact.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const req: AnswerEligibilityFactRequest = {
    ideaId: cleanId,
    factKey: factKey.trim(),
    value,
    expectedVersion: version,
  };

  const res = await api.patch<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    `/creator/phase4/support/context/${encodeURIComponent(factKey.trim())}`,
    req,
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}
