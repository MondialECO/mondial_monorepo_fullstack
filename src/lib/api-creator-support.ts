import type {
  SupportPlanResponse,
  UpdateFounderSupportStateRequest,
  AnswerEligibilityFactRequest,
} from '@/types/creator/support';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getSupportPlan(ideaId: string): Promise<SupportPlanResponse> {
  const res = await fetch(`/api/creator/phase4/support?ideaId=${encodeURIComponent(ideaId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to fetch support plan (${res.status})`);
  }

  const json = await res.json();
  return json.data || json;
}

export async function generateSupportPlan(ideaId: string): Promise<SupportPlanResponse> {
  const res = await fetch('/api/creator/phase4/support/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to generate support plan (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  const json = await res.json();
  return json.data || json;
}

export async function refreshSupportPlan(ideaId: string): Promise<SupportPlanResponse> {
  const res = await fetch('/api/creator/phase4/support/refresh', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to refresh support plan (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  const json = await res.json();
  return json.data || json;
}

export async function updateFounderSupportState(
  ideaId: string,
  matchKey: string,
  req: UpdateFounderSupportStateRequest
): Promise<SupportPlanResponse> {
  const res = await fetch(
    `/api/creator/phase4/support/${encodeURIComponent(matchKey)}?ideaId=${encodeURIComponent(ideaId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(req),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update support state (${res.status})`);
  }

  const json = await res.json();
  return json.data || json;
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

  const res = await fetch(
    `/api/creator/phase4/support/context/${encodeURIComponent(factKey)}?ideaId=${encodeURIComponent(ideaId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(req),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update eligibility fact (${res.status})`);
  }

  const json = await res.json();
  return json.data || json;
}
