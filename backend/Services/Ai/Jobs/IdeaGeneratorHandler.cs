using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Phase 2 Idea Generator handler (one-shot). Mirrors IdeaClarifierHandler pattern.
    /// PrepareAsync shapes the request's sectors/problem/strengths into prompt context.
    /// InterpretAsync parses the model's JSON array of ideas, validates output contract,
    /// writes the IdeaGenerationSession and AiInsight. Parse/validation failure:
    /// session marked NeedsReview (raw text preserved on response), job completes normally.
    /// </summary>
    public sealed class IdeaGeneratorHandler : IAiTaskHandler
    {
        private const int MaxOutputTokens = 2000;
        private const double Temperature = 0.7;

        private readonly IIdeaGenerationSessionRepository _sessions;
        private readonly IAiInsightWriter _insights;
        private readonly ILogger<IdeaGeneratorHandler> _logger;

        public IdeaGeneratorHandler(
            IIdeaGenerationSessionRepository sessions,
            IAiInsightWriter insights,
            ILogger<IdeaGeneratorHandler> logger)
        {
            _sessions = sessions;
            _insights = insights;
            _logger = logger;
        }

        public AiJobType Type => AiJobType.IdeaGenerator;

        public Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            var input = request.InputPayload;

            string ArrayField(string key) =>
                input?.TryGetValue(key, out var v) == true && v.IsBsonArray
                    ? string.Join(", ", v.AsBsonArray.Select(e => e.AsString))
                    : string.Empty;

            string StringField(string key) =>
                input?.TryGetValue(key, out var v) == true && v.IsString
                    ? v.AsString.Trim()
                    : string.Empty;

            var sectors = ArrayField("sectors");
            var problem = StringField("observedProblem");
            var strengths = ArrayField("strengths");

            var contextLines = new List<string>();
            if (sectors.Length > 0) contextLines.Add($"Market sectors: {sectors}");
            if (problem.Length > 0) contextLines.Add($"Observed problem: {problem}");
            if (strengths.Length > 0) contextLines.Add($"Core strengths: {strengths}");

            var userContext = contextLines.Count > 0
                ? string.Join("\n", contextLines)
                : "(no input provided)";

            const string task =
                "Generate 3 distinct venture concepts optimized for market viability, TAM, and competitive saturation. " +
                "Return ONLY a JSON array with objects: { title, problem, solution, marketGap, score (0-100) }.";

            return Task.FromResult(new AiHandlerRequest(
                PromptKey: PromptTemplate.IdeaGenerator.Key,
                TaskType: "IdeaGenerator",
                UserContext: userContext,
                Task: task,
                MaxTokens: MaxOutputTokens,
                Temperature: Temperature));
        }

        public async Task<AiHandlerResult> InterpretAsync(AiRequest request, AiCompletion completion, CancellationToken cancellationToken = default)
        {
            var sessionId = request.InputPayload?.TryGetValue("sessionId", out var sid) == true && sid.IsString
                ? sid.AsString
                : null;

            if (!IdeaGeneratorOutputParser.TryParse(completion.Text, out var contract, out var parseError))
            {
                _logger.LogWarning("IdeaGenerator output for request {RequestId} could not be parsed: {Error}",
                    request.Id, parseError);

                if (sessionId != null)
                    await _sessions.SetNeedsReviewAsync(sessionId, parseError, cancellationToken);

                return new AiHandlerResult(OutputPayload: null);
            }

            if (sessionId != null)
            {
                await _sessions.SetCompletedAsync(sessionId, contract, cancellationToken);

                await _insights.WriteAsync(new AiInsight
                {
                    OwnerUserId = request.OwnerUserId,
                    Type = AiJobType.IdeaGenerator.ToString(),
                    Payload = contract,
                    SourceRequestId = request.Id,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                _logger.LogWarning("IdeaGenerator request {RequestId} had no sessionId; skipped session/insight writes.",
                    request.Id);
            }

            return new AiHandlerResult(OutputPayload: contract);
        }
    }

    /// <summary>
    /// Tolerant parser for the model's idea generation output. Extracts the first
    /// JSON array, validates required fields per idea, clamps score to 0–100 using
    /// .ToDouble() (not .AsDouble() which crashes on BsonInt32), wraps in
    /// { ideas: [...], schemaVersion: 1 } document.
    /// </summary>
    internal static class IdeaGeneratorOutputParser
    {
        private static readonly string[] RequiredFields = { "title", "problem", "solution", "marketGap", "score" };

        public static bool TryParse(string? rawText, out BsonDocument contract, out string error)
        {
            contract = new BsonDocument();
            error = string.Empty;

            if (string.IsNullOrWhiteSpace(rawText))
            {
                error = "Model returned empty output.";
                return false;
            }

            var json = ExtractJsonArray(StripFences(rawText));
            if (json is null)
            {
                error = "No JSON array found in model output.";
                return false;
            }

            BsonArray ideas;
            try
            {
                ideas = BsonArray.Create(BsonDocument.Parse($"{{\"_tmp\":{json}}}").GetElement(0).Value);
            }
            catch (Exception ex)
            {
                error = $"Output was not valid JSON array: {ex.Message}";
                return false;
            }

            if (ideas.Count == 0)
            {
                error = "Output array is empty.";
                return false;
            }

            var validIdeas = new BsonArray();
            foreach (var ideaVal in ideas)
            {
                if (ideaVal is not BsonDocument idea)
                {
                    error = "Array contains non-object element.";
                    return false;
                }

                foreach (var field in RequiredFields)
                {
                    if (!idea.Contains(field))
                    {
                        error = $"Idea missing required field '{field}'.";
                        return false;
                    }
                }

                if (!idea["score"].IsNumeric)
                {
                    error = "Field 'score' is not a number.";
                    return false;
                }

                var scoreVal = idea["score"].ToDouble();
                var clampedScore = Math.Clamp(Math.Round(scoreVal), 0, 100);
                idea["score"] = clampedScore;

                validIdeas.Add(idea);
            }

            contract = new BsonDocument
            {
                { "ideas", validIdeas },
                { "schemaVersion", 1 }
            };
            return true;
        }

        private static string StripFences(string text)
        {
            var t = text.Trim();
            if (!t.StartsWith("```", StringComparison.Ordinal))
                return t;

            var firstNewline = t.IndexOf('\n');
            if (firstNewline >= 0)
                t = t[(firstNewline + 1)..];

            var closing = t.LastIndexOf("```", StringComparison.Ordinal);
            if (closing >= 0)
                t = t[..closing];

            return t.Trim();
        }

        private static string? ExtractJsonArray(string text)
        {
            var start = text.IndexOf('[');
            if (start < 0)
                return null;

            var depth = 0;
            var inString = false;
            var escaped = false;

            for (var i = start; i < text.Length; i++)
            {
                var c = text[i];

                if (inString)
                {
                    if (escaped) escaped = false;
                    else if (c == '\\') escaped = true;
                    else if (c == '"') inString = false;
                    continue;
                }

                switch (c)
                {
                    case '"': inString = true; break;
                    case '[': depth++; break;
                    case ']':
                        depth--;
                        if (depth == 0)
                            return text[start..(i + 1)];
                        break;
                }
            }

            return null;
        }
    }
}
