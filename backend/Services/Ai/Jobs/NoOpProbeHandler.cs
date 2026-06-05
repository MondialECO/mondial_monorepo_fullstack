using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Ai.Prompts;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// The only live handler in C-1: a self-test "probe" that exercises the full
    /// pipeline end-to-end (prompt → real provider call → persistence). It makes
    /// a REAL OpenRouter call — no static/mock output — and stores the model's
    /// reply text. Modules replace this pattern with their own handlers.
    /// </summary>
    public sealed class NoOpProbeHandler : IAiTaskHandler
    {
        public AiJobType Type => AiJobType.Probe;

        public Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            // Optional caller-provided prompt; otherwise a fixed liveness task.
            var message = request.InputPayload != null
                          && request.InputPayload.TryGetValue("message", out var m)
                          && m.IsString
                ? m.AsString
                : "Reply with a short confirmation that the AI pipeline is working.";

            return Task.FromResult(new AiHandlerRequest(
                PromptKey: PromptTemplate.Probe.Key,
                TaskType: AiJobType.Probe.ToString(),
                UserContext: string.Empty,
                Task: message,
                MaxTokens: 64,
                Temperature: 0));
        }

        public Task<AiHandlerResult> InterpretAsync(AiRequest request, AiCompletion completion, CancellationToken cancellationToken = default)
        {
            var payload = new BsonDocument
            {
                ["text"] = completion.Text,
                ["model"] = completion.Model,
            };
            return Task.FromResult(new AiHandlerResult(payload));
        }
    }
}
