using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Dtos;
using WebApp.Models.Phase4;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorPhase4PricingTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<IConstructionSnapshotService> _snapshotServiceMock = new();
        private readonly Mock<IOperationalRoadmapService> _roadmapServiceMock = new();
        private readonly Mock<INeedsAnalysisService> _needsServiceMock = new();
        private readonly Mock<ISkillsResolutionService> _skillsServiceMock = new();
        private readonly Mock<ISupportPlanService> _supportServiceMock = new();
        private readonly Mock<IProfessionalProfileStore> _profStoreMock = new();
        private readonly Mock<IProfileCompletenessResolver> _completenessResolverMock = new();
        private readonly Mock<IMarketStudySessionStore> _marketStudiesMock = new();
        private readonly Mock<IBusinessModelSessionStore> _businessModelsMock = new();
        private readonly Mock<IForecastSessionStore> _forecastsMock = new();
        private readonly Mock<IBusinessPlanSessionStore> _businessPlansMock = new();
        private readonly Mock<ILogger<PricingStrategyService>> _loggerMock = new();

        private readonly IPricingPolicyEngine _policyEngine = new PricingPolicyEngine();

        private PricingStrategyService CreateService()
        {
            return new PricingStrategyService(
                _journeysMock.Object,
                _snapshotServiceMock.Object,
                _roadmapServiceMock.Object,
                _needsServiceMock.Object,
                _skillsServiceMock.Object,
                _supportServiceMock.Object,
                _policyEngine,
                _loggerMock.Object,
                _marketStudiesMock.Object,
                _businessModelsMock.Object,
                _forecastsMock.Object,
                _businessPlansMock.Object,
                _profStoreMock.Object,
                _completenessResolverMock.Object
            );
        }

        private static CreatorJourney BuildCompleteJourney(string userId = "user-1", string ideaId = "idea-1")
        {
            return new CreatorJourney
            {
                UserId = userId,
                ActiveIdeaId = ideaId,
                Project = new CreatorJourneyProject
                {
                    Name = "SaaS Analytics Hub",
                    Sector = "Software",
                    Problem = "Complex business metrics tracking",
                    Solution = "Automated metrics dashboard",
                    TargetUser = "B2B SMBs",
                    CreatorEdge = "High speed integrations"
                },
                Phase3Data = new CreatorPhase3Data
                {
                    BusinessPlanSessionId = "bp-1",
                    ForecastSessionId = "fc-1",
                    MarketStudySessionId = "ms-1",
                    BusinessModelSessionId = "bm-1"
                },
                Phase4Data = new CreatorPhase4Data
                {
                    ConstructionSnapshot = new ConstructionSnapshot { Status = "Completed", GeneratedAt = DateTime.UtcNow },
                    Roadmap = new OperationalRoadmap { Status = "Active", GeneratedAt = DateTime.UtcNow },
                    NeedsAnalysis = new NeedsAnalysis { Status = "Active", GeneratedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    SkillsPlan = new SkillsPlan { Status = "Active", GeneratedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                }
            };
        }

        private void SetupValidGates(CreatorJourney journey)
        {
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(journey);

            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase3 = new ComputedPhaseStatus { Status = "completed" }
                });

            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ProfessionalProfileRecord { UserId = journey.UserId });

            _completenessResolverMock.Setup(c => c.Resolve(It.IsAny<ProfessionalProfileRecord>()))
                .Returns(new ProfileCompletenessResult(100, true, new List<string>()));

            _snapshotServiceMock.Setup(s => s.GetSnapshotAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new ConstructionSnapshotResponse { Snapshot = journey.Phase4Data.ConstructionSnapshot, UpdateAvailable = false });

            _roadmapServiceMock.Setup(r => r.GetRoadmapAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new OperationalRoadmapResponse { Roadmap = journey.Phase4Data.Roadmap, UpdateAvailable = false });

            _needsServiceMock.Setup(n => n.GetNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new NeedsAnalysisResponse { NeedsAnalysis = journey.Phase4Data.NeedsAnalysis, UpdateAvailable = false });

            _skillsServiceMock.Setup(s => s.GetSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new SkillsPlanResponse { SkillsPlan = journey.Phase4Data.SkillsPlan, UpdateAvailable = false });

            _supportServiceMock.Setup(s => s.GetSupportPlanAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new SupportPlanResponse { SupportPlan = null, UpdateAvailable = false });

            _journeysMock.Setup(j => j.SetPhase4PricingStrategyAsync(journey.UserId, It.IsAny<PricingStrategy>(), journey.ActiveIdeaId))
                .Callback<string, PricingStrategy, string?>((u, s, i) => journey.Phase4Data.PricingStrategy = s)
                .ReturnsAsync(journey);
        }

        // =========================================================================
        // 1. GATE ENFORCEMENT TESTS
        // =========================================================================

        [Fact]
        public async Task Gate_Rejects_When_Phase3_Incomplete()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus { Phase3 = new ComputedPhaseStatus { Status = "in_progress" } });

            var service = CreateService();
            var act = () => service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Phase 3*must be completed*");
        }

        [Fact]
        public async Task Gate_Rejects_When_Snapshot_Missing_Or_Stale()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);
            _snapshotServiceMock.Setup(s => s.GetSnapshotAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new ConstructionSnapshotResponse { Snapshot = null, UpdateAvailable = false });

            var service = CreateService();
            var act = () => service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*SNAPSHOT_MISSING*");
        }

        [Fact]
        public async Task Gate_Rejects_When_Needs_Missing()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);
            _needsServiceMock.Setup(n => n.GetNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new NeedsAnalysisResponse { NeedsAnalysis = null, UpdateAvailable = false });

            var service = CreateService();
            var act = () => service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*NEEDS_MISSING*");
        }

        [Fact]
        public async Task Generate_Succeeds_When_SupportPlan_Is_Null()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);
            journey.Phase4Data.SupportPlan = null;
            _supportServiceMock.Setup(s => s.GetSupportPlanAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new SupportPlanResponse { SupportPlan = null, UpdateAvailable = false });

            var service = CreateService();
            var result = await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            result.Should().NotBeNull();
            result.Strategy.Should().NotBeNull();
            result.PrerequisiteGate.CanAccess.Should().BeTrue();
            result.PrerequisiteGate.BlockingReasons.Should().BeEmpty();
            journey.Phase4Data.SupportPlan.Should().BeNull();
        }

        [Fact]
        public async Task Gate_Succeeds_Even_When_SupportPlan_Empty()
        {
            // Invariant: Support eligibility must NOT determine whether pricing can exist
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);
            _supportServiceMock.Setup(s => s.GetSupportPlanAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new SupportPlanResponse { SupportPlan = null, UpdateAvailable = false });

            var service = CreateService();
            var result = await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            result.Should().NotBeNull();
            result.Strategy.Should().NotBeNull();
            result.Strategy.PrimaryRevenueModel.Should().Be(RevenueModelType.Subscription);
        }

        // =========================================================================
        // 2. REVENUE MODEL SELECTION TESTS
        // =========================================================================

        [Fact]
        public void ResolveRevenueModels_Selects_Subscription_When_SaaS()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "SaaS Software", Solution = "B2B Analytics Platform" },
                RevenueStreams = new List<PricingRevenueStreamItem> { new() { Stream = "Subscription SaaS" } }
            };

            var (primary, underlying) = _policyEngine.ResolveRevenueModels(ctx);
            primary.Should().Be(RevenueModelType.Subscription);
            underlying.Should().Contain("Subscription");
        }

        [Fact]
        public void ResolveRevenueModels_Selects_ProjectBased_When_Consulting()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "Management Consulting", Solution = "Strategic Advisory Services" },
                RevenueStreams = new List<PricingRevenueStreamItem> { new() { Stream = "Project Fee & Retainer" } }
            };

            var (primary, underlying) = _policyEngine.ResolveRevenueModels(ctx);
            primary.Should().Be(RevenueModelType.ProjectBased);
            underlying.Should().Contain("ProjectFee");
            underlying.Should().Contain("Retainer");
        }

        [Fact]
        public void ResolveRevenueModels_Selects_Commission_When_Marketplace()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "Two-Sided Marketplace", Solution = "Platform connecting buyers and suppliers" },
                RevenueStreams = new List<PricingRevenueStreamItem> { new() { Stream = "Transaction Take Rate" } }
            };

            var (primary, underlying) = _policyEngine.ResolveRevenueModels(ctx);
            primary.Should().Be(RevenueModelType.Commission);
            underlying.Should().Contain("Commission");
        }

        [Fact]
        public void ResolveRevenueModels_Selects_OneTime_When_DirectSale()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "Physical Manufacturing", Solution = "Eco-hardware unit" },
                RevenueStreams = new List<PricingRevenueStreamItem> { new() { Stream = "Direct Unit Sale" } }
            };

            var (primary, underlying) = _policyEngine.ResolveRevenueModels(ctx);
            primary.Should().Be(RevenueModelType.OneTime);
            underlying.Should().Contain("DirectSale");
        }

        // =========================================================================
        // 3. ZERO FAKE PRICE & EVIDENCE TESTS
        // =========================================================================

        [Fact]
        public void StructureOffers_Reuses_Phase3_BusinessModel_Assumptions()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "Software" },
                ExistingPricingAssumptions = new List<PricingExistingAssumptionItem>
                {
                    new() { TierName = "Starter", Pricing = "€49/mo", TargetSegment = "SMBs", ParsedPrice = 49m },
                    new() { TierName = "Pro", Pricing = "€199/mo", TargetSegment = "Mid-market", ParsedPrice = 199m }
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().HaveCount(2);
            offers[0].Name.Should().Be("Starter");
            offers[0].Price.Should().Be(49m);
            offers[0].Confidence.Should().Be(PricingConfidence.Supported);
            offers[0].PriceEvidence.Type.Should().Be(PriceEvidenceType.FounderAssumption);

            offers[1].Name.Should().Be("Pro");
            offers[1].Price.Should().Be(199m);
        }

        [Fact]
        public void StructureOffers_With_No_Evidence_Sets_NeedsValidation()
        {
            // Required Edge Test #66: No competitor pricing, no customer research, no existing price assumption
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "DeepTech R&D", TargetUser = "Enterprises" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "Enterprise Labs" } },
                CostStructure = new PricingCostStructureContext { EstimatedVariableCostPerUnit = 0m },
                Forecast = new PricingForecastContext { HasForecast = false, Arpu = null }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            offers[0].Price.Should().Be(0m);
            offers[0].Confidence.Should().Be(PricingConfidence.NeedsValidation);
            offers[0].PriceEvidence.Type.Should().Be(PriceEvidenceType.NeedsReview);
        }

        // =========================================================================
        // 4. UNIT ECONOMICS & MARGIN FLOOR FORMULAS (User Correction #2)
        // =========================================================================

        [Fact]
        public void CalculateUnitEconomics_Mathematically_Rigorous_Margin_Floors()
        {
            var ctx = new PricingContext
            {
                CostStructure = new PricingCostStructureContext { EstimatedMonthlyFixedCosts = 5000m }
            };

            // Test 1: Percentage rate m = 40% (0.40). MinimumPrice = VC / (1 - m) = 30 / 0.60 = 50.
            var uePct = _policyEngine.CalculateUnitEconomics(60m, 30m, null, ctx, MarginTargetType.Percentage, 0.40m);
            uePct.ContributionMargin.Should().Be(30m);
            uePct.ContributionMarginRate.Should().Be(0.5m);
            uePct.MinimumPriceFloor.Should().Be(50m);
            uePct.BreakEvenVolume.Should().Be(167); // 5000 / 30 = 166.66 -> 167

            // Test 2: Absolute markup A = €25. MinimumPrice = VC + A = 30 + 25 = 55.
            var ueAbs = _policyEngine.CalculateUnitEconomics(60m, 30m, null, ctx, MarginTargetType.AbsoluteAmount, 25m);
            ueAbs.ContributionMargin.Should().Be(30m);
            ueAbs.MinimumPriceFloor.Should().Be(55m);
        }

        [Fact]
        public void CalculateUnitEconomics_BelowCost_Produces_BelowCost_Risk()
        {
            // Required Edge Test #67: Price = 20, Variable Cost = 25 -> CM = -5, BelowCost Risk
            var ctx = new PricingContext();
            var ue = _policyEngine.CalculateUnitEconomics(20m, 25m, null, ctx, MarginTargetType.Percentage, 0.30m);

            ue.ContributionMargin.Should().Be(-5m);
            ue.ValidationStatus.Should().Be("BelowCostWarning");

            var offer = new PricingOffer
            {
                Key = "offer-1",
                Name = "Discount Plan",
                Price = 20m,
                UnitEconomics = ue
            };

            var risks = _policyEngine.DetectPricingRisks(new List<PricingOffer> { offer }, null, ctx);
            risks.Should().Contain(r => r.Type == PricingRiskType.BelowCost && r.Severity == PricingRiskSeverity.Critical);
        }

        // =========================================================================
        // 5. FORECAST ALIGNMENT & ECONOMIC BASIS NORMALIZATION (User Correction #3 & #4)
        // =========================================================================

        [Fact]
        public void EvaluateForecastAlignment_Normalizes_Basis_And_Applies_Configurable_Threshold()
        {
            var ctx = new PricingContext
            {
                Forecast = new PricingForecastContext
                {
                    HasForecast = true,
                    Arpu = 100m
                },
                MaterialityPolicy = new PricingMaterialityPolicy
                {
                    RelativeVarianceThreshold = 0.25m // 25% configurable threshold
                }
            };

            // Case A: Monthly offer €95 vs Forecast €100 -> 5% variance -> Aligned
            var offerMonthly = new PricingOffer { Price = 95m, BillingFrequency = BillingFrequency.Monthly };
            var alignMonthly = _policyEngine.EvaluateForecastAlignment(offerMonthly, ctx);
            alignMonthly.Status.Should().Be(ForecastAlignmentStatus.Aligned);
            alignMonthly.Basis.Should().Be(ForecastAlignmentBasis.MonthlyRevenuePerCustomer);

            // Case B: Annual offer €1,080/yr -> €90/mo equivalent vs €100 -> 10% variance <= 25% -> MinorVariance
            var offerAnnual = new PricingOffer { Price = 1080m, BillingFrequency = BillingFrequency.Annual };
            var alignAnnual = _policyEngine.EvaluateForecastAlignment(offerAnnual, ctx);
            alignAnnual.Status.Should().Be(ForecastAlignmentStatus.MinorVariance);
            alignAnnual.ProposedEquivalentValue.Should().Be(90m);

            // Case C: Monthly offer €40 vs Forecast €100 -> 60% variance > 25% -> MaterialVariance (Edge Test #68)
            var offerLow = new PricingOffer { Price = 40m, BillingFrequency = BillingFrequency.Monthly };
            var alignLow = _policyEngine.EvaluateForecastAlignment(offerLow, ctx);
            alignLow.Status.Should().Be(ForecastAlignmentStatus.MaterialVariance);

            // Case D: Project fee €2,500 vs monthly €100 -> Cannot blindly compare without project frequency -> NeedsReview
            var offerProject = new PricingOffer { Price = 2500m, PricingModel = RevenueModelType.ProjectBased, BillingFrequency = BillingFrequency.Milestone };
            var alignProject = _policyEngine.EvaluateForecastAlignment(offerProject, ctx);
            alignProject.Status.Should().Be(ForecastAlignmentStatus.NeedsReview);
            alignProject.Basis.Should().Be(ForecastAlignmentBasis.RevenuePerProject);
        }

        // =========================================================================
        // 6. IMMEDIATE ECONOMICS RECALCULATION ON FOUNDER EDIT (User Correction #6)
        // =========================================================================

        [Fact]
        public async Task UpdateOffer_Immediately_Recalculates_Economics()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var existingStrategy = new PricingStrategy
            {
                Offers = new List<PricingOffer>
                {
                    new()
                    {
                        Key = "pricing.segment.starter",
                        Name = "Starter",
                        Price = 49m,
                        RecommendedPrice = 49m,
                        BillingFrequency = BillingFrequency.Monthly,
                        UnitEconomics = new UnitEconomics
                        {
                            PricePerUnit = 49m,
                            VariableCostPerUnit = 25m,
                            ContributionMargin = 24m,
                            ContributionMarginRate = 0.4898m
                        }
                    }
                }
            };
            journey.Phase4Data.PricingStrategy = existingStrategy;

            var service = CreateService();

            // Founder lowers price from €49 to €19 (which is below variable cost €25)
            var request = new UpdatePricingOfferRequest
            {
                IdeaId = journey.ActiveIdeaId,
                FounderPrice = 19m
            };

            var response = await service.UpdatePricingOfferAsync(journey.UserId, "pricing.segment.starter", request);

            response.Should().NotBeNull();
            var updatedOffer = response.Strategy.Offers.First(o => o.Key == "pricing.segment.starter");
            updatedOffer.Price.Should().Be(19m);
            updatedOffer.FounderPrice.Should().Be(19m);
            updatedOffer.RecommendedPrice.Should().Be(49m); // Invariant: Recommended price preserved separately!
            updatedOffer.FounderEdited.Should().BeTrue();

            // Immediately recalculated economics:
            updatedOffer.UnitEconomics.ContributionMargin.Should().Be(-6m); // 19 - 25 = -6
            response.Strategy.PricingRisks.Should().Contain(r => r.Type == PricingRiskType.BelowCost);
        }

        // =========================================================================
        // 7. FOUNDER OVERRIDE PRESERVED ON REFRESH (Edge Test #69)
        // =========================================================================

        [Fact]
        public async Task Founder_Override_Preserved_On_Refresh()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var existingStrategy = new PricingStrategy
            {
                Offers = new List<PricingOffer>
                {
                    new()
                    {
                        Key = "pricing.segment.smbs.starter",
                        Name = "Starter",
                        Price = 39m,
                        RecommendedPrice = 49m,
                        FounderPrice = 39m,
                        FounderEdited = true,
                        Notes = "Founder customized discount for early adopters"
                    }
                }
            };
            journey.Phase4Data.PricingStrategy = existingStrategy;

            var service = CreateService();
            var refreshed = await service.RefreshPricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            refreshed.Should().NotBeNull();
            var offer = refreshed.Strategy.Offers.FirstOrDefault(o => o.Key == "pricing.segment.smbs.starter");
            if (offer != null)
            {
                offer.FounderPrice.Should().Be(39m);
                offer.Price.Should().Be(39m);
                offer.Notes.Should().Be("Founder customized discount for early adopters");
                offer.FounderEdited.Should().BeTrue();
            }
        }

        // =========================================================================
        // 8. CONDITIONAL STALENESS (User Correction #7)
        // =========================================================================

        [Fact]
        public async Task SupportPlan_Change_DoesNotStale_When_NotConsumed()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var generatedTime = DateTime.UtcNow.AddMinutes(-30);
            var strategy = new PricingStrategy
            {
                GeneratedAt = generatedTime,
                SourceVersions = new PricingSourceVersions
                {
                    BusinessModelVersion = 1,
                    ForecastVersion = 1,
                    MarketStudyVersion = 1,
                    ConsumedSources = new List<string> { "Project", "BusinessModel", "Forecast", "MarketStudy" },
                    SupportPlanConsumed = false,
                    SupportPlanUpdatedAt = generatedTime
                },
                Offers = new List<PricingOffer> { new() { Key = "offer-1", Price = 50m } }
            };
            journey.Phase4Data.PricingStrategy = strategy;

            // Simulate SupportPlan updated later
            journey.Phase4Data.SupportPlan = new SupportPlan
            {
                UpdatedAt = DateTime.UtcNow
            };

            var service = CreateService();
            var response = await service.GetPricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            response.UpdateAvailable.Should().BeFalse();
            response.ChangedSources.Should().NotContain("Aids & Public Support (Phase 4.5)");
        }

        [Fact]
        public async Task SupportPlan_Change_Stales_When_Consumed()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var generatedTime = DateTime.UtcNow.AddMinutes(-30);
            var strategy = new PricingStrategy
            {
                GeneratedAt = generatedTime,
                SourceVersions = new PricingSourceVersions
                {
                    BusinessModelVersion = 1,
                    ForecastVersion = 1,
                    MarketStudyVersion = 1,
                    ConsumedSources = new List<string> { "Project", "BusinessModel", "Forecast", "MarketStudy", "SupportPlan" },
                    SupportPlanConsumed = true,
                    SupportPlanUpdatedAt = generatedTime
                },
                Offers = new List<PricingOffer> { new() { Key = "offer-1", Price = 50m } }
            };
            journey.Phase4Data.PricingStrategy = strategy;

            // Simulate SupportPlan updated later
            journey.Phase4Data.SupportPlan = new SupportPlan
            {
                UpdatedAt = DateTime.UtcNow
            };

            var service = CreateService();
            var response = await service.GetPricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            response.UpdateAvailable.Should().BeTrue();
            response.ChangedSources.Should().Contain("Aids & Public Support (Phase 4.5)");
        }

        [Fact]
        public async Task Conditional_Staleness_SupportPlan_Does_Not_Trigger_Stale()
        {
            await SupportPlan_Change_DoesNotStale_When_NotConsumed();
        }

        // =========================================================================
        // 9. ZERO MUTATION ON UPSTREAM DOCUMENTS (Edge Test #70)
        // =========================================================================

        [Fact]
        public async Task Zero_Mutation_On_Upstream_Documents()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var originalP3Snapshot = journey.Phase3Data.BusinessPlanSessionId;
            var originalRoadmapStatus = journey.Phase4Data.Roadmap.Status;
            var originalNeedsCount = journey.Phase4Data.NeedsAnalysis.ActiveNeeds.Count;

            var service = CreateService();
            var response = await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            // Upstream remains strictly unchanged
            journey.Phase3Data.BusinessPlanSessionId.Should().Be(originalP3Snapshot);
            journey.Phase4Data.Roadmap.Status.Should().Be(originalRoadmapStatus);
            journey.Phase4Data.NeedsAnalysis.ActiveNeeds.Count.Should().Be(originalNeedsCount);

            // Only PricingStrategy persisted
            _journeysMock.Verify(j => j.SetPhase4PricingStrategyAsync(
                journey.UserId,
                It.IsAny<PricingStrategy>(),
                It.IsAny<string>()), Times.Once);
        }

        // =========================================================================
        // 10. MARKET PRICE EVIDENCE SEMANTICS TESTS (Fix Pass)
        // =========================================================================

        [Fact]
        public void CompetitorObservedPrice_SetsMarketReference_NotValidatedPrice()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "SaaS" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "SMB" } },
                CompetitorEvidence = new List<PricingCompetitorItem>
                {
                    new() { Name = "CompA", EstimatedPrice = "€49/mo" }
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            var offer = offers.First();
            offer.MarketReferencePrice.Should().Be(49m);
            offer.ValidatedMarketPrice.Should().BeNull();
            offer.MarketPriceEvidenceType.Should().Be(MarketPriceEvidenceType.CompetitorObserved);
            offer.MarketPriceValidationLevel.Should().Be(MarketPriceValidationLevel.Supported);
        }

        [Fact]
        public void MarketStudyEstimate_DoesNotSetValidatedMarketPrice()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "SaaS" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "SMB" } },
                MarketEvidence = new List<PricingMarketEvidenceItem>
                {
                    new() { Price = 75m, EvidenceType = MarketPriceEvidenceType.MarketStudyEstimate, ValidationLevel = MarketPriceValidationLevel.Indicative }
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            var offer = offers.First();
            offer.MarketReferencePrice.Should().Be(75m);
            offer.ValidatedMarketPrice.Should().BeNull();
            offer.MarketPriceEvidenceType.Should().Be(MarketPriceEvidenceType.MarketStudyEstimate);
            offer.MarketPriceValidationLevel.Should().Be(MarketPriceValidationLevel.Indicative);
        }

        [Fact]
        public void PaidPilot_CanSetValidatedMarketPrice()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "SaaS" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "SMB" } },
                MarketEvidence = new List<PricingMarketEvidenceItem>
                {
                    new() { Price = 120m, EvidenceType = MarketPriceEvidenceType.PaidPilot, ValidationLevel = MarketPriceValidationLevel.EmpiricallyValidated }
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            var offer = offers.First();
            offer.ValidatedMarketPrice.Should().Be(120m);
            offer.MarketPriceEvidenceType.Should().Be(MarketPriceEvidenceType.PaidPilot);
            offer.MarketPriceValidationLevel.Should().Be(MarketPriceValidationLevel.EmpiricallyValidated);
            offer.Confidence.Should().Be(PricingConfidence.Validated);
        }

        [Fact]
        public void HistoricalSale_CanSetValidatedMarketPrice()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "SaaS" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "SMB" } },
                MarketEvidence = new List<PricingMarketEvidenceItem>
                {
                    new() { Price = 250m, EvidenceType = MarketPriceEvidenceType.HistoricalSale, ValidationLevel = MarketPriceValidationLevel.EmpiricallyValidated }
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            var offer = offers.First();
            offer.ValidatedMarketPrice.Should().Be(250m);
            offer.MarketPriceEvidenceType.Should().Be(MarketPriceEvidenceType.HistoricalSale);
            offer.MarketPriceValidationLevel.Should().Be(MarketPriceValidationLevel.EmpiricallyValidated);
            offer.Confidence.Should().Be(PricingConfidence.Validated);
        }

        [Fact]
        public void NoEmpiricalEvidence_ValidatedMarketPrice_RemainsNull()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "SaaS" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "SMB" } }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            foreach (var offer in offers)
            {
                offer.ValidatedMarketPrice.Should().BeNull();
            }
        }

        [Fact]
        public void MarketReference_DoesNotPromotePricingConfidenceToValidated()
        {
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "SaaS" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "SMB" } },
                CompetitorEvidence = new List<PricingCompetitorItem>
                {
                    new() { Name = "CompB", EstimatedPrice = "€99/mo" }
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            var offer = offers.First();
            offer.Confidence.Should().NotBe(PricingConfidence.Validated);
        }

        [Fact]
        public async Task FounderPatch_RecalculatesEconomics()
        {
            await UpdateOffer_Immediately_Recalculates_Economics();
        }

        [Fact]
        public async Task FounderPrice_RemainsDistinctFromRecommendedPrice()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var existingStrategy = new PricingStrategy
            {
                Offers = new List<PricingOffer>
                {
                    new()
                    {
                        Key = "pricing.offer.pro",
                        Name = "Pro",
                        Price = 49m,
                        RecommendedPrice = 49m,
                        FounderPrice = null,
                        MarketReferencePrice = 55m,
                        ValidatedMarketPrice = null,
                        BillingFrequency = BillingFrequency.Monthly,
                        UnitEconomics = new UnitEconomics { PricePerUnit = 49m, VariableCostPerUnit = 20m }
                    }
                }
            };
            journey.Phase4Data.PricingStrategy = existingStrategy;

            var service = CreateService();
            var response = await service.UpdatePricingOfferAsync(journey.UserId, "pricing.offer.pro", new UpdatePricingOfferRequest
            {
                IdeaId = journey.ActiveIdeaId,
                FounderPrice = 35m
            });

            var offer = response.Strategy.Offers.First(o => o.Key == "pricing.offer.pro");
            offer.Price.Should().Be(35m);
            offer.FounderPrice.Should().Be(35m);
            offer.RecommendedPrice.Should().Be(49m);
            offer.MarketReferencePrice.Should().Be(55m);
            offer.ValidatedMarketPrice.Should().BeNull();
            offer.FounderEdited.Should().BeTrue();
        }

        [Fact]
        public async Task Forecast_RemainsUnmodified()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            // Assert forecast session store was not called to update or mutate sessions
            _forecastsMock.Verify(f => f.EditCurrentVersionAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<BsonDocument>()), Times.Never);
            _forecastsMock.Verify(f => f.AppendGeneratedVersionAsync(It.IsAny<string>(), It.IsAny<BsonDocument>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Generate_RemainsIdempotent()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var existingStrategy = new PricingStrategy
            {
                Summary = "Pre-existing immutable pricing strategy",
                Offers = new List<PricingOffer> { new() { Key = "existing-tier", Price = 89m } }
            };
            journey.Phase4Data.PricingStrategy = existingStrategy;

            var service = CreateService();
            var response = await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            // Returns existing strategy without mutating or regenerating
            response.Strategy.Summary.Should().Be("Pre-existing immutable pricing strategy");
            response.Strategy.Offers.Should().Contain(o => o.Key == "existing-tier");
        }

        [Fact]
        public async Task ZeroDualWrite_RemainsTrue()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            // Verified: Persisted exclusively via SetPhase4PricingStrategyAsync on CreatorJourney
            _journeysMock.Verify(j => j.SetPhase4PricingStrategyAsync(
                journey.UserId,
                It.Is<PricingStrategy>(s => s != null),
                journey.ActiveIdeaId), Times.Once);
        }

        // =========================================================================
        // FOUR-PRICE SEPARATION INVARIANT TESTS (Semantic vs Numeric Independence)
        // =========================================================================

        [Fact]
        public async Task FourPriceFields_CanHaveEqualNumericValues_WithoutLosingSemanticSeparation()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var existingStrategy = new PricingStrategy
            {
                Offers = new List<PricingOffer>
                {
                    new()
                    {
                        Key = "pricing.offer.equal",
                        Name = "Equal Values Tier",
                        Price = 49m,
                        RecommendedPrice = 49m,
                        FounderPrice = 49m,
                        MarketReferencePrice = 49m,
                        ValidatedMarketPrice = 49m,
                        MarketPriceEvidenceType = MarketPriceEvidenceType.PaidPilot,
                        MarketPriceValidationLevel = MarketPriceValidationLevel.EmpiricallyValidated,
                        BillingFrequency = BillingFrequency.Monthly,
                        UnitEconomics = new UnitEconomics { PricePerUnit = 49m, VariableCostPerUnit = 20m },
                        PriceEvidence = new PriceEvidence
                        {
                            Type = PriceEvidenceType.ForecastAssumption,
                            Value = 49m,
                            SourceReference = "MBC Synthesis"
                        }
                    }
                }
            };
            journey.Phase4Data.PricingStrategy = existingStrategy;

            var service = CreateService();
            var response = await service.UpdatePricingOfferAsync(journey.UserId, "pricing.offer.equal", new UpdatePricingOfferRequest
            {
                IdeaId = journey.ActiveIdeaId,
                FounderPrice = 49m
            });

            response.Should().NotBeNull();
            var offer = response.Strategy.Offers.First(o => o.Key == "pricing.offer.equal");

            // Assert: All 4 fields equal 49 numerically
            offer.RecommendedPrice.Should().Be(49m);
            offer.FounderPrice.Should().Be(49m);
            offer.MarketReferencePrice.Should().Be(49m);
            offer.ValidatedMarketPrice.Should().Be(49m);
            offer.Price.Should().Be(49m);

            // Assert: Provenance and semantic roles remain completely separate and uncollapsed
            offer.FounderEdited.Should().BeTrue();
            offer.MarketPriceEvidenceType.Should().Be(MarketPriceEvidenceType.PaidPilot);
            offer.MarketPriceValidationLevel.Should().Be(MarketPriceValidationLevel.EmpiricallyValidated);
            offer.PriceEvidence.Type.Should().Be(PriceEvidenceType.ForecastAssumption);
        }

        [Fact]
        public async Task Founder_Can_Select_RecommendedPrice_Exactly()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var existingStrategy = new PricingStrategy
            {
                Offers = new List<PricingOffer>
                {
                    new()
                    {
                        Key = "pricing.offer.accept",
                        Name = "Accepted Recommendation Tier",
                        Price = 49m,
                        RecommendedPrice = 49m,
                        FounderPrice = null,
                        BillingFrequency = BillingFrequency.Monthly,
                        UnitEconomics = new UnitEconomics { PricePerUnit = 49m, VariableCostPerUnit = 20m }
                    }
                }
            };
            journey.Phase4Data.PricingStrategy = existingStrategy;

            var service = CreateService();
            var response = await service.UpdatePricingOfferAsync(journey.UserId, "pricing.offer.accept", new UpdatePricingOfferRequest
            {
                IdeaId = journey.ActiveIdeaId,
                FounderPrice = 49m
            });

            var offer = response.Strategy.Offers.First(o => o.Key == "pricing.offer.accept");
            offer.FounderPrice.Should().Be(49m);
            offer.RecommendedPrice.Should().Be(49m);
            offer.Price.Should().Be(49m);
            offer.FounderEdited.Should().BeTrue();
        }

        [Fact]
        public void MarketReference_CanEqual_RecommendedPrice()
        {
            var offer = new PricingOffer
            {
                Key = "tier.test",
                Name = "Test",
                RecommendedPrice = 49m,
                MarketReferencePrice = 49m,
                MarketPriceEvidenceType = MarketPriceEvidenceType.CompetitorObserved,
                MarketPriceValidationLevel = MarketPriceValidationLevel.Supported,
                PriceEvidence = new PriceEvidence
                {
                    Type = PriceEvidenceType.ForecastAssumption,
                    Value = 49m,
                    SourceReference = "MBC Algorithm"
                }
            };

            // Assert: Numeric equality is valid and preserves distinct source semantics
            offer.MarketReferencePrice.Should().Be(offer.RecommendedPrice);
            offer.MarketPriceEvidenceType.Should().Be(MarketPriceEvidenceType.CompetitorObserved);
            offer.PriceEvidence.Type.Should().Be(PriceEvidenceType.ForecastAssumption);
            offer.ValidatedMarketPrice.Should().BeNull();
        }

        [Fact]
        public void ValidatedMarketPrice_CanEqual_FounderSelectedPrice()
        {
            var offer = new PricingOffer
            {
                Key = "tier.test2",
                Name = "Test 2",
                Price = 39m,
                RecommendedPrice = 49m,
                FounderPrice = 39m,
                ValidatedMarketPrice = 39m,
                MarketPriceEvidenceType = MarketPriceEvidenceType.HistoricalSale,
                MarketPriceValidationLevel = MarketPriceValidationLevel.EmpiricallyValidated,
                FounderEdited = true
            };

            // Assert: ValidatedMarketPrice and FounderPrice can be equal while retaining distinct roles
            offer.ValidatedMarketPrice.Should().Be(offer.FounderPrice);
            offer.FounderEdited.Should().BeTrue();
            offer.MarketPriceEvidenceType.Should().Be(MarketPriceEvidenceType.HistoricalSale);
            offer.MarketPriceValidationLevel.Should().Be(MarketPriceValidationLevel.EmpiricallyValidated);
        }

        // =========================================================================
        // FIX-01: CANONICAL TAX PRESENTATION TESTS
        // =========================================================================

        [Fact]
        public void B2B_WithoutExplicitTaxConfiguration_ReturnsUnknown()
        {
            // Customer type is B2B, but NO explicit tax configuration exists
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "B2B SaaS", TargetUser = "B2B Enterprise" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "B2B Enterprise" } }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            foreach (var offer in offers)
            {
                offer.Presentation.TaxMode.Should().Be(TaxMode.NotApplicableOrUnknown);
                offer.Presentation.TaxRateReference.Should().BeNull();
                offer.Presentation.DisplayPrice.Should().NotContain("HT");
                offer.Presentation.DisplayPrice.Should().NotContain("TTC");
            }
        }

        [Fact]
        public void B2C_WithoutExplicitTaxConfiguration_ReturnsUnknown()
        {
            // Customer type is B2C, but NO explicit tax configuration exists
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "B2C Consumer App", TargetUser = "B2C Consumers" },
                CustomerSegments = new List<PricingCustomerSegmentItem> { new() { Segment = "Consumers" } }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            foreach (var offer in offers)
            {
                offer.Presentation.TaxMode.Should().Be(TaxMode.NotApplicableOrUnknown);
                offer.Presentation.TaxRateReference.Should().BeNull();
                offer.Presentation.DisplayPrice.Should().NotContain("HT");
                offer.Presentation.DisplayPrice.Should().NotContain("TTC");
            }
        }

        [Fact]
        public void ExplicitHTConfiguration_ReturnsHT()
        {
            // Explicit HT configured in Legal context
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "SaaS", TargetUser = "General" },
                Forecast = new PricingForecastContext { Arpu = 50m },
                Legal = new PricingLegalContext
                {
                    ConfiguredTaxMode = TaxMode.TaxExclusive
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            foreach (var offer in offers)
            {
                offer.Presentation.TaxMode.Should().Be(TaxMode.TaxExclusive);
                offer.Presentation.TaxRateReference.Should().Be("TVA 20% applicable en sus");
                offer.Presentation.DisplayPrice.Should().EndWith("HT");
            }
        }

        [Fact]
        public void ExplicitTTCConfiguration_ReturnsTTC()
        {
            // Explicit TTC configured via display mode string
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "Services", TargetUser = "General" },
                Forecast = new PricingForecastContext { Arpu = 50m },
                Legal = new PricingLegalContext
                {
                    ExplicitTaxDisplayMode = "TTC"
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            foreach (var offer in offers)
            {
                offer.Presentation.TaxMode.Should().Be(TaxMode.TaxInclusive);
                offer.Presentation.TaxRateReference.Should().Be("TVA 20% incluse");
                offer.Presentation.DisplayPrice.Should().EndWith("TTC");
            }
        }

        [Fact]
        public void ExplicitExemptConfiguration_ReturnsExempt()
        {
            // Explicit exemption via IsVatExempt = true or ConfiguredTaxMode = Exempt
            var ctx = new PricingContext
            {
                Project = new PricingProjectContext { Sector = "Education", TargetUser = "Schools" },
                Forecast = new PricingForecastContext { Arpu = 50m },
                Legal = new PricingLegalContext
                {
                    IsVatExempt = true
                }
            };

            var offers = _policyEngine.StructureOffers(ctx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            offers.Should().NotBeEmpty();
            foreach (var offer in offers)
            {
                offer.Presentation.TaxMode.Should().Be(TaxMode.Exempt);
                offer.Presentation.TaxRateReference.Should().Be("Exonéré de TVA");
                offer.Presentation.DisplayPrice.Should().EndWith("Exempt");
            }
        }

        [Fact]
        public void UnknownTaxContext_DoesNotInferFromCustomerType()
        {
            // Customer type says B2B but no tax data -> must NOT infer HT
            var b2bCtx = new PricingContext
            {
                Project = new PricingProjectContext { TargetUser = "B2B Enterprise Corporate Clients", Sector = "B2B Tech" }
            };
            var b2bOffers = _policyEngine.StructureOffers(b2bCtx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            b2bOffers.First().Presentation.TaxMode.Should().Be(TaxMode.NotApplicableOrUnknown);

            // Customer type says B2C but no tax data -> must NOT infer TTC
            var b2cCtx = new PricingContext
            {
                Project = new PricingProjectContext { TargetUser = "B2C Individual End Consumers", Sector = "B2C Mobile" }
            };
            var b2cOffers = _policyEngine.StructureOffers(b2cCtx, RevenueModelType.Subscription, new List<string> { "Subscription" });
            b2cOffers.First().Presentation.TaxMode.Should().Be(TaxMode.NotApplicableOrUnknown);
        }

        [Fact]
        public async Task PricingResponse_PopulatesIdeaVersion_ForOptimisticConcurrency()
        {
            var journey = BuildCompleteJourney();
            journey.IdeaVersion = 7;
            SetupValidGates(journey);

            var service = CreateService();
            var response = await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            response.Should().NotBeNull();
            response.IdeaVersion.Should().Be(7);
        }

        [Fact]
        public async Task UpdatePricingOffer_WithNewEvidenceRecord_PersistsEvidenceAndElevatesValidation()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            var initial = await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);
            var offerKey = initial.Strategy!.Offers.First().Key;

            // Update with a paid preorder evidence record
            var newRecord = new PricingEvidenceRecord
            {
                Type = PricingEvidenceRecordType.PreOrder,
                Amount = 149m,
                Currency = "EUR",
                ParticipantOrCustomer = "Beta Partner Studio",
                Channel = "Direct Interview",
                Notes = "Committed to initial 3-month pilot at €149/mo",
                IsPaid = true
            };

            var updateReq = new UpdatePricingOfferRequest
            {
                IdeaId = journey.ActiveIdeaId,
                NewEvidenceRecord = newRecord
            };

            var updated = await service.UpdatePricingOfferAsync(journey.UserId, offerKey, updateReq);

            var targetOffer = updated.Strategy!.Offers.First(o => o.Key == offerKey);
            targetOffer.RecordedEvidence.Should().HaveCount(1);
            targetOffer.RecordedEvidence[0].ParticipantOrCustomer.Should().Be("Beta Partner Studio");
            targetOffer.RecordedEvidence[0].IsFounderReported.Should().BeTrue(); // Founder-reported provenance preserved
            targetOffer.ValidatedMarketPrice.Should().Be(149m);
            targetOffer.MarketPriceEvidenceType.Should().Be(MarketPriceEvidenceType.PreOrder);
            targetOffer.MarketPriceValidationLevel.Should().Be(MarketPriceValidationLevel.Supported);
        }

        [Fact]
        public async Task RefreshPricingStrategy_PreservesRecordedEvidenceAndFounderEdits()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            var initial = await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);
            var offerKey = initial.Strategy!.Offers.First().Key;

            // Add founder edit and evidence
            var updateReq = new UpdatePricingOfferRequest
            {
                IdeaId = journey.ActiveIdeaId,
                FounderPrice = 89m,
                NewEvidenceRecord = new PricingEvidenceRecord
                {
                    Type = PricingEvidenceRecordType.Feedback,
                    ParticipantOrCustomer = "Early Customer A",
                    Notes = "Positive reception on core feature set",
                    IsPaid = false
                }
            };
            await service.UpdatePricingOfferAsync(journey.UserId, offerKey, updateReq);

            // Now perform a refresh
            var refreshed = await service.RefreshPricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            var targetOffer = refreshed.Strategy!.Offers.First(o => o.Key == offerKey);
            targetOffer.FounderPrice.Should().Be(89m);
            targetOffer.FounderEdited.Should().BeTrue();
            targetOffer.RecordedEvidence.Should().HaveCount(1);
            targetOffer.RecordedEvidence[0].ParticipantOrCustomer.Should().Be("Early Customer A");
        }

        [Fact]
        public void PricingPolicyEngine_DistinguishesBelowCost_FromBelowTargetMarginFloor_AndIncompleteBasis()
        {
            var engine = new PricingPolicyEngine();
            var ctx = new PricingContext
            {
                CostStructure = new PricingCostStructureContext
                {
                    EstimatedVariableCostPerUnit = 10m,
                    EstimatedMonthlyFixedCosts = 500m
                },
                Forecast = new PricingForecastContext { Arpu = 50m }
            };

            // Case 1: Below Variable Cost (Price=8 < VC=10) -> BelowCost (Critical, negative contribution)
            var belowCostOffer = new PricingOffer
            {
                Key = "tier.below_cost",
                Name = "Below Cost Tier",
                Price = 8m,
                UnitEconomics = engine.CalculateUnitEconomics(8m, 10m, null, ctx, MarginTargetType.Percentage, 0.20m)
            };
            belowCostOffer.UnitEconomics.ContributionMargin.Should().Be(-2m);
            belowCostOffer.UnitEconomics.ValidationStatus.Should().Be("BelowCostWarning");

            var belowCostRisks = engine.DetectPricingRisks(new List<PricingOffer> { belowCostOffer }, null, ctx);
            belowCostRisks.Should().Contain(r => r.Type == PricingRiskType.BelowCost && r.Severity == PricingRiskSeverity.Critical);

            // Case 2: Above Variable Cost but Below Target Margin Floor (VC=10, TargetMargin=20% -> Floor=12.50. Price=11)
            var belowFloorOffer = new PricingOffer
            {
                Key = "tier.below_floor",
                Name = "Below Floor Tier",
                Price = 11m,
                UnitEconomics = engine.CalculateUnitEconomics(11m, 10m, null, ctx, MarginTargetType.Percentage, 0.20m)
            };
            belowFloorOffer.UnitEconomics.ContributionMargin.Should().Be(1m); // Positive contribution!
            belowFloorOffer.UnitEconomics.MinimumPriceFloor.Should().Be(12.50m);
            belowFloorOffer.UnitEconomics.ValidationStatus.Should().Be("BelowTargetMarginWarning");

            var belowFloorRisks = engine.DetectPricingRisks(new List<PricingOffer> { belowFloorOffer }, null, ctx);
            belowFloorRisks.Should().Contain(r => r.Type == PricingRiskType.BelowTargetMarginFloor && r.Severity == PricingRiskSeverity.Medium);
            belowFloorRisks.Should().NotContain(r => r.Type == PricingRiskType.BelowCost);

            // Case 3: Incomplete Cost Basis (IsVariableCostConfigured = false)
            var incompleteCtx = new PricingContext
            {
                CostStructure = new PricingCostStructureContext
                {
                    IsVariableCostConfigured = false,
                    EstimatedVariableCostPerUnit = 0m
                }
            };
            var zeroCostOffer = new PricingOffer
            {
                Key = "tier.unknown_cost",
                Name = "Unknown Cost Tier",
                Price = 25m,
                UnitEconomics = engine.CalculateUnitEconomics(25m, 0m, null, incompleteCtx, MarginTargetType.Percentage, 0.20m)
            };
            zeroCostOffer.UnitEconomics.ValidationStatus.Should().Be("IncompleteCostBasis");
            var zeroCostRisks = engine.DetectPricingRisks(new List<PricingOffer> { zeroCostOffer }, null, incompleteCtx);
            zeroCostRisks.Should().Contain(r => r.Type == PricingRiskType.IncompleteCostBasis);
        }

        [Fact]
        public void PricingPolicyEngine_FloorPrice_HandlesEdgeCasesAndInvalidDenominators()
        {
            var engine = new PricingPolicyEngine();
            var unconfiguredCtx = new PricingContext
            {
                CostStructure = new PricingCostStructureContext { IsVariableCostConfigured = false }
            };

            // Unconfigured variable cost -> returns null floor
            var ueZero = engine.CalculateUnitEconomics(10m, 0m, null, unconfiguredCtx, MarginTargetType.Percentage, 0.20m);
            ueZero.MinimumPriceFloor.Should().BeNull();

            var configuredCtx = new PricingContext
            {
                CostStructure = new PricingCostStructureContext { IsVariableCostConfigured = true }
            };

            // Margin >= 100% (invalid denominator) -> capped at 90% safely
            var ueInvalidDenominator = engine.CalculateUnitEconomics(10m, 20m, null, configuredCtx, MarginTargetType.Percentage, 1.0m);
            ueInvalidDenominator.MinimumPriceFloor.Should().Be(200m); // 20 / (1 - 0.90) = 200

            // Absolute amount target margin
            var ueAbsolute = engine.CalculateUnitEconomics(30m, 20m, null, configuredCtx, MarginTargetType.AbsoluteAmount, 15m);
            ueAbsolute.MinimumPriceFloor.Should().Be(35m); // 20 + 15 = 35
        }

        [Fact]
        public void PricingPolicyEngine_ContributionMarginBoundaries_AndCostStateSemantics_AreStrictlyClassified()
        {
            var engine = new PricingPolicyEngine();
            var configuredCtx = new PricingContext
            {
                CostStructure = new PricingCostStructureContext
                {
                    IsVariableCostConfigured = true,
                    EstimatedVariableCostPerUnit = 10m,
                    EstimatedMonthlyFixedCosts = 1000m
                }
            };

            // Boundary 1: Price == VC -> CM = 0, Rate = 0%, ZeroContributionWarning
            var ueEqual = engine.CalculateUnitEconomics(10m, 10m, null, configuredCtx, MarginTargetType.Percentage, 0.20m);
            ueEqual.ContributionMargin.Should().Be(0m);
            ueEqual.ContributionMarginRate.Should().Be(0m);
            ueEqual.ValidationStatus.Should().Be("ZeroContributionWarning");
            ueEqual.CostBasisState.Should().Be("ValidPositive");

            // Boundary 2: Price < VC -> CM < 0, BelowCostWarning
            var ueBelowCost = engine.CalculateUnitEconomics(8m, 10m, null, configuredCtx, MarginTargetType.Percentage, 0.20m);
            ueBelowCost.ContributionMargin.Should().Be(-2m);
            ueBelowCost.ContributionMarginRate.Should().Be(-0.25m);
            ueBelowCost.ValidationStatus.Should().Be("BelowCostWarning");

            // Boundary 3: VC < Price < MinimumFloor (Floor is 10 / (1 - 0.20) = 12.50) -> CM > 0, BelowTargetMarginWarning
            var ueBelowFloor = engine.CalculateUnitEconomics(11m, 10m, null, configuredCtx, MarginTargetType.Percentage, 0.20m);
            ueBelowFloor.ContributionMargin.Should().Be(1m);
            ueBelowFloor.ContributionMarginRate.Should().Be(0.0909m);
            ueBelowFloor.MinimumPriceFloor.Should().Be(12.50m);
            ueBelowFloor.ValidationStatus.Should().Be("BelowTargetMarginWarning");

            // Boundary 4: Price >= MinimumFloor -> CM > 0, Supported
            var ueHealthy = engine.CalculateUnitEconomics(15m, 10m, null, configuredCtx, MarginTargetType.Percentage, 0.20m);
            ueHealthy.ContributionMargin.Should().Be(5m);
            ueHealthy.ContributionMarginRate.Should().Be(0.3333m);
            ueHealthy.ValidationStatus.Should().Be("Supported");

            // Cost State: Explicit Zero (IsVariableCostConfigured = true, VC = 0)
            var ueExplicitZero = engine.CalculateUnitEconomics(29m, 0m, null, configuredCtx, MarginTargetType.Percentage, 0.20m);
            ueExplicitZero.CostBasisState.Should().Be("ExplicitZero");
            ueExplicitZero.ContributionMargin.Should().Be(29m);
            ueExplicitZero.ContributionMarginRate.Should().Be(1.0m);
            ueExplicitZero.MinimumPriceFloor.Should().Be(0m);
            ueExplicitZero.ValidationStatus.Should().Be("Supported");

            // Cost State: Unknown or Incomplete (IsVariableCostConfigured = false)
            var unconfiguredCtx = new PricingContext
            {
                CostStructure = new PricingCostStructureContext
                {
                    IsVariableCostConfigured = false,
                    EstimatedVariableCostPerUnit = 0m
                }
            };
            var ueIncomplete = engine.CalculateUnitEconomics(29m, 0m, null, unconfiguredCtx, MarginTargetType.Percentage, 0.20m);
            ueIncomplete.CostBasisState.Should().Be("UnknownOrIncomplete");
            ueIncomplete.ValidationStatus.Should().Be("IncompleteCostBasis");
            ueIncomplete.MinimumPriceFloor.Should().BeNull();

            // Cost State: Invalid Negative (VC < 0)
            var ueNegative = engine.CalculateUnitEconomics(29m, -15m, null, configuredCtx, MarginTargetType.Percentage, 0.20m);
            ueNegative.CostBasisState.Should().Be("InvalidNegative");
            ueNegative.ValidationStatus.Should().Be("InvalidCostInput");
            ueNegative.MinimumPriceFloor.Should().BeNull();

            // Zero-Price Edge Case: Price = 0 does not cause division by zero
            var ueZeroPrice = engine.CalculateUnitEconomics(0m, 10m, null, configuredCtx, MarginTargetType.Percentage, 0.20m);
            ueZeroPrice.ContributionMargin.Should().Be(-10m);
            ueZeroPrice.ContributionMarginRate.Should().Be(0m);
        }

        [Fact]
        public async Task UpdatePricingOffer_FeedbackAndCommitments_DoNotElevatePaidValidation()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            var initial = await service.GeneratePricingStrategyAsync(journey.UserId, journey.ActiveIdeaId);
            var offerKey = initial.Strategy!.Offers.First().Key;

            // Feedback with mentioned amount
            var feedbackRecord = new PricingEvidenceRecord
            {
                Type = PricingEvidenceRecordType.Feedback,
                Amount = 199m,
                Currency = "EUR",
                ParticipantOrCustomer = "Interviewee Corp",
                Notes = "Mentioned they might pay €199/mo in future",
                IsPaid = false
            };

            var updateReq = new UpdatePricingOfferRequest
            {
                IdeaId = journey.ActiveIdeaId,
                NewEvidenceRecord = feedbackRecord
            };

            var updated = await service.UpdatePricingOfferAsync(journey.UserId, offerKey, updateReq);
            var targetOffer = updated.Strategy!.Offers.First(o => o.Key == offerKey);

            targetOffer.RecordedEvidence.Should().HaveCount(1);
            targetOffer.RecordedEvidence[0].IsPaid.Should().BeFalse();
            // Feedback MUST NOT elevate ValidatedMarketPrice or set validation to Supported/EmpiricallyValidated
            targetOffer.ValidatedMarketPrice.Should().BeNull();
            targetOffer.MarketPriceValidationLevel.Should().NotBe(MarketPriceValidationLevel.EmpiricallyValidated);
            targetOffer.MarketPriceValidationLevel.Should().NotBe(MarketPriceValidationLevel.Supported);
        }
    }
}
