using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;

namespace WebApp.Services.Legal
{
    /// <summary>
    /// Evaluates creator business profiles against the France statutory rules catalogue deterministically.
    /// Pure deterministic logic: 0 LLM calls, <50ms evaluation time, guaranteed reproducible results.
    /// </summary>
    public interface ILegalApplicabilityEngine
    {
        /// <summary>
        /// Evaluates a legal business profile against the catalogue and produces a full assessment.
        /// Preserves existing user progress/evidence if previous items are provided.
        /// </summary>
        CreatorLegalAssessment Evaluate(
            string creatorIdeaId,
            string userId,
            LegalBusinessProfile profile,
            List<CreatorLegalChecklistItem>? existingItems = null);

        /// <summary>
        /// Computes the deterministic SHA-256 fingerprint of the business profile signals.
        /// </summary>
        string ComputeSnapshotHash(LegalBusinessProfile profile);

        /// <summary>
        /// Computes the deterministic 0-100% Legal Planning Readiness score.
        /// </summary>
        double ComputePlanningReadiness(List<CreatorLegalChecklistItem> items);

        /// <summary>
        /// Compares the stored assessment with the current business profile and catalog version,
        /// determining staleness and computing deterministic human-safe diffs.
        /// </summary>
        LegalStaleMetadata CheckFreshness(
            CreatorLegalAssessment? assessment,
            LegalBusinessProfile currentProfile,
            string currentRulesVersion,
            string currentJurisdiction = "FR",
            string? currentRulesFingerprint = null);

        /// <summary>
        /// Reconciles an existing legal assessment with a newly evaluated profile.
        /// Preserves completed unchanged requirements, attaches new requirements (marked NEW),
        /// retains no-longer-applicable items in history, preserves evidence links, and ensures idempotency.
        /// </summary>
        CreatorLegalAssessment ReconcileAndEvaluate(
            string creatorIdeaId,
            string userId,
            LegalBusinessProfile profile,
            CreatorLegalAssessment? previousAssessment);
    }
}
