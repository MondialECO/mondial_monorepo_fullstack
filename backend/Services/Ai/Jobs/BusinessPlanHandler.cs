using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// C-3 Business Plan handler (one-shot, single structured JSON completion).
    /// <see cref="PrepareAsync"/> loads the referenced clarifier session's output —
    /// the sole authoritative input (locked C-3 decision #2) — plus, optionally, the
    /// founder's original business idea as secondary context, and turns them into the
    /// prompt's User Context / Task layers. <see cref="InterpretAsync"/> parses the
    /// model's JSON into the locked seven-section BusinessPlanOutput contract and
    /// appends it as a new immutable version on the <see cref="BusinessPlanSession"/>
    /// (history is never overwritten — locked C-3 decision #5), then writes an
    /// <see cref="AiInsight"/>. A parse/validation failure is NOT thrown: the session
    /// is marked NeedsReview (raw text preserved on the response) and the job
    /// completes normally — mirroring <see cref="IdeaClarifierHandler"/>.
    /// </summary>
    public sealed class BusinessPlanHandler : IAiTaskHandler
    {
        private const int MaxOutputTokens = 2800;
        private const double Temperature = 0.4;

        private readonly IBusinessPlanSessionStore _sessions;
        private readonly IClarifierSessionStore _clarifiers;
        private readonly BusinessIdeasRepository _ideas;
        private readonly IAiInsightWriter _insights;
        private readonly ILogger<BusinessPlanHandler> _logger;

        public BusinessPlanHandler(
            IBusinessPlanSessionStore sessions,
            IClarifierSessionStore clarifiers,
            BusinessIdeasRepository ideas,
            IAiInsightWriter insights,
            ILogger<BusinessPlanHandler> logger)
        {
            _sessions = sessions;
            _clarifiers = clarifiers;
            _ideas = ideas;
            _insights = insights;
            _logger = logger;
        }

        public AiJobType Type => AiJobType.BusinessPlan;

        public async Task<AiHandlerRequest> PrepareAsync(AiRequest request, CancellationToken cancellationToken = default)
        {
            var input = request.InputPayload;

            string Field(string key) =>
                input != null && input.TryGetValue(key, out var v) && v.IsString ? v.AsString.Trim() : string.Empty;

            var clarifierSessionId = Field("clarifierSessionId");
            var businessIdeaId = Field("businessIdeaId");

            // Authoritative input: the clarified opportunity (locked C-3 decision #2).
            var contextLines = new List<string>();
            var clarifier = clarifierSessionId.Length > 0
                ? await _clarifiers.GetOwnedAsync(clarifierSessionId, request.OwnerUserId)
                : null;

            if (clarifier?.Output is not null)
            {
                contextLines.Add(
                    "CLARIFIED OPPORTUNITY (authoritative source — base every section on this):\n" +
                    clarifier.Output.ToJson());
            }
            else
            {
                _logger.LogWarning(
                    "BusinessPlan request {RequestId} has no usable clarifier output (clarifierSessionId={ClarifierId}).",
                    request.Id, clarifierSessionId);
                contextLines.Add("CLARIFIED OPPORTUNITY: (unavailable — proceed cautiously and state assumptions)");
            }

            // Secondary context only: the founder's original submission, if attached.
            if (businessIdeaId.Length > 0)
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
                var current = session?.Versions.FirstOrDefault(v => v.Version == session.CurrentVersion);
                var existingPlan = current?.Content?.ToJson() ?? "(no current plan)";

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
                    MaxTokens: MaxOutputTokens,
                    Temperature: Temperature);
            }

            const string task =
                "Produce a complete, structured business plan for the clarified " +
                "opportunity above, following the output contract exactly. Base every " +
                "section on the clarified opportunity; use the secondary context only " +
                "to fill gaps, never to override it. Return only the JSON object.";

            return new AiHandlerRequest(
                PromptKey: PromptTemplate.BusinessPlan.Key,
                TaskType: "BusinessPlan",
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
            "executiveSummary", "marketAnalysis", "competitorAnalysis",
            "revenueModel", "goToMarket", "operationsPlan", "risks",
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
                    error = $"Output is missing required section '{field}'.";
                    return false;
                }
            }

            // v1 explicitly excludes a funding ask — drop it if the model added one.
            doc.Remove("fundingAsk");

            // Pin the contract version regardless of what the model emitted.
            doc["schemaVersion"] = BusinessPlanOutputDto.CurrentSchemaVersion;

            contract = doc;
            return true;
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
