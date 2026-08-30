'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInvestorFinanceVerification,
  saveInvestorFinanceDraft,
  uploadInvestorFinanceDocument,
  deleteInvestorFinanceDocument,
  submitInvestorFinanceVerification,
} from '@/lib/api-investor-finance';
import type {
  InvestorFinanceVerification,
  SaveFinanceDraftPayload,
  SubmitFinanceVerificationPayload,
} from '@/types/investor/finance';

export const useInvestorFinanceVerification = () => {
  return useQuery<InvestorFinanceVerification>({
    queryKey: ['investor', 'finance-verification'],
    queryFn: getInvestorFinanceVerification,
    staleTime: 30000,
  });
};

export const useSaveInvestorFinanceDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveFinanceDraftPayload) => saveInvestorFinanceDraft(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['investor', 'finance-verification'], data);
    },
  });
};

export const useUploadInvestorFinanceDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) =>
      uploadInvestorFinanceDocument(file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor', 'finance-verification'] });
    },
  });
};

export const useDeleteInvestorFinanceDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => deleteInvestorFinanceDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investor', 'finance-verification'] });
    },
  });
};

export const useSubmitInvestorFinanceVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitFinanceVerificationPayload) =>
      submitInvestorFinanceVerification(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['investor', 'finance-verification'], data);
    },
  });
};
