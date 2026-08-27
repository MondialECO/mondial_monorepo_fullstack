using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos
{
    /// <summary>
    /// Computed (derived) status for all six phases. NEVER persisted — produced on
    /// every read by the status engine from artifact presence + onboarding state.
    /// This is the single source both the frontend guard and resolver consume,
    /// which is what makes audit R3 (guard/resolver divergence) impossible.
    /// </summary>
    public class ComputedJourneyStatus
    {
        public ComputedPhaseStatus Phase1 { get; set; } = new();
        public ComputedPhaseStatus Phase2 { get; set; } = new();
        public ComputedPhaseStatus Phase3 { get; set; } = new();
        public ComputedPhaseStatus Phase4 { get; set; } = new();
        public ComputedPhaseStatus Phase5 { get; set; } = new();
        public ComputedPhaseStatus Phase6 { get; set; } = new();
    }

    public class ComputedPhaseStatus
    {
        /// <summary>locked | available | in_progress | completed</summary>
        public string Status { get; set; } = "locked";

        /// <summary>First incomplete step (phase-specific). 1 when not applicable.</summary>
        public int CurrentStep { get; set; } = 1;
    }

    // ---------------- Request bodies ----------------

    /// <summary>
    /// PATCH body for /journey/project — a PARTIAL update: only the provided fields
    /// change (the service null-guards every set). Every property is explicitly
    /// nullable; with &lt;Nullable&gt;enable&lt;/Nullable&gt;, plain `string` props would get
    /// ASP.NET's IMPLICIT [Required] and 400 any partial payload (e.g. naming a
    /// fresh idea with just name/tagline).
    /// </summary>
    public class UpdateProjectRequest
    {
        public string? Name { get; set; }
        public string? Tagline { get; set; }
        public string? Concept { get; set; }
        public string? TargetUser { get; set; }
        public string? Problem { get; set; }
        public string? Solution { get; set; }
        public string? MarketGap { get; set; }
        public string? CreatorEdge { get; set; }
        public string? ExistingAlternatives { get; set; }
        public string? WhyNow { get; set; }
        public string? RiskiestAssumption { get; set; }
        public string? TargetMarket { get; set; }
        public string? Geography { get; set; }
        public string? Category { get; set; }
        public string? Sector { get; set; }
        public List<string>? Tags { get; set; }
        public double? ClarityScore { get; set; }
    }

    public class EntryPathRequest
    {
        public string Path { get; set; }
    }

    public class CrossroadsPathRequest
    {
        public string Path { get; set; }
    }

    public class AppendOutputRequest
    {
        public string OutputKey { get; set; }
        public int Phase { get; set; }
        public string SessionId { get; set; }
        public Dictionary<string, object> Payload { get; set; }
    }

    // ---------------- Phase 2 ----------------

    public class ChatMessageRequest
    {
        public string Message { get; set; }
    }

    public class FinalizeClarifierRequest
    {
        public string SessionId { get; set; }
    }

    public class FinalizeDiscoveryRequest
    {
        // Optional: defaults to the journey's persisted SelectedConceptId.
        public string ConceptId { get; set; }
    }

    public class NameSuggestionsRequest
    {
        public string Concept { get; set; }
    }

    public class BookDesignerRequest
    {
        public string SpId { get; set; }
    }

    // ---------------- Phase 3 ----------------

    public class UpdateChecklistItemRequest
    {
        public string Status { get; set; }
    }

    public class SelectFormationTypeRequest
    {
        public string SelectedType { get; set; }
    }

    public class DeclareFormationSkillsRequest
    {
        public List<string> YouHave { get; set; } = new();
        // Skills autosave deliberately omits the optional co-founder draft. This must
        // remain nullable so [ApiController] does not reject `{ cofounder: null }`
        // with a model-binding 400 before the partial-merge handler can run.
        public CofounderDraftDto? Cofounder { get; set; }
    }

    public class CofounderDraftDto
    {
        public string RoleNeeded { get; set; }
        public string EquityRange { get; set; }
        public string LocationPreference { get; set; }
    }

    public class OpenWorkroomRequest
    {
        public string SpId { get; set; }
        public string Context { get; set; }
    }

    public class Phase3SessionRequest
    {
        public string Kind { get; set; }      // forecast | businessPlan
        public string SessionId { get; set; }
    }

    // ---------------- Phase 4 ----------------

    public class SetPricingRequest
    {
        public string PricingModel { get; set; }
        public List<CreatorPricingTier> Tiers { get; set; } = new();
    }

    public class ResourceCalcRequest
    {
        public List<CreatorTeamRequirement> TeamRequirements { get; set; } = new();
        public List<CreatorSaasItem> SaasStack { get; set; } = new();
    }

    public class GtmSetupRequest
    {
        public List<CreatorWebPresenceItem> WebPresence { get; set; } = new();
        public List<string> TargetAudiences { get; set; } = new();
        public List<CreatorChannelMix> ChannelMix { get; set; } = new();
    }

    // ---------------- Phase 5 ----------------

    public class MarketplacePublishRequest
    {
        public bool NdaRequired { get; set; }
        public decimal AskingPrice { get; set; }
        // Compatibility-only input fields for older clients. New Full Buyout clients
        // send neither; the controller explicitly persists purchase=true/license=false.
        public bool OpenToPurchase { get; set; }
        public bool OpenToLicense { get; set; }
        public string Audience { get; set; } // public | matched | private
    }

    public class CompanyFormationRequest
    {
        public string SelectedType { get; set; } = string.Empty;
        public List<CreatorOwnershipEntry> Ownership { get; set; } = new();
        // A creator may save their ownership plan before choosing a formation provider.
        // Keep this optional so [ApiController] does not reject an otherwise valid plan.
        public string? FormationSpId { get; set; }
    }

    public class SeedFundingRequest
    {
        public decimal TotalAsk { get; set; }
        public List<CreatorUseOfFunds> UseOfFunds { get; set; } = new();
        public List<string> InvestorTypesTargeted { get; set; } = new();
    }

    public class CreatorReadinessRequirement
    {
        public string Key { get; set; }
        public string Label { get; set; }
        public string Route { get; set; }
        public bool Complete { get; set; }
        public bool Required { get; set; }
    }

    public class CreatorReadinessResponse
    {
        public int OverallProgress { get; set; }
        public bool LevelUpEligible { get; set; }
        public string SelectedPath { get; set; }
        public List<CreatorReadinessRequirement> Requirements { get; set; } = new();
        public List<string> MissingRequired { get; set; } = new();
        public CreatorReadinessRequirement NextBestAction { get; set; }
    }

    public class DesignerDto
    {
        public string SpId { get; set; }
        public string Name { get; set; }
        public string Title { get; set; }
        public int Tier { get; set; }
        public double Rating { get; set; }
        public int ProjectCount { get; set; }
        public string Location { get; set; }
        public List<string> Sectors { get; set; } = new();
        public string EstimatedPriceRange { get; set; }
        public string EstimatedDays { get; set; }
        public bool IsBestMatch { get; set; }
    }
}
