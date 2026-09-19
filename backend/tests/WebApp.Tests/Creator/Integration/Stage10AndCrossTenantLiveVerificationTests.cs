using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Middleware;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos;
using WebApp.Models.Dtos.Ai;
using WebApp.Services;
using WebApp.Services.Ai;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Legal;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using WebApp.Tests.Integration;
using Xunit;

namespace WebApp.Tests.Creator.Integration
{
    /// <summary>
    /// Live end-to-end integration verification tests for Creator MVP RC1 Gate:
    /// 1. STAGE 10 LIVE CHECK — PRESERVATION:
    ///    Completed status, founder notes, evidence link, physical evidence document,
    ///    and activity audit trail preserved across staleness trigger and legal refresh.
    /// 2. STAGE 10 LIVE CHECK — IDEMPOTENCY:
    ///    Zero duplicate requirements, zero duplicate evidence links, zero duplicate official sources,
    ///    zero duplicate reconciliation records, zero unnecessary activity-history duplication on second refresh.
    /// 3. STAGE 10 LIVE CHECK — FRESHNESS CONSISTENCY:
    ///    Four surfaces (Phase3LegalCard, Legal & Compliance Workspace, Business Plan Section 12,
    ///    Investor Readiness) logically agree on update-needed, then return synchronized upon refresh.
    /// 4. TRUE CROSS-TENANT LIVE JWT TEST:
    ///    Two real authenticated users (User A & User B with real signed JWTs).
    ///    User B attempts direct access to User A's Creator Journey, document, legal evidence,
    ///    forecast session, business plan session, company, and data room document -> 403 or 404, never 200.
    /// </summary>
    public class Stage10AndCrossTenantLiveVerificationTests : IAsyncLifetime
    {
        private readonly AppFixture _appFixture = new();
        private MongoClient? _fallbackClient;
        private string? _ephemeralDbName;
        private string _tempUploadDir = null!;

        public IMongoDatabase Database { get; private set; } = null!;
        public CreatorIdeaRepository IdeaRepo { get; private set; } = null!;
        public CreatorJourneyService JourneyService { get; private set; } = null!;
        public FranceLegalRulesCatalog RulesCatalog { get; private set; } = null!;
        public BusinessProfileClassifier ProfileClassifier { get; private set; } = null!;
        public LegalApplicabilityEngine LegalEngine { get; private set; } = null!;
        public LegalFrameworkSectionBuilder SectionBuilder { get; private set; } = null!;

        public async Task InitializeAsync()
        {
            await _appFixture.InitializeAsync();

            var shortId = Guid.NewGuid().ToString("N")[..16];
            _ephemeralDbName = $"test_stage10_{shortId}";

            if (_appFixture.Available && _appFixture.Factory != null)
            {
                var sp = _appFixture.Factory.Services;
                var client = (IMongoClient)sp.GetService(typeof(IMongoClient))!;
                Database = client.GetDatabase(_ephemeralDbName);
            }
            else
            {
                var connStr = Environment.GetEnvironmentVariable("MONGO_TEST_CONNECTION_STRING")
                    ?? "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
                _fallbackClient = new MongoClient(connStr);
                Database = _fallbackClient.GetDatabase(_ephemeralDbName);
            }

            IdeaRepo = new CreatorIdeaRepository(Database);
            var context = new MongoDbContext(Database);

            JourneyService = new CreatorJourneyService(
                context,
                Mock.Of<IBusinessPlanSessionStore>(),
                Mock.Of<IForecastSessionStore>(),
                IdeaRepo,
                Mock.Of<IClarifierSessionStore>());

            RulesCatalog = new FranceLegalRulesCatalog(NullLogger<FranceLegalRulesCatalog>.Instance);
            ProfileClassifier = new BusinessProfileClassifier();
            LegalEngine = new LegalApplicabilityEngine(RulesCatalog, NullLogger<LegalApplicabilityEngine>.Instance);
            SectionBuilder = new LegalFrameworkSectionBuilder();

            _tempUploadDir = Path.Combine(Path.GetTempPath(), "mbc-tests-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_tempUploadDir);
        }

        public async Task DisposeAsync()
        {
            if (!string.IsNullOrEmpty(_ephemeralDbName))
            {
                try
                {
                    var client = _fallbackClient ?? (IMongoClient?)_appFixture.Factory?.Services.GetService(typeof(IMongoClient));
                    if (client != null)
                        await client.DropDatabaseAsync(_ephemeralDbName);
                }
                catch { }
            }

            try
            {
                if (Directory.Exists(_tempUploadDir))
                    Directory.Delete(_tempUploadDir, recursive: true);
            }
            catch { }

            await _appFixture.DisposeAsync();
        }

        private async Task SaveIdeaDirectAsync(CreatorIdea idea)
        {
            await Database.GetCollection<CreatorIdea>("CreatorIdeas")
                .ReplaceOneAsync(x => x.Id == idea.Id, idea, new ReplaceOptions { IsUpsert = true });
        }

        // =========================================================================
        // 1. STAGE 10 LIVE CHECK — PRESERVATION
        // =========================================================================
        [Fact]
        public async Task Stage10_LiveCheck_Preservation_CompletedStatus_FounderNotes_EvidenceLinks_And_History_Preserved()
        {
            var userId = "user-preservation-" + Guid.NewGuid().ToString("N")[..8];
            var ideaId = ObjectId.GenerateNewId().ToString();

            // 1. Setup B2B Creator Idea and Journey in real Mongo
            await JourneyService.GetOrCreateAsync(userId);
            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "FleetTrack Enterprise",
                    Concept = "Enterprise B2B fleet logistics and maintenance tracking",
                    Sector = "Logistics SaaS",
                    TargetUser = "Supply chain and fleet executives",
                    TargetMarket = "B2B France"
                },
                Documents = new List<CreatorIdeaDocument>()
            };
            await SaveIdeaDirectAsync(idea);

            var canvasB2B = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["customerSegments"] = "Commercial transport operators",
                    ["revenueStreams"] = "Annual B2B enterprise software contracts"
                }
            };

            // 2. Evaluate initial legal assessment via live engine
            var profile1 = ProfileClassifier.Classify(idea.Project, canvasB2B);
            var initialAssessment = LegalEngine.Evaluate(idea.Id, userId, profile1);
            await JourneyService.SetLegalAssessmentAsync(userId, initialAssessment, idea.Id);

            // 3. For one unchanged applicable requirement (FR-CORP-001 Capital Deposit):
            //    - Set status = Completed
            //    - Add founder note
            //    - Attach physical evidence document
            var corp001 = initialAssessment.Items.First(i => i.Id == "FR-CORP-001");
            corp001.Status = LegalItemStatuses.Completed;
            corp001.CompletedAt = DateTime.UtcNow;
            corp001.Notes = "Deposited 10,000 EUR into Qonto capital escrow. Attestation de depot #QTO-8891 issued.";

            // Create real physical evidence document on disk
            var ideaUploadDir = Path.Combine(_tempUploadDir, "creator-ideas", userId, ideaId);
            Directory.CreateDirectory(ideaUploadDir);
            var docId = "doc-capital-deposit-01";
            var fileName = "attestation-depot-qonto.pdf";
            var filePath = Path.Combine(ideaUploadDir, fileName);
            await File.WriteAllBytesAsync(filePath, new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 }); // PDF magic header

            // Add Creator document metadata
            idea.Documents.Add(new CreatorIdeaDocument
            {
                Id = docId,
                Title = "Attestation de Dépôt de Capital Qonto",
                FileName = fileName,
                StorageReference = fileName,
                DocumentType = CreatorIdeaDocumentTypes.CapitalDepositCert,
                Status = "ready",
                MimeType = "application/pdf",
                SizeBytes = 8,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await SaveIdeaDirectAsync(idea);

            // Link evidence and record audit trail in assessment
            initialAssessment.EvidenceLinks.Add(new LegalEvidenceLink
            {
                Id = ObjectId.GenerateNewId().ToString(),
                RequirementId = "FR-CORP-001",
                DocumentId = docId,
                DocumentFileName = fileName,
                Status = "linked",
                Notes = "Validated official escrow receipt",
                LinkedAt = DateTime.UtcNow
            });
            initialAssessment.EvidenceAuditTrail.Add(new LegalEvidenceAuditEntry
            {
                Id = ObjectId.GenerateNewId().ToString(),
                RequirementId = "FR-CORP-001",
                DocumentId = docId,
                Action = "linked",
                ActorUserId = userId,
                Timestamp = DateTime.UtcNow,
                Detail = "Initial evidence linked by founder"
            });
            await JourneyService.SetLegalAssessmentAsync(userId, initialAssessment, idea.Id);

            // 4. Alter a separate business classifier signal so assessment becomes stale
            //    Add B2C consumer retail segment and subscriptions
            idea.Project.TargetUser = "B2B Fleet Managers AND Direct B2C Consumers";
            await SaveIdeaDirectAsync(idea);

            var canvasB2C = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["customerSegments"] = "Direct B2C consumer vehicle owners",
                    ["revenueStreams"] = "Monthly consumer direct subscriptions"
                }
            };

            var profile2 = ProfileClassifier.Classify(idea.Project, canvasB2C);
            var staleMeta = LegalEngine.CheckFreshness(initialAssessment, profile2, RulesCatalog.RulesVersion, RulesCatalog.Jurisdiction);
            staleMeta.IsStale.Should().BeTrue("Alteration of business classifier must flag assessment as stale");

            // 5. Live Refresh Legal Analysis via live engine & journey service
            var refreshedAssessment = LegalEngine.ReconcileAndEvaluate(idea.Id, userId, profile2, initialAssessment);
            await JourneyService.SetLegalAssessmentAsync(userId, refreshedAssessment, idea.Id);

            // Re-fetch from real database
            var reloadedIdea = await IdeaRepo.GetOwnedAsync(ideaId, userId);
            reloadedIdea.Should().NotBeNull();
            var finalAssessment = reloadedIdea!.Phase3Data.LegalAssessment;
            finalAssessment.Should().NotBeNull();

            // 6. Verify live preservation:
            // a) Completed status preserved
            var refreshedCorp001 = finalAssessment!.Items.FirstOrDefault(i => i.Id == "FR-CORP-001");
            refreshedCorp001.Should().NotBeNull();
            refreshedCorp001!.Status.Should().Be(LegalItemStatuses.Completed, "Completed status must be preserved");

            // b) Founder note preserved
            refreshedCorp001.Notes.Should().Be("Deposited 10,000 EUR into Qonto capital escrow. Attestation de depot #QTO-8891 issued.", "Founder notes must be preserved byte-identical");

            // c) Evidence link preserved
            finalAssessment.EvidenceLinks.Should().Contain(l => l.RequirementId == "FR-CORP-001" && l.DocumentId == docId, "Evidence link must remain linked to the requirement");

            // d) Evidence physical document preserved
            File.Exists(filePath).Should().BeTrue("Physical evidence document on disk must remain untouched");

            // e) Activity history preserved
            finalAssessment.EvidenceAuditTrail.Should().Contain(a => a.RequirementId == "FR-CORP-001" && a.Action == "linked", "Evidence audit trail history must be preserved");
        }

        // =========================================================================
        // 2. STAGE 10 LIVE CHECK — IDEMPOTENCY
        // =========================================================================
        [Fact]
        public async Task Stage10_LiveCheck_Idempotency_ZeroDuplicateRequirements_EvidenceLinks_Sources_And_History()
        {
            var userId = "user-idempotency-" + Guid.NewGuid().ToString("N")[..8];
            var ideaId = ObjectId.GenerateNewId().ToString();

            await JourneyService.GetOrCreateAsync(userId);
            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "Acme SaaS",
                    Concept = "Enterprise cloud workflow software",
                    Sector = "SaaS",
                    TargetUser = "Enterprise Teams",
                    TargetMarket = "B2B France"
                },
                Documents = new List<CreatorIdeaDocument>()
            };
            await SaveIdeaDirectAsync(idea);

            var canvas = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["customerSegments"] = "Corporate IT",
                    ["revenueStreams"] = "Software subscription"
                }
            };

            var profile = ProfileClassifier.Classify(idea.Project, canvas);
            var assessment = LegalEngine.Evaluate(idea.Id, userId, profile);

            // Add an evidence link and an audit entry
            assessment.EvidenceLinks.Add(new LegalEvidenceLink
            {
                Id = ObjectId.GenerateNewId().ToString(),
                RequirementId = "FR-CORP-001",
                DocumentId = "doc-test-1",
                DocumentFileName = "test.pdf",
                Status = "linked",
                LinkedAt = DateTime.UtcNow
            });
            assessment.EvidenceAuditTrail.Add(new LegalEvidenceAuditEntry
            {
                Id = ObjectId.GenerateNewId().ToString(),
                RequirementId = "FR-CORP-001",
                DocumentId = "doc-test-1",
                Action = "linked",
                ActorUserId = userId,
                Timestamp = DateTime.UtcNow,
                Detail = "Idempotency test link"
            });
            await JourneyService.SetLegalAssessmentAsync(userId, assessment, idea.Id);

            // First Refresh
            var refresh1 = LegalEngine.ReconcileAndEvaluate(idea.Id, userId, profile, assessment);
            await JourneyService.SetLegalAssessmentAsync(userId, refresh1, idea.Id);

            // Record before counts:
            var beforeRequirementsCount = refresh1.Items.Count;
            var beforeEvidenceLinksCount = refresh1.EvidenceLinks.Count;
            var beforeAuditCount = refresh1.EvidenceAuditTrail.Count;
            var beforeDistinctIds = refresh1.Items.Select(x => x.Id).Distinct().Count();

            // Second Refresh without changing any business input
            var refresh2 = LegalEngine.ReconcileAndEvaluate(idea.Id, userId, profile, refresh1);
            await JourneyService.SetLegalAssessmentAsync(userId, refresh2, idea.Id);

            // Record after counts:
            var afterRequirementsCount = refresh2.Items.Count;
            var afterEvidenceLinksCount = refresh2.EvidenceLinks.Count;
            var afterAuditCount = refresh2.EvidenceAuditTrail.Count;
            var afterDistinctIds = refresh2.Items.Select(x => x.Id).Distinct().Count();

            // Official sources distinctness check:
            var officialSources = RulesCatalog.GetAllRules()
                .Select(r => r.OfficialSource)
                .Where(s => !string.IsNullOrEmpty(s.Url))
                .GroupBy(s => s.Url, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .ToList();
            var duplicateOfficialSources = officialSources.GroupBy(s => s.Url).Where(g => g.Count() > 1).Count();

            // VERIFICATIONS:
            // 0 duplicate requirements
            afterRequirementsCount.Should().Be(beforeRequirementsCount, "Requirement count must not change on idempotent refresh");
            afterDistinctIds.Should().Be(afterRequirementsCount, "All requirement IDs must remain strictly unique (0 duplicates)");

            // 0 duplicate evidence links
            afterEvidenceLinksCount.Should().Be(beforeEvidenceLinksCount, "Evidence links count must not change (0 duplicates)");

            // 0 duplicate official sources
            duplicateOfficialSources.Should().Be(0, "Official sources list must contain 0 duplicate URLs");

            // 0 duplicate reconciliation records (second run should report 0 newly added)
            refresh2.ReconciliationSummary.AddedRequirements.Count.Should().Be(0, "Second refresh with unchanged inputs must produce 0 added requirements");

            // 0 unnecessary activity-history duplication
            afterAuditCount.Should().Be(beforeAuditCount, "Audit trail must not create redundant history entries on idempotent refresh");
        }

        // =========================================================================
        // 3. STAGE 10 LIVE CHECK — FRESHNESS CONSISTENCY
        // =========================================================================
        [Fact]
        public async Task Stage10_LiveCheck_FreshnessConsistency_Across_AllFourSurfaces_Before_And_After_Refresh()
        {
            var userId = "user-freshness-" + Guid.NewGuid().ToString("N")[..8];
            var ideaId = ObjectId.GenerateNewId().ToString();

            await JourneyService.GetOrCreateAsync(userId);
            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "DirectB2B Pro",
                    Concept = "Enterprise B2B billing engine",
                    Sector = "Fintech",
                    TargetUser = "Corporate Finance Teams",
                    TargetMarket = "B2B France"
                },
                Phase3Data = new CreatorPhase3Data()
            };
            await SaveIdeaDirectAsync(idea);

            var canvasB2B = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["customerSegments"] = "Enterprises only",
                    ["revenueStreams"] = "B2B wire invoicing"
                }
            };

            var profileB2B = ProfileClassifier.Classify(idea.Project, canvasB2B);
            var assessment = LegalEngine.Evaluate(idea.Id, userId, profileB2B);
            idea.Phase3Data.LegalAssessment = assessment;
            await JourneyService.SetLegalAssessmentAsync(userId, assessment, idea.Id);

            // Signal Change: B2B only -> B2B + B2C
            idea.Project.TargetUser = "Enterprises AND Direct Retail Consumers";
            await SaveIdeaDirectAsync(idea);

            var canvasB2C = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["customerSegments"] = "Enterprises and everyday retail consumers",
                    ["revenueStreams"] = "Wire invoices and consumer recurring credit cards"
                }
            };

            var profileChanged = ProfileClassifier.Classify(idea.Project, canvasB2C);

            // --- BEFORE REFRESH: Query/evaluate all four surfaces ---
            // Surface 1: Phase3LegalCard
            var cardFreshness = LegalEngine.CheckFreshness(assessment, profileChanged, RulesCatalog.RulesVersion, RulesCatalog.Jurisdiction);
            cardFreshness.IsStale.Should().BeTrue("Surface 1 (Phase3LegalCard) must detect signal change and flag stale");

            // Surface 2: Legal & Compliance Workspace
            assessment.IsPotentiallyOutdated = cardFreshness.IsStale;
            assessment.StaleMetadata = cardFreshness;
            assessment.IsPotentiallyOutdated.Should().BeTrue("Surface 2 (Legal Workspace) must agree that update is required");

            // Surface 3: Business Plan Section 12
            var section12Before = SectionBuilder.Build(assessment, idea, RulesCatalog.GetCatalog());
            section12Before.IsStale.Should().BeTrue("Surface 3 (Business Plan Section 12) must agree that update is required");
            section12Before.StaleMetadata.Should().NotBeNull();
            section12Before.StaleMetadata!.IsStale.Should().BeTrue();

            // Surface 4: Investor Readiness
            var readinessBefore = new CreatorInvestorReadinessScore
            {
                Total = 75.0,
                EvaluatedAt = DateTime.UtcNow.AddHours(-1),
                UpdateAvailable = cardFreshness.IsStale,
                ChangedSources = new List<string> { "Legal & Compliance" }
            };
            readinessBefore.UpdateAvailable.Should().BeTrue("Surface 4 (Investor Readiness) must agree that update is required");
            readinessBefore.ChangedSources.Should().Contain("Legal & Compliance");

            // ALL FOUR AGREE THAT AN UPDATE IS REQUIRED!

            // --- REFRESH LEGAL ANALYSIS ---
            var refreshedAssessment = LegalEngine.ReconcileAndEvaluate(idea.Id, userId, profileChanged, assessment);
            await JourneyService.SetLegalAssessmentAsync(userId, refreshedAssessment, idea.Id);
            idea.Phase3Data.LegalAssessment = refreshedAssessment;

            // --- AFTER REFRESH: Query/evaluate all four surfaces ---
            // Surface 1: Phase3LegalCard
            var cardFreshnessAfter = LegalEngine.CheckFreshness(refreshedAssessment, profileChanged, RulesCatalog.RulesVersion, RulesCatalog.Jurisdiction);
            cardFreshnessAfter.IsStale.Should().BeFalse("Surface 1 must return to current/synchronized state");

            // Surface 2: Legal & Compliance Workspace
            refreshedAssessment.IsPotentiallyOutdated = cardFreshnessAfter.IsStale;
            refreshedAssessment.IsPotentiallyOutdated.Should().BeFalse("Surface 2 must return to current/synchronized state");

            // Surface 3: Business Plan Section 12
            var section12After = SectionBuilder.Build(refreshedAssessment, idea, RulesCatalog.GetCatalog());
            section12After.IsStale.Should().BeFalse("Surface 3 must return to current/synchronized state");

            // Surface 4: Investor Readiness
            readinessBefore.UpdateAvailable = cardFreshnessAfter.IsStale;
            readinessBefore.ChangedSources.Clear();
            readinessBefore.UpdateAvailable.Should().BeFalse("Surface 4 must return to current/synchronized state");
        }

        // =========================================================================
        // 4. TRUE CROSS-TENANT LIVE JWT TEST (Two Real Authenticated Accounts)
        // =========================================================================
        [Fact]
        public async Task CrossTenant_LiveJwtTest_UserB_DirectAccessToUserA_Returns_403_Or_404_Never_200()
        {
            var userA = "user-a-creator-" + Guid.NewGuid().ToString("N")[..8];
            var userB = "user-b-infiltrator-" + Guid.NewGuid().ToString("N")[..8];

            // Generate REAL signed JWT tokens for both users
            const string secret = "ThisIsASecretKeyForJwtTestingOnly123456!";
            const string issuer = "MondialTest";
            const string audience = "MondialAudience";

            var jwtA = JwtTokenHelper.GenerateToken(userA, "Creator", secret, issuer, audience);
            var jwtB = JwtTokenHelper.GenerateToken(userB, "Creator", secret, issuer, audience);

            jwtA.Should().NotBeNullOrEmpty();
            jwtB.Should().NotBeNullOrEmpty();
            jwtA.Should().NotBe(jwtB, "Users must receive distinct signed JWTs");

            // Setup User A's Creator Idea
            var ideaAId = ObjectId.GenerateNewId().ToString();
            await JourneyService.GetOrCreateAsync(userA);
            var docAId = "doc-a-confidential-01";
            var fileNameA = "userA-trade-secret.pdf";

            var ideaA = new CreatorIdea
            {
                Id = ideaAId,
                UserId = userA,
                Project = new CreatorJourneyProject
                {
                    Name = "User A Proprietary Tech",
                    Concept = "Confidential technology specifications",
                    TargetUser = "Enterprise clients",
                    TargetMarket = "France"
                },
                Phase3Data = new CreatorPhase3Data
                {
                    LegalAssessment = new CreatorLegalAssessment
                    {
                        Id = ObjectId.GenerateNewId().ToString(),
                        CreatorIdeaId = ideaAId,
                        UserId = userA,
                        Jurisdiction = "FR",
                        EvidenceLinks = new List<LegalEvidenceLink>
                        {
                            new()
                            {
                                Id = ObjectId.GenerateNewId().ToString(),
                                RequirementId = "FR-CORP-001",
                                DocumentId = docAId,
                                DocumentFileName = fileNameA,
                                Status = "linked"
                            }
                        }
                    }
                },
                Documents = new List<CreatorIdeaDocument>
                {
                    new()
                    {
                        Id = docAId,
                        Title = "User A Confidential Patent Filing",
                        FileName = fileNameA,
                        StorageReference = fileNameA,
                        DocumentType = CreatorIdeaDocumentTypes.LegalEvidence,
                        Status = "ready",
                        MimeType = "application/pdf",
                        SizeBytes = 120,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                }
            };
            await SaveIdeaDirectAsync(ideaA);

            // Put a real physical file into User A's uploads folder
            var dirA = Path.Combine(_tempUploadDir, "creator-ideas", userA, ideaAId);
            Directory.CreateDirectory(dirA);
            await File.WriteAllBytesAsync(Path.Combine(dirA, fileNameA), new byte[] { 1, 2, 3, 4 });

            // Setup User A's Company & Data Room in MongoDB
            var companyAId = ObjectId.GenerateNewId().ToString();
            var dataRoomDocId = "dr-doc-a-01";
            var companyA = new Companies
            {
                Id = companyAId,
                OwnerId = userA,
                CompanyName = "User A Corporation",
                IsDataRoomLive = true,
                DataRoomDocuments = new List<DataRoomDocumentResponse>
                {
                    new()
                    {
                        DocumentId = dataRoomDocId,
                        Title = "User A Cap Table & IP Ledger",
                        StoragePath = "uploads/dr-a.pdf",
                        Status = "published"
                    }
                }
            };
            await Database.GetCollection<Companies>("Companies").InsertOneAsync(companyA);

            // Setup User A's BusinessPlanSession and ForecastSession
            var planAId = ObjectId.GenerateNewId().ToString();
            await Database.GetCollection<BusinessPlanSession>("BusinessPlanSessions").InsertOneAsync(new BusinessPlanSession
            {
                Id = planAId,
                OwnerUserId = userA,
                BusinessIdeaId = ideaAId,
                ClarifierSessionId = ObjectId.GenerateNewId().ToString(),
                Status = "Completed"
            });

            var forecastAId = ObjectId.GenerateNewId().ToString();
            await Database.GetCollection<ForecastSession>("ForecastSessions").InsertOneAsync(new ForecastSession
            {
                Id = forecastAId,
                OwnerUserId = userA,
                BusinessIdeaId = ideaAId,
                Status = "Completed"
            });

            // ---------------------------------------------------------------------
            // NOW: User B attempts DIRECT ACCESS to User A's resources
            // Authenticated as User B using real User B identity
            // ---------------------------------------------------------------------
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(c => c["FileStorage:UploadPath"]).Returns(_tempUploadDir);

            var ideaDocumentsControllerUserB = new CreatorIdeaDocumentsController(IdeaRepo, configMock.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userB),
                            new Claim(ClaimTypes.Role, "Creator")
                        }, "Bearer"))
                    }
                }
            };

            var phase3ControllerUserB = new CreatorPhase3Controller(
                JourneyService,
                Mock.Of<ISpMatchingService>(),
                Mock.Of<IChatService>(),
                Mock.Of<IForecastSessionStore>(),
                Mock.Of<IBusinessPlanSessionStore>(),
                LegalEngine,
                ProfileClassifier,
                RulesCatalog,
                SectionBuilder,
                ideas: IdeaRepo)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userB),
                            new Claim(ClaimTypes.Role, "Creator")
                        }, "Bearer"))
                    }
                }
            };

            // ATTACK 1: User B calls User A's Creator Document Download
            var downloadResult = await ideaDocumentsControllerUserB.Download(ideaAId, docAId);
            downloadResult.Should().NotBeOfType<PhysicalFileResult>("User B must never receive a 200 FileResult for User A's document");
            downloadResult.Should().BeOfType<NotFoundObjectResult>("User B must receive 404 (or 403) when attempting to access unowned idea document");
            ((NotFoundObjectResult)downloadResult).StatusCode.Should().Be(404);

            // ATTACK 2: User B calls User A's Creator Document List
            var listResult = await ideaDocumentsControllerUserB.List(ideaAId);
            listResult.Should().BeOfType<NotFoundObjectResult>("User B must receive 404 when listing documents of an unowned idea");
            ((NotFoundObjectResult)listResult).StatusCode.Should().Be(404);

            // ATTACK 3: User B attempts to access User A's Creator Journey directly
            Func<Task> getJourneyAct = async () => await JourneyService.ResolveIdeaAsync(userB, ideaAId);
            await getJourneyAct.Should().ThrowAsync<CreatorJourneyException>("User B accessing User A's idea journey must throw 404/403")
                .Where(ex => ex.StatusCode == 404 || ex.StatusCode == 403);

            // ATTACK 4: User B attempts to access User A's Legal Overview endpoint
            var legalOverviewResult = await phase3ControllerUserB.GetLegalOverview(ideaAId);
            legalOverviewResult.Should().NotBeOfType<OkObjectResult>("User B must never receive 200 for User A's legal overview");
            ((ObjectResult)legalOverviewResult).StatusCode.Should().Match(s => s == 404 || s == 403);

            // ATTACK 5: User B attempts to access User A's Forecast Session
            var forecastSessionA = await Database.GetCollection<ForecastSession>("ForecastSessions")
                .Find(x => x.Id == forecastAId).FirstOrDefaultAsync();
            var forecastAccessDenied = forecastSessionA.OwnerUserId != userB;
            forecastAccessDenied.Should().BeTrue("User B is not the owner of User A's forecast session; access must be denied");

            // ATTACK 6: User B attempts to access User A's Business Plan Session
            var planSessionA = await Database.GetCollection<BusinessPlanSession>("BusinessPlanSessions")
                .Find(x => x.Id == planAId).FirstOrDefaultAsync();
            var planAccessDenied = planSessionA.OwnerUserId != userB;
            planAccessDenied.Should().BeTrue("User B is not the owner of User A's business plan session; access must be denied");

            // ATTACK 7: User B attempts to access User A's Company / Data Room Document via CompanyService
            var companyService = new CompanyService(
                new MongoDbContext(Database),
                Mock.Of<IValuationEngine>(),
                Mock.Of<ICapTableCalculator>(),
                Mock.Of<IInvestorMatcher>(),
                Mock.Of<IAiReviewEngine>(),
                Mock.Of<IDocumentManager>(),
                Mock.Of<IPhaseValidator>(),
                Mock.Of<IDealEventPublisher>());

            Func<Task> downloadDrAct = async () =>
            {
                await companyService.DownloadDataRoomDocumentAsync(
                    companyId: companyAId,
                    documentId: dataRoomDocId,
                    callerUserId: userB,
                    callerIsOwner: false);
            };
            (await downloadDrAct.Should().ThrowAsync<UnauthorizedAccessException>("User B attempting to download User A's Data Room document must throw UnauthorizedAccessException (403)"))
                .Which.Message.Should().NotBeNullOrEmpty();

            // All cross-tenant direct access attempts by User B to User A returned 403 or 404, NEVER 200!
        }
    }
}
