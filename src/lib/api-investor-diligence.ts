import axiosInstance from "./axios";

export interface DiligenceChecklistItem {
  categoryKey: string;
  title: string;
  status: "not_started" | "in_review" | "complete" | "needs_attention";
  totalDocuments: number;
  reviewedDocuments: number;
  needsAttentionDocuments: number;
  isMandatory: boolean;
}

export interface DiligenceReview {
  documentId: string;
  status: "not_reviewed" | "reviewed" | "needs_attention";
  reviewedAt?: string | null;
  reviewedByUserId?: string | null;
  notesCount: number;
}

export interface DiligenceNote {
  id: string;
  investorId: string;
  companyId: string;
  documentId?: string | null;
  content: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiligenceQuestion {
  id: string;
  companyId: string;
  investorId: string;
  investorName?: string | null;
  documentId?: string | null;
  documentTitle?: string | null;
  matchId?: string | null;
  dealExecutionId?: string | null;
  question: string;
  askedByUserId: string;
  askedAt: string;
  founderResponse?: string | null;
  respondedByUserId?: string | null;
  respondedAt?: string | null;
  status: "open" | "answered" | "closed";
}

export interface DiligenceSummary {
  companyId: string;
  investorId: string;
  status: "not_started" | "in_progress" | "completed";
  percentComplete: number;
  totalDocuments: number;
  reviewedDocuments: number;
  openQuestionsCount: number;
  needsAttentionCount: number;
  checklistCompletedCount: number;
  totalChecklistCategories: number;
  canComplete: boolean;
  blockedReason?: string | null;
  ndaAccepted: boolean;
  ndaRequired: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
  completedByUserId?: string | null;
  checklist: DiligenceChecklistItem[];
  reviews: DiligenceReview[];
  questions: DiligenceQuestion[];
}

export async function getDiligenceSummary(companyId: string): Promise<DiligenceSummary> {
  const { data } = await axiosInstance.get<DiligenceSummary>(
    `/investor/companies/${companyId}/diligence`
  );
  return data;
}

export async function updateDocumentReviewStatus(
  companyId: string,
  documentId: string,
  status: "not_reviewed" | "reviewed" | "needs_attention"
): Promise<DiligenceReview> {
  const { data } = await axiosInstance.put<DiligenceReview>(
    `/investor/companies/${companyId}/diligence/documents/${documentId}/review`,
    { status }
  );
  return data;
}

export async function getPrivateNotes(
  companyId: string,
  documentId?: string
): Promise<DiligenceNote[]> {
  const { data } = await axiosInstance.get<DiligenceNote[]>(
    `/investor/companies/${companyId}/diligence/notes`,
    { params: documentId ? { documentId } : undefined }
  );
  return data;
}

export async function createPrivateNote(
  companyId: string,
  documentId: string | null | undefined,
  content: string
): Promise<DiligenceNote> {
  const { data } = await axiosInstance.post<DiligenceNote>(
    `/investor/companies/${companyId}/diligence/notes`,
    { documentId, content }
  );
  return data;
}

export async function deletePrivateNote(companyId: string, noteId: string): Promise<void> {
  await axiosInstance.delete(`/investor/companies/${companyId}/diligence/notes/${noteId}`);
}

export async function getDiligenceQuestions(
  companyId: string,
  documentId?: string
): Promise<DiligenceQuestion[]> {
  const { data } = await axiosInstance.get<DiligenceQuestion[]>(
    `/investor/companies/${companyId}/diligence/questions`,
    { params: documentId ? { documentId } : undefined }
  );
  return data;
}

export async function askFounderQuestion(
  companyId: string,
  documentId: string | null | undefined,
  documentTitle: string | null | undefined,
  question: string
): Promise<DiligenceQuestion> {
  const { data } = await axiosInstance.post<DiligenceQuestion>(
    `/investor/companies/${companyId}/diligence/questions`,
    { documentId, documentTitle, question }
  );
  return data;
}

export async function completeDiligence(companyId: string): Promise<DiligenceSummary> {
  const { data } = await axiosInstance.post<DiligenceSummary>(
    `/investor/companies/${companyId}/diligence/complete`
  );
  return data;
}

export async function reopenDiligence(companyId: string): Promise<DiligenceSummary> {
  const { data } = await axiosInstance.post<DiligenceSummary>(
    `/investor/companies/${companyId}/diligence/reopen`
  );
  return data;
}

export async function updateChecklistOverride(
  companyId: string,
  categoryKey: string,
  status: "not_started" | "in_review" | "complete" | "needs_attention"
): Promise<DiligenceSummary> {
  const { data } = await axiosInstance.put<DiligenceSummary>(
    `/investor/companies/${companyId}/diligence/checklist/${categoryKey}`,
    { status }
  );
  return data;
}

// Founder endpoints
export async function getFounderDataRoomQuestions(companyId: string): Promise<DiligenceQuestion[]> {
  const { data } = await axiosInstance.get<DiligenceQuestion[]>(
    `/companies/${companyId}/dataroom/questions`
  );
  return data;
}

export async function answerFounderDataRoomQuestion(
  companyId: string,
  questionId: string,
  response: string
): Promise<DiligenceQuestion> {
  const { data } = await axiosInstance.post<DiligenceQuestion>(
    `/companies/${companyId}/dataroom/questions/${questionId}/answer`,
    { response }
  );
  return data;
}
