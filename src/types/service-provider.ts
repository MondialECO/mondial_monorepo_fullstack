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

export interface PortfolioItem {
  index: number;
  title: string;
  description?: string | null;
  url?: string | null;
  imagePath?: string | null;
  addedAt: string;
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
  industries: string[];
  languages: string[];
  pricingModels: string[];

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
  industries: string[];
  languages: string[];
  pricingModels: string[];
}

export interface AddPortfolioItemRequest {
  title: string;
  description?: string | null;
  url?: string | null;
  imagePath?: string | null;
}

export interface UpdatePortfolioItemRequest extends AddPortfolioItemRequest {
  index: number;
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
