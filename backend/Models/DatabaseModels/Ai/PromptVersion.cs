using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// A versioned prompt template (collection <c>PromptVersions</c>). Exactly one
    /// version per <see cref="Key"/> is active at a time (enforced by the prompt
    /// framework in Phase 3). Phase 2 only defines the schema + indexes.
    /// </summary>
    public class PromptVersion
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        /// <summary>Template key, e.g. "probe", "idea-clarifier".</summary>
        [BsonElement("Key")]
        public string Key { get; set; } = "";

        [BsonElement("Version")]
        public int Version { get; set; }

        [BsonElement("SystemText")]
        public string SystemText { get; set; } = "";

        /// <summary>Declared output contract / format instructions.</summary>
        [BsonElement("OutputContract")]
        public string? OutputContract { get; set; }

        [BsonElement("IsActive")]
        public bool IsActive { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
