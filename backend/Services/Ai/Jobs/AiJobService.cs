using Hangfire;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Persists an <c>AIRequests</c> document then enqueues the single durable
    /// Hangfire job (<see cref="IAiJobRunner.RunAsync"/>) that processes it. The
    /// runner attributes route it to the <c>ai</c> queue. The request is written
    /// before enqueue so the runner never races a missing document.
    /// </summary>
    public sealed class AiJobService : IAiJobService
    {
        private readonly AiRequestRepository _requests;
        private readonly IBackgroundJobClient _jobClient;
        private readonly AiTaskHandlerRegistry _handlers;
        private readonly ILogger<AiJobService> _logger;

        public AiJobService(
            AiRequestRepository requests,
            IBackgroundJobClient jobClient,
            AiTaskHandlerRegistry handlers,
            ILogger<AiJobService> logger)
        {
            _requests = requests;
            _jobClient = jobClient;
            _handlers = handlers;
            _logger = logger;
        }

        public async Task<string> EnqueueAsync(AiJobType jobType, string ownerUserId, BsonDocument? input)
        {
            if (string.IsNullOrWhiteSpace(ownerUserId))
                throw new ArgumentException("Owner user id is required.", nameof(ownerUserId));
            if (!_handlers.IsSupported(jobType))
                throw new InvalidOperationException($"Job type '{jobType}' has no registered handler.");

            var request = new AiRequest
            {
                OwnerUserId = ownerUserId,
                JobType = jobType.ToString(),
                Status = "Pending",
                InputPayload = input,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _requests.AddAsync(request); // ObjectId id assigned here

            var hangfireJobId = _jobClient.Enqueue<IAiJobRunner>(r => r.RunAsync(request.Id));
            await _requests.SetHangfireJobIdAsync(request.Id, hangfireJobId);

            _logger.LogInformation("Enqueued AI job {RequestId} ({JobType}) as hangfire {HangfireJobId}.",
                request.Id, jobType, hangfireJobId);
            return request.Id;
        }

        public Task<AiRequest?> GetStatusAsync(string requestId, string ownerUserId)
            => _requests.GetOwnedAsync(requestId, ownerUserId);
    }
}
