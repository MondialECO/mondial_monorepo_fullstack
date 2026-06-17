using WebApp.Services.Ai.Providers;

namespace WebApp.Services.Ai.Prompts
{
    /// <summary>
    /// Default <see cref="IPromptBuilder"/>. Stateless. Produces the five layers
    /// in canonical order and maps them to two chat messages: a system message
    /// (System+Safety, Product Context, Output Format) and a user message
    /// (User Context, Task). Safety rules come from <see cref="SafetyRules"/>
    /// — the single source — and are appended to every System layer.
    /// </summary>
    public sealed class PromptBuilder : IPromptBuilder
    {
        private const string NoUserContext = "(no additional user context provided)";
        private const string NoOutputFormat = "(no specific output format)";

        public PromptComposition Build(PromptTemplate template, string userContext, string task)
        {
            ArgumentNullException.ThrowIfNull(template);
            if (string.IsNullOrWhiteSpace(task))
                throw new ArgumentException("Task layer text is required.", nameof(task));

            var system = template.SystemText?.Trim() ?? string.Empty;
            var systemWithSafety = string.IsNullOrEmpty(system)
                ? SafetyRules.Text
                : $"{system}\n\n{SafetyRules.Text}";

            // Canonical order: System · Product Context · User Context · Task · Output Format.
            var layers = new List<PromptLayer>
            {
                new(PromptLayerNames.System, systemWithSafety),
                new(PromptLayerNames.ProductContext, ProductContext.Text),
                new(PromptLayerNames.UserContext,
                    string.IsNullOrWhiteSpace(userContext) ? NoUserContext : userContext.Trim()),
                new(PromptLayerNames.Task, task.Trim()),
                new(PromptLayerNames.OutputFormat,
                    string.IsNullOrWhiteSpace(template.OutputContract) ? NoOutputFormat : template.OutputContract!.Trim()),
            };

            var systemMessage = string.Join("\n\n", new[]
            {
                layers[0].Content,
                $"# Product Context\n{layers[1].Content}",
                $"# Output Format\n{layers[4].Content}",
            });

            var userMessage = string.Join("\n\n", new[]
            {
                $"# Context\n{layers[2].Content}",
                $"# Task\n{layers[3].Content}",
            });

            var messages = new List<AiMessage>
            {
                new("system", systemMessage),
                new("user", userMessage),
            };

            return new PromptComposition { Layers = layers, Messages = messages };
        }
    }
}
