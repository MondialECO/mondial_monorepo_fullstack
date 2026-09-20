import type {
  OperationalRoadmapResponse,
  UpdateRoadmapTaskRequest,
} from '@/types/creator/roadmap';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getOperationalRoadmap(ideaId: string): Promise<OperationalRoadmapResponse> {
  const res = await fetch(`/api/creator/phase4/roadmap?ideaId=${encodeURIComponent(ideaId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to fetch operational roadmap (${res.status})`);
  }

  return res.json();
}

export async function generateOperationalRoadmap(ideaId: string): Promise<OperationalRoadmapResponse> {
  const res = await fetch('/api/creator/phase4/roadmap/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to generate operational roadmap (${res.status})`);
  }

  return res.json();
}

export async function refreshOperationalRoadmap(ideaId: string): Promise<OperationalRoadmapResponse> {
  const res = await fetch('/api/creator/phase4/roadmap/refresh', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to refresh operational roadmap (${res.status})`);
  }

  return res.json();
}

export async function updateRoadmapTask(
  ideaId: string,
  req: UpdateRoadmapTaskRequest
): Promise<OperationalRoadmapResponse> {
  const res = await fetch(`/api/creator/phase4/roadmap/task?ideaId=${encodeURIComponent(ideaId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to update roadmap task (${res.status})`);
  }

  return res.json();
}
