using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Org.BouncyCastle.Crypto;
using System.Linq;
using System.Security.Claims;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;


namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CreatorController : ControllerBase
    {
        private readonly IBusinessIdeasService _serviceIdea;
        private readonly IInvestmentsService _investmentsService;
        private readonly ITransactionsService _transactionsService;
        private readonly SaveFile _saveFile;
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        public CreatorController(IBusinessIdeasService service,
            IInvestmentsService investmentsService,
            ITransactionsService transactionsService,
             SaveFile saveFile,
             MongoDbContext context,
             UserManager<ApplicationUser> userManager)
        {
            _serviceIdea = service;
            _investmentsService = investmentsService;
            _transactionsService = transactionsService;
            _saveFile = saveFile;
            _context = context;
            _userManager = userManager;
        }

        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("User not authenticated");
        }

        private async Task EnsureUniversalPhase1CompleteAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new UnauthorizedAccessException("User not found");

            var phase = user.Onboarding?.Phase ?? 0;
            if (phase < 1)
                throw new UnauthorizedAccessException("Universal Phase 1 (identity verification) must be complete before accessing creator features");
        }


        [HttpGet("dashboard")]
        public async Task<IActionResult> GetCreatorDashboard()
        {
            try
            {
                var userId = GetUserId();
                await EnsureUniversalPhase1CompleteAsync(userId);

            // 1️ Get Creator Ideas
            var ideas = (await _serviceIdea.GetByCreatorAsync(userId)).ToList();
            var ideaIds = ideas.Select(i => i.Id).ToList();

            var totalIdeas = ideas.Count;

            // 2️ Click Analytics (Last 14 Days)
            var last14Days = DateTime.UtcNow.AddDays(-14);

            var totalClicksLast14Days = ideaIds.Any()
                ? await _context.IdeaClicks.CountDocumentsAsync(x =>
                    ideaIds.Contains(x.IdeaId) &&
                    x.ClickedAt >= last14Days)
                : 0;

            // 3️ Investments
            var investments = ideaIds.Any()
                ? (await _investmentsService.GetByIdeaIdsAsync(ideaIds)).ToList()
                : new List<Investments>();

            var totalFundRaised = investments.Sum(i => i.Amount);
            var totalRequired = ideas.Sum(i => i.FundingRequired);
            var totalEquity = ideas.Sum(i => i.EquityOffered);

            var activeInvestors = investments
                .Select(i => i.InvestorId)
                .Distinct()
                .Count();

            // 4️ Investor Info
            var investorIds = investments
                .Select(i => i.InvestorId)
                .Distinct()
                .ToList();

            var investors = investorIds.Any()
                ? await _context.ApplicationUsers
                    .Find(x => investorIds.Contains(x.Id))
                    .ToListAsync()
                : new List<ApplicationUser>();

            var investorDictionary = investors
                .ToDictionary(x => x.Id);

            // 5️ Optimize Investment Grouping 
            var investmentGrouped = investments
                .GroupBy(x => x.IdeaId)
                .ToDictionary(g => g.Key, g => g.ToList());

            // 6️ Idea Wise Summary
            var ideaSummaries = ideas.Select(idea =>
            {
                var ideaInvestments = investmentGrouped.ContainsKey(idea.Id)
                    ? investmentGrouped[idea.Id]
                    : new List<Investments>();

                return new
                {
                    id = idea.Id,
                    name = idea.Name,
                    status = idea.Status,
                    stageLabel = idea.Solution?.StageLabel,
                    isPublished = idea.IsPublished,
                    createdAt = idea.CreatedAt,

                    fundingRequired = idea.FundingRequired,
                    equityOffered = idea.EquityOffered,

                    totalRaised = ideaInvestments.Sum(inv => inv.Amount),

                    fundingProgress = idea.FundingRequired > 0
                        ? Math.Round((ideaInvestments.Sum(inv => inv.Amount) / idea.FundingRequired) * 100, 2)
                        : 0,

                    investors = ideaInvestments
                        .Select(inv =>
                        {
                            var user = investorDictionary.ContainsKey(inv.InvestorId)
                                ? investorDictionary[inv.InvestorId]
                                : null;

                            return user == null ? null : new
                            {
                                investorId = user.Id,
                                name = user.Name,
                                imageUrl = user.ImagePath,
                                ideaName = inv.ideaName,
                                investedAmount = inv.Amount
                            };
                        })
                        .Where(x => x != null)
                        .ToList()
                };
            }).ToList();

            // 7️ Final Response
            var response = new
            {
                totalIdeas,
                totalClicksLast14Days,
                totalFundRaised,
                totalRequired,
                totalEquity,
                activeInvestors,
                ideas = ideaSummaries
            };

            return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        // create new business idea or save draft
        [HttpPost("new-idea/{id?}")]
        public async Task<IActionResult> CreateOrUpdateIdea(
            [FromForm] CreateIdeaDto dto,
            [FromForm] List<IFormFile>? media,
            [FromForm] List<IFormFile>? documents,
            string? id)
        {
            try
            {
                var userId = GetUserId();
                await EnsureUniversalPhase1CompleteAsync(userId);



            // Save media files
            var mediaPaths = new List<string>();
            if (media != null && media.Any())
            {
                foreach (var file in media)
                {
                    var path = await _saveFile.SaveFileAsync(file, "media");
                    mediaPaths.Add(path);
                }
            }

            // Save document files
            var documentPaths = new List<string>();
            if (documents != null && documents.Any())
            {
                foreach (var file in documents)
                {
                    var path = await _saveFile.SaveFileAsync(file, "documents");
                    documentPaths.Add(path);
                }
            }


            string ideaId;

            if (string.IsNullOrEmpty(id))
            {
                var createdIdea = await _serviceIdea.CreateIdeaAsync(dto, userId, mediaPaths, documentPaths);
                ideaId = createdIdea.Id;
            }
            else
            {
                await _serviceIdea.UpdateIdeaAsync(dto, userId, id, mediaPaths, documentPaths);
                ideaId = id;
            }

            return Ok(new
            {
                success = true,
                message = "Draft saved",
                id = ideaId
            });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }



        // get idea by id
        [HttpGet("idea/{id}")]
        public async Task<IActionResult> GetIdea(string id)
        {
            try
            {
                var userId = GetUserId();
                await EnsureUniversalPhase1CompleteAsync(userId);
                var idea = await _serviceIdea.GetByIdAsync(id);
                if (idea == null || idea.CreatorId != userId)
                    return NotFound();

            var responce = new
            {
                id = idea.Id,
                name = idea.Name,
                problem = idea.Problem,
                solution = idea.Solution,
                market = idea.Market,
                businessModel = idea.BusinessModel,
                operations = idea.Operations,
                roadmap = idea.Roadmap,
                compliance = idea.Compliance,
                founderIdentity = idea.FounderIdentity,
                isPublished = idea.IsPublished,
                fundingRequired = idea.FundingRequired,
                equityOffered = idea.EquityOffered,
                status = idea.Status,
                imageVideoUrls = idea.ImageVideo,
                documentUrls = idea.DocumentUrls,
                createAt = idea.CreatedAt,
                updateAt = idea.UpdatedAt

            };

            return Ok(responce);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpGet("my-ideas")]
        public async Task<IActionResult> MyIdeas()
        {
            try
            {
                var userId = GetUserId();
                await EnsureUniversalPhase1CompleteAsync(userId);

            var ideas = await _serviceIdea.GetByCreatorAsync(userId);

            if (ideas == null || !ideas.Any())
                return Ok(new List<object>());

            var ideaIds = ideas.Select(i => i.Id).ToList();

            var investments = ideaIds.Any()
            ? (await _investmentsService.GetByIdeaIdsAsync(ideaIds)).ToList()
            : new List<Investments>();

            var investorIds = investments
               .Select(i => i.InvestorId)
               .Distinct()
               .ToList();

            var investors = investorIds.Any()
                ? await _context.ApplicationUsers
                    .Find(x => investorIds.Contains(x.Id))
                    .ToListAsync()
                : new List<ApplicationUser>();

            var investorDictionary = investors
                .ToDictionary(x => x.Id);

            var investmentGrouped = investments
                .GroupBy(x => x.IdeaId)
                .ToDictionary(g => g.Key, g => g.ToList());
            

            var clickCounts = await _context.IdeaClicks
                .Aggregate()
                .Match(c => c.UserId == userId)
                .Group(
                    c => c.IdeaId,
                    g => new
                    {
                        IdeaId = g.Key,
                        Count = g.Count()
                    })
                .ToListAsync();

            var clickDictionary = clickCounts.ToDictionary(x => x.IdeaId, x => x.Count);


            // Build response with correct totalRaised for each idea
            var response = ideas.Select(idea =>
            {
                investmentGrouped.TryGetValue(idea.Id, out var ideaInvestments);

                ideaInvestments ??= new List<Investments>();

                var totalRaised = ideaInvestments.Sum(x => x.Amount);

                var totalEquity = ideaInvestments.Sum(x => x.EquityPercentage);

                var investorList = ideaInvestments
                    .Select(inv => investorDictionary.TryGetValue(inv.InvestorId, out var investor)
                        ? new
                        {
                            id = investor.Id,
                            name = investor.Name,
                            ImagePath = investor.ImagePath,
                        }
                        : null)
                    .Where(x => x != null)
                    .Distinct()
                    .ToList();

                return new
                {
                    id = idea.Id,
                    name = idea.Name,
                    status = idea.Status,
                    score = idea.ReadinessScore,
                    stageLabel = idea.Solution.StageLabel,
                    isPublished = idea.IsPublished,
                    creatdate = idea.CreatedAt,
                    marketSize = idea.Market?.MarketSize,
                    equityOffered = idea.EquityOffered,

                    views = clickDictionary.TryGetValue(idea.Id, out var totalClick)
                        ? totalClick
                        : 0,

                    fundingRequired = idea.FundingRequired,

                    totalRaised = totalRaised,

                    equity = totalEquity,

                    investors = investorList
                };
            }).ToList();

            return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpPost("toggle-idea/{id}")]
        public async Task<IActionResult> ToggleIdea(string id)
        {
            try
            {
                var userId = GetUserId();
                await EnsureUniversalPhase1CompleteAsync(userId);
                var idea = await _context.BusinessIdeas
                    .Find(x => x.Id == id)
                    .FirstOrDefaultAsync();

                if (idea == null)
                    return NotFound();

                idea.IsPublished = !idea.IsPublished;

                await _context.BusinessIdeas.ReplaceOneAsync(x => x.Id == id, idea);

                return Ok(idea);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("")]

        [HttpGet("investments/{id}")]
        public async Task<IActionResult> GetIdeaInvestments(string id)
        {
            try
            {
                var userId = GetUserId();
                await EnsureUniversalPhase1CompleteAsync(userId);

            var ideas = await _serviceIdea.GetByCreatorAsync(userId);
            if (ideas == null || !ideas.Any())
                return Ok(new List<object>());

            var ideaIds = ideas.Select(i => i.Id).ToList();

            var investor = await _investmentsService.GetByIdeaIdsAsync(ideaIds);
            //if (investor == null || investor.CreatorId != userId) return NotFound();

            var investments = await _investmentsService.GetByIdeaAsync(id);
            if (investments == null || !investments.Any())
                return Ok(new List<object>());

            var response = investments.Select(inv => new
            {
                id = inv.Id,
                investorName = inv.InvestorName,
                investedAmount = inv.Amount,
                equityPercentage = inv.EquityPercentage,
                investedDate = inv.CreatedAt.ToString("yyyy-MM-dd"),
                roundName = inv.RoundName ?? "Seed Round"
            }).ToList();

            return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============ CREATOR PHASES ============

        [HttpPut("cross-roads/{ideaId}/decide")]
        public async Task<IActionResult> DecideCrossRoads(string ideaId, [FromBody] CrossRoadsDecisionRequest request)
        {
            try
            {
                var userId = GetUserId();
                await EnsureUniversalPhase1CompleteAsync(userId);
                if (string.IsNullOrEmpty(ideaId) || string.IsNullOrEmpty(request?.Decision))
                    return BadRequest(new { error = "Missing required fields" });

                if (request.Decision != "PATH_A" && request.Decision != "PATH_B")
                    return BadRequest(new { error = "Decision must be PATH_A or PATH_B" });

                // Update user's CrossRoadsDecision
                var user = await _context.ApplicationUsers.FindOneAndUpdateAsync(
                    Builders<ApplicationUser>.Filter.Eq(u => u.Id, Guid.Parse(userId)),
                    Builders<ApplicationUser>.Update
                        .Set(u => u.CreatorProfile.CrossRoadsDecision, request.Decision),
                    new FindOneAndUpdateOptions<ApplicationUser> { ReturnDocument = ReturnDocument.After }
                );

                if (user == null)
                    return NotFound(new { error = "User not found" });

                return Ok(new { message = "Crossroads decision recorded", decision = request.Decision });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
