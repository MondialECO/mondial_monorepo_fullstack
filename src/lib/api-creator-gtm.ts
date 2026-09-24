/**
 * Client API methods for Creator Phase 4.7 — GTM & Launch Strategy Engine.
 */

import api from '@/lib/axios';
import type {
  GtmStrategyResponse,
  UpdateGtmChannelRequest,
  RecordExperimentRunRequest,
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

export async function getGtmStrategy(ideaId?: string): Promise<GtmStrategyResponse> {
  const res = await api.get<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    '/creator/phase4/gtm',
    {
      params: ideaId ? { ideaId } : undefined,
    }
  );
  return unwrap(res.data);
}

export async function generateGtmStrategy(ideaId?: string): Promise<GtmStrategyResponse> {
  const res = await api.post<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    '/creator/phase4/gtm/generate',
    { ideaId: ideaId || null }
  );
  return unwrap(res.data);
}

export async function refreshGtmStrategy(ideaId?: string): Promise<GtmStrategyResponse> {
  const res = await api.post<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    '/creator/phase4/gtm/refresh',
    { ideaId: ideaId || null }
  );
  return unwrap(res.data);
}

export async function updateGtmChannel(
  channelKey: string,
  req: UpdateGtmChannelRequest,
  ideaId?: string
): Promise<GtmStrategyResponse> {
  const effectiveIdeaId = ideaId || req.ideaId;
  const res = await api.patch<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    `/creator/phase4/gtm/${encodeURIComponent(channelKey)}`,
    { ...req, ideaId: effectiveIdeaId },
    {
      params: effectiveIdeaId ? { ideaId: effectiveIdeaId } : undefined,
    }
  );
  return unwrap(res.data);
}

export async function recordExperimentRun(
  experimentKey: string,
  req: RecordExperimentRunRequest,
  ideaId?: string
): Promise<GtmStrategyResponse> {
  const effectiveIdeaId = ideaId || req.ideaId;
  const res = await api.patch<ApiEnvelope<GtmStrategyResponse> | GtmStrategyResponse>(
    `/creator/phase4/gtm/experiments/${encodeURIComponent(experimentKey)}`,
    { ...req, ideaId: effectiveIdeaId },
    {
      params: effectiveIdeaId ? { ideaId: effectiveIdeaId } : undefined,
    }
  );
  return unwrap(res.data);
}
