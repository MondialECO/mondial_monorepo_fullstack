import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDiligenceSummary,
  updateDocumentReviewStatus,
  getPrivateNotes,
  createPrivateNote,
  deletePrivateNote,
  getDiligenceQuestions,
  askFounderQuestion,
  completeDiligence,
  reopenDiligence,
  updateChecklistOverride,
  getFounderDataRoomQuestions,
  answerFounderDataRoomQuestion,
  type DiligenceSummary,
} from "@/lib/api-investor-diligence";

export const DILIGENCE_KEYS = {
  all: ["investor-diligence"] as const,
  summary: (companyId: string | null) => [...DILIGENCE_KEYS.all, "summary", companyId] as const,
  notes: (companyId: string | null, documentId?: string) =>
    [...DILIGENCE_KEYS.all, "notes", companyId, documentId] as const,
  questions: (companyId: string | null, documentId?: string) =>
    [...DILIGENCE_KEYS.all, "questions", companyId, documentId] as const,
  founderQuestions: (companyId: string | null) =>
    ["founder-dataroom", "questions", companyId] as const,
};

export function useDiligenceSummary(companyId: string | null) {
  return useQuery({
    queryKey: DILIGENCE_KEYS.summary(companyId),
    queryFn: () => (companyId ? getDiligenceSummary(companyId) : Promise.reject("No companyId")),
    enabled: !!companyId,
    staleTime: 15_000,
  });
}

export function useUpdateDocumentReview(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      status,
    }: {
      documentId: string;
      status: "not_reviewed" | "reviewed" | "needs_attention";
    }) => updateDocumentReviewStatus(companyId, documentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DILIGENCE_KEYS.summary(companyId) });
    },
  });
}

export function usePrivateNotes(companyId: string | null, documentId?: string) {
  return useQuery({
    queryKey: DILIGENCE_KEYS.notes(companyId, documentId),
    queryFn: () =>
      companyId ? getPrivateNotes(companyId, documentId) : Promise.reject("No companyId"),
    enabled: !!companyId,
  });
}

export function useCreatePrivateNote(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      content,
    }: {
      documentId?: string | null;
      content: string;
    }) => createPrivateNote(companyId, documentId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DILIGENCE_KEYS.summary(companyId) });
      queryClient.invalidateQueries({
        queryKey: DILIGENCE_KEYS.notes(companyId, variables.documentId || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: DILIGENCE_KEYS.notes(companyId, undefined),
      });
    },
  });
}

export function useDeletePrivateNote(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deletePrivateNote(companyId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DILIGENCE_KEYS.summary(companyId) });
      queryClient.invalidateQueries({ queryKey: [...DILIGENCE_KEYS.all, "notes", companyId] });
    },
  });
}

export function useDiligenceQuestions(companyId: string | null, documentId?: string) {
  return useQuery({
    queryKey: DILIGENCE_KEYS.questions(companyId, documentId),
    queryFn: () =>
      companyId ? getDiligenceQuestions(companyId, documentId) : Promise.reject("No companyId"),
    enabled: !!companyId,
  });
}

export function useAskFounderQuestion(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      documentTitle,
      question,
    }: {
      documentId?: string | null;
      documentTitle?: string | null;
      question: string;
    }) => askFounderQuestion(companyId, documentId, documentTitle, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DILIGENCE_KEYS.summary(companyId) });
      queryClient.invalidateQueries({ queryKey: [...DILIGENCE_KEYS.all, "questions", companyId] });
    },
  });
}

export function useCompleteDiligence(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => completeDiligence(companyId),
    onSuccess: (data: DiligenceSummary) => {
      queryClient.setQueryData(DILIGENCE_KEYS.summary(companyId), data);
      queryClient.invalidateQueries({ queryKey: DILIGENCE_KEYS.summary(companyId) });
    },
  });
}

export function useReopenDiligence(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reopenDiligence(companyId),
    onSuccess: (data: DiligenceSummary) => {
      queryClient.setQueryData(DILIGENCE_KEYS.summary(companyId), data);
      queryClient.invalidateQueries({ queryKey: DILIGENCE_KEYS.summary(companyId) });
    },
  });
}

export function useUpdateChecklistOverride(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryKey,
      status,
    }: {
      categoryKey: string;
      status: "not_started" | "in_review" | "complete" | "needs_attention";
    }) => updateChecklistOverride(companyId, categoryKey, status),
    onSuccess: (data: DiligenceSummary) => {
      queryClient.setQueryData(DILIGENCE_KEYS.summary(companyId), data);
      queryClient.invalidateQueries({ queryKey: DILIGENCE_KEYS.summary(companyId) });
    },
  });
}

// Founder hooks
export function useFounderDataRoomQuestions(companyId: string | null) {
  return useQuery({
    queryKey: DILIGENCE_KEYS.founderQuestions(companyId),
    queryFn: () =>
      companyId ? getFounderDataRoomQuestions(companyId) : Promise.reject("No companyId"),
    enabled: !!companyId,
  });
}

export function useAnswerFounderDataRoomQuestion(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      response,
    }: {
      questionId: string;
      response: string;
    }) => answerFounderDataRoomQuestion(companyId, questionId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DILIGENCE_KEYS.founderQuestions(companyId) });
    },
  });
}
