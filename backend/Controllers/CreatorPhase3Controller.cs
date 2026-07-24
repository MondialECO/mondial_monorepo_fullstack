using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using System.Security.Claims;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 3 deterministic modules: Legal Checklist (3.3) and Formation Generator
    /// (3.4). No AI session, no polling — pure server-side logic over the journey's
    /// sector + project data. Reads/writes CreatorJourneys.phase3Data; status stays
    /// derived. SP matching reuses the shared <see cref="ISpMatchingService"/> formula.
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

        public CreatorPhase3Controller(
            ICreatorJourneyService journeys, ISpMatchingService spMatching, IChatService chat,
            IForecastSessionStore forecasts, IBusinessPlanSessionStore businessPlans)
        {
            _journeys = journeys;
            _spMatching = spMatching;
            _chat = chat;
            _forecasts = forecasts;
            _businessPlans = businessPlans;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        private static readonly string[] FinTechKeywords = { "payment", "invoice", "billing", "transaction", "bank" };

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

        // ========================= MODULE 3.3 — LEGAL CHECKLIST =========================

        // POST /api/creator/ai/legal-checklist/generate
        [HttpPost("ai/legal-checklist/generate")]
        public async Task<IActionResult> GenerateLegalChecklist([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced sector/solution
                var p = journey.Project ?? new CreatorJourneyProject();

                bool isFinTech =
                    string.Equals(p.Sector, "FinTech", StringComparison.OrdinalIgnoreCase) ||
                    FinTechKeywords.Any(k => (p.Solution ?? "").Contains(k, StringComparison.OrdinalIgnoreCase));

                bool typeChosen = !string.IsNullOrEmpty(journey.Phase3Data?.FormationGenerator?.SelectedType);

                var items = new List<CreatorLegalChecklistItem>
                {
                    // 1–4 universal mandatory
                    new() { Id = "company-type", Label = "Company type selection", Category = "mandatory", Status = typeChosen ? "done" : "pending" },
                    new() { Id = "ip-protection", Label = "IP protection (copyright + trademark)", Category = "mandatory", ShowFindSp = true, SpSpecialty = "legal" },
                    new() { Id = "bank-account", Label = "Business bank account", Category = "mandatory" },
                    new() { Id = "trademark", Label = "Trademark registration (EUIPO)", Category = "mandatory", ShowFindSp = true, SpSpecialty = "legal" },
                    // 5–6 always
                    new() { Id = "gdpr", Label = "GDPR compliance", Category = "mandatory" },
                    new() { Id = "tos-privacy", Label = "Terms of Service + Privacy Policy", Category = "mandatory", AiGenerable = true },
                };

                if (isFinTech)
                {
                    // 7–8 FinTech-only
                    items.Add(new() { Id = "pci-dss", Label = "PCI DSS assessment", Category = "mandatory", Badge = "urgent", ShowFindSp = true, SpSpecialty = "compliance" });
                    items.Add(new() { Id = "fin-reg", Label = "Financial services regulatory check", Category = "mandatory", Badge = "fintech", ShowFindSp = true, SpSpecialty = "compliance" });
                }

                // Optional pool — fill to exactly 12.
                var optional = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "shareholder-agreement", Label = "Shareholder agreement", Category = "optional", ShowFindSp = true, SpSpecialty = "legal" },
                    new() { Id = "rgpd-article30", Label = "RGPD Article 30 register", Category = "optional" },
                    new() { Id = "employment-contracts", Label = "Employment contract templates", Category = "optional", AiGenerable = true },
                    new() { Id = "liability-insurance", Label = "Professional liability insurance", Category = "optional" },
                    new() { Id = "esop-pool", Label = "ESOP pool setup", Category = "optional", ShowFindSp = true, SpSpecialty = "legal" },
                    // Extra optional so non-FinTech still totals exactly 12 (pool was one short).
                    new() { Id = "dpa", Label = "Data processing agreement (DPA)", Category = "optional", ShowFindSp = true, SpSpecialty = "legal" },
                };
                foreach (var opt in optional)
                {
                    if (items.Count >= 12) break;
                    items.Add(opt);
                }

                var checklist = new CreatorLegalChecklist { Items = items };
                journey = await _journeys.SetLegalChecklistAsync(userId, checklist, ideaId);
                return Ok(ApiResponse.Ok("Legal checklist generated", journey.Phase3Data.LegalChecklist));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/legal-checklist/item/{itemId}
        [HttpPatch("legal-checklist/item/{itemId}")]
        public async Task<IActionResult> UpdateLegalItem(string itemId, [FromBody] UpdateChecklistItemRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.UpdateLegalChecklistItemAsync(userId, itemId, request?.Status, ideaId);
                return Ok(ApiResponse.Ok("Item updated", journey.Phase3Data.LegalChecklist));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
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
                var p4 = journey.Phase4Data ?? new CreatorPhase4Data();
                var p5 = journey.Phase5Data ?? new CreatorPhase5Data();

                bool isFinTech = string.Equals(p.Sector, "FinTech", StringComparison.OrdinalIgnoreCase) ||
                    FinTechKeywords.Any(k => (p.Solution ?? "").Contains(k, StringComparison.OrdinalIgnoreCase));
                bool hasInvestors = (p5.PathB?.SeedFunding?.TotalAsk ?? 0) > 0;
                bool soloFounder = (p4.ResourceCalculation?.TeamRequirements?.Count ?? 0) == 0;
                bool familyRetail = ((p.Sector ?? "") + " " + (p.Concept ?? "")).ToLowerInvariant() is var blob &&
                                    (blob.Contains("family") || blob.Contains("retail"));

                // Company-type decision tree (deterministic).
                string recommendedType =
                    isFinTech ? "SAS" :
                    hasInvestors ? "SAS" :
                    (soloFounder && !hasInvestors) ? "SAS-U" :
                    familyRetail ? "SARL" :
                    "SAS";

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
                    matchedSpIds.AddRange(matches.Select(m => m.User.Id.ToString()));
                }

                // CLOBBER GUARD (direction A): once the creator has self-declared skills on
                // 3.5b, never overwrite YouHave/YouNeed/MatchedSpIds with the rule-based echo —
                // preserve their declarations. RecommendedType is always refreshed (the type
                // suggestion and the declared skills are deliberately decoupled).
                var existingF = journey.Phase3Data?.FormationGenerator;
                bool declared = existingF?.SkillsDeclared == true;
                var formation = new CreatorFormationGenerator
                {
                    RecommendedType = recommendedType,
                    YouHave = declared ? existingF.YouHave : youHave,
                    YouNeed = declared ? existingF.YouNeed : youNeed,
                    MatchedSpIds = declared ? existingF.MatchedSpIds : matchedSpIds.Distinct().ToList(),
                    SelectedType = existingF?.SelectedType,
                    SkillsDeclared = declared,
                    CofounderDraft = existingF?.CofounderDraft,
                };

                journey = await _journeys.SetFormationAsync(userId, formation, ideaId);
                return Ok(ApiResponse.Ok("Formation generated", journey.Phase3Data.FormationGenerator));
            }
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
                    legalChecklist = journey.Phase3Data.LegalChecklist,
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
                    title = string.IsNullOrWhiteSpace(m.User.ServiceProviderProfile.Headline)
                        ? (m.User.Title ?? specialty) : m.User.ServiceProviderProfile.Headline,
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

                var (conversation, _) = await _chat.GetOrCreateConversation(creatorGuid, spGuid);
                var brief =
                    $"📋 Specialist request{(string.IsNullOrWhiteSpace(request.Context) ? "" : $" — {request.Context}")}\n" +
                    $"Project: {(string.IsNullOrWhiteSpace(p.Name) ? "(unnamed)" : p.Name)}\n" +
                    $"Sector: {(string.IsNullOrWhiteSpace(p.Sector) ? "—" : p.Sector)}";
                await _chat.AddMessage(new ChatMessage
                {
                    ConversationId = conversation.Id,
                    SenderId = creatorGuid,
                    Message = brief,
                    MessageType = "Text",
                });

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

                // Legal module = every mandatory checklist item Done (canon), not mere
                // presence. Same predicate as the derivation engine so the two cannot drift.
                if (!CreatorLegalChecklist.MandatoryItemsDone(p3.LegalChecklist))
                    return UnprocessableEntity(ApiResponse.Error("Missing module: legal_checklist"));
                if (p3.FormationGenerator == null)
                    return UnprocessableEntity(ApiResponse.Error("Missing module: formation_generator"));

                var score = ComputeReadiness(journey, forecast);
                journey = await _journeys.SetInvestorReadinessAsync(userId, score, ideaId);

                return Ok(ApiResponse.Ok("Masterplan complete", new
                {
                    investorReadinessScore = score,
                    // status intentionally omitted — derived by the engine on next GET.
                }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // 5-dimension weighted investor-readiness score (0–100).
        //  ConceptClarity 20 · MarketEvidence 20 · FinancialModel 25 · LegalReadiness 15 · TeamCredibility 20
        private static CreatorInvestorReadinessScore ComputeReadiness(CreatorJourney j, ForecastSession forecast)
        {
            var p = j.Project ?? new CreatorJourneyProject();
            var p3 = j.Phase3Data ?? new CreatorPhase3Data();

            // Concept Clarity (20)
            double conceptClarity = Math.Clamp(p.ClarityScore / 100.0, 0, 1) * 20;

            // Canonical TAM = the persisted forecast input (FG-2 unification). null when
            // no forecast yet → documented marketGap fallback inside the shared helper.
            double? tam = forecast?.Inputs?.Tam;

            // Market Evidence (20): TAM +8 (canonical, same tiers as IP valuation),
            // competitor research (plan) +6, specific target +6.
            double marketEvidence =
                CreatorScoring.MarketEvidenceTamScore(tam, !string.IsNullOrWhiteSpace(p.MarketGap)) +
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

            // Legal Readiness (15): completed/total × 15
            double legalReadiness = 0;
            if (p3.LegalChecklist is { TotalCount: > 0 })
                legalReadiness = (double)p3.LegalChecklist.CompletedCount / p3.LegalChecklist.TotalCount * 15;

            // Team Credibility (20): founder edge +14, SP engaged +6
            double teamCredibility =
                (!string.IsNullOrWhiteSpace(p.CreatorEdge) ? 14 : 0) +
                (((p3.FormationGenerator?.MatchedSpIds?.Count ?? 0) > 0) || p.Branding?.BrandingMethod == "m50_designer" ? 6 : 0);

            double total = Math.Round(conceptClarity + marketEvidence + financialModel + legalReadiness + teamCredibility, 1);
            string label = total < 50 ? "Not Ready" : total < 70 ? "Developing" : total < 85 ? "Strong" : "Investor-Ready";

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
