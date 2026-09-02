import axios from "@/lib/axios";
import {
  AdminSecuritySummary,
  UserSecurityReview,
  PrivacyRequest,
  CreatePrivacyRequestPayload,
  UpdatePrivacyStatusPayload,
  ComplianceCase,
  CreateComplianceCasePayload,
  AddComplianceCaseNotePayload,
  UpdateComplianceCaseStatusPayload,
  DataGovernanceInventoryItem,
  DataRetentionPolicy,
  UpdateDataRetentionPoliciesPayload,
} from "@/types/admin-security-compliance";
import { AdminAuditLogItem } from "@/types/admin-audit";

// ==========================================
// 1. ADMIN SECURITY
// ==========================================

export const getAdminSecuritySummary = async (): Promise<AdminSecuritySummary> => {
  const response = await axios.get("/admin/security/summary");
  return response.data?.data;
};

export const getAdminSecurityEvents = async (params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  severity?: string;
  actorEmail?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  items: AdminAuditLogItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}> => {
  const response = await axios.get("/admin/security/events", { params });
  return response.data?.data;
};

export const getUserSecurityReview = async (userId: string): Promise<UserSecurityReview> => {
  const response = await axios.get(`/admin/security/users/${userId}/review`);
  return response.data?.data;
};

export const revokeUserSessions = async (userId: string): Promise<{ userId: string; message: string }> => {
  const response = await axios.post(`/admin/security/users/${userId}/revoke-sessions`);
  return response.data?.data;
};

// ==========================================
// 2. ADMIN PRIVACY
// ==========================================

export const getAdminPrivacyRequests = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  requestType?: string;
  search?: string;
}): Promise<{
  items: PrivacyRequest[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}> => {
  const response = await axios.get("/admin/privacy/requests", { params });
  return response.data?.data;
};

export const getAdminPrivacyRequestById = async (id: string): Promise<PrivacyRequest> => {
  const response = await axios.get(`/admin/privacy/requests/${id}`);
  return response.data?.data;
};

export const movePrivacyRequestUnderReview = async (
  id: string,
  payload: { adminNotes?: string; version: number }
): Promise<PrivacyRequest> => {
  const response = await axios.post(`/admin/privacy/requests/${id}/under-review`, payload);
  return response.data?.data;
};

export const completePrivacyRequest = async (
  id: string,
  payload: { adminNotes?: string; exportDownloadUrl?: string; version: number }
): Promise<PrivacyRequest> => {
  const response = await axios.post(`/admin/privacy/requests/${id}/complete`, payload);
  return response.data?.data;
};

export const rejectPrivacyRequest = async (
  id: string,
  payload: { reason: string; adminNotes?: string; version: number }
): Promise<PrivacyRequest> => {
  const response = await axios.post(`/admin/privacy/requests/${id}/reject`, payload);
  return response.data?.data;
};

// ==========================================
// 3. ADMIN COMPLIANCE
// ==========================================

export const getAdminComplianceCases = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  caseType?: string;
  search?: string;
}): Promise<{
  items: ComplianceCase[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}> => {
  const response = await axios.get("/admin/compliance/cases", { params });
  return response.data?.data;
};

export const getAdminComplianceCaseById = async (id: string): Promise<ComplianceCase> => {
  const response = await axios.get(`/admin/compliance/cases/${id}`);
  return response.data?.data;
};

export const createComplianceCase = async (payload: CreateComplianceCasePayload): Promise<ComplianceCase> => {
  const response = await axios.post("/admin/compliance/cases", payload);
  return response.data?.data;
};

export const addComplianceCaseNote = async (
  id: string,
  payload: AddComplianceCaseNotePayload
): Promise<ComplianceCase> => {
  const response = await axios.post(`/admin/compliance/cases/${id}/notes`, payload);
  return response.data?.data;
};

export const updateComplianceCaseStatus = async (
  id: string,
  payload: UpdateComplianceCaseStatusPayload
): Promise<ComplianceCase> => {
  const response = await axios.post(`/admin/compliance/cases/${id}/status`, payload);
  return response.data?.data;
};

// ==========================================
// 4. ADMIN DATA GOVERNANCE
// ==========================================

export const getDataGovernanceInventory = async (): Promise<DataGovernanceInventoryItem[]> => {
  const response = await axios.get("/admin/data-governance/inventory");
  return response.data?.data;
};

export const getDataRetentionSettings = async (): Promise<DataRetentionPolicy[]> => {
  const response = await axios.get("/admin/data-governance/settings");
  return response.data?.data;
};

export const updateDataRetentionSettings = async (
  payload: UpdateDataRetentionPoliciesPayload
): Promise<DataRetentionPolicy[]> => {
  const response = await axios.put("/admin/data-governance/settings", payload);
  return response.data?.data;
};

// ==========================================
// 5. USER-FACING PRIVACY API
// ==========================================

export const submitUserPrivacyRequest = async (
  payload: CreatePrivacyRequestPayload
): Promise<PrivacyRequest> => {
  const response = await axios.post("/privacy/requests", payload);
  return response.data?.data;
};

export const getMyPrivacyRequests = async (): Promise<PrivacyRequest[]> => {
  const response = await axios.get("/privacy/my-requests");
  return response.data?.data;
};
