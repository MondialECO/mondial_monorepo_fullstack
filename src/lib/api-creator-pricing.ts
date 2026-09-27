import api from '@/lib/axios';
import {
  getIdeaVersion,
  setIdeaVersion,
  rememberIdeaVersion,
  creatorJourneyApi,
} from '@/lib/api-creator-journey';
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

export async function getPricingStrategy(ideaId: string): Promise<PricingStrategyResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to load pricing strategy.');
  }
  const cleanId = ideaId.trim();
  const res = await api.get<ApiEnvelope<PricingStrategyResponse> | PricingStrategyResponse>(
    '/creator/phase4/pricing',
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

export async function generatePricingStrategy(
  ideaId: string,
  expectedVersion?: number
): Promise<PricingStrategyResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to generate pricing strategy.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<PricingStrategyResponse> | PricingStrategyResponse>(
    '/creator/phase4/pricing/generate',
    { ideaId: cleanId, expectedVersion: version },
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function refreshPricingStrategy(
  ideaId: string,
  expectedVersion?: number
): Promise<PricingStrategyResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to refresh pricing strategy.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion);

  const res = await api.post<ApiEnvelope<PricingStrategyResponse> | PricingStrategyResponse>(
    '/creator/phase4/pricing/refresh',
    { ideaId: cleanId, expectedVersion: version },
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}

export async function updatePricingOffer(
  ideaId: string,
  offerKey: string,
  req: UpdatePricingOfferRequest,
  expectedVersion?: number
): Promise<PricingStrategyResponse> {
  if (!ideaId || typeof ideaId !== 'string' || ideaId.trim() === '') {
    throw new Error('ideaId is required to update pricing offer.');
  }
  if (!offerKey || typeof offerKey !== 'string' || offerKey.trim() === '') {
    throw new Error('offerKey is required to update pricing offer.');
  }
  const cleanId = ideaId.trim();
  const version = await resolveExpectedVersion(cleanId, expectedVersion ?? req?.expectedVersion);

  const payload = {
    ...req,
    ideaId: cleanId,
    expectedVersion: version,
    notes: req.founderNotes || (req as any).notes,
    includedFeatures: req.featuresIncluded || (req as any).includedFeatures,
  };

  const res = await api.patch<ApiEnvelope<PricingStrategyResponse> | PricingStrategyResponse>(
    `/creator/phase4/pricing/${encodeURIComponent(offerKey.trim())}`,
    payload,
    {
      params: { ideaId: cleanId, expectedVersion: version },
    }
  );
  rememberIdeaVersion(res, cleanId);
  const data = unwrap(res.data);
  if (data?.ideaVersion && Number.isSafeInteger(data.ideaVersion) && data.ideaVersion > 0) {
    setIdeaVersion(cleanId, data.ideaVersion);
  }
  return data;
}
