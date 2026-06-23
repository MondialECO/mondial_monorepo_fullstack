using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// C-4 Forecast handler (one-shot, single structured JSON completion).
    /// <see cref="PrepareAsync"/> loads the referenced <see cref="BusinessPlanSession"/>
    /// — owner-scoped and Completed — and uses its <b>current version's editable
    /// Content</b> (NOT the immutable GeneratedContent) as the sole authoritative
    /// input, turning it into the prompt's User Context / Task layers.
    /// <see cref="InterpretAsync"/> parses the model's JSON into the locked
    /// seven-field ForecastOutput contract and appends it as a new immutable version
    /// on the <see cref="ForecastSession"/> (history is never overwritten), then
    /// writes an <see cref="AiInsight"/>. A parse/validation failure is NOT thrown:
    /// the session is marked NeedsReview (raw text preserved on the response) and the
    /// job completes normally — mirroring <see cref="BusinessPlanHandler"/>.
    /// </summary>
    public sealed class ForecastHandler : IAiTaskHandler
    {
        private const int MaxOutputTokens = 3800;
        private const double Temperature = 0.3;

        private readonly IForecastSessionStore _sessions;
        private readonly IBusinessPlanSessionStore _businessPlans;
        private readonly IAiInsightWriter _insights;
        private readonly ILogger<ForecastHandler> _logger;

        public ForecastHandler(
            IForecastSessionStore sessions,
            IBusinessPlanSessionStore businessPlans,
            IAiInsightWriter insights,
            ILogger<ForecastHandler> logger)
        {
            _sessions = sessions;
            _businessPlans = businessPlans;
            _insights = insights;
            _logger = logger;
        }

        public AiJobType Type => AiJobType.Forecast;

        public async Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            var input = request.InputPayload;

            string Field(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsString ? v.AsString.Trim() : string.Empty;
            double? Num(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsNumeric ? v.ToDouble() : (double?)null;

            // The business plan (revenue model, market analysis from C-3) is the
            // AUTHORITATIVE context again (forecast follows the plan in the new order).
            // The numeric inputs (ARPU/OPEX/growth/TAM) are explicit supporting parameters.
            var arpu = Num("arpu");
            var opex = Num("opex");
            var growth = Num("monthlyGrowthPct");
            var tam = Num("tam");

            var businessPlanSessionId = Field("businessPlanSessionId");
            var plan = businessPlanSessionId.Length > 0
                ? await _businessPlans.GetOwnedAsync(businessPlanSessionId, request.OwnerUserId)
                : null;
            var planContent = CurrentVersionContent(plan);

            var contextLines = new List<string>();
            if (planContent is not null)
                contextLines.Add("BUSINESS PLAN (authoritative source — base the forecast on this):\n" + planContent.ToJson());

            var inputLines = new List<string>();
            if (arpu.HasValue) inputLines.Add($"ARPU (€/month): {arpu.Value}");
            if (opex.HasValue) inputLines.Add($"OPEX (€/month): {opex.Value}");
            if (growth.HasValue) inputLines.Add($"Monthly growth rate (%): {growth.Value}");
            if (tam.HasValue) inputLines.Add($"TAM (€): {tam.Value}");
            if (inputLines.Count > 0)
                contextLines.Add("FORECAST PARAMETERS (supporting figures):\n" + string.Join("\n", inputLines));

            if (contextLines.Count == 0)
            {
                _logger.LogWarning("Forecast request {RequestId} has neither a business plan nor inputs.", request.Id);
                contextLines.Add("CONTEXT: (none provided — state conservative assumptions explicitly).");
            }

            var userContext = string.Join("\n\n", contextLines);

            const string task =
                "Produce a 12-month financial forecast grounded in the BUSINESS PLAN above " +
                "and refined by the FORECAST PARAMETERS (ARPU, OPEX, monthly growth, TAM), " +
                "following the output contract exactly: 12 consecutive monthly periods, " +
                "numeric monthly arrays, no funding ask. State every assumption. " +
                "Return only the JSON object.";

            return new AiHandlerRequest(
                PromptKey: PromptTemplate.Forecast.Key,
                TaskType: "Forecast",
                UserContext: userContext,
                Task: task,
                MaxTokens: MaxOutputTokens,
                Temperature: Temperature);
        }

        public async Task<AiHandlerResult> InterpretAsync(AiRequest request, AiCompletion completion, CancellationToken cancellationToken = default)
        {
            var sessionId = request.InputPayload != null
                            && request.InputPayload.TryGetValue("sessionId", out var sid) && sid.IsString
                ? sid.AsString
                : null;

            if (!ForecastOutputParser.TryParse(completion.Text, out var contract, out var parseError))
            {
                _logger.LogWarning("Forecast output for request {RequestId} could not be parsed: {Error}",
                    request.Id, parseError);

                if (sessionId != null)
                    await _sessions.SetNeedsReviewAsync(sessionId, parseError);

                // Do NOT throw: the job completes, raw text stays on the response.
                return new AiHandlerResult(OutputPayload: null);
            }

            if (sessionId != null)
            {
                // Append-only: preserve all prior versions.
                await _sessions.AppendGeneratedVersionAsync(sessionId, contract, request.Id);

                // Reuse AIInsights so the result surfaces in GET /ai/insights.
                await _insights.WriteAsync(new AiInsight
                {
                    OwnerUserId = request.OwnerUserId,
                    Type = AiJobType.Forecast.ToString(),
                    Payload = contract,
                    SourceRequestId = request.Id,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                _logger.LogWarning("Forecast request {RequestId} had no sessionId; skipped session/insight writes.",
                    request.Id);
            }

            return new AiHandlerResult(OutputPayload: contract);
        }

        /// <summary>
        /// The parent plan's current editable version content (NOT GeneratedContent),
        /// or null when the plan is missing, not Completed, or has no current version.
        /// </summary>
        private static BsonDocument? CurrentVersionContent(BusinessPlanSession? plan)
        {
            if (plan is null || plan.Status != "Completed" || plan.CurrentVersion <= 0)
                return null;

            var current = plan.Versions.FirstOrDefault(v => v.Version == plan.CurrentVersion);
            return current?.Content;
        }
    }

    /// <summary>
    /// Tolerant parser for the model's forecast output: strips markdown/code fences,
    /// extracts the first JSON object, validates the seven required top-level fields,
    /// and pins <c>schemaVersion = 1</c>. Mirrors the business-plan parser; public so
    /// it can be unit-tested directly.
    /// </summary>
    public static class ForecastOutputParser
    {
        private static readonly string[] RequiredFields =
        {
            "revenueForecast", "costForecast", "cashFlowProjection",
            "breakEvenAnalysis", "assumptions", "risks", "advisoryNotice",
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

            // The forecast contract has no funding ask — drop it if the model added one.
            doc.Remove("fundingAsk");

            // Pin the contract version regardless of what the model emitted.
            doc["schemaVersion"] = ForecastOutputDto.CurrentSchemaVersion;

            contract = doc;
            return true;
        }

        /// <summary>Removes a leading/trailing ```json … ``` (or bare ```) fence if present.</summary>
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

        /// <summary>Extracts the first balanced top-level JSON object, ignoring braces inside strings.</summary>
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
