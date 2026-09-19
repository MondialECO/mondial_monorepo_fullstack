using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Legal
{
    /// <summary>
    /// Metadata for official, authoritative French public sources.
    /// Used to ground every statutory requirement without hallucinated URLs.
    /// </summary>
    public class OfficialSourceReference
    {
        [BsonElement("Authority")]
        public string Authority { get; set; } = string.Empty; // e.g. "INPI / Guichet unique", "CNIL", "Service-Public.fr", "DGCCRF"

        [BsonElement("Title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("Url")]
        public string Url { get; set; } = string.Empty;

        [BsonElement("SourceType")]
        public string SourceType { get; set; } = "official_portal"; // statute | official_portal | regulatory_agency | code_article

        [BsonElement("LastVerified")]
        public string LastVerified { get; set; } = string.Empty;

        [BsonElement("ArticleReference")]
        [BsonIgnoreIfNull]
        public string? ArticleReference { get; set; } // e.g. "Article L123-33 du Code de commerce"

        [BsonElement("Notes")]
        [BsonIgnoreIfNull]
        public string? Notes { get; set; }
    }
}
