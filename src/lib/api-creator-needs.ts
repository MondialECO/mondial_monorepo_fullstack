import api from '@/lib/axios';
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

export async function getNeedsAnalysis(ideaId: string): Promise<NeedsAnalysisResponse> {
  const res = await api.get<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    '/creator/phase4/needs',
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

export async function generateNeedsAnalysis(ideaId: string): Promise<NeedsAnalysisResponse> {
  const res = await api.post<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    '/creator/phase4/needs/generate',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function refreshNeedsAnalysis(ideaId: string): Promise<NeedsAnalysisResponse> {
  const res = await api.post<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    '/creator/phase4/needs/refresh',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function updateNeedState(
  ideaId: string,
  needKey: string,
  req: UpdateNeedStateRequest
): Promise<NeedsAnalysisResponse> {
  const res = await api.patch<ApiEnvelope<NeedsAnalysisResponse> | NeedsAnalysisResponse>(
    `/creator/phase4/needs/${encodeURIComponent(needKey)}`,
    { ...req, ideaId },
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

