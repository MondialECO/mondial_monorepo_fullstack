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

        public List<ProfileSkill> Skills { get; set; } = new();

        /// <summary>Optional venture context for founders/creators/entrepreneurs.</summary>
        public ProfileVentureContext? VentureContext { get; set; }

        /// <summary>Durable state for Creator HumainX Quick Start onboarding.</summary>
        [BsonElement("quickStart")]
        public HumainXQuickStartState? QuickStart { get; set; }

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

    /// <summary>A leveled skill entry on the professional profile.</summary>
    [BsonIgnoreExtraElements]
    public class ProfileSkill
    {
        [BsonElement("name")]
        public string Name { get; set; } = "";

        /// <summary>Self-declared proficiency level (e.g. Beginner, Intermediate, Advanced, Expert). Never auto-inferred.</summary>
        [BsonElement("level")]
        public string? Level { get; set; }

        /// <summary>Source of the skill entry (e.g. "legacy", "self_declared").</summary>
        [BsonElement("source")]
        public string? Source { get; set; }

        /// <summary>Optional verification metadata or proof reference.</summary>
        [BsonElement("verification")]
        public object? Verification { get; set; }

        [BsonExtraElements]
        public BsonDocument? ExtraElements
        {
            get => null;
            set
            {
                if (value == null) return;
                if (string.IsNullOrEmpty(Name) && value.TryGetValue("Name", out var nameVal) && nameVal.IsString)
                    Name = nameVal.AsString;
                if (string.IsNullOrEmpty(Level) && value.TryGetValue("Level", out var levelVal) && levelVal.IsString)
                    Level = levelVal.AsString;
                if (string.IsNullOrEmpty(Source) && value.TryGetValue("Source", out var sourceVal) && sourceVal.IsString)
                    Source = sourceVal.AsString;
            }
        }

        public static implicit operator ProfileSkill(string name) => new() { Name = name, Source = "legacy" };
        public override string ToString() => Name;
    }

    /// <summary>Optional founder venture context on the professional profile.</summary>
    [BsonIgnoreExtraElements]
    public class ProfileVentureContext
    {
        [BsonElement("currentSituation")]
        public string? CurrentSituation { get; set; }

        [BsonElement("weeklyAvailability")]
        public string? WeeklyAvailability { get; set; }

        [BsonElement("region")]
        public string? Region { get; set; }

        [BsonElement("previousEntrepreneurialExperience")]
        public string? PreviousEntrepreneurialExperience { get; set; }

        [BsonElement("learningPreference")]
        public string? LearningPreference { get; set; }

        [BsonElement("delegationPreference")]
        public string? DelegationPreference { get; set; }

        [BsonExtraElements]
        public BsonDocument? ExtraElements
        {
            get => null;
            set
            {
                if (value == null) return;
                if (string.IsNullOrEmpty(CurrentSituation) && value.TryGetValue("CurrentSituation", out var cs) && cs.IsString)
                    CurrentSituation = cs.AsString;
                if (string.IsNullOrEmpty(WeeklyAvailability) && value.TryGetValue("WeeklyAvailability", out var wa) && wa.IsString)
                    WeeklyAvailability = wa.AsString;
                if (string.IsNullOrEmpty(Region) && value.TryGetValue("Region", out var reg) && reg.IsString)
                    Region = reg.AsString;
                if (string.IsNullOrEmpty(PreviousEntrepreneurialExperience) && value.TryGetValue("PreviousEntrepreneurialExperience", out var pe) && pe.IsString)
                    PreviousEntrepreneurialExperience = pe.AsString;
                if (string.IsNullOrEmpty(LearningPreference) && value.TryGetValue("LearningPreference", out var lp) && lp.IsString)
                    LearningPreference = lp.AsString;
                if (string.IsNullOrEmpty(DelegationPreference) && value.TryGetValue("DelegationPreference", out var dp) && dp.IsString)
                    DelegationPreference = dp.AsString;
            }
        }
    }

    /// <summary>
    /// Durable backend state for the one-time Creator HumainX Quick Start onboarding flow.
    /// Canonical source of truth for dashboard access (completedAt != null).
    /// </summary>
    [BsonIgnoreExtraElements]
    public class HumainXQuickStartState
    {
        [BsonElement("version")]
        public int Version { get; set; } = 1;

        [BsonElement("step1ConfirmedAt")]
        public DateTime? Step1ConfirmedAt { get; set; }

        [BsonElement("step2ConfirmedAt")]
        public DateTime? Step2ConfirmedAt { get; set; }

        [BsonElement("step3ConfirmedAt")]
        public DateTime? Step3ConfirmedAt { get; set; }

        [BsonElement("completedAt")]
        public DateTime? CompletedAt { get; set; }

        [BsonExtraElements]
        public BsonDocument? ExtraElements
        {
            get => null;
            set
            {
                if (value == null) return;
                if (value.TryGetValue("Version", out var v) && v.IsInt32) Version = v.AsInt32;
                if (value.TryGetValue("Step1ConfirmedAt", out var s1) && s1.IsValidDateTime) Step1ConfirmedAt = s1.ToUniversalTime();
                if (value.TryGetValue("Step2ConfirmedAt", out var s2) && s2.IsValidDateTime) Step2ConfirmedAt = s2.ToUniversalTime();
                if (value.TryGetValue("Step3ConfirmedAt", out var s3) && s3.IsValidDateTime) Step3ConfirmedAt = s3.ToUniversalTime();
                if (value.TryGetValue("CompletedAt", out var comp) && comp.IsValidDateTime) CompletedAt = comp.ToUniversalTime();
            }
        }
    }
}
