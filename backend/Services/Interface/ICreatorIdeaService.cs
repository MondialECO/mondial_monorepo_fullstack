using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Interface
{
    /// <summary>
    /// Multi-idea STEP 3: idea resolution and management. Built but NOT yet wired —
    /// no controller calls this until the step-4 cutover, so the running app is
    /// unaffected. All journey writes are targeted atomic $set updates; all reads are
    /// owner-scoped (an ideaId the caller doesn't own is a 404, never a fallback).
    /// </summary>
    public interface ICreatorIdeaService
    {
        /// <summary>
        /// Resolve an idea. With <paramref name="ideaId"/>: that idea, owner-checked
        /// (404 if not owned — never a silent fallback to the active idea). Without:
        /// the user's active idea; a stale ActiveIdeaId falls back to the most recent
        /// idea (repointing atomically); a user with no ideas gets their first one
        /// created and set active.
        /// </summary>
        Task<CreatorIdea> GetOrCreateIdeaAsync(string userId, string ideaId = null);

        /// <summary>All the user's ideas, most-recently-active first (my-ideas list).</summary>
        Task<List<CreatorIdea>> ListIdeasByUserAsync(string userId);

        /// <summary>Mint a NEW blank idea and make it active. Existing ideas untouched.</summary>
        Task<CreatorIdea> CreateIdeaAsync(string userId);

        /// <summary>Switch the active idea (owner-checked, 404 if not owned).</summary>
        Task<CreatorIdea> SetActiveIdeaAsync(string userId, string ideaId);

        /// <summary>
        /// Per-idea phase status. Composes the idea with the user-level markers
        /// (phase1Complete + whether THIS idea is the leveled-up one) and delegates to
        /// the unchanged derivation engine via a transient journey-shaped view.
        /// </summary>
        Task<ComputedJourneyStatus> ComputePhaseStatusAsync(CreatorIdea idea, bool phase1Complete, bool ideaLeveledUp);

        /// <summary>
        /// Record which idea was taken through Level Up (once per user — the
        /// entrepreneur side stays 1:1). Atomic: first write wins; a second call for a
        /// DIFFERENT idea is a 409. Idempotent for the same idea. Does NOT run the
        /// Level-Up flow itself — the existing flow is untouched until cutover.
        /// </summary>
        Task MarkIdeaLeveledUpAsync(string userId, string ideaId);
    }
}
