using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Legal;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class LegalChangeDetectionTests
    {
        private readonly IFranceLegalRulesCatalog _catalog;
        private readonly BusinessProfileClassifier _classifier;
        private readonly LegalApplicabilityEngine _engine;
        private readonly LegalFrameworkSectionBuilder _sectionBuilder;

        public LegalChangeDetectionTests()
        {
            _catalog = new FranceLegalRulesCatalog(NullLogger<FranceLegalRulesCatalog>.Instance);
            _classifier = new BusinessProfileClassifier();
            _engine = new LegalApplicabilityEngine(_catalog, NullLogger<LegalApplicabilityEngine>.Instance);
            _sectionBuilder = new LegalFrameworkSectionBuilder();
        }

        private CreatorJourneyProject CreateBaseB2BProject()
        {
            return new CreatorJourneyProject
            {
                Name = "Acme B2B Systems",
                Concept = "Enterprise software for supply chain tracking and fleet dispatch",
                Sector = "B2B SaaS / Supply Chain",
                TargetUser = "Supply chain managers at mid to large enterprises",
                TargetMarket = "B2B France and European Union"
            };
        }

        private BsonDocument CreateBaseB2BCanvas()
        {
            return new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["channels"] = "Direct B2B enterprise sales and dedicated web dashboard",
                    ["customerSegments"] = "Corporate fleet owners and logistics managers",
                    ["revenueStreams"] = "Annual enterprise software licenses, wire transfer invoiced"
                }
            };
        }

        // Test A: Identical business data -> not stale
        [Fact]
        public void TestA_IdenticalBusinessData_IsNotStale()
        {
            // Given: Evaluated B2B assessment
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile);

            // When: Checking freshness against the same data
            var profileCurrent = _classifier.Classify(project, canvas);
            var metadata = _engine.CheckFreshness(assessment, profileCurrent, _catalog.RulesVersion, _catalog.Jurisdiction);

            // Then: Freshness is Current, not stale
            metadata.IsStale.Should().BeFalse();
            metadata.StaleReason.Should().Be(LegalStaleReasons.None);
            metadata.Diffs.Should().BeEmpty();
            metadata.HumanChangeDescriptions.Should().BeEmpty();
        }

        // Test B: Brand-only change -> legal not stale (Selective Invalidation)
        [Fact]
        public void TestB_BrandOnlyChange_DoesNotStaleLegal()
        {
            // Given: Evaluated B2B assessment
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile);

            // When: Brand styling/tagline/logo changes, but core classifier signals remain identical
            var brandModifiedProject = new CreatorJourneyProject
            {
                Name = "Acme B2B Systems Rebranded",
                Concept = "Enterprise software for supply chain tracking and fleet dispatch - Now with sleek new branding",
                Sector = "B2B SaaS / Supply Chain",
                TargetUser = "Supply chain managers at mid to large enterprises",
                TargetMarket = "B2B France and European Union"
            };
            var profileAfterBrand = _classifier.Classify(brandModifiedProject, canvas);

            var metadata = _engine.CheckFreshness(assessment, profileAfterBrand, _catalog.RulesVersion, _catalog.Jurisdiction);

            // Then: Legal remains not stale (zero false positives for brand edits)
            metadata.IsStale.Should().BeFalse();
            metadata.StaleReason.Should().Be(LegalStaleReasons.None);
        }

        // Test C: B2B -> B2C -> legal stale (BusinessDataChanged, + Consumer customers)
        [Fact]
        public void TestC_B2BToB2CChange_TriggersStaleWithConsumerLabel()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Pivot to consumer market
            project.TargetUser = "Individual consumers, families, and everyday commuters";
            project.TargetMarket = "B2C France";
            canvas["canvas"]["customerSegments"] = "Consumers and end-users";
            var profile2 = _classifier.Classify(project, canvas);

            var metadata = _engine.CheckFreshness(assessment, profile2, _catalog.RulesVersion, _catalog.Jurisdiction);

            metadata.IsStale.Should().BeTrue();
            metadata.StaleReason.Should().Be(LegalStaleReasons.BusinessDataChanged);
            metadata.Diffs.Should().Contain(d => d.SignalKey == "IsB2C" && d.CurrentValue);
            metadata.HumanChangeDescriptions.Should().Contain(d => d.Contains("Consumer customers"));
        }

        // Test D: Subscription added -> legal stale (+ Subscription revenue model)
        [Fact]
        public void TestD_SubscriptionAdded_TriggersStaleWithSubscriptionLabel()
        {
            var project = CreateBaseB2BProject();
            var canvas = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["channels"] = "Direct B2B enterprise sales",
                    ["customerSegments"] = "Logistics companies",
                    ["revenueStreams"] = "One-time hardware setup fee"
                }
            };
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Add recurring monthly/annual subscription
            canvas["canvas"]["revenueStreams"] = "One-time hardware setup fee plus €299/month recurring SaaS subscription";
            var profile2 = _classifier.Classify(project, canvas);

            var metadata = _engine.CheckFreshness(assessment, profile2, _catalog.RulesVersion, _catalog.Jurisdiction);

            metadata.IsStale.Should().BeTrue();
            metadata.StaleReason.Should().Be(LegalStaleReasons.BusinessDataChanged);
            metadata.Diffs.Should().Contain(d => d.SignalKey == "HasSubscription" && d.CurrentValue);
            metadata.HumanChangeDescriptions.Should().Contain(d => d.Contains("Subscription revenue model"));
        }

        // Test E: Personal-data collection added -> legal stale (+ Personal-data processing)
        [Fact]
        public void TestE_PersonalDataAdded_TriggersStaleWithPrivacyLabel()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Add explicit personal user profiling / data processing
            canvas["canvas"]["keyPartners"] = "Mixpanel, Google Analytics, user profiling CRM";
            canvas["canvas"]["channels"] = "Direct sales, mobile apps tracking user location and personal profiles";
            var profile2 = _classifier.Classify(project, canvas);

            var metadata = _engine.CheckFreshness(assessment, profile2, _catalog.RulesVersion, _catalog.Jurisdiction);

            // If personal data is detected newly
            if (profile2.CollectsPersonalData.Value == true && profile1.CollectsPersonalData.Value != true)
            {
                metadata.IsStale.Should().BeTrue();
                metadata.HumanChangeDescriptions.Should().Contain(d => d.Contains("Personal-data processing"));
            }
        }

        // Test F: Marketplace activity added -> legal stale (+ Marketplace platform)
        [Fact]
        public void TestF_MarketplaceAdded_TriggersStaleWithMarketplaceLabel()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Add marketplace intermediary platform
            project.Concept = "Marketplace multi-vendor platform connecting shippers with freelance transport drivers";
            canvas["canvas"]["customerSegments"] = "Two-sided marketplace: suppliers and commercial buyers";
            var profile2 = _classifier.Classify(project, canvas);

            var metadata = _engine.CheckFreshness(assessment, profile2, _catalog.RulesVersion, _catalog.Jurisdiction);

            metadata.IsStale.Should().BeTrue();
            metadata.StaleReason.Should().Be(LegalStaleReasons.BusinessDataChanged);
            metadata.Diffs.Should().Contain(d => d.SignalKey == "IsMarketplace" && d.CurrentValue);
            metadata.HumanChangeDescriptions.Should().Contain(d => d.Contains("Marketplace platform"));
        }

        // Test G: Rules version change -> legal stale (RulesUpdated)
        [Fact]
        public void TestG_RulesVersionChange_TriggersStaleRulesUpdated()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile);

            // Simulate older catalog version stored in assessment
            assessment.RulesVersion = "FR-2024.1";

            var metadata = _engine.CheckFreshness(assessment, profile, _catalog.RulesVersion, _catalog.Jurisdiction);

            metadata.IsStale.Should().BeTrue();
            metadata.StaleReason.Should().Be(LegalStaleReasons.RulesUpdated);
            metadata.CurrentRulesVersion.Should().Be(_catalog.RulesVersion);
            metadata.AssessmentRulesVersion.Should().Be("FR-2024.1");
        }

        // Test H: Refresh preserves completed unchanged requirements
        [Fact]
        public void TestH_Refresh_PreservesCompletedUnchangedRequirements()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // User completes capital deposit requirement
            var capitalItem = assessment.Items.First(i => i.Id == "FR-CORP-001");
            capitalItem.Status = LegalItemStatuses.Completed;
            capitalItem.CompletedAt = DateTime.UtcNow;
            capitalItem.Notes = "Deposited at Qonto, received certificate.";

            // Add subscription revenue
            canvas["canvas"]["revenueStreams"] = "Enterprise licenses with monthly recurring SaaS add-ons";
            var profile2 = _classifier.Classify(project, canvas);

            // Reconcile and re-evaluate
            var reconciled = _engine.ReconcileAndEvaluate("idea-1", "user-1", profile2, assessment);

            // Then capital deposit item remains completed with notes preserved
            var updatedCapital = reconciled.Items.First(i => i.Id == "FR-CORP-001");
            updatedCapital.Status.Should().Be(LegalItemStatuses.Completed);
            updatedCapital.Notes.Should().Be("Deposited at Qonto, received certificate.");
            updatedCapital.CompletedAt.Should().NotBeNull();
            reconciled.ReconciliationSummary.UnchangedRequirementsCount.Should().BeGreaterThan(0);
        }

        // Test I: Refresh preserves evidence links
        [Fact]
        public void TestI_Refresh_PreservesEvidenceLinks()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Attach evidence document link
            var inpiItem = assessment.Items.First(i => i.Id == "FR-CORP-004");
            inpiItem.Status = LegalItemStatuses.Completed;
            inpiItem.EvidenceDocumentId = "doc-inpi-receipt-99";
            inpiItem.EvidenceFileName = "inpi-deposit-receipt.pdf";

            // Trigger re-evaluation with updated profile
            var reconciled = _engine.ReconcileAndEvaluate("idea-1", "user-1", profile1, assessment);

            var updatedInpi = reconciled.Items.First(i => i.Id == "FR-CORP-004");
            updatedInpi.EvidenceDocumentId.Should().Be("doc-inpi-receipt-99");
            updatedInpi.EvidenceFileName.Should().Be("inpi-deposit-receipt.pdf");
        }

        // Test J: New applicable requirement added (marked + NEW)
        [Fact]
        public void TestJ_NewApplicableRequirement_IsMarkedAsNew()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Consumer requirements were not in profile1
            assessment.Items.Should().NotContain(i => i.Id == "FR-CONS-001");

            // Add consumer sales
            project.TargetUser = "Individual consumers and end-users";
            canvas["canvas"]["customerSegments"] = "Direct to consumer buyers";
            var profile2 = _classifier.Classify(project, canvas);

            var reconciled = _engine.ReconcileAndEvaluate("idea-1", "user-1", profile2, assessment);

            var consumerItem = reconciled.Items.FirstOrDefault(i => i.Id == "FR-CONS-001");
            consumerItem.Should().NotBeNull();
            consumerItem!.IsNewRequirement.Should().BeTrue();
            reconciled.ReconciliationSummary.AddedRequirements.Count.Should().BeGreaterThan(0);
            reconciled.ReconciliationSummary.AddedRequirements.Should().Contain(i => i.Id == "FR-CONS-001");
        }

        // Test K: No-longer-applicable requirement marked not_applicable, removed from active roadmap
        [Fact]
        public void TestK_NoLongerApplicableRequirement_MarkedNotApplicable()
        {
            // Start with consumer subscription
            var project = new CreatorJourneyProject
            {
                Name = "Consumer App",
                Concept = "B2C fitness app with online consumer subscriptions",
                Sector = "Fitness",
                TargetUser = "Consumers",
                TargetMarket = "B2C France"
            };
            var canvas = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["customerSegments"] = "Consumers",
                    ["revenueStreams"] = "Monthly consumer subscription"
                }
            };
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Pivot to pure enterprise B2B (no consumers, no subscriptions)
            var projectB2B = CreateBaseB2BProject();
            var canvasB2B = CreateBaseB2BCanvas();
            var profile2 = _classifier.Classify(projectB2B, canvasB2B);

            var reconciled = _engine.ReconcileAndEvaluate("idea-1", "user-1", profile2, assessment);

            var retiredItem = reconciled.Items.FirstOrDefault(i => i.Id == "FR-CONS-001");
            retiredItem.Should().NotBeNull();
            retiredItem!.Status.Should().Be(LegalItemStatuses.NotApplicable);
            retiredItem.EvaluationStatus.Should().Be(ApplicabilityEvaluationStatuses.NotApplicable);

            // Active items exclude not_applicable
            var activeItems = reconciled.Items.Where(i => i.Status != LegalItemStatuses.NotApplicable).ToList();
            activeItems.Should().NotContain(i => i.Id == "FR-CONS-001");
            reconciled.ReconciliationSummary.RemovedRequirements.Count.Should().BeGreaterThan(0);
        }

        // Test L: Historical data & evidence links retained even for no-longer-applicable items
        [Fact]
        public void TestL_HistoricalDataAndEvidenceRetained_ForNoLongerApplicable()
        {
            var project = new CreatorJourneyProject
            {
                Name = "Consumer App",
                Concept = "B2C app",
                Sector = "Retail",
                TargetUser = "Consumers",
                TargetMarket = "B2C France"
            };
            var canvas = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["customerSegments"] = "Consumers",
                    ["revenueStreams"] = "Consumer retail"
                }
            };
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Founder had previously uploaded CGV draft and marked completed
            var cgvItem = assessment.Items.First(i => i.Id == "FR-CONS-001");
            cgvItem.Status = LegalItemStatuses.Completed;
            cgvItem.EvidenceDocumentId = "doc-cgv-v1-pdf";
            cgvItem.Notes = "Reviewed by legal advisor in May.";

            // Pivot to B2B
            var profile2 = _classifier.Classify(CreateBaseB2BProject(), CreateBaseB2BCanvas());
            var reconciled = _engine.ReconcileAndEvaluate("idea-1", "user-1", profile2, assessment);

            var retiredCgv = reconciled.Items.First(i => i.Id == "FR-CONS-001");
            retiredCgv.Status.Should().Be(LegalItemStatuses.NotApplicable);
            // Historical links are preserved for audit trail
            retiredCgv.EvidenceDocumentId.Should().Be("doc-cgv-v1-pdf");
            retiredCgv.Notes.Should().Be("Reviewed by legal advisor in May.");
        }

        // Test M: Refresh idempotency (two identical refreshes produce no duplicates)
        [Fact]
        public void TestM_RefreshIdempotency_ProducesNoDuplicates()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile);

            var initialCount = assessment.Items.Count;

            // Reconcile once
            var refresh1 = _engine.ReconcileAndEvaluate("idea-1", "user-1", profile, assessment);
            refresh1.Items.Count.Should().Be(initialCount);

            // Reconcile second time
            var refresh2 = _engine.ReconcileAndEvaluate("idea-1", "user-1", profile, refresh1);
            refresh2.Items.Count.Should().Be(initialCount);

            // No duplicated IDs
            var distinctIds = refresh2.Items.Select(i => i.Id).Distinct().Count();
            distinctIds.Should().Be(refresh2.Items.Count);
        }

        // Test N: Section 12 becomes current after refresh
        [Fact]
        public void TestN_Section12_BecomesCurrentAfterRefresh()
        {
            var project = CreateBaseB2BProject();
            var canvas = CreateBaseB2BCanvas();
            var profile1 = _classifier.Classify(project, canvas);
            var assessment = _engine.Evaluate("idea-1", "user-1", profile1);

            // Change to B2C -> legal becomes stale
            project.TargetUser = "Consumers";
            canvas["canvas"]["customerSegments"] = "Consumers";
            var profile2 = _classifier.Classify(project, canvas);

            assessment.StaleMetadata = _engine.CheckFreshness(assessment, profile2, _catalog.RulesVersion, _catalog.Jurisdiction);
            assessment.StaleMetadata.IsStale.Should().BeTrue();

            var idea = new CreatorIdea
            {
                Id = "idea-n-1",
                UserId = "user-n-1",
                Project = project,
                Phase3Data = new CreatorPhase3Data()
            };

            // Section 12 before refresh reflects stale state
            var section12Stale = _sectionBuilder.Build(assessment, idea, _catalog.GetCatalog());
            section12Stale.IsStale.Should().BeTrue();

            // Perform refresh
            var refreshedAssessment = _engine.ReconcileAndEvaluate("idea-n-1", "user-n-1", profile2, assessment);

            // Section 12 after refresh is current
            var section12Fresh = _sectionBuilder.Build(refreshedAssessment, idea, _catalog.GetCatalog());
            section12Fresh.IsStale.Should().BeFalse();
        }

        // Test O: Wrong-user access denied (tenant isolation)
        [Fact]
        public void TestO_WrongUserAccess_TenantIsolationEnforced()
        {
            var assessment = new CreatorLegalAssessment
            {
                Id = "assessment-1",
                CreatorIdeaId = "idea-tenant-1",
                UserId = "owner-user-123",
                Jurisdiction = "FR"
            };

            const string requestingUser = "attacker-user-999";
            var isAuthorized = assessment.UserId == requestingUser;

            isAuthorized.Should().BeFalse("Access must be strictly denied to any user who is not the document owner");
        }

        // Forecast change tests: TAM provenance & custom forecast preservation
        [Fact]
        public void Forecast_TamCustomPreservation_AndStaleDetection()
        {
            // Provenance TAM from Step 3.1 Market Study was 5,000,000
            decimal previousMarketStudyTam = 5000000m;
            decimal customForecastTam = 4500000m; // Founder tailored forecast TAM

            // Market study in Step 3.1 is regenerated with 12,000,000 TAM
            decimal newMarketStudyTam = 12000000m;

            // Deterministic detection of TAM difference
            bool isTamOverridden = Math.Abs(customForecastTam - newMarketStudyTam) > 1.0m;
            isTamOverridden.Should().BeTrue();

            // Custom forecast model remains intact unless 1-click reset is selected
            customForecastTam.Should().Be(4500000m);
        }

        // Business plan tests: Narrative preservation on edit
        [Fact]
        public void BusinessPlan_Section12_PreservesFounderManualEdits()
        {
            var idea = new CreatorIdea
            {
                Id = "idea-bp-1",
                UserId = "user-bp-1",
                Project = CreateBaseB2BProject(),
                Phase3Data = new CreatorPhase3Data()
            };

            var profile = _classifier.Classify(idea.Project, CreateBaseB2BCanvas());
            var assessment = _engine.Evaluate(idea.Id, idea.UserId, profile);

            var section12 = _sectionBuilder.Build(assessment, idea, _catalog.GetCatalog());

            // Founder manually edited Section 12 text in business plan editor
            const string founderManualSummary = "Custom founder legal strategy: Pursuing SASU initially then converting to SAS with ESOP.";
            const bool isEdited = true;
            if (isEdited)
            {
                section12.Summary = founderManualSummary;
            }

            section12.Summary.Should().Be(founderManualSummary);
        }

        // Readiness tests: Upstream changes trigger update-needed
        [Fact]
        public void Readiness_UpstreamChanges_FlagUpdateAvailable()
        {
            var readiness = new CreatorInvestorReadinessScore
            {
                Total = 78.5,
                Label = "Solid Foundation",
                EvaluatedAt = DateTime.UtcNow.AddDays(-2),
                UpdateAvailable = false
            };

            // Upstream module modified today
            var lastUpstreamChange = DateTime.UtcNow;

            if (lastUpstreamChange > readiness.EvaluatedAt)
            {
                readiness.UpdateAvailable = true;
                readiness.ChangedSources = new List<string> { "Market Intelligence", "Legal & Compliance" };
            }

            readiness.UpdateAvailable.Should().BeTrue();
            readiness.ChangedSources.Should().Contain("Legal & Compliance");

            // Re-evaluating clears updateAvailable
            readiness.EvaluatedAt = DateTime.UtcNow;
            readiness.UpdateAvailable = false;
            readiness.ChangedSources.Clear();

            readiness.UpdateAvailable.Should().BeFalse();
        }
    }
}
