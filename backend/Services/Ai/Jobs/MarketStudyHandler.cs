using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Phase 3.1 Market Study handler (one-shot, single structured JSON completion).
    /// Prepares context from the Clarifier opportunity, CreatorIdea Project Core, and
    /// sector benchmarks via <see cref="IMarketBenchmarkResolver"/>.
    /// Parses the resulting JSON into the MarketStudyOutput contract and appends it as
    /// a new immutable version on the <see cref="MarketStudySession"/>.
    /// </summary>
    public sealed class MarketStudyHandler : IAiTaskHandler
    {
        private const int MaxOutputTokens = 5000;
        private const double Temperature = 0.4;

        private readonly IMarketStudySessionStore _sessions;
        private readonly IClarifierSessionStore _clarifiers;
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly BusinessIdeasRepository _ideas;
        private readonly IMarketBenchmarkResolver _benchmarks;
        private readonly IAiInsightWriter _insights;
        private readonly ILogger<MarketStudyHandler> _logger;

        public MarketStudyHandler(
            IMarketStudySessionStore sessions,
            IClarifierSessionStore clarifiers,
            ICreatorIdeaStore creatorIdeas,
            BusinessIdeasRepository ideas,
            IMarketBenchmarkResolver benchmarks,
            IAiInsightWriter insights,
            ILogger<MarketStudyHandler> logger)
        {
            _sessions = sessions;
            _clarifiers = clarifiers;
            _creatorIdeas = creatorIdeas;
            _ideas = ideas;
            _benchmarks = benchmarks;
            _insights = insights;
            _logger = logger;
        }

        public AiJobType Type => AiJobType.MarketStudy;

        public async Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            var input = request.InputPayload;

            string Field(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsString ? v.AsString.Trim() : string.Empty;

            var clarifierSessionId = Field("clarifierSessionId");
            var businessIdeaId = Field("businessIdeaId");

            var contextLines = new List<string>();
            string? detectedSector = null;

            if (businessIdeaId.Length > 0)
            {
                var creatorIdea = await _creatorIdeas.GetOwnedAsync(businessIdeaId, request.OwnerUserId);
                if (creatorIdea?.Project is not null)
                {
                    contextLines.Add(
                        "CANONICAL IDEA CORE (authoritative source — preserve creator edits):\n" +
                        creatorIdea.Project.ToBsonDocument().ToJson());
                    detectedSector = creatorIdea.Project.Sector;
                }
            }

            var clarifier = clarifierSessionId.Length > 0
                ? await _clarifiers.GetOwnedAsync(clarifierSessionId, request.OwnerUserId)
                : null;

            if (clarifier?.Output is not null)
            {
                contextLines.Add(
                    "CLARIFIED OPPORTUNITY (authoritative baseline):\n" +
                    clarifier.Output.ToJson());
            }
            else
            {
                _logger.LogWarning(
                    "MarketStudy request {RequestId} has no usable clarifier output (clarifierSessionId={ClarifierId}).",
                    request.Id, clarifierSessionId);
                contextLines.Add("CLARIFIED OPPORTUNITY: (unavailable — state assumptions for gaps)");
            }

            // Benchmark resolution
            var benchmarkRes = await _benchmarks.ResolveAsync(detectedSector);
            if (benchmarkRes?.Benchmark != null)
            {
                var bmDoc = new BsonDocument
                {
                    ["requestedSector"] = benchmarkRes.RequestedSector,
                    ["resolvedSector"] = benchmarkRes.ResolvedBenchmarkSector,
                    ["matchType"] = benchmarkRes.MatchType,
                    ["benchmarkData"] = benchmarkRes.Benchmark.ToBsonDocument()
                };
                contextLines.Add("SECTOR MARKET BENCHMARKS (reference guide):\n" + bmDoc.ToJson());
            }

            var userContext = string.Join("\n\n", contextLines);

            const string task =
                "Analyze the opportunity and benchmark data provided above to produce a complete, " +
                "data-grounded Market Study. Derive TAM, SAM, and SOM with realistic arithmetic, " +
                "break down the competitor landscape with market shares and exploitable gaps, " +
                "list demand signals, evaluate sizing risks, and validate the market gap. " +
                "Follow the output contract schema exactly. Return only the JSON object.";

            return new AiHandlerRequest(
                PromptKey: PromptTemplate.MarketStudy.Key,
                TaskType: "MarketStudy",
                UserContext: userContext,
                Task: task,
                MaxTokens: MaxOutputTokens,
                Temperature: Temperature,
                ResponseFormat: "json_object");
        }

        public async Task<AiHandlerResult> InterpretAsync(AiRequest request, AiCompletion completion, CancellationToken cancellationToken = default)
        {
            var sessionId = request.InputPayload != null
                            && request.InputPayload.TryGetValue("sessionId", out var sid) && sid.IsString
                ? sid.AsString
                : null;

            if (!MarketStudyOutputParser.TryParse(completion.Text, out var contract, out var parseError))
            {
                _logger.LogWarning("MarketStudy output for request {RequestId} could not be parsed: {Error}",
                    request.Id, parseError);

                if (sessionId != null)
                    await _sessions.SetNeedsReviewAsync(sessionId, parseError);

                return new AiHandlerResult(OutputPayload: null);
            }

            if (sessionId != null)
            {
                await _sessions.AppendGeneratedVersionAsync(sessionId, contract, request.Id);

                await _insights.WriteAsync(new AiInsight
                {
                    OwnerUserId = request.OwnerUserId,
                    Type = AiJobType.MarketStudy.ToString(),
                    Payload = contract,
                    SourceRequestId = request.Id,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                _logger.LogWarning("MarketStudy request {RequestId} had no sessionId; skipped session/insight writes.",
                    request.Id);
            }

            return new AiHandlerResult(OutputPayload: contract);
        }
    }

    public static class MarketStudyOutputParser
    {
        private static readonly string[] RequiredFields =
        {
            "marketSizing", "competitorLandscape", "demandSignals", "sizingRisks", "marketGapValidation"
        };

        public static bool TryParse(string? rawText, out BsonDocument contract, out string error)
        {
            contract = new BsonDocument();
            error = string.Empty;

            if (string.IsNullOrWhiteSpace(rawText))
            {
                error = "Model returned empty output.";
                return false;
            }

            var json = ExtractJsonObject(StripFences(rawText));
            if (json is null)
            {
                error = "No JSON object found in model output.";
                return false;
            }

            BsonDocument doc;
            try
            {
                doc = BsonDocument.Parse(json);
            }
            catch (Exception ex)
            {
                error = $"Output was not valid JSON: {ex.Message}";
                return false;
            }

            foreach (var field in RequiredFields)
            {
                if (!doc.Contains(field))
                {
                    error = $"Output is missing required field '{field}'.";
                    return false;
                }
            }

            doc["schemaVersion"] = 1;
            contract = doc;
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

        private static string? ExtractJsonObject(string text)
        {
            var start = text.IndexOf('{');
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

                if (c == '"')
                {
                    inString = true;
                    continue;
                }

                if (c == '{')
                {
                    depth++;
                }
                else if (c == '}')
                {
                    depth--;
                    if (depth == 0)
                        return text[start..(i + 1)];
                }
            }

            return null;
        }
    }
}
