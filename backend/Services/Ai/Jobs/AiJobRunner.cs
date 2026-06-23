using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Orchestrates one AI request: load → (idempotency guard) → resolve handler
    /// → build prompt (Phase 3) → call provider (Phase 1) → persist AIResponses +
    /// ModelUsage (Phase 2) → update status. Throws on failure so Hangfire can
    /// retry / record it; the request is marked Failed with the error first.
    /// </summary>
    public sealed class AiJobRunner : IAiJobRunner
    {
        private readonly AiRequestRepository _requests;
        private readonly AiResponseRepository _responses;
        private readonly AiModelUsageRepository _usage;
        private readonly AiTaskHandlerRegistry _handlers;
        private readonly IPromptVersionStore _promptStore;
        private readonly IPromptBuilder _promptBuilder;
        private readonly IModelRouter _modelRouter;
        private readonly IAiProvider _provider;
        private readonly IAiJobCompletionHandler _completion;
        private readonly ILogger<AiJobRunner> _logger;

        public AiJobRunner(
            AiRequestRepository requests,
            AiResponseRepository responses,
            AiModelUsageRepository usage,
            AiTaskHandlerRegistry handlers,
            IPromptVersionStore promptStore,
            IPromptBuilder promptBuilder,
            IModelRouter modelRouter,
            IAiProvider provider,
            IAiJobCompletionHandler completion,
            ILogger<AiJobRunner> logger)
        {
            _requests = requests;
            _responses = responses;
            _usage = usage;
            _handlers = handlers;
            _promptStore = promptStore;
            _promptBuilder = promptBuilder;
            _modelRouter = modelRouter;
            _provider = provider;
            _completion = completion;
            _logger = logger;
        }

        public async Task RunAsync(string requestId)
        {
            var request = await _requests.GetByIdAsync(requestId);
            if (request is null)
            {
                _logger.LogWarning("AI job {RequestId} has no request document; skipping.", requestId);
                return;
            }

            // Idempotency: Hangfire delivers at-least-once. A completed request
            // must not trigger a second (paid) provider call.
            if (string.Equals(request.Status, "Completed", StringComparison.Ordinal))
            {
                _logger.LogInformation("AI job {RequestId} already Completed; no-op.", requestId);
                return;
            }

            try
            {
                await _requests.SetProcessingAsync(requestId);

                var jobType = Enum.Parse<AiJobType>(request.JobType);
                var handler = _handlers.Resolve(jobType);

                var prep = await handler.PrepareAsync(request);

                var template = await _promptStore.GetActiveAsync(prep.PromptKey)
                    ?? throw new InvalidOperationException(
                        $"No active prompt version for key '{prep.PromptKey}'.");

                var composition = _promptBuilder.Build(template, prep.UserContext, prep.Task);
                var model = _modelRouter.Resolve(prep.TaskType);

                var completion = await _provider.CompleteAsync(new AiCompletionRequest
                {
                    Model = model,
                    Messages = composition.Messages,
                    MaxTokens = prep.MaxTokens,
                    Temperature = prep.Temperature,
                });

                var interpreted = await handler.InterpretAsync(request, completion);

                var responseEntity = new AiResponse
                {
                    RequestId = request.Id,
                    OwnerUserId = request.OwnerUserId,
                    Model = completion.Model,
                    RawText = completion.Text,
                    OutputPayload = interpreted.OutputPayload,
                    TokenUsage = new AiResponseTokenUsage
                    {
                        PromptTokens = completion.Usage.PromptTokens,
                        CompletionTokens = completion.Usage.CompletionTokens,
                        TotalTokens = completion.Usage.TotalTokens,
                    },
                    FinishReason = completion.FinishReason,
                    Version = 1,
                };
                await _responses.AddAsync(responseEntity);

                await _usage.AddAsync(new AiModelUsage
                {
                    OwnerUserId = request.OwnerUserId,
                    RequestId = request.Id,
                    Model = completion.Model,
                    PromptTokens = completion.Usage.PromptTokens,
                    CompletionTokens = completion.Usage.CompletionTokens,
                    TotalTokens = completion.Usage.TotalTokens,
                    EstimatedCost = completion.EstimatedCost,
                    TaskType = request.JobType,
                });

                await _requests.SetCompletedAsync(request.Id, template.Key, template.Version);

                // Terminal success: notification + realtime (best-effort, never throws).
                await _completion.OnCompletedAsync(request, responseEntity);

                _logger.LogInformation("AI job {RequestId} ({JobType}) completed on model {Model}.",
                    requestId, request.JobType, completion.Model);
            }
            catch (Exception ex)
            {
                await _requests.SetFailedAsync(requestId, ex.Message);

                // Terminal failure: notification + realtime (best-effort, never throws).
                await _completion.OnFailedAsync(request, ex.Message);

                _logger.LogError(ex, "AI job {RequestId} ({JobType}) failed.", requestId, request.JobType);
                // Let Hangfire record the failure. Transient errors retry up to the limit;
                // permanent ones (StopRetryOnPermanentAiFailure) go straight to Failed.
                throw;
            }
        }
    }
}
