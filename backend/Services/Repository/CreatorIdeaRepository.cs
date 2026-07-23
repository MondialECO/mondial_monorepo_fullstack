using MongoDB.Driver;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Repository
{
    /// <summary>
    /// Lifecycle seam over the <c>CreatorIdeas</c> collection (multi-idea Creator
    /// foundation). Owner-scoped reads + resolve-from-linked-session lookups mirror the
    /// AI session repositories' conventions; implemented by
    /// <see cref="CreatorIdeaRepository"/>.
    /// </summary>
    public interface ICreatorIdeaStore
    {
        Task AddAsync(CreatorIdea idea);

        /// <summary>An idea by id, owner-scoped (null if not owned).</summary>
        Task<CreatorIdea?> GetOwnedAsync(string ideaId, string ownerUserId);

        /// <summary>All of a user's ideas, newest-active first.</summary>
        Task<List<CreatorIdea>> ListByUserAsync(string ownerUserId);

        /// <summary>Resolve the idea that owns a given clarifier session (owner-scoped).</summary>
        Task<CreatorIdea?> GetByClarifierAsync(string clarifierSessionId, string ownerUserId);

        /// <summary>Resolve the idea that owns a given business-plan session (owner-scoped).</summary>
        Task<CreatorIdea?> GetByBusinessPlanAsync(string businessPlanSessionId, string ownerUserId);

        /// <summary>Bump LastActiveAt/UpdatedAt (owner-scoped) — keeps the my-ideas sort honest.</summary>
        Task TouchAsync(string ideaId, string ownerUserId);
    }

    /// <summary>
    /// Repository for the <c>CreatorIdeas</c> collection. Owns its indexes in the
    /// constructor (session-repo pattern) so no change to <c>MongoDbContext</c> is
    /// needed. Non-unique {UserId, CreatedAt desc} history index, plus indexes on the
    /// linked session ids so an idea can be resolved from a session later.
    /// </summary>
    public class CreatorIdeaRepository : MongoRepository<CreatorIdea>, ICreatorIdeaStore
    {
        public CreatorIdeaRepository(IMongoDatabase database) : base(database, "CreatorIdeas")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // Owner idea history (newest first). NON-unique — many ideas per user.
                new CreateIndexModel<CreatorIdea>(
                    Builders<CreatorIdea>.IndexKeys
                        .Ascending(x => x.UserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "User_CreatedAt" }),

                // Resolve an idea from its linked clarifier session.
                new CreateIndexModel<CreatorIdea>(
                    Builders<CreatorIdea>.IndexKeys.Ascending(x => x.Phase2Data.ClarifierSessionId),
                    new CreateIndexOptions { Name = "ClarifierSessionId" }),

                // Resolve an idea from its linked business-plan session.
                new CreateIndexModel<CreatorIdea>(
                    Builders<CreatorIdea>.IndexKeys.Ascending(x => x.Phase3Data.BusinessPlanSessionId),
                    new CreateIndexOptions { Name = "BusinessPlanSessionId" }),
            });
        }

        public async Task<CreatorIdea?> GetOwnedAsync(string ideaId, string ownerUserId)
            => await _collection.Find(x => x.Id == ideaId && x.UserId == ownerUserId).FirstOrDefaultAsync();

        public async Task<List<CreatorIdea>> ListByUserAsync(string ownerUserId)
            => await _collection.Find(x => x.UserId == ownerUserId)
                .SortByDescending(x => x.LastActiveAt)
                .ToListAsync();

        public async Task<CreatorIdea?> GetByClarifierAsync(string clarifierSessionId, string ownerUserId)
            => await _collection.Find(x => x.Phase2Data.ClarifierSessionId == clarifierSessionId && x.UserId == ownerUserId)
                .FirstOrDefaultAsync();

        public async Task<CreatorIdea?> GetByBusinessPlanAsync(string businessPlanSessionId, string ownerUserId)
            => await _collection.Find(x => x.Phase3Data.BusinessPlanSessionId == businessPlanSessionId && x.UserId == ownerUserId)
                .FirstOrDefaultAsync();

        public Task TouchAsync(string ideaId, string ownerUserId)
        {
            var now = DateTime.UtcNow;
            return _collection.UpdateOneAsync(
                x => x.Id == ideaId && x.UserId == ownerUserId,
                Builders<CreatorIdea>.Update
                    .Set(x => x.LastActiveAt, now)
                    .Set(x => x.UpdatedAt, now));
        }
    }
}
