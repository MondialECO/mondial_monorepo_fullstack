import api from '@/lib/axios';
import type {
  SupportPlanResponse,
  UpdateFounderSupportStateRequest,
  AnswerEligibilityFactRequest,
} from '@/types/creator/support';

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

export async function getSupportPlan(ideaId: string): Promise<SupportPlanResponse> {
  const res = await api.get<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    '/creator/phase4/support',
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

export async function generateSupportPlan(ideaId: string): Promise<SupportPlanResponse> {
  const res = await api.post<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    '/creator/phase4/support/generate',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function refreshSupportPlan(ideaId: string): Promise<SupportPlanResponse> {
  const res = await api.post<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    '/creator/phase4/support/refresh',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function updateFounderSupportState(
  ideaId: string,
  matchKey: string,
  req: UpdateFounderSupportStateRequest
): Promise<SupportPlanResponse> {
  const res = await api.patch<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    `/creator/phase4/support/${encodeURIComponent(matchKey)}`,
    { ...req, ideaId },
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

export async function answerEligibilityFact(
  ideaId: string,
  factKey: string,
  value: string
): Promise<SupportPlanResponse> {
  const req: AnswerEligibilityFactRequest = {
    ideaId,
    factKey,
    value,
  };

  const res = await api.patch<ApiEnvelope<SupportPlanResponse> | SupportPlanResponse>(
    `/creator/phase4/support/context/${encodeURIComponent(factKey)}`,
    req,
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}
