import api from '@/lib/axios';
import { 
  getIdeaVersion, 
  setIdeaVersion, 
  rememberIdeaVersion, 
  creatorJourneyApi 
} from '@/lib/api-creator-journey';
import type {
  OperationalRoadmapResponse,
  UpdateRoadmapTaskRequest,
  UpdateAvailabilityRequest,
} from '@/types/creator/roadmap';

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

export async function getOperationalRoadmap(ideaId: string): Promise<OperationalRoadmapResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load operational roadmap.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap',
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

export async function generateOperationalRoadmap(
  ideaId: string,
  expectedVersion?: number
): Promise<OperationalRoadmapResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to generate operational roadmap.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/generate',
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

export async function refreshOperationalRoadmap(
  ideaId: string,
  expectedVersion?: number
): Promise<OperationalRoadmapResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to refresh operational roadmap.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/refresh',
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

export async function updateRoadmapTask(
  ideaId: string,
  req: UpdateRoadmapTaskRequest,
  expectedVersion?: number
): Promise<OperationalRoadmapResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to update roadmap task.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion || req.expectedVersion);

  const res = await api.patch<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/task',
    { 
      ...req, 
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

export async function activateOperationalRoadmap(
  ideaId: string,
  expectedVersion?: number
): Promise<OperationalRoadmapResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to activate operational roadmap.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/activate',
    {
      ideaId: cleanId,
      expectedVersion: version,
    },
    {
      params: {
        ideaId: cleanId,
        expectedVersion: version,
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

export async function updateWeeklyAvailability(
  ideaId: string,
  weeklyAvailability: string,
  expectedVersion?: number
): Promise<OperationalRoadmapResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to update weekly availability.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.put<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/availability',
    {
      ideaId: cleanId,
      expectedVersion: version,
      weeklyAvailability,
    },
    {
      params: {
        ideaId: cleanId,
        expectedVersion: version,
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

export async function keepCurrentRoadmap(
  ideaId: string,
  expectedVersion?: number
): Promise<OperationalRoadmapResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to preserve current roadmap.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/keep-current',
    {
      ideaId: cleanId,
      expectedVersion: version,
    },
    {
      params: {
        ideaId: cleanId,
        expectedVersion: version,
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
