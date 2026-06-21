import api from "@/lib/axios";
import type {
  DiligenceProgress,
  InvestorDocumentList,
  InvestorPipeline,
  InvestorSession,
  NdaAcceptanceResult,
  OpportunityDetail,
  OpportunityFeed,
  OpportunityFeedFilters,
} from "@/types/investor/opportunities";

// Thin typed wrappers over the existing axios client. The axios instance
// in src/lib/axios.ts already handles bearer-token injection and 401 refresh,
// so these wrappers stay intentionally boring — no error swallowing, no
// fallback values; let TanStack Query surface failures up the stack.

const BASE = "/companies/opportunities";

export async function getOpportunities(
  filters: OpportunityFeedFilters = {}
): Promise<OpportunityFeed> {
  const params: Record<string, string | number> = {};
  if (filters.sector) params.sector = filters.sector;
  if (filters.stage) params.stage = filters.stage;
  if (filters.geography) params.geography = filters.geography;
  if (filters.take != null) params.take = filters.take;

  const res = await api.get<OpportunityFeed>(BASE, { params });
  return res.data;
}

export async function getOpportunity(companyId: string): Promise<OpportunityDetail> {
  const res = await api.get<OpportunityDetail>(`${BASE}/${companyId}`);
  return res.data;
}

export async function getOpportunityDocuments(
  companyId: string
): Promise<InvestorDocumentList> {
  const res = await api.get<InvestorDocumentList>(`${BASE}/${companyId}/documents`);
  return res.data;
}

export async function getInvestorSession(
  companyId: string
): Promise<InvestorSession> {
  const res = await api.get<InvestorSession>(`${BASE}/${companyId}/my-session`);
  return res.data;
}

export async function getDiligenceProgress(
  companyId: string
): Promise<DiligenceProgress> {
  const res = await api.get<DiligenceProgress>(
    `${BASE}/${companyId}/diligence-progress`
  );
  return res.data;
}

export async function getInvestorPipeline(): Promise<InvestorPipeline> {
  const res = await api.get<InvestorPipeline>(`${BASE}/pipeline`);
  return res.data;
}

export async function acceptNda(
  companyId: string,
  ndaText: string
): Promise<NdaAcceptanceResult> {
  const res = await api.post<NdaAcceptanceResult>(
    `/companies/${companyId}/dataroom/nda/accept`,
    { ndaText }
  );
  return res.data;
}

/**
 * Fetches a single data-room document as bytes. Wraps the existing
 * `GET /api/companies/{companyId}/dataroom/documents/{documentId}` endpoint
 * (verified during Phase D — NDA-gated, IDOR-safe). The endpoint streams
 * file bytes; callers receive a Blob ready to hand to a temporary anchor for
 * client-side download. The Content-Type returned by the backend dictates
 * how the browser handles the file (PDFs render inline, etc.).
 *
 * Phase 3 note: seeded documents carry an empty StoragePath placeholder so
 * this request will currently 400 against the dev seed. The wiring is real
 * and works for any document with a real on-disk file.
 */
export async function downloadDataRoomDocument(
  companyId: string,
  documentId: string
): Promise<Blob> {
  const res = await api.get<Blob>(
    `/companies/${companyId}/dataroom/documents/${documentId}`,
    { responseType: "blob" }
  );
  return res.data;
}
