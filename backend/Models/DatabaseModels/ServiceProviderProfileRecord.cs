using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// Service Provider business data as its own root document
    /// (ServiceProviderProfiles collection), joined by unique UserId. Holds ONLY
    /// SP-specific concerns: verification, tier, categories/pricing, portfolio,
    /// trust/reputation, skills tests, order capacity and financial settings.
    /// Shared professional fields (headline, bio, overview, media, experience,
    /// education, skills, languages, industries) live on
    /// <see cref="ProfessionalProfileRecord"/>.
    ///
    /// The embedded ApplicationUser.ServiceProviderProfile remains as a read-only
    /// legacy fallback until Phase 6 of the approved migration; no SP service
    /// writes it after cutover.
    /// </summary>
    public class ServiceProviderProfileRecord
    {
        [BsonId]
        public ObjectId Id { get; set; } = ObjectId.GenerateNewId();

        /// <summary>Owning ApplicationUser id (unique index). The only join key.</summary>
        public string UserId { get; set; } = "";

        public string ProviderId { get; set; } = "";

        public int CurrentPhase { get; set; } = 1;

        public ServiceProviderVerificationStatus VerificationStatus { get; set; }
            = ServiceProviderVerificationStatus.Pending;

        public DateTime? VerificationSubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string? RejectionReason { get; set; }

        /// <summary>
        /// SERVER-CONTROLLED Service Provider tier — the SP tier source of truth
        /// after cutover (SP matching, analytics and badges read this, not the
        /// legacy ApplicationUser.Tier_level). Tier 1 is the default; verification
        /// approval may assign Tier 2; Tier 3/4 require authorised server-side
        /// evaluation. No provider-initiated write can change it. Tier affects
        /// match priority, not pricing — the platform commission stays a fixed 12%.
        /// </summary>
        public ProviderTier ProviderTier { get; set; } = ProviderTier.Tier1;

        public List<ServiceCategory> ServiceCategories { get; set; } = new();
        public List<PricingModel> PricingModels { get; set; } = new();

        public List<PortfolioItem> PortfolioItems { get; set; } = new();

        /// <summary>Derived from TrustBreakdown by the service recompute; never client-set.</summary>
        public double TrustScore { get; set; }
        public TrustScoreBreakdown TrustBreakdown { get; set; } = new();
        public bool HasEnoughTrustData { get; set; }
        public List<SkillsTestAttempt> SkillsTestAttempts { get; set; } = new();

        public int MaximumConcurrentOrders { get; set; }

        /// <summary>Written only by the engagement lifecycle (targeted increments).</summary>
        public int CurrentActiveOrders { get; set; }

        public bool NewOrderAvailability { get; set; } = true;
        public bool ManualApprovalWhenCapacityLow { get; set; }

        public ProviderFinancialSettings FinancialSettings { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Service Provider tier ladder. Serialized as Int32 (explicit values locked).
    /// Tier gates match priority and marketplace eligibility only — it never
    /// changes pricing, payouts, or the fixed 12% platform commission.
    /// </summary>
    public enum ProviderTier
    {
        Tier1 = 1,
        Tier2 = 2,
        Tier3 = 3,
        Tier4 = 4,
    }
}
