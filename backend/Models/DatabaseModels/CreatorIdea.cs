using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// A single Creator idea/venture — the per-idea home for Phases 2–5 (plus Phase-6
    /// Smart Matchmaking). Foundation for multi-idea Creator: one user may own many of
    /// these, keyed by <see cref="UserId"/> (NON-unique), and the document <c>_id</c>
    /// (<see cref="Id"/>) is the stable "idea anchor" stamped onto the AI sessions'
    /// <c>BusinessIdeaId</c> so an idea survives plan/forecast regeneration.
    ///
    /// ARCHITECTURE NOTE — this mirrors the shapes on <see cref="CreatorJourney"/> by
    /// REUSING its nested types (<see cref="CreatorJourneyProject"/>,
    /// <see cref="CreatorPhase2Data"/>…<see cref="CreatorPhase5Data"/>,
    /// <see cref="CreatorSmartMatchmaking"/>) — no duplicate class definitions. Phase 1
    /// (KYC) and the Level-Up marker stay user-level and are NOT copied here.
    ///
    /// STEP 1 is ADDITIVE ONLY: this collection is written by the backfill migration
    /// but not yet read by any controller/resolver/frontend — the app behaves identically.
    /// </summary>
    public class CreatorIdea
    {
        /// <summary>The idea anchor. ObjectId-style string like the AI sessions.</summary>
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        /// <summary>ApplicationUser.Id (Guid) as string. NON-unique index (many ideas per user).</summary>
        public string UserId { get; set; } = "";

        /// <summary>"active" | "archived" — drives the my-ideas list UI (added later).</summary>
        public string Status { get; set; } = "active";

        // ---- Per-idea blocks (reused shapes from CreatorJourney — same namespace) ----
        public CreatorJourneyProject Project { get; set; } = new();
        public CreatorPhase2Data Phase2Data { get; set; } = new();
        public CreatorPhase3Data Phase3Data { get; set; } = new();
        public CreatorPhase4Data Phase4Data { get; set; } = new();
        public CreatorPhase5Data Phase5Data { get; set; } = new();

        /// <summary>Only the per-idea slice of Phase 6 moves here; the Level-Up marker stays on the journey.</summary>
        public CreatorSmartMatchmaking SmartMatchmaking { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Last time the user worked on this idea — sorts the my-ideas list.</summary>
        public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;
    }
}
