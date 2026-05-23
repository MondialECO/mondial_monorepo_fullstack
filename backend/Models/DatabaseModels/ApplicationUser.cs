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
}
