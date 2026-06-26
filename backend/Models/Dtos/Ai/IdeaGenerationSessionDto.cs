using MongoDB.Bson;

namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// DTO mirroring IdeaGenerationSession for API responses. Maps the session
    /// model and output array for the frontend discovery flow.
    /// </summary>
    public class IdeaGenerationSessionDto
    {
        public string SessionId { get; set; } = "";
        public string Status { get; set; } = "Pending";
        public string? BusinessIdeaId { get; set; }
        public BsonDocument? Input { get; set; }
        public BsonDocument? Output { get; set; }
        public string? Error { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        /// <summary>Convenience accessor: ideas[] from Output document.</summary>
        public BsonArray? Ideas => Output?["ideas"] as BsonArray;
    }
}
