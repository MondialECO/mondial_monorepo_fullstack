import api from '@/lib/axios';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const unwrap = <T>(body: ApiEnvelope<T> | T): T =>
  body && typeof body === 'object' && 'data' in (body as ApiEnvelope<T>)
    ? (body as ApiEnvelope<T>).data
    : body as T;

export type CreatorIdeaDocument = {
  id: string;
  documentType: 'business_plan' | 'financial_forecast';
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  sourceModule: string;
  createdAt: string;
  updatedAt: string;
  downloadable: boolean;
};

export const creatorDocumentsApi = {
  list: async (ideaId: string): Promise<CreatorIdeaDocument[]> => {
    const response = await api.get(`/creator/ideas/${encodeURIComponent(ideaId)}/documents`);
    return unwrap<{ documents: CreatorIdeaDocument[] }>(response.data).documents ?? [];
  },

  download: async (ideaId: string, documentId: string): Promise<Blob> => {
    const response = await api.get(
      `/creator/ideas/${encodeURIComponent(ideaId)}/documents/${encodeURIComponent(documentId)}/download`,
      { responseType: 'blob' },
    );
    return response.data as Blob;
  },
};
