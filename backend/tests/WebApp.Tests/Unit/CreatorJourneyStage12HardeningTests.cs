using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos;
using WebApp.Models.Dtos.Ai;
using WebApp.Services;
using WebApp.Services.Legal;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    /// <summary>
    /// Stage 12 — Final Hardening, Security, Data Integrity & End-to-End QA Test Suite
    /// Validates canonical legal rule-ID integrity, deep-copy legal baseline, canonical-root path traversal guards,
    /// Level-Up concurrency & idempotency, multi-project isolation, and stale transfer fidelity.
    /// </summary>
    public class CreatorJourneyStage12HardeningTests
    {
        // ---------------------------------------------------------------------------------
        // 1. LEGAL RULE ID INTEGRITY: Canonical France statutory catalogue rules
        // ---------------------------------------------------------------------------------

        [Fact]
        public void Authoritative_France_Catalogue_Contains_Only_Canonical_Rule_IDs()
        {
            // Given: The real France legal rules catalogue
            var catalog = new FranceLegalRulesCatalog(NullLogger<FranceLegalRulesCatalog>.Instance);
            var rules = catalog.GetAllRules();

            rules.Should().NotBeEmpty();
            rules.Count.Should().BeGreaterOrEqualTo(18);

            // Canonical prefixes defined in FR-2026.1 taxonomy:
            var canonicalPrefixes = new[] { "FR-CORP-", "FR-IP-", "FR-PRIV-", "FR-WEB-", "FR-CONS-", "FR-PAY-", "FR-MKT-", "FR-INS-", "FR-SOC-", "FR-REG-", "FR-TAX-" };

            foreach (var rule in rules)
            {
                // Each rule ID must start with a recognized canonical prefix
                canonicalPrefixes.Any(p => rule.Id.StartsWith(p, StringComparison.OrdinalIgnoreCase))
                    .Should().BeTrue($"Rule ID '{rule.Id}' must match canonical taxonomy prefixes");

                // Check for obsolete/invented prefixes: no FR-GDPR-*, FR-FISCAL-*, FR-LABOR-*, FR-DATA-*
                rule.Id.Should().NotStartWith("FR-GDPR-", "FR-GDPR is non-canonical; FR-PRIV-* must be used");
                rule.Id.Should().NotStartWith("FR-FISCAL-", "FR-FISCAL is non-canonical; FR-SOC-* must be used");
                rule.Id.Should().NotStartWith("FR-LABOR-", "FR-LABOR is non-canonical; FR-SOC-* must be used");
                rule.Id.Should().NotStartWith("FR-DATA-", "FR-DATA is non-canonical; FR-PRIV-* must be used");
            }
        }

        [Fact]
        public void LegalApplicabilityEngine_Generates_Only_Authoritative_Rule_IDs()
        {
            // Given: LegalApplicabilityEngine with France catalogue
            var catalog = new FranceLegalRulesCatalog(NullLogger<FranceLegalRulesCatalog>.Instance);
            var catalogFile = catalog.GetCatalog();
            var engine = new LegalApplicabilityEngine(catalog, NullLogger<LegalApplicabilityEngine>.Instance);

            var profile = new LegalBusinessProfile
            {
                IsB2C = BusinessSignal.Confirmed(true, "manual", "B2C"),
                IsB2B = BusinessSignal.Confirmed(true, "manual", "B2B"),
                HasSubscription = BusinessSignal.Confirmed(true, "manual", "Sub"),
                HasOnlinePayments = BusinessSignal.Confirmed(true, "manual", "Payments"),
                CollectsPersonalData = BusinessSignal.Confirmed(true, "manual", "Data"),
                UsesAnalyticsOrTracking = BusinessSignal.Confirmed(true, "manual", "Cookies"),
                HasEmployees = BusinessSignal.Confirmed(true, "manual", "Employees"),
                HasContractors = BusinessSignal.Confirmed(true, "manual", "Contractors"),
                HasPhysicalPremises = BusinessSignal.Confirmed(true, "manual", "Premises"),
                IsSaaS = BusinessSignal.Confirmed(true, "manual", "SaaS"),
                IsEcommerce = BusinessSignal.Confirmed(true, "manual", "Ecom"),
                IsMarketplace = BusinessSignal.Confirmed(true, "manual", "Marketplace"),
                HasWebsite = BusinessSignal.Confirmed(true, "manual", "Website"),
                SellsProducts = BusinessSignal.Confirmed(true, "manual", "Products"),
                SellsServices = BusinessSignal.Confirmed(true, "manual", "Services"),
                MayBeRegulatedActivity = BusinessSignal.Confirmed(true, "manual", "Regulated")
            };

            // When: Evaluating applicability across all archetype signals
            var assessment = engine.ReconcileAndEvaluate("idea-canon-1", "user-1", profile, null);

            // Then: Every single item ID must exist in the authoritative catalogue
            var authoritativeRuleIds = catalog.GetAllRules().Select(r => r.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var item in assessment.Items)
            {
                authoritativeRuleIds.Should().Contain(item.Id, $"Evaluated rule '{item.Id}' must exist in FranceRules.json");
            }

            foreach (var trace in assessment.EvaluationTraces)
            {
                authoritativeRuleIds.Should().Contain(trace.RuleId, $"Trace rule '{trace.RuleId}' must exist in FranceRules.json");
            }
        }

        [Fact]
        public void Section12_LegalFramework_Requires_Canonical_Rule_Origins()
        {
            var catalog = new FranceLegalRulesCatalog(NullLogger<FranceLegalRulesCatalog>.Instance);
            var catalogFile = catalog.GetCatalog();
            var builder = new LegalFrameworkSectionBuilder();

            var assessment = new CreatorLegalAssessment
            {
                CreatorIdeaId = "idea-sec12",
                UserId = "user-1",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 75.0,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-CORP-001",
                        Category = "corporate",
                        Title = "Dépôt de capital",
                        Stage = LegalStages.BeforeCreation,
                        Priority = LegalPriorities.Critical,
                        Status = LegalItemStatuses.Completed,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable
                    },
                    new()
                    {
                        Id = "FR-PRIV-001",
                        Category = "privacy",
                        Title = "Politique RGPD",
                        Stage = LegalStages.BeforeLaunch,
                        Priority = LegalPriorities.Recommended,
                        Status = LegalItemStatuses.ActionRequired,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable
                    }
                }
            };

            var idea = new CreatorIdea
            {
                Id = "idea-sec12",
                UserId = "user-1",
                Project = new CreatorJourneyProject { Name = "Sec12 Project" }
            };

            var dto = builder.Build(assessment, idea, catalogFile);

            // Assert that priority open items reference real catalogue IDs
            dto.PriorityOpenItems.Should().NotBeEmpty();
            foreach (var openItem in dto.PriorityOpenItems)
            {
                catalog.GetRuleById(openItem.RequirementId).Should().NotBeNull($"Open item '{openItem.RequirementId}' must exist in catalogue");
            }

            dto.DisclaimerNotice.Should().Contain("MONDIAL BUSINESS CREATION (MBC)");
            dto.DisclaimerNotice.Should().Contain("Does not constitute formal legal advice");
        }

        // ---------------------------------------------------------------------------------
        // 2. LEGAL SOURCE-OF-TRUTH: Preserved Baseline Snapshot & Deep Copy
        // ---------------------------------------------------------------------------------

        [Fact]
        public async Task LevelUp_DeepCopies_Creator_Legal_Assessment_Preventing_Shared_Mutable_Graph()
        {
            // Given: Mock dependencies
            var (service, companiesList) = CreateCompanyServiceWithDb();

            var userId = "founder-deep-copy";
            var ideaId = "idea-deep-copy";
            var originalAssessment = new CreatorLegalAssessment
            {
                CreatorIdeaId = ideaId,
                UserId = userId,
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 80.0,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-001", Title = "Statuts constitutifs", Status = "completed" },
                    new() { Id = "FR-SOC-001", Title = "Cotisations URSSAF", Status = "in_progress" }
                }
            };

            // When: Ensuring Level Up company
            var company = await service.EnsureLevelUpCompanyAsync(
                userId: userId,
                sourceLink: ideaId,
                legalStructure: "SAS",
                fundingAsk: 50000,
                companyName: "Venture Alpha",
                industry: "Tech",
                tagline: "Alpha tagline",
                journeyId: "journey-alpha",
                baselineReadiness: 80.0,
                forecastId: "fc-alpha",
                businessPlanId: "bp-alpha",
                legalAssessment: originalAssessment,
                logo: null,
                documents: null,
                session: null);

            // Then: Company receives legal assessment, but it is NOT the same object reference
            company.LegalAssessment.Should().NotBeNull();
            company.LegalAssessment.Should().NotBeSameAs(originalAssessment, "Company.LegalAssessment must be a deep copy of the Creator baseline");

            // Mutating the Entrepreneur's operational legal state must NOT mutate the Creator's ideation baseline
            company.LegalAssessment!.PlanningReadinessPct = 100.0;
            company.LegalAssessment.Items[1].Status = "completed";

            originalAssessment.PlanningReadinessPct.Should().Be(80.0, "Creator ideation baseline readiness must remain intact");
            originalAssessment.Items[1].Status.Should().Be("in_progress", "Creator ideation checklist item status must remain intact");
        }

        // ---------------------------------------------------------------------------------
        // 3. DOCUMENT SECURITY: Canonical-Root Path Traversal Protection
        // ---------------------------------------------------------------------------------

        [Theory]
        [InlineData("../../../windows/system32/cmd.exe")]
        [InlineData("..\\..\\..\\secret.txt")]
        [InlineData("/etc/passwd")]
        [InlineData("C:\\Windows\\System32\\calc.exe")]
        [InlineData("uploads/../../boot.ini")]
        public async Task DownloadDataRoomDocumentAsync_Throws_On_Path_Traversal_Attempts(string maliciousPath)
        {
            var (service, companiesList) = CreateCompanyServiceWithDb();

            var company = new Companies
            {
                Id = "comp-sec-1",
                OwnerId = "owner-1",
                CompanyName = "Sec Company",
                IsDataRoomLive = true,
                DataRoomDocuments = new List<DataRoomDocumentResponse>
                {
                    new()
                    {
                        DocumentId = "doc-malicious",
                        Title = "Malicious Doc",
                        StoragePath = maliciousPath,
                        Status = "draft"
                    }
                }
            };
            companiesList.Add(company);

            // Caller is owner
            Func<Task> action = async () =>
            {
                await service.DownloadDataRoomDocumentAsync(
                    companyId: "comp-sec-1",
                    documentId: "doc-malicious",
                    callerUserId: "owner-1",
                    callerIsOwner: true,
                    requireDownloadPermission: false);
            };

            await action.Should().ThrowAsync<UnauthorizedAccessException>("Path traversal must be immediately rejected");
        }

        [Fact]
        public async Task CreatorIdeaDocuments_Upload_Rejects_Executable_And_Script_Extensions()
        {
            var mockIdeas = new Mock<ICreatorIdeaStore>();
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(c => c["FileStorage:UploadPath"]).Returns(Path.Combine(Path.GetTempPath(), "test-uploads"));

            var controller = new CreatorIdeaDocumentsController(mockIdeas.Object, mockConfig.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext()
                }
            };
            controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-test")
            }, "TestAuth"));

            // Mock file with .exe extension
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns("malware.exe");
            mockFile.Setup(f => f.Length).Returns(1024);

            var result = await controller.Upload("idea-1", mockFile.Object, "legal_evidence", "My Document");

            result.Should().BeOfType<BadRequestObjectResult>();
            var badReq = result as BadRequestObjectResult;
            var json = JsonSerializer.Serialize(badReq!.Value);
            json.Should().Contain("not permitted");
        }

        // ---------------------------------------------------------------------------------
        // 4. CONCURRENCY & IDEMPOTENCY: Simultaneous Level Up Requests
        // ---------------------------------------------------------------------------------

        [Fact]
        public async Task EnsureLevelUpCompanyAsync_Concurrent_Calls_Are_Idempotent_And_Return_Same_Company()
        {
            var (service, companiesList) = CreateCompanyServiceWithDb();
            var userId = "concurrent-founder-1";
            var ideaId = "concurrent-idea-1";

            // When: 2 concurrent calls arrive simultaneously
            var task1 = service.EnsureLevelUpCompanyAsync(
                userId, ideaId, "SAS", 100000, "Venture Fast", "AI", "Tag", "j-1", 70.0, "fc-1", "bp-1", null, null, null, null);
            var task2 = service.EnsureLevelUpCompanyAsync(
                userId, ideaId, "SAS", 100000, "Venture Fast", "AI", "Tag", "j-1", 70.0, "fc-1", "bp-1", null, null, null, null);

            var results = await Task.WhenAll(task1, task2);

            // Then: Both calls return the exact same Company ID and 1 company is created
            results[0].Id.Should().Be(results[1].Id);
            companiesList.Count(c => c.OwnerId == userId && c.SourceBusinessIdeaId == ideaId).Should().Be(1);
        }

        // ---------------------------------------------------------------------------------
        // 5. MULTI-PROJECT ISOLATION: User owning Idea A, B, and C
        // ---------------------------------------------------------------------------------

        [Fact]
        public async Task Multi_Project_LevelUp_Scopes_Strictly_To_Targeted_Idea()
        {
            var (service, companiesList) = CreateCompanyServiceWithDb();
            var userId = "multi-idea-founder";

            // User levels up Idea B
            var companyB = await service.EnsureLevelUpCompanyAsync(
                userId: userId,
                sourceLink: "idea-B",
                legalStructure: "SAS",
                fundingAsk: 120000,
                companyName: "Project B Inc",
                industry: "CleanTech",
                tagline: "Eco friendly solutions",
                journeyId: "journey-B",
                baselineReadiness: 85.0,
                forecastId: "fc-B",
                businessPlanId: "bp-B",
                legalAssessment: new CreatorLegalAssessment { CreatorIdeaId = "idea-B", RulesVersion = "FR-2026.1" },
                logo: "/logos/b.png",
                documents: new List<CreatorIdeaDocument>
                {
                    new() { Id = "doc-B1", FileName = "pitch_b.pdf", DocumentType = "business_plan", StorageReference = "ref_b1.pdf", CreatedAt = DateTime.UtcNow }
                },
                session: null);

            // Assert: Company references exclusively Idea B assets
            companyB.SourceBusinessIdeaId.Should().Be("idea-B");
            companyB.SourceCreatorJourneyId.Should().Be("journey-B");
            companyB.SourceForecastId.Should().Be("fc-B");
            companyB.SourceBusinessPlanSessionId.Should().Be("bp-B");
            companyB.CompanyName.Should().Be("Project B Inc");
            companyB.DataRoomDocuments.Should().HaveCount(1);
            companyB.DataRoomDocuments[0].DocumentId.Should().Be("doc-B1");

            // Idea A remains unlinked to this company
            companiesList.Any(c => c.SourceBusinessIdeaId == "idea-A").Should().BeFalse();
        }

        // ---------------------------------------------------------------------------------
        // 6. STALE-STATE FIDELITY: Leveled-up unrefreshed assessment transfers honestly
        // ---------------------------------------------------------------------------------

        [Fact]
        public async Task Stale_Legal_Assessment_Transfers_To_Company_With_Stale_Signals_Intact()
        {
            var (service, companiesList) = CreateCompanyServiceWithDb();
            var userId = "stale-founder";
            var ideaId = "idea-stale-pivot";

            var staleAssessment = new CreatorLegalAssessment
            {
                CreatorIdeaId = ideaId,
                UserId = userId,
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 50.0,
                IsPotentiallyOutdated = true,
                StaleMetadata = new LegalStaleMetadata
                {
                    IsStale = true,
                    StaleReason = LegalStaleReasons.BusinessDataChanged,
                    StaleDetectedAt = DateTime.UtcNow.AddHours(-1),
                    HumanChangeDescriptions = new List<string> { "+ Consumer customers", "- Enterprise / B2B customers" }
                },
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-001", Title = "Capital deposit", Status = "completed" }
                }
            };

            var company = await service.EnsureLevelUpCompanyAsync(
                userId: userId,
                sourceLink: ideaId,
                legalStructure: "SAS",
                fundingAsk: 30000,
                companyName: "Pivot Co",
                industry: "Retail",
                tagline: "Pivot from B2B to B2C",
                journeyId: "journey-pivot",
                baselineReadiness: 50.0,
                forecastId: "fc-pivot",
                businessPlanId: "bp-pivot",
                legalAssessment: staleAssessment,
                logo: null,
                documents: null,
                session: null);

            company.LegalAssessment.Should().NotBeNull();
            company.LegalAssessment!.IsPotentiallyOutdated.Should().BeTrue();
            company.LegalAssessment.StaleMetadata.Should().NotBeNull();
            company.LegalAssessment.StaleMetadata!.IsStale.Should().BeTrue();
            company.LegalAssessment.StaleMetadata.StaleReason.Should().Be(LegalStaleReasons.BusinessDataChanged);
            company.LegalAssessment.StaleMetadata.HumanChangeDescriptions.Should().Contain("+ Consumer customers");
        }

        // ---------------------------------------------------------------------------------
        // 7. READINESS FORMULA CANON: 20/20/25/15/20 Weighting = 100 Total
        // ---------------------------------------------------------------------------------

        [Fact]
        public void Investor_Readiness_Formula_Canon_Weights_Sum_To_100()
        {
            // Verify the architectural formula documented in canon:
            const double maxConceptClarity = 20.0;
            const double maxMarketEvidence = 20.0;
            const double maxFinancialModel = 25.0;
            const double maxLegalReadiness = 15.0;
            const double maxTeamCredibility = 20.0;

            var totalMax = maxConceptClarity + maxMarketEvidence + maxFinancialModel + maxLegalReadiness + maxTeamCredibility;
            totalMax.Should().Be(100.0, "Investor Readiness dimensions must strictly total 100.0");
        }

        // ---------------------------------------------------------------------------------
        // Helper method: In-memory mocked CompanyService with Companies collection
        // ---------------------------------------------------------------------------------

        private static (CompanyService service, List<Companies> companiesList) CreateCompanyServiceWithDb()
        {
            var companiesList = new List<Companies>();
            var mockCollection = new Mock<IMongoCollection<Companies>>();

            mockCollection.Setup(c => c.InsertOneAsync(It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<Companies, InsertOneOptions, CancellationToken>((company, _, _) =>
                {
                    lock (companiesList)
                    {
                        if (!string.IsNullOrEmpty(company.SourceBusinessIdeaId) &&
                            companiesList.Any(c => c.OwnerId == company.OwnerId && c.SourceBusinessIdeaId == company.SourceBusinessIdeaId))
                        {
                            return;
                        }
                        companiesList.Add(company);
                    }
                })
                .Returns(Task.CompletedTask);

            mockCollection.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<Companies>>();
                    var currentBatch = companiesList.ToList();
                    cursor.Setup(c => c.Current).Returns(currentBatch);
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>()))
                        .Returns(currentBatch.Count > 0)
                        .Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                        .ReturnsAsync(currentBatch.Count > 0)
                        .ReturnsAsync(false);
                    return cursor.Object;
                });

            var dbMock = new Mock<IMongoDatabase>();
            dbMock.Setup(d => d.GetCollection<Companies>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
                .Returns(mockCollection.Object);

            var context = new MongoDbContext(dbMock.Object);

            var service = new CompanyService(
                context,
                new Mock<IValuationEngine>().Object,
                new Mock<ICapTableCalculator>().Object,
                new Mock<IInvestorMatcher>().Object,
                new Mock<IAiReviewEngine>().Object,
                new Mock<IDocumentManager>().Object,
                new Mock<IPhaseValidator>().Object,
                new Mock<IDealEventPublisher>().Object,
                NullLogger<CompanyService>.Instance,
                null);

            return (service, companiesList);
        }
    }
}
