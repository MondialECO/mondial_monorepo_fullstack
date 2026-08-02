import api from '@/lib/axios';
import type { ApiEnvelope, ApiResponse } from '@/types/service-provider';

const unwrap = <T>(envelope: ApiEnvelope<T>): T => envelope.data;

// ---------- Types ----------

export interface MarketplaceListingCard {
  id: string;
  title: string;
  category: string;
  coverImageUrl: string | null;
  provider: {
    providerId: string;
    displayName: string;
    profileImageUrl: string | null;
    verified: boolean;
  };
  startingPrice: number;
  currency: string;
  deliveryTimeValue: number;
  deliveryTimeUnit: string;
  rating: number | null;
  reviewCount: number | null;
}

export interface MarketplaceListingsResponse {
  items: MarketplaceListingCard[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MarketplaceListingDetail {
  id: string;
  title: string;
  category: string;
  serviceType: string;
  industryFocus: string[];
  geographicCoverage: string[];
  descriptionHtml: string;
  provider: {
    providerId: string;
    displayName: string;
    headline: string | null;
    profileImageUrl: string | null;
    verified: boolean;
    trustScore: number | null;
    completedOrders: number | null;
    medianResponseTime: string | null;
  };
  packages: MarketplacePackage[];
  gallery: { id: string; url: string; displayOrder: number }[];
  previewVideo: { url: string; durationSeconds: number } | null;
  faqs: {
    id: string;
    question: string;
    answerHtml: string;
    packageId: string | null;
    displayOrder: number;
  }[];
  metadataTags: string[];
  searchTags: string[];
}

export interface MarketplaceRequirementsField {
  fieldId: string;
  label: string;
  fieldType: 'Text' | 'File' | 'Choice' | 'Number' | 'Date' | 'Boolean';
  required: boolean;
}

export interface MarketplacePackage {
  id: string;
  tier: 'Basic' | 'Standard' | 'Premium';
  title: string;
  price: number;
  currency: string;
  deliveryTimeValue: number;
  deliveryTimeUnit: string;
  includedRevisionCount: number;
  unlimitedRevisions: boolean;
  screensIncluded: number | null;
  includedFeatures: string[];
  excludedFeatures: string[];
  addOns: { name: string; price: number; deliveryTimeAdjustmentDays: number | null }[];
  additionalRevision: { price: number; deliveryTimeDays: number } | null;
  requirementsTemplate: MarketplaceRequirementsField[];
}

export interface MarketplaceListingsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  priceMin?: number;
  priceMax?: number;
  deliveryTimeMaxDays?: number;
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'rating';
}

// ---------- Wrappers ----------

export const getMarketplaceListings = async (query: MarketplaceListingsQuery = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v));
    }
  });
  const queryString = params.toString();
  const url = queryString
    ? `/marketplace/services?${queryString}`
    : '/marketplace/services';
  return unwrap((await api.get<ApiEnvelope<MarketplaceListingsResponse>>(url)).data);
};

export const getMarketplaceListingDetail = async (listingId: string) =>
  unwrap((await api.get<ApiEnvelope<MarketplaceListingDetail>>(`/marketplace/services/${listingId}`)).data);
