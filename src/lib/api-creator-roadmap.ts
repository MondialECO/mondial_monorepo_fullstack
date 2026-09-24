import api from '@/lib/axios';
import type {
  OperationalRoadmapResponse,
  UpdateRoadmapTaskRequest,
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

export async function getOperationalRoadmap(ideaId: string): Promise<OperationalRoadmapResponse> {
  const res = await api.get<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap',
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

export async function generateOperationalRoadmap(ideaId: string): Promise<OperationalRoadmapResponse> {
  const res = await api.post<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/generate',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function refreshOperationalRoadmap(ideaId: string): Promise<OperationalRoadmapResponse> {
  const res = await api.post<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/refresh',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function updateRoadmapTask(
  ideaId: string,
  req: UpdateRoadmapTaskRequest
): Promise<OperationalRoadmapResponse> {
  const res = await api.patch<ApiEnvelope<OperationalRoadmapResponse> | OperationalRoadmapResponse>(
    '/creator/phase4/roadmap/task',
    { ...req, ideaId }
  );
  return unwrap(res.data);
}

