using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Services.Legal;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class LegalApplicabilityEngineTests
    {
        private readonly IFranceLegalRulesCatalog _catalog;
        private readonly BusinessProfileClassifier _classifier;
        private readonly LegalApplicabilityEngine _engine;

        public LegalApplicabilityEngineTests()
        {
            _catalog = new FranceLegalRulesCatalog(NullLogger<FranceLegalRulesCatalog>.Instance);
            _classifier = new BusinessProfileClassifier();
            _engine = new LegalApplicabilityEngine(_catalog, NullLogger<LegalApplicabilityEngine>.Instance);
        }

        [Fact]
        public void Scenario1_France_SaaS_B2B_MatchesB2BAndExcludesConsumerRetractionAnd3Clicks()
        {
            // Given: France, SaaS, B2B, enterprise sales, no consumer sales
            var project = new CreatorJourneyProject
            {
                Name = "CloudMetrics Enterprise",
                Concept = "B2B SaaS data analytics platform for enterprise logistics fleets",
                Sector = "SaaS / Cloud Software",
                TargetUser = "Enterprise CTOs and logistics directors at mid-market companies",
                TargetMarket = "B2B France and Europe"
            };

            var bmCanvas = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["channels"] = "Direct B2B enterprise sales and web app",
                    ["customerSegments"] = "Logistics companies and transport enterprises",
                    ["revenueStreams"] = "Annual subscription licenses and enterprise SLAs"
                }
            };

            // When: Classified and evaluated
            var profile = _classifier.Classify(project, bmCanvas);
            profile.IsSaaS.Value.Should().BeTrue();
            profile.IsB2B.Value.Should().BeTrue();
            profile.IsB2C.Value.Should().BeFalse();
            profile.HasSubscription.Value.Should().BeTrue();

            var assessment = _engine.Evaluate("idea-1", "user-1", profile);

            // Then: Universal corporate and B2B requirements apply
            var itemIds = assessment.Items.Select(i => i.Id).ToList();
            itemIds.Should().Contain("FR-CORP-001"); // Capital deposit
            itemIds.Should().Contain("FR-CORP-004"); // Guichet Unique INPI
            itemIds.Should().Contain("FR-PRIV-001"); // RGPD privacy
            itemIds.Should().Contain("FR-CONS-002"); // CGV B2B

            // And: B2C consumer rights MUST NOT apply
            itemIds.Should().NotContain("FR-CONS-001"); // CGV B2C (14-day retraction)
            itemIds.Should().NotContain("FR-CONS-003"); // 3-clics consumer cancellation
            itemIds.Should().NotContain("FR-MKT-001"); // Marketplace

            assessment.PlanningReadinessPct.Should().Be(0.0); // No items completed yet
        }

        [Fact]
        public void Scenario2_France_SaaS_B2C_Subscription_Matches3ClicksAndRetraction()
        {
            // Given: France, SaaS, B2C consumer subscription with personal data and online checkout
            var project = new CreatorJourneyProject
            {
                Name = "ZenHabit",
                Concept = "Mobile and web application offering subscription wellness coaching for individuals",
                Sector = "Digital Health & Wellness SaaS",
                TargetUser = "Consumers, individuals, and working parents seeking stress reduction",
                TargetMarket = "B2C France"
            };

            var bmCanvas = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["keyPartners"] = "Stripe, Mixpanel analytics",
                    ["channels"] = "Web platform and mobile app stores",
                    ["customerSegments"] = "Individuals and everyday consumers",
                    ["revenueStreams"] = "Monthly subscription €9.99/month, annual forfait €79/year"
                }
            };

            var profile = _classifier.Classify(project, bmCanvas);
            profile.IsSaaS.Value.Should().BeTrue();
            profile.IsB2C.Value.Should().BeTrue();
            profile.HasSubscription.Value.Should().BeTrue();
            profile.HasOnlinePayments.Value.Should().BeTrue();
            profile.CollectsPersonalData.Value.Should().BeTrue();
            profile.UsesAnalyticsOrTracking.Value.Should().BeTrue();

            var assessment = _engine.Evaluate("idea-2", "user-1", profile);
            var itemIds = assessment.Items.Select(i => i.Id).ToList();

            // Then: Mandatory consumer protection and subscription laws MUST apply deterministically
            itemIds.Should().Contain("FR-CONS-001"); // CGV B2C 14-day retraction
            itemIds.Should().Contain("FR-CONS-003"); // Résiliation 3 clics
            itemIds.Should().Contain("FR-PAY-001");  // Online payments (DSP2/PCI-DSS)
            itemIds.Should().Contain("FR-PRIV-001"); // RGPD
            itemIds.Should().Contain("FR-PRIV-002"); // Cookies consent
        }

        [Fact]
        public void Scenario3_France_Ecommerce_B2C_MatchesDeliveryAndPayment()
        {
            // Given: E-commerce selling physical products online
            var project = new CreatorJourneyProject
            {
                Name = "BioCosmétiques Paris",
                Concept = "E-commerce store selling organic skincare products shipped directly to consumers",
                Sector = "E-commerce & Retail",
                TargetUser = "Eco-conscious consumers and beauty enthusiasts",
                TargetMarket = "France"
            };

            var bmCanvas = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["keyPartners"] = "Colissimo, Chronopost, Stripe payment gateway",
                    ["channels"] = "Boutique en ligne, panier d'achat, shipping",
                    ["revenueStreams"] = "Vente directe de produits, panier moyen €45"
                }
            };

            var profile = _classifier.Classify(project, bmCanvas);
            profile.IsEcommerce.Value.Should().BeTrue();
            profile.IsB2C.Value.Should().BeTrue();
            profile.SellsProducts.Value.Should().BeTrue();

            var assessment = _engine.Evaluate("idea-3", "user-1", profile);
            var itemIds = assessment.Items.Select(i => i.Id).ToList();

            itemIds.Should().Contain("FR-CONS-001"); // CGV B2C
            itemIds.Should().Contain("FR-PAY-001");  // Online payments
            itemIds.Should().Contain("FR-WEB-001");  // Mentions légales
        }

        [Fact]
        public void Scenario4_France_Marketplace_MatchesPlatformTransparency()
        {
            // Given: Two-sided marketplace connecting freelance artisans and buyers
            var project = new CreatorJourneyProject
            {
                Name = "ArtisanDirect",
                Concept = "Marketplace and platform connecting local artisans with buyers across France",
                Sector = "Marketplace / Intermédiation",
                TargetUser = "Artisans (sellers) and consumers (buyers)"
            };

            var bmCanvas = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["keyActivities"] = "Plateforme de mise en relation, intermédiation",
                    ["revenueStreams"] = "Commission sur transactions (take-rate 12%)"
                }
            };

            var profile = _classifier.Classify(project, bmCanvas);
            profile.IsMarketplace.Value.Should().BeTrue();

            var assessment = _engine.Evaluate("idea-4", "user-1", profile);
            var itemIds = assessment.Items.Select(i => i.Id).ToList();

            // Must include statutory marketplace transparency obligation (Article L111-7 Code de la consommation)
            itemIds.Should().Contain("FR-MKT-001");
            itemIds.Should().Contain("FR-PAY-001");
        }

        [Fact]
        public void Scenario5_France_Consulting_B2B_ExcludesEcomAndSaaSOnlyRules()
        {
            // Given: B2B strategy consulting boutique
            var project = new CreatorJourneyProject
            {
                Name = "Apex Strategy Consulting",
                Concept = "Cabinet de conseil en stratégie de décarbonation pour grandes entreprises",
                Sector = "Consulting & Professional Services",
                TargetUser = "Direction RSE et Directeurs Généraux du CAC 40",
                TargetMarket = "B2B France"
            };

            var profile = _classifier.Classify(project);
            profile.IsConsulting.Value.Should().BeTrue();
            profile.IsB2B.Value.Should().BeTrue();
            profile.IsEcommerce.Value.Should().BeFalse();
            profile.IsMarketplace.Value.Should().BeFalse();

            var assessment = _engine.Evaluate("idea-5", "user-1", profile);
            var itemIds = assessment.Items.Select(i => i.Id).ToList();

            itemIds.Should().Contain("FR-CORP-001"); // Capital deposit
            itemIds.Should().Contain("FR-CONS-002"); // CGV B2B
            itemIds.Should().Contain("FR-INS-001");  // RC Pro
            itemIds.Should().NotContain("FR-MKT-001");
            itemIds.Should().NotContain("FR-CONS-003");
        }

        [Fact]
        public void Scenario6_PotentiallyRegulatedBusiness_ProducesNeedsInformation_ZeroHallucination()
        {
            // Given: Ambiguous project in healthcare / medical sector
            var project = new CreatorJourneyProject
            {
                Name = "MedAI Diagnostics",
                Concept = "Plateforme d'aide au diagnostic médical et orientation de patients",
                Sector = "Santé et secteur médical",
                TargetUser = "Médecins et patients"
            };

            var profile = _classifier.Classify(project);
            profile.MayBeRegulatedActivity.Confidence.Should().Be(SignalConfidenceLevels.Unknown);
            profile.RegulatoryNotes.Should().NotBeNullOrEmpty();

            var assessment = _engine.Evaluate("idea-6", "user-1", profile);

            // Then: The engine must return NeedsInformation, NOT invent statutory compliance!
            var regItem = assessment.Items.FirstOrDefault(i => i.Id == "FR-REG-001");
            regItem.Should().NotBeNull();
            regItem!.EvaluationStatus.Should().Be(ApplicabilityEvaluationStatuses.NeedsInformation);
            regItem.Status.Should().Be(LegalItemStatuses.NeedsInformation);

            var regTrace = assessment.EvaluationTraces.FirstOrDefault(t => t.RuleId == "FR-REG-001");
            regTrace.Should().NotBeNull();
            regTrace!.Status.Should().Be(ApplicabilityEvaluationStatuses.NeedsInformation);
            regTrace.TraceRationale.Should().MatchRegex("(?i)santé|médical");
        }

        [Fact]
        public void Scenario7_BusinessModelChanges_DetectsStaleSnapshotHash()
        {
            // Given: Baseline profile evaluation
            var project = new CreatorJourneyProject
            {
                Name = "Initial Project",
                Concept = "Consulting agency",
                Sector = "Consulting",
                TargetUser = "Enterprises"
            };

            var initialProfile = _classifier.Classify(project);
            var assessment = _engine.Evaluate("idea-7", "user-1", initialProfile);
            var initialHash = assessment.BusinessSnapshotHash;
            initialHash.Should().NotBeNullOrEmpty();

            // When: Upstream business changes (e.g. founder pivots from pure consulting to B2C subscription SaaS)
            project.Concept = "SaaS software platform offering automated subscription services for consumers";
            project.Sector = "SaaS";
            project.TargetUser = "Everyday consumers";

            var updatedBm = new BsonDocument
            {
                ["canvas"] = new BsonDocument
                {
                    ["revenueStreams"] = "Monthly subscription €29/month"
                }
            };

            var modifiedProfile = _classifier.Classify(project, updatedBm);
            var modifiedHash = _engine.ComputeSnapshotHash(modifiedProfile);

            // Then: Snapshot hash mismatch proves stale state
            modifiedHash.Should().NotBe(initialHash);
        }

        [Fact]
        public void PlanningReadinessScore_CalculatesDeterministicWeighting()
        {
            // Given: Sample profile with 10 items
            var project = new CreatorJourneyProject
            {
                Name = "Test SaaS",
                Sector = "SaaS",
                TargetUser = "B2B enterprises"
            };

            var profile = _classifier.Classify(project);
            var assessment = _engine.Evaluate("idea-readiness", "user-1", profile);
            assessment.PlanningReadinessPct.Should().Be(0.0);

            // Complete half of the critical company creation items
            var beforeCreationItem = assessment.Items.First(i => i.Stage == LegalStages.BeforeCreation);
            beforeCreationItem.Status = LegalItemStatuses.Completed;

            var newScore = _engine.ComputePlanningReadiness(assessment.Items);
            newScore.Should().BeGreaterThan(0.0);
            newScore.Should().BeLessThan(100.0);

            // Mark all items completed
            foreach (var item in assessment.Items)
            {
                item.Status = LegalItemStatuses.Completed;
            }

            var fullScore = _engine.ComputePlanningReadiness(assessment.Items);
            fullScore.Should().Be(100.0);
        }
    }
}
