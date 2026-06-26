using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Application-facing AI job API: enqueue a durable job and read its status.
    /// Persists an <c>AIRequests</c> document and enqueues one Hangfire job that
    /// the runner executes. Ownership-scoped reads.
    /// </summary>
    public interface IAiJobService
    {
        /// <summary>Persist a request and enqueue it; returns the request/job id.</summary>
        Task<string> EnqueueAsync(AiJobType jobType, string ownerUserId, BsonDocument? input);

        /// <summary>Owner-scoped status fetch; null if not found or not owned.</summary>
        Task<AiRequest?> GetStatusAsync(string requestId, string ownerUserId);
    }
}
