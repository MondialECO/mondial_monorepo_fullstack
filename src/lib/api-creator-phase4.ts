import api from '@/lib/axios';
import type { ConstructionSnapshotResponse } from '@/types/creator/phase4';

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

export async function getConstructionSnapshot(ideaId: string): Promise<ConstructionSnapshotResponse> {
  const res = await api.get<ApiEnvelope<ConstructionSnapshotResponse> | ConstructionSnapshotResponse>(
    '/creator/phase4/construction-snapshot',
    {
      params: { ideaId },
    }
  );
  return unwrap(res.data);
}

export async function generateConstructionSnapshot(ideaId: string): Promise<ConstructionSnapshotResponse> {
  const res = await api.post<ApiEnvelope<ConstructionSnapshotResponse> | ConstructionSnapshotResponse>(
    '/creator/phase4/construction-snapshot/generate',
    { ideaId }
  );
  return unwrap(res.data);
}

export async function refreshConstructionSnapshot(ideaId: string): Promise<ConstructionSnapshotResponse> {
  const res = await api.post<ApiEnvelope<ConstructionSnapshotResponse> | ConstructionSnapshotResponse>(
    '/creator/phase4/construction-snapshot/refresh',
    { ideaId }
  );
  return unwrap(res.data);
}

