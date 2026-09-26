/**
 * Client API methods for Creator Phase 4.8 — Launch Assets Engine.
 */

import api from '@/lib/axios';
import {
  getIdeaVersion,
  setIdeaVersion,
  rememberIdeaVersion,
  creatorJourneyApi,
} from '@/lib/api-creator-journey';
import type {
  LaunchAssetsResponse,
  UpdateLaunchAssetsRequest,
  GenerateLaunchAssetsRequest,
} from '@/types/creator/launch-assets';

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

export async function getLaunchAssets(ideaId: string): Promise<LaunchAssetsResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load Launch Assets.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<LaunchAssetsResponse> | LaunchAssetsResponse>(
    '/creator/phase4/assets',
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

export async function generateLaunchAssets(
  ideaId: string,
  expectedVersion?: number
): Promise<LaunchAssetsResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to generate Launch Assets.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<LaunchAssetsResponse> | LaunchAssetsResponse>(
    '/creator/phase4/assets/generate',
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

export async function refreshLaunchAssets(
  ideaId: string,
  expectedVersion?: number
): Promise<LaunchAssetsResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to refresh Launch Assets.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<LaunchAssetsResponse> | LaunchAssetsResponse>(
    '/creator/phase4/assets/refresh',
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

export async function updateLaunchAssets(
  ideaId: string,
  payload: UpdateLaunchAssetsRequest,
  expectedVersion?: number
): Promise<LaunchAssetsResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to update Launch Assets.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const body: UpdateLaunchAssetsRequest = {
    ...payload,
    ideaId: cleanId,
    expectedVersion: version,
  };

  const res = await api.patch<ApiEnvelope<LaunchAssetsResponse> | LaunchAssetsResponse>(
    '/creator/phase4/assets',
    body,
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

export async function createNewVersion(
  ideaId: string,
  expectedVersion?: number
): Promise<LaunchAssetsResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to create a new version.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<LaunchAssetsResponse> | LaunchAssetsResponse>(
    '/creator/phase4/assets/new-version',
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

export async function selectVersion(
  ideaId: string,
  versionNumber?: number,
  expectedVersion?: number
): Promise<LaunchAssetsResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to select version.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<LaunchAssetsResponse> | LaunchAssetsResponse>(
    '/creator/phase4/assets/select-version',
    { ideaId: cleanId, versionNumber, expectedVersion: version },
    {
      params: {
        ideaId: cleanId,
        ...(versionNumber !== undefined ? { versionNumber } : {}),
        expectedVersion: version,
      },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if ((data as any)?.ideaVersion && Number.isSafeInteger((data as any).ideaVersion) && (data as any).ideaVersion > 0) {
    setIdeaVersion(cleanId, (data as any).ideaVersion);
  }
  return data;
}

export async function getSourceCode(ideaId: string, versionNumber?: number): Promise<string> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to get source code.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<string>('/creator/phase4/assets/source', {
    params: {
      ideaId: cleanId,
      ...(versionNumber !== undefined ? { version: versionNumber } : {}),
    },
    responseType: 'text',
  });
  return res.data;
}
