using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// Role-neutral professional profile, one document per user, joined by unique
    /// UserId (no back-reference is stored on ApplicationUser). Introduced by the
    /// approved Service Provider data split — INITIALLY POPULATED AND CONSUMED BY
    /// SERVICE PROVIDERS ONLY. Creator, Entrepreneur and Investor keep their
    /// existing embedded models; their adoption requires a separate approved
    /// migration.
    ///
    /// Field bytes for media stay on disk via SaveFile; this document stores
    /// references and metadata only — never binary or Base64 content.
    /// </summary>
    public class ProfessionalProfileRecord
    {
        [BsonId]
        public ObjectId Id { get; set; } = ObjectId.GenerateNewId();

        /// <summary>Owning ApplicationUser id (unique index). The only join key.</summary>
        public string UserId { get; set; } = "";

        /// <summary>Permanent, URL-safe public profile slug (unique index). Created once and never changed on name/headline/role updates.</summary>
        public string PublicSlug { get; set; } = "";

        public string Headline { get; set; } = "";
        public string Bio { get; set; } = "";

        public ProfessionalOverviewContent ProfessionalOverview { get; set; } = new();

        public ProviderMediaAsset? ProfileImage { get; set; }
        public ProviderMediaAsset? CoverImage { get; set; }

        public List<ProfessionalExperience> Experiences { get; set; } = new();
        public List<ProfessionalEducation> Education { get; set; } = new();

        public List<string> Skills { get; set; } = new();

        public List<ProfessionalLanguage> LanguageProficiencies { get; set; } = new();

        /// <summary>Temporary compatibility mirror during migration only. Kept in
        /// step with LanguageProficiencies on every write; removed in Phase 6.</summary>
        public List<string> Languages { get; set; } = new();

        public List<string> Industries { get; set; } = new();
        public List<ProfessionalSocialLink> SocialLinks { get; set; } = new();

        /// <summary>Public display only ("available now" badge). Order capacity
        /// stays SP-specific on ServiceProviderProfileRecord and remains the
        /// authoritative eligibility source.</summary>
        public bool? AvailabilityDisplay { get; set; }

        /// <summary>
        /// Optimistic-concurrency token for the professional profile. Incremented by
        /// exactly one on every successful published write; the editor's submit
        /// compares its draft BasedOnVersion against this and conflicts when stale.
        /// </summary>
        public int ProfileVersion { get; set; }

        /// <summary>Owner-only working copy for the four-step editor. Never read by
        /// any public projection.</summary>
        public ProfessionalProfileDraft? EditorDraft { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>One external professional link (e.g. LinkedIn, portfolio site).</summary>
    public class ProfessionalSocialLink
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Platform { get; set; } = "";

        /// <summary>Absolute http(s) URL, validated at the request boundary.</summary>
        public string Url { get; set; } = "";
    }
}
