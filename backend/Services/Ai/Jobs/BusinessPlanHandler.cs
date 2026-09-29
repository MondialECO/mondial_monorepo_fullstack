using Microsoft.Extensions.Options;
using MongoDB.Bson;
using WebApp.Configuration.AiOptions;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using WebApp.Models.DatabaseModels.Legal;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// C-3 Business Plan handler (one-shot, single structured JSON completion).
    /// <see cref="PrepareAsync"/> loads the canonical Creator Idea Core and completed
    /// upstream Phase 3 artifacts (Market Study, Business Model, Forecast, Formation, Legal)
    /// as authoritative input, turning them into the prompt's User Context / Task layers.
    /// <see cref="InterpretAsync"/> parses the model's JSON into the BusinessPlanOutput contract.
    /// </summary>
    public sealed class BusinessPlanHandler : IAiTaskHandler
    {
        public const int DefaultMaxOutputTokens = 7500;
        private const double Temperature = 0.4;

        private readonly IBusinessPlanSessionStore _sessions;
        private readonly IClarifierSessionStore _clarifiers;
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly BusinessIdeasRepository _ideas;
        private readonly IAiInsightWriter _insights;
        private readonly AiSettings _settings;
        private readonly ILogger<BusinessPlanHandler> _logger;
        private readonly IMarketStudySessionStore? _marketStudies;
        private readonly IBusinessModelSessionStore? _businessModels;
        private readonly IForecastSessionStore? _forecasts;

        public BusinessPlanHandler(
            IBusinessPlanSessionStore sessions,
            IClarifierSessionStore clarifiers,
            ICreatorIdeaStore creatorIdeas,
            BusinessIdeasRepository ideas,
            IAiInsightWriter insights,
            ILogger<BusinessPlanHandler> logger,
            IOptions<AiSettings>? aiSettings = null,
            IMarketStudySessionStore? marketStudies = null,
            IBusinessModelSessionStore? businessModels = null,
            IForecastSessionStore? forecasts = null)
        {
            _sessions = sessions;
            _clarifiers = clarifiers;
            _creatorIdeas = creatorIdeas;
            _ideas = ideas;
            _insights = insights;
            _settings = aiSettings?.Value ?? new AiSettings();
            _logger = logger;
            _marketStudies = marketStudies;
            _businessModels = businessModels;
            _forecasts = forecasts;
        }

        public AiJobType Type => AiJobType.BusinessPlan;

        public async Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            var input = request.InputPayload;

            string Field(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsString ? v.AsString.Trim() : string.Empty;

            var clarifierSessionId = Field("clarifierSessionId");
            var businessIdeaId = Field("businessIdeaId");

            var contextLines = new List<string>();
            var hasCanonicalIdeaCore = false;
            // Canonical Idea Core takes precedence over the historical Clarifier output.
            // Discovery retains a seeded Clarifier session for compatibility, but no
            // longer needs a separate Business Plan input path.
            if (businessIdeaId.Length > 0)
            {
                var creatorIdea = await _creatorIdeas.GetOwnedAsync(businessIdeaId, request.OwnerUserId);
                if (creatorIdea?.Project is not null)
                {
                    hasCanonicalIdeaCore = true;
                    contextLines.Add(
                        "CANONICAL IDEA CORE (authoritative source — preserve creator edits):\n" +
                        creatorIdea.Project.ToBsonDocument().ToJson());
                }

                var p3 = creatorIdea?.Phase3Data;
                if (p3 != null)
                {
                    // 1. Upstream Step 3.1 Market Study (compact commercial extraction)
                    if (!string.IsNullOrEmpty(p3.MarketStudySessionId) && _marketStudies != null)
                    {
                        var mkt = await _marketStudies.GetOwnedAsync(p3.MarketStudySessionId, request.OwnerUserId);
                        var currentMkt = mkt?.Versions.FirstOrDefault(v => v.Version == mkt.CurrentVersion);
                        if (currentMkt?.Content != null)
                        {
                            var mktDoc = currentMkt.Content;
                            var mktSummary = new List<string>();
                            if (mktDoc.Contains("marketDefinition") && mktDoc["marketDefinition"].IsString)
                                mktSummary.Add("Market Definition: " + mktDoc["marketDefinition"].AsString);
                            if (mktDoc.Contains("marketSizing"))
                                mktSummary.Add("Market Sizing (TAM/SAM/SOM): " + mktDoc["marketSizing"].ToJson());
                            if (mktDoc.Contains("targetSegments"))
                                mktSummary.Add("Target Segments: " + mktDoc["targetSegments"].ToJson());
                            if (mktDoc.Contains("competitors"))
                                mktSummary.Add("Competitors: " + mktDoc["competitors"].ToJson());
                            if (mktDoc.Contains("trends"))
                                mktSummary.Add("Market Trends: " + mktDoc["trends"].ToJson());

                            if (mktSummary.Count > 0)
                                contextLines.Add("MARKET INTELLIGENCE (Step 3.1):\n" + string.Join("\n", mktSummary));
                            else
                                contextLines.Add("MARKET INTELLIGENCE (Step 3.1):\n" + mktDoc.ToJson());
                        }
                    }

                    // 2. Upstream Step 3.2 Business Model Canvas (compact commercial extraction)
                    if (!string.IsNullOrEmpty(p3.BusinessModelSessionId) && _businessModels != null)
                    {
                        var bm = await _businessModels.GetOwnedAsync(p3.BusinessModelSessionId, request.OwnerUserId);
                        var currentBm = bm?.Versions.FirstOrDefault(v => v.Version == bm.CurrentVersion);
                        if (currentBm?.Content != null)
                        {
                            var bmDoc = currentBm.Content;
                            var bmSummary = new List<string>();
                            if (bmDoc.Contains("revenueTiers"))
                                bmSummary.Add("Pricing & Revenue Tiers: " + bmDoc["revenueTiers"].ToJson());
                            if (bmDoc.Contains("unitEconomics"))
                                bmSummary.Add("Unit Economics: " + bmDoc["unitEconomics"].ToJson());
                            if (bmDoc.Contains("canvas") && bmDoc["canvas"].IsBsonDocument)
                            {
                                var canvas = bmDoc["canvas"].AsBsonDocument;
                                if (canvas.Contains("valuePropositions"))
                                    bmSummary.Add("Value Propositions: " + canvas["valuePropositions"].ToJson());
                                if (canvas.Contains("revenueStreams"))
                                    bmSummary.Add("Revenue Streams: " + canvas["revenueStreams"].ToJson());
                                if (canvas.Contains("costStructure"))
                                    bmSummary.Add("Cost Structure: " + canvas["costStructure"].ToJson());
                                if (canvas.Contains("channels"))
                                    bmSummary.Add("Channels: " + canvas["channels"].ToJson());
                            }

                            if (bmSummary.Count > 0)
                                contextLines.Add("BUSINESS MODEL (Step 3.2):\n" + string.Join("\n", bmSummary));
                            else
                                contextLines.Add("BUSINESS MODEL (Step 3.2):\n" + bmDoc.ToJson());
                        }
                    }

                    // 3. Upstream Step 3.3 Financial Forecast (highlights only — do not dump 36-month tables)
                    if (!string.IsNullOrEmpty(p3.ForecastSessionId) && _forecasts != null)
                    {
                        var fc = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, request.OwnerUserId);
                        var currentFc = fc?.Versions.FirstOrDefault(v => v.Version == fc.CurrentVersion);
                        if (currentFc?.Content != null)
                        {
                            var fcDoc = currentFc.Content;
                            var fcSummary = new List<string>();
                            if (fcDoc.Contains("summary") && fcDoc["summary"].IsString)
                                fcSummary.Add("Forecast Summary: " + fcDoc["summary"].AsString);
                            if (fcDoc.Contains("breakEvenAnalysis"))
                                fcSummary.Add("Break-Even: " + fcDoc["breakEvenAnalysis"].ToJson());
                            if (fcDoc.Contains("assumptions"))
                                fcSummary.Add("Key Financial Assumptions: " + fcDoc["assumptions"].ToJson());
                            if (fcSummary.Count > 0)
                                contextLines.Add("FINANCIAL FORECAST HIGHLIGHTS (Step 3.3):\n" + string.Join("\n", fcSummary));
                        }
                    }

                    // 4. Upstream Step 3.5 Formation & Team
                    if (p3.FormationGenerator != null)
                    {
                        var fg = p3.FormationGenerator;
                        var formSummary = new List<string>();
                        if (!string.IsNullOrEmpty(fg.SelectedType ?? fg.RecommendedType))
                            formSummary.Add($"Entity Structure: {fg.SelectedType ?? fg.RecommendedType}");
                        if (fg.YouHave != null && fg.YouHave.Count > 0)
                            formSummary.Add($"Founding Skills: {string.Join(", ", fg.YouHave)}");
                        if (fg.YouNeed != null && fg.YouNeed.Count > 0)
                            formSummary.Add($"Skill Gaps & Roles Needed: {string.Join(", ", fg.YouNeed.Select(n => n.Label))}");
                        if (formSummary.Count > 0)
                            contextLines.Add("COMPANY FORMATION & TEAM ARCHITECTURE (Step 3.5):\n" + string.Join("\n", formSummary));
                    }

                    // 5. Upstream Step 3.4 Legal Assessment summary
                    if (p3.LegalAssessment != null)
                    {
                        contextLines.Add($"LEGAL COMPLIANCE OVERVIEW (Step 3.4):\nPlanning Readiness: {p3.LegalAssessment.PlanningReadinessPct}%. Applicable Requirements: {p3.LegalAssessment.Items?.Count(i => i.EvaluationStatus == ApplicabilityEvaluationStatuses.Applicable) ?? 0}.");
                    }
                }
            }

            var clarifier = clarifierSessionId.Length > 0
                ? await _clarifiers.GetOwnedAsync(clarifierSessionId, request.OwnerUserId)
                : null;

            if (clarifier?.Output is not null)
            {
                contextLines.Add(
                    "CLARIFIER HISTORY (supporting context only — do not override the canonical Idea Core):\n" +
                    clarifier.Output.ToJson());
            }
            else
            {
                _logger.LogWarning(
                    "BusinessPlan request {RequestId} has no usable clarifier output (clarifierSessionId={ClarifierId}).",
                    request.Id, clarifierSessionId);
                contextLines.Add("CLARIFIER HISTORY: (unavailable — use the canonical Idea Core and state assumptions for gaps)");
            }

            // Legacy BusinessIdeas context remains optional supporting context.
            if (businessIdeaId.Length > 0 && !hasCanonicalIdeaCore)
            {
                var idea = await _ideas.GetByIdAsync(businessIdeaId);
                if (idea is not null && idea.CreatorId == request.OwnerUserId)
                {
                    var ideaSummary = BuildIdeaSummary(idea);
                    if (ideaSummary.Length > 0)
                        contextLines.Add("ORIGINAL FOUNDER SUBMISSION (secondary context only):\n" + ideaSummary);
                }
            }

            var userContext = string.Join("\n\n", contextLines);

            var maxTokens = _settings.OutputTokenLimits.TryGetValue("BusinessPlan", out var limit) && limit > 0
                ? limit
                : DefaultMaxOutputTokens;

            // Single-section rewrite (audit P1.8): regenerate ONLY the requested C-3
            // field, with the existing plan as consistency context. InterpretAsync
            // splices just that field back, so the other sections never change.
            var sectionId = Field("sectionId");
            if (sectionId.Length > 0 && BusinessPlanSections.Resolve(sectionId) is { } resolved)
            {
                var sessionId = Field("sessionId");
                var session = sessionId.Length > 0
                    ? await _sessions.GetOwnedAsync(sessionId, request.OwnerUserId)
                    : null;
                var existingPlan = session?.Versions.FirstOrDefault(v => v.Version == session.CurrentVersion)?.Content?.ToJson() ?? "(none)";

                var sectionContext =
                    "EXISTING BUSINESS PLAN (keep every OTHER section unchanged — only the " +
                    $"'{resolved.Field}' section is being rewritten):\n{existingPlan}";
                var singleUserContext = string.Join("\n\n",
                    new[] { userContext, sectionContext }.Where(s => !string.IsNullOrEmpty(s)));

                var singleTask =
                    $"Rewrite ONLY the '{resolved.Field}' section of the business plan above, keeping it " +
                    "consistent with the clarified opportunity and the rest of the plan. Return a JSON " +
                    $"object with exactly one key, \"{resolved.Field}\", whose value matches that " +
                    "section's structure in the existing plan. Do not include any other section.";

                return new AiHandlerRequest(
                    PromptKey: PromptTemplate.BusinessPlan.Key,
                    TaskType: "BusinessPlan",
                    UserContext: singleUserContext,
                    Task: singleTask,
                    MaxTokens: maxTokens,
                    Temperature: Temperature,
                    ResponseFormat: "json_object");
            }

            const string task =
                "Produce a complete, structured business plan JSON object grounded in the canonical Idea Core and completed " +
                "upstream artifacts (Market Study, Business Model Canvas, Financial Forecast, and Formation Architecture) " +
                "above. Preserve creator edits and ensure your output matches the output contract schema exactly with all required sections: " +
                "executiveSummary, problemSolution, marketAnalysis, competitorAnalysis, revenueModel, goToMarket, operationsPlan, and risks. " +
                "Ensure every required section is present, concise, decision-useful, and non-repetitive. Prefer " +
                "compact paragraphs and focused bullet arrays. Return only the JSON object.";

            return new AiHandlerRequest(
                PromptKey: PromptTemplate.BusinessPlan.Key,
                TaskType: "BusinessPlan",
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
            var sectionId = request.InputPayload != null
                            && request.InputPayload.TryGetValue("sectionId", out var secId) && secId.IsString
                ? secId.AsString
                : null;

            // Single-section rewrite: splice ONLY the requested field into a clone of the
            // current plan. Even if the model returns extra sections, only this field is
            // taken — the others are guaranteed byte-for-byte preserved.
            if (sectionId != null && BusinessPlanSections.Resolve(sectionId) is { } resolved)
                return await InterpretSingleSectionAsync(request, completion, sessionId, resolved.Field);

            if (!BusinessPlanOutputParser.TryParse(completion.Text, out var contract, out var parseError))
            {
                _logger.LogWarning("BusinessPlan output for request {RequestId} could not be parsed: {Error}",
                    request.Id, parseError);

                if (sessionId != null)
                    await _sessions.SetNeedsReviewAsync(sessionId, parseError);

                // Do NOT throw: the job completes, raw text stays on the response.
                return new AiHandlerResult(OutputPayload: null);
            }

            if (!contract.Contains("problemSolution"))
            {
                var exec = contract.TryGetValue("executiveSummary", out var exVal) && exVal.IsBsonDocument ? exVal.AsBsonDocument : null;
                var ov = exec?.TryGetValue("overview", out var o) == true && o.IsString ? o.AsString : "";
                var vp = exec?.TryGetValue("valueProposition", out var v) == true && v.IsString ? v.AsString : "";
                contract["problemSolution"] = new BsonDocument
                {
                    ["problem"] = ov,
                    ["solution"] = vp,
                };
            }

            if (sessionId != null)
            {
                // Append-only: preserve all prior versions (locked C-3 decision #5).
                await _sessions.AppendGeneratedVersionAsync(sessionId, contract, request.Id);

                // Reuse AIInsights so the result surfaces in GET /ai/insights.
                await _insights.WriteAsync(new AiInsight
                {
                    OwnerUserId = request.OwnerUserId,
                    Type = AiJobType.BusinessPlan.ToString(),
                    Payload = contract,
                    SourceRequestId = request.Id,
                    CreatedAt = DateTime.UtcNow,
                });
            }
            else
            {
                _logger.LogWarning("BusinessPlan request {RequestId} had no sessionId; skipped session/insight writes.",
                    request.Id);
            }

            return new AiHandlerResult(OutputPayload: contract);
        }

        /// <summary>
        /// Terminal handling for a single-section rewrite: parse just the one field from
        /// the model output, splice it into the current plan via the shared
        /// <see cref="BusinessPlanSections.ReplaceField"/> (source "rewrite" → status
        /// "generated"), and append it as a new immutable version. Other sections and the
        /// cross-module wiring carried in the plan document are preserved untouched.
        /// </summary>
        private async Task<AiHandlerResult> InterpretSingleSectionAsync(
            AiRequest request, AiCompletion completion, string? sessionId, string field)
        {
            if (sessionId is null)
            {
                _logger.LogWarning("BusinessPlan single-section rewrite {RequestId} had no sessionId.", request.Id);
                return new AiHandlerResult(OutputPayload: null);
            }

            var session = await _sessions.GetOwnedAsync(sessionId, request.OwnerUserId);
            var current = session?.Versions.FirstOrDefault(v => v.Version == session.CurrentVersion);
            if (current?.Content is null)
            {
                await _sessions.SetNeedsReviewAsync(sessionId, "No current plan to splice the rewritten section into.");
                return new AiHandlerResult(OutputPayload: null);
            }

            if (!BusinessPlanOutputParser.TryParseField(completion.Text, field, out var newValue, out var fieldError))
            {
                _logger.LogWarning("BusinessPlan single-section rewrite {RequestId} could not parse '{Field}': {Error}",
                    request.Id, field, fieldError);
                await _sessions.SetNeedsReviewAsync(sessionId, fieldError);
                return new AiHandlerResult(OutputPayload: null);
            }

            var spliced = BusinessPlanSections.ReplaceField(current.Content, field, newValue, "rewrite");
            spliced["schemaVersion"] = BusinessPlanOutputDto.CurrentSchemaVersion;

            await _sessions.AppendGeneratedVersionAsync(sessionId, spliced, request.Id);

            await _insights.WriteAsync(new AiInsight
            {
                OwnerUserId = request.OwnerUserId,
                Type = AiJobType.BusinessPlan.ToString(),
                Payload = spliced,
                SourceRequestId = request.Id,
                CreatedAt = DateTime.UtcNow,
            });

            return new AiHandlerResult(OutputPayload: spliced);
        }

        /// <summary>Compact, label-led summary of the founder's idea for secondary context.</summary>
        private static string BuildIdeaSummary(Models.DatabaseModels.BusinessIdeas idea)
        {
            var lines = new List<string>();
            void Add(string label, string? value)
            {
                if (!string.IsNullOrWhiteSpace(value)) lines.Add($"{label}: {value.Trim()}");
            }

            Add("Idea name", idea.Name);
            Add("Problem", idea.Problem?.Description);
            Add("Target audience", idea.Problem?.TargetAudience);
            Add("Existing solutions", idea.Problem?.ExistingSolutions);
            Add("Solution", idea.Solution?.Description);
            Add("Differentiation", idea.Solution?.Differentiation);
            Add("Stage", idea.Solution?.StageLabel);
            Add("Primary customer", idea.Market?.PrimaryCustomer);
            Add("Geography", idea.Market?.Geography);
            Add("Market size", idea.Market?.MarketSize);
            Add("Product/service", idea.BusinessModel?.ProductOrService);
            Add("Pricing", idea.BusinessModel?.Pricing);
            Add("Sales channel", idea.BusinessModel?.SalesChannel);

            return string.Join("\n", lines);
        }
    }

    /// <summary>
    /// Tolerant parser for the model's business-plan output: strips markdown/code
    /// fences, extracts the first JSON object, validates the seven required
    /// top-level sections, and pins <c>schemaVersion = 1</c>. Mirrors the
    /// clarifier's parser; self-contained so it does not couple to C-2 internals.
    /// </summary>
    internal static class BusinessPlanOutputParser
    {
        private static readonly string[] RequiredFields =
        {
            "executiveSummary", "problemSolution", "marketAnalysis", "competitorAnalysis",
            "revenueModel", "goToMarket", "operationsPlan", "risks",
        };

        private static readonly Dictionary<string, string[]> SectionAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["executiveSummary"] = new[] { "executive_summary", "executive", "summary" },
            ["problemSolution"] = new[] { "problem_solution", "problemAndSolution", "problem", "problemsAndSolutions", "problem_and_solution" },
            ["marketAnalysis"] = new[] { "market_analysis", "marketOpportunity", "targetMarket", "market", "marketStudy", "marketOverview", "market_opportunity", "target_market", "market_study" },
            ["competitorAnalysis"] = new[] { "competitor_analysis", "competitiveAnalysis", "competitors", "competition", "competitive_analysis", "competitiveOverview", "competitor_overview" },
            ["revenueModel"] = new[] { "revenue_model", "businessModel", "business_model", "revenueStreams", "monetization", "revenue", "revenue_streams" },
            ["goToMarket"] = new[] { "go_to_market", "gtm", "goToMarketStrategy", "go_to_market_strategy", "marketingStrategy", "marketing_plan", "marketing", "gtmStrategy" },
            ["operationsPlan"] = new[] { "operations_plan", "operations", "operationalPlan", "operational_plan", "executionPlan", "execution_plan", "operating_plan" },
            ["risks"] = new[] { "risk_assessment", "riskAssessment", "risksAndMitigations", "riskAnalysis", "risks_and_mitigations", "risk_mitigation", "risksList" },
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

            // 1. Normalize case and known aliases to canonical keys
            NormalizeSectionKeys(doc);

            // 2. Strictly validate every required section is present
            foreach (var field in RequiredFields)
            {
                if (!doc.Contains(field))
                {
                    error = $"Output is missing required section '{field}'.";
                    return false;
                }
            }

            // 3. Ensure risks is an array
            if (!doc["risks"].IsBsonArray)
            {
                error = "Output section 'risks' must be an array.";
                return false;
            }

            // v1 explicitly excludes a funding ask — drop it if the model added one.
            doc.Remove("fundingAsk");

            // Pin the contract version regardless of what the model emitted.
            doc["schemaVersion"] = BusinessPlanOutputDto.CurrentSchemaVersion;

            contract = doc;
            return true;
        }

        private static void NormalizeSectionKeys(BsonDocument doc)
        {
            var existingNames = doc.Names.ToList();
            foreach (var kvp in SectionAliases)
            {
                var canonicalKey = kvp.Key;
                var aliases = kvp.Value;

                if (!doc.Contains(canonicalKey))
                {
                    var matchName = existingNames.FirstOrDefault(name =>
                        name.Equals(canonicalKey, StringComparison.OrdinalIgnoreCase) ||
                        aliases.Any(a => a.Equals(name, StringComparison.OrdinalIgnoreCase)));

                    if (matchName != null && doc.TryGetValue(matchName, out var val))
                    {
                        doc[canonicalKey] = val;
                        if (!matchName.Equals(canonicalKey, StringComparison.Ordinal))
                        {
                            doc.Remove(matchName);
                            existingNames.Remove(matchName);
                            existingNames.Add(canonicalKey);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Lenient single-field extract for the per-section rewrite path: strips fences,
        /// extracts the first JSON object, and returns the named field's value. Tolerates
        /// a model that wraps the section or emits extra siblings (only <paramref name="field"/>
        /// is taken). If the model returned a bare object that IS the section (no matching
        /// key), that object is used as the section value.
        /// </summary>
        public static bool TryParseField(string? rawText, string field, out BsonValue value, out string error)
        {
            value = BsonNull.Value;
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

            if (doc.TryGetValue(field, out var v))
            {
                value = v;
                return true;
            }

            // Check aliases for the field
            if (SectionAliases.TryGetValue(field, out var aliases))
            {
                foreach (var alias in aliases)
                {
                    if (doc.TryGetValue(alias, out var aliasVal))
                    {
                        value = aliasVal;
                        return true;
                    }
                }
            }

            // Fallback: the model returned the section object directly, without the
            // requested wrapper key. Treat the whole object as the section value.
            if (doc.ElementCount > 0)
            {
                value = doc;
                return true;
            }

            error = $"Output did not contain the '{field}' section.";
            return false;
        }

        /// <summary>Removes a leading/trailing ```json … ``` (or bare ```) fence if present.</summary>
        private static string StripFences(string text)
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
