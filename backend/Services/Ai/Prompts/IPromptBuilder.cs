using WebApp.Services.Ai.Providers;

namespace WebApp.Services.Ai.Prompts
{
    /// <summary>
    /// Assembles the five prompt layers (System · Product Context · User Context
    /// · Task · Output Format) into a provider-ready chat message list. Safety
    /// rules are injected centrally into the System layer. No task/module prompt
    /// text is hardcoded in AI services — it all flows through here.
    /// </summary>
    public interface IPromptBuilder
    {
        PromptComposition Build(PromptTemplate template, string userContext, string task);
    }

    /// <summary>Canonical layer names, in composition order.</summary>
    public static class PromptLayerNames
    {
        public const string System = "System";
        public const string ProductContext = "ProductContext";
        public const string UserContext = "UserContext";
        public const string Task = "Task";
        public const string OutputFormat = "OutputFormat";
    }

    /// <summary>One named layer of a composed prompt.</summary>
    public sealed record PromptLayer(string Name, string Content);

    /// <summary>
    /// Result of composition: the ordered <see cref="Layers"/> (for inspection /
    /// testing) and the chat-ready <see cref="Messages"/> (for the provider).
    /// </summary>
    public sealed class PromptComposition
    {
        public required IReadOnlyList<PromptLayer> Layers { get; init; }
        public required IReadOnlyList<AiMessage> Messages { get; init; }
    }
}
