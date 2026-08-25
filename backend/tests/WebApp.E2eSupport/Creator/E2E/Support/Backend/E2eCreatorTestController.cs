using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.E2e;
using WebApp.Services.Interface;

namespace WebApp.E2eSupport.Controllers;

/// <summary>
/// Disposable-browser-test data factory. This controller is intentionally
/// unavailable outside the exact E2E environment. It creates ordinary Identity
/// users and the caller signs in through /api/auth/login; it never mints a token
/// or bypasses Creator authorization.
/// </summary>
[ApiController]
[Route("api/e2e/creators")]
[AllowAnonymous]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class E2eCreatorTestController : ControllerBase
{
    private static readonly HashSet<string> SupportedFixtures = new(StringComparer.Ordinal)
    {
        "CreatorBasic",
        "CreatorVerified",
        "CreatorWithTwoIdeas",
        "CreatorBuildReadyForCrossroads",
        "CreatorBuildIncomplete",
        "CreatorBuildEligible",
    };

    private readonly IWebHostEnvironment _environment;
    private readonly UserManager<ApplicationUser> _users;
    private readonly ICreatorJourneyService _journeys;
    private readonly ICreatorIdeaService _ideas;
    private readonly IMongoDatabase _database;

    public E2eCreatorTestController(
        IWebHostEnvironment environment,
        UserManager<ApplicationUser> users,
        ICreatorJourneyService journeys,
        ICreatorIdeaService ideas,
        IMongoDatabase database)
    {
        _environment = environment;
        _users = users;
        _journeys = journeys;
        _ideas = ideas;
        _database = database;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] E2eCreatorRequest? request)
    {
        // Return the same surface as a missing endpoint; do not leak that test
        // tooling exists in Development, staging, or Production.
        if (!E2eEnvironment.IsEnabled(_environment)) return NotFound();

        var fixture = request?.Fixture?.Trim() ?? string.Empty;
        if (!SupportedFixtures.Contains(fixture))
            return BadRequest(new { success = false, message = "Unsupported E2E Creator fixture." });

        var runPart = string.Concat((request?.RunId ?? Guid.NewGuid().ToString("N"))
            .Where(char.IsLetterOrDigit)).ToLowerInvariant();
        if (string.IsNullOrEmpty(runPart)) runPart = Guid.NewGuid().ToString("N");
        runPart = runPart[..Math.Min(runPart.Length, 32)];

        var email = $"creator.e2e.{runPart}.{Guid.NewGuid():N}@mondial-e2e.invalid";
        const string password = "CreatorE2E-A1";
        var now = DateTime.UtcNow;
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            Name = $"E2E Creator {runPart}",
            User = "Creator",
            CreatedAt = now,
            KycStatus = "Approved",
            Kyc = new KycVerification { Status = VerificationStatus.Verified, VerifiedAt = now },
            Onboarding = new OnboardingState
            {
                Phase = 1,
                PhoneVerified = true,
                EmailOtpVerified = true,
                IdentityDocumentVerified = true,
                FaceVerified = true,
                CompletedAt = now,
            },
        };

        var created = await _users.CreateAsync(user, password);
        if (!created.Succeeded)
            return StatusCode(500, new { success = false, message = string.Join("; ", created.Errors.Select(e => e.Description)) });
        var role = await _users.AddToRoleAsync(user, "Creator");
        if (!role.Succeeded)
            return StatusCode(500, new { success = false, message = string.Join("; ", role.Errors.Select(e => e.Description)) });

        // A journey exists for every test Creator. Ideas are deliberately created
        // only for fixtures that ask for them; browser tests can therefore cover a
        // true no-idea state without replaying the full product journey.
        await _journeys.GetOrCreateAsync(user.Id.ToString());
        var ideaIds = new List<string>();
        if (fixture == "CreatorWithTwoIdeas")
        {
            var first = await _ideas.CreateIdeaAsync(user.Id.ToString());
            var second = await _ideas.CreateIdeaAsync(user.Id.ToString());
            ideaIds.Add(first.Id);
            ideaIds.Add(second.Id);
            // Tests begin on A; a second tab can explicitly select B.
            await _ideas.SetActiveIdeaAsync(user.Id.ToString(), first.Id);
        }
        else if (fixture is "CreatorBuildReadyForCrossroads" or "CreatorBuildIncomplete" or "CreatorBuildEligible")
        {
            var idea = await _ideas.CreateIdeaAsync(user.Id.ToString());
            ideaIds.Add(idea.Id);
            await SeedBuildPrerequisitesAsync(user.Id.ToString(), idea, fixture);
        }

        return Ok(new
        {
            success = true,
            data = new
            {
                email,
                password,
                userId = user.Id.ToString(),
                fixture,
                ideaIds,
                activeIdeaId = ideaIds.FirstOrDefault(),
            },
        });
    }

    private async Task SeedBuildPrerequisitesAsync(string userId, CreatorIdea idea, string fixture)
    {
        // Seed the same persisted artifacts that the derived status engine reads.
        // These are deterministic fixture prerequisites, not simulated AI output or
        // inferred founder decisions.
        var planId = ObjectId.GenerateNewId().ToString();
        var forecastId = ObjectId.GenerateNewId().ToString();
        await _database.GetCollection<BusinessPlanSession>("BusinessPlanSessions").InsertOneAsync(new BusinessPlanSession
        {
            Id = planId, OwnerUserId = userId, BusinessIdeaId = idea.Id, ClarifierSessionId = ObjectId.GenerateNewId().ToString(),
            Status = "Completed", CurrentVersion = 1,
            Versions = new() { new BusinessPlanVersion { Version = 1, Content = new BsonDocument("fixture", true), GeneratedContent = new BsonDocument("fixture", true) } },
        });
        await _database.GetCollection<ForecastSession>("ForecastSessions").InsertOneAsync(new ForecastSession
        {
            Id = forecastId, OwnerUserId = userId, BusinessIdeaId = idea.Id, BusinessPlanSessionId = planId,
            Status = "Completed", CurrentVersion = 1, Inputs = new ForecastInputs { Tam = 1_000_000 },
            Versions = new() { new ForecastVersion { Version = 1, Content = new BsonDocument("fixture", true), GeneratedContent = new BsonDocument("fixture", true) } },
        });

        idea.Project = new CreatorJourneyProject { Name = "E2E Build Project", Problem = "A verified problem", TargetUser = "A verified user", Solution = "A verified solution", ClarityScore = 80, Branding = new CreatorBranding { BrandingMethod = "designer" } };
        idea.Phase3Data = new CreatorPhase3Data { BusinessPlanSessionId = planId, ForecastSessionId = forecastId, FormationGenerator = new CreatorFormationGenerator { SelectedType = "SAS" } };
        idea.Phase4Data = new CreatorPhase4Data
        {
            PricingModel = "subscription",
            Tiers = new() { new CreatorPricingTier { Name = "Starter" }, new CreatorPricingTier { Name = "Growth" }, new CreatorPricingTier { Name = "Scale" } },
            ResourceCalculation = new CreatorResourceCalculation { TotalLaunchBudgetMin = 10000, TotalLaunchBudgetMax = 20000, MonthlyRunningCost = 2000 },
            GtmSetup = new CreatorGtmSetup(),
        };
        if (fixture != "CreatorBuildReadyForCrossroads") idea.Phase5Data.ChosenPath = "build";
        if (fixture == "CreatorBuildEligible")
        {
            idea.Phase5Data.PathB = new CreatorPathB
            {
                CompanyFormation = new CreatorCompanyFormation { SelectedType = "SAS", Status = "drafted", Ownership = new() { new CreatorOwnershipEntry { Holder = "Founder", Percent = 100, IsFounder = true } } },
                SeedFunding = new CreatorSeedFunding { TotalAsk = 50000, UseOfFunds = new() { new CreatorUseOfFunds { Category = "Build", Percent = 100 } }, InvestorTypesTargeted = new() { "Angel" } },
            };
        }
        await _database.GetCollection<CreatorIdea>("CreatorIdeas").ReplaceOneAsync(x => x.Id == idea.Id && x.UserId == userId, idea);
    }

    public sealed class E2eCreatorRequest
    {
        public string? Fixture { get; set; }
        public string? RunId { get; set; }
    }
}
