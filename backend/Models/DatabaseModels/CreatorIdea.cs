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

        /// <summary>
        /// Per-idea version history (STEP 3.5). All nine arrays are inherently per-idea —
        /// seven carry no idea marker, so they can only live here, not be filtered.
        /// Reuses <see cref="CreatorOutputSnapshots"/>; the journey's copy stays in place
        /// until post-cutover cleanup. Defaults to an empty block, never null.
        /// </summary>
        public CreatorOutputSnapshots OutputSnapshots { get; set; } = new();

        /// <summary>
        /// Real file assets owned by this idea. This deliberately stores asset metadata
        /// only; the canonical business plan and forecast data remain in their session
        /// records. Entries are added only after a file has actually been produced.
        /// </summary>
        public List<CreatorIdeaDocument> Documents { get; set; } = new();

        /// <summary>Outcome marker: e.g. "CO_FOUNDED", "SOLD", null.</summary>
        public string? ProjectOutcome { get; set; }

        /// <summary>Active exclusive equity partnership deal id if co-founded.</summary>
        public string? ActivePartnershipDealId { get; set; }

        /// <summary>Active exclusive buyout deal id if sold.</summary>
        public string? ActiveBuyoutDealId { get; set; }

        /// <summary>User ID of the acquiring buyer if sold.</summary>
        public string? AcquiredByUserId { get; set; }

        /// <summary>Date and time the project was sold.</summary>
        public DateTime? SoldAt { get; set; }

        /// <summary>Final buyout sale price.</summary>
        public decimal? SalePrice { get; set; }

        /// <summary>Linked Company id upon activation.</summary>
        public string? CompanyId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Last time the user worked on this idea — sorts the my-ideas list.</summary>
        public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

        /// <summary>Monotonic per-idea optimistic-concurrency token.</summary>
        public long Version { get; set; } = 1;
    }

    /// <summary>
    /// Metadata for one Creator-idea file asset. StorageReference is a filename/key
    /// inside the idea-scoped Creator uploads directory, never a user-supplied path.
    /// No rows are seeded: a metadata record is not a substitute for a generated file.
    /// </summary>
    public class CreatorIdeaDocument
    {
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
        public string DocumentType { get; set; } = "";
        public string Title { get; set; } = "";
        public string FileName { get; set; } = "";
        public string MimeType { get; set; } = "application/octet-stream";
        public long? SizeBytes { get; set; }
        public string StorageReference { get; set; } = "";
        public string SourceModule { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "ready";
    }

    /// <summary>
    /// The vault only exposes file types for Creator generators that exist today.
    /// Adding a constant here does not create an asset; registration still requires a
    /// real stored file and a ready metadata record.
    /// </summary>
    public static class CreatorIdeaDocumentTypes
    {
        public const string BusinessPlan = "business_plan";
        public const string FinancialForecast = "financial_forecast";

        public static bool IsSupported(string? documentType) =>
            string.Equals(documentType, BusinessPlan, StringComparison.Ordinal) ||
            string.Equals(documentType, FinancialForecast, StringComparison.Ordinal);
    }
}
