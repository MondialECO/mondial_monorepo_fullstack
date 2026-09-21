import type {
  PricingStrategyResponse,
  UpdatePricingOfferRequest,
} from '@/types/creator/pricing';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getPricingStrategy(ideaId: string): Promise<PricingStrategyResponse> {
  const res = await fetch(`/api/creator/phase4/pricing?ideaId=${encodeURIComponent(ideaId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to fetch pricing strategy (${res.status})`);
  }

  const json = await res.json();
  return json.data || json;
}

export async function generatePricingStrategy(ideaId: string): Promise<PricingStrategyResponse> {
  const res = await fetch('/api/creator/phase4/pricing/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to generate pricing strategy (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  const json = await res.json();
  return json.data || json;
}

export async function refreshPricingStrategy(ideaId: string): Promise<PricingStrategyResponse> {
  const res = await fetch('/api/creator/phase4/pricing/refresh', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to refresh pricing strategy (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  const json = await res.json();
  return json.data || json;
}

export async function updatePricingOffer(
  ideaId: string,
  offerKey: string,
  req: UpdatePricingOfferRequest
): Promise<PricingStrategyResponse> {
  const res = await fetch(
    `/api/creator/phase4/pricing/${encodeURIComponent(offerKey)}?ideaId=${encodeURIComponent(ideaId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(req),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update pricing offer (${res.status})`);
  }

  const json = await res.json();
  return json.data || json;
}
