// Module 2 — Service Catalog frontend contracts. Mirror the backend DTOs in
// Models/Dtos/ServiceCatalogDtos.cs 1:1. The /api/service-provider/catalog/* surface
// wraps every payload in the shared ApiResponse envelope (unwrapped in api-service-catalog.ts).

export type CatalogStatus = "Draft" | "Published" | "Unpublished" | "Archived";
export type PackageType = "Basic" | "Standard" | "Premium" | "Custom";
export type DeliveryTimeUnit = "Hours" | "Days" | "Weeks";
export type DeliveryDayType = "BusinessDays" | "CalendarDays";
export type DeliveryStartRule =
  | "AfterOrderConfirmation"
  | "AfterEscrowFunding"
  | "AfterClientRequirementsComplete"
  | "AfterProviderStarts";
export type FaqVisibility =
  | "AllPackages"
  | "BasicOnly"
  | "StandardOnly"
  | "PremiumOnly"
  | "SelectedPackages"
  | "PrivateDraft";
export type RequirementsFieldType = "Text" | "File" | "Choice" | "Number" | "Date" | "Boolean";
export type CancellationPolicyType =
  | "FlexibleFullRefundBeforeStart"
  | "PartialRefundAfterDeliveryStart"
  | "NoRefundAfterDeliveryStart";

export const PACKAGE_TYPES: PackageType[] = ["Basic", "Standard", "Premium"];
export const DELIVERY_TIME_UNITS: DeliveryTimeUnit[] = ["Hours", "Days", "Weeks"];
export const DELIVERY_DAY_TYPES: DeliveryDayType[] = ["BusinessDays", "CalendarDays"];
export const DELIVERY_START_RULES: DeliveryStartRule[] = [
  "AfterOrderConfirmation",
  "AfterEscrowFunding",
  "AfterClientRequirementsComplete",
  "AfterProviderStarts",
];
export const FAQ_VISIBILITIES: FaqVisibility[] = [
  "AllPackages",
  "BasicOnly",
  "StandardOnly",
  "PremiumOnly",
  "SelectedPackages",
  "PrivateDraft",
];
export const REQUIREMENTS_FIELD_TYPES: RequirementsFieldType[] = [
  "Text",
  "File",
  "Choice",
  "Number",
  "Date",
  "Boolean",
];
export const CANCELLATION_POLICIES: CancellationPolicyType[] = [
  "FlexibleFullRefundBeforeStart",
  "PartialRefundAfterDeliveryStart",
  "NoRefundAfterDeliveryStart",
];

export interface ServiceAddOn {
  name: string;
  price: number;
  deliveryTimeAdjustmentDays: number;
  enabled: boolean;
}

export interface RequirementsField {
  fieldId: string;
  label: string;
  fieldType: RequirementsFieldType;
  required: boolean;
}

export interface GalleryImage {
  id: string;
  storageKey: string;
  publicUrl: string;
  contentType: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  displayOrder: number;
  uploadedAt: string;
}

export interface PreviewVideo {
  storageKey: string;
  publicUrl: string;
  contentType: string;
  bytes: number;
  durationSeconds: number;
  sha256: string;
  uploadedAt: string;
}

export interface ServiceListing {
  id: string;
  providerId: string;
  serviceType: string;
  title: string;
  description: string;
  category: string;
  metadataTags: string[];
  searchTags: string[];
  industryFocus: string[];
  geographicCoverage: string[];
  impressions: number;
  clicks: number;
  previewVideo?: PreviewVideo | null;
  galleryImages: GalleryImage[];
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  packageName: string;
  packageType: PackageType;
  packageTitle: string;
  packageDescription: string;
  price: number;
  currency: string;
  pricingModel?: string | null;
  deliveryTimeValue: number;
  deliveryTimeUnit: DeliveryTimeUnit;
  deliveryDayType: DeliveryDayType;
  deliveryStartRule: DeliveryStartRule;
  deliveryTimezone: string;
  dailyCutoffTime: string;
  includedRevisionCount: number;
  unlimitedRevisions: boolean;
  revisionRequestWindowDays: number;
  additionalRevisionAvailable: boolean;
  additionalRevisionPrice: number;
  additionalRevisionDeliveryTime: number;
  revisionScopeDescription: string;
  deliverables: string[];
  includedFeatures: string[];
  excludedFeatures: string[];
  addOns: ServiceAddOn[];
  requirementsTemplate: RequirementsField[];
  cancellationPolicy: CancellationPolicyType;
  instantOrderEnabled: boolean;
  manualApprovalRequired: boolean;
  maximumActiveOrders: number;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFaq {
  id: string;
  serviceId: string;
  packageId?: string | null;
  question: string;
  answer: string;
  visibility: FaqVisibility;
  displayOrder: number;
  status: CatalogStatus;
  conflictWarning?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceListingDetail {
  listing: ServiceListing;
  packages: ServicePackage[];
  faqs: ServiceFaq[];
}

export interface PricingGuidance {
  category: string;
  pricingModel?: string | null;
  min: number;
  max: number;
  currency: string;
}

export interface ProviderCapacity {
  maximumConcurrentOrders: number;
  currentActiveOrders: number;
  newOrderAvailability: boolean;
  manualApprovalWhenCapacityLow: boolean;
  capacityStatus: "Available" | "Limited" | "FullyBooked" | "Unavailable";
  instantOrderAvailable: boolean;
}

export interface PublishPackageResult {
  package: ServicePackage;
  warnings: string[];
}

// ---------------- Request payloads ----------------

export interface UpsertServiceListingRequest {
  serviceType: string;
  title: string;
  description: string;
  category: string;
  metadataTags: string[];
  searchTags: string[];
  industryFocus: string[];
  geographicCoverage: string[];
}

export interface UpsertServicePackageRequest {
  packageType: string;
  packageName: string;
  packageTitle: string;
  packageDescription: string;
  price: number;
  currency: string;
  pricingModel?: string | null;
  deliveryTimeValue: number;
  deliveryTimeUnit: string;
  deliveryDayType: string;
  deliveryStartRule: string;
  deliveryTimezone: string;
  dailyCutoffTime: string;
  includedRevisionCount: number;
  unlimitedRevisions: boolean;
  revisionRequestWindowDays: number;
  additionalRevisionAvailable: boolean;
  additionalRevisionPrice: number;
  additionalRevisionDeliveryTime: number;
  revisionScopeDescription: string;
  deliverables: string[];
  includedFeatures: string[];
  excludedFeatures: string[];
  addOns: ServiceAddOn[];
  requirementsTemplate: RequirementsField[];
  cancellationPolicy: string;
  instantOrderEnabled: boolean;
  manualApprovalRequired: boolean;
  maximumActiveOrders: number;
}

export interface UpsertServiceFaqRequest {
  packageId?: string | null;
  question: string;
  answer: string;
  visibility: string;
  displayOrder: number;
}

export interface ReorderFaqsRequest {
  items: { faqId: string; displayOrder: number }[];
}

export interface UpdateProviderCapacityRequest {
  maximumConcurrentOrders: number;
  newOrderAvailability: boolean;
  manualApprovalWhenCapacityLow: boolean;
}

export interface PublishPackageRequest {
  confirmShorterDelivery: boolean;
}
