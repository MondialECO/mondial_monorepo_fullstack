using System.Text.Json;
using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai
{
    public class FinancialAssumptionsService : IFinancialAssumptionsService
    {
        private readonly IForecastSessionStore _sessions;
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly IMarketStudySessionStore _marketStudies;
        private readonly IBusinessModelSessionStore _businessModels;
        private readonly IAiProvider? _aiProvider;
        private readonly IModelRouter? _modelRouter;
        private readonly ILogger<FinancialAssumptionsService> _logger;

        public FinancialAssumptionsService(
            IForecastSessionStore sessions,
            ICreatorIdeaStore creatorIdeas,
            IMarketStudySessionStore marketStudies,
            IBusinessModelSessionStore businessModels,
            ILogger<FinancialAssumptionsService> logger,
            IAiProvider? aiProvider = null,
            IModelRouter? modelRouter = null)
        {
            _sessions = sessions;
            _creatorIdeas = creatorIdeas;
            _marketStudies = marketStudies;
            _businessModels = businessModels;
            _logger = logger;
            _aiProvider = aiProvider;
            _modelRouter = modelRouter;
        }

        public async Task<ForecastSession> GetOrCreateForecastSessionAsync(string businessIdeaId, string ownerUserId)
        {
            var idea = await _creatorIdeas.GetOwnedAsync(businessIdeaId, ownerUserId);

            ForecastSession? session = null;
            if (!string.IsNullOrWhiteSpace(idea?.Phase3Data?.ForecastSessionId))
            {
                session = await _sessions.GetOwnedAsync(idea.Phase3Data.ForecastSessionId, ownerUserId);
            }

            if (session == null)
            {
                session = await _sessions.GetByIdeaAsync(businessIdeaId, ownerUserId);
            }

            if (session == null)
            {
                session = new ForecastSession
                {
                    OwnerUserId = ownerUserId,
                    BusinessIdeaId = businessIdeaId,
                    Status = "Draft",
                    Inputs = new ForecastInputs
                    {
                        Provenance = new Dictionary<string, string>(),
                        Rationales = new Dictionary<string, string>(),
                        NeedsFounderInput = new Dictionary<string, bool>()
                    },
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _sessions.AddAsync(session);

                if (idea != null)
                {
                    var update = Builders<CreatorIdea>.Update.Set(x => x.Phase3Data.ForecastSessionId, session.Id);
                    await _creatorIdeas.UpdateAsync(idea.Id, ownerUserId, update);
                }
            }

            session.Inputs ??= new ForecastInputs
            {
                Provenance = new Dictionary<string, string>(),
                Rationales = new Dictionary<string, string>(),
                NeedsFounderInput = new Dictionary<string, bool>()
            };

            // Progressive check: if Step 3.1 or 3.2 generated newer versions, enrich without overwriting founder edits
            if (idea?.Phase3Data != null)
            {
                bool inputsChanged = false;
                BsonDocument? msDoc = null;

                if (!string.IsNullOrWhiteSpace(idea.Phase3Data.MarketStudySessionId))
                {
                    var ms = await _marketStudies.GetOwnedAsync(idea.Phase3Data.MarketStudySessionId, ownerUserId);
                    if (ms != null && ms.CurrentVersion > 0 && (!session.Inputs.MarketStudyVersion.HasValue || ms.CurrentVersion > session.Inputs.MarketStudyVersion.Value))
                    {
                        var content = ms.Versions.FirstOrDefault(v => v.Version == ms.CurrentVersion)?.Content;
                        if (content != null)
                        {
                            msDoc = content;
                            await EnrichFromMarketStudyAsync(session.Inputs, content, ms.CurrentVersion, idea);
                            inputsChanged = true;
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(idea.Phase3Data.BusinessModelSessionId))
                {
                    var bm = await _businessModels.GetOwnedAsync(idea.Phase3Data.BusinessModelSessionId, ownerUserId);
                    if (bm != null && bm.CurrentVersion > 0 && (!session.Inputs.BusinessModelVersion.HasValue || bm.CurrentVersion > session.Inputs.BusinessModelVersion.Value))
                    {
                        var content = bm.Versions.FirstOrDefault(v => v.Version == bm.CurrentVersion)?.Content;
                        if (content != null)
                        {
                            await EnrichFromBusinessModelAsync(session.Inputs, content, bm.CurrentVersion, idea, msDoc);
                            inputsChanged = true;
                        }
                    }
                }

                if (inputsChanged)
                {
                    await _sessions.UpdateInputsAsync(session.Id, session.Inputs);
                }
            }

            return session;
        }

        public async Task<ForecastSession> UpdateFromMarketStudyAsync(
            string businessIdeaId,
            string ownerUserId,
            BsonDocument marketStudyContent,
            int marketStudyVersion)
        {
            var session = await GetOrCreateForecastSessionAsync(businessIdeaId, ownerUserId);

            // Monotonic version check:
            // incomingVersion < storedVersion -> reject as stale
            // incomingVersion == storedVersion -> idempotent no-op
            // incomingVersion > storedVersion -> accept latest upstream update
            if (session.Inputs!.MarketStudyVersion.HasValue)
            {
                if (marketStudyVersion < session.Inputs.MarketStudyVersion.Value)
                {
                    _logger.LogInformation(
                        "Ignoring stale Market Study version {IncomingVersion} (current is {CurrentVersion}) for idea {IdeaId}",
                        marketStudyVersion, session.Inputs.MarketStudyVersion.Value, businessIdeaId);
                    return session;
                }

                if (marketStudyVersion == session.Inputs.MarketStudyVersion.Value)
                {
                    _logger.LogInformation(
                        "Idempotent Market Study version {IncomingVersion} (already at {CurrentVersion}) for idea {IdeaId}",
                        marketStudyVersion, session.Inputs.MarketStudyVersion.Value, businessIdeaId);
                    return session;
                }
            }

            var idea = await _creatorIdeas.GetOwnedAsync(businessIdeaId, ownerUserId);

            await EnrichFromMarketStudyAsync(session.Inputs!, marketStudyContent, marketStudyVersion, idea);
            await _sessions.UpdateInputsAsync(session.Id, session.Inputs!);

            return session;
        }

        public async Task<ForecastSession> UpdateFromBusinessModelAsync(
            string businessIdeaId,
            string ownerUserId,
            BsonDocument businessModelContent,
            int businessModelVersion,
            string? marketStudySessionId = null)
        {
            var session = await GetOrCreateForecastSessionAsync(businessIdeaId, ownerUserId);

            // Monotonic version check:
            // incomingVersion < storedVersion -> reject as stale
            // incomingVersion == storedVersion -> idempotent no-op
            // incomingVersion > storedVersion -> accept latest upstream update
            if (session.Inputs!.BusinessModelVersion.HasValue)
            {
                if (businessModelVersion < session.Inputs.BusinessModelVersion.Value)
                {
                    _logger.LogInformation(
                        "Ignoring stale Business Model version {IncomingVersion} (current is {CurrentVersion}) for idea {IdeaId}",
                        businessModelVersion, session.Inputs.BusinessModelVersion.Value, businessIdeaId);
                    return session;
                }

                if (businessModelVersion == session.Inputs.BusinessModelVersion.Value)
                {
                    _logger.LogInformation(
                        "Idempotent Business Model version {IncomingVersion} (already at {CurrentVersion}) for idea {IdeaId}",
                        businessModelVersion, session.Inputs.BusinessModelVersion.Value, businessIdeaId);
                    return session;
                }
            }

            var idea = await _creatorIdeas.GetOwnedAsync(businessIdeaId, ownerUserId);
            BsonDocument? msDoc = null;

            // If session lacks TAM from Step 3.1 and session id provided, link it
            if (!session.Inputs!.Tam.HasValue && !string.IsNullOrWhiteSpace(marketStudySessionId))
            {
                var ms = await _marketStudies.GetOwnedAsync(marketStudySessionId, ownerUserId);
                var msContent = ms?.Versions.FirstOrDefault(v => v.Version == ms.CurrentVersion)?.Content;
                if (msContent != null && ms != null)
                {
                    msDoc = msContent;
                    await EnrichFromMarketStudyAsync(session.Inputs, msContent, ms.CurrentVersion, idea);
                }
            }

            await EnrichFromBusinessModelAsync(session.Inputs, businessModelContent, businessModelVersion, idea, msDoc);
            await _sessions.UpdateInputsAsync(session.Id, session.Inputs);

            return session;
        }

        public async Task<ForecastSession> UpdateFounderAssumptionsAsync(
            string businessIdeaId,
            string ownerUserId,
            UpdateFinancialAssumptionsDto request)
        {
            var session = await GetOrCreateForecastSessionAsync(businessIdeaId, ownerUserId);
            var inputs = session.Inputs!;

            inputs.Provenance ??= new Dictionary<string, string>();
            inputs.Rationales ??= new Dictionary<string, string>();
            inputs.NeedsFounderInput ??= new Dictionary<string, bool>();

            if (!string.IsNullOrWhiteSpace(request.BusinessModelType))
            {
                inputs.BusinessModelType = request.BusinessModelType.ToLowerInvariant();
            }

            void ApplyFounderField(string key, double? val, string fallbackProvenance = "founder_confirmed")
            {
                if (!val.HasValue) return;

                var prov = request.Provenance != null && request.Provenance.TryGetValue(key, out var p)
                    ? p
                    : fallbackProvenance;

                inputs.Provenance[key] = prov;
                inputs.NeedsFounderInput[key] = false;
                inputs.Rationales[key] = "Confirmed by founder.";

                switch (key)
                {
                    case "startingBudget": inputs.StartingBudget = val; break;
                    case "launchSubscribers": inputs.LaunchSubscribers = val; break;
                    case "variableCost": inputs.VariableCost = val; break;
                    case "arpu": inputs.Arpu = val; break;
                    case "opex": inputs.Opex = val; break;
                    case "monthlyGrowthPct": inputs.MonthlyGrowthPct = val; break;
                    case "monthlyChurnPct": inputs.MonthlyChurnPct = val; break;
                    case "averageOrderValue": inputs.AverageOrderValue = val; break;
                    case "takeRatePct": inputs.TakeRatePct = val; break;
                }
            }

            if (request.StartingBudget.HasValue)
                ApplyFounderField("startingBudget", request.StartingBudget.Value, request.StartingBudgetProvenance ?? "founder_confirmed");
            if (request.LaunchSubscribers.HasValue)
                ApplyFounderField("launchSubscribers", request.LaunchSubscribers.Value);
            if (request.VariableCost.HasValue)
                ApplyFounderField("variableCost", request.VariableCost.Value);
            if (request.Arpu.HasValue)
                ApplyFounderField("arpu", request.Arpu.Value);
            if (request.Opex.HasValue)
                ApplyFounderField("opex", request.Opex.Value);
            if (request.MonthlyGrowthPct.HasValue)
                ApplyFounderField("monthlyGrowthPct", request.MonthlyGrowthPct.Value);
            if (request.MonthlyChurnPct.HasValue)
                ApplyFounderField("monthlyChurnPct", request.MonthlyChurnPct.Value);
            if (request.AverageOrderValue.HasValue)
                ApplyFounderField("averageOrderValue", request.AverageOrderValue.Value);
            if (request.TakeRatePct.HasValue)
                ApplyFounderField("takeRatePct", request.TakeRatePct.Value);

            if (request.ActiveDrivers != null)
            {
                inputs.ActiveDrivers ??= new Dictionary<string, bool>();
                foreach (var (k, v) in request.ActiveDrivers)
                    inputs.ActiveDrivers[k] = v;
            }

            inputs.UpdatedAt = DateTime.UtcNow;
            await _sessions.UpdateInputsAsync(session.Id, inputs);

            return session;
        }

        private async Task EnrichFromMarketStudyAsync(
            ForecastInputs inputs,
            BsonDocument marketStudy,
            int marketStudyVersion,
            CreatorIdea? idea)
        {
            inputs.MarketStudyVersion = marketStudyVersion;
            inputs.Provenance ??= new Dictionary<string, string>();
            inputs.Rationales ??= new Dictionary<string, string>();
            inputs.NeedsFounderInput ??= new Dictionary<string, bool>();

            // 1. TAM is canonical from Step 3.1 (CANONICAL LINKED FACT: upstream_market)
            if (marketStudy.Contains("marketSizing") && marketStudy["marketSizing"].IsBsonDocument)
            {
                var ms = marketStudy["marketSizing"].AsBsonDocument;
                if (ms.Contains("tam") && ms["tam"].IsBsonDocument && ms["tam"].AsBsonDocument.Contains("value"))
                {
                    inputs.Tam = ms["tam"].AsBsonDocument["value"].ToDouble();
                    inputs.Provenance["tam"] = "upstream_market";
                    inputs.Rationales["tam"] = "Canonical total addressable market from Step 3.1 Market Study.";
                    inputs.NeedsFounderInput["tam"] = false;
                }
            }

            // 2. Archetype detection
            if (string.IsNullOrWhiteSpace(inputs.BusinessModelType))
            {
                inputs.BusinessModelType = DetectBusinessModelType(idea, marketStudy);
            }

            // 3. Step 3.1 AI Generation: Call AI to generate market-dependent forecast assumptions
            if (_aiProvider != null)
            {
                await CallAiMarketAssumptionsAsync(inputs, marketStudy, idea);
            }
            else
            {
                // Fallback without AI: only map deterministic upstream facts; do NOT invent fake defaults
                if (!IsFounderLocked(inputs, "monthlyGrowthPct"))
                {
                    if (marketStudy.Contains("marketSizing") && marketStudy["marketSizing"].IsBsonDocument)
                    {
                        var ms = marketStudy["marketSizing"].AsBsonDocument;
                        if (ms.Contains("som") && ms["som"].IsBsonDocument && ms["som"].AsBsonDocument.Contains("growthRate"))
                        {
                            var gr = ms["som"].AsBsonDocument["growthRate"].ToDouble();
                            if (gr > 0)
                            {
                                inputs.MonthlyGrowthPct = gr;
                                inputs.Provenance["monthlyGrowthPct"] = "upstream_market";
                                inputs.Rationales["monthlyGrowthPct"] = $"Canonical Step 3.1 SOM target growth rate ({gr}%).";
                                inputs.NeedsFounderInput["monthlyGrowthPct"] = false;
                            }
                        }
                    }

                    if (!inputs.MonthlyGrowthPct.HasValue)
                    {
                        inputs.NeedsFounderInput["monthlyGrowthPct"] = true;
                    }
                }

                if (!IsFounderLocked(inputs, "launchSubscribers"))
                {
                    inputs.NeedsFounderInput["launchSubscribers"] = true;
                }
            }
        }

        private async Task EnrichFromBusinessModelAsync(
            ForecastInputs inputs,
            BsonDocument businessModel,
            int businessModelVersion,
            CreatorIdea? idea,
            BsonDocument? marketStudy)
        {
            inputs.BusinessModelVersion = businessModelVersion;
            inputs.Provenance ??= new Dictionary<string, string>();
            inputs.Rationales ??= new Dictionary<string, string>();
            inputs.NeedsFounderInput ??= new Dictionary<string, bool>();

            // 1. Refine business model type from Step 3.2
            inputs.BusinessModelType = DetectBusinessModelType(idea, businessModel);

            // 2. CANONICAL LINKED FACTS: Unit economics from Step 3.2
            double? arpu = null;
            double? cac = null;
            double? grossMarginPct = null;
            double? retentionRate = null;

            if (businessModel.Contains("unitEconomics") && businessModel["unitEconomics"].IsBsonDocument)
            {
                var ue = businessModel["unitEconomics"].AsBsonDocument;
                if (ue.Contains("arpu") && ue["arpu"].IsBsonDocument && ue["arpu"].AsBsonDocument.Contains("amount"))
                    arpu = ue["arpu"].AsBsonDocument["amount"].ToDouble();
                if (ue.Contains("cac") && ue["cac"].IsBsonDocument && ue["cac"].AsBsonDocument.Contains("amount"))
                    cac = ue["cac"].AsBsonDocument["amount"].ToDouble();
                if (ue.Contains("margins") && ue["margins"].IsBsonDocument && ue["margins"].AsBsonDocument.Contains("grossMarginPct"))
                    grossMarginPct = ue["margins"].AsBsonDocument["grossMarginPct"].ToDouble();
            }

            // Fallback for ARPU from revenueTiers
            if ((!arpu.HasValue || arpu <= 0) && businessModel.Contains("revenueTiers") && businessModel["revenueTiers"].IsBsonArray)
            {
                var tiers = businessModel["revenueTiers"].AsBsonArray;
                if (tiers.Count > 0 && tiers[0].IsBsonDocument)
                {
                    var t0 = tiers[0].AsBsonDocument;
                    if (t0.Contains("pricing"))
                    {
                        var pStr = t0["pricing"].ToString() ?? "";
                        var numStr = Regex.Replace(pStr, @"[^0-9.]", "");
                        if (double.TryParse(numStr, out var parsedP) && parsedP > 0)
                            arpu = parsedP;
                    }
                }
            }

            if (businessModel.Contains("assumptions") && businessModel["assumptions"].IsBsonDocument)
            {
                var ass = businessModel["assumptions"].AsBsonDocument;
                if (ass.Contains("retentionRate"))
                    retentionRate = ass["retentionRate"].ToDouble();
            }

            // OPEX estimation from Canvas cost structure
            double? opex = null;
            string? opexRationale = null;
            if (businessModel.Contains("canvas") && businessModel["canvas"].IsBsonDocument)
            {
                var canvas = businessModel["canvas"].AsBsonDocument;
                if (canvas.Contains("costStructure"))
                {
                    var csStr = canvas["costStructure"].ToJson().ToLowerInvariant();
                    if (csStr.Contains("enterprise") || csStr.Contains("hardware") || csStr.Contains("inventory"))
                    {
                        opex = 12000;
                        opexRationale = "Cost structure identified in Step 3.2 Canvas (higher overhead).";
                    }
                    else if (csStr.Contains("lean") || csStr.Contains("digital") || csStr.Contains("micro"))
                    {
                        opex = 5000;
                        opexRationale = "Lean/digital cost structure identified in Step 3.2 Canvas.";
                    }
                }
            }

            // Save canonical facts with truthful provenance
            if (!IsFounderLocked(inputs, "arpu"))
            {
                if (arpu.HasValue && arpu.Value >= 0)
                {
                    inputs.Arpu = arpu.Value;
                    inputs.Provenance["arpu"] = "upstream_business_model";
                    inputs.Rationales["arpu"] = "Explicit pricing from Step 3.2 Business Model unit economics.";
                    inputs.NeedsFounderInput["arpu"] = false;
                }
                else
                {
                    inputs.NeedsFounderInput["arpu"] = true;
                }
            }

            if (!IsFounderLocked(inputs, "variableCost"))
            {
                if (arpu.HasValue && grossMarginPct.HasValue && grossMarginPct.Value >= 0 && grossMarginPct.Value <= 100)
                {
                    double varCost = Math.Round(arpu.Value * (1 - (grossMarginPct.Value / 100.0)), 2);
                    inputs.VariableCost = varCost;
                    inputs.Provenance["variableCost"] = "upstream_business_model";
                    inputs.Rationales["variableCost"] = $"Calculated from Step 3.2 gross margins ({grossMarginPct.Value}%).";
                    inputs.NeedsFounderInput["variableCost"] = false;
                }
                else
                {
                    inputs.NeedsFounderInput["variableCost"] = true;
                }
            }

            if (!IsFounderLocked(inputs, "opex"))
            {
                if (opex.HasValue && opex.Value >= 0)
                {
                    inputs.Opex = opex.Value;
                    inputs.Provenance["opex"] = "upstream_business_model";
                    inputs.Rationales["opex"] = opexRationale!;
                    inputs.NeedsFounderInput["opex"] = false;
                }
                else
                {
                    inputs.NeedsFounderInput["opex"] = true;
                }
            }

            // Inactive driver semantics: do NOT persist fake 0 values for irrelevant business drivers
            inputs.ActiveDrivers ??= new Dictionary<string, bool>();
            switch (inputs.BusinessModelType)
            {
                case "ecommerce":
                    inputs.ActiveDrivers["monthlyChurnPct"] = false;
                    if (!IsFounderLocked(inputs, "monthlyChurnPct"))
                    {
                        inputs.MonthlyChurnPct = null;
                        inputs.Provenance?.Remove("monthlyChurnPct");
                        inputs.Rationales["monthlyChurnPct"] = "Subscription churn is not applicable to e-commerce transaction order models.";
                        inputs.NeedsFounderInput["monthlyChurnPct"] = false;
                    }
                    break;

                case "service":
                    if (retentionRate.HasValue && retentionRate.Value > 0 && retentionRate.Value <= 100)
                    {
                        inputs.ActiveDrivers["monthlyChurnPct"] = true;
                    }
                    else
                    {
                        inputs.ActiveDrivers["monthlyChurnPct"] = false;
                        if (!IsFounderLocked(inputs, "monthlyChurnPct"))
                        {
                            inputs.MonthlyChurnPct = null;
                            inputs.Provenance?.Remove("monthlyChurnPct");
                            inputs.Rationales["monthlyChurnPct"] = "Subscription churn is not applicable to non-recurring/project service models.";
                            inputs.NeedsFounderInput["monthlyChurnPct"] = false;
                        }
                    }
                    break;

                case "marketplace":
                    inputs.ActiveDrivers["monthlyChurnPct"] = false;
                    inputs.ActiveDrivers["takeRatePct"] = true;
                    if (!IsFounderLocked(inputs, "monthlyChurnPct"))
                    {
                        inputs.MonthlyChurnPct = null;
                        inputs.Provenance?.Remove("monthlyChurnPct");
                        inputs.Rationales["monthlyChurnPct"] = "Subscription churn is not applicable to transactional marketplace models.";
                        inputs.NeedsFounderInput["monthlyChurnPct"] = false;
                    }
                    break;

                case "saas":
                default:
                    inputs.ActiveDrivers["monthlyChurnPct"] = true;
                    break;
            }

            // 3. Step 3.2 AI Refinement: Call AI to refine and complete editable assumptions
            if (_aiProvider != null)
            {
                await CallAiBusinessModelAssumptionsAsync(inputs, businessModel, marketStudy, idea, cac);
            }
            else
            {
                // Fallback without AI: map available facts or flag for founder input
                if (!IsFounderLocked(inputs, "monthlyChurnPct") && inputs.BusinessModelType != "ecommerce")
                {
                    if (retentionRate.HasValue && retentionRate.Value > 50 && retentionRate.Value <= 100)
                    {
                        inputs.MonthlyChurnPct = Math.Round(100 - retentionRate.Value, 1);
                        inputs.Provenance["monthlyChurnPct"] = "upstream_business_model";
                        inputs.Rationales["monthlyChurnPct"] = $"Derived from Step 3.2 retention rate ({retentionRate.Value}%).";
                        inputs.NeedsFounderInput["monthlyChurnPct"] = false;
                    }
                    else
                    {
                        inputs.NeedsFounderInput["monthlyChurnPct"] = true;
                    }
                }

                if (!IsFounderLocked(inputs, "launchSubscribers"))
                {
                    inputs.NeedsFounderInput["launchSubscribers"] = true;
                }

                if (!IsFounderLocked(inputs, "startingBudget"))
                {
                    if (inputs.Opex.HasValue && inputs.Opex.Value > 0)
                    {
                        double calculatedBudget = inputs.Opex.Value * 6;
                        inputs.StartingBudget = calculatedBudget;
                        inputs.Provenance["startingBudget"] = "ai_suggested";
                        inputs.Rationales["startingBudget"] = $"6-month operating runway covering ~€{inputs.Opex.Value:N0}/mo fixed OPEX.";
                        inputs.NeedsFounderInput["startingBudget"] = false;
                    }
                    else
                    {
                        inputs.NeedsFounderInput["startingBudget"] = true;
                    }
                }
            }
        }

        private async Task CallAiMarketAssumptionsAsync(ForecastInputs inputs, BsonDocument marketStudy, CreatorIdea? idea)
        {
            try
            {
                var model = _modelRouter?.Resolve("Forecast") ?? "openrouter/auto";
                var prompt = $@"You are a quantitative financial analyst evaluating a venture based on Step 3.1 Market Study.
Project: {idea?.Project?.Name ?? "Venture"}
Problem: {idea?.Project?.Problem}
Solution: {idea?.Project?.Solution}
Target User: {idea?.Project?.TargetUser}
Sector: {idea?.Project?.Sector ?? idea?.Project?.Category}
Market Study Summary:
TAM: {inputs.Tam?.ToString("N0") ?? "Unknown"}
Content: {marketStudy.ToJson()}

Generate realistic market-dependent forecast assumptions for 3-year projections.
Respond strictly in JSON matching this schema:
{{
  ""businessModelType"": ""saas"" | ""ecommerce"" | ""service"" | ""marketplace"",
  ""monthlyGrowthPct"": <number between 2 and 35, or null if uncertain>,
  ""growthRationale"": ""<explanation of growth driver grounded in market sizing>"",
  ""launchVolume"": <positive number for month 1 volume, or null if uncertain>,
  ""launchVolumeRationale"": ""<explanation of initial month 1 traction volume>"",
  ""canEstimateGrowth"": <boolean>,
  ""canEstimateLaunchVolume"": <boolean>
}}";

                var completion = await _aiProvider!.CompleteAsync(new AiCompletionRequest
                {
                    Model = model,
                    Messages = new List<AiMessage>
                    {
                        new("system", "You are an expert startup financial modeler. Output JSON only."),
                        new("user", prompt)
                    },
                    Temperature = 0.2,
                    MaxTokens = 800
                });

                var jsonStr = ExtractJson(completion.Text);
                using var doc = JsonDocument.Parse(jsonStr);
                var root = doc.RootElement;

                if (root.TryGetProperty("businessModelType", out var bmt) && bmt.ValueKind == JsonValueKind.String)
                {
                    var typeVal = bmt.GetString()?.ToLowerInvariant();
                    if (!string.IsNullOrWhiteSpace(typeVal) && string.IsNullOrWhiteSpace(inputs.BusinessModelType))
                    {
                        inputs.BusinessModelType = typeVal;
                    }
                }

                if (!IsFounderLocked(inputs, "monthlyGrowthPct"))
                {
                    bool canGrowth = root.TryGetProperty("canEstimateGrowth", out var cg) && cg.GetBoolean();
                    if (canGrowth && root.TryGetProperty("monthlyGrowthPct", out var mg) && mg.ValueKind == JsonValueKind.Number)
                    {
                        inputs.MonthlyGrowthPct = mg.GetDouble();
                        inputs.Provenance["monthlyGrowthPct"] = "ai_suggested";
                        inputs.Rationales["monthlyGrowthPct"] = root.TryGetProperty("growthRationale", out var gr) ? gr.GetString() ?? "AI estimated growth rate." : "AI estimated growth rate.";
                        inputs.NeedsFounderInput["monthlyGrowthPct"] = false;
                    }
                    else
                    {
                        inputs.NeedsFounderInput["monthlyGrowthPct"] = true;
                    }
                }

                if (!IsFounderLocked(inputs, "launchSubscribers"))
                {
                    bool canVol = root.TryGetProperty("canEstimateLaunchVolume", out var cv) && cv.GetBoolean();
                    if (canVol && root.TryGetProperty("launchVolume", out var lv) && lv.ValueKind == JsonValueKind.Number)
                    {
                        inputs.LaunchSubscribers = lv.GetDouble();
                        inputs.Provenance["launchSubscribers"] = "ai_suggested";
                        inputs.Rationales["launchSubscribers"] = root.TryGetProperty("launchVolumeRationale", out var lvr) ? lvr.GetString() ?? "AI estimated launch volume." : "AI estimated launch volume.";
                        inputs.NeedsFounderInput["launchSubscribers"] = false;
                    }
                    else
                    {
                        inputs.NeedsFounderInput["launchSubscribers"] = true;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Structured AI market assumptions generation encountered an error; flagging for founder input.");
                if (!IsFounderLocked(inputs, "monthlyGrowthPct") && !inputs.MonthlyGrowthPct.HasValue)
                    inputs.NeedsFounderInput["monthlyGrowthPct"] = true;
                if (!IsFounderLocked(inputs, "launchSubscribers") && !inputs.LaunchSubscribers.HasValue)
                    inputs.NeedsFounderInput["launchSubscribers"] = true;
            }
        }

        private async Task CallAiBusinessModelAssumptionsAsync(
            ForecastInputs inputs,
            BsonDocument businessModel,
            BsonDocument? marketStudy,
            CreatorIdea? idea,
            double? cac)
        {
            try
            {
                var model = _modelRouter?.Resolve("Forecast") ?? "openrouter/auto";
                var prompt = $@"You are a quantitative financial analyst refining assumptions after Step 3.2 Business Model.
Project: {idea?.Project?.Name ?? "Venture"}
Business Model Type: {inputs.BusinessModelType ?? "saas"}
Confirmed Upstream Facts:
TAM: {inputs.Tam?.ToString("N0") ?? "Unknown"}
ARPU: {inputs.Arpu?.ToString("N2") ?? "Unknown"}
Variable Cost: {inputs.VariableCost?.ToString("N2") ?? "Unknown"}
Fixed OPEX: {inputs.Opex?.ToString("N0") ?? "Unknown"}
Business Model Details: {businessModel.ToJson()}

Refine and complete the 36-month forecast assumptions.
Respond strictly in JSON matching this schema:
{{
  ""launchVolume"": <positive number for month 1 volume, or null if uncertain>,
  ""launchVolumeRationale"": ""<explanation of initial traction volume>"",
  ""monthlyGrowthPct"": <number between 2 and 35, or null if uncertain>,
  ""growthRationale"": ""<explanation of monthly growth rate>"",
  ""monthlyChurnPct"": <percentage number for churn/turnover (0 for ecommerce), or null if uncertain>,
  ""churnRationale"": ""<explanation of customer retention/drop-off>"",
  ""startingBudget"": <suggested starting budget in currency units, or null if uncertain>,
  ""startingBudgetRationale"": ""<runway explanation based on OPEX and CAC>"",
  ""canEstimateLaunchVolume"": <boolean>,
  ""canEstimateGrowth"": <boolean>,
  ""canEstimateChurn"": <boolean>,
  ""canEstimateStartingBudget"": <boolean>
}}";

                var completion = await _aiProvider!.CompleteAsync(new AiCompletionRequest
                {
                    Model = model,
                    Messages = new List<AiMessage>
                    {
                        new("system", "You are an expert startup financial modeler. Output JSON only."),
                        new("user", prompt)
                    },
                    Temperature = 0.2,
                    MaxTokens = 1000
                });

                var jsonStr = ExtractJson(completion.Text);
                using var doc = JsonDocument.Parse(jsonStr);
                var root = doc.RootElement;

                if (!IsFounderLocked(inputs, "launchSubscribers"))
                {
                    bool canVol = root.TryGetProperty("canEstimateLaunchVolume", out var cv) && cv.GetBoolean();
                    if (canVol && root.TryGetProperty("launchVolume", out var lv) && lv.ValueKind == JsonValueKind.Number)
                    {
                        inputs.LaunchSubscribers = lv.GetDouble();
                        inputs.Provenance["launchSubscribers"] = "ai_suggested";
                        inputs.Rationales["launchSubscribers"] = root.TryGetProperty("launchVolumeRationale", out var lvr) ? lvr.GetString() ?? "AI estimated launch volume." : "AI estimated launch volume.";
                        inputs.NeedsFounderInput["launchSubscribers"] = false;
                    }
                    else if (!inputs.LaunchSubscribers.HasValue)
                    {
                        inputs.NeedsFounderInput["launchSubscribers"] = true;
                    }
                }

                if (!IsFounderLocked(inputs, "monthlyGrowthPct"))
                {
                    bool canGrowth = root.TryGetProperty("canEstimateGrowth", out var cg) && cg.GetBoolean();
                    if (canGrowth && root.TryGetProperty("monthlyGrowthPct", out var mg) && mg.ValueKind == JsonValueKind.Number)
                    {
                        inputs.MonthlyGrowthPct = mg.GetDouble();
                        inputs.Provenance["monthlyGrowthPct"] = "ai_suggested";
                        inputs.Rationales["monthlyGrowthPct"] = root.TryGetProperty("growthRationale", out var gr) ? gr.GetString() ?? "AI estimated growth rate." : "AI estimated growth rate.";
                        inputs.NeedsFounderInput["monthlyGrowthPct"] = false;
                    }
                    else if (!inputs.MonthlyGrowthPct.HasValue)
                    {
                        inputs.NeedsFounderInput["monthlyGrowthPct"] = true;
                    }
                }

                if (!IsFounderLocked(inputs, "monthlyChurnPct"))
                {
                    bool isChurnInactive = inputs.ActiveDrivers != null
                        && inputs.ActiveDrivers.TryGetValue("monthlyChurnPct", out var active)
                        && !active;

                    if (isChurnInactive || inputs.BusinessModelType == "ecommerce")
                    {
                        inputs.MonthlyChurnPct = null;
                        inputs.Provenance?.Remove("monthlyChurnPct");
                        inputs.Rationales["monthlyChurnPct"] = "Subscription churn is not applicable to transaction-based model.";
                        inputs.NeedsFounderInput["monthlyChurnPct"] = false;
                    }
                    else
                    {
                        bool canChurn = root.TryGetProperty("canEstimateChurn", out var cc) && cc.GetBoolean();
                        if (canChurn && root.TryGetProperty("monthlyChurnPct", out var mc) && mc.ValueKind == JsonValueKind.Number)
                        {
                            inputs.MonthlyChurnPct = mc.GetDouble();
                            inputs.Provenance["monthlyChurnPct"] = "ai_suggested";
                            inputs.Rationales["monthlyChurnPct"] = root.TryGetProperty("churnRationale", out var cr) ? cr.GetString() ?? "AI estimated churn rate." : "AI estimated churn rate.";
                            inputs.NeedsFounderInput["monthlyChurnPct"] = false;
                        }
                        else if (!inputs.MonthlyChurnPct.HasValue)
                        {
                            inputs.NeedsFounderInput["monthlyChurnPct"] = true;
                        }
                    }
                }

                if (!IsFounderLocked(inputs, "startingBudget"))
                {
                    bool canBudget = root.TryGetProperty("canEstimateStartingBudget", out var cb) && cb.GetBoolean();
                    if (canBudget && root.TryGetProperty("startingBudget", out var sb) && sb.ValueKind == JsonValueKind.Number)
                    {
                        inputs.StartingBudget = sb.GetDouble();
                        inputs.StartingBudgetProvenance = "ai_suggested";
                        inputs.Provenance["startingBudget"] = "ai_suggested";
                        var sbr = root.TryGetProperty("startingBudgetRationale", out var br) ? br.GetString() : null;
                        inputs.StartingBudgetRationale = sbr ?? "AI recommended launch runway based on operating cost structure.";
                        inputs.Rationales["startingBudget"] = inputs.StartingBudgetRationale;
                        inputs.NeedsFounderInput["startingBudget"] = false;
                    }
                    else if (inputs.Opex.HasValue && inputs.Opex.Value > 0)
                    {
                        double calculatedBudget = inputs.Opex.Value * 6;
                        inputs.StartingBudget = calculatedBudget;
                        inputs.StartingBudgetProvenance = "ai_suggested";
                        inputs.Provenance["startingBudget"] = "ai_suggested";
                        inputs.StartingBudgetRationale = $"6-month operating runway covering ~€{inputs.Opex.Value:N0}/mo fixed OPEX.";
                        inputs.Rationales["startingBudget"] = inputs.StartingBudgetRationale;
                        inputs.NeedsFounderInput["startingBudget"] = false;
                    }
                    else
                    {
                        inputs.NeedsFounderInput["startingBudget"] = true;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Structured AI business model assumptions generation encountered an error; flagging for founder input.");
                if (!IsFounderLocked(inputs, "launchSubscribers") && !inputs.LaunchSubscribers.HasValue)
                    inputs.NeedsFounderInput["launchSubscribers"] = true;
                if (!IsFounderLocked(inputs, "monthlyGrowthPct") && !inputs.MonthlyGrowthPct.HasValue)
                    inputs.NeedsFounderInput["monthlyGrowthPct"] = true;
                if (!IsFounderLocked(inputs, "monthlyChurnPct") && !inputs.MonthlyChurnPct.HasValue && inputs.BusinessModelType != "ecommerce")
                    inputs.NeedsFounderInput["monthlyChurnPct"] = true;
                if (!IsFounderLocked(inputs, "startingBudget") && !inputs.StartingBudget.HasValue)
                    inputs.NeedsFounderInput["startingBudget"] = true;
            }
        }

        private static string ExtractJson(string text)
        {
            var match = Regex.Match(text, @"```(?:json)?\s*([\s\S]*?)\s*```");
            if (match.Success) return match.Groups[1].Value.Trim();
            var start = text.IndexOf('{');
            var end = text.LastIndexOf('}');
            if (start >= 0 && end > start) return text.Substring(start, end - start + 1);
            return text;
        }

        private static bool IsFounderLocked(ForecastInputs inputs, string key)
        {
            if (inputs.Provenance == null) return false;
            if (!inputs.Provenance.TryGetValue(key, out var p)) return false;
            return p == "founder_confirmed" || p == "founder_edited";
        }

        private static string DetectBusinessModelType(CreatorIdea? idea, BsonDocument? contextDoc)
        {
            var textToAnalyze = (idea?.Project?.Sector ?? "") + " "
                + (idea?.Project?.Category ?? "") + " "
                + (idea?.Project?.Solution ?? "") + " "
                + (contextDoc != null ? contextDoc.ToJson() : "");

            var lower = textToAnalyze.ToLowerInvariant();

            if (lower.Contains("saas") || lower.Contains("software") || lower.Contains("subscription") || lower.Contains("b2b software"))
            {
                return "saas";
            }
            if (lower.Contains("ecommerce") || lower.Contains("e-commerce") || lower.Contains("retail")
                || lower.Contains("physical product") || lower.Contains("d2c") || lower.Contains("store"))
            {
                return "ecommerce";
            }
            if (lower.Contains("agency") || lower.Contains("consulting") || lower.Contains("professional service")
                || lower.Contains("firm") || lower.Contains("advisory") || lower.Contains("studio"))
            {
                return "service";
            }
            if (lower.Contains("marketplace") || lower.Contains("two-sided") || lower.Contains("peer-to-peer")
                || lower.Contains("multi-vendor"))
            {
                return "marketplace";
            }

            return "saas";
        }
    }
}
