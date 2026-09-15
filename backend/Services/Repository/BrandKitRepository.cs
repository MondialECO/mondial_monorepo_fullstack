using MongoDB.Driver;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Repository
{
    /// <summary>
    /// Lifecycle seam over the <c>BrandKits</c> collection (Phase 2 Brand Visual Identity Studio).
    /// Enforces owner-scoped reads, targeted atomic writes, and optimistic concurrency version stamping.
    /// </summary>
    public interface IBrandKitStore
    {
        Task AddAsync(BrandKit kit);

        /// <summary>Resolve the BrandKit by its owning CreatorIdea ID, owner-scoped (null if not owned).</summary>
        Task<BrandKit?> GetByIdeaIdAsync(string ideaId, string ownerUserId);

        /// <summary>Resolve the BrandKit by its primary ID, owner-scoped (null if not owned).</summary>
        Task<BrandKit?> GetByIdAsync(string id, string ownerUserId);

        /// <summary>
        /// Owner-scoped targeted update. Caller provides specific $set/$push definitions;
        /// UpdatedAt is stamped and Version is incremented atomically.
        /// </summary>
        Task<bool> UpdateAsync(
            string ideaId,
            string ownerUserId,
            UpdateDefinition<BrandKit> update,
            long? expectedVersion = null,
            IClientSessionHandle? session = null);

        /// <summary>
        /// Pushes a snapshot with write-time retention enforcement: position 0 (newest first),
        /// slice 3 (oldest dropped atomically when exceeding 3).
        /// </summary>
        Task<bool> PushSnapshotAsync(
            string ideaId,
            string ownerUserId,
            BrandKitSnapshot snapshot,
            long? expectedVersion = null,
            IClientSessionHandle? session = null);
    }

    /// <summary>
    /// Repository for the <c>BrandKits</c> collection.
    /// Owns its indexes in the constructor (matching CreatorIdeaRepository convention).
    /// </summary>
    public class BrandKitRepository : MongoRepository<BrandKit>, IBrandKitStore
    {
        public BrandKitRepository(IMongoDatabase database) : base(database, "BrandKits")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<BrandKit>(
                    Builders<BrandKit>.IndexKeys.Ascending(x => x.IdeaId),
                    new CreateIndexOptions { Name = "Unique_IdeaId", Unique = true }));
        }

        public async Task<BrandKit?> GetByIdeaIdAsync(string ideaId, string ownerUserId)
        {
            if (string.IsNullOrWhiteSpace(ideaId) || string.IsNullOrWhiteSpace(ownerUserId))
                return null;

            return await _collection.Find(x => x.IdeaId == ideaId && x.UserId == ownerUserId).FirstOrDefaultAsync();
        }

        public async Task<BrandKit?> GetByIdAsync(string id, string ownerUserId)
        {
            if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(ownerUserId))
                return null;

            return await _collection.Find(x => x.Id == id && x.UserId == ownerUserId).FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateAsync(
            string ideaId,
            string ownerUserId,
            UpdateDefinition<BrandKit> update,
            long? expectedVersion = null,
            IClientSessionHandle? session = null)
        {
            var now = DateTime.UtcNow;
            var filter = Builders<BrandKit>.Filter.Eq(x => x.IdeaId, ideaId)
                & Builders<BrandKit>.Filter.Eq(x => x.UserId, ownerUserId);

            if (expectedVersion.HasValue)
            {
                var versionFilter = Builders<BrandKit>.Filter.Eq(x => x.Version, expectedVersion.Value);
                if (expectedVersion.Value == 1)
                    versionFilter |= Builders<BrandKit>.Filter.Exists(x => x.Version, false);
                filter &= versionFilter;
            }

            var stampedUpdate = update
                .Set(x => x.UpdatedAt, now)
                .Inc(x => x.Version, 1);

            var result = session is null
                ? await _collection.UpdateOneAsync(filter, stampedUpdate)
                : await _collection.UpdateOneAsync(session, filter, stampedUpdate);

            return result.MatchedCount == 1;
        }

        public Task<bool> PushSnapshotAsync(
            string ideaId,
            string ownerUserId,
            BrandKitSnapshot snapshot,
            long? expectedVersion = null,
            IClientSessionHandle? session = null)
        {
            var pushUpdate = Builders<BrandKit>.Update.PushEach(
                x => x.Snapshots,
                new[] { snapshot },
                position: 0,
                slice: 3);

            return UpdateAsync(ideaId, ownerUserId, pushUpdate, expectedVersion, session);
        }
    }
}
