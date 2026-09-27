/**
 * Client API methods for Creator Phase 4.9 — Construction Readiness.
 */

import api from '@/lib/axios';
import {
  getIdeaVersion,
  setIdeaVersion,
  rememberIdeaVersion,
  creatorJourneyApi,
} from '@/lib/api-creator-journey';
import type {
  ConstructionReadinessResponse,
  SaveConstructionReadinessRequest,
} from '@/types/creator/construction-readiness';

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

export async function getReadinessAssessment(ideaId: string): Promise<ConstructionReadinessResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load Construction Readiness.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<ConstructionReadinessResponse> | ConstructionReadinessResponse>(
    '/creator/phase4/readiness',
    {
      params: { ideaId: cleanId },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const unwrapped = unwrap(res.data);
  if (unwrapped?.ideaVersion) {
    setIdeaVersion(cleanId, unwrapped.ideaVersion);
  }
  return unwrapped;
}

export async function saveReadinessReview(
  ideaId: string,
  explicitVersion?: number,
  sourceFingerprint?: string
): Promise<ConstructionReadinessResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to save Construction Readiness review.');
  }
  const cleanId = ideaId.trim();
  const expectedVersion = await resolveExpectedVersion(cleanId, explicitVersion);

  const payload: SaveConstructionReadinessRequest = {
    ideaId: cleanId,
    expectedVersion,
    sourceFingerprint,
  };

  const res = await api.post<ApiEnvelope<ConstructionReadinessResponse> | ConstructionReadinessResponse>(
    '/creator/phase4/readiness/save',
    payload,
    {
      params: { ideaId: cleanId, expectedVersion },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const unwrapped = unwrap(res.data);
  if (unwrapped?.ideaVersion) {
    setIdeaVersion(cleanId, unwrapped.ideaVersion);
  }
  return unwrapped;
}
