using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    public interface IIdeaGenerationSessionRepository
    {
        Task<IdeaGenerationSession> CreateAsync(IdeaGenerationSession session, CancellationToken cancellationToken = default);
        Task<IdeaGenerationSession?> GetByIdAsync(string sessionId, CancellationToken cancellationToken = default);
        Task<IEnumerable<IdeaGenerationSession>> GetByOwnerAsync(string ownerUserId, CancellationToken cancellationToken = default);
        Task SetProcessingAsync(string sessionId, CancellationToken cancellationToken = default);
        Task SetCompletedAsync(string sessionId, IdeaGenerationOutput output, CancellationToken cancellationToken = default);
        Task SetFailedAsync(string sessionId, string error, CancellationToken cancellationToken = default);
        Task SetNeedsReviewAsync(string sessionId, string error, CancellationToken cancellationToken = default);
    }

    public class IdeaGenerationSessionRepository : IIdeaGenerationSessionRepository
    {
        private readonly IMongoCollection<IdeaGenerationSession> _sessions;

        public IdeaGenerationSessionRepository(IMongoDatabase db)
        {
            _sessions = db.GetCollection<IdeaGenerationSession>("IdeaGenerationSessions");
        }

        public async Task<IdeaGenerationSession> CreateAsync(IdeaGenerationSession session, CancellationToken cancellationToken = default)
        {
            session.Id = ObjectId.GenerateNewId();
            await _sessions.InsertOneAsync(session, cancellationToken: cancellationToken);
            return session;
        }

        public async Task<IdeaGenerationSession?> GetByIdAsync(string sessionId, CancellationToken cancellationToken = default)
        {
            if (!ObjectId.TryParse(sessionId, out var oid)) return null;
            return await _sessions.Find(s => s.Id == oid).FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<IEnumerable<IdeaGenerationSession>> GetByOwnerAsync(string ownerUserId, CancellationToken cancellationToken = default)
        {
            return await _sessions.Find(s => s.OwnerUserId == ownerUserId)
                .SortByDescending(s => s.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task SetProcessingAsync(string sessionId, CancellationToken cancellationToken = default)
        {
            if (!ObjectId.TryParse(sessionId, out var oid)) return;
            await _sessions.UpdateOneAsync(
                s => s.Id == oid,
                Builders<IdeaGenerationSession>.Update
                    .Set(s => s.Status, "Processing")
                    .Set(s => s.UpdatedAt, DateTime.UtcNow),
                cancellationToken: cancellationToken);
        }

        public async Task SetCompletedAsync(string sessionId, IdeaGenerationOutput output, CancellationToken cancellationToken = default)
        {
            if (!ObjectId.TryParse(sessionId, out var oid)) return;
            await _sessions.UpdateOneAsync(
                s => s.Id == oid,
                Builders<IdeaGenerationSession>.Update
                    .Set(s => s.Status, "Completed")
                    .Set(s => s.Output, output)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow),
                cancellationToken: cancellationToken);
        }

        public async Task SetFailedAsync(string sessionId, string error, CancellationToken cancellationToken = default)
        {
            if (!ObjectId.TryParse(sessionId, out var oid)) return;
            await _sessions.UpdateOneAsync(
                s => s.Id == oid,
                Builders<IdeaGenerationSession>.Update
                    .Set(s => s.Status, "Failed")
                    .Set(s => s.ErrorMessage, error)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow),
                cancellationToken: cancellationToken);
        }

        public async Task SetNeedsReviewAsync(string sessionId, string error, CancellationToken cancellationToken = default)
        {
            if (!ObjectId.TryParse(sessionId, out var oid)) return;
            await _sessions.UpdateOneAsync(
                s => s.Id == oid,
                Builders<IdeaGenerationSession>.Update
                    .Set(s => s.Status, "NeedsReview")
                    .Set(s => s.ErrorMessage, error)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow),
                cancellationToken: cancellationToken);
        }
    }
}
