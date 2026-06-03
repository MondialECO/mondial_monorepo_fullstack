import api from "@/lib/axios";
import type {
  DealActivityEntry,
  DealStatus,
  OfferTermsInput,
} from "@/types/deals";

// Thin typed wrappers over the bilateral deal/offer backend (Phase D-2…D-4.5).
// Errors propagate — TanStack Query surfaces them.

// Participant-scoped list (founder + investor) — GET /api/deals.
export async function getDeals(): Promise<DealStatus[]> {
  const res = await api.get<DealStatus[]>("/deals");
  return res.data;
}

export async function getDeal(dealId: string): Promise<DealStatus> {
  const res = await api.get<DealStatus>(`/companies/deals/${dealId}`);
  return res.data;
}

export async function getDealActivity(
  dealId: string
): Promise<DealActivityEntry[]> {
  const res = await api.get<DealActivityEntry[]>(
    `/companies/deals/${dealId}/activity`
  );
  return res.data;
}

// Investor-initiated initial offer (creates the deal).
export async function createInvestorOffer(
  companyId: string,
  terms: OfferTermsInput
): Promise<DealStatus> {
  const res = await api.post<DealStatus>(
    `/investor/term-sheet/${companyId}/create`,
    terms
  );
  return res.data;
}

export async function counterOffer(
  dealId: string,
  terms: OfferTermsInput
): Promise<DealStatus> {
  const res = await api.post<DealStatus>(
    `/companies/deals/${dealId}/offer/counter`,
    terms
  );
  return res.data;
}

export async function acceptOffer(dealId: string): Promise<DealStatus> {
  const res = await api.post<DealStatus>(
    `/companies/deals/${dealId}/offer/accept`
  );
  return res.data;
}

export async function rejectOffer(
  dealId: string,
  note?: string
): Promise<DealStatus> {
  const res = await api.post<DealStatus>(
    `/companies/deals/${dealId}/offer/reject`,
    { note: note ?? "" }
  );
  return res.data;
}

export async function markOfferViewed(dealId: string): Promise<DealStatus> {
  const res = await api.post<DealStatus>(
    `/companies/deals/${dealId}/offer/viewed`
  );
  return res.data;
}

// Close a fully-signed deal (founder-only, requires both signatures). Moves the
// deal to "completed".
export async function closeDeal(dealId: string): Promise<DealStatus> {
  const res = await api.post<DealStatus>(`/companies/deals/${dealId}/close`);
  return res.data;
}

// Sign the agreed term sheet. The caller signs their own role slot; both
// signatures are required before the deal can be closed. Multipart upload of
// the signed document (form field "File").
export async function signTermSheet(
  dealId: string,
  file: File
): Promise<DealStatus> {
  const form = new FormData();
  form.append("File", file);
  const res = await api.post<DealStatus>(
    `/companies/deals/${dealId}/term-sheet/sign`,
    form
  );
  return res.data;
}
