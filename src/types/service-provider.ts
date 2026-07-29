// Service Provider (D-1 Stage 1 + D-2 Stage 2) frontend contracts.
// Mirror the backend DTOs in Models/Dtos/ServiceProviderDtos.cs 1:1. The
// /api/service-provider/* surface wraps every payload in the shared ApiResponse
// envelope; the client in api-service-provider.ts unwraps `data`.

/** Shared { success, message, data, traceId } response envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  traceId?: string | null;
}

/** Pending | UnderReview | Verified | Rejected. */
export type VerificationStatus =
  | "Pending"
  | "UnderReview"
  | "Verified"
  | "Rejected";

export type TiptapJson = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapJson[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
};

export interface ProfessionalOverviewContent {
  schemaVersion: number;
  document: TiptapJson;
  plainText: string;
}

export interface ProviderMedia {
  id?: string;
  url: string;
  contentType: string;
  width: number;
  height: number;
  bytes: number;
  uploadedAt: string;
}

export interface PortfolioItem {
  id: string;
  index: number;
  title: string;
  description?: string | null;
  url?: string | null;
  imagePath?: string | null;
  primaryImage?: ProviderMedia | null;
  imageCaption?: string | null;
  addedAt: string;
}

// ---------------- Profile editor (four-step wizard) ----------------
// Mirrors the split-collection contracts committed in f3a737d. Experience,
// Education and Languages live on ProfessionalProfiles; credentials are
// independent UserCredentials records and are never part of the editor draft.

/** Spoken-language proficiency. Wire values are the backend enum names. */
export const LANGUAGE_PROFICIENCIES = [
  "Basic",
  "Conversational",
  "Intermediate",
  "Professional",
  "Fluent",
  "NativeOrBilingual",
] as const;

export type LanguageProficiency = (typeof LANGUAGE_PROFICIENCIES)[number];

/** Display labels only — never persisted; the enum name is the source of truth. */
export const LANGUAGE_PROFICIENCY_LABELS: Record<LanguageProficiency, string> = {
  Basic: "Basic",
  Conversational: "Conversational",
  Intermediate: "Intermediate",
  Professional: "Professional",
  Fluent: "Fluent",
  NativeOrBilingual: "Native or Bilingual",
};

export const CREDENTIAL_KINDS = [
  "Certification",
  "License",
  "Degree",
  "Award",
  "Other",
] as const;

export type CredentialKind = (typeof CREDENTIAL_KINDS)[number];

/** Server-controlled. A provider action can only ever produce Draft or PendingReview. */
export type CredentialStatus =
  | "Draft"
  | "PendingReview"
  | "Verified"
  | "Rejected"
  | "ResubmissionRequired"
  | "Expired";

export const CREDENTIAL_STATUS_LABELS: Record<CredentialStatus, string> = {
  Draft: "Draft",
  PendingReview: "Pending Review",
  Verified: "Verified",
  Rejected: "Rejected",
  ResubmissionRequired: "Resubmission Required",
  Expired: "Expired",
};

/** One employment record. `startDate`/`endDate` are ISO "YYYY-MM" months. */
export interface ProviderExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
}

export interface ProviderEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startYear: number;
  endYear?: number | null;
  description?: string | null;
}

export interface ProviderLanguage {
  id: string;
  language: string;
  proficiency: LanguageProficiency;
}

/** Owner-scoped credential. Public projections omit the private fields. */
export interface ProviderCredential {
  id: string;
  kind: CredentialKind;
  title: string;
  issuingOrganization?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  /** Owner-only. */
  credentialNumber?: string | null;
  /** Owner-only public URL of the uploaded document. */
  documentUrl?: string | null;
  documentFileName?: string | null;
  documentBytes?: number | null;
  status: CredentialStatus;
  /** Provider-facing remediation reason only. */
  reviewNote?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export interface UpsertCredentialRequest {
  id?: string | null;
  kind: CredentialKind;
  title: string;
  issuingOrganization?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  credentialNumber?: string | null;
}

/** The editor's working copy. Saving it never publishes anything. */
export interface ProfileDraftRequest {
  basedOnVersion: number;
  lastStep: number;
  headline?: string | null;
  bio?: string | null;
  professionalOverview?: { schemaVersion: number; document: TiptapJson } | null;
  skills: string[];
  serviceCategories: string[];
  industries: string[];
  pricingModels: string[];
  experiences: Array<Omit<ProviderExperience, "id"> & { id?: string | null }>;
  education: Array<Omit<ProviderEducation, "id"> & { id?: string | null }>;
  languageProficiencies: Array<Omit<ProviderLanguage, "id"> & { id?: string | null }>;
}

export interface ProfileDraftResponse {
  /** False when no draft is stored — the payload is then seeded from the published profile. */
  hasDraft: boolean;
  basedOnVersion: number;
  lastStep: number;
  /** True when the published profile moved on since this draft was opened. */
  isStale: boolean;
  headline?: string | null;
  bio?: string | null;
  professionalOverview: ProfessionalOverviewContent;
  skills: string[];
  serviceCategories: string[];
  industries: string[];
  pricingModels: string[];
  experiences: ProviderExperience[];
  education: ProviderEducation[];
  languageProficiencies: ProviderLanguage[];
  updatedAt: string;
}

export interface SubmitProfileEditorRequest {
  basedOnVersion: number;
  draft: ProfileDraftRequest;
}

/** Server-decided outcome — the client never proposes it. */
export type ProfileEditorOutcome =
  | "ProfileUpdated"
  | "ProfileSubmittedPendingReview"
  | "VerificationComplete";

export interface ProfileEditorSubmitResponse {
  outcome: ProfileEditorOutcome;
  profile: ServiceProviderProfile;
  credentialsPendingReview: number;
}

export interface ServiceProviderProfile {
  providerId?: string | null;
  currentPhase: number;

  verificationStatus: VerificationStatus;
  verificationSubmittedAt?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;

  trustScore: number;
  /** False until at least one trust signal has data — show the neutral state. */
  hasEnoughTrustData: boolean;

  skills: string[];
  serviceCategories: string[];
  portfolioItems: PortfolioItem[];

  // ---- Stage 2 (D-2) ----
  headline?: string | null;
  bio?: string | null;
  profileImage?: ProviderMedia | null;
  coverImage?: ProviderMedia | null;
  professionalOverview?: ProfessionalOverviewContent;
  industries: string[];
  /** Legacy name-only mirror, kept in step with `languageProficiencies` during migration. */
  languages: string[];
  pricingModels: string[];

  // ---- Profile editor (split collections) ----
  experiences: ProviderExperience[];
  education: ProviderEducation[];
  languageProficiencies: ProviderLanguage[];
  /** Owner-scoped; empty on public projections. */
  credentials: ProviderCredential[];
  /** Optimistic-concurrency token echoed back on the next submit. */
  profileVersion: number;

  completionPercent: number;
  profileComplete: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface VerificationStatusResponse {
  providerId?: string | null;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  verificationSubmittedAt?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  trustScore: number;
}

// ---------------- Module 1: Profile & Trust ----------------

/** One trust signal. `value` is meaningful only when `hasData` is true. */
export interface TrustSignal {
  key:
    | "clientSatisfaction"
    | "onTimeDelivery"
    | "responseRate"
    | "repeatClientRate"
    | "skillTest";
  label: string;
  /** Weight as a percentage of the base (e.g. 40). */
  weight: number;
  hasData: boolean;
  /** Normalized 0–100 value (only meaningful when hasData). */
  value: number;
}

/** Derived TrustScore + breakdown. When `hasEnoughData` is false, show the neutral state. */
export interface TrustBreakdown {
  trustScore: number;
  hasEnoughData: boolean;
  signals: TrustSignal[];
  hasDisputes: boolean;
  disputePenalty: number;
  lastRecalculatedAt?: string | null;
  /** Platform tier (ranking-only badge; affects match ordering, not pricing). */
  tierLevel: number;
}

export interface SkillsTestCategoryStatus {
  category: string;
  hasAttempt: boolean;
  lastScore?: number | null;
  lastPassed?: boolean | null;
  lastTakenAt?: string | null;
  nextEligibleRetestAt?: string | null;
  canTakeNow: boolean;
}

export interface SkillsTestStatus {
  isVerified: boolean;
  passThresholdPercent: number;
  questionsPerAttempt: number;
  cooldownDays: number;
  categories: SkillsTestCategoryStatus[];
}

/** One question — never carries the correct answer. */
export interface SkillsTestQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface SkillsTestQuestions {
  category: string;
  questionCount: number;
  passThresholdPercent: number;
  questions: SkillsTestQuestion[];
}

export interface SkillsTestAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface SubmitSkillsTestRequest {
  category: string;
  answers: SkillsTestAnswer[];
}

export interface SkillsTestResult {
  category: string;
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  takenAt: string;
  nextEligibleRetestAt: string;
  trust: TrustBreakdown;
}

// ---------------- Request payloads ----------------

export interface UpsertProfileRequest {
  skills: string[];
  serviceCategories: string[];
  headline?: string | null;
  bio?: string | null;
  professionalOverview?: {
    schemaVersion: number;
    document: TiptapJson;
  } | null;
  industries: string[];
  languages: string[];
  pricingModels: string[];
}

/**
 * `imagePath` is intentionally absent: the image location is server-owned and is
 * only ever set by the portfolio media endpoints, which validate and re-encode
 * the file. Accepting it here let a caller point an item at any external URL.
 */
export interface AddPortfolioItemRequest {
  title: string;
  description?: string | null;
  url?: string | null;
  imageCaption?: string | null;
}

/** Addressed by stable id — an index goes stale as soon as another item is deleted. */
export interface UpdatePortfolioItemRequest extends AddPortfolioItemRequest {
  id: string;
}

export interface SubmitVerificationRequest {
  confirmAccuracy: boolean;
  note?: string | null;
}

// ---------------- Authoritative enum value sets ----------------
// Must match backend ServiceCategory / PricingModel names (ApplicationUser.cs);
// the backend rejects unknown names with a 400.

export const SERVICE_CATEGORIES = [
  "Development",
  "Design",
  "Marketing",
  "Legal",
  "Finance",
  "Accounting",
  "Operations",
  "Strategy",
  "DueDiligence",
  "FundraisingSupport",
  "AiAutomation",
  "HrRecruitment",
  "Other",
] as const;

export const PRICING_MODELS = [
  "FixedPrice",
  "Hourly",
  "MonthlyRetainer",
  "ProjectBased",
  "EquityCompensation",
  "RevenueShare",
  "Other",
] as const;
