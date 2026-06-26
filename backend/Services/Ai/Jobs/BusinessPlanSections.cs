using MongoDB.Bson;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// ONE shared single-section splice for the C-3 business plan, used by BOTH the
    /// AI rewrite (BusinessPlanController.RewriteSection → BusinessPlanHandler) and the
    /// manual edit (BusinessPlanController per-section PATCH). Avoids two divergent
    /// splice implementations (the SpMatchingService-extraction principle from P1.7).
    ///
    /// REALITY NOTE (honest): the C-3 output is a fixed 7-field BsonDocument contract,
    /// NOT a sections[] array. The frontend's "9 sections" are a display construct; only
    /// 5 map to rewritable C-3 fields (the other 4 are derived from other modules). So a
    /// "section" splice = replacing ONE top-level field of the plan document. Per-section
    /// status is embedded under <c>_sectionMeta</c> (no separate model exists).
    /// </summary>
    public static class BusinessPlanSections
    {
        /// <summary>Frontend sectionId → (C-3 field, primary free-text sub-field).</summary>
        public static readonly IReadOnlyDictionary<string, (string Field, string TextKey)> Map =
            new Dictionary<string, (string, string)>(StringComparer.OrdinalIgnoreCase)
            {
                ["executive"] = ("executiveSummary", "overview"),
                ["target-market"] = ("marketAnalysis", "overview"),
                ["business-model"] = ("revenueModel", "summary"),
                ["competitive"] = ("competitorAnalysis", "overview"),
                ["gtm"] = ("goToMarket", "strategy"),
            };

        public static bool IsRewritable(string sectionId) => sectionId != null && Map.ContainsKey(sectionId);

        public static (string Field, string TextKey)? Resolve(string sectionId) =>
            sectionId != null && Map.TryGetValue(sectionId, out var v) ? v : null;

        /// <summary>
        /// Replace ONE section's field in a clone of the plan, leaving the other fields
        /// untouched, and stamp section meta (status + lastEditedAt). source "edit" →
        /// "edited", anything else → "generated".
        /// </summary>
        public static BsonDocument ReplaceField(BsonDocument plan, string field, BsonValue newFieldValue, string source)
        {
            var doc = (BsonDocument)plan.DeepClone();
            doc[field] = newFieldValue ?? BsonNull.Value;

            var meta = doc.TryGetValue("_sectionMeta", out var m) && m.IsBsonDocument
                ? m.AsBsonDocument
                : new BsonDocument();
            meta[field] = new BsonDocument
            {
                ["status"] = source == "edit" ? "edited" : "generated",
                ["lastEditedAt"] = DateTime.UtcNow,
            };
            doc["_sectionMeta"] = meta;
            return doc;
        }

        /// <summary>
        /// Manual-edit helper: clone the section's existing structured field, set its
        /// primary free-text sub-field to <paramref name="text"/>, and splice it back —
        /// preserving the rest of the structured field.
        /// </summary>
        public static BsonDocument ReplaceSectionText(BsonDocument plan, string sectionId, string text)
        {
            var resolved = Resolve(sectionId)
                ?? throw new ArgumentException($"Section '{sectionId}' is not editable.", nameof(sectionId));

            var existing = plan.TryGetValue(resolved.Field, out var f) && f.IsBsonDocument
                ? (BsonDocument)f.AsBsonDocument.DeepClone()
                : new BsonDocument();
            existing[resolved.TextKey] = text ?? string.Empty;
            return ReplaceField(plan, resolved.Field, existing, "edit");
        }
    }
}
