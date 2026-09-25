import api from '@/lib/axios';
import { 
  getIdeaVersion, 
  setIdeaVersion, 
  rememberIdeaVersion, 
  creatorJourneyApi 
} from '@/lib/api-creator-journey';
import type {
  NeedsAnalysisResponse,
  UpdateNeedStateRequest,
} from '@/types/creator/needs';

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
  // Load current journey to get authoritative version
  const journeyRes = await creatorJourneyApi.get(cleanId);
  const fetchedVersion = journeyRes.journey?.ideaVersion;
  if (fetchedVersion && Number.isSafeInteger(fetchedVersion) && fetchedVersion > 0) {
    setIdeaVersion(cleanId, fetchedVersion);
    return fetchedVersion;
  }
  return 1;
}

export async function getNeedsAnalysis(ideaId: string): Promise<NeedsAnalysisResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load needs analysis.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    '/creator/phase4/needs',
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

export async function generateNeedsAnalysis(
  ideaId: string,
  expectedVersion?: number
): Promise<NeedsAnalysisResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to generate needs analysis.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    '/creator/phase4/needs/generate',
    { 
      ideaId: cleanId,
      expectedVersion: version 
    },
    {
      params: { 
        ideaId: cleanId,
        expectedVersion: version 
      },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function refreshNeedsAnalysis(
  ideaId: string,
  expectedVersion?: number
): Promise<NeedsAnalysisResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to refresh needs analysis.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    '/creator/phase4/needs/refresh',
    { 
      ideaId: cleanId,
      expectedVersion: version 
    },
    {
      params: { 
        ideaId: cleanId,
        expectedVersion: version 
      },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function updateNeedState(
  ideaId: string,
  needKey: string,
  req: UpdateNeedStateRequest,
  expectedVersion?: number
): Promise<NeedsAnalysisResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to update need state.');
  }
  if (!needKey || typeof needKey !== 'string' || needKey.trim() === '') {
    throw new Error('needKey is required to update need state.');
  }
  const cleanId = ideaId.trim();
  const cleanKey = needKey.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion ?? req.expectedVersion);

  const payload: UpdateNeedStateRequest = {
    ...req,
    ideaId: cleanId,
    expectedVersion: version,
  };

  const res = await api.patch<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    `/creator/phase4/needs/${encodeURIComponent(cleanKey)}`,
    payload,
    {
      params: { 
        ideaId: cleanId,
        expectedVersion: version 
      },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function keepCurrentNeeds(
  ideaId: string,
  expectedVersion?: number
): Promise<NeedsAnalysisResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to preserve needs version.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    '/creator/phase4/needs/keep-current',
    { 
      ideaId: cleanId,
      expectedVersion: version 
    },
    {
      params: { 
        ideaId: cleanId,
        expectedVersion: version 
      },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}
