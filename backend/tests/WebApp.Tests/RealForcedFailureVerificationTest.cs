using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Configuration.AiOptions;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository.Ai;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests
{
    public class RealForcedFailureVerificationTest
    {
        private readonly ITestOutputHelper _output;

        public RealForcedFailureVerificationTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task RealMongo_ForcedFailureWithUnresolvableJobType_AppliesRefundAndMarksSessionFailed()
        {
            var connStr = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/?retryWrites=true&w=majority";
            var client = new MongoClient(connStr);
            var db = client.GetDatabase("MondialEcoDev");

            // Real repositories
            var aiRequestsRepo = new AiRequestRepository(db);
            var aiResponsesRepo = new AiResponseRepository(db);
            var aiUsageRepo = new AiModelUsageRepository(db);
            var creditLedgerRepo = new AiCreditLedgerRepository(db);
            var bmSessionRepo = new BusinessModelSessionRepository(db);
            var msSessionRepo = new MarketStudySessionRepository(db);
            var bpSessionRepo = new BusinessPlanSessionRepository(db);
            var fcSessionRepo = new ForecastSessionRepository(db);
            var clSessionRepo = new ClarifierSessionRepository(db);
            var igSessionRepo = new IdeaGenerationSessionRepository(db);

            var aiSettings = Options.Create(new AiSettings
            {
                StarterCredits = 200,
                CreditCosts = new Dictionary<string, int>
                {
                    ["BusinessModel"] = 18,
                    ["MarketStudy"] = 20
                }
            });
            var creditService = new AiCreditService(creditLedgerRepo, aiSettings);

            // Wire AiJobRunner with real repos
            var registry = new AiTaskHandlerRegistry(Array.Empty<IAiTaskHandler>());
            var promptStoreMock = new Moq.Mock<IPromptVersionStore>();
            var promptBuilderMock = new Moq.Mock<IPromptBuilder>();
            var modelRouterMock = new Moq.Mock<IModelRouter>();
            var providerMock = new Moq.Mock<IAiProvider>();
            var completionMock = new Moq.Mock<IAiJobCompletionHandler>();

            var runner = new AiJobRunner(
                aiRequestsRepo,
                aiResponsesRepo,
                aiUsageRepo,
                registry,
                promptStoreMock.Object,
                promptBuilderMock.Object,
                modelRouterMock.Object,
                providerMock.Object,
                completionMock.Object,
                igSessionRepo,
                clSessionRepo,
                msSessionRepo,
                bmSessionRepo,
                bpSessionRepo,
                fcSessionRepo,
                creditService,
                NullLogger<AiJobRunner>.Instance);

            // 1. Setup real test user, session and debit in MongoDB Atlas
            var testUserId = "test-forced-fail-" + Guid.NewGuid().ToString("N")[..8];
            var testSessionId = ObjectId.GenerateNewId().ToString();
            var testCreditOpId = ObjectId.GenerateNewId().ToString();
            var testRequestId = ObjectId.GenerateNewId().ToString();

            // Grant 100 starter credits
            await creditLedgerRepo.TryGrantInitialAsync(testUserId, 100);

            // Debit 18 credits for the forced failure attempt
            await creditLedgerRepo.TryDebitAsync(testUserId, 18, new AiCreditDebit
            {
                OperationId = testCreditOpId,
                Amount = 18,
                Reason = "ForcedFailureTestDebit",
                Refunded = false,
                At = DateTime.UtcNow
            });

            var ledgerBefore = await creditLedgerRepo.GetByOwnerAsync(testUserId);
            _output.WriteLine($"[BEFORE] Real User {testUserId} Balance = {ledgerBefore?.Balance} (Expected: 82)");
            ledgerBefore!.Balance.Should().Be(82);

            // Seed real BusinessModelSession in Processing
            await db.GetCollection<BsonDocument>("BusinessModelSessions").InsertOneAsync(new BsonDocument
            {
                ["_id"] = new ObjectId(testSessionId),
                ["OwnerUserId"] = testUserId,
                ["Status"] = "Processing",
                ["CurrentVersion"] = 0,
                ["InFlightKey"] = $"BusinessModel:Regen:{testSessionId}",
                ["CreatedAt"] = DateTime.UtcNow,
                ["UpdatedAt"] = DateTime.UtcNow
            });

            // Seed real AIRequest with UNRESOLVABLE JobType
            var unresolvableJobType = "FutureUnrecognisedJobType_" + Guid.NewGuid().ToString("N")[..6];
            await aiRequestsRepo.AddAsync(new AiRequest
            {
                Id = testRequestId,
                OwnerUserId = testUserId,
                JobType = unresolvableJobType,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                InputPayload = new BsonDocument
                {
                    ["sessionId"] = testSessionId,
                    ["creditOperationId"] = testCreditOpId
                }
            });

            // 2. Execute Runner: this will throw ArgumentException on unresolvable job type
            _output.WriteLine($"[EXECUTING] Running AiJobRunner with unresolvable JobType: '{unresolvableJobType}'...");
            var act = () => runner.RunAsync(testRequestId);
            await act.Should().ThrowAsync<ArgumentException>();

            // 3. Inspect real state in MongoDB Atlas
            var ledgerAfter = await creditLedgerRepo.GetByOwnerAsync(testUserId);
            _output.WriteLine($"[AFTER] Real User {testUserId} Balance = {ledgerAfter?.Balance} (Expected: 100)");
            ledgerAfter!.Balance.Should().Be(100); // 82 + 18 refund

            var matchingDebit = ledgerAfter.Debits.FirstOrDefault(d => d.OperationId == testCreditOpId);
            _output.WriteLine($"[AFTER] Debit Record: OpId={matchingDebit?.OperationId}, Refunded={matchingDebit?.Refunded}, RefundedAt={matchingDebit?.RefundedAt}");
            matchingDebit.Should().NotBeNull();
            matchingDebit!.Refunded.Should().BeTrue();

            var reqDoc = await aiRequestsRepo.GetByIdAsync(testRequestId);
            _output.WriteLine($"[AFTER] AIRequest Status = '{reqDoc?.Status}', Error = '{reqDoc?.Error}'");
            reqDoc!.Status.Should().Be("Failed");

            // Cleanup test documents
            await db.GetCollection<BsonDocument>("AICredits").DeleteOneAsync(Builders<BsonDocument>.Filter.Eq("OwnerUserId", testUserId));
            await db.GetCollection<BsonDocument>("BusinessModelSessions").DeleteOneAsync(Builders<BsonDocument>.Filter.Eq("_id", new ObjectId(testSessionId)));
            await db.GetCollection<BsonDocument>("AIRequests").DeleteOneAsync(Builders<BsonDocument>.Filter.Eq("_id", new ObjectId(testRequestId)));
            _output.WriteLine("[CLEANUP] Successfully cleaned up real test documents.");
        }

        [Fact]
        public async Task Analyze_Real_AI_Job_Duration_Distribution()
        {
            var connStr = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/?retryWrites=true&w=majority";
            var client = new MongoClient(connStr);
            var db = client.GetDatabase("MondialEcoDev");

            var aiRequestsColl = db.GetCollection<BsonDocument>("AIRequests");
            var completedReqs = await aiRequestsColl.Find(Builders<BsonDocument>.Filter.Eq("Status", "Completed"))
                .Sort(Builders<BsonDocument>.Sort.Descending("_id"))
                .Limit(100)
                .ToListAsync();

            _output.WriteLine($"=== ANALYZING {completedReqs.Count} RECENT COMPLETED AI REQUESTS ===");
            var durations = new List<double>();

            foreach (var doc in completedReqs)
            {
                if (doc.Contains("CreatedAt") && doc.Contains("UpdatedAt"))
                {
                    var created = doc["CreatedAt"].ToUniversalTime();
                    var updated = doc["UpdatedAt"].ToUniversalTime();
                    var durationSec = (updated - created).TotalSeconds;
                    if (durationSec >= 0)
                    {
                        durations.Add(durationSec);
                    }
                }
            }

            if (durations.Count > 0)
            {
                durations.Sort();
                var min = durations.First();
                var max = durations.Last();
                var median = durations[durations.Count / 2];
                var p90 = durations[(int)(durations.Count * 0.9)];
                var p99 = durations[(int)(durations.Count * 0.99)];

                _output.WriteLine($"Duration Stats (seconds): Min={min:F1}s, Median={median:F1}s, P90={p90:F1}s, P99={p99:F1}s, Max={max:F1}s");
            }
            else
            {
                _output.WriteLine("No duration data available.");
            }
        }
    }
}
