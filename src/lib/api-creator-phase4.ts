import { ConstructionSnapshotResponse } from '@/types/creator/phase4';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5093';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getConstructionSnapshot(ideaId: string): Promise<ConstructionSnapshotResponse> {
  const res = await fetch(`${BASE_URL}/api/creator/phase4/construction-snapshot?ideaId=${encodeURIComponent(ideaId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch snapshot (status ${res.status})`);
  }

  return res.json();
}

export async function generateConstructionSnapshot(ideaId: string): Promise<ConstructionSnapshotResponse> {
  const res = await fetch(`${BASE_URL}/api/creator/phase4/construction-snapshot/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to generate snapshot (status ${res.status})`);
  }

  return res.json();
}

export async function refreshConstructionSnapshot(ideaId: string): Promise<ConstructionSnapshotResponse> {
  const res = await fetch(`${BASE_URL}/api/creator/phase4/construction-snapshot/refresh`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to refresh snapshot (status ${res.status})`);
  }

  return res.json();
}
