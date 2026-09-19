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

export type CreatorIdeaDocumentType =
  | 'business_plan'
  | 'financial_forecast'
  | 'legal_evidence'
  | 'kbis_extract'
  | 'statuts_draft'
  | 'capital_deposit_cert'
  | 'proof_of_address'
  | 'gdpr_policy';

export type CreatorIdeaDocument = {
  id: string;
  documentType: CreatorIdeaDocumentType | string;
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

  upload: async (ideaId: string, file: File, documentType?: CreatorIdeaDocumentType | string, title?: string): Promise<CreatorIdeaDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    if (documentType) formData.append('documentType', documentType);
    if (title) formData.append('title', title);

    const response = await api.post(
      `/creator/ideas/${encodeURIComponent(ideaId)}/documents/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return unwrap<CreatorIdeaDocument>(response.data);
  },
};
