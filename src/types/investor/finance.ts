export type FinanceVerificationStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'needs_update'
  | 'rejected';

export type InvestorTypeOption =
  | 'angel'
  | 'seed_fund'
  | 'vc'
  | 'corporate'
  | 'family_office'
  | 'syndicate'
  | 'other';

export interface InvestorFinanceDocument {
  documentId: string;
  documentType: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  reviewNote?: string;
}

export interface InvestorFinanceVerification {
  id: string;
  userId: string;
  investorId: string;
  status: FinanceVerificationStatus;
  financeVerified: boolean;
  investorType: string;
  declaredAvailableCapital: number;
  minTicket: number;
  maxTicket: number;
  currency: string;
  deploymentPeriodMonths: number;
  sourceOfFunds: string[];
  sourceOfFundsExplanation: string;
  documents: InvestorFinanceDocument[];
  submittedAt?: string;
  reviewedAt?: string;
  decisionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveFinanceDraftPayload {
  investorType?: string;
  declaredAvailableCapital?: number;
  minTicket?: number;
  maxTicket?: number;
  currency?: string;
  deploymentPeriodMonths?: number;
  sourceOfFunds?: string[];
  sourceOfFundsExplanation?: string;
}

export interface SubmitFinanceVerificationPayload {
  investorType: string;
  declaredAvailableCapital: number;
  minTicket: number;
  maxTicket: number;
  currency: string;
  deploymentPeriodMonths: number;
  sourceOfFunds: string[];
  sourceOfFundsExplanation?: string;
  declarationConfirmed: boolean;
}

export interface AdminFinanceDecisionPayload {
  action: 'verify' | 'needs_update' | 'reject';
  decisionReason?: string;
}
