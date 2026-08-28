using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    [Route("api/marketplace/projects")]
    [ApiController]
    [Authorize]
    public class MarketplaceProjectsController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly INotificationService? _notifications;
        private readonly IBusinessPlanSessionStore? _businessPlans;
        private readonly IForecastSessionStore? _forecasts;
        private readonly string _uploadsPath;

        public MarketplaceProjectsController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            ICreatorIdeaStore creatorIdeas,
            IConfiguration? configuration = null,
            INotificationService? notifications = null,
            IBusinessPlanSessionStore? businessPlans = null,
            IForecastSessionStore? forecasts = null)
        {
            _context = context;
            _userManager = userManager;
            _creatorIdeas = creatorIdeas;
            _notifications = notifications;
            _businessPlans = businessPlans;
            _forecasts = forecasts;
            _uploadsPath = configuration?["FileStorage:UploadPath"] ?? "uploads";
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        private static string ComputeSha256(string raw)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private string GetClientIpHash()
        {
            var ip = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            return ComputeSha256(ip);
        }

        private async Task<MarketplaceProjectAccessGrant?> GetValidAccessGrantAsync(string ideaId, string userId)
        {
            var grant = await _context.MarketplaceProjectAccessGrants
                .Find(g => g.IdeaId == ideaId && g.EntrepreneurId == userId && g.Status == "active")
                .SortByDescending(g => g.GrantedAt)
                .FirstOrDefaultAsync();

            if (grant == null) return null;

            if (grant.ExpiresAt.HasValue && grant.ExpiresAt.Value < DateTime.UtcNow)
            {
                grant.Status = "expired";
                await _context.MarketplaceProjectAccessGrants.ReplaceOneAsync(g => g.Id == grant.Id, grant);
                return null;
            }

            return grant;
        }

        // GET /api/marketplace/projects
        [HttpGet]
        public async Task<IActionResult> GetProjects(
            [FromQuery] string? sector = null,
            [FromQuery] string? dealMode = null,
            [FromQuery] string? search = null)
        {
            try
            {
                var filter = Builders<CreatorIdea>.Filter.And(
                    Builders<CreatorIdea>.Filter.In("Phase5Data.PathA.MarketplaceListing.Status", new[] { "live", "available" }),
                    Builders<CreatorIdea>.Filter.Eq("Phase5Data.PathA.MarketplaceListing.Audience", "public")
                );

                var ideas = await _context.CreatorIdeas
                    .Find(filter)
                    .SortByDescending(x => x.Phase5Data.PathA.MarketplaceListing.PublishedAt)
                    .Limit(100)
                    .ToListAsync();

                var results = new List<MarketplaceProjectDto>();

                foreach (var idea in ideas)
                {
                    var listing = idea.Phase5Data?.PathA?.MarketplaceListing;
                    if (listing == null) continue;

                    var p = idea.Project ?? new CreatorJourneyProject();

                    // Apply in-memory search / sector / dealMode filters
                    if (!string.IsNullOrWhiteSpace(sector) && !string.Equals(p.Sector, sector, StringComparison.OrdinalIgnoreCase))
                        continue;

                    var dealModes = listing.DealModes?.Count > 0
                        ? listing.DealModes
                        : new List<string> { listing.SaleType ?? "full_buyout" };

                    if (!string.IsNullOrWhiteSpace(dealMode) && !dealModes.Any(m => string.Equals(m, dealMode, StringComparison.OrdinalIgnoreCase)))
                        continue;

                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var term = search.Trim();
                        bool match = (p.Name?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                                     (p.Tagline?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                                     (p.Sector?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                                     (p.Problem?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false);
                        if (!match) continue;
                    }

                    results.Add(MapToPublicDto(idea, listing));
                }

                return Ok(ApiResponse.Ok("OK", results));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // GET /api/marketplace/projects/{ideaId}
        [HttpGet("{ideaId}")]
        public async Task<IActionResult> GetProjectDetail(string ideaId)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _context.CreatorIdeas
                    .Find(x => x.Id == ideaId)
                    .FirstOrDefaultAsync();

                if (idea == null)
                    return NotFound(ApiResponse.Error("Project not found.", HttpContext.TraceIdentifier));

                var listing = idea.Phase5Data?.PathA?.MarketplaceListing ?? new CreatorMarketplaceListing();

                bool isOwner = !string.IsNullOrEmpty(userId) && idea.UserId == userId;
                bool isAcquirer = !string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(idea.AcquiredByUserId) && idea.AcquiredByUserId == userId;
                bool isPublic = listing.Audience == "public" && (listing.Status == "live" || listing.Status == "available");

                bool canView = isPublic || isOwner || isAcquirer || User.IsInRole("Admin");
                if (!canView && !string.IsNullOrEmpty(userId))
                {
                    var hasInterest = (await _context.ProjectInterests
                        .Find(x => x.IdeaId == ideaId && x.EntrepreneurId == userId)
                        .FirstOrDefaultAsync()) != null;
                    if (hasInterest)
                    {
                        canView = true;
                    }
                    else
                    {
                        var hasGrant = (await _context.MarketplaceProjectAccessGrants
                            .Find(x => x.IdeaId == ideaId && x.EntrepreneurId == userId)
                            .FirstOrDefaultAsync()) != null;
                        if (hasGrant)
                        {
                            canView = true;
                        }
                        else
                        {
                            var hasDeal = (await _context.DealExecutions
                                .Find(d => d.IdeaId == ideaId && (d.EntrepreneurId == userId || d.CreatedByUserId == userId))
                                .FirstOrDefaultAsync()) != null;
                            if (hasDeal)
                            {
                                canView = true;
                            }
                        }
                    }
                }

                if (!canView)
                    return NotFound(ApiResponse.Error("Project not found or is private.", HttpContext.TraceIdentifier));

                return Ok(ApiResponse.Ok("OK", MapToPublicDto(idea, listing)));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/marketplace/projects/{ideaId}/interest
        [HttpPost("{ideaId}/interest")]
        public async Task<IActionResult> ExpressInterest(string ideaId, [FromBody] ExpressInterestRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _context.CreatorIdeas
                    .Find(x => x.Id == ideaId)
                    .FirstOrDefaultAsync();

                if (idea == null)
                    return NotFound(ApiResponse.Error("Project not found.", HttpContext.TraceIdentifier));

                var listing = idea.Phase5Data?.PathA?.MarketplaceListing;
                if (listing == null || (listing.Status != "live" && listing.Status != "available"))
                    return NotFound(ApiResponse.Error("Project is not currently accepting offers on the marketplace.", HttpContext.TraceIdentifier));

                if (idea.UserId == userId)
                    return UnprocessableEntity(ApiResponse.Error("You cannot express interest in your own project."));

                // Check for existing pending/accepted interest from this user
                var existing = await _context.ProjectInterests
                    .Find(x => x.IdeaId == ideaId && x.EntrepreneurId == userId && (x.Status == "pending" || x.Status == "accepted"))
                    .FirstOrDefaultAsync();

                if (existing != null)
                    return Conflict(ApiResponse.Error("You have already expressed interest in this project."));

                var user = await _userManager.FindByIdAsync(userId);
                var entrepreneurName = user?.Name ?? user?.UserName ?? "Entrepreneur";

                var modes = listing.DealModes?.ToList() ?? new List<string>();
                if (modes.Count == 0 && !string.IsNullOrEmpty(listing.SaleType))
                {
                    modes.Add(listing.SaleType);
                }

                // If request specifies a deal mode, validate it against available modes
                string selectedMode;
                if (!string.IsNullOrEmpty(request?.DealMode))
                {
                    var requestedMode = request.DealMode.Trim().ToLowerInvariant();
                    if (!modes.Contains(requestedMode) && requestedMode != listing.SaleType)
                    {
                        return UnprocessableEntity(ApiResponse.Error($"The requested deal mode '{requestedMode}' is not currently available for this listing."));
                    }
                    selectedMode = requestedMode;
                }
                else
                {
                    if (modes.Count == 1)
                    {
                        selectedMode = modes[0];
                    }
                    else if (modes.Count > 1)
                    {
                        return UnprocessableEntity(ApiResponse.Error("Please select a specific deal mode (Full Buyout or Co-founder / Equity)."));
                    }
                    else
                    {
                        selectedMode = listing.SaleType ?? "full_buyout";
                    }
                }

                var interest = new ProjectInterest
                {
                    IdeaId = ideaId,
                    ListingId = idea.Id,
                    CreatorId = idea.UserId,
                    EntrepreneurId = userId,
                    EntrepreneurName = entrepreneurName,
                    EntrepreneurEmail = user?.Email,
                    Note = request?.Note?.Trim(),
                    Status = "pending",
                    DealModes = new List<string> { selectedMode },
                    DealMode = selectedMode,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.ProjectInterests.InsertOneAsync(interest);

                if (_notifications != null && Guid.TryParse(idea.UserId, out var creatorGuid))
                {
                    var projName = idea.Project?.Name ?? "your project";
                    var dealModeText = selectedMode == "full_buyout"
                        ? "Full Buyout"
                        : "Co-founder / Equity Partnership";
                    var deepLink = $"/dashboard/creator/crossroads?ideaId={ideaId}&interestId={interest.Id}";
                    await _notifications.CreateNotification(
                        creatorGuid,
                        $"New interest in {projName}",
                        $"{entrepreneurName} wants to explore {dealModeText} terms for {projName}.",
                        link: deepLink,
                        type: "MarketplaceInterest",
                        referenceId: interest.Id
                    );
                }

                var dto = new ProjectInterestDto
                {
                    Id = interest.Id.ToString(),
                    IdeaId = interest.IdeaId,
                    ProjectName = idea.Project?.Name ?? "Project",
                    CreatorId = interest.CreatorId,
                    EntrepreneurId = interest.EntrepreneurId,
                    EntrepreneurName = interest.EntrepreneurName,
                    EntrepreneurEmail = interest.EntrepreneurEmail,
                    Note = interest.Note,
                    Status = interest.Status,
                    DealModes = interest.DealModes,
                    DealMode = interest.DealMode,
                    NdaRequired = listing.NdaRequired,
                    CreatedAt = interest.CreatedAt,
                    UpdatedAt = interest.UpdatedAt
                };

                return StatusCode(201, ApiResponse.Ok("Interest expressed successfully.", dto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // GET /api/marketplace/projects/{ideaId}/interest/my
        [HttpGet("{ideaId}/interest/my")]
        public async Task<IActionResult> GetMyInterest(string ideaId)
        {
            try
            {
                var userId = GetUserId();
                var interest = await _context.ProjectInterests
                    .Find(x => x.IdeaId == ideaId && x.EntrepreneurId == userId)
                    .SortByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();

                if (interest == null)
                    return Ok(ApiResponse.Ok("OK", new { hasInterest = false, interest = (ProjectInterestDto?)null }));

                var grant = await GetValidAccessGrantAsync(ideaId, userId);

                var dto = new ProjectInterestDto
                {
                    Id = interest.Id.ToString(),
                    IdeaId = interest.IdeaId,
                    CreatorId = interest.CreatorId,
                    EntrepreneurId = interest.EntrepreneurId,
                    EntrepreneurName = interest.EntrepreneurName,
                    EntrepreneurEmail = interest.EntrepreneurEmail,
                    Note = interest.Note,
                    Status = interest.Status,
                    DealModes = interest.DealModes,
                    DealMode = interest.DealMode,
                    ConversationId = interest.ConversationId,
                    NdaRequired = grant?.NdaRequired ?? true,
                    NdaSigned = grant?.NdaSigned ?? false,
                    AccessGranted = grant != null && grant.Status == "active",
                    CreatedAt = interest.CreatedAt,
                    UpdatedAt = interest.UpdatedAt
                };

                return Ok(ApiResponse.Ok("OK", new { hasInterest = true, interest = dto }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // GET /api/marketplace/projects/{ideaId}/nda
        // GET /api/marketplace/projects/{ideaId}/nda/status
        [HttpGet("{ideaId}/nda")]
        [HttpGet("{ideaId}/nda/status")]
        public async Task<IActionResult> GetNdaStatus(string ideaId)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _context.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
                if (idea == null)
                    return NotFound(ApiResponse.Error("Project not found.", HttpContext.TraceIdentifier));

                var listing = idea.Phase5Data?.PathA?.MarketplaceListing ?? new CreatorMarketplaceListing();

                var interest = await _context.ProjectInterests
                    .Find(x => x.IdeaId == ideaId && x.EntrepreneurId == userId)
                    .SortByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();

                var grant = await GetValidAccessGrantAsync(ideaId, userId);

                var creatorUser = await _userManager.FindByIdAsync(idea.UserId);
                var entrepreneurUser = await _userManager.FindByIdAsync(userId);

                // Audit log view event if interest is accepted
                if (interest?.Status == "accepted")
                {
                    await _context.MarketplaceProjectAccessLogs.InsertOneAsync(new MarketplaceProjectAccessLog
                    {
                        IdeaId = ideaId,
                        ProjectInterestId = interest.Id.ToString(),
                        UserId = userId,
                        EventType = "nda_viewed",
                        Timestamp = DateTime.UtcNow,
                        IpHash = GetClientIpHash(),
                        NdaVersion = "1.0"
                    });
                }

                var dto = new NdaStatusDto
                {
                    IdeaId = ideaId,
                    ProjectName = idea.Project?.Name ?? "Project",
                    CreatorName = creatorUser?.Name ?? creatorUser?.UserName ?? "Creator",
                    EntrepreneurName = entrepreneurUser?.Name ?? entrepreneurUser?.UserName ?? "Entrepreneur",
                    InterestId = interest?.Id.ToString() ?? "",
                    InterestStatus = interest?.Status ?? "none",
                    NdaRequired = listing.NdaRequired,
                    NdaSigned = grant?.NdaSigned ?? false,
                    NdaSignedAt = grant?.NdaSignedAt,
                    NdaVersion = grant?.NdaVersion ?? "1.0",
                    AccessGranted = grant != null && grant.Status == "active",
                    AccessExpiresAt = grant?.ExpiresAt
                };

                return Ok(ApiResponse.Ok("OK", dto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/marketplace/projects/{ideaId}/nda/sign
        [HttpPost("{ideaId}/nda/sign")]
        public async Task<IActionResult> SignNda(string ideaId, [FromBody] SignNdaRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _context.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
                if (idea == null)
                    return NotFound(ApiResponse.Error("Project not found.", HttpContext.TraceIdentifier));

                var listing = idea.Phase5Data?.PathA?.MarketplaceListing;
                if (listing == null)
                    return NotFound(ApiResponse.Error("Project has no active marketplace listing.", HttpContext.TraceIdentifier));

                // 1. Entry condition: ProjectInterest.Status == ACCEPTED for caller
                var interest = await _context.ProjectInterests
                    .Find(x => x.IdeaId == ideaId && x.EntrepreneurId == userId)
                    .SortByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();

                if (interest == null || interest.Status != "accepted")
                {
                    return UnprocessableEntity(ApiResponse.Error("NDA signing requires an accepted interest request from the creator."));
                }

                // 2. Idempotent check: if already signed and active grant exists, return immediately without duplicate records
                var existingGrant = await GetValidAccessGrantAsync(ideaId, userId);
                if (existingGrant != null && existingGrant.NdaSigned)
                {
                    return Ok(ApiResponse.Ok("NDA already signed.", new
                    {
                        ndaStatus = "signed",
                        signedAt = existingGrant.NdaSignedAt,
                        accessGranted = true,
                        expiresAt = existingGrant.ExpiresAt
                    }));
                }

                // 3. Compute immutable cryptographic hashes
                var ndaVersion = "1.0";
                var ndaTextHash = ComputeSha256($"MONDIAL_PLATFORM_NDA_V{ndaVersion}_{ideaId}_{idea.UserId}_{userId}");
                var signatureHash = ComputeSha256($"{userId}:{ideaId}:{DateTime.UtcNow:O}:{ndaTextHash}");

                var grant = existingGrant ?? new MarketplaceProjectAccessGrant
                {
                    IdeaId = ideaId,
                    ProjectInterestId = interest.Id.ToString(),
                    CreatorId = idea.UserId,
                    EntrepreneurId = userId,
                    Status = "active",
                    GrantedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(30)
                };

                grant.NdaSigned = true;
                grant.NdaSignedAt = DateTime.UtcNow;
                grant.SignatureHash = signatureHash;
                grant.NdaTextHash = ndaTextHash;
                grant.NdaVersion = ndaVersion;
                grant.Status = "active";

                if (existingGrant == null)
                    await _context.MarketplaceProjectAccessGrants.InsertOneAsync(grant);
                else
                    await _context.MarketplaceProjectAccessGrants.ReplaceOneAsync(g => g.Id == grant.Id, grant);

                // 4. Record audit logs
                await _context.MarketplaceProjectAccessLogs.InsertOneAsync(new MarketplaceProjectAccessLog
                {
                    IdeaId = ideaId,
                    ProjectInterestId = interest.Id.ToString(),
                    UserId = userId,
                    EventType = "nda_signed",
                    Timestamp = DateTime.UtcNow,
                    IpHash = GetClientIpHash(),
                    NdaVersion = ndaVersion
                });

                await _context.MarketplaceProjectAccessLogs.InsertOneAsync(new MarketplaceProjectAccessLog
                {
                    IdeaId = ideaId,
                    ProjectInterestId = interest.Id.ToString(),
                    UserId = userId,
                    EventType = "private_access_granted",
                    Timestamp = DateTime.UtcNow,
                    IpHash = GetClientIpHash(),
                    NdaVersion = ndaVersion
                });

                // 5. Send notifications
                var user = await _userManager.FindByIdAsync(userId);
                var entrepreneurName = user?.Name ?? user?.UserName ?? "Entrepreneur";
                var projectName = idea.Project?.Name ?? "the project";

                if (Guid.TryParse(idea.UserId, out var creatorGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            creatorGuid,
                            "NDA Signed",
                            $"{entrepreneurName} signed the NDA for {projectName}.",
                            link: $"/dashboard/creator/crossroads?ideaId={idea.Id}"
                        );
                    }
                    catch { /* Best effort notification */ }
                }

                if (Guid.TryParse(userId, out var entGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            entGuid,
                            "Private Access Granted",
                            $"Private project access is now available for {projectName}.",
                            link: $"/dashboard/entrepreneur/discover/{idea.Id}"
                        );
                    }
                    catch { /* Best effort notification */ }
                }

                return Ok(ApiResponse.Ok("NDA signed successfully.", new
                {
                    ndaStatus = "signed",
                    signedAt = grant.NdaSignedAt,
                    accessGranted = true,
                    expiresAt = grant.ExpiresAt
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // GET /api/marketplace/projects/{ideaId}/private
        [HttpGet("{ideaId}/private")]
        public async Task<IActionResult> GetPrivateProject(string ideaId)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _context.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
                if (idea == null)
                    return NotFound(ApiResponse.Error("Project not found.", HttpContext.TraceIdentifier));

                var listing = idea.Phase5Data?.PathA?.MarketplaceListing ?? new CreatorMarketplaceListing();

                bool isOwner = idea.UserId == userId;
                bool isAcquirer = !string.IsNullOrEmpty(idea.AcquiredByUserId) && idea.AcquiredByUserId == userId;

                if (!isOwner && !isAcquirer)
                {
                    var grant = await GetValidAccessGrantAsync(ideaId, userId);

                    // Check if access is granted (either via signed NDA, or NDA not required on accepted interest)
                    bool hasAccess = grant != null &&
                        (grant.NdaSigned || !listing.NdaRequired) &&
                        grant.Status == "active";

                    if (!hasAccess)
                    {
                        // Audit unauthorized attempt
                        await _context.MarketplaceProjectAccessLogs.InsertOneAsync(new MarketplaceProjectAccessLog
                        {
                            IdeaId = ideaId,
                            UserId = userId,
                            EventType = "private_access_denied",
                            Timestamp = DateTime.UtcNow,
                            IpHash = GetClientIpHash()
                        });

                        return StatusCode(403, ApiResponse.Error("Access to private project data requires an active access grant."));
                    }
                }

                BusinessPlanSession? bpSession = null;
                if (!string.IsNullOrEmpty(idea.Phase3Data?.BusinessPlanSessionId) && _businessPlans != null)
                {
                    try { bpSession = await _businessPlans.GetOwnedAsync(idea.Phase3Data.BusinessPlanSessionId, idea.UserId); } catch { }
                }

                ForecastSession? forecastSession = null;
                if (!string.IsNullOrEmpty(idea.Phase3Data?.ForecastSessionId) && _forecasts != null)
                {
                    try { forecastSession = await _forecasts.GetOwnedAsync(idea.Phase3Data.ForecastSessionId, idea.UserId); } catch { }
                }

                return Ok(ApiResponse.Ok("OK", MapToPrivateDto(idea, listing, bpSession, forecastSession)));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // GET /api/marketplace/projects/{ideaId}/documents/{documentId}/download
        [HttpGet("{ideaId}/documents/{documentId}/download")]
        public async Task<IActionResult> DownloadDocument(string ideaId, string documentId)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _context.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
                if (idea == null)
                    return NotFound(ApiResponse.Error("Project not found.", HttpContext.TraceIdentifier));

                bool isOwner = idea.UserId == userId;
                bool isAcquirer = !string.IsNullOrEmpty(idea.AcquiredByUserId) && idea.AcquiredByUserId == userId;

                if (!isOwner && !isAcquirer)
                {
                    var grant = await GetValidAccessGrantAsync(ideaId, userId);
                    bool hasAccess = grant != null && (grant.NdaSigned || !(idea.Phase5Data?.PathA?.MarketplaceListing?.NdaRequired ?? true));
                    if (!hasAccess)
                        return StatusCode(403, ApiResponse.Error("Unauthorized to download project documents."));
                }

                var doc = idea.Documents?.FirstOrDefault(d => d.Id == documentId);
                if (doc == null || doc.Status != "ready")
                    return NotFound(ApiResponse.Error("Document not found or not ready.", HttpContext.TraceIdentifier));

                var filePath = Path.Combine(_uploadsPath, doc.StorageReference);
                if (!System.IO.File.Exists(filePath))
                    return NotFound(ApiResponse.Error("Physical file not found on server.", HttpContext.TraceIdentifier));

                var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
                return File(stream, doc.MimeType ?? "application/octet-stream", doc.FileName ?? "document");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // ======================= PHASE 3: CO-FOUNDER / EQUITY OFFER CREATION =======================

        // POST /api/marketplace/projects/{ideaId}/deals/equity
        [HttpPost("{ideaId}/deals/equity")]
        public async Task<IActionResult> CreateEquityOffer(string ideaId, [FromBody] CreateEquityOfferRequest request)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _context.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
                if (idea == null)
                    return NotFound(ApiResponse.Error("Project not found.", HttpContext.TraceIdentifier));

                var listing = idea.Phase5Data?.PathA?.MarketplaceListing;
                if (listing == null || (listing.Status != "live" && listing.Status != "available"))
                    return UnprocessableEntity(ApiResponse.Error("Project has no active marketplace listing."));

                var dealModes = listing.DealModes?.Count > 0
                    ? listing.DealModes
                    : new List<string> { listing.SaleType ?? "full_buyout" };

                if (!dealModes.Any(m => string.Equals(m, "equity_partnership", StringComparison.OrdinalIgnoreCase)))
                    return UnprocessableEntity(ApiResponse.Error("Equity partnership deal mode is not enabled for this project."));

                if (idea.UserId == userId)
                    return UnprocessableEntity(ApiResponse.Error("You cannot create a deal on your own project."));

                // 1. Validate accepted interest
                var interest = await _context.ProjectInterests
                    .Find(x => x.IdeaId == ideaId && x.EntrepreneurId == userId)
                    .SortByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();

                if (interest == null || interest.Status != "accepted")
                    return UnprocessableEntity(ApiResponse.Error("An accepted project interest is required before creating an offer."));

                // 2. Validate private project access grant
                var grant = await GetValidAccessGrantAsync(ideaId, userId);
                bool hasAccess = grant != null && (grant.NdaSigned || !listing.NdaRequired) && grant.Status == "active";
                if (!hasAccess)
                    return StatusCode(403, ApiResponse.Error("Valid private project access is required to formulate an offer."));

                // 3. Validate terms payload
                if (request.EquityPercentage <= 0 || request.EquityPercentage >= 100)
                    return UnprocessableEntity(ApiResponse.Error("Equity percentage must be between 0 and 100."));

                if (string.IsNullOrWhiteSpace(request.CreatorRole))
                    return UnprocessableEntity(ApiResponse.Error("Creator role is required."));

                if (request.CashComponent < 0)
                    return UnprocessableEntity(ApiResponse.Error("Cash component cannot be negative."));

                if (request.VestingEnabled)
                {
                    if (request.VestingMonths <= 0)
                        return UnprocessableEntity(ApiResponse.Error("Vesting months must be greater than 0."));
                    if (request.CliffMonths < 0 || request.CliffMonths > request.VestingMonths)
                        return UnprocessableEntity(ApiResponse.Error("Cliff months must be between 0 and total vesting months."));
                }

                if (request.ExpiresAt.HasValue && request.ExpiresAt.Value <= DateTime.UtcNow)
                    return UnprocessableEntity(ApiResponse.Error("Offer expiration date must be in the future."));

                // Check for existing active deal (OFFER_NEGOTIATION or ROLES_PENDING)
                var existingDeal = await _context.DealExecutions
                    .Find(d => d.IdeaId == ideaId && d.EntrepreneurId == userId &&
                               (d.DealStage == "OFFER_NEGOTIATION" || d.DealStage == "ROLES_PENDING"))
                    .FirstOrDefaultAsync();

                if (existingDeal != null)
                {
                    return Ok(ApiResponse.Ok("An active deal already exists for this project.", await MapEquityDealDtoAsync(existingDeal)));
                }

                var terms = new EquityTerms
                {
                    EquityPercentage = request.EquityPercentage,
                    CreatorRole = request.CreatorRole.Trim(),
                    CashComponent = request.CashComponent,
                    VestingEnabled = request.VestingEnabled,
                    VestingMonths = request.VestingEnabled ? request.VestingMonths : 0,
                    CliffMonths = request.VestingEnabled ? request.CliffMonths : 0,
                    Responsibilities = request.Responsibilities?.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).ToList() ?? new(),
                    TimeCommitment = request.TimeCommitment?.Trim() ?? "Part-time",
                    ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(14),
                    Notes = request.Notes?.Trim()
                };

                var v1 = new TermSheetRevision
                {
                    RevisionNumber = 1,
                    ProposedByRole = "entrepreneur",
                    ProposedByPrincipalId = userId,
                    OfferedByRole = "entrepreneur",
                    OfferedByUserId = userId,
                    Status = "pending",
                    EquityTerms = terms,
                    Note = request.Notes?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = terms.ExpiresAt
                };

                var deal = new DealExecution
                {
                    Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                    DealType = "EQUITY_PARTNERSHIP",
                    IdeaId = ideaId,
                    ListingId = idea.Id,
                    ProjectInterestId = interest.Id.ToString(),
                    CreatorId = idea.UserId,
                    EntrepreneurId = userId,
                    ConversationId = interest.ConversationId,
                    Status = "initiated",
                    DealStage = "OFFER_NEGOTIATION",
                    CurrentTurn = "creator",
                    EquityTerms = terms,
                    Revisions = new List<TermSheetRevision> { v1 },
                    CreatedByUserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Version = 1
                };

                await _context.DealExecutions.InsertOneAsync(deal);

                // Messenger event
                var entUser = await _userManager.FindByIdAsync(userId);
                var entrepreneurName = entUser?.Name ?? entUser?.UserName ?? "Entrepreneur";
                var projectName = idea.Project?.Name ?? "the project";

                await PostMessengerEventAsync(deal.ConversationId, userId,
                    $"{entrepreneurName} sent you a {request.EquityPercentage}% Co-founder / Equity Offer.");

                // Notifications
                if (Guid.TryParse(idea.UserId, out var creatorGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            creatorGuid,
                            "New Equity Offer",
                            $"{entrepreneurName} sent a {request.EquityPercentage}% Co-founder / Equity Offer for {projectName}.",
                            link: $"/dashboard/creator/crossroads?ideaId={idea.Id}"
                        );
                    }
                    catch { }
                }

                // Audit log
                await _context.MarketplaceProjectAccessLogs.InsertOneAsync(new MarketplaceProjectAccessLog
                {
                    IdeaId = ideaId,
                    ProjectInterestId = deal.Id,
                    UserId = userId,
                    EventType = "equity_offer_created",
                    Timestamp = DateTime.UtcNow,
                    IpHash = GetClientIpHash(),
                    NdaVersion = "rev_1"
                });

                var dto = await MapEquityDealDtoAsync(deal);
                return StatusCode(201, ApiResponse.Ok("Equity offer sent successfully.", dto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // ======================= FULL BUYOUT OFFER CREATION (STEP 1) =======================

        // POST /api/marketplace/projects/{ideaId}/deals/buyout
        [HttpPost("{ideaId}/deals/buyout")]
        public async Task<IActionResult> CreateBuyoutOffer(string ideaId, [FromBody] CreateBuyoutOfferRequest request)
        {
            try
            {
                var userId = GetUserId();
                var idea = await _context.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
                if (idea == null)
                    return NotFound(ApiResponse.Error("Project not found.", HttpContext.TraceIdentifier));

                var listing = idea.Phase5Data?.PathA?.MarketplaceListing;
                if (listing == null || (listing.Status != "live" && listing.Status != "available"))
                    return UnprocessableEntity(ApiResponse.Error("Project has no active marketplace listing."));

                var dealModes = listing.DealModes?.Count > 0
                    ? listing.DealModes
                    : new List<string> { listing.SaleType ?? "full_buyout" };

                if (!dealModes.Any(m => string.Equals(m, "full_buyout", StringComparison.OrdinalIgnoreCase)))
                    return UnprocessableEntity(ApiResponse.Error("Full buyout deal mode is not enabled for this project."));

                if (idea.UserId == userId)
                    return UnprocessableEntity(ApiResponse.Error("You cannot create a deal on your own project."));

                // 1. Validate accepted interest
                var interest = await _context.ProjectInterests
                    .Find(x => x.IdeaId == ideaId && x.EntrepreneurId == userId)
                    .SortByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();

                if (interest == null || interest.Status != "accepted")
                    return UnprocessableEntity(ApiResponse.Error("An accepted project interest is required before creating an offer."));

                // 2. Validate private project access grant
                var grant = await GetValidAccessGrantAsync(ideaId, userId);
                bool hasAccess = grant != null && (grant.NdaSigned || !listing.NdaRequired) && grant.Status == "active";
                if (!hasAccess)
                    return StatusCode(403, ApiResponse.Error("Valid private project access is required to formulate an offer."));

                // 3. Validate terms payload
                if (request.PurchasePrice <= 0)
                    return UnprocessableEntity(ApiResponse.Error("Purchase price must be greater than zero."));

                if (request.HandoverPeriodWeeks < 0)
                    return UnprocessableEntity(ApiResponse.Error("Handover period cannot be negative."));

                if (request.TransitionSupportWeeks < 0)
                    return UnprocessableEntity(ApiResponse.Error("Transition support weeks cannot be negative."));

                if (request.ExpiresAt.HasValue && request.ExpiresAt.Value <= DateTime.UtcNow)
                    return UnprocessableEntity(ApiResponse.Error("Offer expiration date must be in the future."));

                // Check for existing active deal (OFFER_NEGOTIATION or other pending states)
                var existingDeal = await _context.DealExecutions
                    .Find(d => d.IdeaId == ideaId && d.EntrepreneurId == userId &&
                               (d.DealStage == "OFFER_NEGOTIATION" || d.DealStage == "ROLES_PENDING"))
                    .FirstOrDefaultAsync();

                if (existingDeal != null)
                {
                    return Ok(ApiResponse.Ok("An active deal already exists for this project.", await MapEquityDealDtoAsync(existingDeal)));
                }

                var terms = new BuyoutTerms
                {
                    PurchasePrice = request.PurchasePrice,
                    HandoverPeriodWeeks = request.HandoverPeriodWeeks,
                    TransitionSupportWeeks = request.TransitionSupportWeeks,
                    IncludedAssets = request.IncludedAssets ?? new List<string>
                    {
                        "Concept & Intellectual Property",
                        "Business Plan & Financial Model",
                        "Brand Assets & Logo",
                        "Commercial Assets & Pricing Model",
                        "Project Documentation"
                    },
                    ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(14),
                    Notes = request.Notes?.Trim()
                };

                var v1 = new TermSheetRevision
                {
                    RevisionNumber = 1,
                    ProposedByRole = "entrepreneur",
                    ProposedByPrincipalId = userId,
                    OfferedByRole = "entrepreneur",
                    OfferedByUserId = userId,
                    Status = "pending",
                    BuyoutTerms = terms,
                    Note = request.Notes?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = terms.ExpiresAt
                };

                var deal = new DealExecution
                {
                    Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                    DealType = "FULL_BUYOUT",
                    IdeaId = ideaId,
                    ListingId = idea.Id,
                    ProjectInterestId = interest.Id.ToString(),
                    CreatorId = idea.UserId,
                    EntrepreneurId = userId,
                    ConversationId = interest.ConversationId,
                    Status = "initiated",
                    DealStage = "OFFER_NEGOTIATION",
                    CurrentTurn = "creator",
                    BuyoutTerms = terms,
                    Revisions = new List<TermSheetRevision> { v1 },
                    CreatedByUserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Version = 1
                };

                await _context.DealExecutions.InsertOneAsync(deal);

                // Messenger event
                var entUser = await _userManager.FindByIdAsync(userId);
                var entrepreneurName = entUser?.Name ?? entUser?.UserName ?? "Entrepreneur";
                var projectName = idea.Project?.Name ?? "the project";

                await PostMessengerEventAsync(interest.ConversationId, userId,
                    $"{entrepreneurName} submitted Full Buyout Offer V1 for {projectName}: Purchase Price €{terms.PurchasePrice:N0}.");

                // Audit log
                await _context.MarketplaceProjectAccessLogs.InsertOneAsync(new MarketplaceProjectAccessLog
                {
                    IdeaId = ideaId,
                    ProjectInterestId = deal.Id,
                    UserId = userId,
                    EventType = "buyout_offer_created",
                    Timestamp = DateTime.UtcNow,
                    IpHash = GetClientIpHash(),
                    NdaVersion = "rev_1"
                });

                var dto = await MapEquityDealDtoAsync(deal);
                return StatusCode(201, ApiResponse.Ok("Full Buyout offer sent successfully.", dto));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // GET /api/marketplace/projects/{ideaId}/deals/my
        [HttpGet("{ideaId}/deals/my")]
        public async Task<IActionResult> GetMyDeal(string ideaId)
        {
            try
            {
                var userId = GetUserId();
                var deal = await _context.DealExecutions
                    .Find(d => d.IdeaId == ideaId && (d.EntrepreneurId == userId || d.CreatorId == userId))
                    .SortByDescending(d => d.CreatedAt)
                    .FirstOrDefaultAsync();

                if (deal == null)
                    return Ok(ApiResponse.Ok("OK", new { hasDeal = false, deal = (EquityDealDto?)null }));

                var dto = await MapEquityDealDtoAsync(deal);
                return Ok(ApiResponse.Ok("OK", new { hasDeal = true, deal = dto }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        private async Task<EquityDealDto> MapEquityDealDtoAsync(DealExecution deal)
        {
            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId)
                ? await _userManager.FindByIdAsync(deal.CreatorId)
                : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId)
                ? await _userManager.FindByIdAsync(deal.EntrepreneurId)
                : null;

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(x => x.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            var activeTerms = deal.EquityTerms ?? deal.Revisions?.LastOrDefault()?.EquityTerms ?? new EquityTerms();
            var activeBuyoutTerms = deal.BuyoutTerms ?? deal.Revisions?.LastOrDefault()?.BuyoutTerms;

            return new EquityDealDto
            {
                Id = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                ProjectName = idea?.Project?.Name ?? "Project",
                DealType = deal.DealType,
                DealStage = deal.DealStage,
                Status = deal.Status,
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorUser?.Name ?? creatorUser?.UserName ?? "Creator",
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entUser?.Name ?? entUser?.UserName ?? "Entrepreneur",
                ConversationId = deal.ConversationId ?? "",
                CurrentTurn = deal.CurrentTurn,
                CurrentRevisionNumber = deal.Revisions?.Count ?? 1,
                AcceptedRevisionNumber = deal.AcceptedRevisionNumber,
                AcceptedAt = deal.AcceptedAt,
                ActiveTerms = MapTermsDto(activeTerms),
                BuyoutTerms = activeBuyoutTerms != null ? MapBuyoutTermsDto(activeBuyoutTerms) : null,
                Revisions = (deal.Revisions ?? new List<TermSheetRevision>()).Select(MapRevisionDto).ToList(),
                CreatedAt = deal.CreatedAt,
                UpdatedAt = deal.UpdatedAt
            };
        }

        private static EquityTermsDto MapTermsDto(EquityTerms t) => new()
        {
            EquityPercentage = t.EquityPercentage,
            CreatorRole = t.CreatorRole,
            CashComponent = t.CashComponent,
            VestingEnabled = t.VestingEnabled,
            VestingMonths = t.VestingMonths,
            CliffMonths = t.CliffMonths,
            Responsibilities = t.Responsibilities ?? new(),
            TimeCommitment = t.TimeCommitment,
            ExpiresAt = t.ExpiresAt,
            Notes = t.Notes
        };

        private static BuyoutTermsDto MapBuyoutTermsDto(BuyoutTerms b) => new()
        {
            PurchasePrice = b.PurchasePrice,
            HandoverPeriodWeeks = b.HandoverPeriodWeeks,
            TransitionSupportWeeks = b.TransitionSupportWeeks,
            IncludedAssets = b.IncludedAssets ?? new(),
            ExpiresAt = b.ExpiresAt,
            Notes = b.Notes
        };

        private static EquityOfferRevisionDto MapRevisionDto(TermSheetRevision r) => new()
        {
            RevisionNumber = r.RevisionNumber,
            OfferedByRole = r.OfferedByRole,
            OfferedByUserId = r.OfferedByUserId,
            Status = r.Status,
            Terms = MapTermsDto(r.EquityTerms ?? new EquityTerms()),
            BuyoutTerms = r.BuyoutTerms != null ? MapBuyoutTermsDto(r.BuyoutTerms) : null,
            Note = r.Note,
            CreatedAt = r.CreatedAt,
            RespondedAt = r.RespondedAt,
            ExpiresAt = r.ExpiresAt
        };

        private async Task PostMessengerEventAsync(string? conversationId, string senderId, string message)
        {
            if (string.IsNullOrEmpty(conversationId) || !Guid.TryParse(senderId, out var senderGuid))
                return;

            try
            {
                var msgRepo = HttpContext?.RequestServices?.GetService(typeof(MessagesRepository)) as MessagesRepository;
                if (msgRepo != null && MongoDB.Bson.ObjectId.TryParse(conversationId, out var convoOid))
                {
                    var msg = new ChatMessage
                    {
                        ConversationId = convoOid,
                        SenderId = senderGuid,
                        Message = message,
                        MessageType = "System",
                        CreatedAt = DateTime.UtcNow
                    };
                    await msgRepo.AddAsync(msg);
                }
            }
            catch { }
        }

        /// <summary>
        /// GET /api/marketplace/projects/connections
        /// and GET /api/entrepreneur/project-connections
        /// Returns all Creator projects that the authenticated Entrepreneur has connected with or acted on.
        /// </summary>
        [HttpGet("connections")]
        [HttpGet("/api/entrepreneur/project-connections")]
        public async Task<IActionResult> GetEntrepreneurProjectConnections()
        {
            try
            {
                var userId = GetUserId();

                // 1. Fetch all ProjectInterests for this entrepreneur
                var interests = await _context.ProjectInterests
                    .Find(pi => pi.EntrepreneurId == userId)
                    .ToListAsync();

                // 2. Fetch all AccessGrants for this entrepreneur
                var grants = await _context.MarketplaceProjectAccessGrants
                    .Find(g => g.EntrepreneurId == userId)
                    .ToListAsync();

                // 3. Fetch all DealExecutions where entrepreneur is involved
                var deals = await _context.DealExecutions
                    .Find(d => d.EntrepreneurId == userId || d.CreatedByUserId == userId)
                    .ToListAsync();

                // Collect distinct IdeaIds
                var ideaIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var pi in interests)
                {
                    if (!string.IsNullOrWhiteSpace(pi.IdeaId))
                        ideaIds.Add(pi.IdeaId);
                }

                foreach (var g in grants)
                {
                    if (!string.IsNullOrWhiteSpace(g.IdeaId))
                        ideaIds.Add(g.IdeaId);
                }

                foreach (var d in deals)
                {
                    if (!string.IsNullOrWhiteSpace(d.IdeaId))
                        ideaIds.Add(d.IdeaId);
                }

                if (ideaIds.Count == 0)
                {
                    return Ok(ApiResponse.Ok("OK", new List<EntrepreneurProjectConnectionDto>()));
                }

                // 4. Fetch matching CreatorIdeas using valid 24-char hex ObjectIds only
                var validHexIdeaIds = ideaIds
                    .Where(id => !string.IsNullOrWhiteSpace(id) && ObjectId.TryParse(id, out _))
                    .ToList();

                var ideaList = validHexIdeaIds.Count > 0
                    ? await _context.CreatorIdeas
                        .Find(i => validHexIdeaIds.Contains(i.Id))
                        .ToListAsync()
                    : new List<CreatorIdea>();
                var ideaDict = ideaList.ToDictionary(i => i.Id, i => i, StringComparer.OrdinalIgnoreCase);

                // 5. Batch-fetch creator users
                var creatorIds = ideaList.Select(i => i.UserId)
                    .Concat(interests.Select(pi => pi.CreatorId))
                    .Concat(deals.Select(d => d.CreatorId))
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct()
                    .ToList();

                var creatorUsers = new Dictionary<string, ApplicationUser>(StringComparer.OrdinalIgnoreCase);
                if (creatorIds.Count > 0)
                {
                    var guids = creatorIds.Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty).Where(g => g != Guid.Empty).ToList();
                    if (guids.Count > 0)
                    {
                        var users = await _context.ApplicationUsers.Find(u => guids.Contains(u.Id)).ToListAsync();
                        foreach (var u in users)
                        {
                            creatorUsers[u.Id.ToString()] = u;
                        }
                    }
                }

                var results = new List<EntrepreneurProjectConnectionDto>();

                foreach (var ideaId in ideaIds)
                {
                    ideaDict.TryGetValue(ideaId, out var idea);
                    var project = idea?.Project;
                    var listing = idea?.Phase5Data?.PathA?.MarketplaceListing;

                    // Match deals for this idea
                    var ideaDeals = deals.Where(d => string.Equals(d.IdeaId, ideaId, StringComparison.OrdinalIgnoreCase)).ToList();
                    var primaryDeal = ideaDeals
                        .OrderByDescending(d => d.DealStage == "SOLD" || d.DealStage == "PARTNERSHIP_ACTIVE" || d.DealStage == "CO_FOUNDED" ? 2 : (d.Status == "initiated" || d.Status == "in_progress" ? 1 : 0))
                        .ThenByDescending(d => d.UpdatedAt)
                        .FirstOrDefault();

                    // Match interests for this idea
                    var ideaInterests = interests.Where(pi => string.Equals(pi.IdeaId, ideaId, StringComparison.OrdinalIgnoreCase)).ToList();
                    var primaryInterest = ideaInterests
                        .OrderByDescending(pi => pi.Status == "accepted" ? 2 : (pi.Status == "pending" ? 1 : 0))
                        .ThenByDescending(pi => pi.UpdatedAt)
                        .FirstOrDefault();

                    // Match grant for this idea
                    var primaryGrant = grants.Where(g => string.Equals(g.IdeaId, ideaId, StringComparison.OrdinalIgnoreCase))
                        .OrderByDescending(g => g.NdaSigned ? 1 : 0)
                        .ThenByDescending(g => g.GrantedAt)
                        .FirstOrDefault();

                    // Resolve creator info
                    var creatorId = idea?.UserId ?? primaryDeal?.CreatorId ?? primaryInterest?.CreatorId ?? "";
                    creatorUsers.TryGetValue(creatorId, out var creatorUser);
                    var creatorName = !string.IsNullOrWhiteSpace(creatorUser?.Name)
                        ? creatorUser.Name
                        : (!string.IsNullOrWhiteSpace(creatorUser?.UserName) ? creatorUser.UserName : "Creator");
                    var creatorAvatarUrl = creatorUser?.ImagePath;

                    // Determine Deal Type
                    string? dealType = primaryDeal?.DealType;
                    if (string.IsNullOrEmpty(dealType))
                    {
                        var mode = primaryInterest?.DealMode ?? primaryInterest?.DealModes?.FirstOrDefault();
                        if (!string.IsNullOrEmpty(mode))
                        {
                            dealType = mode.ToUpperInvariant();
                        }
                        else if (listing?.DealModes?.Count == 1)
                        {
                            dealType = listing.DealModes.First().ToUpperInvariant();
                        }
                    }

                    // Determine NDA state
                    bool ndaRequired = listing?.NdaRequired ?? primaryGrant?.NdaRequired ?? false;
                    string ndaStatus = "NOT_REQUIRED";
                    if (ndaRequired || primaryGrant != null)
                    {
                        if (primaryGrant != null && primaryGrant.NdaSigned)
                            ndaStatus = "SIGNED";
                        else
                            ndaStatus = "PENDING";
                    }

                    // Determine Display Status, Category, Project Outcome
                    string displayStatus = "Interest Pending";
                    string category = "Pending";
                    string? outcome = null;

                    if (primaryDeal != null)
                    {
                        var dt = primaryDeal.DealType?.ToUpperInvariant();
                        var stage = primaryDeal.DealStage?.ToUpperInvariant();
                        var status = primaryDeal.Status?.ToLowerInvariant();

                        if (dt == "FULL_BUYOUT")
                        {
                            if (stage == "SOLD" || status == "sold" || primaryDeal.BuyoutSaleRecord != null)
                            {
                                displayStatus = "SOLD";
                                category = "Completed";
                                outcome = "SOLD";
                            }
                            else if (stage == "HANDOVER_PENDING")
                            {
                                displayStatus = "Asset Handover";
                                category = "Active";
                            }
                            else if (stage == "PAYMENT_PENDING")
                            {
                                displayStatus = "Payment & Closing";
                                category = "Active";
                            }
                            else if (stage == "SIGNING_PENDING")
                            {
                                displayStatus = "Agreement Signing";
                                category = "Active";
                            }
                            else if (stage == "LEGAL_TRANSFER_PENDING")
                            {
                                displayStatus = "Legal & Transfer";
                                category = "Active";
                            }
                            else if (stage == "TERMS_NEGOTIATION" || stage == "OFFER_PENDING" || stage == "OFFER_NEGOTIATION")
                            {
                                displayStatus = "Buyout Terms";
                                category = "Active";
                            }
                            else if (status == "rejected" || status == "withdrawn" || status == "closed")
                            {
                                displayStatus = "Closed";
                                category = "Completed";
                                outcome = "CLOSED";
                            }
                            else
                            {
                                displayStatus = "Buyout In Progress";
                                category = "Active";
                            }
                        }
                        else // EQUITY_PARTNERSHIP or default
                        {
                            if (stage == "PARTNERSHIP_ACTIVE" || stage == "CO_FOUNDED" || primaryDeal.Activation?.Status == "ACTIVATED")
                            {
                                displayStatus = "Partnership Active";
                                category = "Completed";
                                outcome = "PARTNERSHIP_ACTIVE";
                            }
                            else if (stage == "ACTIVATION_PENDING")
                            {
                                displayStatus = "Company Activation";
                                category = "Active";
                            }
                            else if (stage == "SIGNATURE_PENDING")
                            {
                                displayStatus = "Agreement Signing";
                                category = "Active";
                            }
                            else if (stage == "LEGAL_REVIEW_PENDING")
                            {
                                displayStatus = "Legal Review";
                                category = "Active";
                            }
                            else if (stage == "CAP_TABLE_PENDING")
                            {
                                displayStatus = "Cap Table Draft";
                                category = "Active";
                            }
                            else if (stage == "ROLE_AGREEMENT_PENDING" || stage == "ROLES_PENDING")
                            {
                                displayStatus = "Role Agreement";
                                category = "Active";
                            }
                            else if (stage == "OFFER_NEGOTIATION" || stage == "OFFER_PENDING")
                            {
                                displayStatus = "Equity Offer";
                                category = "Active";
                            }
                            else if (status == "rejected" || status == "withdrawn" || status == "closed")
                            {
                                displayStatus = "Closed";
                                category = "Completed";
                                outcome = "CLOSED";
                            }
                            else
                            {
                                displayStatus = "Equity In Progress";
                                category = "Active";
                            }
                        }
                    }
                    else if (primaryInterest != null)
                    {
                        var istatus = primaryInterest.Status?.ToLowerInvariant();
                        if (istatus == "accepted")
                        {
                            if (ndaRequired && ndaStatus == "PENDING")
                            {
                                displayStatus = "NDA Pending";
                                category = "Pending";
                            }
                            else if (ndaStatus == "SIGNED")
                            {
                                displayStatus = "NDA Signed";
                                category = "Active";
                            }
                            else
                            {
                                displayStatus = "Interest Accepted";
                                category = "Active";
                            }
                        }
                        else if (istatus == "pending")
                        {
                            displayStatus = "Interest Pending";
                            category = "Pending";
                        }
                        else if (istatus == "declined")
                        {
                            displayStatus = "Interest Declined";
                            category = "Completed";
                            outcome = "DECLINED";
                        }
                        else
                        {
                            displayStatus = "Interest " + primaryInterest.Status;
                            category = "Pending";
                        }
                    }
                    else if (primaryGrant != null)
                    {
                        if (primaryGrant.NdaSigned)
                        {
                            displayStatus = "NDA Signed";
                            category = "Active";
                        }
                        else
                        {
                            displayStatus = "NDA Pending";
                            category = "Pending";
                        }
                    }

                    // Timestamps
                    DateTime? lastActivity = new[]
                    {
                        primaryDeal?.UpdatedAt,
                        primaryDeal?.AcceptedAt,
                        primaryDeal?.CreatedAt,
                        primaryGrant?.NdaSignedAt,
                        primaryGrant?.GrantedAt,
                        primaryInterest?.UpdatedAt,
                        primaryInterest?.CreatedAt,
                        idea?.UpdatedAt,
                        idea?.CreatedAt
                    }.Where(t => t.HasValue).Select(t => t.Value).OrderByDescending(t => t).FirstOrDefault();

                    DateTime created = new[]
                    {
                        primaryInterest?.CreatedAt,
                        primaryDeal?.CreatedAt,
                        primaryGrant?.GrantedAt,
                        idea?.CreatedAt
                    }.Where(t => t.HasValue && t.Value > DateTime.MinValue).Select(t => t.Value).OrderBy(t => t).FirstOrDefault();

                    if (created == DateTime.MinValue)
                        created = lastActivity ?? DateTime.UtcNow;

                    results.Add(new EntrepreneurProjectConnectionDto
                    {
                        IdeaId = ideaId,
                        ProjectName = project?.Name ?? "Untitled Project",
                        ProjectLogoUrl = project?.Branding?.LogoAsset,
                        ProjectSummary = project?.Tagline ?? project?.Problem ?? project?.Solution ?? "Validated creator project.",
                        ProblemStatement = project?.Problem,
                        TargetAudience = project?.TargetUser,
                        Sector = project?.Sector ?? "General",
                        ClarityScore = (int)Math.Round(project?.ClarityScore ?? 0),

                        CreatorId = creatorId,
                        CreatorName = creatorName,
                        CreatorAvatarUrl = creatorAvatarUrl,

                        InterestId = primaryInterest?.Id.ToString(),
                        InterestStatus = primaryInterest?.Status,
                        SelectedDealMode = primaryInterest?.DealMode ?? primaryInterest?.DealModes?.FirstOrDefault(),

                        NdaRequired = ndaRequired,
                        NdaStatus = ndaStatus,

                        DealExecutionId = primaryDeal?.Id,
                        DealType = dealType,
                        DealStage = primaryDeal?.DealStage,
                        DealStatus = primaryDeal?.Status,

                        DisplayStatus = displayStatus,
                        Category = category,
                        ProjectOutcome = outcome,

                        LastActivityAt = lastActivity ?? created,
                        CreatedAt = created
                    });
                }

                // Sort by most recently active first
                var sortedResults = results.OrderByDescending(r => r.LastActivityAt ?? r.CreatedAt).ToList();

                return Ok(ApiResponse.Ok("OK", sortedResults));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // Mapping helpers
        private static MarketplaceProjectDto MapToPublicDto(CreatorIdea idea, CreatorMarketplaceListing listing)
        {
            var p = idea.Project ?? new CreatorJourneyProject();
            var p3 = idea.Phase3Data ?? new CreatorPhase3Data();

            var dealModes = listing.DealModes?.Count > 0
                ? listing.DealModes
                : new List<string> { listing.SaleType ?? "full_buyout" };

            decimal? askingPrice = dealModes.Contains("full_buyout") ? listing.AskingPrice : null;

            return new MarketplaceProjectDto
            {
                IdeaId = idea.Id,
                ProjectName = p.Name ?? "Untitled Idea",
                Tagline = p.Tagline ?? p.Solution ?? "",
                Problem = p.Problem ?? "",
                TargetUser = p.TargetUser ?? "",
                Solution = p.Solution ?? "",
                Sector = p.Sector ?? "General",
                Country = "",
                Stage = "Concept",
                ClarityScore = p.ClarityScore,
                ReadinessScore = p3.InvestorReadinessScore?.Total ?? 0,
                DealModes = dealModes,
                AskingPrice = askingPrice,
                NdaRequired = listing.NdaRequired,
                Audience = listing.Audience ?? "public",
                Status = listing.Status == "live" ? "available" : listing.Status,
                PublishedAt = listing.PublishedAt
            };
        }

        private static PrivateMarketplaceProjectDto MapToPrivateDto(
            CreatorIdea idea,
            CreatorMarketplaceListing listing,
            BusinessPlanSession? bpSession = null,
            ForecastSession? forecastSession = null)
        {
            var pub = MapToPublicDto(idea, listing);
            var p = idea.Project ?? new CreatorJourneyProject();
            var p2 = idea.Phase2Data ?? new CreatorPhase2Data();
            var p3 = idea.Phase3Data ?? new CreatorPhase3Data();
            var p4 = idea.Phase4Data ?? new CreatorPhase4Data();
            var p5 = idea.Phase5Data ?? new CreatorPhase5Data();

            // Intelligence
            var ir = p3.InvestorReadinessScore;
            var lc = p3.LegalChecklist;
            var fg = p3.FormationGenerator;
            var di = p2.DiscoveryInputs;

            var intelligence = new PrivateIntelligenceDto
            {
                InvestorReadiness = ir != null ? new PrivateInvestorReadinessDto
                {
                    Total = ir.Total,
                    Label = ir.Label ?? string.Empty,
                    ConceptClarity = ir.Breakdown?.ConceptClarity ?? 0,
                    MarketEvidence = ir.Breakdown?.MarketEvidence ?? 0,
                    FinancialModel = ir.Breakdown?.FinancialModel ?? 0,
                    LegalReadiness = ir.Breakdown?.LegalReadiness ?? 0,
                    TeamCredibility = ir.Breakdown?.TeamCredibility ?? 0
                } : null,
                LegalChecklist = lc != null ? new PrivateLegalChecklistDto
                {
                    CompletedCount = lc.CompletedCount,
                    TotalCount = lc.TotalCount,
                    Items = lc.Items?.Select(item => new PrivateLegalItemDto
                    {
                        Id = item.Id,
                        Label = item.Label,
                        Category = item.Category,
                        Status = item.Status,
                        Badge = item.Badge,
                        SpSpecialty = item.SpSpecialty
                    }).ToList() ?? new()
                } : null,
                Formation = fg != null ? new PrivateFormationDto
                {
                    RecommendedType = fg.RecommendedType ?? string.Empty,
                    RecommendationReason = fg.RecommendationReason ?? string.Empty,
                    SelectedType = fg.SelectedType ?? string.Empty,
                    Options = fg.Options?.Select(o => new PrivateFormationOptionDto
                    {
                        Code = o.Code,
                        Description = o.Description,
                        Capital = o.Capital,
                        FormationTime = o.FormationTime,
                        EstimatedCost = o.EstimatedCost
                    }).ToList() ?? new(),
                    YouHave = fg.YouHave ?? new(),
                    YouNeed = fg.YouNeed?.Select(n => new PrivateSkillGapDto
                    {
                        Label = n.Label,
                        SpSpecialty = n.SpSpecialty
                    }).ToList() ?? new(),
                    CofounderDraft = fg.CofounderDraft != null ? new PrivateCofounderDraftDto
                    {
                        RoleNeeded = fg.CofounderDraft.RoleNeeded ?? string.Empty,
                        EquityRange = fg.CofounderDraft.EquityRange ?? string.Empty,
                        LocationPreference = fg.CofounderDraft.LocationPreference ?? string.Empty
                    } : null
                } : null,
                DiscoveryInputs = di != null ? new PrivateDiscoveryInputsDto
                {
                    Sectors = di.Sectors ?? new(),
                    ObservedProblem = di.ObservedProblem ?? string.Empty,
                    Strengths = di.Strengths ?? new()
                } : null,
                Available = ir != null || lc != null || fg != null || di != null
            };

            // Business Plan
            var bpVersion = bpSession?.Versions?.FirstOrDefault(v => v.Version == bpSession.CurrentVersion) ?? bpSession?.Versions?.LastOrDefault();
            var bpContent = bpVersion?.Content;

            var businessPlan = new PrivateBusinessPlanDto
            {
                Summary = p.Solution ?? "",
                ExecutiveSummary = p.Solution ?? "",
                MarketOpportunity = p.TargetMarket ?? "",
                CompetitiveAdvantage = p.CreatorEdge ?? p.MarketGap ?? "",
                RevenueModel = p4.PricingModel ?? "",
                Available = bpContent != null || !string.IsNullOrWhiteSpace(p.Solution) || !string.IsNullOrWhiteSpace(p.TargetMarket)
            };

            if (bpContent != null)
            {
                if (bpContent.TryGetValue("executiveSummary", out var esVal) && esVal.IsBsonDocument)
                {
                    var esDoc = esVal.AsBsonDocument;
                    if (esDoc.TryGetValue("overview", out var ov) && !ov.IsBsonNull) businessPlan.ExecutiveSummary = ov.AsString;
                    if (esDoc.TryGetValue("valueProposition", out var vp) && !vp.IsBsonNull) businessPlan.ValueProposition = vp.AsString;
                    if (esDoc.TryGetValue("highlights", out var hl) && hl.IsBsonArray)
                        businessPlan.Highlights = hl.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();
                }

                if (bpContent.TryGetValue("marketAnalysis", out var maVal) && maVal.IsBsonDocument)
                {
                    var maDoc = maVal.AsBsonDocument;
                    if (maDoc.TryGetValue("overview", out var ov) && !ov.IsBsonNull) businessPlan.MarketOpportunity = ov.AsString;
                    if (maDoc.TryGetValue("targetSegments", out var ts) && ts.IsBsonArray)
                        businessPlan.TargetSegments = ts.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();
                    if (maDoc.TryGetValue("marketSizeQualitative", out var msq) && !msq.IsBsonNull)
                        businessPlan.MarketSizeQualitative = msq.AsString;
                    if (maDoc.TryGetValue("trends", out var tr) && tr.IsBsonArray)
                        businessPlan.Trends = tr.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();
                }

                if (bpContent.TryGetValue("competitorAnalysis", out var caVal) && caVal.IsBsonDocument)
                {
                    var caDoc = caVal.AsBsonDocument;
                    if (caDoc.TryGetValue("competitors", out var compList) && compList.IsBsonArray)
                    {
                        businessPlan.Competitors = compList.AsBsonArray.Where(c => c.IsBsonDocument).Select(c =>
                        {
                            var cd = c.AsBsonDocument;
                            return new PrivateCompetitorDto
                            {
                                Name = cd.TryGetValue("name", out var n) && !n.IsBsonNull ? n.AsString : "",
                                Positioning = cd.TryGetValue("positioning", out var pos) && !pos.IsBsonNull ? pos.AsString : null,
                                Strengths = cd.TryGetValue("strengths", out var s) && s.IsBsonArray ? s.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList() : new(),
                                Weaknesses = cd.TryGetValue("weaknesses", out var w) && w.IsBsonArray ? w.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList() : new(),
                                OurAdvantage = cd.TryGetValue("ourAdvantage", out var adv) && !adv.IsBsonNull ? adv.AsString : null
                            };
                        }).ToList();
                    }
                }

                if (bpContent.TryGetValue("revenueModel", out var rmVal) && rmVal.IsBsonDocument)
                {
                    var rmDoc = rmVal.AsBsonDocument;
                    if (rmDoc.TryGetValue("summary", out var s) && !s.IsBsonNull) businessPlan.RevenueModel = s.AsString;
                    if (rmDoc.TryGetValue("pricingStrategy", out var ps) && !ps.IsBsonNull) businessPlan.PricingStrategy = ps.AsString;
                    if (rmDoc.TryGetValue("keyMetrics", out var km) && km.IsBsonArray)
                        businessPlan.KeyMetrics = km.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();
                    if (rmDoc.TryGetValue("revenueStreams", out var rsList) && rsList.IsBsonArray)
                    {
                        businessPlan.RevenueStreams = rsList.AsBsonArray.Where(r => r.IsBsonDocument).Select(r =>
                        {
                            var rd = r.AsBsonDocument;
                            return new PrivateRevenueStreamDto
                            {
                                Name = rd.TryGetValue("name", out var n) && !n.IsBsonNull ? n.AsString : "",
                                Description = rd.TryGetValue("description", out var d) && !d.IsBsonNull ? d.AsString : null
                            };
                        }).ToList();
                    }
                }

                if (bpContent.TryGetValue("goToMarket", out var gtmVal) && gtmVal.IsBsonDocument)
                {
                    var gtmDoc = gtmVal.AsBsonDocument;
                    if (gtmDoc.TryGetValue("strategy", out var st) && !st.IsBsonNull) businessPlan.GtmStrategy = st.AsString;
                    if (gtmDoc.TryGetValue("channels", out var ch) && ch.IsBsonArray)
                        businessPlan.GtmChannels = ch.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();
                    if (gtmDoc.TryGetValue("phases", out var phList) && phList.IsBsonArray)
                    {
                        businessPlan.GtmPhases = phList.AsBsonArray.Where(pItem => pItem.IsBsonDocument).Select(pItem =>
                        {
                            var pd = pItem.AsBsonDocument;
                            return new PrivateGtmPhaseDto
                            {
                                Name = pd.TryGetValue("name", out var n) && !n.IsBsonNull ? n.AsString : "",
                                Description = pd.TryGetValue("description", out var d) && !d.IsBsonNull ? d.AsString : null
                            };
                        }).ToList();
                    }
                }

                if (bpContent.TryGetValue("operationsPlan", out var opVal) && opVal.IsBsonDocument)
                {
                    var opDoc = opVal.AsBsonDocument;
                    if (opDoc.TryGetValue("keyActivities", out var ka) && ka.IsBsonArray)
                        businessPlan.KeyActivities = ka.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();
                    if (opDoc.TryGetValue("resources", out var res) && res.IsBsonArray)
                        businessPlan.Resources = res.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();
                    if (opDoc.TryGetValue("milestones", out var msList) && msList.IsBsonArray)
                    {
                        businessPlan.Milestones = msList.AsBsonArray.Where(m => m.IsBsonDocument).Select(m =>
                        {
                            var md = m.AsBsonDocument;
                            return new PrivateMilestoneDto
                            {
                                Phase = md.TryGetValue("phase", out var ph) && !ph.IsBsonNull ? ph.AsString : "",
                                Deliverable = md.TryGetValue("deliverable", out var del) && !del.IsBsonNull ? del.AsString : "",
                                Timeframe = md.TryGetValue("timeframe", out var tf) && !tf.IsBsonNull ? tf.AsString : ""
                            };
                        }).ToList();
                    }
                }

                if (bpContent.TryGetValue("risks", out var rkVal) && rkVal.IsBsonArray)
                {
                    businessPlan.Risks = rkVal.AsBsonArray.Where(r => r.IsBsonDocument).Select(r =>
                    {
                        var rd = r.AsBsonDocument;
                        return new PrivateRiskDto
                        {
                            Category = rd.TryGetValue("category", out var c) && !c.IsBsonNull ? c.AsString : "",
                            Risk = rd.TryGetValue("risk", out var rk) && !rk.IsBsonNull ? rk.AsString : "",
                            Mitigation = rd.TryGetValue("mitigation", out var m) && !m.IsBsonNull ? m.AsString : ""
                        };
                    }).ToList();
                }
            }

            // Financial Forecast
            var basis = p3.FormationGenerator?.ForecastBasis;
            var forecastVer = forecastSession?.Versions?.FirstOrDefault(v => v.Version == forecastSession.CurrentVersion) ?? forecastSession?.Versions?.LastOrDefault();
            var fContent = forecastVer?.Content;

            var forecast = new PrivateFinancialForecastDto
            {
                Tam = basis?.Tam,
                MonthlyGrowthPct = basis?.MonthlyGrowthPct,
                BreakEvenMonth = basis?.BreakEvenMonth,
                ProjectedArr = p4.PricingForecastContext?.ForecastArpu != null ? (double)p4.PricingForecastContext.ForecastArpu * 12 : null,
                Arpu = (double?)p4.PricingForecastContext?.ForecastArpu,
                EstimatedRunwayMonths = p5.PathB?.SeedFunding?.EstimatedRunwayMonths,
                Currency = basis?.Currency ?? "EUR",
                Available = fContent != null || basis?.Tam != null || basis?.MonthlyGrowthPct != null || p4.PricingForecastContext?.ForecastArpu != null
            };

            if (fContent != null)
            {
                if (fContent.TryGetValue("assumptions", out var asVal) && asVal.IsBsonArray)
                    forecast.Assumptions = asVal.AsBsonArray.Where(x => x.IsString).Select(x => x.AsString).ToList();

                if (fContent.TryGetValue("advisoryNotice", out var advVal) && !advVal.IsBsonNull)
                    forecast.AdvisoryNotice = advVal.AsString;

                if (fContent.TryGetValue("revenueForecast", out var rfVal) && rfVal.IsBsonDocument)
                {
                    var rfDoc = rfVal.AsBsonDocument;
                    if (rfDoc.TryGetValue("summary", out var s) && !s.IsBsonNull) forecast.RevenueSummary = s.AsString;
                    if (rfDoc.TryGetValue("currency", out var c) && !c.IsBsonNull && !string.IsNullOrEmpty(c.AsString)) forecast.Currency = c.AsString;
                    if (rfDoc.TryGetValue("monthly", out var mList) && mList.IsBsonArray)
                    {
                        forecast.RevenueMonthly = mList.AsBsonArray.Where(m => m.IsBsonDocument).Select(m =>
                        {
                            var md = m.AsBsonDocument;
                            return new PrivateMonthlyMetricDto
                            {
                                Month = md.TryGetValue("month", out var mo) && mo.IsNumeric ? mo.ToInt32() : 0,
                                Amount = md.TryGetValue("amount", out var am) && am.IsNumeric ? Convert.ToDecimal(am.ToDouble()) : 0,
                                Notes = md.TryGetValue("notes", out var n) && !n.IsBsonNull ? n.AsString : null
                            };
                        }).ToList();
                    }
                }

                if (fContent.TryGetValue("costForecast", out var cfVal) && cfVal.IsBsonDocument)
                {
                    var cfDoc = cfVal.AsBsonDocument;
                    if (cfDoc.TryGetValue("summary", out var s) && !s.IsBsonNull) forecast.CostSummary = s.AsString;
                    if (cfDoc.TryGetValue("monthly", out var mList) && mList.IsBsonArray)
                    {
                        forecast.CostMonthly = mList.AsBsonArray.Where(m => m.IsBsonDocument).Select(m =>
                        {
                            var md = m.AsBsonDocument;
                            return new PrivateCostMetricDto
                            {
                                Month = md.TryGetValue("month", out var mo) && mo.IsNumeric ? mo.ToInt32() : 0,
                                FixedCosts = md.TryGetValue("fixedCosts", out var fc) && fc.IsNumeric ? Convert.ToDecimal(fc.ToDouble()) : 0,
                                VariableCosts = md.TryGetValue("variableCosts", out var vc) && vc.IsNumeric ? Convert.ToDecimal(vc.ToDouble()) : 0,
                                Notes = md.TryGetValue("notes", out var n) && !n.IsBsonNull ? n.AsString : null
                            };
                        }).ToList();
                    }
                }

                if (fContent.TryGetValue("cashFlowProjection", out var cfpVal) && cfpVal.IsBsonDocument)
                {
                    var cfpDoc = cfpVal.AsBsonDocument;
                    if (cfpDoc.TryGetValue("summary", out var s) && !s.IsBsonNull) forecast.CashFlowSummary = s.AsString;
                    if (cfpDoc.TryGetValue("monthly", out var mList) && mList.IsBsonArray)
                    {
                        forecast.CashFlowMonthly = mList.AsBsonArray.Where(m => m.IsBsonDocument).Select(m =>
                        {
                            var md = m.AsBsonDocument;
                            return new PrivateCashFlowMetricDto
                            {
                                Month = md.TryGetValue("month", out var mo) && mo.IsNumeric ? mo.ToInt32() : 0,
                                NetCashFlow = md.TryGetValue("netCashFlow", out var ncf) && ncf.IsNumeric ? Convert.ToDecimal(ncf.ToDouble()) : 0,
                                EndingBalance = md.TryGetValue("endingBalance", out var eb) && eb.IsNumeric ? Convert.ToDecimal(eb.ToDouble()) : 0,
                                Notes = md.TryGetValue("notes", out var n) && !n.IsBsonNull ? n.AsString : null
                            };
                        }).ToList();
                    }
                }

                if (fContent.TryGetValue("breakEvenAnalysis", out var beaVal) && beaVal.IsBsonDocument)
                {
                    var beaDoc = beaVal.AsBsonDocument;
                    if (beaDoc.TryGetValue("breakEvenMonth", out var bem) && bem.IsNumeric) forecast.BreakEvenMonth = bem.ToInt32();
                    if (beaDoc.TryGetValue("breakEvenRevenue", out var ber) && ber.IsNumeric) forecast.BreakEvenRevenue = Convert.ToDecimal(ber.ToDouble());
                    if (beaDoc.TryGetValue("summary", out var s) && !s.IsBsonNull) forecast.BreakEvenSummary = s.AsString;
                    if (beaDoc.TryGetValue("notes", out var n) && !n.IsBsonNull) forecast.BreakEvenNotes = n.AsString;
                }

                if (fContent.TryGetValue("risks", out var rkVal) && rkVal.IsBsonArray)
                {
                    forecast.Risks = rkVal.AsBsonArray.Where(r => r.IsBsonDocument).Select(r =>
                    {
                        var rd = r.AsBsonDocument;
                        return new PrivateRiskDto
                        {
                            Category = rd.TryGetValue("category", out var c) && !c.IsBsonNull ? c.AsString : "",
                            Risk = rd.TryGetValue("risk", out var rk) && !rk.IsBsonNull ? rk.AsString : "",
                            Mitigation = rd.TryGetValue("mitigation", out var m) && !m.IsBsonNull ? m.AsString : ""
                        };
                    }).ToList();
                }
            }

            var pricing = new PrivatePricingDto
            {
                PricingModel = p4.PricingModel ?? "tiered",
                Tiers = p4.Tiers?.Select(t => new PrivatePricingTierDto
                {
                    Name = t.Name,
                    Price = t.Price,
                    BillingCycle = t.BillingCycle ?? "monthly",
                    Features = t.Features ?? new(),
                    IsHighlighted = t.IsHighlighted
                }).ToList() ?? new(),
                ForecastArpu = p4.PricingForecastContext?.ForecastArpu,
                Available = p4.Tiers?.Count > 0 || !string.IsNullOrEmpty(p4.PricingModel)
            };

            var rc = p4.ResourceCalculation;
            var resourcePlan = new PrivateResourcePlanDto
            {
                LaunchBudgetMin = rc?.TotalLaunchBudgetMin,
                LaunchBudgetMax = rc?.TotalLaunchBudgetMax,
                MonthlyRunningCost = rc?.MonthlyRunningCost,
                TimeToLaunchWeeksMin = rc?.TimeToLaunchWeeksMin,
                TimeToLaunchWeeksMax = rc?.TimeToLaunchWeeksMax,
                TeamRolesNeeded = rc?.TeamRequirements?.Select(r => r.Role).ToList() ?? new(),
                TeamRequirements = rc?.TeamRequirements?.Select(tr => new PrivateTeamRequirementDto
                {
                    Role = tr.Role,
                    Cost = tr.Cost,
                    DurationMonths = tr.DurationMonths,
                    OneTime = tr.OneTime
                }).ToList() ?? new(),
                SaasStack = rc?.SaasStack?.Select(s => new PrivateSaasItemDto
                {
                    Name = s.Name,
                    MonthlyCost = s.MonthlyCost
                }).ToList() ?? new(),
                BudgetBreakdown = rc?.BudgetBreakdown != null ? new PrivateBudgetBreakdownDto
                {
                    TeamPct = rc.BudgetBreakdown.TeamPct,
                    ToolsPct = rc.BudgetBreakdown.ToolsPct,
                    LegalPct = rc.BudgetBreakdown.LegalPct,
                    MiscPct = rc.BudgetBreakdown.MiscPct
                } : null,
                Available = rc != null
            };

            var gtm = p4.GtmSetup;
            var gtmPlan = new PrivateGtmPlanDto
            {
                PrimaryChannels = gtm?.ChannelMix?.Select(c => c.Channel).ToList() ?? new(),
                TargetAudiences = gtm?.TargetAudiences ?? new(),
                WebPresenceAssets = gtm?.WebPresence?.Select(w => w.Label).ToList() ?? new(),
                ChannelMix = gtm?.ChannelMix?.Select(c => new PrivateChannelMixDto
                {
                    Channel = c.Channel,
                    Percent = c.Percent
                }).ToList() ?? new(),
                WebPresence = gtm?.WebPresence?.Select(w => new PrivateWebPresenceDto
                {
                    Id = w.Id,
                    Label = w.Label,
                    Done = w.Done
                }).ToList() ?? new(),
                BenchmarkGtmWeeks = gtm?.BenchmarkGtmWeeks?.Select(bw => new PrivateGtmWeekDto
                {
                    Week = bw.Week,
                    Title = bw.Title,
                    Tasks = bw.Tasks ?? new(),
                    Completed = bw.Completed
                }).ToList() ?? new(),
                Available = gtm != null
            };

            var branding = new PrivateBrandingDto
            {
                LogoAsset = p.Branding?.LogoAsset,
                LogoType = p.Branding?.LogoType,
                BrandingMethod = p.Branding?.BrandingMethod,
                PaletteName = p.Branding?.PaletteName,
                TypographyPairing = p.Branding?.TypographyPairing,
                ColorPalette = p.Branding?.ColorPalette ?? new()
            };

            var documents = (idea.Documents ?? new List<CreatorIdeaDocument>())
                .Where(d => d.Status == "ready")
                .Select(d => new PrivateDocumentDto
                {
                    Id = d.Id,
                    Title = d.Title,
                    DocumentType = d.DocumentType,
                    FileName = d.FileName,
                    MimeType = d.MimeType,
                    SizeBytes = d.SizeBytes ?? 0,
                    CreatedAt = d.CreatedAt,
                    Downloadable = true
                })
                .ToList();

            return new PrivateMarketplaceProjectDto
            {
                IdeaId = pub.IdeaId,
                ProjectName = pub.ProjectName,
                Tagline = pub.Tagline,
                Problem = pub.Problem,
                TargetUser = pub.TargetUser,
                Solution = pub.Solution,
                Sector = pub.Sector,
                Country = pub.Country,
                Stage = pub.Stage,
                ClarityScore = pub.ClarityScore,
                ReadinessScore = pub.ReadinessScore,
                DealModes = pub.DealModes,
                AskingPrice = pub.AskingPrice,
                NdaRequired = pub.NdaRequired,
                Audience = pub.Audience,
                Status = pub.Status,
                PublishedAt = pub.PublishedAt,

                // Core & Strategy
                Concept = p.Concept,
                MarketGap = p.MarketGap,
                CreatorEdge = p.CreatorEdge,
                ExistingAlternatives = p.ExistingAlternatives,
                WhyNow = p.WhyNow,
                RiskiestAssumption = p.RiskiestAssumption,
                TargetMarket = p.TargetMarket,
                Geography = p.Geography,
                Category = p.Category,
                Tags = p.Tags ?? new(),
                SourceMethod = p.SourceMethod,

                // Sections
                Intelligence = intelligence,
                BusinessPlan = businessPlan,
                FinancialForecast = forecast,
                Pricing = pricing,
                ResourcePlan = resourcePlan,
                GtmPlan = gtmPlan,
                Branding = branding,
                Documents = documents
            };
        }
    }
}
