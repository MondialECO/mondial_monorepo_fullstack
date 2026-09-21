import type {
  NeedsAnalysisResponse,
  UpdateNeedStateRequest,
} from '@/types/creator/needs';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getNeedsAnalysis(ideaId: string): Promise<NeedsAnalysisResponse> {
  const res = await fetch(`/api/creator/phase4/needs?ideaId=${encodeURIComponent(ideaId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to fetch needs analysis (${res.status})`);
  }

  return res.json();
}

export async function generateNeedsAnalysis(ideaId: string): Promise<NeedsAnalysisResponse> {
  const res = await fetch('/api/creator/phase4/needs/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to generate needs analysis (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  return res.json();
}

export async function refreshNeedsAnalysis(ideaId: string): Promise<NeedsAnalysisResponse> {
  const res = await fetch('/api/creator/phase4/needs/refresh', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to refresh needs analysis (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  return res.json();
}

export async function updateNeedState(
  ideaId: string,
  needKey: string,
  req: UpdateNeedStateRequest
): Promise<NeedsAnalysisResponse> {
  const res = await fetch(`/api/creator/phase4/needs/${encodeURIComponent(needKey)}?ideaId=${encodeURIComponent(ideaId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...req, ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update need state (${res.status})`);
  }

  return res.json();
}
