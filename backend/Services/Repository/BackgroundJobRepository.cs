using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Jobs;

namespace WebApp.Services.Repository
{
    public interface IBackgroundJobRepository
    {
        Task InsertAsync(BackgroundJobRecord record);
        Task<BackgroundJobRecord?> GetAsync(string jobId);
        Task SetHangfireJobIdAsync(string jobId, string hangfireJobId);
        Task SetProcessingAsync(string jobId);
        Task SetCompletedAsync(string jobId, string result);
        Task SetFailedAsync(string jobId, string errorMessage);
    }

    /// <summary>
    /// Durable store for legacy background-job status. Replaces the in-memory
    /// <c>Dictionary</c> the old BackgroundJobService used, so status survives
    /// restarts and is consistent across replicas. Mirrors the existing repo
    /// convention (inherit <see cref="MongoRepository{T}"/>, indexes created
    /// synchronously in ctor — see NotificationRepository).
    /// </summary>
    public class BackgroundJobRepository : MongoRepository<BackgroundJobRecord>, IBackgroundJobRepository
    {
        public BackgroundJobRepository(IMongoDatabase database)
            : base(database, "BackgroundJobs")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            var byOwner = Builders<BackgroundJobRecord>.IndexKeys
                .Ascending(r => r.OwnerUserId)
                .Descending(r => r.CreatedAt);
            var byStatus = Builders<BackgroundJobRecord>.IndexKeys
                .Ascending(r => r.Status);

            await _collection.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<BackgroundJobRecord>(byOwner),
                new CreateIndexModel<BackgroundJobRecord>(byStatus),
            });
        }

        public Task InsertAsync(BackgroundJobRecord record)
            => _collection.InsertOneAsync(record);

        public async Task<BackgroundJobRecord?> GetAsync(string jobId)
            => await _collection.Find(r => r.JobId == jobId).FirstOrDefaultAsync();

        public Task SetHangfireJobIdAsync(string jobId, string hangfireJobId)
            => _collection.UpdateOneAsync(
                r => r.JobId == jobId,
                Builders<BackgroundJobRecord>.Update
                    .Set(r => r.HangfireJobId, hangfireJobId)
                    .Set(r => r.UpdatedAt, DateTime.UtcNow));

        public Task SetProcessingAsync(string jobId)
            => _collection.UpdateOneAsync(
                r => r.JobId == jobId,
                Builders<BackgroundJobRecord>.Update
                    .Set(r => r.Status, "processing")
                    .Set(r => r.UpdatedAt, DateTime.UtcNow));

        public Task SetCompletedAsync(string jobId, string result)
            => _collection.UpdateOneAsync(
                r => r.JobId == jobId,
                Builders<BackgroundJobRecord>.Update
                    .Set(r => r.Status, "completed")
                    .Set(r => r.Result, result)
                    .Set(r => r.CompletedAt, DateTime.UtcNow)
                    .Set(r => r.UpdatedAt, DateTime.UtcNow));

        public Task SetFailedAsync(string jobId, string errorMessage)
            => _collection.UpdateOneAsync(
                r => r.JobId == jobId,
                Builders<BackgroundJobRecord>.Update
                    .Set(r => r.Status, "failed")
                    .Set(r => r.ErrorMessage, errorMessage)
                    .Set(r => r.CompletedAt, DateTime.UtcNow)
                    .Set(r => r.UpdatedAt, DateTime.UtcNow));
    }
}
