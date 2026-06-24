using System.Text.Json.Serialization;

namespace WebApp.Services.Ai.Providers
{
    // Wire DTOs for the Anthropic /v1/messages endpoint. Internal — the rest of
    // the app uses the provider-agnostic types in IAiProvider.cs.

    internal sealed class AnthropicMessagesRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = "";

        // Anthropic REQUIRES max_tokens on every request.
        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; }

        [JsonPropertyName("temperature")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public double? Temperature { get; set; }

        // Top-level system prompt (NOT a message). Omitted when empty.
        [JsonPropertyName("system")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? System { get; set; }

        [JsonPropertyName("messages")]
        public List<AnthropicMessage> Messages { get; set; } = new();
    }

    internal sealed class AnthropicMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = "";

        // Anthropic accepts a plain string for content (auto-wrapped as a text block).
        [JsonPropertyName("content")]
        public string Content { get; set; } = "";
    }

    internal sealed class AnthropicMessagesResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("model")]
        public string? Model { get; set; }

        [JsonPropertyName("content")]
        public List<AnthropicContentBlock>? Content { get; set; }

        [JsonPropertyName("stop_reason")]
        public string? StopReason { get; set; }

        [JsonPropertyName("usage")]
        public AnthropicUsage? Usage { get; set; }
    }

    internal sealed class AnthropicContentBlock
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }

    internal sealed class AnthropicUsage
    {
        [JsonPropertyName("input_tokens")]
        public int InputTokens { get; set; }

        [JsonPropertyName("output_tokens")]
        public int OutputTokens { get; set; }
    }

    internal sealed class AnthropicErrorResponse
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("error")]
        public AnthropicError? Error { get; set; }
    }

    internal sealed class AnthropicError
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }
}
