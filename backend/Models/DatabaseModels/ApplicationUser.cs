using AspNetCore.Identity.MongoDbCore.Models;
using Microsoft.AspNetCore.Identity;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace WebApp.Models.DatabaseModels
{
    public class ApplicationUser : MongoIdentityUser<Guid>
    {
        [BsonElement("Name")]
        public string Name { get; set; }
        public string User { get; set; }

        [BsonElement("Phone")]
        public string Phone { get; set; }

        [BsonElement("Address")]
        public Address Address { get; set; }

        [BsonElement("ImagePath")]
        public string ImagePath { get; set; }

        [BsonElement("RefreshToken")]
        public RefreshToken RefreshToken { get; set; } = new();

        //[BsonElement("RefreshTokenExpiryTime")]
        //public DateTime RefreshTokenExpiryTime { get; set; }

        [BsonElement("Bio")]
        public string Bio { get; set; }

        [BsonElement("Title")]
        public string Title { get; set; }

        public string AvailableTime { get; set; }
        public string Geography { get; set; }
        public string Experience { get; set; }
        public string MainExperience { get; set; }
        public string linkedin_url { get; set; }

        [BsonElement("KycStatus")]
        public string KycStatus { get; set; } // Pending, Approved, Rejected

        [BsonElement("WalletBalance")]
        public double WalletBalance { get; set; }
        public int Tier_level { get; set; }
        public int Trust_score { get; set; }
        public int investor_ready_score { get; set; }


        [BsonElement("LastLogin")]
        public DateTime LastLogin { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public KycVerification Kyc { get; set; } = new();

        // Phase 1 universal onboarding state. Every role (Entrepreneur,
        // Creator, Investor, ServiceProvider) walks through Phase 1; the
        // gate is enforced by OnboardingGuard on the frontend and by
        // /api/auth/me reporting Onboarding.Phase < 1.
        [BsonElement("Onboarding")]
        public OnboardingState Onboarding { get; set; } = new();

        // Creator Profile (Phase 2+)
        [BsonElement("CreatorProfile")]
        public CreatorProfile CreatorProfile { get; set; } = new();

        // Entrepreneur Profile (Phase 2+)
        [BsonElement("EntrepreneurProfile")]
        public EntrepreneurProfile EntrepreneurProfile { get; set; } = new();

        // Investor Profile (Phase 2+)
        [BsonElement("InvestorProfile")]
        public InvestorProfile InvestorProfile { get; set; } = new();

        // Service Provider Profile (Phase 2+ — Stage 1: Verification & Onboarding only)
        [BsonElement("ServiceProviderProfile")]
        public ServiceProviderProfile ServiceProviderProfile { get; set; } = new();
    }

    public class OnboardingState
    {
        /// <summary>0 = not started, 1 = Phase 1 complete (all role-required items verified).</summary>
        public int Phase { get; set; } = 0;

        // --- Phone (step "phone") ---
        public bool PhoneVerified { get; set; }

        /// <summary>HMAC-SHA256 of the 6-digit code; never store the code itself.</summary>
        public string PhoneVerifyHash { get; set; }
        public DateTime? PhoneVerifyExpiresAt { get; set; }

        // --- Email (step "email") ---
        public bool EmailOtpVerified { get; set; }
        public string EmailOtpHash { get; set; }
        public DateTime? EmailOtpExpiresAt { get; set; }

        // --- Identity (step "identity") and Face (step "face") ---
        // Per product: two hub cards but a single shared SUMSUB session;
        // completing one verifies both. Dev shortcut flips both flags at once.
        public bool IdentityDocumentVerified { get; set; }
        public string IdentityDocumentType { get; set; } // passport, national_id, drivers_license
        public string IdentityFrontImagePath { get; set; }
        public string IdentityBackImagePath { get; set; }
        public DateTime? IdentityDocumentUploadedAt { get; set; }
        public bool FaceVerified { get; set; }

        // --- Optional / role-conditional documents ---
        public DocumentRecord Residence { get; set; } = new();
        public DocumentRecord Income { get; set; } = new();
        public DocumentRecord Tax { get; set; } = new();
        public DocumentRecord License { get; set; } = new();

        public DateTime? CompletedAt { get; set; }
    }

    /// <summary>One uploaded supplementary document.</summary>
    public class DocumentRecord
    {
        public bool Uploaded { get; set; }
        public string FilePath { get; set; }
        public DateTime? UploadedAt { get; set; }
    }

    public class Address
    {
        public string address { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
    }

    public class RefreshToken
    {
        public ObjectId Id { get; set; }

        //public string UserId { get; set; } = null!;
        public string Token { get; set; } = null!;

        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string CreatedByIp { get; set; } = "";
    }

    public class KycVerification
    {
        public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

        public IdentityVerification Identity { get; set; } = new();
        public FacialVerification Face { get; set; } = new();

        public DateTime? VerifiedAt { get; set; }
    }

    public class IdentityVerification
    {
        public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

        public string DocumentType { get; set; } // NID / Passport / DL
        public string DocumentNumber { get; set; }

        public string FrontImage { get; set; }
        public string BackImage { get; set; }

        public DateTime? SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }

        public string RejectionReason { get; set; }
    }

    public class FacialVerification
    {
        public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

        //public string SelfieImage { get; set; }

        //public double? MatchScore { get; set; } // AI ready

        public DateTime? SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }

        public string RejectionReason { get; set; }
    }

    public enum VerificationStatus
    {
        Pending,
        Verified,
        Rejected
    }

    // Creator Profile (Phase 2+)
    public class CreatorProfile
    {
        public int IpVaultCount { get; set; } = 0;
        public int PublishedIdeas { get; set; } = 0;
        public int ActiveListings { get; set; } = 0;
        public string CrossRoadsDecision { get; set; } = "PENDING"; // PATH_A | PATH_B | PENDING
        public List<string> SocialProfiles { get; set; } = new(); // URLs
        public string Bio { get; set; }
        public List<string> Categories { get; set; } = new(); // Idea categories
    }

    // Entrepreneur Profile (Phase 2+)
    public class EntrepreneurProfile
    {
        public string CompanyId { get; set; }
        public int CurrentPhase { get; set; } = 1;
        public bool LegalVerified { get; set; } = false;
        public bool FinancialValidated { get; set; } = false;
        public bool CapTableReady { get; set; } = false;
        public DateTime? Phase2CompletedAt { get; set; }
    }

    // Investor Profile (Phase 2+)
    public class InvestorProfile
    {
        public string InvestorId { get; set; }
        public int CurrentPhase { get; set; } = 1;
        public bool FinanceVerified { get; set; } = false;
        public DateTime? FinanceVerificationSubmittedAt { get; set; }
        public bool ThesisSubmitted { get; set; } = false;
        public bool ProfilePublished { get; set; } = false;
        public List<string> NdasSigned { get; set; } = new();
        public List<string> DataRoomsAccessed { get; set; } = new();
    }

    // Service Provider Profile (Phase 2+ — Stage 1: Verification & Onboarding only).
    // Mirrors the embedded InvestorProfile/CreatorProfile pattern: lives on
    // ApplicationUser, no separate collection. Stage 1 covers verification and
    // onboarding state ONLY — no marketplace, matching, proposal, workroom,
    // milestone, escrow, review, or reputation fields belong here yet.
    public class ServiceProviderProfile
    {
        public string ProviderId { get; set; }
        public int CurrentPhase { get; set; } = 1;

        // Provider verification is tracked SEPARATELY from identity KYC
        // (ApplicationUser.Kyc / VerificationStatus). A provider may be
        // KYC-approved yet still Pending provider verification, and vice versa.
        public ServiceProviderVerificationStatus VerificationStatus { get; set; } = ServiceProviderVerificationStatus.Pending;
        public DateTime? VerificationSubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string RejectionReason { get; set; }

        // Reputation seed for later stages; 0 until verification produces a score.
        public double TrustScore { get; set; } = 0;

        public List<string> Skills { get; set; } = new();
        public List<ServiceCategory> ServiceCategories { get; set; } = new();
        public List<PortfolioItem> PortfolioItems { get; set; } = new();

        // ---- Stage 2: Provider Profile (D-2 Phase 1) ----
        // Public-facing profile fields. Additive to the embedded document: legacy
        // Stage-1 records without these elements deserialize to safe defaults
        // (null strings, empty lists). Per the locked D-2 decision audit:
        // Services stays expressed by ServiceCategories (no new field); Industries
        // and Languages are free-form strings normalized like Skills (no enum, no
        // lookup collection); Certifications/ExternalLinks are deferred.
        public string Headline { get; set; }
        public string Bio { get; set; }
        public List<string> Industries { get; set; } = new();
        public List<string> Languages { get; set; } = new();
        public List<PricingModel> PricingModels { get; set; } = new();

        // ---- Module 1: Profile & Trust (reputation layer) ----
        // TrustScore (above) is DERIVED from TrustBreakdown by the service recompute and
        // is never hand-set by an endpoint. HasEnoughTrustData is false until at least one
        // signal has data (skill test alone qualifies).
        public TrustScoreBreakdown TrustBreakdown { get; set; } = new();
        public bool HasEnoughTrustData { get; set; } = false;

        // Skills-test attempts, bounded by the 30-day retest cooldown. Optional and
        // non-blocking; feeds only the SkillTest signal of TrustBreakdown.
        public List<SkillsTestAttempt> SkillsTestAttempts { get; set; } = new();

        // ---- Module 2: Service Catalog — provider capacity (canon §6.7) ----
        // Additive fields (legacy docs deserialize to defaults, like the Module 1
        // additions above). Instant order is blocked when CurrentActiveOrders >=
        // MaximumConcurrentOrders (unless overbooking is allowed). CurrentActiveOrders
        // has NO writer in Module 2 — only Module 4 (engagements) increments it live;
        // the field + capacity check exist and are unit-testable now.
        public int MaximumConcurrentOrders { get; set; }
        public int CurrentActiveOrders { get; set; }
        public bool NewOrderAvailability { get; set; } = true;
        public bool ManualApprovalWhenCapacityLow { get; set; }

        // ---- Module 4: bounded financial preferences (embedded by canon §1.3) ----
        public ProviderFinancialSettings FinancialSettings { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ProviderFinancialSettings
    {
        public List<MaskedPayoutMethod> PayoutMethods { get; set; } = new();
        public string? DefaultPayoutMethodId { get; set; }
        public ProviderTaxSettings Tax { get; set; } = new();
        public bool AccountOnHold { get; set; }
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal MinimumPayoutAmount { get; set; } = 25m;
    }

    public class MaskedPayoutMethod
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public PayoutRail Rail { get; set; }
        public string DisplayName { get; set; } = "";
        public string MaskedDescriptor { get; set; } = "";
        public bool Verified { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ProviderTaxSettings
    {
        public string LegalName { get; set; } = "";
        public string CountryCode { get; set; } = "";
        public string? TaxIdentifierMasked { get; set; }
        public bool VatRegistered { get; set; }
        public string? VatNumberMasked { get; set; }
    }

    // One reputation signal feeding TrustScore: a normalized 0–100 value and whether it
    // has any real data yet. Signals where HasData is false are ignored by the recompute.
    public class TrustSignal
    {
        public bool HasData { get; set; } = false;

        // Normalized 0–100 contribution value (raw, pre-weight).
        public double Value { get; set; } = 0;
    }

    // Component breakdown for the derived TrustScore. Weights (locked): Client
    // Satisfaction 40, On-time Delivery 25, Response Rate 15, Repeat-Client Rate 10,
    // Skill Test 10 (sum 100). Dispute penalty is NOT part of the 100 base — it only
    // subtracts from the final score when disputes exist. Only signals with data are
    // renormalized into the score; the rest are ignored until their source module fills
    // them (Leads → response rate; Workroom → satisfaction/on-time/repeat/dispute).
    public class TrustScoreBreakdown
    {
        public TrustSignal ClientSatisfaction { get; set; } = new();
        public TrustSignal OnTimeDelivery { get; set; } = new();
        public TrustSignal ResponseRate { get; set; } = new();
        public TrustSignal RepeatClientRate { get; set; } = new();
        public TrustSignal SkillTest { get; set; } = new();

        // True once at least one dispute has been recorded against the provider.
        public bool HasDisputes { get; set; } = false;

        // Points subtracted from the final score (0–100). Applied only when HasDisputes.
        public double DisputePenalty { get; set; } = 0;

        public DateTime? LastRecalculatedAt { get; set; }
    }

    // One skills-test attempt. Bounded by the 30-day retest cooldown, so the per-provider
    // list stays small. Feeds only the SkillTest trust signal; never gates verification or
    // any dashboard section.
    public class SkillsTestAttempt
    {
        public ServiceCategory Category { get; set; }

        // Percentage score 0–100.
        public int Score { get; set; }
        public bool Passed { get; set; }
        public DateTime TakenAt { get; set; } = DateTime.UtcNow;

        // Earliest UTC time the provider may retest this category (TakenAt + 30 days).
        public DateTime NextEligibleRetestAt { get; set; }
    }

    // One showcase item in a service provider's portfolio.
    public class PortfolioItem
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Url { get; set; }
        public string ImagePath { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }

    // Provider verification lifecycle — deliberately distinct from the KYC
    // VerificationStatus enum so the two concerns can evolve independently.
    public enum ServiceProviderVerificationStatus
    {
        Pending,
        UnderReview,
        Verified,
        Rejected
    }

    // Service domains a provider can offer. Stage 1 captures these at
    // onboarding; matching/marketplace consumption comes in later stages.
    // Authoritative list = Doc 05 "Supported Categories" (12 entries, order
    // preserved). Other is an appended expansion catch-all and MUST stay last
    // so the serialized Int32 ordinals of the authoritative entries are stable.
    public enum ServiceCategory
    {
        Development,
        Design,
        Marketing,
        Legal,
        Finance,
        Accounting,
        Operations,
        Strategy,
        DueDiligence,
        FundraisingSupport,
        AiAutomation,
        HrRecruitment,
        Other
    }

    // Pricing arrangements a provider is willing to work under (Stage 2). Locked
    // D-2 decision audit values. Serialized as Int32 ordinals like ServiceCategory,
    // so Other MUST stay last and existing entries MUST keep their order to keep
    // persisted ordinals stable across releases.
    public enum PricingModel
    {
        FixedPrice,
        Hourly,
        MonthlyRetainer,
        ProjectBased,
        EquityCompensation,
        RevenueShare,
        Other
    }
}
