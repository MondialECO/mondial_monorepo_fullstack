using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Providers;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Strategy each AI module implements for its <see cref="AiJobType"/>. The
    /// runner owns prompt building + the provider call; the handler only (1)
    /// turns the request's input into prompt inputs (<see cref="PrepareAsync"/>)
    /// and (2) interprets the raw completion into a structured payload
    /// (<see cref="InterpretAsync"/>). C-2/3/4 add handlers, never new jobs.
    /// </summary>
    public interface IAiTaskHandler
    {
        AiJobType Type { get; }

        Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default);

        Task<AiHandlerResult> InterpretAsync(AiRequest request, AiCompletion completion, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Prompt inputs a handler produces from the request: which template to use,
    /// the task-type for model routing, and the User Context / Task layer text.
    /// </summary>
    public sealed record AiHandlerRequest(
        string PromptKey,
        string TaskType,
        string UserContext,
        string Task,
        int? MaxTokens = null,
        double? Temperature = null);

    /// <summary>
    /// Interpreted output: an optional structured payload persisted on the
    /// response. Raw provider text is always persisted by the runner.
    /// </summary>
    public sealed record AiHandlerResult(BsonDocument? OutputPayload = null);
}
