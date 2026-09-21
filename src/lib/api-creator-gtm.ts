/**
 * Client API methods for Creator Phase 4.7 — GTM & Launch Strategy Engine.
 */

import {
  GtmStrategyResponse,
  UpdateGtmChannelRequest,
  RecordExperimentRunRequest
} from '@/types/creator/gtm';

const BASE_URL = '/api/creator/phase4/gtm';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function getGtmStrategy(ideaId?: string): Promise<GtmStrategyResponse> {
  const url = ideaId ? `${BASE_URL}?ideaId=${encodeURIComponent(ideaId)}` : BASE_URL;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to fetch GTM strategy' }));
    throw new Error(err.message || 'Failed to fetch GTM strategy');
  }

  return res.json();
}

export async function generateGtmStrategy(ideaId?: string): Promise<GtmStrategyResponse> {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId: ideaId || null })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to generate GTM strategy' }));
    throw new Error(err.message || 'Failed to generate GTM strategy');
  }

  return res.json();
}

export async function refreshGtmStrategy(ideaId?: string): Promise<GtmStrategyResponse> {
  const res = await fetch(`${BASE_URL}/refresh`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ideaId: ideaId || null })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to refresh GTM strategy' }));
    throw new Error(err.message || 'Failed to refresh GTM strategy');
  }

  return res.json();
}

export async function updateGtmChannel(
  channelKey: string,
  req: UpdateGtmChannelRequest
): Promise<GtmStrategyResponse> {
  const res = await fetch(`${BASE_URL}/channels/${encodeURIComponent(channelKey)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(req)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to update channel priority' }));
    throw new Error(err.message || 'Failed to update channel priority');
  }

  return res.json();
}

export async function recordExperimentRun(
  experimentKey: string,
  req: RecordExperimentRunRequest
): Promise<GtmStrategyResponse> {
  const res = await fetch(`${BASE_URL}/experiments/${encodeURIComponent(experimentKey)}/runs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(req)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Failed to record experiment run' }));
    throw new Error(err.message || 'Failed to record experiment run');
  }

  return res.json();
}
