import api from '@/lib/axios';
import type {
  InvestorFinanceVerification,
  InvestorFinanceDocument,
  SaveFinanceDraftPayload,
  SubmitFinanceVerificationPayload,
  AdminFinanceDecisionPayload,
} from '@/types/investor/finance';

export const getInvestorFinanceVerification = async (): Promise<InvestorFinanceVerification> => {
  const res = await api.get<InvestorFinanceVerification>('/investor/finance-verification');
  return res.data;
};

export const saveInvestorFinanceDraft = async (
  payload: SaveFinanceDraftPayload
): Promise<InvestorFinanceVerification> => {
  const res = await api.put<InvestorFinanceVerification>('/investor/finance-verification/draft', payload);
  return res.data;
};

export const uploadInvestorFinanceDocument = async (
  file: File,
  documentType: string
): Promise<InvestorFinanceDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const res = await api.post<InvestorFinanceDocument>('/investor/finance-verification/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deleteInvestorFinanceDocument = async (
  documentId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await api.delete(`/investor/finance-verification/documents/${documentId}`);
  return res.data;
};

export const submitInvestorFinanceVerification = async (
  payload: SubmitFinanceVerificationPayload
): Promise<InvestorFinanceVerification> => {
  const res = await api.post<InvestorFinanceVerification>('/investor/finance-verification/submit', payload);
  return res.data;
};

export const getAdminInvestorFinanceVerifications = async () => {
  const res = await api.get('/admin/investor-finance-verifications');
  return res.data;
};

export const decideAdminInvestorFinanceVerification = async (
  id: string,
  payload: AdminFinanceDecisionPayload
) => {
  const res = await api.post(`/admin/investor-finance-verifications/${id}/decision`, payload);
  return res.data;
};
