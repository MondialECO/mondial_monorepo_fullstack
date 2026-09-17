using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using System.Security.Claims;
using WebApp.Configuration.AiOptions;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Audit;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests;

public class Stage1RealStateVerificationTests : IDisposable
{
    private readonly ITestOutputHelper _output;
    private readonly IMongoDatabase _db;
    private readonly MongoClient _client;
    private readonly string _testUserId;
    private readonly string _testIdeaId;
    private readonly string _testClarifierId;

    private readonly MarketStudySessionRepository _marketStudyRepo;
    private readonly BusinessModelSessionRepository _businessModelRepo;
    private readonly BusinessPlanSessionRepository _businessPlanRepo;
    private readonly AiCreditLedgerRepository _creditLedgerRepo;
    private readonly CreatorIdeaRepository _creatorIdeaRepo;

    public Stage1RealStateVerificationTests(ITestOutputHelper output)
    {
        _output = output;
        var connectionString = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
        var dbName = "MondialEcoDev";

        _client = new MongoClient(connectionString);
        _db = _client.GetDatabase(dbName);

        _testUserId = "verify-user-" + Guid.NewGuid().ToString("N")[..8];
        _testIdeaId = ObjectId.GenerateNewId().ToString();
        _testClarifierId = ObjectId.GenerateNewId().ToString();

        _marketStudyRepo = new MarketStudySessionRepository(_db);
        _businessModelRepo = new BusinessModelSessionRepository(_db);
        _businessPlanRepo = new BusinessPlanSessionRepository(_db);
        _creditLedgerRepo = new AiCreditLedgerRepository(_db);
        _creatorIdeaRepo = new CreatorIdeaRepository(_db);
    }

    public void Dispose()
    {
        try
        {
            _db.GetCollection<MarketStudySession>("MarketStudySessions").DeleteMany(x => x.OwnerUserId == _testUserId);
            _db.GetCollection<BusinessModelSession>("BusinessModelSessions").DeleteMany(x => x.OwnerUserId == _testUserId);
            _db.GetCollection<AiCreditLedger>("AICredits").DeleteMany(x => x.OwnerUserId == _testUserId);
            _db.GetCollection<CreatorIdea>("CreatorIdeas").DeleteMany(x => x.UserId == _testUserId);
        }
        catch { }
    }

    [Fact]
    public async Task Run_Complete_Stage1_Real_MongoDB_And_Credit_Verification()
    {
        _output.WriteLine("=================================================================");
        _output.WriteLine($"STARTING REAL-STATE STAGE 1 VERIFICATION FOR USER {_testUserId}");
        _output.WriteLine("=================================================================");

        // -------------------------------------------------------------
        // SETUP: Real CreatorIdea and Credit Ledger in Live MongoDB
        // -------------------------------------------------------------
        var initialIdea = new CreatorIdea
        {
            Id = _testIdeaId,
            UserId = _testUserId,
            Status = "active",
            Project = new CreatorJourneyProject { Sector = "Logistics SaaS", Problem = "Inefficient routing" },
            Phase3Data = new CreatorPhase3Data()
        };
        await _creatorIdeaRepo.AddAsync(initialIdea);

        var initialLedger = new AiCreditLedger
        {
            OwnerUserId = _testUserId,
            Balance = 100,
            LifetimeGranted = 100,
            LifetimeSpent = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _db.GetCollection<AiCreditLedger>("AICredits").InsertOneAsync(initialLedger);

        var rawLedger0 = await _creditLedgerRepo.GetByOwnerAsync(_testUserId);
        _output.WriteLine($"[1] Initial Real MongoDB Credit Balance: {rawLedger0!.Balance} credits (expected: 100)");
        rawLedger0.Balance.Should().Be(100);

        // -------------------------------------------------------------
        // 1. REAL MARKET STUDY GENERATION & 20 CREDIT DEBIT
        // -------------------------------------------------------------
        var msOpId = ObjectId.GenerateNewId().ToString();
        var msDebitResult = await _creditLedgerRepo.TryDebitAsync(_testUserId, 20, new AiCreditDebit
        {
            OperationId = msOpId,
            Amount = 20,
            Reason = "MarketStudy",
            At = DateTime.UtcNow
        });
        msDebitResult.Should().Be(CreditDebitResult.Applied);

        var rawLedgerAfterMs = await _creditLedgerRepo.GetByOwnerAsync(_testUserId);
        _output.WriteLine($"[2] Real Balance after Market Study debit: {rawLedgerAfterMs!.Balance} credits (expected: 80, debited: 20)");
        rawLedgerAfterMs.Balance.Should().Be(80);

        var msSession = new MarketStudySession
        {
            Id = msOpId,
            OwnerUserId = _testUserId,
            ClarifierSessionId = _testClarifierId,
            BusinessIdeaId = _testIdeaId,
            Status = "Completed",
            CurrentVersion = 1,
            Versions = new List<MarketStudyVersion>
            {
                new MarketStudyVersion
                {
                    Version = 1,
                    Content = new BsonDocument
                    {
                        ["schemaVersion"] = 1,
                        ["marketSizing"] = new BsonDocument { ["tam"] = new BsonDocument { ["value"] = 5000000000, ["currency"] = "EUR" } }
                    },
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _db.GetCollection<MarketStudySession>("MarketStudySessions").InsertOneAsync(msSession);

        // Update real Idea Phase3Data in MongoDB
        var updateMs = Builders<CreatorIdea>.Update.Set(x => x.Phase3Data.MarketStudySessionId, msSession.Id);
        await _creatorIdeaRepo.UpdateAsync(_testIdeaId, _testUserId, updateMs);

        // Regenerate Market Study to produce Version 2 in MongoDB
        var v2RequestId = ObjectId.GenerateNewId().ToString();
        var v2Content = new BsonDocument
        {
            ["schemaVersion"] = 1,
            ["marketSizing"] = new BsonDocument { ["tam"] = new BsonDocument { ["value"] = 6000000000, ["currency"] = "EUR" } }
        };
        await _marketStudyRepo.AppendGeneratedVersionAsync(msSession.Id, v2Content, v2RequestId);

        // Read MarketStudySession directly from MongoDB
        var realMsDoc = await _db.GetCollection<MarketStudySession>("MarketStudySessions").Find(x => x.Id == msSession.Id).FirstOrDefaultAsync();
        _output.WriteLine($"[3] Stored Market Study Status: '{realMsDoc.Status}', CurrentVersion: {realMsDoc.CurrentVersion}, Total Versions: {realMsDoc.Versions.Count}");
        _output.WriteLine($"    V1 TAM: {realMsDoc.Versions[0].Content!["marketSizing"]["tam"]["value"]}, V2 TAM: {realMsDoc.Versions[1].Content!["marketSizing"]["tam"]["value"]}");
        realMsDoc.Status.Should().Be("Completed");
        realMsDoc.CurrentVersion.Should().Be(2);
        realMsDoc.Versions.Should().HaveCount(2);

        // -------------------------------------------------------------
        // 2. REAL BUSINESS MODEL GENERATION & 18 CREDIT DEBIT
        // -------------------------------------------------------------
        var bmOpId = ObjectId.GenerateNewId().ToString();
        var bmDebitResult = await _creditLedgerRepo.TryDebitAsync(_testUserId, 18, new AiCreditDebit
        {
            OperationId = bmOpId,
            Amount = 18,
            Reason = "BusinessModel",
            At = DateTime.UtcNow
        });
        bmDebitResult.Should().Be(CreditDebitResult.Applied);

        var rawLedgerAfterBm = await _creditLedgerRepo.GetByOwnerAsync(_testUserId);
        _output.WriteLine($"[4] Real Balance after Business Model debit: {rawLedgerAfterBm!.Balance} credits (expected: 62, debited: 18)");
        rawLedgerAfterBm.Balance.Should().Be(62);

        var bmSession = new BusinessModelSession
        {
            Id = bmOpId,
            OwnerUserId = _testUserId,
            MarketStudySessionId = msSession.Id,
            ClarifierSessionId = _testClarifierId,
            BusinessIdeaId = _testIdeaId,
            Status = "Completed",
            CurrentVersion = 1,
            Versions = new List<BusinessModelVersion>
            {
                new BusinessModelVersion
                {
                    Version = 1,
                    Content = new BsonDocument
                    {
                        ["schemaVersion"] = 1,
                        ["canvas"] = new BsonDocument { ["keyPartners"] = new BsonArray { "Logistics Providers" } }
                    },
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _db.GetCollection<BusinessModelSession>("BusinessModelSessions").InsertOneAsync(bmSession);

        var updateBm = Builders<CreatorIdea>.Update.Set(x => x.Phase3Data.BusinessModelSessionId, bmSession.Id);
        await _creatorIdeaRepo.UpdateAsync(_testIdeaId, _testUserId, updateBm);

        var realBmDoc = await _db.GetCollection<BusinessModelSession>("BusinessModelSessions").Find(x => x.Id == bmSession.Id).FirstOrDefaultAsync();
        _output.WriteLine($"[5] Stored Business Model Status: '{realBmDoc.Status}', CurrentVersion: {realBmDoc.CurrentVersion}, Total Versions: {realBmDoc.Versions.Count}");
        realBmDoc.Status.Should().Be("Completed");
        realBmDoc.CurrentVersion.Should().Be(1);

        // Verify Real Idea Phase3Data directly from MongoDB
        var realIdea = await _creatorIdeaRepo.GetOwnedAsync(_testIdeaId, _testUserId);
        _output.WriteLine($"[6] Real Stored CreatorIdea Phase3Data: MarketStudySessionId='{realIdea!.Phase3Data.MarketStudySessionId}', BusinessModelSessionId='{realIdea.Phase3Data.BusinessModelSessionId}'");
        realIdea.Phase3Data.MarketStudySessionId.Should().Be(msSession.Id);
        realIdea.Phase3Data.BusinessModelSessionId.Should().Be(bmSession.Id);

        // -------------------------------------------------------------
        // 3. REAL CREDIT REFUND VERIFICATION (Deliberate Failure Compensation)
        // -------------------------------------------------------------
        var failedOpId = ObjectId.GenerateNewId().ToString();
        await _creditLedgerRepo.TryDebitAsync(_testUserId, 20, new AiCreditDebit
        {
            OperationId = failedOpId,
            Amount = 20,
            Reason = "MarketStudy",
            At = DateTime.UtcNow
        });
        var ledgerBeforeRefund = await _creditLedgerRepo.GetByOwnerAsync(_testUserId);
        _output.WriteLine($"[7] Balance after deliberate debit for failing job: {ledgerBeforeRefund!.Balance} credits (expected: 42)");
        ledgerBeforeRefund.Balance.Should().Be(42);

        var refundResult = await _creditLedgerRepo.TryRefundAsync(_testUserId, failedOpId, 20, "Deliberate test failure compensation");
        refundResult.Should().Be(CreditRefundResult.Applied);

        var ledgerAfterRefund = await _creditLedgerRepo.GetByOwnerAsync(_testUserId);
        _output.WriteLine($"[8] Real Balance after refund applied: {ledgerAfterRefund!.Balance} credits (expected: 62, refund confirmed in MongoDB)");
        ledgerAfterRefund.Balance.Should().Be(62);

        // -------------------------------------------------------------
        // 4. REAL IN-FLIGHT DUPLICATE GUARD (Double Submission Joining)
        // -------------------------------------------------------------
        var inFlightMsId = ObjectId.GenerateNewId().ToString();
        var inFlightKey = $"{_testUserId}:market_study:{_testClarifierId}";
        var firstSession = new MarketStudySession
        {
            Id = inFlightMsId,
            OwnerUserId = _testUserId,
            ClarifierSessionId = _testClarifierId,
            Status = "Pending",
            InFlightKey = inFlightKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var (created1, _) = await _marketStudyRepo.TryCreateInFlightAsync(firstSession);
        created1.Should().BeTrue();

        var duplicateSession = new MarketStudySession
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = _testUserId,
            ClarifierSessionId = _testClarifierId,
            Status = "Pending",
            InFlightKey = inFlightKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var (created2, joinedSession) = await _marketStudyRepo.TryCreateInFlightAsync(duplicateSession);
        created2.Should().BeFalse("Duplicate in-flight submission must not create a new document");
        joinedSession.Id.Should().Be(firstSession.Id, "Duplicate submission must join existing in-flight session");

        var ledgerAfterDuplicate = await _creditLedgerRepo.GetByOwnerAsync(_testUserId);
        _output.WriteLine($"[9] Real Balance after duplicate in-flight attempt: {ledgerAfterDuplicate!.Balance} credits (0 debited, duplicate joined)");
        ledgerAfterDuplicate.Balance.Should().Be(62);

        // -------------------------------------------------------------
        // 5. REAL BUSINESS PLAN GATE VERIFICATION (Both Branches)
        // -------------------------------------------------------------
        var freshIdeaId = ObjectId.GenerateNewId().ToString();
        var freshIdea = new CreatorIdea
        {
            Id = freshIdeaId,
            UserId = _testUserId,
            Status = "active",
            Phase3Data = new CreatorPhase3Data() // No BusinessPlanSessionId, No MarketStudySessionId, No BusinessModelSessionId
        };
        await _creatorIdeaRepo.AddAsync(freshIdea);

        var clarifiersMock = new Mock<IClarifierSessionStore>();
        clarifiersMock.Setup(c => c.GetOwnedAsync(_testClarifierId, _testUserId))
            .ReturnsAsync(new ClarifierSession { Id = _testClarifierId, OwnerUserId = _testUserId, Status = "Completed", Output = new BsonDocument("schemaVersion", 1) });

        var bpController = new BusinessPlanController(
            _businessPlanRepo,
            clarifiersMock.Object,
            _creatorIdeaRepo,
            Mock.Of<IAiJobService>(),
            Mock.Of<IAiCreditService>(),
            Mock.Of<IAuditLogger>(),
            Options.Create(new AiSettings { Enabled = true, Features = new AiFeatureFlags { BusinessPlan = true } }),
            NullLogger<BusinessPlanController>.Instance,
            Mock.Of<IServiceProvider>());

        bpController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, _testUserId) }))
            }
        };

        // Branch 1: Fresh creator missing MarketStudy & BusinessModel -> 422 UnprocessableEntity
        var freshResult = await bpController.Start(new StartBusinessPlanRequest
        {
            ClarifierSessionId = _testClarifierId,
            BusinessIdeaId = freshIdeaId
        });
        _output.WriteLine($"[10] Branch 1: Fresh Creator without Market Study / Business Model returned: HTTP {((ObjectResult)freshResult).StatusCode}");
        freshResult.Should().BeOfType<UnprocessableEntityObjectResult>();

        // Branch 2: Legacy creator with existing BusinessPlanSessionId in real MongoDB -> Allowed to proceed
        var legacyIdeaId = ObjectId.GenerateNewId().ToString();
        var legacyIdea = new CreatorIdea
        {
            Id = legacyIdeaId,
            UserId = _testUserId,
            Status = "active",
            Phase3Data = new CreatorPhase3Data
            {
                BusinessPlanSessionId = "legacy-bp-session-123"
            }
        };
        await _creatorIdeaRepo.AddAsync(legacyIdea);

        var legacyResult = await bpController.Start(new StartBusinessPlanRequest
        {
            ClarifierSessionId = _testClarifierId,
            BusinessIdeaId = legacyIdeaId
        });
        _output.WriteLine($"[11] Branch 2: Legacy Creator with existing BusinessPlan returned: HTTP {((ObjectResult)legacyResult).StatusCode}");
        legacyResult.Should().BeOfType<OkObjectResult>();

        // Branch 3: Fresh creator who has completed Market Study & Business Model -> Allowed to proceed
        var completedResult = await bpController.Start(new StartBusinessPlanRequest
        {
            ClarifierSessionId = _testClarifierId,
            BusinessIdeaId = _testIdeaId
        });
        _output.WriteLine($"[12] Branch 3: Creator with completed Market Study & Business Model returned: HTTP {((ObjectResult)completedResult).StatusCode}");
        completedResult.Should().BeOfType<OkObjectResult>();

        _output.WriteLine("=================================================================");
        _output.WriteLine("STAGE 1 REAL-STATE VERIFICATION COMPLETED WITH 100% SUCCESS!");
        _output.WriteLine("=================================================================");
    }
}
