using System.Text.Json;
using System.Text.Json.Serialization;

namespace WebApp.Services.Ai.Providers
{
    // Wire DTOs for the OpenRouter /chat/completions endpoint. Internal — the
    // rest of the app uses the provider-agnostic types in IAiProvider.cs.

    internal sealed class OpenRouterChatRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = "";

        [JsonPropertyName("messages")]
        public List<OpenRouterMessage> Messages { get; set; } = new();

        [JsonPropertyName("max_tokens")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? MaxTokens { get; set; }

        [JsonPropertyName("temperature")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public double? Temperature { get; set; }

        [JsonPropertyName("response_format")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public OpenRouterResponseFormat? ResponseFormat { get; set; }

        // Ask OpenRouter to include the cost/usage accounting block in the response.
        [JsonPropertyName("usage")]
        public OpenRouterUsageRequest Usage { get; set; } = new();
    }

    internal sealed class OpenRouterResponseFormat
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "json_object";
    }

    internal sealed class OpenRouterUsageRequest
    {
        [JsonPropertyName("include")]
        public bool Include { get; set; } = true;
    }

    internal sealed class OpenRouterMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = "";

        [JsonPropertyName("content")]
        public string? Content { get; set; } = "";
    }

    internal sealed class OpenRouterChatResponse
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("model")]
        public string? Model { get; set; }

        [JsonPropertyName("choices")]
        public List<OpenRouterChoice>? Choices { get; set; }

        [JsonPropertyName("usage")]
        public OpenRouterUsage? Usage { get; set; }

        [JsonPropertyName("error")]
        public OpenRouterError? Error { get; set; }
    }

    internal sealed class OpenRouterChoice
    {
        [JsonPropertyName("index")]
        public int Index { get; set; }

        [JsonPropertyName("message")]
        public OpenRouterMessage? Message { get; set; }

        [JsonPropertyName("finish_reason")]
        public string? FinishReason { get; set; }
    }

    internal sealed class OpenRouterUsage
    {
        [JsonPropertyName("prompt_tokens")]
        public int PromptTokens { get; set; }

        [JsonPropertyName("completion_tokens")]
        public int CompletionTokens { get; set; }

        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }

        // Present only when usage.include=true was requested. USD cost.
        [JsonPropertyName("cost")]
        public decimal? Cost { get; set; }
    }

    internal sealed class OpenRouterErrorResponse
    {
        [JsonPropertyName("error")]
        public OpenRouterError? Error { get; set; }
    }

    internal sealed class OpenRouterError
    {
        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("code")]
        [JsonConverter(typeof(FlexibleStringConverter))]
        public string? Code { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }
    }

    /// <summary>
    /// Reads either a string or a numeric JSON value into a C# string without throwing.
    /// </summary>
    internal sealed class FlexibleStringConverter : JsonConverter<string>
    {
        public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt64(out var intVal)) return intVal.ToString();
                if (reader.TryGetDouble(out var doubleVal)) return doubleVal.ToString();
            }
            if (reader.TokenType == JsonTokenType.String)
                return reader.GetString();
            return null;
        }

        public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value);
        }
    }
}
