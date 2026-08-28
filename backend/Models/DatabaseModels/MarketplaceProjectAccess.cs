using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace WebApp.Models.DatabaseModels
{
    public class MarketplaceProjectAccessGrant
    {
        [BsonId]
        public ObjectId Id { get; set; }

        [BsonElement("IdeaId")]
        public string IdeaId { get; set; } = string.Empty;

        [BsonElement("ProjectInterestId")]
        public string ProjectInterestId { get; set; } = string.Empty;

        [BsonElement("CreatorId")]
        public string CreatorId { get; set; } = string.Empty;

        [BsonElement("EntrepreneurId")]
        public string EntrepreneurId { get; set; } = string.Empty;

        [BsonElement("NdaRequired")]
        public bool NdaRequired { get; set; }

        [BsonElement("NdaSigned")]
        public bool NdaSigned { get; set; }

        [BsonElement("NdaSignedAt")]
        public DateTime? NdaSignedAt { get; set; }

        [BsonElement("NdaVersion")]
        public string NdaVersion { get; set; } = "1.0";

        [BsonElement("NdaTextHash")]
        public string? NdaTextHash { get; set; }

        [BsonElement("SignatureHash")]
        public string? SignatureHash { get; set; }

        [BsonElement("SignerUserId")]
        public string? SignerUserId { get; set; }

        [BsonElement("GrantedAt")]
        public DateTime GrantedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("ExpiresAt")]
        public DateTime? ExpiresAt { get; set; }

        /// <summary>Status: "active" | "expired" | "revoked".</summary>
        [BsonElement("Status")]
        public string Status { get; set; } = "active";
    }

    public class MarketplaceProjectAccessLog
    {
        [BsonId]
        public ObjectId Id { get; set; }

        [BsonElement("IdeaId")]
        public string IdeaId { get; set; } = string.Empty;

        [BsonElement("ProjectInterestId")]
        public string? ProjectInterestId { get; set; }

        [BsonElement("UserId")]
        public string UserId { get; set; } = string.Empty;

        /// <summary>EventType: "nda_viewed" | "nda_signed" | "private_access_granted" | "private_access_denied".</summary>
        [BsonElement("EventType")]
        public string EventType { get; set; } = string.Empty;

        [BsonElement("Timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [BsonElement("IpHash")]
        public string IpHash { get; set; } = string.Empty;

        [BsonElement("NdaVersion")]
        public string? NdaVersion { get; set; }
    }
}
