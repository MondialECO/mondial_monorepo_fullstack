using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
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
    public class CreatorPhase4GtmTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<IConstructionSnapshotService> _snapshotServiceMock = new();
        private readonly Mock<IOperationalRoadmapService> _roadmapServiceMock = new();
        private readonly Mock<INeedsAnalysisService> _needsServiceMock = new();
        private readonly Mock<ISkillsResolutionService> _skillsServiceMock = new();
        private readonly Mock<ISupportPlanService> _supportServiceMock = new();
        private readonly Mock<IPricingStrategyService> _pricingServiceMock = new();
        private readonly Mock<IProfessionalProfileStore> _profStoreMock = new();
        private readonly Mock<IProfileCompletenessResolver> _completenessResolverMock = new();
        private readonly Mock<IMarketStudySessionStore> _marketStudiesMock = new();
        private readonly Mock<IBusinessModelSessionStore> _businessModelsMock = new();
        private readonly Mock<IForecastSessionStore> _forecastsMock = new();
        private readonly Mock<IBusinessPlanSessionStore> _businessPlansMock = new();
        private readonly Mock<ILogger<GtmStrategyService>> _loggerMock = new();

        private readonly IFounderCapacityResolver _capacityResolver = new FounderCapacityResolver();
        private readonly IGtmPolicyEngine _policyEngine;

        public CreatorPhase4GtmTests()
        {
            _policyEngine = new GtmPolicyEngine(_capacityResolver);
        }

        private GtmStrategyService CreateService()
        {
            return new GtmStrategyService(
                _journeysMock.Object,
                _snapshotServiceMock.Object,
                _roadmapServiceMock.Object,
                _needsServiceMock.Object,
                _skillsServiceMock.Object,
                _supportServiceMock.Object,
                _pricingServiceMock.Object,
                _policyEngine,
                _capacityResolver,
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
            var pricingOffer = new PricingOffer
            {
                Key = "pricing.starter",
                Name = "Starter Plan",
                CustomerSegment = "B2B SMBs",
                PricingModel = RevenueModelType.Subscription,
                BillingFrequency = BillingFrequency.Monthly,
                Price = 99m,
                RecommendedPrice = 99m,
                FounderPrice = null,
                Currency = "EUR"
            };

            var pricingStrategy = new PricingStrategy
            {
                Status = PricingStatus.Generated,
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                PrimaryRevenueModel = RevenueModelType.Subscription,
                RevenueModels = new List<string> { "Subscription" },
                CustomerSegments = new List<string> { "B2B SMBs" },
                Offers = new List<PricingOffer> { pricingOffer },
                LaunchRecommendation = new LaunchPricingRecommendation
                {
                    Confidence = PricingConfidence.Supported
                }
            };

            return new CreatorJourney
            {
                UserId = userId,
                ActiveIdeaId = ideaId,
                Project = new CreatorJourneyProject
                {
                    Name = "SaaS Analytics Hub",
                    Sector = "Software B2B",
                    Problem = "Complex business metrics tracking",
                    Solution = "Automated metrics dashboard",
                    TargetUser = "B2B SMBs",
                    Category = "B2B Software",
                    Geography = "France"
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
                    Roadmap = new OperationalRoadmap { Status = "Active", GeneratedAt = DateTime.UtcNow, Tasks = new List<RoadmapTask> { new() { Key = "task-phase4-prep", Title = "Initial Prep" } } },
                    NeedsAnalysis = new NeedsAnalysis { Status = "Active", GeneratedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    SkillsPlan = new SkillsPlan { Status = "Active", GeneratedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                    PricingStrategy = pricingStrategy
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
                .ReturnsAsync(new ProfessionalProfileRecord
                {
                    UserId = journey.UserId,
                    VentureContext = new ProfileVentureContext
                    {
                        WeeklyAvailability = "10–20 hours/week"
                    }
                });

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

            _pricingServiceMock.Setup(p => p.GetPricingStrategyAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new PricingStrategyResponse { Strategy = journey.Phase4Data.PricingStrategy, UpdateAvailable = false });

            // SupportPlan is optional
            _supportServiceMock.Setup(s => s.GetSupportPlanAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new SupportPlanResponse { SupportPlan = null, UpdateAvailable = false });

            _journeysMock.Setup(j => j.SetPhase4GtmStrategyAsync(journey.UserId, It.IsAny<GtmStrategy>(), journey.ActiveIdeaId))
                .Callback<string, GtmStrategy, string?>((u, s, i) => journey.Phase4Data.GtmStrategy = s)
                .ReturnsAsync(journey);
        }

        // =========================================================================
        // GATE TESTS
        // =========================================================================

        [Fact]
        public async Task Gate_Fails_Without_PricingStrategy()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data.PricingStrategy = null;
            SetupValidGates(journey);

            _pricingServiceMock.Setup(p => p.GetPricingStrategyAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new PricingStrategyResponse { Strategy = null, UpdateAvailable = false });

            var service = CreateService();
            var act = () => service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*PRICING_MISSING*");
        }

        [Fact]
        public async Task Gate_Blocks_Stale_PricingStrategy()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            _pricingServiceMock.Setup(p => p.GetPricingStrategyAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new PricingStrategyResponse { Strategy = journey.Phase4Data.PricingStrategy, UpdateAvailable = true });

            var service = CreateService();
            var act = () => service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*PRICING_REFRESH_REQUIRED*");
        }

        [Fact]
        public async Task SupportPlan_Missing_DoesNotBlock_Gtm()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data.SupportPlan = null;
            SetupValidGates(journey);

            _supportServiceMock.Setup(s => s.GetSupportPlanAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new SupportPlanResponse { SupportPlan = null, UpdateAvailable = false });

            var service = CreateService();
            var res = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            res.Strategy.Should().NotBeNull();
            res.PrerequisiteGate.CanAccess.Should().BeTrue();
        }

        // =========================================================================
        // SEGMENT & MULTI-SIDED TESTS
        // =========================================================================

        [Fact]
        public async Task PrimarySegment_SelectedDeterministically_FromExisting()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            // Phase 3 Market Study with 2 segments
            var msBson = new BsonDocument
            {
                ["segments"] = new BsonArray
                {
                    new BsonDocument { ["name"] = "SME Operations Leads", ["painPoints"] = "Fragmented metric visibility", ["accessibility"] = "High via LinkedIn" },
                    new BsonDocument { ["name"] = "Enterprise Directors", ["painPoints"] = "Legacy ERP export errors", ["accessibility"] = "Low" }
                }
            };
            var msSession = new MarketStudySession { CurrentVersion = 1 };
            msSession.Versions.Add(new MarketStudyVersion { Version = 1, Content = msBson });
            _marketStudiesMock.Setup(m => m.GetOwnedAsync("ms-1", journey.UserId)).ReturnsAsync(msSession);

            var service = CreateService();
            var res = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            res.Strategy.Should().NotBeNull();
            res.Strategy.PrimaryLaunchSegment.Should().Be("SME Operations Leads");
            res.Strategy.SegmentStrategies.Should().HaveCount(2);
            res.Strategy.SegmentStrategies.First(s => s.SegmentName == "SME Operations Leads").Priority.Should().Be(SegmentPriority.Primary);
            res.Strategy.SegmentStrategies.First(s => s.SegmentName == "Enterprise Directors").Priority.Should().Be(SegmentPriority.Secondary);
        }

        [Fact]
        public void MultiSided_Marketplace_Separates_Supply_And_Demand()
        {
            var context = new GtmContext
            {
                Project = new CreatorJourneyProject
                {
                    Name = "Freelance Artisan Marketplace",
                    Sector = "Digital Marketplace",
                    Solution = "Marketplace connecting certified creators with enterprise buyers",
                    Problem = "Fragmented sourcing"
                },
                TargetSegments = new List<GtmSegmentItem>
                {
                    new() { Name = "Artisan Service Providers", IsSupplySide = true, PainPoints = "Inconsistent client flow" },
                    new() { Name = "Enterprise Clients", IsDemandSide = true, PainPoints = "Quality verification latency" }
                }
            };

            var (primary, strategies) = _policyEngine.PrioritizeSegments(context);

            strategies.Should().HaveCount(2);
            var supply = strategies.First(s => s.SideRole == "SupplySide");
            var demand = strategies.First(s => s.SideRole == "DemandSide");

            supply.Should().NotBeNull();
            demand.Should().NotBeNull();
            supply.SegmentName.Should().Be("Artisan Service Providers");
            demand.SegmentName.Should().Be("Enterprise Clients");
            supply.WhyNow.Should().Contain("liquidity");
        }

        // =========================================================================
        // PRICING LINKAGE & VALIDATION TESTS
        // =========================================================================

        [Fact]
        public async Task PricingStrategy_Offer_Reused_FounderPricePreferred()
        {
            var journey = BuildCompleteJourney();
            // Set FounderPrice
            journey.Phase4Data.PricingStrategy.Offers[0].FounderPrice = 149m;
            SetupValidGates(journey);

            var service = CreateService();
            var res = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            var primarySeg = res.Strategy.SegmentStrategies.First();
            primarySeg.SelectedPrice.Should().Be(149m);
            primarySeg.IsFounderPrice.Should().BeTrue();
        }

        [Fact]
        public async Task RecommendedPrice_UsedOnly_WhenFounderPriceAbsent()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data.PricingStrategy.Offers[0].FounderPrice = null;
            journey.Phase4Data.PricingStrategy.Offers[0].RecommendedPrice = 89m;
            SetupValidGates(journey);

            var service = CreateService();
            var res = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            var primarySeg = res.Strategy.SegmentStrategies.First();
            primarySeg.SelectedPrice.Should().Be(89m);
            primarySeg.IsFounderPrice.Should().BeFalse();
        }

        [Fact]
        public async Task NeedsValidation_Pricing_Creates_ValidationFirst_Gtm()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data.PricingStrategy.LaunchRecommendation.Confidence = PricingConfidence.NeedsValidation;
            SetupValidGates(journey);

            var service = CreateService();
            var res = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            res.Strategy.PricingValidationRequired.Should().BeTrue();
            res.Strategy.PricingValidationNotice.Should().Contain("willingness-to-pay");

            // Primary experiment focuses on pricing/offer validation
            var exp1 = res.Strategy.Experiments.First();
            exp1.Hypothesis.Should().Contain("willingness");

            // Paid acquisition channel is deferred
            var paidChannel = res.Strategy.ChannelStrategy.FirstOrDefault(c => c.Channel == GtmChannelType.PaidSearch);
            paidChannel.Should().NotBeNull();
            paidChannel.Priority.Should().Be(ChannelPriority.Later);
            paidChannel.ReasonCodes.Should().Contain(GtmRecommendationReason.PRICE_NOT_VALIDATED);
        }

        // =========================================================================
        // REFINEMENT 1: SHARED CAPACITY RESOLVER
        // =========================================================================

        [Fact]
        public void UsesSharedFounderCapacityResolver()
        {
            // Verify identical resolution to RoadmapScheduler
            var wa1 = "Less than 5 hours/week";
            var wa2 = "10–20 hours/week";

            _capacityResolver.ResolveCapacityTier(wa1).Should().Be(CapacityTier.VeryLight);
            _capacityResolver.ResolveCapacityTier(wa2).Should().Be(CapacityTier.Standard);

            var roadmapScheduler = new RoadmapScheduler(_capacityResolver);
            roadmapScheduler.ResolveCapacityTier(wa1).Should().Be(CapacityTier.VeryLight);
            roadmapScheduler.ResolveCapacityTier(wa2).Should().Be(CapacityTier.Standard);
        }

        [Fact]
        public void LowCapacity_Constrains_ActiveFounderLedChannels()
        {
            var profile = _capacityResolver.ResolveCapacityProfile("<5 hours/week");
            profile.Tier.Should().Be(CapacityTier.VeryLight);
            profile.MaxActiveFounderLedChannels.Should().Be(1);
            profile.MaxLoadPoints.Should().Be(3);

            var context = new GtmContext
            {
                WeeklyAvailability = "<5 hours/week",
                Project = new CreatorJourneyProject { Sector = "B2B Software", Name = "Test" }
            };

            var seg = new GtmSegmentStrategy { SegmentName = "SMBs" };
            var channels = _policyEngine.EvaluateChannels(context, seg, SalesMotion.FounderLedSales, profile);

            // Active (Now) channels should be constrained
            var nowChannels = channels.Where(c => c.Priority == ChannelPriority.Now).ToList();
            nowChannels.Should().HaveCount(1);
            nowChannels.First().Channel.Should().Be(GtmChannelType.FounderLedSales);
        }

        // =========================================================================
        // REFINEMENT 2: DETERMINISTIC REASON CODES
        // =========================================================================

        [Fact]
        public void ChannelRecommendation_ContainsDeterministicReasonCodes()
        {
            var context = new GtmContext
            {
                WeeklyAvailability = "10–20 hours/week",
                Project = new CreatorJourneyProject { Sector = "B2B Software", Name = "Test" },
                FounderCapabilities = new List<string> { "Enterprise Sales" },
                PricingValidationStatus = PricingConfidence.NeedsValidation
            };

            var seg = new GtmSegmentStrategy { SegmentName = "B2B SMBs" };
            var capacity = _capacityResolver.ResolveCapacityProfile("10–20 hours/week");
            var channels = _policyEngine.EvaluateChannels(context, seg, SalesMotion.FounderLedSales, capacity);

            var founderSales = channels.First(c => c.Channel == GtmChannelType.FounderLedSales);
            founderSales.ReasonCodes.Should().Contain(GtmRecommendationReason.SEGMENT_REACHABLE);
            founderSales.ReasonCodes.Should().Contain(GtmRecommendationReason.FOUNDER_CAPABILITY_MATCH);
            founderSales.ReasonCodes.Should().Contain(GtmRecommendationReason.PRICE_NOT_VALIDATED);
            founderSales.WhyThisChannel.Should().NotBeNullOrWhiteSpace();
            founderSales.WhyNow.Should().NotBeNullOrWhiteSpace();
            founderSales.WhyNotOther.Should().NotBeNullOrWhiteSpace();
        }

        // =========================================================================
        // REFINEMENT 3: EXPERIMENT THRESHOLDS SUPPORT NEEDSBASELINE
        // =========================================================================

        [Fact]
        public void UnknownExperimentBenchmark_UsesNeedsBaseline()
        {
            var context = new GtmContext
            {
                Project = new CreatorJourneyProject { Sector = "B2B Software", Name = "Test" }
            };
            var seg = new GtmSegmentStrategy { SegmentName = "SMBs", SelectedPrice = 99m };
            var channels = new List<GtmChannelStrategy>();
            var budget = new GtmBudgetPlan();

            var experiments = _policyEngine.DesignExperiments(context, seg, channels, budget);

            experiments.Should().NotBeEmpty();
            foreach (var exp in experiments)
            {
                exp.TargetStatus.Should().Be(ExperimentThresholdStatus.NeedsBaseline);
                exp.TargetValue.Should().BeNull(); // No invented target percentage!
            }
        }

        // =========================================================================
        // REFINEMENT 4: BUDGET PROVENANCE SEMANTICS
        // =========================================================================

        [Fact]
        public void ForecastMarketingBudget_IsNotAutomaticallySpendableCash()
        {
            var context = new GtmContext
            {
                Forecast = new GtmForecastContext
                {
                    MarketingBudget = 5000m,
                    HasForecast = true
                }
            };

            var budgetPlan = _policyEngine.FormulateBudgetPlan(context, new List<GtmChannelStrategy>());

            budgetPlan.TotalAvailableBudget.Should().Be(5000m);
            budgetPlan.BudgetSource.Should().Be(GtmBudgetSourceType.ForecastAssumption);
            budgetPlan.SpendableStatus.Should().Be(SpendableStatus.Planned); // Planned, NOT ConfirmedAvailable!
            budgetPlan.ProvenanceExplanation.Should().Contain("Not confirmed available cash in hand");
        }

        [Fact]
        public void PotentialGrant_IsNotSpendableCash()
        {
            var context = new GtmContext
            {
                PotentialGrantBudget = 10000m, // Not yet verified awarded
                ConfirmedGrantBudget = null,
                Forecast = new GtmForecastContext { MarketingBudget = null }
            };

            var budgetPlan = _policyEngine.FormulateBudgetPlan(context, new List<GtmChannelStrategy>());

            budgetPlan.TotalAvailableBudget.Should().BeNull(); // Excluded from spendable budget!
            budgetPlan.BudgetSource.Should().Be(GtmBudgetSourceType.Unknown);
            budgetPlan.SpendableStatus.Should().Be(SpendableStatus.Unknown);
            budgetPlan.ValidationStatus.Should().Be(GtmBudgetStatus.NeedsValidation);
            budgetPlan.ProvenanceExplanation.Should().Contain("excluded from spendable GTM budget");
        }

        [Fact]
        public void NoFakeCac_Generated_ForecastCacTreatedAsAssumption()
        {
            var context = new GtmContext
            {
                Forecast = new GtmForecastContext
                {
                    ForecastCac = 45m
                }
            };

            var budgetPlan = _policyEngine.FormulateBudgetPlan(context, new List<GtmChannelStrategy>());

            budgetPlan.ForecastCacAssumption.Should().Be(45m);
            budgetPlan.ObservedCac.Should().BeNull(); // Zero invented observed CAC!
            budgetPlan.ValidatedCac.Should().BeNull();
        }

        // =========================================================================
        // REFINEMENT 5: MULTI-SIGNAL SALES MOTION
        // =========================================================================

        [Fact]
        public void SalesMotion_DoesNotDependOnRawPriceThresholdAlone()
        {
            var contextB2BHighTrust = new GtmContext
            {
                Project = new CreatorJourneyProject { Sector = "B2B Regulated Compliance", Category = "B2B" }
            };
            // Low price (€150) but regulated B2B with high trust requirement
            var segLowPrice = new GtmSegmentStrategy { SegmentName = "Regulated SME Clinics", SelectedPrice = 150m };
            var (motion1, ctx1) = _policyEngine.DetermineSalesMotion(contextB2BHighTrust, segLowPrice);

            motion1.Should().Be(SalesMotion.FounderLedSales); // NOT SelfServe even though price is low!

            // Higher price (€800) but standard B2C
            var contextB2C = new GtmContext
            {
                Project = new CreatorJourneyProject { Sector = "Consumer Electronics", Category = "B2C" }
            };
            var segHighPriceB2C = new GtmSegmentStrategy { SegmentName = "Audio Enthusiasts", SelectedPrice = 800m };
            var (motion2, ctx2) = _policyEngine.DetermineSalesMotion(contextB2C, segHighPriceB2C);

            motion2.Should().Be(SalesMotion.SelfServe); // SelfServe because B2C instant feasibility
        }

        // =========================================================================
        // REFINEMENT 6: IMMUTABLE HISTORICAL EXPERIMENT RUNS
        // =========================================================================

        [Fact]
        public async Task CompletedExperimentRun_IsPreservedOnRefresh()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            var initialRes = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            var expKey = initialRes.Strategy.Experiments.First().Key;

            // Record a run
            await service.RecordExperimentRunAsync(journey.UserId, expKey, new RecordExperimentRunRequest
            {
                IdeaId = journey.ActiveIdeaId,
                ActualSpend = 120m,
                ActualEffort = "6 hours",
                Observations = "Prospects were intrigued but asked for SOC2 compliance.",
                Outcome = ExperimentRunOutcome.Validated,
                StatusUpdate = "Completed"
            });

            // Now Refresh
            var refreshRes = await service.RefreshGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            var refreshedExp = refreshRes.Strategy.Experiments.First(e => e.Key == expKey);
            refreshedExp.Runs.Should().HaveCount(1);
            refreshedExp.Runs[0].ActualSpend.Should().Be(120m);
            refreshedExp.Runs[0].Observations.Should().Contain("SOC2");
            refreshedExp.Status.Should().Be("Completed");
        }

        // =========================================================================
        // REFINEMENT 7: CONSUMED-SOURCE BASED STALENESS
        // =========================================================================

        [Fact]
        public async Task UnconsumedForecastChange_DoesNotStaleGtm()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var fcSession = new ForecastSession
            {
                CurrentVersion = 1,
                Inputs = new ForecastInputs { Arpu = 100 }
            };
            _forecastsMock.Setup(f => f.GetOwnedAsync("fc-1", journey.UserId)).ReturnsAsync(fcSession);

            var service = CreateService();
            var initial = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            // Simulate forecast version incremented, but ONLY tax inputs changed (consumed marketing budget & ARPU didn't change)
            var fcSessionV2 = new ForecastSession
            {
                CurrentVersion = 2,
                Inputs = new ForecastInputs { Arpu = 100 } // Same ARPU, no marketing budget change
            };
            _forecastsMock.Setup(f => f.GetOwnedAsync("fc-1", journey.UserId)).ReturnsAsync(fcSessionV2);

            var getRes = await service.GetGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);
            getRes.UpdateAvailable.Should().BeFalse(); // Not stale!
        }

        [Fact]
        public async Task ConsumedPricingChange_DoesStaleGtm()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            // Pricing updated
            journey.Phase4Data.PricingStrategy.UpdatedAt = DateTime.UtcNow.AddMinutes(10);
            journey.Phase4Data.PricingStrategy.Offers[0].Price = 199m;

            var getRes = await service.GetGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);
            getRes.UpdateAvailable.Should().BeTrue();
            getRes.ChangedSources.Should().ContainMatch("*Pricing*");
        }

        [Fact]
        public async Task FounderAvailabilityChange_DoesStaleGtm()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            // User changes availability from 10-20h to <5h
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ProfessionalProfileRecord
                {
                    UserId = journey.UserId,
                    VentureContext = new ProfileVentureContext
                    {
                        WeeklyAvailability = "<5 hours/week"
                    }
                });

            var getRes = await service.GetGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);
            getRes.UpdateAvailable.Should().BeTrue();
            getRes.ChangedSources.Should().Contain("Founder Weekly Availability");
        }

        // =========================================================================
        // REFRESH & FOUNDER OVERRIDES
        // =========================================================================

        [Fact]
        public async Task Refresh_Preserves_FounderChannelOverrides()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            var initialRes = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            var chKey = initialRes.Strategy.ChannelStrategy.First().Key;

            // Founder overrides channel
            await service.UpdateGtmChannelAsync(journey.UserId, chKey, new UpdateGtmChannelRequest
            {
                IdeaId = journey.ActiveIdeaId,
                Priority = ChannelPriority.Later,
                FounderNotes = "Delaying direct outreach until legal review completes."
            });

            // Refresh
            var refreshRes = await service.RefreshGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            var refreshedCh = refreshRes.Strategy.ChannelStrategy.First(c => c.Key == chKey);
            refreshedCh.Priority.Should().Be(ChannelPriority.Later);
            refreshedCh.FounderNotes.Should().Contain("legal review");
            refreshedCh.FounderEdited.Should().BeTrue();
        }

        // =========================================================================
        // IDEMPOTENCY & CONTRACT TESTS
        // =========================================================================

        [Fact]
        public async Task Get_IsReadOnly_NeverGenerates()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data.GtmStrategy = null;
            SetupValidGates(journey);

            var service = CreateService();
            var res = await service.GetGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            res.Strategy.Should().BeNull();
            _journeysMock.Verify(j => j.SetPhase4GtmStrategyAsync(It.IsAny<string>(), It.IsAny<GtmStrategy>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Generate_IsIdempotent_ReturnsExisting()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            var first = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);
            var second = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            second.Strategy.GeneratedAt.Should().Be(first.Strategy.GeneratedAt);
        }

        [Fact]
        public async Task MetricDefinitions_RemainStableAcrossStrategy()
        {
            var journey = BuildCompleteJourney();
            SetupValidGates(journey);

            var service = CreateService();
            var res = await service.GenerateGtmStrategyAsync(journey.UserId, journey.ActiveIdeaId);

            res.Strategy.MetricsFramework.Should().NotBeEmpty();
            res.Strategy.MetricsFramework.Should().Contain(m => m.Key == "metric.awareness.reach");
            res.Strategy.MetricsFramework.Should().Contain(m => m.Key == "metric.interest.discovery-calls");
            res.Strategy.MetricsFramework.Should().Contain(m => m.Key == "metric.conversion.paid-contracts");
            res.Strategy.MetricsFramework.Should().Contain(m => m.Key == "metric.economics.observed-cac");
        }
    }
}
