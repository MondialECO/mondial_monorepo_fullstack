export interface AdminMarketplaceSummary {
  totalServices: number;
  publishedServices: number;
  hiddenServices: number;
  draftServices: number;

  totalCreatorOffers: number;
  publishedCreatorOffers: number;
  hiddenCreatorOffers: number;
  buyoutOffersCount: number;
  equityOffersCount: number;

  totalReviews: number;
  publicReviews: number;
  hiddenReviews: number;
  averageRating: number;

  openReportsCount: number;
  reportsSystemActive: boolean;
}

export interface AdminServiceModerationItem {
  id: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  title: string;
  description: string;
  category: string;
  serviceType: string;
  status: string;
  isModerationHidden: boolean;
  moderationReason?: string | null;
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  packagesCount: number;
  startingPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminServiceDetail extends AdminServiceModerationItem {
  packages: Array<{
    id: string;
    packageType: number | string;
    name: string;
    description: string;
    price: number;
    currency: string;
    deliveryTimeValue: number;
    deliveryTimeUnit: string;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  galleryImages: Array<{
    id: string;
    publicUrl: string;
  }>;
  previewVideo?: {
    publicUrl: string;
  } | null;
  reviewsCount: number;
  averageRating: number;
}

export interface AdminCreatorOfferItem {
  ideaId: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  sector: string;
  status: string;
  saleType: string;
  dealModes: string[];
  askingPrice?: number | null;
  audience: string;
  ndaRequired: boolean;
  isModerationHidden: boolean;
  moderationReason?: string | null;
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminCreatorOfferDetail extends AdminCreatorOfferItem {
  valuationEstimate: number;
  stage: string;
  tags: string[];
}

export interface AdminReviewItem {
  id: string;
  engagementId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  overallRating: number;
  qualityRating: number;
  communicationRating: number;
  deliveryRating: number;
  writtenReview: string;
  providerResponse?: string | null;
  visibility: string;
  verificationStatus: string;
  isModerationHidden: boolean;
  moderationReason?: string | null;
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  submittedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
