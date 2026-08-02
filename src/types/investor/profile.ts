// Investor self-service profile (Phase 3 Investment Thesis + Phase 4 Public
// Profile). Mirrors backend InvestorProfileResponse / UpdateInvestorProfileRequest
// (backend/Models/Dtos/InvestorProfileDtos.cs), serialized camelCase.

export interface InvestorProfile {
  id: string | null;
  userId: string;
  name: string | null;
  email: string | null;
  type: string | null;

  // Public profile (Phase 4)
  headline: string | null;
  bio: string | null;
  website: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  socialLinks: Record<string, string>;
  isPublic: boolean;

  // Investment preferences
  preferredSectors: string[];
  preferredStages: string[];
  minCheckSize: number;
  maxCheckSize: number;
  preferredGeographies: string[];
  requiresProRataRights: boolean;
  requiresBoardSeat: boolean;
  preferredEquityTypes: string[];

  // Investment thesis (Phase 3)
  thesisStatement: string | null;
  targetReturnMultiple: string | null;
  followOnPolicy: string | null;
  preferredRole: string | null;
  boardParticipationLevel: string | null;

  // Track record / activity
  successfulExits: number;
  averageCheckSize: number;
  completedDeals: number;
  activeInvestments: number;

  // Contact + metadata
  primaryContact: string | null;
  primaryPhone: string | null;
  isActive: boolean;
  linked: boolean;
}

// Partial-update payload for PUT /api/investor/profile. Only the fields the
// thesis wizard owns are declared here (Phase 3 scope).
export interface InvestorThesisInput {
  preferredSectors?: string[];
  preferredStages?: string[];
  minCheckSize?: number;
  maxCheckSize?: number;
  preferredGeographies?: string[];
  requiresProRataRights?: boolean;
  requiresBoardSeat?: boolean;
  preferredEquityTypes?: string[];
  thesisStatement?: string;
  targetReturnMultiple?: string;
  followOnPolicy?: string;
  preferredRole?: string;
  boardParticipationLevel?: string;
}

// Public-profile editable fields (Phase 4 scope). Mirrors the writable subset
// of the backend UpdateInvestorProfileRequest.
export interface InvestorProfileEditInput {
  name?: string;
  type?: string;
  primaryContact?: string;
  primaryPhone?: string;
  headline?: string;
  bio?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  socialLinks?: Record<string, string>;
  isPublic?: boolean;
  successfulExits?: number;
  averageCheckSize?: number;
}

// Superset accepted by PUT /api/investor/profile. InvestorThesisInput (Phase 3)
// remains assignable to this, so the existing wizard keeps type-checking.
export type UpdateInvestorProfileInput = InvestorThesisInput & InvestorProfileEditInput;
