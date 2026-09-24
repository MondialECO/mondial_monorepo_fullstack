import api from '@/lib/axios';
import { 
  getIdeaVersion, 
  setIdeaVersion, 
  rememberIdeaVersion, 
  creatorJourneyApi 
} from '@/lib/api-creator-journey';
import type { ConstructionSnapshotResponse } from '@/types/creator/phase4';

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

export async function getConstructionSnapshot(ideaId: string): Promise<ConstructionSnapshotResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load construction snapshot.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<ConstructionSnapshotResponse> | ConstructionSnapshotResponse>(
    '/creator/phase4/construction-snapshot',
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

export async function generateConstructionSnapshot(
  ideaId: string,
  expectedVersion?: number
): Promise<ConstructionSnapshotResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to generate construction snapshot.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<ConstructionSnapshotResponse> | ConstructionSnapshotResponse>(
    '/creator/phase4/construction-snapshot/generate',
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

export async function refreshConstructionSnapshot(
  ideaId: string,
  expectedVersion?: number
): Promise<ConstructionSnapshotResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to refresh construction snapshot.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<ConstructionSnapshotResponse> | ConstructionSnapshotResponse>(
    '/creator/phase4/construction-snapshot/refresh',
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
