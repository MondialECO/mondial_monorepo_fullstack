using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// The entrepreneur profile created at Level Up (collection
    /// <c>EntrepreneurProfiles</c>). Carries forward the creator's journey so the
    /// Creator → Entrepreneur → Company chain stays traceable (businessIdeaId +
    /// companyId). The creator journey doc is preserved as history.
    /// </summary>
    public class EntrepreneurProfileRecord
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string UserId { get; set; }
        public string BusinessIdeaId { get; set; }
        public string CompanyId { get; set; }

        // Copied forward from the journey (snapshot at Level Up).
        public CreatorJourneyProject Project { get; set; }
        public CreatorPhase4Data OfferSetup { get; set; }
        public CreatorPhase3Data Masterplan { get; set; }
        public CreatorPathB PathB { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
