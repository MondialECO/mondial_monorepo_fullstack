using Microsoft.Extensions.Options;
using MongoDB.Bson;
using WebApp.Configuration.AiOptions;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// C-2 Idea Clarifier handler (one-shot). <see cref="PrepareAsync"/> turns the
    /// request's stored raw idea into the prompt's User Context / Task layers;
    /// <see cref="InterpretAsync"/> parses the model's JSON into the locked
    /// ClarifierOutput contract, then writes the user-facing side of C-2 — the
    /// <see cref="ClarifierSession"/> (source of truth) and an <see cref="AiInsight"/>.
    /// The generic runner still persists raw text + OutputPayload on AIResponses;
    /// this handler adds the module-owned writes. A parse/validation failure is
    /// NOT thrown: the session is marked NeedsReview (raw text preserved on the
    /// response) and the job completes normally.
    /// </summary>
    public sealed class IdeaClarifierHandler : IAiTaskHandler
    {
        public const int DefaultMaxOutputTokens = 3500;
        private const double Temperature = 0.3;

        private readonly IClarifierSessionStore _sessions;
        private readonly IAiInsightWriter _insights;
        private readonly AiSettings _settings;
        private readonly ILogger<IdeaClarifierHandler> _logger;

        public IdeaClarifierHandler(
            IClarifierSessionStore sessions,
            IAiInsightWriter insights,
            ILogger<IdeaClarifierHandler> logger,
            IOptions<AiSettings>? aiSettings = null)
        {
            _sessions = sessions;
            _insights = insights;
            _settings = aiSettings?.Value ?? new AiSettings();
            _logger = logger;
        }

        public AiJobType Type => AiJobType.IdeaClarifier;

        /// <summary>Raw-idea input keys that may be flagged unconfirmed.</summary>
        public static readonly HashSet<string> RawIdeaFields = new()
        {
            "problemStatement", "targetAudience", "description", "existingAlternatives",
            "whyNow", "riskiestAssumption", "founderAdvantage",
        };

        private static List<string> UnconfirmedFields(BsonDocument? input) =>
            input != null && input.TryGetValue("unconfirmedFields", out var v) && v.IsBsonArray
                ? v.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).Where(RawIdeaFields.Contains).Distinct().ToList()
                : new List<string>();

        public Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            var input = request.InputPayload;

            string Field(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsString ? v.AsString.Trim() : string.Empty;

            // Extract language from input (passed from Phase 2)
            var language = Field("language");
            if (string.IsNullOrWhiteSpace(language)) language = "en";

            var title = Field("title");
            var problem = Field("problemStatement");
            var audience = Field("targetAudience");
            var description = Field("description");
            var alternatives = Field("existingAlternatives");
            var whyNow = Field("whyNow");
            var riskiestAssumption = Field("riskiestAssumption");
            var founderAdvantage = Field("founderAdvantage");
            var unconfirmed = UnconfirmedFields(input);
            string Thin(string key) => unconfirmed.Contains(key) ? " [THIN ANSWER — unconfirmed; treat as an assumption, not a fact]" : "";

            // User Context layer: the raw idea, labelled. Task layer: the instruction.
            var contextLines = new List<string>();
            if (title.Length > 0) contextLines.Add($"Idea title: {title}");
            if (problem.Length > 0) contextLines.Add($"Problem statement: {problem}{Thin("problemStatement")}");
            if (audience.Length > 0) contextLines.Add($"Target audience: {audience}{Thin("targetAudience")}");
            if (description.Length > 0) contextLines.Add($"Description: {description}{Thin("description")}");
            if (alternatives.Length > 0) contextLines.Add($"Existing alternatives the founder is aware of: {alternatives}{Thin("existingAlternatives")}");
            if (whyNow.Length > 0) contextLines.Add($"Why now (founder supplied): {whyNow}{Thin("whyNow")}");
            if (riskiestAssumption.Length > 0) contextLines.Add($"Riskiest assumption (founder supplied): {riskiestAssumption}{Thin("riskiestAssumption")}");
            if (founderAdvantage.Length > 0) contextLines.Add($"Founder advantage (founder supplied): {founderAdvantage}{Thin("founderAdvantage")}");

            var userContext = contextLines.Count > 0
                ? string.Join("\n", contextLines)
                : "(no idea details were provided)";

            var languageInstruction = language.ToLowerInvariant() switch
            {
                "fr" => "Generate all output in French.",
                "en" => "Generate all output in English.",
                _ => $"Generate all output in the language code: {language}."
            };

            var task =
                "Clarify the business idea above into the structured opportunity " +
                "defined by the output contract. " +
                (unconfirmed.Count > 0
                    ? "Inputs marked [THIN ANSWER] are unconfirmed: do not present them as established facts; phrase anything built on them as an assumption to validate. "
                    : "") +
                languageInstruction + " " +
                "Return only the JSON object.";

            var maxTokens = _settings.OutputTokenLimits.TryGetValue("IdeaClarifier", out var limit) && limit > 0
                ? limit
                : DefaultMaxOutputTokens;

            return Task.FromResult(new AiHandlerRequest(
                PromptKey: PromptTemplate.IdeaClarifier.Key,
                TaskType: "IdeaClarifier",
                UserContext: userContext,
                Task: task,
                MaxTokens: maxTokens,
                Temperature: Temperature,
                ResponseFormat: "json_object"));
        }

        public async Task<AiHandlerResult> InterpretAsync(AiRequest request, AiCompletion completion, CancellationToken cancellationToken = default)
        {
            var sessionId = request.InputPayload != null
                            && request.InputPayload.TryGetValue("sessionId", out var sid) && sid.IsString
                ? sid.AsString
                : null;

            if (!ClarifierOutputParser.TryParse(completion.Text, out var contract, out var parseError))
            {
                _logger.LogWarning("IdeaClarifier output for request {RequestId} could not be parsed: {Error}",
                    request.Id, parseError);

                if (sessionId != null)
                    await _sessions.SetNeedsReviewAsync(sessionId, parseError);

                // Do NOT throw: the job completes, raw text stays on the response.
                return new AiHandlerResult(OutputPayload: null);
            }

            // Weak clarifier topics stay flagged in the stored output, which Phase 3 reads as its baseline.
            var unconfirmed = UnconfirmedFields(request.InputPayload);
            if (unconfirmed.Count > 0)
            {
                contract["unconfirmedInputs"] = new BsonArray(unconfirmed);
                contract["unconfirmedInputsNote"] =
                    "The founder's answers for these inputs were thin and never confirmed. Treat anything derived from them as an assumption to validate, not an established fact.";
            }

            var clarityScore = contract.TryGetValue("clarityScore", out var cs) && cs.IsInt32
                ? cs.AsInt32
                : (int?)null;

            if (sessionId != null)
            {
                await _sessions.SetCompletedAsync(sessionId, contract, clarityScore);

                // Reuse AIInsights so the result surfaces in GET /ai/insights.
                await _insights.WriteAsync(new AiInsight
                {
                    OwnerUserId = request.OwnerUserId,
                    Type = AiJobType.IdeaClarifier.ToString(),
                    Payload = contract,
                    SourceRequestId = request.Id,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                _logger.LogWarning("IdeaClarifier request {RequestId} had no sessionId; skipped session/insight writes.",
                    request.Id);
            }

            return new AiHandlerResult(OutputPayload: contract);
        }
    }

    /// <summary>
    /// Tolerant parser for the model's clarifier output: strips markdown/code
    /// fences, extracts the first JSON object, validates the required contract
    /// fields, and clamps <c>clarityScore</c> to 0–100. Produces the
    /// <c>schemaVersion = 1</c> BsonDocument persisted on the session/insight.
    /// </summary>
    internal static class ClarifierOutputParser
    {
        private static readonly string[] RequiredFields =
        {
            "problemDefinition", "targetAudience", "proposedSolution",
            "riskAssessment", "clarityScore",
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

            if (!doc["clarityScore"].IsNumeric)
            {
                if (doc["clarityScore"].IsString && int.TryParse(doc["clarityScore"].AsString, out var parsedScore))
                {
                    doc["clarityScore"] = parsedScore;
                }
                else
                {
                    error = "Field 'clarityScore' is not a number.";
                    return false;
                }
            }

            // Clamp to 0–100 and normalize to an int.
            var clamped = Math.Clamp(doc["clarityScore"].ToInt32(), 0, 100);
            doc["clarityScore"] = clamped;

            // Pin the contract version regardless of what the model emitted.
            doc["schemaVersion"] = ClarifierOutputDto.CurrentSchemaVersion;

            contract = doc;
            return true;
        }

        /// <summary>Removes a leading/trailing ```json … ``` (or bare ```) fence if present.</summary>
        internal static string StripFences(string text)
        {
            var t = text.Trim();
            var fenceStart = t.IndexOf("```", StringComparison.Ordinal);
            if (fenceStart >= 0)
            {
                var newlineAfterFence = t.IndexOf('\n', fenceStart);
                if (newlineAfterFence >= 0)
                {
                    var contentStart = newlineAfterFence + 1;
                    var fenceEnd = t.LastIndexOf("```", StringComparison.Ordinal);
                    if (fenceEnd > contentStart)
                    {
                        return t[contentStart..fenceEnd].Trim();
                    }
                    return t[contentStart..].Trim();
                }
            }
            return t;
        }

        /// <summary>Extracts the first balanced top-level JSON object, ignoring braces inside strings.</summary>
        internal static string? ExtractJsonObject(string text)
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

                switch (c)
                {
                    case '"': inString = true; break;
                    case '{': depth++; break;
                    case '}':
                        depth--;
                        if (depth == 0)
                            return text[start..(i + 1)];
                        break;
                }
            }

            return null; // unbalanced
        }
    }
}
