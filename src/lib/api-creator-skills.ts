import type {
  SkillsPlanResponse,
  UpdateResolutionRequest,
} from '@/types/creator/skills';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getSkillsPlan(ideaId: string): Promise<SkillsPlanResponse> {
  const res = await fetch(`/api/creator/phase4/skills-plan?ideaId=${encodeURIComponent(ideaId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to fetch skills plan (${res.status})`);
  }

  const json = await res.json();
  return json.data || json;
}

export async function generateSkillsPlan(ideaId: string): Promise<SkillsPlanResponse> {
  const res = await fetch('/api/creator/phase4/skills-plan/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to generate skills plan (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  const json = await res.json();
  return json.data || json;
}

export async function refreshSkillsPlan(ideaId: string): Promise<SkillsPlanResponse> {
  const res = await fetch('/api/creator/phase4/skills-plan/refresh', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to refresh skills plan (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  const json = await res.json();
  return json.data || json;
}

export async function updateResolution(
  ideaId: string,
  resolutionKey: string,
  req: UpdateResolutionRequest
): Promise<SkillsPlanResponse> {
  const res = await fetch(
    `/api/creator/phase4/skills-plan/${encodeURIComponent(resolutionKey)}?ideaId=${encodeURIComponent(ideaId)}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...req, ideaId }),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err: any = new Error(data.message || `Failed to update resolution (${res.status})`);
    if (data.code) err.code = data.code;
    throw err;
  }

  const json = await res.json();
  return json.data || json;
}
