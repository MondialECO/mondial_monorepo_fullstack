using Microsoft.Extensions.Options;
using MongoDB.Bson;
using WebApp.Configuration.AiOptions;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// C-4 Forecast handler (one-shot, single structured JSON completion).
    /// <see cref="PrepareAsync"/> loads the referenced <see cref="BusinessPlanSession"/>
    /// and Step 3.2 <see cref="BusinessModelSession"/> as authoritative commercial context.
    /// <see cref="InterpretAsync"/> parses the model's JSON into the locked
    /// seven-field ForecastOutput contract and appends it as a new immutable version
    /// on the <see cref="ForecastSession"/> (history is never overwritten).
    /// </summary>
    public sealed class ForecastHandler : IAiTaskHandler
    {
        public const int DefaultMaxOutputTokens = 8000;
        private const double Temperature = 0.3;

        private readonly IForecastSessionStore _sessions;
        private readonly IBusinessPlanSessionStore _businessPlans;
        private readonly IBusinessModelSessionStore? _businessModels;
        private readonly ICreatorIdeaStore? _creatorIdeas;
        private readonly IAiInsightWriter _insights;
        private readonly AiSettings _settings;
        private readonly ILogger<ForecastHandler> _logger;

        public ForecastHandler(
            IForecastSessionStore sessions,
            IBusinessPlanSessionStore businessPlans,
            IAiInsightWriter insights,
            ILogger<ForecastHandler> logger,
            IOptions<AiSettings>? aiSettings = null,
            IBusinessModelSessionStore? businessModels = null,
            ICreatorIdeaStore? creatorIdeas = null)
        {
            _sessions = sessions;
            _businessPlans = businessPlans;
            _insights = insights;
            _settings = aiSettings?.Value ?? new AiSettings();
            _logger = logger;
            _businessModels = businessModels;
            _creatorIdeas = creatorIdeas;
        }

        public AiJobType Type => AiJobType.Forecast;

        public async Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            var input = request.InputPayload;

            string Field(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsString ? v.AsString.Trim() : string.Empty;
            double? Num(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsNumeric ? v.ToDouble() : (double?)null;

            var startingBudget = Num("startingBudget");
            var launchSubs = Num("launchSubscribers");
            var varCost = Num("variableCost");
            var arpu = Num("arpu");
            var opex = Num("opex");
            var growth = Num("monthlyGrowthPct");
            var tam = Num("tam");
            var churn = Num("monthlyChurnPct");

            var businessPlanSessionId = Field("businessPlanSessionId");
            var businessIdeaId = Field("businessIdeaId");
            var businessModelSessionId = Field("businessModelSessionId");

            var contextLines = new List<string>();

            // Step 3.2 Business Model Canvas context (pricing tiers, unit economics, revenue streams)
            BusinessModelSession? businessModel = null;
            if (!string.IsNullOrEmpty(businessModelSessionId) && _businessModels != null)
            {
                businessModel = await _businessModels.GetOwnedAsync(businessModelSessionId, request.OwnerUserId);
            }
            else if (!string.IsNullOrEmpty(businessIdeaId) && _creatorIdeas != null && _businessModels != null)
            {
                var creatorIdea = await _creatorIdeas.GetOwnedAsync(businessIdeaId, request.OwnerUserId);
                if (!string.IsNullOrEmpty(creatorIdea?.Phase3Data?.BusinessModelSessionId))
                {
                    businessModel = await _businessModels.GetOwnedAsync(creatorIdea.Phase3Data.BusinessModelSessionId, request.OwnerUserId);
                }
            }

            if (businessModel != null)
            {
                var currentBmVersion = businessModel.Versions.FirstOrDefault(v => v.Version == businessModel.CurrentVersion);
                if (currentBmVersion?.Content != null)
                {
                    var bmDoc = currentBmVersion.Content;
                    var bmSummary = new List<string>();
                    if (bmDoc.Contains("revenueTiers"))
                        bmSummary.Add("Pricing & Revenue Tiers: " + bmDoc["revenueTiers"].ToJson());
                    if (bmDoc.Contains("unitEconomics"))
                        bmSummary.Add("Unit Economics: " + bmDoc["unitEconomics"].ToJson());
                    if (bmDoc.Contains("canvas") && bmDoc["canvas"].IsBsonDocument)
                    {
                        var canvas = bmDoc["canvas"].AsBsonDocument;
                        if (canvas.Contains("revenueStreams"))
                            bmSummary.Add("Revenue Streams: " + canvas["revenueStreams"].ToJson());
                        if (canvas.Contains("costStructure"))
                            bmSummary.Add("Cost Structure: " + canvas["costStructure"].ToJson());
                        if (canvas.Contains("customerSegments"))
                            bmSummary.Add("Customer Segments: " + canvas["customerSegments"].ToJson());
                    }

                    if (bmSummary.Count > 0)
                    {
                        contextLines.Add("BUSINESS MODEL (Step 3.2 — authoritative commercial & pricing foundation):\n" + string.Join("\n", bmSummary));
                    }
                }
            }

            // The business plan (revenue model, market analysis from C-3) when available
            var plan = businessPlanSessionId.Length > 0
                ? await _businessPlans.GetOwnedAsync(businessPlanSessionId, request.OwnerUserId)
                : null;
            var planContent = CurrentVersionContent(plan);

            if (planContent is not null)
                contextLines.Add("BUSINESS PLAN (supporting source):\n" + planContent.ToJson());

            var inputLines = new List<string>();
            if (startingBudget.HasValue) inputLines.Add($"Starting Budget / Cash Reserve (€): {startingBudget.Value}");
            if (launchSubs.HasValue) inputLines.Add($"Initial Subscribers / Customers at Launch (Month 1): {launchSubs.Value}");
            if (varCost.HasValue) inputLines.Add($"Variable Cost per subscriber/unit (€): {varCost.Value}");
            if (arpu.HasValue) inputLines.Add($"ARPU (€/month): {arpu.Value}");
            if (opex.HasValue) inputLines.Add($"OPEX (€/month): {opex.Value}");
            if (growth.HasValue) inputLines.Add($"Monthly growth rate (%): {growth.Value}");
            if (tam.HasValue) inputLines.Add($"TAM (€): {tam.Value}");
            if (churn.HasValue) inputLines.Add($"Monthly churn rate (%): {churn.Value}");
            if (inputLines.Count > 0)
                contextLines.Add("FORECAST PARAMETERS (explicit parameters — take priority over baseline assumptions):\n" + string.Join("\n", inputLines));

            if (contextLines.Count == 0)
            {
                _logger.LogWarning("Forecast request {RequestId} has neither business model/plan nor inputs.", request.Id);
                contextLines.Add("CONTEXT: (none provided — state conservative assumptions explicitly).");
            }

            var userContext = string.Join("\n\n", contextLines);

            var task =
                "Produce a compact 12-month financial forecast grounded in the BUSINESS MODEL and BUSINESS PLAN above " +
                "and refined by the FORECAST PARAMETERS (Starting Budget, launch subscribers, variable cost, ARPU, OPEX, monthly growth, TAM, monthly churn), " +
                "following the output contract exactly: 12 consecutive monthly periods, " +
                "numeric monthly arrays, no funding ask. " +
                (startingBudget.HasValue ? $"In cashFlowProjection, Month 1 endingBalance MUST equal the Starting Budget (€{startingBudget.Value}) plus Month 1 netCashFlow, and subsequent months accumulate netCashFlow. " : "") +
                "Keep summaries, notes, and narrative concise. State driving assumptions. " +
                "Return only the JSON object.";

            var maxTokens = _settings.OutputTokenLimits.TryGetValue("Forecast", out var limit) && limit > 0
                ? limit
                : DefaultMaxOutputTokens;

            return new AiHandlerRequest(
                PromptKey: PromptTemplate.Forecast.Key,
                TaskType: "Forecast",
                UserContext: userContext,
                Task: task,
                MaxTokens: maxTokens,
                Temperature: Temperature,
                ResponseFormat: "json_object");
        }

        public async Task<AiHandlerResult> InterpretAsync(AiRequest request, AiCompletion completion, CancellationToken cancellationToken = default)
        {
            var sessionId = request.InputPayload != null
                            && request.InputPayload.TryGetValue("sessionId", out var sid) && sid.IsString
                ? sid.AsString
                : null;

            if (!ForecastOutputParser.TryParse(completion.Text, out var contract, out var parseError))
            {
                var failureReason = string.Equals(completion.FinishReason, "length", StringComparison.OrdinalIgnoreCase)
                    ? "AI output was truncated before the forecast JSON completed."
                    : parseError;

                _logger.LogWarning("Forecast output for request {RequestId} could not be parsed: {Error} (FinishReason: {FinishReason})",
                    request.Id, failureReason, completion.FinishReason);

                if (sessionId != null)
                    await _sessions.SetNeedsReviewAsync(sessionId, failureReason);

                // Do NOT throw: the job completes, raw text stays on the response.
                return new AiHandlerResult(OutputPayload: null);
            }

            // Enforce deterministic 36-month financial forecast calculations via FinancialForecastEngine.
            // Anchors to the founder's effective inputs and business archetype semantics.
            var forecastInputs = ExtractForecastInputs(request.InputPayload, contract);
            contract = FinancialForecastEngine.BuildForecastContract(forecastInputs, contract);

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

        private static ForecastInputs ExtractForecastInputs(BsonDocument? input, BsonDocument? contract)
        {
            var fi = new ForecastInputs();
            if (input != null)
            {
                double? Num(string key) =>
                    input.TryGetValue(key, out var v) && v.IsNumeric ? v.ToDouble() : (double?)null;

                fi.StartingBudget = Num("startingBudget");
                fi.LaunchSubscribers = Num("launchSubscribers");
                fi.VariableCost = Num("variableCost");
                fi.Arpu = Num("arpu");
                fi.Opex = Num("opex");
                fi.MonthlyGrowthPct = Num("monthlyGrowthPct");
                fi.MonthlyChurnPct = Num("monthlyChurnPct");
                fi.Tam = Num("tam");
                fi.AverageOrderValue = Num("averageOrderValue");
                fi.TakeRatePct = Num("takeRatePct");
                fi.TaxRatePct = Num("taxRatePct");

                if (input.TryGetValue("businessModelType", out var bmt) && bmt.IsString)
                {
                    fi.BusinessModelType = bmt.AsString;
                }

                if (input.TryGetValue("activeDrivers", out var ad) && ad.IsBsonDocument)
                {
                    fi.ActiveDrivers = new Dictionary<string, bool>();
                    foreach (var elem in ad.AsBsonDocument.Elements)
                    {
                        if (elem.Value.IsBoolean)
                            fi.ActiveDrivers[elem.Name] = elem.Value.AsBoolean;
                    }
                }
            }

            if (!fi.Arpu.HasValue && !fi.LaunchSubscribers.HasValue && contract != null)
            {
                var revM = MonthlyArray(contract, "revenueForecast");
                var costM = MonthlyArray(contract, "costForecast");
                var cashM = MonthlyArray(contract, "cashFlowProjection");
                if (revM != null && revM.Count > 0)
                {
                    double m1Rev = Num(revM[0].AsBsonDocument, "amount");
                    double m1Vc = costM != null && costM.Count > 0 ? Num(costM[0].AsBsonDocument, "variableCosts") : 0;
                    double m1Fc = costM != null && costM.Count > 0 ? Num(costM[0].AsBsonDocument, "fixedCosts") : 0;
                    double m1Eb = cashM != null && cashM.Count > 0 ? Num(cashM[0].AsBsonDocument, "endingBalance") : 0;

                    fi.LaunchSubscribers = m1Rev > 0 ? 100 : 0;
                    fi.Arpu = m1Rev > 0 ? (m1Rev / 100.0) : 0;
                    fi.VariableCost = m1Rev > 0 ? (m1Vc / 100.0) : 0;
                    if (!fi.Opex.HasValue && m1Fc > 0) fi.Opex = m1Fc;
                    if (!fi.StartingBudget.HasValue && m1Eb > 0) fi.StartingBudget = m1Eb;
                }
            }

            return fi;
        }

        private static BsonArray? MonthlyArray(BsonDocument contract, string section)
        {
            if (contract.Contains(section) && contract[section].IsBsonDocument)
            {
                var s = contract[section].AsBsonDocument;
                if (s.Contains("monthly") && s["monthly"].IsBsonArray) return s["monthly"].AsBsonArray;
            }
            return null;
        }

        private static double Num(BsonDocument doc, string key) =>
            doc.Contains(key) && doc[key].IsNumeric ? doc[key].ToDouble() : 0;

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
