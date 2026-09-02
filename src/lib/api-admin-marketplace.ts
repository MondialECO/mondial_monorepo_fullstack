import axios from "@/lib/axios";
import {
  AdminMarketplaceSummary,
  AdminServiceModerationItem,
  AdminServiceDetail,
  AdminCreatorOfferItem,
  AdminCreatorOfferDetail,
  AdminReviewItem,
  PagedResult,
} from "@/types/admin-marketplace";

export const getMarketplaceSummary = async (): Promise<AdminMarketplaceSummary> => {
  const response = await axios.get("/admin/marketplace/summary");
  return response.data?.data;
};

export const getModerationServices = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: string;
  moderationStatus?: string;
}): Promise<PagedResult<AdminServiceModerationItem>> => {
  const response = await axios.get("/admin/marketplace/services", { params });
  return response.data?.data;
};

export const getServiceDetail = async (id: string): Promise<AdminServiceDetail> => {
  const response = await axios.get(`/admin/marketplace/services/${id}`);
  return response.data?.data;
};

export const moderateService = async (
  id: string,
  action: "hide" | "restore",
  reason?: string
): Promise<AdminServiceModerationItem> => {
  const response = await axios.post(`/admin/marketplace/services/${id}/moderate`, {
    action,
    reason,
  });
  return response.data?.data;
};

export const getCreatorOffers = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  dealMode?: string;
  moderationStatus?: string;
}): Promise<PagedResult<AdminCreatorOfferItem>> => {
  const response = await axios.get("/admin/marketplace/creator-offers", { params });
  return response.data?.data;
};

export const getCreatorOfferDetail = async (ideaId: string): Promise<AdminCreatorOfferDetail> => {
  const response = await axios.get(`/admin/marketplace/creator-offers/${ideaId}`);
  return response.data?.data;
};

export const moderateCreatorOffer = async (
  ideaId: string,
  action: "hide" | "restore",
  reason?: string
): Promise<AdminCreatorOfferItem> => {
  const response = await axios.post(`/admin/marketplace/creator-offers/${ideaId}/moderate`, {
    action,
    reason,
  });
  return response.data?.data;
};

export const getReviews = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  rating?: number;
  moderationStatus?: string;
}): Promise<PagedResult<AdminReviewItem>> => {
  const response = await axios.get("/admin/marketplace/reviews", { params });
  return response.data?.data;
};

export const moderateReview = async (
  id: string,
  action: "hide" | "restore",
  reason?: string
): Promise<AdminReviewItem> => {
  const response = await axios.post(`/admin/marketplace/reviews/${id}/moderate`, {
    action,
    reason,
  });
  return response.data?.data;
};
