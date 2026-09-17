using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
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
        private readonly IIdeaGenerationSessionRepository _ideaGenerationSessions;
        private readonly IClarifierSessionStore _clarifierSessions;
        private readonly IMarketStudySessionStore _marketStudySessions;
        private readonly IBusinessModelSessionStore _businessModelSessions;
        private readonly IBusinessPlanSessionStore _businessPlanSessions;
        private readonly IForecastSessionStore _forecastSessions;
        private readonly IAiCreditService _creditService;
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
            IIdeaGenerationSessionRepository ideaGenerationSessions,
            IClarifierSessionStore clarifierSessions,
            IMarketStudySessionStore marketStudySessions,
            IBusinessModelSessionStore businessModelSessions,
            IBusinessPlanSessionStore businessPlanSessions,
            IForecastSessionStore forecastSessions,
            IAiCreditService creditService,
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
            _ideaGenerationSessions = ideaGenerationSessions;
            _clarifierSessions = clarifierSessions;
            _marketStudySessions = marketStudySessions;
            _businessModelSessions = businessModelSessions;
            _businessPlanSessions = businessPlanSessions;
            _forecastSessions = forecastSessions;
            _creditService = creditService;
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

            AiHandlerResult? interpreted = null;
            Exception? caughtException = null;

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
                    ResponseFormat = prep.ResponseFormat,
                });

                interpreted = await handler.InterpretAsync(request, completion);

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
                caughtException = ex;
                await _requests.SetFailedAsync(requestId, ex.Message);

                // Apply automatic refund BEFORE marking session failed so that when the
                // frontend poller detects the terminal Failed state, the credit refund is
                // already committed to the ledger — eliminating any timing race.
                await TryAutomaticRefundAsync(request, ex.Message);

                // Sync the user-facing session (a SEPARATE document from the AIRequest)
                // to Failed too. Without this the session stays "Pending" forever and the
                // frontend poller spins to its 3-minute cap instead of surfacing the error.
                await MarkSessionFailedAsync(request, ex.Message);

                // Terminal failure: notification + realtime (best-effort, never throws).
                await _completion.OnFailedAsync(request, ex.Message);

                _logger.LogError(ex, "AI job {RequestId} ({JobType}) failed.", requestId, request.JobType);
                // Let Hangfire record the failure. Transient errors retry up to the limit;
                // permanent ones (StopRetryOnPermanentAiFailure) go straight to Failed.
                throw;
            }
            finally
            {
                // Single determination: A terminal state with no usable payload refunds, however it was reached.
                // If caughtException was null but interpreted?.OutputPayload == null (e.g. handler/parser rejection),
                // refund here. If caughtException != null, TryAutomaticRefundAsync was already executed above
                // (and is idempotent via CreditRefundResult.AlreadyRefunded guard).
                if (caughtException == null && interpreted?.OutputPayload == null)
                {
                    await TryAutomaticRefundAsync(request, "Unusable or malformed model output");
                }
            }
        }

        /// <summary>
        /// Single determination refund handler: refunds credits when an AI job reaches a terminal
        /// state without delivering a usable payload (exception or parser/schema rejection).
        /// Resolves the operation ID stamped into the job payload; falls back to sessionId ONLY
        /// where sessionId was demonstrably the debit key (BusinessPlan start path with CurrentVersion == 0).
        /// Legacy jobs missing stamped identifiers are logged as reconciliation items.
        /// </summary>
        private async Task TryAutomaticRefundAsync(AiRequest request, string reason)
        {
            if (!Enum.TryParse<AiJobType>(request.JobType, out var jobType))
            {
                _logger.LogWarning("AI job {RequestId} has unknown JobType '{JobType}'; skipping refund.", request.Id, request.JobType);
                return;
            }

            var creditOpId = request.InputPayload != null
                && request.InputPayload.TryGetValue("creditOperationId", out var opVal)
                && opVal.IsString
                && !string.IsNullOrWhiteSpace(opVal.AsString)
                    ? opVal.AsString
                    : null;

            if (string.IsNullOrEmpty(creditOpId))
            {
                var sessionId = request.InputPayload != null
                    && request.InputPayload.TryGetValue("sessionId", out var sidVal)
                    && sidVal.IsString
                        ? sidVal.AsString
                        : null;

                // Fallback ONLY where sessionId was demonstrably the debit key:
                // BusinessPlan.Start path (session has CurrentVersion == 0 and input has no sectionId).
                if (jobType == AiJobType.BusinessPlan
                    && !string.IsNullOrEmpty(sessionId)
                    && (request.InputPayload == null || !request.InputPayload.Contains("sectionId")))
                {
                    try
                    {
                        var session = await _businessPlanSessions.GetOwnedAsync(sessionId, request.OwnerUserId);
                        if (session != null && session.CurrentVersion == 0)
                        {
                            creditOpId = sessionId;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not verify session version for fallback refund of job {RequestId}.", request.Id);
                    }
                }

                if (string.IsNullOrEmpty(creditOpId))
                {
                    _logger.LogWarning(
                        "RECONCILIATION NEEDED: AI job {RequestId} ({JobType}) for user {UserId} ended without usable payload, but lacks a creditOperationId. Jobs debited prior to this change cannot be refunded automatically.",
                        request.Id, request.JobType, request.OwnerUserId);
                    return;
                }
            }

            try
            {
                var result = await _creditService.RefundForJobAsync(request.OwnerUserId, jobType, creditOpId, reason);
                switch (result)
                {
                    case CreditRefundResult.Applied:
                        _logger.LogInformation("Refunded credits for AI job {RequestId} ({JobType}, op {OperationId}) to user {UserId}. Reason: {Reason}",
                            request.Id, jobType, creditOpId, request.OwnerUserId, reason);
                        break;
                    case CreditRefundResult.AlreadyRefunded:
                        _logger.LogInformation("AI job {RequestId} ({JobType}, op {OperationId}) was already refunded.",
                            request.Id, jobType, creditOpId);
                        break;
                    case CreditRefundResult.DebitNotFound:
                        _logger.LogWarning("Debit not found for refund of AI job {RequestId} ({JobType}, op {OperationId}).",
                            request.Id, jobType, creditOpId);
                        break;
                    case CreditRefundResult.InvalidMismatch:
                        _logger.LogWarning("Debit amount mismatch on refund of AI job {RequestId} ({JobType}, op {OperationId}).",
                            request.Id, jobType, creditOpId);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to apply automatic refund for AI job {RequestId} ({JobType}, op {OperationId}) to user {UserId}.",
                    request.Id, jobType, creditOpId, request.OwnerUserId);
            }
        }

        /// <summary>
        /// Marks the user-facing session document failed, keyed by job type. The session id
        /// rides on the request input under "sessionId" (set by each controller). Best-effort:
        /// a sync failure is logged but never masks the original job error. Probe has no session.
        /// </summary>
        private async Task MarkSessionFailedAsync(AiRequest request, string error)
        {
            var sessionId =
                request.InputPayload != null
                && request.InputPayload.TryGetValue("sessionId", out var v)
                && v.IsString
                    ? v.AsString
                    : null;
            if (string.IsNullOrEmpty(sessionId)) return;
            if (!Enum.TryParse<AiJobType>(request.JobType, out var jobType)) return;

            try
            {
                switch (jobType)
                {
                    case AiJobType.IdeaGenerator:
                        await _ideaGenerationSessions.SetFailedAsync(sessionId, error);
                        break;
                    case AiJobType.IdeaClarifier:
                        await _clarifierSessions.SetFailedAsync(sessionId, error);
                        break;
                    case AiJobType.MarketStudy:
                        await _marketStudySessions.SetFailedAsync(sessionId, error);
                        break;
                    case AiJobType.BusinessModel:
                        await _businessModelSessions.SetFailedAsync(sessionId, error);
                        break;
                    case AiJobType.BusinessPlan:
                        await _businessPlanSessions.SetFailedAsync(sessionId, error);
                        break;
                    case AiJobType.Forecast:
                        await _forecastSessions.SetFailedAsync(sessionId, error);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Could not sync session {SessionId} to Failed for request {RequestId} ({JobType}).",
                    sessionId, request.Id, request.JobType);
            }
        }
    }
}
