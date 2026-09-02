using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Linq;
using System.Text.Json.Serialization;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// Source of truth for the Creator journey, Phases 2–6. One document per user.
    ///
    /// ARCHITECTURE NOTE — phase/step status is NEVER stored here. It is DERIVED on
    /// every read by <c>ICreatorJourneyService.ComputePhaseStatusAsync</c> from the
    /// presence of artifacts in this document plus the user's onboarding state.
    /// Storing status caused audit risks R1 (mutation-on-load corrupting a shared
    /// constant) and R2 (non-monotonic regression); deriving it makes both
    /// structurally impossible — there is no status field to corrupt or regress.
    ///
    /// Phase 1 (universal identity verification) lives on <c>ApplicationUser.Onboarding</c>,
    /// not here; the engine reconciles it.
    /// </summary>
    public class CreatorJourney
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        /// <summary>ApplicationUser.Id (Guid) as string. Unique index.</summary>
        public string UserId { get; set; }

        /// <summary>Links the journey to the AI idea record. Null until the clarifier creates one (fixes R10).</summary>
        public string BusinessIdeaId { get; set; }

        /// <summary>Set when a company is spun out at Phase 5B (Build path). Null otherwise.</summary>
        public string CompanyId { get; set; }

        // ---- Multi-idea foundation (STEP 1, additive) ----
        // These point into the new CreatorIdeas collection. Written by the backfill
        // migration; NOT yet read by any controller/resolver/frontend, so the app
        // behaves identically. The inline Project/Phase2-6 blocks below remain the live
        // source of truth until a later step switches the read path.

        /// <summary>The user's currently-selected idea (CreatorIdea._id). Null until migrated.</summary>
        public string ActiveIdeaId { get; set; }

        /// <summary>The idea taken through Level Up, if any (entrepreneur side stays 1:1). Null otherwise.</summary>
        public string LeveledUpIdeaId { get; set; }

        public CreatorJourneyProject Project { get; set; } = new();

        public CreatorPhase2Data Phase2Data { get; set; } = new();
        public CreatorPhase3Data Phase3Data { get; set; } = new();
        public CreatorPhase4Data Phase4Data { get; set; } = new();
        public CreatorPhase5Data Phase5Data { get; set; } = new();
        public CreatorPhase6Data Phase6Data { get; set; } = new();

        public CreatorOutputSnapshots OutputSnapshots { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Response-only version of the CreatorIdea overlaid into this journey.</summary>
        [BsonIgnore]
        public long IdeaVersion { get; set; }

        /// <summary>Response-only overlaid IdeaId from CreatorIdea.</summary>
        [BsonIgnore]
        public string? IdeaId { get; set; }

        /// <summary>Response-only overlaid ProjectOutcome (e.g. "CO_FOUNDED", "SOLD").</summary>
        [BsonIgnore]
        public string? ProjectOutcome { get; set; }

        /// <summary>Response-only overlaid ActivePartnershipDealId.</summary>
        [BsonIgnore]
        public string? ActivePartnershipDealId { get; set; }
    }

    // ---------------- Project (canonical idea) ----------------

    public class CreatorJourneyProject
    {
        public string Name { get; set; } = string.Empty;
        public string Tagline { get; set; } = string.Empty;
        public string Concept { get; set; } = string.Empty;
        public string TargetUser { get; set; } = string.Empty;
        public string Problem { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string MarketGap { get; set; } = string.Empty;
        public string CreatorEdge { get; set; } = string.Empty;
        /// <summary>How users address the problem today; empty for legacy ideas without evidence.</summary>
        public string ExistingAlternatives { get; set; } = string.Empty;
        /// <summary>Founder-supplied timing rationale; never inferred for legacy ideas.</summary>
        public string WhyNow { get; set; } = string.Empty;
        /// <summary>Founder-supplied highest-risk assumption; never fabricated by a backfill.</summary>
        public string RiskiestAssumption { get; set; } = string.Empty;
        /// <summary>clarifier | discovery | empty for legacy ideas.</summary>
        public string SourceMethod { get; set; } = string.Empty;
        public string TargetMarket { get; set; } = string.Empty;
        public string Geography { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public double ClarityScore { get; set; }
        public string Sector { get; set; } = string.Empty;
        public CreatorBranding Branding { get; set; } = new();
        public int CurrentVersion { get; set; } = 1;
    }

    public class CreatorBranding
    {
        /// <summary>"ai" | "designer" | null.</summary>
        public string LogoType { get; set; }
        public string LogoAsset { get; set; }
        public List<string> ColorPalette { get; set; } = new();
        public string PaletteName { get; set; } = string.Empty;
        public string TypographyPairing { get; set; } = string.Empty;

        /// <summary>"ai_logo" | "m50_designer" | "pending" — pending never blocks Phase 3.</summary>
        public string BrandingMethod { get; set; }

        public string? DesignerId { get; set; }
        public string? ConversationId { get; set; }
        public DateTime? BookedAt { get; set; }
    }

    // ---------------- Phase 2 ----------------

    public class CreatorPhase2Data
    {
        /// <summary>Only "already_have_idea" is accepted. "needs_discovery" is removed.</summary>
        public string SelectedEntryPath { get; set; }
        public List<CreatorChatMessage> ChatMessages { get; set; } = new();
        public string ClarifierSessionId { get; set; }

        // Discovery path working state (independent, additive, additive, never touch existing fields above).
        public CreatorDiscoveryInputs DiscoveryInputs { get; set; }
        public List<CreatorDiscoveryConcept> GeneratedConcepts { get; set; }
        public string SelectedConceptId { get; set; }
    }

    public class CreatorChatMessage
    {
        public string Id { get; set; }
        public string Sender { get; set; } // "ai" | "user"
        public string Text { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class CreatorDiscoveryInputs
    {
        public List<string> Sectors { get; set; } = new();
        public string ObservedProblem { get; set; }
        public List<string> Strengths { get; set; } = new();
    }

    public class CreatorDiscoveryConcept
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public double Score { get; set; }
        public string Tam { get; set; }
        public string Saturation { get; set; }
        public string SimilarTo { get; set; }
        public string Concept { get; set; }
        public string TargetUser { get; set; }
        public string CoreProblem { get; set; }
        public string Solution { get; set; }
        public string MarketGap { get; set; }
        public string FounderEdge { get; set; }
    }

    // ---------------- Phase 3 ----------------

    public class CreatorPhase3Data
    {
        public string ForecastSessionId { get; set; }
        public string BusinessPlanSessionId { get; set; }
        public CreatorLegalChecklist LegalChecklist { get; set; }
        public CreatorFormationGenerator FormationGenerator { get; set; }
        public CreatorInvestorReadinessScore InvestorReadinessScore { get; set; }
    }

    public class CreatorLegalChecklist
    {
        public List<CreatorLegalChecklistItem> Items { get; set; } = new();
        public int CompletedCount { get; set; }
        public int TotalCount { get; set; }
    }

    public class CreatorLegalChecklistItem
    {
        public string Id { get; set; }
        public string Label { get; set; }
        public string Category { get; set; }       // mandatory | conditional | optional
        public string Status { get; set; } = "pending"; // pending | in_progress | done
        public string Badge { get; set; }          // urgent | fintech | null
        public bool ShowFindSp { get; set; }
        public string SpSpecialty { get; set; }
        public bool AiGenerable { get; set; }
    }

    public class CreatorFormationGenerator
    {
        public string RecommendedType { get; set; } // SAS | SAS-U | SARL
        public string RecommendationReason { get; set; }
        public CreatorFormationForecastBasis ForecastBasis { get; set; }
        public List<CreatorFormationOption> Options { get; set; } = new();
        public List<string> YouHave { get; set; } = new();
        public List<CreatorSkillGap> YouNeed { get; set; } = new();
        public List<string> MatchedSpIds { get; set; } = new();
        public string SelectedType { get; set; }

        // True once the creator SELF-DECLARES skills on 3.5b — YouHave then holds their
        // declared chip set, not the ExtractStrengths echo. Guards the generate path from
        // overwriting declarations (see GenerateFormation).
        public bool SkillsDeclared { get; set; }

        // Co-founder preferences captured on 3.5b. Stored now; matched at Level Up (P6),
        // never in Phase 3 (matchmaking is a P6 privilege).
        public CreatorCofounderDraft CofounderDraft { get; set; }
    }

    public class CreatorFormationOption
    {
        public string Code { get; set; }
        public string Description { get; set; }
        public string Capital { get; set; }
        public string FormationTime { get; set; }
        public string EstimatedCost { get; set; }
    }

    public class CreatorFormationForecastBasis
    {
        public string ForecastSessionId { get; set; }
        public double? MonthlyGrowthPct { get; set; }
        public double? Tam { get; set; }
        public double? Opex { get; set; }
        public int? BreakEvenMonth { get; set; }
        public string Currency { get; set; }
        public DateTime ForecastUpdatedAt { get; set; }
    }

    public class CreatorCofounderDraft
    {
        public string RoleNeeded { get; set; }
        public string EquityRange { get; set; }
        public string LocationPreference { get; set; } // remote | local | either
    }

    public class CreatorSkillGap
    {
        public string Label { get; set; }
        public string SpSpecialty { get; set; } // development | legal | branding | finance
    }

    public class CreatorInvestorReadinessScore
    {
        public double Total { get; set; }
        public string Label { get; set; } // Not Ready | Developing | Strong | Investor-Ready
        public CreatorReadinessBreakdown Breakdown { get; set; } = new();
    }

    public class CreatorReadinessBreakdown
    {
        public double ConceptClarity { get; set; }
        public double MarketEvidence { get; set; }
        public double FinancialModel { get; set; }
        public double LegalReadiness { get; set; }
        public double TeamCredibility { get; set; }
    }

    // ---------------- Phase 4 ----------------

    public class CreatorPhase4Data
    {
        public string PricingModel { get; set; } // subscription | one_time | freemium | usage_based
        public List<CreatorPricingTier> Tiers { get; set; } = new();
        /// <summary>
        /// The forecast input that Pricing was compared against when the Creator last
        /// saved their chosen tiers. It is context only: the forecast is never mutated
        /// by a commercial-pricing save.
        /// </summary>
        public CreatorPricingForecastContext? PricingForecastContext { get; set; }
        public CreatorResourceCalculation ResourceCalculation { get; set; }
        public CreatorGtmSetup GtmSetup { get; set; }
    }

    public class CreatorPricingForecastContext
    {
        public string ForecastSessionId { get; set; } = "";
        public decimal? ForecastArpu { get; set; }
        public DateTime ForecastUpdatedAt { get; set; }
        public bool IsPotentiallyOutdated { get; set; }
    }

    public class CreatorPricingTier
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public string BillingCycle { get; set; }
        public List<string> Features { get; set; } = new();
        public bool IsHighlighted { get; set; }
    }

    public class CreatorResourceCalculation
    {
        public List<CreatorTeamRequirement> TeamRequirements { get; set; } = new();
        public List<CreatorSaasItem> SaasStack { get; set; } = new();
        public decimal TotalLaunchBudgetMin { get; set; }
        public decimal TotalLaunchBudgetMax { get; set; }
        public int TimeToLaunchWeeksMin { get; set; }
        public int TimeToLaunchWeeksMax { get; set; }
        public decimal MonthlyRunningCost { get; set; }
        public CreatorBudgetBreakdown BudgetBreakdown { get; set; } = new();
    }

    public class CreatorTeamRequirement
    {
        public string Role { get; set; }
        public decimal Cost { get; set; }
        public int DurationMonths { get; set; }
        public bool OneTime { get; set; }
    }

    public class CreatorSaasItem
    {
        public string Name { get; set; }
        public decimal MonthlyCost { get; set; }
    }

    public class CreatorBudgetBreakdown
    {
        public double TeamPct { get; set; }
        public double ToolsPct { get; set; }
        public double LegalPct { get; set; }
        public double MiscPct { get; set; }
    }

    public class CreatorGtmSetup
    {
        public List<CreatorWebPresenceItem> WebPresence { get; set; } = new();

        [BsonElement("BenchmarkGtmWeeks")]
        public List<CreatorGtmWeek> BenchmarkGtmWeeks { get; set; } = new();

        // Read bridge for Phase 4 documents persisted before the field was renamed.
        // The null getter + IgnoreIfNull ensure all new writes use only the honest
        // BenchmarkGtmWeeks name; no data migration is required.
        [BsonElement("AiGtmWeeks")]
        [BsonIgnoreIfNull]
        [JsonIgnore]
        public List<CreatorGtmWeek>? LegacyAiGtmWeeks
        {
            get => null;
            set
            {
                if ((BenchmarkGtmWeeks == null || BenchmarkGtmWeeks.Count == 0) && value != null)
                    BenchmarkGtmWeeks = value;
            }
        }

        public List<string> TargetAudiences { get; set; } = new();
        public List<CreatorChannelMix> ChannelMix { get; set; } = new();
    }

    public class CreatorWebPresenceItem
    {
        public string Id { get; set; }
        public string Label { get; set; }
        public bool Done { get; set; }
    }

    public class CreatorGtmWeek
    {
        public int Week { get; set; }
        public string Title { get; set; }
        public List<string> Tasks { get; set; } = new();
        public bool Completed { get; set; }
    }

    public class CreatorChannelMix
    {
        public string Channel { get; set; }
        public double Percent { get; set; }
    }

    // ---------------- Phase 5 ----------------

    public class CreatorPhase5Data
    {
        /// <summary>"sell" | "build". Historical "sell_license" remains readable only.</summary>
        public string ChosenPath { get; set; }

        /// <summary>When the path was first locked in — drives the 72h switch window.</summary>
        public DateTime? PathSelectedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        public CreatorPathA PathA { get; set; } = new();
        public CreatorPathB PathB { get; set; } = new();
    }

    public class CreatorPathA
    {
        public CreatorIpValuation IpValuation { get; set; }
        public CreatorMarketplaceListing MarketplaceListing { get; set; }
        public List<string> MatchedBuyerIds { get; set; } = new();
    }

    public class CreatorIpValuation
    {
        public decimal EstimatedMin { get; set; }
        public decimal EstimatedMax { get; set; }
        public string Confidence { get; set; } // low | medium | high
        /// <summary>Planning estimate only; never a certified business or IP valuation.</summary>
        public string Method { get; set; } = "resource_and_readiness_planning";
        public string Disclaimer { get; set; } = "Planning estimate based on the information currently available for your project. It is not a certified business or IP valuation.";
        /// <summary>Forecast TAM is market-opportunity context, not a valuation input.</summary>
        public decimal? MarketOpportunityContext { get; set; }
        public CreatorIpValuationBreakdown Breakdown { get; set; } = new();
    }

    /// <summary>IP-valuation sub-scores (each 0–100) — distinct from the readiness breakdown.</summary>
    public class CreatorIpValuationBreakdown
    {
        public double ConceptClarity { get; set; }
        public double MarketPotential { get; set; }
        public double TechFeasibility { get; set; }
        public double FounderCredibility { get; set; }
        public double BusinessPlanQuality { get; set; }
    }

    public class CreatorMarketplaceListing
    {
        public string Status { get; set; } // draft | live | available | paused | closed
        /// <summary>New Creator listings use "full_buyout" or composite deal modes. Legacy listings may have no sale type.</summary>
        public string SaleType { get; set; }
        /// <summary>Creator-selected asking price, distinct from the planning estimate. Applies when full_buyout is supported.</summary>
        public decimal? AskingPrice { get; set; }
        public bool NdaRequired { get; set; }
        /// <summary>Supported deal modes: "full_buyout", "equity_partnership".</summary>
        public List<string> DealModes { get; set; } = new();
        // Compatibility & intent fields.
        public bool OpenToPurchase { get; set; }
        public bool OpenToEquityPartnership { get; set; }
        public bool OpenToLicense { get; set; }
        public string Audience { get; set; } // public | matched | private
        public bool IsModerationHidden { get; set; }
        public string? ModerationReason { get; set; }
        public string? ModeratedByAdminId { get; set; }
        public DateTime? ModeratedAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreatorPathB
    {
        public CreatorCompanyFormation CompanyFormation { get; set; }
        public CreatorSeedFunding SeedFunding { get; set; }
    }

    public class CreatorCompanyFormation
    {
        public string SelectedType { get; set; }
        public List<CreatorOwnershipEntry> Ownership { get; set; } = new();
        public string? FormationSpId { get; set; }
        public string Status { get; set; }
    }

    public class CreatorOwnershipEntry
    {
        public string Holder { get; set; }
        public double Percent { get; set; }
        public bool IsFounder { get; set; }
        public bool IsEsop { get; set; }
    }

    public class CreatorSeedFunding
    {
        public decimal TotalAsk { get; set; }
        public List<CreatorUseOfFunds> UseOfFunds { get; set; } = new();
        public List<string> InvestorTypesTargeted { get; set; } = new();
        public int MatchedInvestorCount { get; set; }
        public double EstimatedRunwayMonths { get; set; }
    }

    public class CreatorUseOfFunds
    {
        public string Category { get; set; }
        public double Percent { get; set; }
    }

    // ---------------- Phase 6 ----------------

    public class CreatorPhase6Data
    {
        public bool LevelUpTriggered { get; set; }
        public DateTime? LevelUpTriggeredAt { get; set; }
        public string EntrepreneurProfileId { get; set; }
        public CreatorSmartMatchmaking SmartMatchmaking { get; set; } = new();
    }

    public class CreatorSmartMatchmaking
    {
        public string Status { get; set; } // idle | live
        public int QualifiedMatches { get; set; }
        public int ActiveViews { get; set; }
    }

    // ---------------- Output snapshots (versioned, append-only, newest LAST) ----------------

    /// <summary>
    /// Versioned AI/computed outputs. Per audit R6/R7:
    ///  - Each entry carries its OWN <see cref="OutputVersionEntry.Phase"/> (never hardcoded to 3).
    ///  - Arrays are APPEND newest-LAST. The latest version is <c>versions[^1]</c>
    ///    (use <see cref="CreatorJourneyVersioning.GetLatest{T}"/>). Do NOT prepend.
    /// AI outputs store only the sessionId (re-fetch typed output from aiSessions, fixes R8);
    /// inline outputs (valuation, legal, formation, pricing, gtm) store typed payloads.
    /// </summary>
    public class CreatorOutputSnapshots
    {
        public List<OutputVersionEntry> ForecastVersions { get; set; } = new();
        public List<OutputVersionEntry> BusinessPlanVersions { get; set; } = new();
        public List<OutputVersionEntry> IpValuationVersions { get; set; } = new();
        public List<OutputVersionEntry> LegalChecklistVersions { get; set; } = new();
        public List<OutputVersionEntry> FormationVersions { get; set; } = new();
        public List<OutputVersionEntry> PricingVersions { get; set; } = new();
        public List<OutputVersionEntry> ResourcePlanVersions { get; set; } = new();
        public List<OutputVersionEntry> GtmPlanVersions { get; set; } = new();
        public List<OutputVersionEntry> MatchingRuns { get; set; } = new();
    }

    public class OutputVersionEntry
    {
        public int Version { get; set; }

        /// <summary>The phase this output belongs to (3, 4, 5, 6, …). Fixes R6 — never hardcode 3.</summary>
        public int Phase { get; set; }

        /// <summary>Session reference for AI outputs (forecast/business plan). Null for inline outputs.</summary>
        public string SessionId { get; set; }

        /// <summary>Inline typed payload for non-session outputs (valuation/legal/formation/pricing/gtm).</summary>
        [BsonExtraElements]
        [JsonIgnore]
        public BsonDocument Data { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>Append-newest-last helpers (audit R7). latest == list[^1].</summary>
    public static class CreatorJourneyVersioning
    {
        public static OutputVersionEntry GetLatest(List<OutputVersionEntry> versions) =>
            versions != null && versions.Count > 0 ? versions[^1] : null;

        public static OutputVersionEntry Append(List<OutputVersionEntry> versions, int phase, string sessionId, BsonDocument data)
        {
            versions ??= new List<OutputVersionEntry>();
            var entry = new OutputVersionEntry
            {
                Version = versions.Count + 1,
                Phase = phase,
                SessionId = sessionId,
                Data = data,
                CreatedAt = DateTime.UtcNow,
            };
            versions.Add(entry); // newest LAST — never Insert(0, …)
            return entry;
        }
    }
}
