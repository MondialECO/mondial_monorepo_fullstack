using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>AiReconciliationAudits</c> collection.</summary>
    public class AiReconciliationAuditRepository : MongoRepository<AiReconciliationAudit>
    {
        public AiReconciliationAuditRepository(IMongoDatabase database) : base(database, "AiReconciliationAudits")
        {
            if (_collection != null && database != null)
            {
                try { CreateIndexesAsync().GetAwaiter().GetResult(); } catch { }
            }
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // Owner audit history
                new CreateIndexModel<AiReconciliationAudit>(
                    Builders<AiReconciliationAudit>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_CreatedAt" }),

                // Operation lookup
                new CreateIndexModel<AiReconciliationAudit>(
                    Builders<AiReconciliationAudit>.IndexKeys.Ascending(x => x.OperationId),
                    new CreateIndexOptions { Name = "OperationId", Sparse = true }),

                // Source and Action queries
                new CreateIndexModel<AiReconciliationAudit>(
                    Builders<AiReconciliationAudit>.IndexKeys
                        .Ascending(x => x.Source)
                        .Ascending(x => x.Action)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Source_Action_CreatedAt" }),
            });
        }

        public virtual async Task RecordAuditAsync(AiReconciliationAudit audit)
        {
            if (string.IsNullOrWhiteSpace(audit.Id))
            {
                audit.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
            }
            if (audit.CreatedAt == default)
            {
                audit.CreatedAt = DateTime.UtcNow;
            }
            await AddAsync(audit);
        }

        public virtual async Task<IReadOnlyList<AiReconciliationAudit>> GetRecentAsync(int limit = 100)
        {
            return await _collection.Find(_ => true)
                .SortByDescending(x => x.CreatedAt)
                .Limit(limit)
                .ToListAsync();
        }
    }
}
