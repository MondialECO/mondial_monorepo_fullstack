using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace WebApp.Services.Clarifier
{
    public interface IClarifierTurnService
    {
        IAsyncEnumerable<string> StreamAiResponseAsync(
            string userMessage,
            string language,
            string sessionId,
            string currentTopic,
            CancellationToken cancellationToken = default
        );
    }

    public class ClarifierTurnService : IClarifierTurnService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<ClarifierTurnService> _logger;

        public ClarifierTurnService(
            HttpClient httpClient,
            IConfiguration config,
            ILogger<ClarifierTurnService> logger
        )
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Stream AI response for clarifier topic evaluation
        /// </summary>
        public async IAsyncEnumerable<string> StreamAiResponseAsync(
            string userMessage,
            string language,
            string sessionId,
            string currentTopic,
            [System.Runtime.CompilerServices.EnumeratorCancellation]
            CancellationToken cancellationToken = default
        )
        {
            _logger.LogInformation($"[Clarifier] Evaluating topic {currentTopic} for session {sessionId}");

            // For MVP: Stream fallback response with word-by-word chunks
            // Production: Integrate OpenRouter API in StreamFromOpenRouterAsync
            var chunks = await StreamFromOpenRouterAsync(userMessage, language, currentTopic, cancellationToken);
            foreach (var chunk in chunks)
            {
                yield return chunk;
            }
        }

        private async Task<List<string>> StreamFromOpenRouterAsync(
            string userMessage,
            string language,
            string currentTopic,
            CancellationToken cancellationToken
        )
        {
            var chunks = new List<string>();
            var apiKey = _config["OpenRouter:ApiKey"];

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("[Clarifier] OpenRouter API key not configured, using fallback");
                // Fallback: return mock response word-by-word
                var response = GenerateTopicResponse(currentTopic, userMessage, language);
                foreach (var word in response.Split(' '))
                {
                    chunks.Add(word + " ");
                }
                return chunks;
            }

            try
            {
                var prompt = BuildTopicEvaluationPrompt(currentTopic, userMessage, language);
                var requestBody = new
                {
                    model = "google/gemini-3.5-flash",
                    messages = new[] { new { role = "user", content = prompt } },
                    stream = true,
                    max_tokens = 500,
                    temperature = 0.7
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.io/api/v1/chat/completions")
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(requestBody),
                        Encoding.UTF8,
                        "application/json"
                    )
                };

                request.Headers.Add("Authorization", $"Bearer {apiKey}");
                request.Headers.Add("HTTP-Referer", "https://mondial.eco");

                using var response = await _httpClient.SendAsync(
                    request,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken
                );

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"[Clarifier] OpenRouter returned {response.StatusCode}, using fallback");
                    var fallback = GenerateTopicResponse(currentTopic, userMessage, language);
                    foreach (var word in fallback.Split(' '))
                    {
                        chunks.Add(word + " ");
                    }
                    return chunks;
                }

                using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var reader = new System.IO.StreamReader(stream);

                while (!reader.EndOfStream)
                {
                    var line = await reader.ReadLineAsync(cancellationToken);
                    if (string.IsNullOrEmpty(line) || !line.StartsWith("data: "))
                        continue;

                    var data = line.Substring(6);
                    if (data == "[DONE]")
                        break;

                    try
                    {
                        using var doc = JsonDocument.Parse(data);
                        var root = doc.RootElement;

                        if (root.TryGetProperty("choices", out var choices) &&
                            choices.ValueKind == System.Text.Json.JsonValueKind.Array &&
                            choices.GetArrayLength() > 0)
                        {
                            var choice = choices[0];
                            if (choice.TryGetProperty("delta", out var delta) &&
                                delta.TryGetProperty("content", out var content) &&
                                content.ValueKind == System.Text.Json.JsonValueKind.String)
                            {
                                var chunk = content.GetString();
                                if (!string.IsNullOrEmpty(chunk))
                                    chunks.Add(chunk);
                            }
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning($"[Clarifier] Error parsing response: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Clarifier] Error calling OpenRouter, using fallback");
                var fallback = GenerateTopicResponse(currentTopic, userMessage, language);
                foreach (var word in fallback.Split(' '))
                {
                    chunks.Add(word + " ");
                }
            }

            return chunks;
        }

        private string BuildTopicEvaluationPrompt(string topic, string userMessage, string language)
        {
            var prompt = topic switch
            {
                "problem" => language == "fr"
                    ? "Problème décrit: \"{0}\"\n\nÉvaluez si c'est assez clair et spécifique."
                    : "User's problem: \"{0}\"\n\nIs this clear and specific?",

                "who" => language == "fr"
                    ? "Audience cible: \"{0}\"\n\nCette audience est-elle assez spécifique?"
                    : "Target audience: \"{0}\"\n\nIs this specific enough?",

                "solution" => language == "fr"
                    ? "Solution: \"{0}\"\n\nCette solution est-elle claire et réaliste?"
                    : "Solution: \"{0}\"\n\nIs this clear and realistic?",

                "alternatives" => language == "fr"
                    ? "Alternatives: \"{0}\"\n\nCes alternatives sont-elles bien identifiées?"
                    : "Alternatives: \"{0}\"\n\nAre these well identified?",

                "edge" => language == "fr"
                    ? "Avantage: \"{0}\"\n\nCet avantage est-il durable?"
                    : "Edge: \"{0}\"\n\nIs this sustainable?",

                "risk" => language == "fr"
                    ? "Risques: \"{0}\"\n\nCes risques sont-ils bien expliqués?"
                    : "Risks: \"{0}\"\n\nWell explained?",

                _ => "Évaluez cette réponse"
            };

            return string.Format(prompt, userMessage);
        }

        private string GenerateTopicResponse(string topic, string userMessage, string language)
        {
            return topic switch
            {
                "problem" => language == "fr"
                    ? "Merci. Pouvez-vous préciser pourquoi c'est urgent?"
                    : "Thank you. Why is this urgent?",

                "who" => language == "fr"
                    ? "Audience identifiée. Plus de détails?"
                    : "Audience noted. More details?",

                "solution" => language == "fr"
                    ? "Solution intéressante. Comment serait-elle utilisée?"
                    : "Interesting solution. How would it be used?",

                "alternatives" => language == "fr"
                    ? "Alternatives mentionnées. Qu'est-ce qui ne va pas?"
                    : "Alternatives noted. What's insufficient?",

                "edge" => language == "fr"
                    ? "Avantage identifié. Est-il durable?"
                    : "Edge identified. Sustainable?",

                "risk" => language == "fr"
                    ? "Risques identifiés. Le plus grand?"
                    : "Risks noted. The biggest?",

                _ => language == "fr" ? "Merci." : "Thank you."
            };
        }
    }
}
