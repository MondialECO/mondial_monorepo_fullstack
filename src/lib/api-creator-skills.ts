import api from '@/lib/axios';
import { 
  getIdeaVersion, 
  setIdeaVersion, 
  rememberIdeaVersion, 
  creatorJourneyApi 
} from '@/lib/api-creator-journey';
import type {
  SkillsPlanResponse,
  UpdateResolutionRequest,
} from '@/types/creator/skills';

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

export async function getSkillsPlan(ideaId: string): Promise<SkillsPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load skills plan.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    '/creator/phase4/skills-plan',
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

export async function generateSkillsPlan(
  ideaId: string,
  expectedVersion?: number
): Promise<SkillsPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to generate skills plan.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    '/creator/phase4/skills-plan/generate',
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

export async function refreshSkillsPlan(
  ideaId: string,
  expectedVersion?: number
): Promise<SkillsPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to refresh skills plan.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    '/creator/phase4/skills-plan/refresh',
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

export async function updateResolution(
  ideaId: string,
  resolutionKey: string,
  req: UpdateResolutionRequest,
  expectedVersion?: number
): Promise<SkillsPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to update resolution.');
  }
  if (!resolutionKey || typeof resolutionKey !== 'string' || resolutionKey.trim() === '') {
    throw new Error('resolutionKey is required to update resolution.');
  }
  const cleanId = ideaId.trim();
  const cleanKey = resolutionKey.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion ?? req.expectedVersion);

  const payload: UpdateResolutionRequest = {
    ...req,
    ideaId: cleanId,
    expectedVersion: version,
  };

  const res = await api.patch<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    `/creator/phase4/skills-plan/${encodeURIComponent(cleanKey)}`,
    payload,
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

export async function keepCurrentSkills(
  ideaId: string,
  expectedVersion?: number
): Promise<SkillsPlanResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to preserve skills version.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    '/creator/phase4/skills-plan/keep-current',
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


