using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Interface
{
    /// <summary>
    /// Owns the Creator journey (Phases 2–6). The journey document holds artifacts
    /// ONLY; phase/step status is derived on demand by <see cref="ComputePhaseStatus"/>.
    /// </summary>
    public interface ICreatorJourneyService
    {
        /// <summary>Returns the user's journey, creating an empty one if none exists.</summary>
        Task<CreatorJourney> GetOrCreateAsync(string userId);

        /// <summary>
        /// The derived-status engine. Pure function of the journey's artifacts plus the
        /// user's Phase-1 onboarding completion. Never persisted — call on every read.
        /// </summary>
        ComputedJourneyStatus ComputePhaseStatus(CreatorJourney journey, bool phase1Complete);

        /// <summary>Shallow-merge validated project fields. Returns the updated journey.</summary>
        Task<CreatorJourney> UpdateProjectAsync(string userId, UpdateProjectRequest request);

        /// <summary>Set the Phase 2 entry path. Only "already_have_idea" is accepted.</summary>
        Task<CreatorJourney> SetEntryPathAsync(string userId, string path);

        /// <summary>Set the Phase 5 path ("sell_license" | "build") with the 72h switch lock.</summary>
        Task<CreatorJourney> SetCrossroadsPathAsync(string userId, string path);

        /// <summary>Append a versioned output (newest LAST), carrying its own phase.</summary>
        Task<CreatorJourney> AppendOutputAsync(string userId, AppendOutputRequest request);

        /// <summary>Append a chat message to phase2Data (persisted for abandon/resume).</summary>
        Task<CreatorJourney> AppendChatMessageAsync(string userId, string sender, string text);

        /// <summary>
        /// Map a completed ClarifierOutput onto the project and store clarifierSessionId.
        /// Caller passes already-extracted fields; this method only persists them.
        /// </summary>
        Task<CreatorJourney> ApplyClarifierMappingAsync(
            string userId, string clarifierSessionId, string problem, string targetUser,
            string solution, double clarityScore, List<string> tags, string marketGap = "", string creatorEdge = "");

        /// <summary>
        /// Set branding (asset + type + method), optionally persisting the chosen
        /// palette + typography (AI logo tool). Pass null logoAsset to mark
        /// designer-pending / skipped without a delivered logo.
        /// </summary>
        Task<CreatorJourney> SetBrandingLogoAsync(
            string userId, string logoAsset, string logoType, string brandingMethod,
            List<string> colorPalette = null, string paletteName = null, string typographyPairing = null);

        // ---- Phase 3 deterministic modules ----

        /// <summary>Persist a generated legal checklist + append a phase-3 version.</summary>
        Task<CreatorJourney> SetLegalChecklistAsync(string userId, CreatorLegalChecklist checklist);

        /// <summary>Update one checklist item's status, recompute completedCount.</summary>
        Task<CreatorJourney> UpdateLegalChecklistItemAsync(string userId, string itemId, string status);

        /// <summary>Persist a generated formation result + append a phase-3 version.</summary>
        Task<CreatorJourney> SetFormationAsync(string userId, CreatorFormationGenerator formation);

        /// <summary>Store the chosen company type; flips legal item 1 (company type) to done.</summary>
        Task<CreatorJourney> SelectFormationTypeAsync(string userId, string selectedType);

        /// <summary>
        /// Persist a Phase-3 AI session reference (kind = "forecast" | "businessPlan")
        /// and append a version (sessionId only, phase 3, newest-last — R8 pattern).
        /// </summary>
        Task<CreatorJourney> SetPhase3SessionAsync(string userId, string kind, string sessionId);

        /// <summary>Store the computed investor-readiness score on phase3Data.</summary>
        Task<CreatorJourney> SetInvestorReadinessAsync(string userId, CreatorInvestorReadinessScore score);

        // ---- Phase 4 (deterministic) — every version carries phase: 4 (R6) ----

        /// <summary>Persist pricing model + tiers; append a phase-4 pricing version.</summary>
        Task<CreatorJourney> SetPhase4PricingAsync(string userId, string pricingModel, List<CreatorPricingTier> tiers);

        /// <summary>Persist the resource calculation; append a phase-4 resource version.</summary>
        Task<CreatorJourney> SetPhase4ResourceAsync(string userId, CreatorResourceCalculation calc);

        /// <summary>Persist the GTM setup; append a phase-4 GTM version.</summary>
        Task<CreatorJourney> SetPhase4GtmAsync(string userId, CreatorGtmSetup gtm);

        // ---- Phase 5 (deterministic) — every version carries phase: 5 ----

        /// <summary>Persist the IP valuation (Path A); append a phase-5 valuation version.</summary>
        Task<CreatorJourney> SetIpValuationAsync(string userId, CreatorIpValuation valuation);

        /// <summary>Persist the marketplace listing (Path A) + matched buyer ids.</summary>
        Task<CreatorJourney> SetMarketplaceListingAsync(string userId, CreatorMarketplaceListing listing, List<string> matchedBuyerIds);

        /// <summary>Persist the company formation (Path B).</summary>
        Task<CreatorJourney> SetCompanyFormationAsync(string userId, CreatorCompanyFormation formation);

        /// <summary>Persist seed funding (Path B), set completedAt, and link the spun companyId (R10).</summary>
        Task<CreatorJourney> SetSeedFundingAsync(string userId, CreatorSeedFunding seedFunding, string companyId);

        /// <summary>Persist the full journey (caller mutated it). Stamps UpdatedAt.</summary>
        Task ReplaceAsync(CreatorJourney journey);

        /// <summary>
        /// Persist the journey within a Mongo session (so it joins a transaction).
        /// Used by Level Up's atomic core.
        /// </summary>
        Task ReplaceAsync(CreatorJourney journey, MongoDB.Driver.IClientSessionHandle session);
    }
}
