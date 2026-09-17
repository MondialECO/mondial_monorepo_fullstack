using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Phase 3.2 Business Model handler (one-shot, single structured JSON completion).
    /// Prepares context from the completed Market Study (authoritative input),
    /// Canonical Idea Core, and Clarified Opportunity.
    /// Parses the resulting JSON into the BusinessModelOutput contract and appends it as
    /// a new immutable version on the <see cref="BusinessModelSession"/>.
    /// </summary>
    public sealed class BusinessModelHandler : IAiTaskHandler
    {
        private const int MaxOutputTokens = 5000;
        private const double Temperature = 0.4;

        private readonly IBusinessModelSessionStore _sessions;
        private readonly IMarketStudySessionStore _marketStudies;
        private readonly IClarifierSessionStore _clarifiers;
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly BusinessIdeasRepository _ideas;
        private readonly IAiInsightWriter _insights;
        private readonly ILogger<BusinessModelHandler> _logger;

        public BusinessModelHandler(
            IBusinessModelSessionStore sessions,
            IMarketStudySessionStore marketStudies,
            IClarifierSessionStore clarifiers,
            ICreatorIdeaStore creatorIdeas,
            BusinessIdeasRepository ideas,
            IAiInsightWriter insights,
            ILogger<BusinessModelHandler> logger)
        {
            _sessions = sessions;
            _marketStudies = marketStudies;
            _clarifiers = clarifiers;
            _creatorIdeas = creatorIdeas;
            _ideas = ideas;
            _insights = insights;
            _logger = logger;
        }

        public AiJobType Type => AiJobType.BusinessModel;

        public async Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            var input = request.InputPayload;

            string Field(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsString ? v.AsString.Trim() : string.Empty;

            var marketStudySessionId = Field("marketStudySessionId");
            var clarifierSessionId = Field("clarifierSessionId");
            var businessIdeaId = Field("businessIdeaId");

            var contextLines = new List<string>();

            // Authoritative Market Study input
            var marketStudy = marketStudySessionId.Length > 0
                ? await _marketStudies.GetOwnedAsync(marketStudySessionId, request.OwnerUserId)
                : null;

            var currentMarketStudyVersion = marketStudy?.Versions.FirstOrDefault(v => v.Version == marketStudy.CurrentVersion);
            if (currentMarketStudyVersion?.Content is not null)
            {
                contextLines.Add(
                    "MARKET STUDY (authoritative foundation — link Canvas value propositions & segments directly to this):\n" +
                    currentMarketStudyVersion.Content.ToJson());
            }
            else
            {
                _logger.LogWarning(
                    "BusinessModel request {RequestId} has no usable market study content (marketStudySessionId={StudyId}).",
                    request.Id, marketStudySessionId);
                contextLines.Add("MARKET STUDY: (unavailable — state assumptions for gaps)");
            }

            // Canonical Idea Core
            if (businessIdeaId.Length > 0)
            {
                var creatorIdea = await _creatorIdeas.GetOwnedAsync(businessIdeaId, request.OwnerUserId);
                if (creatorIdea?.Project is not null)
                {
                    contextLines.Add(
                        "CANONICAL IDEA CORE (authoritative source — preserve creator edits):\n" +
                        creatorIdea.Project.ToBsonDocument().ToJson());
                }
            }

            // Supporting Clarifier context
            var clarifier = clarifierSessionId.Length > 0
                ? await _clarifiers.GetOwnedAsync(clarifierSessionId, request.OwnerUserId)
                : null;

            if (clarifier?.Output is not null)
            {
                contextLines.Add(
                    "CLARIFIED OPPORTUNITY (supporting context):\n" +
                    clarifier.Output.ToJson());
            }

            var userContext = string.Join("\n\n", contextLines);

            const string task =
                "Synthesize the Market Study, Idea Core, and opportunity context above into a comprehensive, " +
                "cohesive Business Model. Build the 9 Canvas blocks (with value propositions emphasized and " +
                "market study footnotes on Value Propositions, Customer Segments, and Revenue Streams), " +
                "define revenue tiers with contribution percentages, formulate grounded unit economics " +
                "(ARPU, CAC, LTV, LTV:CAC, payback period in months) with isModelled flags, and categorize " +
                "assumptions by evidence level (evidenced, modelled, untested). Follow the output contract schema exactly. " +
                "Return only the JSON object.";

            return new AiHandlerRequest(
                PromptKey: PromptTemplate.BusinessModel.Key,
                TaskType: "BusinessModel",
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

            if (!BusinessModelOutputParser.TryParse(completion.Text, out var contract, out var parseError))
            {
                _logger.LogWarning("BusinessModel output for request {RequestId} could not be parsed: {Error}",
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
                    Type = AiJobType.BusinessModel.ToString(),
                    Payload = contract,
                    SourceRequestId = request.Id,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                _logger.LogWarning("BusinessModel request {RequestId} had no sessionId; skipped session/insight writes.",
                    request.Id);
            }

            return new AiHandlerResult(OutputPayload: contract);
        }
    }

    public static class BusinessModelOutputParser
    {
        private static readonly string[] RequiredFields =
        {
            "canvas", "revenueTiers", "unitEconomics", "assumptions"
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
