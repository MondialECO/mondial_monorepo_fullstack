using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
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

            var sectors = input?.TryGetValue("sectors", out var sv) == true && sv.IsBsonArray
                ? string.Join(", ", sv.AsBsonArray.Select(e => e.AsString))
                : "";
            var problem = input?.TryGetValue("observedProblem", out var pv) == true && pv.IsString
                ? pv.AsString.Trim()
                : "";
            var strengths = input?.TryGetValue("strengths", out var stv) == true && stv.IsBsonArray
                ? string.Join(", ", stv.AsBsonArray.Select(e => e.AsString))
                : "";

            var contextLines = new List<string>();
            if (!string.IsNullOrEmpty(sectors)) contextLines.Add($"Market sectors: {sectors}");
            if (!string.IsNullOrEmpty(problem)) contextLines.Add($"Observed problem: {problem}");
            if (!string.IsNullOrEmpty(strengths)) contextLines.Add($"Core strengths: {strengths}");

            var userContext = contextLines.Count > 0
                ? string.Join("\n", contextLines)
                : "(no input provided)";

            const string task =
                "Generate exactly 3 distinct venture concepts optimized for market viability. " +
                "Return ONLY a JSON array with objects: { title, problem, solution, marketGap, " +
                "score (0-100), tam, saturation (Low/Medium/High), similarTo, targetUser, founderEdge }. " +
                "No markdown, no code fences, no commentary.";

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

            if (!IdeaGeneratorOutputParser.TryParse(completion.Text, out var output, out var parseError))
            {
                _logger.LogWarning("IdeaGenerator output for request {RequestId} could not be parsed: {Error}",
                    request.Id, parseError);

                if (sessionId != null)
                    await _sessions.SetNeedsReviewAsync(sessionId, parseError, cancellationToken);

                return new AiHandlerResult(OutputPayload: null);
            }

            if (sessionId != null)
            {
                await _sessions.SetCompletedAsync(sessionId, output, cancellationToken);

                await _insights.WriteAsync(new AiInsight
                {
                    OwnerUserId = request.OwnerUserId,
                    Type = AiJobType.IdeaGenerator.ToString(),
                    Payload = BsonDocument.Parse(System.Text.Json.JsonSerializer.Serialize(output)),
                    SourceRequestId = request.Id,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                _logger.LogWarning("IdeaGenerator request {RequestId} had no sessionId; skipped session/insight writes.", request.Id);
            }

            return new AiHandlerResult(OutputPayload: null);
        }
    }

    internal static class IdeaGeneratorOutputParser
    {
        public static bool TryParse(string? rawText, out IdeaGenerationOutput output, out string error)
        {
            output = new IdeaGenerationOutput();
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

            if (ideas.Count < 1)
            {
                error = "Output array is empty.";
                return false;
            }

            var parsedIdeas = new List<GeneratedIdea>();
            foreach (var ideaVal in ideas)
            {
                if (ideaVal is not BsonDocument idea)
                    continue; // skip stray non-object elements rather than failing the whole run

                // Lenient field extraction — small models (llama-3.1-8b) drop fields or
                // vary key casing. Default missing text; derive a neutral score when absent.
                var title = Str(idea, "title", "name");
                var problem = Str(idea, "problem", "coreProblem");
                var solution = Str(idea, "solution", "proposedSolution");
                var marketGap = Str(idea, "marketGap", "gap", "opportunity");

                // An idea with no substantive content at all is unusable — skip it.
                if (string.IsNullOrWhiteSpace(title) &&
                    string.IsNullOrWhiteSpace(problem) &&
                    string.IsNullOrWhiteSpace(solution))
                {
                    continue;
                }

                double scoreVal = 70; // neutral default when missing/non-numeric
                if (idea.Contains("score") && idea["score"].IsNumeric)
                    scoreVal = idea["score"].ToDouble(); // CRITICAL: .ToDouble() not .AsDouble()
                var clampedScore = Math.Clamp(Math.Round(scoreVal), 0, 100);

                parsedIdeas.Add(new GeneratedIdea
                {
                    Title = string.IsNullOrWhiteSpace(title) ? "Untitled concept" : title,
                    Problem = problem,
                    Solution = solution,
                    MarketGap = marketGap,
                    Score = clampedScore,
                    Tam = Str(idea, "tam", "marketSize", "TAM"),
                    Saturation = Str(idea, "saturation", "competitorSaturation"),
                    SimilarTo = Str(idea, "similarTo", "comparable", "similarCompany"),
                    TargetUser = Str(idea, "targetUser", "targetCustomer", "audience"),
                    FounderEdge = Str(idea, "founderEdge", "creatorEdge", "advantage")
                });
            }

            if (parsedIdeas.Count < 1)
            {
                error = "No usable ideas parsed from model output.";
                return false;
            }

            output.Ideas = parsedIdeas.ToArray();
            output.SchemaVersion = 1;
            return true;
        }

        // Returns the first present, non-empty string value among the candidate keys; "" otherwise.
        private static string Str(BsonDocument doc, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (doc.Contains(key) && doc[key].IsString)
                {
                    var v = doc[key].AsString;
                    if (!string.IsNullOrWhiteSpace(v)) return v.Trim();
                }
            }
            return string.Empty;
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
