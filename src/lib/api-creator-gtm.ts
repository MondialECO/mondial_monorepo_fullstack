/**
 * Client API methods for Creator Phase 4.7 — GTM & Launch Strategy Engine.
 */

import api from '@/lib/axios';
import {
  getIdeaVersion,
  setIdeaVersion,
  rememberIdeaVersion,
  creatorJourneyApi,
} from '@/lib/api-creator-journey';
import type {
  GtmStrategyResponse,
  UpdateGtmChannelRequest,
  RecordExperimentRunRequest,
  UpdateGtmStrategyRequest,
} from '@/types/creator/gtm';

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

export async function getGtmStrategy(ideaId: string): Promise<GtmStrategyResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load GTM strategy.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    '/creator/phase4/gtm',
    {
      params: { ideaId: cleanId },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if ((data as any)?.ideaVersion && Number.isSafeInteger((data as any).ideaVersion) && (data as any).ideaVersion > 0) {
    setIdeaVersion(cleanId, (data as any).ideaVersion);
  }
  return data;
}

export async function generateGtmStrategy(
  ideaId: string,
  expectedVersion?: number
): Promise<GtmStrategyResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to generate GTM strategy.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    '/creator/phase4/gtm/generate',
    { ideaId: cleanId, expectedVersion: version },
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if ((data as any)?.ideaVersion && Number.isSafeInteger((data as any).ideaVersion) && (data as any).ideaVersion > 0) {
    setIdeaVersion(cleanId, (data as any).ideaVersion);
  }
  return data;
}

export async function refreshGtmStrategy(
  ideaId: string,
  expectedVersion?: number
): Promise<GtmStrategyResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to refresh GTM strategy.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    '/creator/phase4/gtm/refresh',
    { ideaId: cleanId, expectedVersion: version },
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if ((data as any)?.ideaVersion && Number.isSafeInteger((data as any).ideaVersion) && (data as any).ideaVersion > 0) {
    setIdeaVersion(cleanId, (data as any).ideaVersion);
  }
  return data;
}

export async function updateGtmChannel(
  channelKey: string,
  req: UpdateGtmChannelRequest,
  ideaId?: string,
  expectedVersion?: number
): Promise<GtmStrategyResponse> {
  const effectiveIdeaId = (ideaId || req.ideaId || '').trim();
  if (!effectiveIdeaId) {
    throw new Error('ideaId is required to update GTM channel.');
  }
  const version = await resolveExpectedVersion(effectiveIdeaId, expectedVersion ?? (req as any)?.expectedVersion);

  const res = await api.patch<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    `/creator/phase4/gtm/${encodeURIComponent(channelKey)}`,
    { ...req, ideaId: effectiveIdeaId, expectedVersion: version },
    {
      params: { ideaId: effectiveIdeaId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, effectiveIdeaId);
  const data = unwrap(res.data);
  if ((data as any)?.ideaVersion && Number.isSafeInteger((data as any).ideaVersion) && (data as any).ideaVersion > 0) {
    setIdeaVersion(effectiveIdeaId, (data as any).ideaVersion);
  }
  return data;
}

export async function recordExperimentRun(
  experimentKey: string,
  req: RecordExperimentRunRequest,
  ideaId?: string,
  expectedVersion?: number
): Promise<GtmStrategyResponse> {
  const effectiveIdeaId = (ideaId || req.ideaId || '').trim();
  if (!effectiveIdeaId) {
    throw new Error('ideaId is required to record experiment run.');
  }
  const version = await resolveExpectedVersion(effectiveIdeaId, expectedVersion ?? (req as any)?.expectedVersion);

  const res = await api.patch<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    `/creator/phase4/gtm/experiments/${encodeURIComponent(experimentKey)}`,
    { ...req, ideaId: effectiveIdeaId, expectedVersion: version },
    {
      params: { ideaId: effectiveIdeaId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, effectiveIdeaId);
  const data = unwrap(res.data);
  if ((data as any)?.ideaVersion && Number.isSafeInteger((data as any).ideaVersion) && (data as any).ideaVersion > 0) {
    setIdeaVersion(effectiveIdeaId, (data as any).ideaVersion);
  }
  return data;
}

export async function updateGtmStrategy(
  req: UpdateGtmStrategyRequest,
  ideaId?: string,
  expectedVersion?: number
): Promise<GtmStrategyResponse> {
  const effectiveIdeaId = (ideaId || req.ideaId || '').trim();
  if (!effectiveIdeaId) {
    throw new Error('ideaId is required to update GTM strategy.');
  }
  const version = await resolveExpectedVersion(effectiveIdeaId, expectedVersion ?? (req as any)?.expectedVersion);

  const res = await api.patch<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    '/creator/phase4/gtm',
    { ...req, ideaId: effectiveIdeaId, expectedVersion: version },
    {
      params: { ideaId: effectiveIdeaId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, effectiveIdeaId);
  const data = unwrap(res.data);
  if ((data as any)?.ideaVersion && Number.isSafeInteger((data as any).ideaVersion) && (data as any).ideaVersion > 0) {
    setIdeaVersion(effectiveIdeaId, (data as any).ideaVersion);
  }
  return data;
}

