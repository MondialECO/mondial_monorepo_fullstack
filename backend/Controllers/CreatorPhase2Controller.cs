using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MongoDB.Bson;
using MongoDB.Driver;
using StackExchange.Redis;
using System.Security.Claims;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 2 (Project Identity) orchestration on top of the journey store and the
    /// existing C-2 clarifier session. Discovery path removed — only the clarifier
    /// flow exists. Chat transcript + branding persist to CreatorJourneys so an
    /// abandoned session resumes from the backend, not local-only state.
    /// </summary>
    [Route("api/creator/journey/phase2")]
    [ApiController]
    [Authorize]
    public class CreatorPhase2Controller : ControllerBase
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IClarifierSessionStore _clarifier;
        private readonly SaveFile _saveFile;
        private readonly IConnectionMultiplexer? _redis;

        // The conversational clarifier asks six focused questions. The script lives
        // here; the underlying C-2 session contract is unchanged.
        private static readonly string[] Questions =
        {
            "In one sentence, what problem are you solving?",
            "Who feels this problem most acutely — describe your target user.",
            "How do they cope today? What are the existing alternatives?",
            "What's your proposed solution, in a sentence or two?",
            "What makes your approach different or better?",
            "What's the single riskiest assumption you're making?",
        };

        private readonly MongoDbContext _context;
        private readonly IChatService _chat;
        private readonly ISpMatchingService _spMatching;

        public CreatorPhase2Controller(
            ICreatorJourneyService journeys,
            IClarifierSessionStore clarifier,
            SaveFile saveFile,
            MongoDbContext context,
            IChatService chat,
            ISpMatchingService spMatching,
            IServiceProvider services)
        {
            _journeys = journeys;
            _clarifier = clarifier;
            _saveFile = saveFile;
            _context = context;
            _chat = chat;
            _spMatching = spMatching;
            // Optional: null in dev when Redis is disabled. Lifetime counters then
            // fall back to permissive (we never block the only entry path on infra).
            _redis = services.GetService(typeof(IConnectionMultiplexer)) as IConnectionMultiplexer;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        // POST /api/creator/journey/phase2/chat-message
        // Rate-limited via the shared "ai" policy. Persists the user message and the
        // next scripted question to the journey, so resume-after-abandon works.
        [HttpPost("chat-message")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> ChatMessage([FromBody] ChatMessageRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrWhiteSpace(request?.Message))
                    return BadRequest(ApiResponse.Error("Message is required."));

                var journey = await _journeys.AppendChatMessageAsync(userId, "user", request.Message.Trim());

                // Count user turns to drive the 6-question progression.
                var userTurns = journey.Phase2Data?.ChatMessages?.Count(m => m.Sender == "user") ?? 0;
                var allAnswered = userTurns >= Questions.Length;

                string aiReply = allAnswered
                    ? "Thanks — that's everything I need. Building your clarified summary now."
                    : Questions[Math.Min(userTurns, Questions.Length - 1)];

                journey = await _journeys.AppendChatMessageAsync(userId, "ai", aiReply);

                return Ok(ApiResponse.Ok("Message received", new
                {
                    messages = journey.Phase2Data?.ChatMessages,
                    questionIndex = Math.Min(userTurns, Questions.Length),
                    totalQuestions = Questions.Length,
                    summaryReady = allAnswered, // client then starts/polls the C-2 session
                }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/phase2/finalize-clarifier
        // Maps a COMPLETED C-2 ClarifierOutput onto the project. Tolerant of a
        // malformed/incomplete output: falls back to clarityScore 50 + aiParseFailed
        // so the user can edit on the summary screen — the session is never failed here.
        [HttpPost("finalize-clarifier")]
        public async Task<IActionResult> FinalizeClarifier([FromBody] FinalizeClarifierRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrWhiteSpace(request?.SessionId))
                    return BadRequest(ApiResponse.Error("sessionId is required."));

                var session = await _clarifier.GetOwnedAsync(request.SessionId, userId);
                if (session is null)
                    return NotFound(ApiResponse.Error("Clarifier session not found."));

                bool aiParseFailed = false;
                string problem = "", targetUser = "", solution = "", marketGap = "", creatorEdge = "";
                double clarityScore = session.ClarityScore ?? 0;
                var tags = new List<string>();

                try
                {
                    var o = session.Output;
                    if (o == null) throw new FormatException("No output");
                    problem = o.GetValue("problemDefinition", new BsonDocument())
                        .AsBsonDocument.GetValue("statement", "").AsString;
                    targetUser = o.GetValue("targetAudience", new BsonDocument())
                        .AsBsonDocument.GetValue("primarySegment", "").AsString;
                    var proposedSolution = o.GetValue("proposedSolution", new BsonDocument()).AsBsonDocument;
                    solution = proposedSolution.GetValue("summary", "").AsString;
                    marketGap = proposedSolution.GetValue("valueProposition", "").AsString;
                    creatorEdge = proposedSolution.GetValue("differentiation", "").AsString;
                    if (o.TryGetValue("clarityScore", out var cs) && cs.IsNumeric) clarityScore = cs.ToDouble();
                    if (o.TryGetValue("tags", out var t) && t.IsBsonArray)
                        tags = t.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();

                    if (string.IsNullOrWhiteSpace(problem) && string.IsNullOrWhiteSpace(solution))
                        throw new FormatException("Empty clarifier output");
                }
                catch
                {
                    // Malformed/incomplete — fallback, let the user edit. Don't fail the session.
                    aiParseFailed = true;
                    if (clarityScore <= 0) clarityScore = 50;
                }

                var journey = await _journeys.ApplyClarifierMappingAsync(
                    userId, session.Id, problem, targetUser, solution, clarityScore, tags, marketGap, creatorEdge);

                return Ok(ApiResponse.Ok("Clarifier finalized", new
                {
                    aiParseFailed,
                    clarityScore,
                    project = journey.Project,
                }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/phase2/finalize-discovery
        // Discovery convergence: the user has confirmed an AI-generated concept, so the
        // clarifier Q&A is redundant. We seed a COMPLETED clarifier session directly from
        // the concept (its Output satisfies the C-3 prerequisite — BusinessPlanController
        // requires a completed session with Output), map the concept onto the project, and
        // link the session. No AI call, no clarifier UI. Path-B's finalize-clarifier is
        // untouched. The user proceeds to idea-summary → name → branding → Phase 3.
        [HttpPost("finalize-discovery")]
        public async Task<IActionResult> FinalizeDiscovery([FromBody] FinalizeDiscoveryRequest request)
        {
            try
            {
                var userId = GetUserId();

                var journey = await _journeys.GetOrCreateAsync(userId);
                var p2 = journey.Phase2Data;
                var conceptId = !string.IsNullOrWhiteSpace(request?.ConceptId)
                    ? request.ConceptId
                    : p2?.SelectedConceptId;
                if (string.IsNullOrWhiteSpace(conceptId))
                    return BadRequest(ApiResponse.Error("No selected concept to finalize."));

                var concept = p2?.GeneratedConcepts?.FirstOrDefault(c => c.Id == conceptId);
                if (concept is null)
                    return NotFound(ApiResponse.Error("Selected concept not found."));

                // Build the ClarifierOutput contract straight from the concept.
                var clarityScore = Math.Clamp((int)Math.Round(concept.Score), 0, 100);

                // Map every piece of concept data into the Output so a Discovery plan is
                // grounded comparably to a Path-B (clarifier) plan. painPoints, severity,
                // audience characteristics, and sizeQualitative stay empty: the concept
                // carries no equivalent, and the contract forbids a specific figure in
                // sizeQualitative (the TAM lives in assumptions instead). Optional fields
                // degrade gracefully when absent.
                var valueProp = !string.IsNullOrWhiteSpace(concept.Description)
                    ? concept.Description : (concept.MarketGap ?? "");

                var existingAlternatives = new BsonArray();
                if (!string.IsNullOrWhiteSpace(concept.SimilarTo))
                    existingAlternatives.Add(new BsonDocument
                    {
                        { "name", concept.SimilarTo },
                        { "gap", concept.MarketGap ?? "" },
                    });

                var riskAssessment = new BsonArray();
                if (!string.IsNullOrWhiteSpace(concept.Saturation))
                {
                    var sat = concept.Saturation.Trim().ToLowerInvariant();
                    var likelihood = sat.Contains("high") ? "high" : sat.Contains("low") ? "low" : "medium";
                    riskAssessment.Add(new BsonDocument
                    {
                        { "category", "Market competition" },
                        { "description", $"Competitor saturation assessed as {concept.Saturation}." },
                        { "likelihood", likelihood },
                        { "mitigation", concept.FounderEdge ?? "" },
                    });
                }

                var assumptions = new BsonArray();
                if (!string.IsNullOrWhiteSpace(concept.Tam))
                    assumptions.Add($"Assumes a total addressable market of approximately {concept.Tam}.");

                var tags = new BsonArray();
                if (!string.IsNullOrWhiteSpace(concept.Category)) tags.Add(concept.Category);
                if (!string.IsNullOrWhiteSpace(concept.Saturation)) tags.Add($"saturation:{concept.Saturation}");

                var output = new BsonDocument
                {
                    { "schemaVersion", 1 },
                    { "problemDefinition", new BsonDocument
                        {
                            { "statement", concept.CoreProblem ?? "" },
                            { "painPoints", new BsonArray() },   // no concept source
                            { "severity", "" },                  // no concept source
                        } },
                    { "targetAudience", new BsonDocument
                        {
                            { "primarySegment", concept.TargetUser ?? "" },
                            { "characteristics", new BsonArray() }, // no concept source
                            { "sizeQualitative", "" },              // contract forbids a figure; TAM is in assumptions
                        } },
                    { "existingAlternatives", existingAlternatives },
                    { "proposedSolution", new BsonDocument
                        {
                            { "summary", concept.Solution ?? "" },
                            { "differentiation", concept.FounderEdge ?? "" },
                            { "valueProposition", valueProp },
                        } },
                    { "riskAssessment", riskAssessment },
                    { "assumptions", assumptions },
                    { "clarityScore", clarityScore },
                    { "clarityRationale", string.IsNullOrWhiteSpace(concept.Category)
                        ? "Derived from an AI-generated Discovery concept the founder confirmed."
                        : $"Derived from an AI-generated Discovery concept the founder confirmed (category: {concept.Category})." },
                    { "tags", tags },
                };

                // Seed a completed clarifier session (source of truth for C-3).
                var session = new ClarifierSession
                {
                    OwnerUserId = userId,
                    BusinessIdeaId = journey.BusinessIdeaId,
                    Status = "Completed",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                await _clarifier.AddAsync(session);                       // assigns ObjectId
                await _clarifier.SetCompletedAsync(session.Id, output, clarityScore);

                var updated = await _journeys.ApplyDiscoveryMappingAsync(userId, session.Id, concept);

                return Ok(ApiResponse.Ok("Discovery finalized", new
                {
                    clarifierSessionId = session.Id,
                    clarityScore,
                    project = updated.Project,
                }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/phase2/name-suggestions
        // Synchronous. 3 per journey lifetime (Redis permanent counter). Deterministic
        // generator (no generic suffixes); LLM wiring is a follow-up.
        [HttpPost("name-suggestions")]
        public async Task<IActionResult> NameSuggestions([FromBody] NameSuggestionsRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrWhiteSpace(request?.Concept))
                    return BadRequest(ApiResponse.Error("concept is required."));

                // 3-per-lifetime cap, keyed by user (no TTL). Permissive if Redis is off.
                if (_redis != null)
                {
                    var db = _redis.GetDatabase();
                    var key = $"rate:names:{userId}";
                    var count = await db.StringIncrementAsync(key);
                    if (count > 3)
                        return StatusCode(429, ApiResponse.Error("Maximum name suggestion attempts reached."));
                }

                var names = GenerateNames(request.Concept);
                return Ok(ApiResponse.Ok("OK", new { names }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/phase2/branding/upload-logo  (multipart)
        // Optional paletteName / typographyPairing / colorPalette (comma-separated)
        // persist the AI-logo-tool selection alongside the asset.
        [HttpPost("branding/upload-logo")]
        public async Task<IActionResult> UploadLogo(
            [FromForm] IFormFile logo, [FromForm] string source,
            [FromForm] string paletteName = null, [FromForm] string typographyPairing = null,
            [FromForm] string colorPalette = null)
        {
            try
            {
                var userId = GetUserId();
                if (logo == null || logo.Length == 0)
                    return BadRequest(ApiResponse.Error("logo file is required."));
                if (source != "ai_logo" && source != "m50_designer")
                    return BadRequest(ApiResponse.Error("source must be \"ai_logo\" or \"m50_designer\"."));

                string assetPath;
                try
                {
                    assetPath = await _saveFile.SaveFileAsync(logo, "branding");
                }
                catch (ArgumentException ex)
                {
                    // Invalid type / too large → 422 per spec.
                    return UnprocessableEntity(ApiResponse.Error(ex.Message));
                }

                var logoType = source == "ai_logo" ? "ai" : "designer";
                var palette = string.IsNullOrWhiteSpace(colorPalette)
                    ? null
                    : colorPalette.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                var journey = await _journeys.SetBrandingLogoAsync(
                    userId, assetPath, logoType, source, palette, paletteName, typographyPairing);

                return Ok(ApiResponse.Ok("Logo uploaded", new { logoAsset = assetPath, branding = journey.Project?.Branding }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/phase2/branding/skip
        // Branding "pending" is a valid completion state — never blocks Phase 2/3.
        [HttpPost("branding/skip")]
        public async Task<IActionResult> SkipBranding()
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.SetBrandingLogoAsync(userId, null, null, "pending");
                return Ok(ApiResponse.Ok("Branding skipped", new { branding = journey.Project?.Branding }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ---- Discovery path working state (independent targeted $set writes) ----

        // POST /api/creator/journey/phase2/discovery-inputs
        // Persist Discovery input form (sectors, problem, strengths) at step 2.
        [HttpPost("discovery-inputs")]
        public async Task<IActionResult> SaveDiscoveryInputs([FromBody] SaveDiscoveryInputsRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (request?.Inputs == null)
                    return BadRequest(ApiResponse.Error("inputs is required."));

                var inputs = new CreatorDiscoveryInputs
                {
                    Sectors = request.Inputs.Sectors ?? new List<string>(),
                    ObservedProblem = request.Inputs.ObservedProblem ?? string.Empty,
                    Strengths = request.Inputs.Strengths ?? new List<string>(),
                };

                var journey = await _journeys.SetDiscoveryInputsAsync(userId, inputs);
                return Ok(ApiResponse.Ok("Discovery inputs saved", new { phase2Data = journey.Phase2Data }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/phase2/generated-concepts
        // Persist AI-generated concepts after generation completes (step 3).
        [HttpPost("generated-concepts")]
        public async Task<IActionResult> SaveGeneratedConcepts([FromBody] SaveGeneratedConceptsRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (request?.Concepts == null || request.Concepts.Count == 0)
                    return BadRequest(ApiResponse.Error("concepts array is required."));

                var concepts = request.Concepts.Select(c => new CreatorDiscoveryConcept
                {
                    Id = c.Id,
                    Title = c.Title,
                    Category = c.Category,
                    Description = c.Description,
                    Score = c.Score,
                    Tam = c.Tam,
                    Saturation = c.Saturation,
                    SimilarTo = c.SimilarTo,
                    Concept = c.Concept,
                    TargetUser = c.TargetUser,
                    CoreProblem = c.CoreProblem,
                    Solution = c.Solution,
                    MarketGap = c.MarketGap,
                    FounderEdge = c.FounderEdge,
                }).ToList();

                var journey = await _journeys.SetGeneratedConceptsAsync(userId, concepts);
                return Ok(ApiResponse.Ok("Concepts saved", new { phase2Data = journey.Phase2Data }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/phase2/selected-concept
        // Persist the selected concept ID when user picks (step 4).
        [HttpPost("selected-concept")]
        public async Task<IActionResult> SaveSelectedConceptId([FromBody] SaveSelectedConceptIdRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrWhiteSpace(request?.ConceptId))
                    return BadRequest(ApiResponse.Error("conceptId is required."));

                var journey = await _journeys.SetSelectedConceptIdAsync(userId, request.ConceptId);
                return Ok(ApiResponse.Ok("Concept selected", new { phase2Data = journey.Phase2Data }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // GET /api/creator/journey/phase2/m50-designers
        // Verified branding/design SPs (tier>=2), ranked by the SP match formula.
        [HttpGet("m50-designers")]
        public async Task<IActionResult> M50Designers()
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateAsync(userId);
                var sector = journey.Project?.Sector ?? string.Empty;

                // Reuse the shared SP match formula, filtered to the Design specialty.
                var matches = await _spMatching.MatchAsync(ServiceCategory.Design, sector, 5);
                var dtos = matches.Select(m => ToDesignerDto(m.User)).ToList();
                for (int i = 0; i < dtos.Count; i++) dtos[i].IsBestMatch = i == 0;

                return Ok(ApiResponse.Ok("OK", dtos));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/phase2/m50-designers/book  { spId }
        // Opens a Messenger workroom, auto-sends the brief, marks branding designer-pending.
        // Designer-pending is a VALID Phase 2 completion state — does NOT block.
        [HttpPost("m50-designers/book")]
        public async Task<IActionResult> BookDesigner([FromBody] BookDesignerRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrWhiteSpace(request?.SpId) || !Guid.TryParse(request.SpId, out var spGuid))
                    return BadRequest(ApiResponse.Error("Valid spId is required."));
                if (!Guid.TryParse(userId, out var creatorGuid))
                    return StatusCode(403, ApiResponse.Error("Invalid user."));

                var journey = await _journeys.GetOrCreateAsync(userId);
                var p = journey.Project ?? new CreatorJourneyProject();

                // 1) Workroom (private conversation) between creator and SP.
                var (conversation, _) = await _chat.GetOrCreateConversation(creatorGuid, spGuid);

                // 2) Auto-send the brief as the first message.
                var brief =
                    $"📋 Branding brief\n" +
                    $"Project: {(string.IsNullOrWhiteSpace(p.Name) ? "(unnamed)" : p.Name)}\n" +
                    $"Pitch: {(string.IsNullOrWhiteSpace(p.Tagline) ? "—" : p.Tagline)}\n" +
                    $"Sector: {(string.IsNullOrWhiteSpace(p.Sector) ? "—" : p.Sector)}\n" +
                    $"Looking for: logo + visual identity. Budget: €500–€2,000.";
                await _chat.AddMessage(new ChatMessage
                {
                    ConversationId = conversation.Id,
                    SenderId = creatorGuid,
                    Message = brief,
                    MessageType = "Text",
                });

                // 3) Branding designer-pending (resolved for the derived engine; logo delivered later).
                await _journeys.SetBrandingLogoAsync(userId, null, "designer", "m50_designer");

                var workroomId = conversation.Id.ToString();
                return Ok(ApiResponse.Ok("Workroom opened", new { workroomId, conversationId = workroomId }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // Maps a matched SP → the designer DTO (ranking lives in ISpMatchingService).
        private static DesignerDto ToDesignerDto(ApplicationUser u)
        {
            var sp = u.ServiceProviderProfile;
            double rawTrust = sp.TrustScore > 0 ? sp.TrustScore : u.Trust_score;
            double ratingNorm = rawTrust <= 0 ? 0.6 : rawTrust <= 5 ? rawTrust / 5.0 : Math.Min(rawTrust / 100.0, 1.0);
            return new DesignerDto
            {
                SpId = u.Id.ToString(),
                Name = u.Name,
                Title = string.IsNullOrWhiteSpace(sp.Headline) ? (u.Title ?? "Brand Designer") : sp.Headline,
                Tier = u.Tier_level,
                Rating = Math.Round(ratingNorm * 5.0, 1),
                ProjectCount = sp.PortfolioItems?.Count ?? 0,
                Location = u.Geography ?? u.Address?.City ?? "—",
                Sectors = sp.Industries ?? new List<string>(),
                EstimatedPriceRange = "€500–€2,000",
                EstimatedDays = "5–10 days",
                IsBestMatch = false,
            };
        }

        // Deterministic 5-name generator. Derives a root from the concept and pairs it
        // with evocative affixes, deliberately avoiding the banned generic standalones
        // (Hub / App / Pro / Platform).
        // TODO: swap to IAiProvider when model-router ready — keep contract/shape/limit identical.
        private static List<string> GenerateNames(string concept)
        {
            var words = concept.Split(new[] { ' ', ',', '.', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
            var root = (words.FirstOrDefault(w => w.Length > 3) ?? words.FirstOrDefault() ?? "Nova").Trim();
            root = char.ToUpperInvariant(root[0]) + root.Substring(1).ToLowerInvariant();
            var stem = root.Length > 5 ? root.Substring(0, 5) : root;

            return new List<string>
            {
                $"{stem}ly",
                $"{stem}flow",
                $"{root}wise",
                $"Ze{stem.ToLowerInvariant()}",
                $"{stem}mint",
            };
        }

        // ---- Request DTOs ----

        public class ChatMessageRequest { public string Message { get; set; } }
        public class FinalizeClarifierRequest { public string SessionId { get; set; } }
        public class NameSuggestionsRequest { public string Concept { get; set; } }
        public class BookDesignerRequest { public string SpId { get; set; } }

        public class SaveDiscoveryInputsRequest
        {
            public DiscoveryInputsDto Inputs { get; set; }
        }

        public class DiscoveryInputsDto
        {
            public List<string> Sectors { get; set; }
            public string ObservedProblem { get; set; }
            public List<string> Strengths { get; set; }
        }

        public class SaveGeneratedConceptsRequest
        {
            public List<DiscoveryConceptDto> Concepts { get; set; }
        }

        public class DiscoveryConceptDto
        {
            public string Id { get; set; }
            public string Title { get; set; }
            public string Category { get; set; }
            public string Description { get; set; }
            public double Score { get; set; }
            public string Tam { get; set; }
            public string Saturation { get; set; }
            public string SimilarTo { get; set; }
            public string Concept { get; set; }
            public string TargetUser { get; set; }
            public string CoreProblem { get; set; }
            public string Solution { get; set; }
            public string MarketGap { get; set; }
            public string FounderEdge { get; set; }
        }

        public class SaveSelectedConceptIdRequest
        {
            public string ConceptId { get; set; }
        }
    }
}
