namespace WebApp.Services.Ai.Providers
{
    /// <summary>
    /// Provider-agnostic completion contract. The rest of the AI stack depends
    /// on this, never on OpenRouter directly, so the provider can be swapped
    /// without touching jobs/handlers. OpenRouterClient is the only Phase 1 impl.
    /// </summary>
    public interface IAiProvider
    {
        Task<AiCompletion> CompleteAsync(AiCompletionRequest request, CancellationToken cancellationToken = default);
    }

    /// <summary>A single chat message in provider-neutral form.</summary>
    public sealed record AiMessage(string Role, string Content);

    /// <summary>
    /// A completion request with the model already resolved (via IModelRouter)
    /// and the message list assembled (via the prompt framework, Phase 3).
    /// </summary>
    public sealed class AiCompletionRequest
    {
        public required string Model { get; init; }
        public required IReadOnlyList<AiMessage> Messages { get; init; }
        public int? MaxTokens { get; init; }
        public double? Temperature { get; init; }
        public string? ResponseFormat { get; init; }
    }

    /// <summary>Token accounting returned by the provider.</summary>
    public sealed record AiTokenUsage(int PromptTokens, int CompletionTokens, int TotalTokens);

    /// <summary>Normalized completion result: text + model + usage + cost.</summary>
    public sealed class AiCompletion
    {
        public required string Text { get; init; }
        public required string Model { get; init; }
        public required AiTokenUsage Usage { get; init; }
        public string? FinishReason { get; init; }

        /// <summary>
        /// Provider-reported cost in USD when available (OpenRouter returns it
        /// in the usage block when requested); 0 when the provider omits it.
        /// </summary>
        public decimal EstimatedCost { get; init; }
    }
}
