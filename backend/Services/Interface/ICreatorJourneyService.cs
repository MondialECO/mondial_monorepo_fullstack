using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Interface
{
    /// <summary>
    /// Owns the Creator journey (Phases 2–6). The journey document holds artifacts
    /// ONLY; phase/step status is derived on demand by <see cref="ComputePhaseStatusAsync"/>.
    /// </summary>
    public interface ICreatorJourneyService
    {
        /// <summary>Returns the user's journey, creating an empty one if none exists.</summary>
        Task<CreatorJourney> GetOrCreateAsync(string userId);

        /// <summary>
        /// STEP 4 cutover read path: the journey composed with the resolved idea's
        /// per-idea blocks (Project, Phase2-5, SmartMatchmaking, OutputSnapshots).
        /// Explicit ideaId is owned-or-404; absent falls back to the active idea
        /// (minting the first for a fresh user). Same response shape as before.
        /// </summary>
        Task<CreatorJourney> GetOrCreateComposedAsync(string userId, string ideaId = null);

        /// <summary>
        /// The derived-status engine. Pure function of the journey's artifacts plus the
        /// user's Phase-1 onboarding completion. Never persisted — call on every read.
        /// </summary>
        Task<ComputedJourneyStatus> ComputePhaseStatusAsync(CreatorJourney journey, bool phase1Complete);

        /// <summary>Shallow-merge validated project fields. Returns the updated journey.</summary>
        Task<CreatorJourney> UpdateProjectAsync(string userId, UpdateProjectRequest request, string ideaId = null);

        /// <summary>Set the Phase 2 entry path. Only "already_have_idea" is accepted.</summary>
        Task<CreatorJourney> SetEntryPathAsync(string userId, string path, string ideaId = null);

        /// <summary>Set the Phase 5 path ("sell" | "build") with the 72h switch lock.</summary>
        Task<CreatorJourney> SetCrossroadsPathAsync(string userId, string path, string ideaId = null);

        /// <summary>Append a versioned output (newest LAST), carrying its own phase.</summary>
        Task<CreatorJourney> AppendOutputAsync(string userId, AppendOutputRequest request, string ideaId = null);

        /// <summary>Append a chat message to phase2Data (persisted for abandon/resume).</summary>
        Task<CreatorJourney> AppendChatMessageAsync(string userId, string sender, string text, string ideaId = null);

        /// <summary>
        /// Map a completed ClarifierOutput onto the project and store clarifierSessionId.
        /// Caller passes already-extracted fields; this method only persists them.
        /// </summary>
        Task<CreatorJourney> ApplyClarifierMappingAsync(
            string userId, string clarifierSessionId, string problem, string targetUser,
            string solution, double clarityScore, List<string> tags, string marketGap = "", string creatorEdge = "",
            string existingAlternatives = "", string whyNow = "", string riskiestAssumption = "", string ideaId = null);

        /// <summary>
        /// Discovery convergence: map a confirmed Discovery concept onto the project and
        /// link the concept-seeded clarifier session (so Phase 3's prerequisite passes
        /// without the clarifier Q&amp;A). Also sets Concept/Category.
        /// </summary>
        Task<CreatorJourney> ApplyDiscoveryMappingAsync(
            string userId, string clarifierSessionId, CreatorDiscoveryConcept concept, string ideaId = null);

        /// <summary>
        /// Set branding (asset + type + method), optionally persisting the chosen
        /// palette + typography (AI logo tool). Pass null logoAsset to mark
        /// designer-pending / skipped without a delivered logo.
        /// </summary>
        Task<CreatorJourney> SetBrandingLogoAsync(
            string userId, string logoAsset, string logoType, string brandingMethod,
            List<string> colorPalette = null, string paletteName = null, string typographyPairing = null, string ideaId = null,
            string designerId = null, string conversationId = null);

        /// <summary>Persist Discovery input form (sectors, problem, strengths) via targeted $set.</summary>
        Task<CreatorJourney> SetDiscoveryInputsAsync(string userId, CreatorDiscoveryInputs inputs, string ideaId = null);

        /// <summary>Persist AI-generated concepts via targeted $set (async-safe field update).</summary>
        Task<CreatorJourney> SetGeneratedConceptsAsync(string userId, List<CreatorDiscoveryConcept> concepts, string ideaId = null);

        /// <summary>Persist the selected concept ID via targeted $set.</summary>
        Task<CreatorJourney> SetSelectedConceptIdAsync(string userId, string conceptId, string ideaId = null);

        // ---- Phase 3 deterministic modules ----

        /// <summary>Persist a generated legal checklist + append a phase-3 version.</summary>
        Task<CreatorJourney> SetLegalChecklistAsync(string userId, CreatorLegalChecklist checklist, string ideaId = null);

        /// <summary>Update one checklist item's status, recompute completedCount.</summary>
        Task<CreatorJourney> UpdateLegalChecklistItemAsync(string userId, string itemId, string status, string ideaId = null);

        /// <summary>Persist a generated formation result + append a phase-3 version.</summary>
        Task<CreatorJourney> SetFormationAsync(string userId, CreatorFormationGenerator formation, string ideaId = null);

        /// <summary>Store the chosen company type; flips legal item 1 (company type) to done.</summary>
        Task<CreatorJourney> SelectFormationTypeAsync(string userId, string selectedType, string ideaId = null);
        Task<CreatorJourney> DeclareFormationSkillsAsync(string userId, System.Collections.Generic.List<string> youHave, System.Collections.Generic.List<CreatorSkillGap> youNeed, System.Collections.Generic.List<string> matchedSpIds, CreatorCofounderDraft cofounder, string ideaId = null);

        /// <summary>
        /// Persist a Phase-3 AI session reference (kind = "forecast" | "businessPlan")
        /// and append a version (sessionId only, phase 3, newest-last — R8 pattern).
        /// </summary>
        Task<CreatorJourney> SetPhase3SessionAsync(string userId, string kind, string sessionId, string ideaId = null);

        /// <summary>Store the computed investor-readiness score on phase3Data.</summary>
        Task<CreatorJourney> SetInvestorReadinessAsync(string userId, CreatorInvestorReadinessScore score, string ideaId = null);

        // ---- Phase 4 (deterministic) — every version carries phase: 4 (R6) ----

        /// <summary>Persist pricing model + tiers; append a phase-4 pricing version.</summary>
        Task<CreatorJourney> SetPhase4PricingAsync(string userId, string pricingModel, List<CreatorPricingTier> tiers, CreatorPricingForecastContext? forecastContext = null, string ideaId = null);

        /// <summary>Persist the resource calculation; append a phase-4 resource version.</summary>
        Task<CreatorJourney> SetPhase4ResourceAsync(string userId, CreatorResourceCalculation calc, string ideaId = null);

        /// <summary>Persist the GTM setup; append a phase-4 GTM version.</summary>
        Task<CreatorJourney> SetPhase4GtmAsync(string userId, CreatorGtmSetup gtm, string ideaId = null);

        // ---- Phase 5 (deterministic) — every version carries phase: 5 ----

        /// <summary>Persist the IP valuation (Path A); append a phase-5 valuation version.</summary>
        Task<CreatorJourney> SetIpValuationAsync(string userId, CreatorIpValuation valuation, string ideaId = null);

        /// <summary>Persist the marketplace listing (Path A) + matched buyer ids.</summary>
        Task<CreatorJourney> SetMarketplaceListingAsync(string userId, CreatorMarketplaceListing listing, List<string> matchedBuyerIds, string ideaId = null);

        /// <summary>Persist the company formation (Path B).</summary>
        Task<CreatorJourney> SetCompanyFormationAsync(string userId, CreatorCompanyFormation formation, string ideaId = null);

        /// <summary>Persist seed funding (Path B), set completedAt, and link the spun companyId (R10).</summary>
        Task<CreatorJourney> SetSeedFundingAsync(string userId, CreatorSeedFunding seedFunding, string companyId, string ideaId = null);

        /// <summary>Persist the full journey (caller mutated it). Stamps UpdatedAt.</summary>
        Task ReplaceAsync(CreatorJourney journey);

        /// <summary>
        /// Persist the journey within a Mongo session (so it joins a transaction).
        /// Used by Level Up's atomic core.
        /// </summary>
        Task ReplaceAsync(CreatorJourney journey, MongoDB.Driver.IClientSessionHandle session);
    }
}
