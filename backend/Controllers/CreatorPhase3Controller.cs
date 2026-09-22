using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using System.Security.Claims;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos;
using WebApp.Services.Ai;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Legal;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 3 deterministic modules: Legal Checklist (3.3) and Formation Generator
    /// (3.4). No polling — synchronous server-side logic over the journey's project
    /// data plus the creator's completed forecast when available. Status stays derived.
    /// SP matching reuses the shared <see cref="ISpMatchingService"/> formula.
    ///
    /// Routes: the AI-style generate endpoints keep the /ai/ prefix for convention
    /// parity with C-2/C-3/C-4 even though they run synchronously; the mutation
    /// endpoints use plain /creator routes since there's no session.
    /// </summary>
    [Route("api/creator")]
    [ApiController]
    [Authorize]
    public class CreatorPhase3Controller : ControllerBase
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly ISpMatchingService _spMatching;
        private readonly IChatService _chat;
        private readonly IForecastSessionStore _forecasts;
        private readonly IBusinessPlanSessionStore _businessPlans;
        private readonly ILegalApplicabilityEngine _legalEngine;
        private readonly BusinessProfileClassifier _profileClassifier;
        private readonly IFranceLegalRulesCatalog _rulesCatalog;
        private readonly ILegalFrameworkSectionBuilder _sectionBuilder;
        private readonly IBusinessModelSessionStore? _businessModels;
        private readonly IMarketStudySessionStore? _marketStudies;
        private readonly ICreatorIdeaStore? _ideas;

        public CreatorPhase3Controller(
            ICreatorJourneyService journeys,
            ISpMatchingService spMatching,
            IChatService chat,
            IForecastSessionStore forecasts,
            IBusinessPlanSessionStore businessPlans,
            ILegalApplicabilityEngine? legalEngine = null,
            BusinessProfileClassifier? profileClassifier = null,
            IFranceLegalRulesCatalog? rulesCatalog = null,
            ILegalFrameworkSectionBuilder? sectionBuilder = null,
            IBusinessModelSessionStore? businessModels = null,
            IMarketStudySessionStore? marketStudies = null,
            ICreatorIdeaStore? ideas = null)
        {
            _journeys = journeys;
            _spMatching = spMatching;
            _chat = chat;
            _forecasts = forecasts;
            _businessPlans = businessPlans;
            _profileClassifier = profileClassifier ?? new BusinessProfileClassifier();
            _rulesCatalog = rulesCatalog ?? new FranceLegalRulesCatalog(Microsoft.Extensions.Logging.Abstractions.NullLogger<FranceLegalRulesCatalog>.Instance);
            _legalEngine = legalEngine ?? new LegalApplicabilityEngine(_rulesCatalog, Microsoft.Extensions.Logging.Abstractions.NullLogger<LegalApplicabilityEngine>.Instance);
            _sectionBuilder = sectionBuilder ?? new LegalFrameworkSectionBuilder();
            _businessModels = businessModels;
            _marketStudies = marketStudies;
            _ideas = ideas;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        private static readonly string[] FinTechKeywords = { "payment", "invoice", "billing", "transaction", "bank" };

        // Central API-owned reference catalogue for the Formation cards. These are
        // indicative planning ranges, not statutory figures. Persisting the returned
        // options with the formation snapshot keeps the UI and downloaded records in sync.
        private static List<CreatorFormationOption> FormationOptions() => new()
        {
            new()
            {
                Code = "SAS",
                Description = "Multiple goals, flexible governance.",
                Capital = "Min €1 (flexible)",
                FormationTime = "1-2 weeks",
                EstimatedCost = "€500-€1,200",
            },
            new()
            {
                Code = "SAS-U",
                Description = "Single shareholder SAS - solo founders.",
                Capital = "Min €1 (flexible)",
                FormationTime = "1-2 weeks",
                EstimatedCost = "€500-€1,200",
            },
            new()
            {
                Code = "SARL",
                Description = "Traditional, real-estate/family-friendly.",
                Capital = "Min €1 (fixed shares)",
                FormationTime = "2-3 weeks",
                EstimatedCost = "€500-€1,200",
            },
        };

        private static BsonDocument CurrentForecastContent(ForecastSession forecast) =>
            forecast?.Versions?
                .FirstOrDefault(v => v.Version == forecast.CurrentVersion)?.Content
            ?? forecast?.Versions?
                .OrderByDescending(v => v.Version)
                .FirstOrDefault()?.Content;

        private static int? ForecastBreakEvenMonth(ForecastSession forecast)
        {
            var content = CurrentForecastContent(forecast);
            if (content == null ||
                !content.TryGetValue("breakEvenAnalysis", out var analysis) ||
                !analysis.IsBsonDocument ||
                !analysis.AsBsonDocument.TryGetValue("breakEvenMonth", out var month) ||
                !month.IsNumeric)
                return null;

            var value = month.ToDouble();
            if (!double.IsFinite(value) || value < 1 || value > 1_200) return null;
            return (int)Math.Round(value);
        }

        private static string ForecastCurrency(ForecastSession forecast)
        {
            var content = CurrentForecastContent(forecast);
            if (content == null) return null;

            foreach (var sectionName in new[] { "revenueForecast", "costForecast", "cashFlowProjection" })
            {
                if (content.TryGetValue(sectionName, out var section) &&
                    section.IsBsonDocument &&
                    section.AsBsonDocument.TryGetValue("currency", out var currency) &&
                    currency.IsString &&
                    !string.IsNullOrWhiteSpace(currency.AsString))
                    return currency.AsString.ToUpperInvariant();
            }

            return null;
        }

        private static string ForecastSummary(CreatorFormationForecastBasis basis)
        {
            if (basis == null) return "";

            var signals = new List<string>();
            var currencyPrefix = string.IsNullOrWhiteSpace(basis.Currency) ? "" : $"{basis.Currency} ";
            if (basis.MonthlyGrowthPct.HasValue)
                signals.Add($"{basis.MonthlyGrowthPct.Value:0.#}% projected monthly growth");
            if (basis.Tam.HasValue)
                signals.Add($"{currencyPrefix}{basis.Tam.Value:N0} TAM");
            if (basis.Opex.HasValue)
                signals.Add($"{currencyPrefix}{basis.Opex.Value:N0} monthly OPEX");
            if (basis.BreakEvenMonth.HasValue)
                signals.Add($"break-even in month {basis.BreakEvenMonth.Value}");

            return signals.Count == 0 ? "" : $" Forecast basis: {string.Join(", ", signals)}.";
        }

        // 3.5b — the fixed set of skills a creator can DECLARE ("You have"). Mirrored on the frontend.
        private static readonly HashSet<string> DeclarableSkills = new(StringComparer.OrdinalIgnoreCase)
        {
            "Tech/Engineering", "Finance", "Legal", "Sales", "Operations",
            "Design", "Community", "Product", "Domain expertise", "Marketing",
        };

        // 3.5b gap baseline — SP-BACKED areas only, so every "You need" item resolves to a
        // real specialist (Sales/Product have no marketplace category → excluded to avoid dead
        // Find-SP buttons). (declarable skill, SP specialty, gap label). Not per-venture analysis.
        private static readonly (string Skill, string Specialty, string Label)[] GapBaseline =
        {
            ("Tech/Engineering", "development", "Full-stack Developer"),
            ("Finance", "finance", "Financial Advisor"),
            ("Legal", "legal", "Legal Specialist"),
            ("Design", "branding", "Brand Designer"),
        };

        // ========================= MODULE 3.3 / 3.5 — LEGAL & COMPLIANCE INTELLIGENCE =========================

        // POST /api/creator/ai/legal-checklist/generate
        // Legacy route upgraded to use deterministic France legal rules engine
        [HttpPost("ai/legal-checklist/generate")]
        public async Task<IActionResult> GenerateLegalChecklist([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);
                var p3 = idea.Phase3Data ?? new CreatorPhase3Data();

                var profile = await ExtractCurrentBusinessProfileAsync(userId, idea);
                var existingItems = p3.LegalAssessment?.Items ?? p3.LegalChecklist?.Items;

                var assessment = _legalEngine.Evaluate(idea.Id, userId, profile, existingItems);
                var journey = await _journeys.SetLegalAssessmentAsync(userId, assessment, ideaId);

                return Ok(ApiResponse.Ok("Legal checklist generated", journey.Phase3Data.LegalChecklist));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/legal-checklist/item/{itemId}
        // Legacy route compatibility
        [HttpPatch("legal-checklist/item/{itemId}")]
        public async Task<IActionResult> UpdateLegalItem(string itemId, [FromBody] UpdateChecklistItemRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.UpdateLegalChecklistItemAsync(userId, itemId, request?.Status, ideaId);
                var legacyChecklist = journey.Phase3Data.LegalChecklist ?? (journey.Phase3Data.LegalAssessment != null ? new CreatorLegalChecklist { Items = journey.Phase3Data.LegalAssessment.Items, CompletedCount = journey.Phase3Data.LegalAssessment.Items.Count(i => i.Status == "done"), TotalCount = journey.Phase3Data.LegalAssessment.Items.Count } : null);
                return Ok(ApiResponse.Ok("Item updated", legacyChecklist));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // GET /api/creator/legal-compliance/overview
        [HttpGet("legal-compliance/overview")]
        public async Task<IActionResult> GetLegalOverview([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);
                var p3 = idea.Phase3Data ?? new CreatorPhase3Data();

                var officialSources = _rulesCatalog.GetAllRules()
                    .Select(r => r.OfficialSource)
                    .Where(s => !string.IsNullOrEmpty(s.Url))
                    .GroupBy(s => s.Url, StringComparer.OrdinalIgnoreCase)
                    .Select(g => g.First())
                    .ToList();

                var assessment = p3.LegalAssessment;

                if (assessment == null)
                {
                    return Ok(ApiResponse.Ok("Legal overview", new LegalComplianceOverviewDto
                    {
                        HasAssessment = false,
                        Jurisdiction = _rulesCatalog.Jurisdiction,
                        RulesVersion = _rulesCatalog.RulesVersion,
                        PlanningReadinessPct = 0,
                        StageBreakdown = new List<LegalStageBreakdown>(),
                        DetectedArchetypes = new List<string>(),
                        IsPotentiallyOutdated = false,
                        OfficialSources = officialSources,
                        Disclaimer = "Planning guidance only. Based on your current business information, MBC identifies statutory requirements applicable in France. Review recommended."
                    }));
                }

                // Authoritative dirty / stale detection with structured metadata
                var currentProfile = await ExtractCurrentBusinessProfileAsync(userId, idea);
                var staleMetadata = _legalEngine.CheckFreshness(assessment, currentProfile, _rulesCatalog.RulesVersion, _rulesCatalog.Jurisdiction, _rulesCatalog.RulesFingerprint);

                bool isOutdated = staleMetadata.IsStale;
                assessment.IsPotentiallyOutdated = isOutdated;
                assessment.StaleMetadata = staleMetadata;

                return Ok(ApiResponse.Ok("Legal overview", new LegalComplianceOverviewDto
                {
                    HasAssessment = true,
                    Assessment = assessment,
                    Jurisdiction = assessment.Jurisdiction,
                    RulesVersion = assessment.RulesVersion,
                    PlanningReadinessPct = assessment.PlanningReadinessPct,
                    StageBreakdown = assessment.StageBreakdown,
                    DetectedArchetypes = assessment.DetectedArchetypes,
                    IsPotentiallyOutdated = isOutdated,
                    StaleMetadata = staleMetadata,
                    ReconciliationSummary = assessment.ReconciliationSummary,
                    OfficialSources = officialSources,
                    EvidenceLinks = assessment.EvidenceLinks ?? new List<LegalEvidenceLink>(),
                    EvidenceAuditTrail = assessment.EvidenceAuditTrail ?? new List<LegalEvidenceAuditEntry>(),
                    Disclaimer = "Planning guidance only. Based on your current business information, MBC identified these requirements as potentially applicable in France. This feature does not constitute statutory legal advice."
                }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/legal-compliance/evaluate
        [HttpPost("legal-compliance/evaluate")]
        public async Task<IActionResult> EvaluateLegalCompliance([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);
                var p3 = idea.Phase3Data ?? new CreatorPhase3Data();

                var profile = await ExtractCurrentBusinessProfileAsync(userId, idea);
                var assessment = _legalEngine.ReconcileAndEvaluate(idea.Id, userId, profile, p3.LegalAssessment);
                var journey = await _journeys.SetLegalAssessmentAsync(userId, assessment, ideaId);

                return Ok(ApiResponse.Ok("Legal compliance assessment evaluated successfully", journey.Phase3Data.LegalAssessment));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/legal-compliance/item/{itemId}/status
        [HttpPatch("legal-compliance/item/{itemId}/status")]
        public async Task<IActionResult> UpdateLegalComplianceItemStatus(string itemId, [FromBody] UpdateLegalItemStatusRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request?.Status))
                    return BadRequest(ApiResponse.Error("Status is required"));

                var userId = GetUserId();
                var journey = await _journeys.UpdateLegalAssessmentItemStatusAsync(userId, itemId, request.Status, ideaId);
                return Ok(ApiResponse.Ok("Status updated", journey.Phase3Data.LegalAssessment));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/legal-compliance/item/{itemId}/evidence
        [HttpPost("legal-compliance/item/{itemId}/evidence")]
        public async Task<IActionResult> AttachLegalEvidence(string itemId, [FromBody] AttachLegalItemEvidenceRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request?.DocumentId))
                    return BadRequest(ApiResponse.Error("DocumentId is required"));

                var userId = GetUserId();
                var journey = await _journeys.AttachLegalAssessmentItemEvidenceAsync(userId, itemId, request.DocumentId, request.Status, request.Notes, ideaId);
                return Ok(ApiResponse.Ok("Evidence attached", journey.Phase3Data.LegalAssessment));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/legal-compliance/item/{itemId}/evidence/unlink
        [HttpPost("legal-compliance/item/{itemId}/evidence/unlink")]
        public async Task<IActionResult> UnlinkLegalEvidence(string itemId, [FromBody] UnlinkLegalItemEvidenceRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request?.DocumentId))
                    return BadRequest(ApiResponse.Error("DocumentId is required"));

                var userId = GetUserId();
                var journey = await _journeys.UnlinkLegalAssessmentItemEvidenceAsync(userId, itemId, request.DocumentId, ideaId);
                return Ok(ApiResponse.Ok("Evidence unlinked", journey.Phase3Data.LegalAssessment));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/legal-compliance/evidence/{linkId}/status
        [HttpPatch("legal-compliance/evidence/{linkId}/status")]
        public async Task<IActionResult> UpdateLegalEvidenceStatus(string linkId, [FromBody] UpdateEvidenceStatusRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request?.Status))
                    return BadRequest(ApiResponse.Error("Status is required"));

                var userId = GetUserId();
                var journey = await _journeys.UpdateLegalEvidenceStatusAsync(userId, linkId, request.Status, request.Notes, ideaId);
                return Ok(ApiResponse.Ok("Evidence status updated", journey.Phase3Data.LegalAssessment));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/legal-compliance/evidence/replace
        [HttpPost("legal-compliance/evidence/replace")]
        public async Task<IActionResult> ReplaceLegalEvidence([FromBody] ReplaceLegalEvidenceRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request?.OldLinkId) || string.IsNullOrWhiteSpace(request?.NewDocumentId))
                    return BadRequest(ApiResponse.Error("OldLinkId and NewDocumentId are required"));

                var userId = GetUserId();
                var journey = await _journeys.ReplaceLegalEvidenceAsync(userId, request.OldLinkId, request.NewDocumentId, request.Notes, ideaId);
                return Ok(ApiResponse.Ok("Evidence replaced", journey.Phase3Data.LegalAssessment));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // GET /api/creator/legal-compliance/section-12
        [HttpGet("legal-compliance/section-12")]
        public async Task<IActionResult> GetBusinessPlanSection12([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var j = await _journeys.GetOrCreateAsync(userId);
                CreatorIdea? idea = null;
                if (!string.IsNullOrEmpty(ideaId))
                {
                    if (_ideas != null)
                    {
                        idea = await _ideas.GetOwnedAsync(ideaId, userId);
                    }
                    if (idea == null)
                    {
                        return NotFound(ApiResponse.Error("Venture idea not found or access denied"));
                    }
                }
                else if (_ideas != null)
                {
                    var ideas = await _ideas.ListByUserAsync(userId);
                    idea = ideas.FirstOrDefault(i => string.Equals(i.Status, "active", StringComparison.OrdinalIgnoreCase)) ?? ideas.FirstOrDefault();
                }

                if (idea == null)
                    return NotFound(ApiResponse.Error("Venture idea not found"));

                var assessment = idea.Phase3Data?.LegalAssessment;
                var currentProfile = await ExtractCurrentBusinessProfileAsync(userId, idea);

                if (assessment == null)
                {
                    var newAssessment = _legalEngine.Evaluate(idea.Id, userId, currentProfile);
                    newAssessment.PlanningReadinessPct = _legalEngine.ComputePlanningReadiness(newAssessment.Items);
                    idea.Phase3Data ??= new CreatorPhase3Data();
                    idea.Phase3Data.LegalAssessment = newAssessment;
                    assessment = newAssessment;
                }
                else
                {
                    var staleMeta = _legalEngine.CheckFreshness(assessment, currentProfile, _rulesCatalog.RulesVersion, _rulesCatalog.Jurisdiction, _rulesCatalog.RulesFingerprint);
                    assessment.StaleMetadata = staleMeta;
                    assessment.IsPotentiallyOutdated = staleMeta.IsStale;
                }

                var catalog = _rulesCatalog.GetCatalog();
                var dto = _sectionBuilder.Build(assessment, idea, catalog);

                // Manual edit protection: If founder manually edited Section 12 narrative, preserve it!
                if (!string.IsNullOrEmpty(idea.Phase3Data?.BusinessPlanSessionId) && _businessPlans != null)
                {
                    var bpSession = await _businessPlans.GetOwnedAsync(idea.Phase3Data.BusinessPlanSessionId, userId);
                    var activeVersion = bpSession?.Versions.LastOrDefault(v => v.Version == bpSession.CurrentVersion)
                                       ?? bpSession?.Versions.LastOrDefault();
                    if (activeVersion != null && activeVersion.IsEdited && activeVersion.Content != null)
                    {
                        if (activeVersion.Content.TryGetValue("legalFramework", out var lfVal) && lfVal.IsBsonDocument)
                        {
                            var lfDoc = lfVal.AsBsonDocument;
                            if (lfDoc.TryGetValue("summary", out var customSummary) && !string.IsNullOrWhiteSpace(customSummary.AsString))
                            {
                                dto.Summary = customSummary.AsString;
                            }
                        }
                    }
                }

                return Ok(ApiResponse.Ok("Section 12 retrieved", dto));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // GET /api/creator/phase-3/freshness
        [HttpGet("phase-3/freshness")]
        public async Task<IActionResult> GetPhase3Freshness([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _journeys.ResolveIdeaAsync(userId, ideaId);
                var p3 = idea.Phase3Data ?? new CreatorPhase3Data();

                var currentProfile = await ExtractCurrentBusinessProfileAsync(userId, idea);
                var staleMeta = _legalEngine.CheckFreshness(p3.LegalAssessment, currentProfile, _rulesCatalog.RulesVersion, _rulesCatalog.Jurisdiction, _rulesCatalog.RulesFingerprint);

                var freshness = new Phase3FreshnessOverviewDto
                {
                    LegalIsStale = staleMeta.IsStale,
                    LegalStaleReason = staleMeta.StaleReason,
                    LegalStaleMetadata = staleMeta,
                    Section12IsStale = staleMeta.IsStale
                };

                // Forecast & TAM freshness check
                decimal? marketStudyTam = null;
                if (!string.IsNullOrEmpty(p3.MarketStudySessionId) && _marketStudies != null)
                {
                    var msSession = await _marketStudies.GetOwnedAsync(p3.MarketStudySessionId, userId);
                    var msContent = msSession?.Versions.LastOrDefault(v => v.Version == msSession.CurrentVersion)?.Content
                                 ?? msSession?.Versions.LastOrDefault()?.Content;
                    if (msContent != null && msContent.TryGetValue("marketSizing", out var msVal) && msVal.IsBsonDocument)
                    {
                        var sizing = msVal.AsBsonDocument;
                        if (sizing.TryGetValue("tam", out var tamVal) && tamVal.IsBsonDocument)
                        {
                            var tamDoc = tamVal.AsBsonDocument;
                            if (tamDoc.TryGetValue("value", out var v) && v.IsNumeric)
                            {
                                marketStudyTam = (decimal)v.ToDouble();
                            }
                        }
                    }
                }
                freshness.MarketStudyTam = marketStudyTam;

                if (!string.IsNullOrEmpty(p3.ForecastSessionId) && _forecasts != null)
                {
                    var fcSession = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
                    if (fcSession?.Inputs?.Tam != null)
                    {
                        freshness.ForecastTam = (decimal)fcSession.Inputs.Tam.Value;
                        if (marketStudyTam != null && Math.Abs((decimal)fcSession.Inputs.Tam.Value - marketStudyTam.Value) > 1.0m)
                        {
                            freshness.IsTamOverridden = true;
                        }
                    }

                    // Check if business model was updated after forecast was created
                    if (!string.IsNullOrEmpty(p3.BusinessModelSessionId) && _businessModels != null)
                    {
                        var bmSession = await _businessModels.GetOwnedAsync(p3.BusinessModelSessionId, userId);
                        if (bmSession != null && fcSession != null && bmSession.UpdatedAt > fcSession.UpdatedAt.AddMinutes(2))
                        {
                            freshness.ForecastNeedsReview = true;
                            freshness.ForecastReviewReason = "Business model canvas was modified after financial forecast was generated.";
                        }
                    }
                }

                // Business Plan stale sections check
                var staleSections = new List<string>();
                if (!string.IsNullOrEmpty(p3.BusinessPlanSessionId) && _businessPlans != null)
                {
                    var bpSession = await _businessPlans.GetOwnedAsync(p3.BusinessPlanSessionId, userId);
                    var activeBpVersion = bpSession?.Versions.LastOrDefault(v => v.Version == bpSession.CurrentVersion)
                                         ?? bpSession?.Versions.LastOrDefault();
                    if (activeBpVersion != null)
                    {
                        freshness.Section12HasUserEdits = activeBpVersion.IsEdited;

                        // Check Forecast -> Section 07
                        if (!string.IsNullOrEmpty(p3.ForecastSessionId) && _forecasts != null)
                        {
                            var fcSession = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
                            if (fcSession != null && fcSession.UpdatedAt > activeBpVersion.UpdatedAt.AddMinutes(2))
                            {
                                staleSections.Add("Section 07");
                            }
                        }

                        // Check Formation -> Section 08
                        var formation = p3.FormationGenerator;
                        if (formation != null && idea.UpdatedAt > activeBpVersion.UpdatedAt.AddMinutes(2))
                        {
                            staleSections.Add("Section 08");
                        }

                        // Check Legal -> Section 12
                        if (staleMeta.IsStale || (p3.LegalAssessment != null && p3.LegalAssessment.EvaluatedAt > activeBpVersion.UpdatedAt.AddMinutes(2)))
                        {
                            staleSections.Add("Section 12");
                        }
                    }
                }
                freshness.BusinessPlanStaleSections = staleSections;
                freshness.BusinessPlanIsStale = staleSections.Count > 0;

                // Investor Readiness freshness
                var ir = p3.InvestorReadinessScore;
                if (ir != null && ir.EvaluatedAt.HasValue)
                {
                    var changedSources = new List<string>();
                    if (p3.LegalAssessment != null && p3.LegalAssessment.EvaluatedAt > ir.EvaluatedAt.Value.AddMinutes(1))
                        changedSources.Add("Legal & Compliance");
                    if (!string.IsNullOrEmpty(p3.ForecastSessionId) && _forecasts != null)
                    {
                        var fc = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
                        if (fc != null && fc.UpdatedAt > ir.EvaluatedAt.Value.AddMinutes(1))
                            changedSources.Add("Financial Forecast");
                    }
                    if (!string.IsNullOrEmpty(p3.BusinessPlanSessionId) && _businessPlans != null)
                    {
                        var bp = await _businessPlans.GetOwnedAsync(p3.BusinessPlanSessionId, userId);
                        if (bp != null && bp.UpdatedAt > ir.EvaluatedAt.Value.AddMinutes(1))
                            changedSources.Add("Executive Business Plan");
                    }
                    if (changedSources.Count > 0)
                    {
                        freshness.ReadinessUpdateAvailable = true;
                        freshness.ReadinessChangedSources = changedSources;
                    }
                }

                freshness.AnyStale = freshness.LegalIsStale || freshness.ForecastNeedsReview || freshness.BusinessPlanIsStale || freshness.ReadinessUpdateAvailable;

                return Ok(ApiResponse.Ok("Freshness overview", freshness));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        private async Task<LegalBusinessProfile> ExtractCurrentBusinessProfileAsync(string userId, CreatorIdea idea)
        {
            var p3 = idea.Phase3Data ?? new CreatorPhase3Data();

            BsonDocument? bmContent = null;
            if (!string.IsNullOrEmpty(p3.BusinessModelSessionId) && _businessModels != null)
            {
                var bmSession = await _businessModels.GetOwnedAsync(p3.BusinessModelSessionId, userId);
                bmContent = bmSession?.Versions.LastOrDefault(v => v.Version == bmSession.CurrentVersion)?.Content
                            ?? bmSession?.Versions.LastOrDefault()?.Content;
            }

            BsonDocument? msContent = null;
            if (!string.IsNullOrEmpty(p3.MarketStudySessionId) && _marketStudies != null)
            {
                var msSession = await _marketStudies.GetOwnedAsync(p3.MarketStudySessionId, userId);
                msContent = msSession?.Versions.LastOrDefault(v => v.Version == msSession.CurrentVersion)?.Content
                            ?? msSession?.Versions.LastOrDefault()?.Content;
            }

            BsonDocument? fcContent = null;
            if (!string.IsNullOrEmpty(p3.ForecastSessionId))
            {
                var fcSession = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
                fcContent = fcSession?.Versions.LastOrDefault(v => v.Version == fcSession.CurrentVersion)?.Content
                            ?? fcSession?.Versions.LastOrDefault()?.Content;
            }

            return _profileClassifier.Classify(idea.Project, bmContent, msContent, fcContent);
        }

        // ========================= MODULE 3.4 — FORMATION GENERATOR =========================

        // POST /api/creator/ai/formation-generator/start
        [HttpPost("ai/formation-generator/start")]
        public async Task<IActionResult> GenerateFormation([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced cross-phase reads
                var p = journey.Project ?? new CreatorJourneyProject();
                var p3 = journey.Phase3Data ?? new CreatorPhase3Data();

                bool isFinTech = string.Equals(p.Sector, "FinTech", StringComparison.OrdinalIgnoreCase) ||
                    FinTechKeywords.Any(k => (p.Solution ?? "").Contains(k, StringComparison.OrdinalIgnoreCase)) ||
                    (p3.LegalAssessment?.Items?.Any(i => i.Badge == "fintech" && i.EvaluationStatus == ApplicabilityEvaluationStatuses.Applicable) ?? false);

                // Derive founder team structure strictly from Phase 2 / Step 3.5 inputs (never future Phase 4/5)
                bool lookingForCofounder = !string.IsNullOrEmpty(p3.FormationGenerator?.CofounderDraft?.RoleNeeded);
                bool hasCofounderGaps = p3.FormationGenerator?.YouNeed?.Any(g =>
                    (g.Label ?? "").Contains("Co-Founder", StringComparison.OrdinalIgnoreCase) ||
                    (g.Label ?? "").Contains("Partner", StringComparison.OrdinalIgnoreCase)) ?? false;
                bool teamKeyword = ((p.CreatorEdge ?? "") + " " + (p.Solution ?? "")).ToLowerInvariant() is var teamBlob &&
                    (teamBlob.Contains("co-founder") || teamBlob.Contains("founding team") || teamBlob.Contains("partners"));

                bool soloFounder = !lookingForCofounder && !hasCofounderGaps && !teamKeyword;

                bool familyRetail = ((p.Sector ?? "") + " " + (p.Concept ?? "")).ToLowerInvariant() is var blob &&
                                    (blob.Contains("family") || blob.Contains("retail"));

                // Funding signal derived from forecast / project keywords / equity offer (never future Phase 5)
                bool fundingKeywords = ((p.Concept ?? "") + " " + (p.Solution ?? "") + " " + (p.RiskiestAssumption ?? ""))
                    .ToLowerInvariant() is var fundBlob &&
                    (fundBlob.Contains("investor") || fundBlob.Contains("venture capital") || fundBlob.Contains("fundrais") || fundBlob.Contains("seed round"));
                bool equityOffered = !string.IsNullOrEmpty(p3.FormationGenerator?.CofounderDraft?.EquityRange) &&
                    p3.FormationGenerator.CofounderDraft.EquityRange != "< 5%";
                bool hasInvestors = fundingKeywords || equityOffered;

                // Only a completed, owner-scoped forecast can influence formation. The
                // stored inputs are creator data; the current output is the version the
                // creator sees on the Forecast page.
                ForecastSession forecast = null;
                if (!string.IsNullOrWhiteSpace(p3.ForecastSessionId))
                {
                    var candidate = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
                    if (candidate != null && AiSessionSuccess.IsComplete(candidate.Status, candidate.CurrentVersion))
                        forecast = candidate;
                }

                var forecastBasis = forecast == null ? null : new CreatorFormationForecastBasis
                {
                    ForecastSessionId = forecast.Id,
                    MonthlyGrowthPct = forecast.Inputs?.MonthlyGrowthPct,
                    Tam = forecast.Inputs?.Tam,
                    Opex = forecast.Inputs?.Opex,
                    BreakEvenMonth = ForecastBreakEvenMonth(forecast),
                    Currency = ForecastCurrency(forecast),
                    ForecastUpdatedAt = forecast.UpdatedAt,
                };

                // Reuse the established >100M TAM tier from CreatorScoring and add a
                // documented 10% monthly-growth scale signal. These signals refine the
                // recommendation; they never claim to determine statutory legal facts.
                bool forecastSupportsScale =
                    (forecastBasis?.Tam ?? 0) > 100_000_000 ||
                    (forecastBasis?.MonthlyGrowthPct ?? 0) >= 10;

                string recommendedType;
                string recommendationReason;
                if (isFinTech)
                {
                    recommendedType = "SAS";
                    recommendationReason = "SAS is the starting suggestion because the venture is in or adjacent to FinTech, where flexible governance is commonly useful.";
                }
                else if (hasInvestors)
                {
                    recommendedType = "SAS";
                    recommendationReason = "SAS is the starting suggestion because the funding strategy includes external investment or equity capitalization and benefits from flexible governance.";
                }
                else if (forecastSupportsScale)
                {
                    recommendedType = "SAS";
                    recommendationReason = "SAS is the starting suggestion because the completed forecast indicates a high-growth or large-market venture.";
                }
                else if (soloFounder)
                {
                    recommendedType = "SAS-U";
                    recommendationReason = "SAS-U is the starting suggestion because the venture profile operates with a single founder.";
                }
                else if (familyRetail)
                {
                    recommendedType = "SARL";
                    recommendationReason = "SARL is the starting suggestion because the venture profile indicates a family or retail operating model.";
                }
                else
                {
                    recommendedType = "SAS";
                    recommendationReason = "SAS is the general starting suggestion based on the multi-member team and venture profile.";
                }

                recommendationReason += ForecastSummary(forecastBasis);

                // Build discrete recommendation factors so the founder can inspect the exact inputs driving the suggestion
                var factors = new List<FormationRecommendationFactor>();

                // 1. Industry / Sector factor
                if (isFinTech)
                {
                    factors.Add(new FormationRecommendationFactor
                    {
                        Category = "Industry & Regulation",
                        Signal = $"Sector: {p.Sector ?? "FinTech"} (Regulated domain)",
                        Implication = "Favors SAS for statutory flexibility, multi-tier governance, and investor credibility."
                    });
                }
                else if (!string.IsNullOrWhiteSpace(p.Sector))
                {
                    factors.Add(new FormationRecommendationFactor
                    {
                        Category = "Industry Sector",
                        Signal = $"Sector: {p.Sector}",
                        Implication = familyRetail ? "Favors SARL for traditional/retail commercial model." : "Standard commercial framework."
                    });
                }

                // 2. Growth Scale & TAM factor
                if (forecastBasis?.Tam.HasValue == true || forecastBasis?.MonthlyGrowthPct.HasValue == true)
                {
                    var parts = new List<string>();
                    if (forecastBasis.Tam.HasValue) parts.Add($"${forecastBasis.Tam.Value:N0} TAM");
                    if (forecastBasis.MonthlyGrowthPct.HasValue) parts.Add($"{forecastBasis.MonthlyGrowthPct.Value}% monthly growth");
                    factors.Add(new FormationRecommendationFactor
                    {
                        Category = "Market Scale & Growth",
                        Signal = string.Join(" · ", parts),
                        Implication = forecastSupportsScale
                            ? "High-scale growth trajectory strongly aligns with SAS equity & capitalization flexibility."
                            : "Moderate scale trajectory accommodates flexible entity setups."
                    });
                }

                // 3. Capital & Funding Strategy factor
                if (hasInvestors)
                {
                    factors.Add(new FormationRecommendationFactor
                    {
                        Category = "Capital & Funding Strategy",
                        Signal = equityOffered ? $"Targeting equity distribution ({p3.FormationGenerator?.CofounderDraft?.EquityRange})" : "Targeting external investment / equity capitalization",
                        Implication = "Favors SAS due to multiple share classes, preferred equity, and investor expectations."
                    });
                }
                else
                {
                    factors.Add(new FormationRecommendationFactor
                    {
                        Category = "Capital & Funding Strategy",
                        Signal = "Bootstrapped / self-funded baseline",
                        Implication = "Compatible with simplified single-member SAS-U or traditional SARL."
                    });
                }

                // 4. Team & Governance Structure factor
                if (soloFounder)
                {
                    factors.Add(new FormationRecommendationFactor
                    {
                        Category = "Founding Team & Governance",
                        Signal = "Solo founder (single initial shareholder)",
                        Implication = "Permits SAS-U (simplified single-shareholder) with frictionless transition to SAS as team expands."
                    });
                }
                else
                {
                    factors.Add(new FormationRecommendationFactor
                    {
                        Category = "Founding Team & Governance",
                        Signal = "Multi-member founding team / planned hiring",
                        Implication = "Requires multi-shareholder entity (SAS or SARL) with shareholder agreements."
                    });
                }

                // youHave — deterministic keyword extraction from creatorEdge.
                // TODO: swap to IAiProvider for a smarter parse when model-router is ready.
                var youHave = ExtractStrengths(p.CreatorEdge);

                // youNeed — deterministic gap checks.
                var youNeed = new List<CreatorSkillGap>();
                var edgeBlob = ((p.CreatorEdge ?? "") + " " + (p.Solution ?? "")).ToLowerInvariant();
                if (!edgeBlob.Contains("develop") && !edgeBlob.Contains("engineer") && !edgeBlob.Contains("technical"))
                    youNeed.Add(new() { Label = "Full-stack Developer", SpSpecialty = "development" });
                if ((p3.LegalChecklist?.CompletedCount ?? 0) < 4)
                    youNeed.Add(new() { Label = "Legal Specialist", SpSpecialty = "legal" });
                if (p.Branding?.BrandingMethod == "pending")
                    youNeed.Add(new() { Label = "Brand Designer", SpSpecialty = "branding" });
                if (!edgeBlob.Contains("financ") && !edgeBlob.Contains("account"))
                    youNeed.Add(new() { Label = "Financial Advisor", SpSpecialty = "finance" });

                // SP matching per need — top 3 each, reuse shared formula.
                var matchedSpIds = new List<string>();
                foreach (var need in youNeed)
                {
                    var cat = SpecialtyToCategory(need.SpSpecialty);
                    if (cat == null) continue;
                    var matches = await _spMatching.MatchAsync(cat.Value, p.Sector ?? "", 3);
                    if (matches != null)
                        matchedSpIds.AddRange(matches.Select(m => m.User.Id.ToString()));
                }

                // CLOBBER GUARD (direction A): once the creator has self-declared skills on
                // 3.5b, never overwrite YouHave/YouNeed/MatchedSpIds with the rule-based echo —
                // preserve their declarations. RecommendedType is always refreshed (the type
                // suggestion and the declared skills are deliberately decoupled).
                var existingF = journey.Phase3Data?.FormationGenerator;
                bool declared = existingF?.SkillsDeclared == true;
                bool isOverride = !string.IsNullOrEmpty(existingF?.SelectedType) &&
                                  !string.Equals(existingF.SelectedType, recommendedType, StringComparison.OrdinalIgnoreCase);

                var formation = new CreatorFormationGenerator
                {
                    RecommendedType = recommendedType,
                    RecommendationReason = recommendationReason,
                    RecommendationFactors = factors,
                    ForecastBasis = forecastBasis,
                    Options = FormationOptions(),
                    YouHave = declared ? existingF.YouHave : youHave,
                    YouNeed = declared ? existingF.YouNeed : youNeed,
                    MatchedSpIds = declared ? existingF.MatchedSpIds : matchedSpIds.Distinct().ToList(),
                    SelectedType = existingF?.SelectedType,
                    IsOverride = isOverride,
                    SkillsDeclared = declared,
                    CofounderDraft = existingF?.CofounderDraft,
                };

                journey = await _journeys.SetFormationAsync(userId, formation, ideaId);
                return Ok(ApiResponse.Ok("Formation generated", journey.Phase3Data.FormationGenerator));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/formation/select-type
        [HttpPatch("formation/select-type")]
        public async Task<IActionResult> SelectFormationType([FromBody] SelectFormationTypeRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.SelectFormationTypeAsync(userId, request?.SelectedType, ideaId);
                return Ok(ApiResponse.Ok("Type selected", new
                {
                    formation = journey.Phase3Data.FormationGenerator,
                    legalAssessment = journey.Phase3Data.LegalAssessment,
                    legalChecklist = journey.Phase3Data.LegalChecklist ?? (journey.Phase3Data.LegalAssessment != null ? new CreatorLegalChecklist { Items = journey.Phase3Data.LegalAssessment.Items } : null),
                }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/formation/skills — 3.5b: persist self-declared skills, derive the
        // SP-backed gaps deterministically (no AI), match specialists, and store the optional
        // co-founder DRAFT (matched at Level Up, never here). Requires a generated formation.
        [HttpPatch("formation/skills")]
        public async Task<IActionResult> DeclareFormationSkills([FromBody] DeclareFormationSkillsRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var declared = (request?.YouHave ?? new List<string>())
                    .Where(DeclarableSkills.Contains).Distinct().ToList();

                // youNeed = SP-backed baseline minus declared. Every gap maps to a real specialty.
                var youNeed = new List<CreatorSkillGap>();
                foreach (var (skill, specialty, label) in GapBaseline)
                    if (!declared.Contains(skill, StringComparer.OrdinalIgnoreCase))
                        youNeed.Add(new() { Label = label, SpSpecialty = specialty });

                // Match SPs per gap — reuse the P1.6 formula, top 3 each.
                var journey0 = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced sector
                var sector = journey0.Project?.Sector ?? "";
                var matchedSpIds = new List<string>();
                foreach (var need in youNeed)
                {
                    var cat = SpecialtyToCategory(need.SpSpecialty);
                    if (cat == null) continue;
                    var matches = await _spMatching.MatchAsync(cat.Value, sector, 3);
                    matchedSpIds.AddRange(matches.Select(m => m.User.Id.ToString()));
                }

                CreatorCofounderDraft cofounder = request?.Cofounder == null ? null : new CreatorCofounderDraft
                {
                    RoleNeeded = request.Cofounder.RoleNeeded,
                    EquityRange = request.Cofounder.EquityRange,
                    LocationPreference = request.Cofounder.LocationPreference,
                };

                var journey = await _journeys.DeclareFormationSkillsAsync(
                    userId, declared, youNeed, matchedSpIds.Distinct().ToList(), cofounder, ideaId);
                return Ok(ApiResponse.Ok("Skills declared", journey.Phase3Data.FormationGenerator));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ========================= SHARED — SP list + workroom (Find SP) =========================

        // GET /api/creator/sp-matches?specialty=legal|compliance|finance|development|branding
        [HttpGet("sp-matches")]
        public async Task<IActionResult> SpMatches([FromQuery] string specialty, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var cat = SpecialtyToCategory(specialty);
                if (cat == null) return BadRequest(ApiResponse.Error("Unknown specialty."));

                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced sector
                var matches = await _spMatching.MatchAsync(cat.Value, journey.Project?.Sector ?? "", 5);

                var dtos = matches.Select(m => new
                {
                    spId = m.User.Id.ToString(),
                    name = m.User.Name,
                    title = string.IsNullOrWhiteSpace(m.Professional?.Headline)
                        ? (m.User.Title ?? specialty) : m.Professional.Headline,
                    tier = m.User.Tier_level,
                    location = m.User.Geography ?? m.User.Address?.City ?? "—",
                }).ToList();

                return Ok(ApiResponse.Ok("OK", dtos));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/workroom/open  { spId, context }
        // Generic Find-SP workroom (no branding side-effects). Reuses the chat infra.
        [HttpPost("workroom/open")]
        public async Task<IActionResult> OpenWorkroom([FromBody] OpenWorkroomRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrWhiteSpace(request?.SpId) || !Guid.TryParse(request.SpId, out var spGuid))
                    return BadRequest(ApiResponse.Error("Valid spId is required."));
                if (!Guid.TryParse(userId, out var creatorGuid))
                    return StatusCode(403, ApiResponse.Error("Invalid user."));

                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced brief
                var p = journey.Project ?? new CreatorJourneyProject();

                ObjectId? ideaOid = ObjectId.TryParse(ideaId, out var parsedOid) ? parsedOid : null;
                var contextTag = string.IsNullOrWhiteSpace(request?.Context) ? "general" : request.Context.Trim();
                var (conversation, created) = await _chat.GetOrCreateConversation(creatorGuid, spGuid, ideaOid, $"CreatorSpecialist:{contextTag}");
                if (created)
                {
                    var brief =
                        $"📋 Specialist request{(string.IsNullOrWhiteSpace(request?.Context) ? "" : $" — {request.Context}")}\n" +
                        $"Creator idea: {ideaId}\n" +
                        $"Project: {(string.IsNullOrWhiteSpace(p.Name) ? "(unnamed)" : p.Name)}\n" +
                        $"Sector: {(string.IsNullOrWhiteSpace(p.Sector) ? "—" : p.Sector)}";
                    await _chat.AddMessage(new ChatMessage
                    {
                        ConversationId = conversation.Id,
                        SenderId = creatorGuid,
                        Message = brief,
                        MessageType = "Text",
                    });
                }

                var workroomId = conversation.Id.ToString();
                return Ok(ApiResponse.Ok("Workroom opened", new { workroomId, conversationId = workroomId }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ========================= PHASE 3 SESSIONS + COMPLETION =========================

        // POST /api/creator/journey/phase3/session  { kind: "forecast"|"businessPlan", sessionId }
        [HttpPost("journey/phase3/session")]
        public async Task<IActionResult> SetPhase3Session([FromBody] Phase3SessionRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.SetPhase3SessionAsync(userId, request?.Kind, request?.SessionId, ideaId);
                return Ok(ApiResponse.Ok("Session linked", journey.Phase3Data));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/masterplan/complete
        // Verifies all four modules, computes the investor-readiness score, stores it.
        // Status is NOT written — the derived engine flips Phase 3 to completed once
        // forecast + plan + legal + formation are all present.
        [HttpPatch("masterplan/complete")]
        public async Task<IActionResult> CompleteMasterplan([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced modules
                var p3 = journey.Phase3Data ?? new CreatorPhase3Data();

                // Both AI modules gate on the SHARED success predicate (Completed +
                // version) — the same rule the derived engine uses, so a Failed/
                // NeedsReview session can never earn a readiness score the engine
                // won't honor ("score renders, Launch disabled, no reason").
                ForecastSession forecast = null;
                if (!string.IsNullOrEmpty(p3.ForecastSessionId))
                    forecast = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
                if (forecast == null || !WebApp.Services.Ai.AiSessionSuccess.IsComplete(forecast.Status, forecast.CurrentVersion))
                    return UnprocessableEntity(ApiResponse.Error("Missing module: financial_forecast"));

                BusinessPlanSession plan = null;
                if (!string.IsNullOrEmpty(p3.BusinessPlanSessionId))
                    plan = await _businessPlans.GetOwnedAsync(p3.BusinessPlanSessionId, userId);
                if (plan == null || !WebApp.Services.Ai.AiSessionSuccess.IsComplete(plan.Status, plan.CurrentVersion))
                    return UnprocessableEntity(ApiResponse.Error("Missing module: business_plan"));

                if (p3.FormationGenerator == null)
                    return UnprocessableEntity(ApiResponse.Error("Missing module: formation_generator"));

                // New journey completion must include Legal; legacy bypass only for legacy records.
                bool isLegacyRecord = string.IsNullOrEmpty(p3.MarketStudySessionId) &&
                                      string.IsNullOrEmpty(p3.BusinessModelSessionId);

                bool legalPresent = p3.LegalAssessment != null || p3.LegalChecklist != null;
                if (!isLegacyRecord && !legalPresent)
                {
                    return UnprocessableEntity(ApiResponse.Error("Missing module: legal_compliance"));
                }

                var score = ComputeReadiness(journey, forecast);
                journey = await _journeys.SetInvestorReadinessAsync(userId, score, ideaId);

                return Ok(ApiResponse.Ok("Masterplan complete", new
                {
                    investorReadinessScore = score,
                    // status intentionally omitted — derived by the engine on next GET.
                }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // 5-dimension weighted investor-readiness score (0–100).
        //  ConceptClarity 20 · MarketEvidence 20 · FinancialModel 25 · LegalReadiness 15 · TeamCredibility 20
        public static CreatorInvestorReadinessScore ComputeReadiness(CreatorJourney j, ForecastSession forecast)
        {
            var p = j.Project ?? new CreatorJourneyProject();
            var p3 = j.Phase3Data ?? new CreatorPhase3Data();

            // Concept Clarity (20)
            double conceptClarity = Math.Clamp(p.ClarityScore / 100.0, 0, 1) * 20;

            // Canonical TAM = the persisted forecast input (FG-2 unification). null when
            // no forecast yet → documented marketGap fallback inside the shared helper.
            double? tam = forecast?.Inputs?.Tam;

            // Market Evidence (20): Market Study & TAM +8 (canonical),
            // competitor research (plan) +6, specific target +6.
            bool hasMarketStudy = !string.IsNullOrEmpty(p3.MarketStudySessionId);
            double tamScore = 0;
            if (hasMarketStudy)
            {
                tamScore = tam.HasValue ? CreatorScoring.MarketEvidenceTamScore(tam, true) : 8.0;
            }

            double marketEvidence =
                tamScore +
                (!string.IsNullOrEmpty(p3.BusinessPlanSessionId) ? 6 : 0) +
                (!string.IsNullOrWhiteSpace(p.TargetUser) ? 6 : 0);

            // Financial Model (25): forecast +10, breakeven≤24 +8, LTV/CAC≥3 +7
            double financialModel = 10; // forecast completed is a precondition of this call
            try
            {
                var o = forecast.Versions?
                    .OrderByDescending(v => v.Version)
                    .FirstOrDefault()?.Content;
                if (o != null && o.TryGetValue("breakEvenAnalysis", out var be) && be.IsBsonDocument)
                {
                    var bm = be.AsBsonDocument.GetValue("breakEvenMonth", BsonNull.Value);
                    if (bm.IsNumeric && bm.ToDouble() <= 24) financialModel += 8;
                }
            }
            catch { /* tolerate malformed forecast output */ }
            // LTV/CAC +7 from REAL, churn-driven unit economics (LTV = ARPU/churn): the
            // sub-score now discriminates strong vs weak retention instead of being a
            // structural constant. No ARPU → 0; churn absent → documented 4% fallback.
            if (CreatorScoring.LtvCacHealthy(forecast?.Inputs?.Arpu, forecast?.Inputs?.MonthlyChurnPct)) financialModel += 7;

            // Legal Readiness (15): weighted deterministic Planning Readiness score (max 15 pts)
            double legalReadiness = 0;
            if (p3.LegalAssessment != null && p3.LegalAssessment.PlanningReadinessPct > 0)
                legalReadiness = (p3.LegalAssessment.PlanningReadinessPct / 100.0) * 15.0;
            else if (p3.LegalChecklist is { TotalCount: > 0 })
                legalReadiness = (double)p3.LegalChecklist.CompletedCount / p3.LegalChecklist.TotalCount * 15;

            // Team Credibility (20): founder edge +14, SP engaged +6
            double teamCredibility =
                (!string.IsNullOrWhiteSpace(p.CreatorEdge) ? 14 : 0) +
                (((p3.FormationGenerator?.MatchedSpIds?.Count ?? 0) > 0) || p.Branding?.BrandingMethod == "m50_designer" ? 6 : 0);

            double total = Math.Round(conceptClarity + marketEvidence + financialModel + legalReadiness + teamCredibility, 1);
            string label = total < 50 ? "Not Ready" : total < 70 ? "Developing" : total < 85 ? "Strong" : "Investor-Ready";

            // Build detailed component deductions for each dimension with screen remediation links
            var deductions = new List<CreatorReadinessDeduction>();

            // 1. Concept Clarity (Max 20)
            if (conceptClarity < 20)
            {
                var lost = Math.Round(20 - conceptClarity, 1);
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "ConceptClarity",
                    Issue = $"Idea clarity score ({p.ClarityScore}%) is below institutional threshold (100%).",
                    PointsLost = lost,
                    RemediationTitle = "Refine Concept in Idea Clarifier",
                    RemediationRoute = "/dashboard/creator/phase-2/clarifier",
                });
            }

            // 2. Market Evidence (Max 20)
            if (!hasMarketStudy)
            {
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "MarketEvidence",
                    Issue = "Step 3.1 Market Study and TAM/SAM/SOM analysis not completed.",
                    PointsLost = 8,
                    RemediationTitle = "Complete Market Intelligence",
                    RemediationRoute = "/dashboard/creator/phase-3/market-study",
                });
            }
            else if (tamScore < 8)
            {
                var lost = 8 - tamScore;
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "MarketEvidence",
                    Issue = tam == null
                        ? "No canonical TAM specified in market study."
                        : $"TAM (${tam:N0}) is below $100M venture-scale threshold.",
                    PointsLost = lost,
                    RemediationTitle = "Update Market Sizing in Market Study",
                    RemediationRoute = "/dashboard/creator/phase-3/market-study",
                });
            }
            if (string.IsNullOrEmpty(p3.BusinessPlanSessionId))
            {
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "MarketEvidence",
                    Issue = "Business plan and competitor research not synthesized.",
                    PointsLost = 6,
                    RemediationTitle = "Generate Business Plan",
                    RemediationRoute = "/dashboard/creator/phase-3/business-plan",
                });
            }
            if (string.IsNullOrWhiteSpace(p.TargetUser))
            {
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "MarketEvidence",
                    Issue = "Target customer profile is not explicitly defined.",
                    PointsLost = 6,
                    RemediationTitle = "Define Target Audience in Clarifier",
                    RemediationRoute = "/dashboard/creator/phase-2/clarifier",
                });
            }

            // 3. Financial Model (Max 25)
            bool reachedBreakEven = false;
            try
            {
                var o = forecast?.Versions?
                    .OrderByDescending(v => v.Version)
                    .FirstOrDefault()?.Content;
                if (o != null && o.TryGetValue("breakEvenAnalysis", out var be) && be.IsBsonDocument)
                {
                    var bm = be.AsBsonDocument.GetValue("breakEvenMonth", BsonNull.Value);
                    if (bm.IsNumeric && bm.ToDouble() <= 24) reachedBreakEven = true;
                }
            }
            catch { }

            if (!reachedBreakEven)
            {
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "FinancialModel",
                    Issue = "Break-even horizon exceeds 24 months in forecast projection.",
                    PointsLost = 8,
                    RemediationTitle = "Optimize Growth & OPEX in Forecast",
                    RemediationRoute = "/dashboard/creator/phase-3/forecast",
                });
            }

            bool ltvHealthy = CreatorScoring.LtvCacHealthy(forecast?.Inputs?.Arpu, forecast?.Inputs?.MonthlyChurnPct);
            if (!ltvHealthy)
            {
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "FinancialModel",
                    Issue = "LTV/CAC ratio is under 3.0x threshold (high churn or low ARPU).",
                    PointsLost = 7,
                    RemediationTitle = "Improve ARPU & Retention in Forecast",
                    RemediationRoute = "/dashboard/creator/phase-3/forecast",
                });
            }

            // 4. Legal Readiness (Max 15)
            if (legalReadiness < 15)
            {
                var lost = Math.Round(15 - legalReadiness, 1);
                string issue = p3.LegalAssessment != null
                    ? $"Legal & compliance planning readiness is at {p3.LegalAssessment.PlanningReadinessPct}% (below 100%)."
                    : p3.LegalChecklist != null && p3.LegalChecklist.TotalCount > 0
                        ? $"{p3.LegalChecklist.TotalCount - p3.LegalChecklist.CompletedCount} legal & compliance checklist items remain unverified."
                        : "Compliance checklist has not been generated or reviewed.";

                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "LegalReadiness",
                    Issue = issue,
                    PointsLost = lost,
                    RemediationTitle = "Complete Legal & Compliance Items",
                    RemediationRoute = "/dashboard/creator/phase-3/compliance",
                });
            }

            // 5. Team Credibility (Max 20)
            if (string.IsNullOrWhiteSpace(p.CreatorEdge))
            {
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "TeamCredibility",
                    Issue = "Founder unfair advantage or founder edge is not documented.",
                    PointsLost = 14,
                    RemediationTitle = "Articulate Founder Edge in Clarifier",
                    RemediationRoute = "/dashboard/creator/phase-2/clarifier",
                });
            }

            bool hasSpEngagement = ((p3.FormationGenerator?.MatchedSpIds?.Count ?? 0) > 0) || p.Branding?.BrandingMethod == "m50_designer";
            if (!hasSpEngagement)
            {
                deductions.Add(new CreatorReadinessDeduction
                {
                    Dimension = "TeamCredibility",
                    Issue = "No specialized partners or design providers engaged for venture gaps.",
                    PointsLost = 6,
                    RemediationTitle = "Review Skills & Match Specialists",
                    RemediationRoute = "/dashboard/creator/phase-3/formation",
                });
            }

            return new CreatorInvestorReadinessScore
            {
                Total = total,
                Label = label,
                Breakdown = new CreatorReadinessBreakdown
                {
                    ConceptClarity = Math.Round(conceptClarity, 1),
                    MarketEvidence = marketEvidence,
                    FinancialModel = financialModel,
                    LegalReadiness = Math.Round(legalReadiness, 1),
                    TeamCredibility = teamCredibility,
                },
                Deductions = deductions,
                EvaluatedAt = DateTime.UtcNow,
                UpdateAvailable = false,
                ChangedSources = new List<string>()
            };
        }

        // ---- helpers ----

        private static ServiceCategory? SpecialtyToCategory(string specialty) => specialty?.ToLowerInvariant() switch
        {
            "legal" => ServiceCategory.Legal,
            "compliance" => ServiceCategory.Legal, // no dedicated compliance category; legal covers it
            "finance" => ServiceCategory.Finance,
            "development" => ServiceCategory.Development,
            "branding" => ServiceCategory.Design,
            "design" => ServiceCategory.Design,
            _ => null,
        };

        // Deterministic strength extraction from creatorEdge.
        // TODO: swap to IAiProvider when model-router ready — keep this boundary stable.
        private static List<string> ExtractStrengths(string creatorEdge)
        {
            if (string.IsNullOrWhiteSpace(creatorEdge)) return new List<string>();
            var stop = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { "the","and","a","an","of","to","with","for","my","i","we","our","is","are","in","on","at","by" };
            return creatorEdge
                .Split(new[] { ' ', ',', '.', ';', '\n', '-' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(w => w.Length > 3 && !stop.Contains(w))
                .Select(w => char.ToUpperInvariant(w[0]) + w.Substring(1))
                .Distinct()
                .Take(6)
                .ToList();
        }
    }
}
