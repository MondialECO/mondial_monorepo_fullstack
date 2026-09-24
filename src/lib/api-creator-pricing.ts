import api from '@/lib/axios';
import type {
  PricingStrategyResponse,
  UpdatePricingOfferRequest,
} from '@/types/creator/pricing';

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

export async function getPricingStrategy(ideaId: string): Promise<PricingStrategyResponse> {
  const res = await api.get<ApiEnvelope<PricingStrategyResponse> | PricingStrategyResponse>(
    '/creator/phase4/pricing',
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

export async function generatePricingStrategy(ideaId: string): Promise<PricingStrategyResponse> {
  const res = await api.post<ApiEnvelope<PricingStrategyResponse> | PricingStrategyResponse>(
    '/creator/phase4/pricing/generate',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function refreshPricingStrategy(ideaId: string): Promise<PricingStrategyResponse> {
  const res = await api.post<ApiEnvelope<PricingStrategyResponse> | PricingStrategyResponse>(
    '/creator/phase4/pricing/refresh',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function updatePricingOffer(
  ideaId: string,
  offerKey: string,
  req: UpdatePricingOfferRequest
): Promise<PricingStrategyResponse> {
  const res = await api.patch<ApiEnvelope<PricingStrategyResponse> | PricingStrategyResponse>(
    `/creator/phase4/pricing/${encodeURIComponent(offerKey)}`,
    { ...req, ideaId },
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}
