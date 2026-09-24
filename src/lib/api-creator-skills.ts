import api from '@/lib/axios';
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

export async function getSkillsPlan(ideaId: string): Promise<SkillsPlanResponse> {
  const res = await api.get<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    '/creator/phase4/skills-plan',
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

export async function generateSkillsPlan(ideaId: string): Promise<SkillsPlanResponse> {
  const res = await api.post<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    '/creator/phase4/skills-plan/generate',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function refreshSkillsPlan(ideaId: string): Promise<SkillsPlanResponse> {
  const res = await api.post<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    '/creator/phase4/skills-plan/refresh',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function updateResolution(
  ideaId: string,
  resolutionKey: string,
  req: UpdateResolutionRequest
): Promise<SkillsPlanResponse> {
  const res = await api.patch<ApiEnvelope<SkillsPlanResponse> | SkillsPlanResponse>(
    `/creator/phase4/skills-plan/${encodeURIComponent(resolutionKey)}`,
    { ...req, ideaId },
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

