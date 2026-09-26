using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorPhase4LaunchAssetsTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<IPricingStrategyService> _pricingMock = new();
        private readonly Mock<IGtmStrategyService> _gtmMock = new();
        private readonly Mock<IBrandKitStore> _brandKitsMock = new();
        private readonly Mock<ILogger<LaunchAssetsService>> _loggerMock = new();

        private LaunchAssetsService CreateService()
        {
            return new LaunchAssetsService(
                _journeysMock.Object,
                _pricingMock.Object,
                _gtmMock.Object,
                _brandKitsMock.Object,
                _loggerMock.Object);
        }

        [Fact]
        public async Task GetLaunchAssetsAsync_WhenNoAssetsExist_ReturnsNullAssets()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Phase4Data = new CreatorPhase4Data()
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetLaunchAssetsAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res);
            Assert.Equal("idea-abc", res.IdeaId);
            Assert.Null(res.Assets);
            Assert.False(res.UpdateAvailable);
        }

        [Fact]
        public async Task GenerateLaunchAssetsAsync_SynthesizesFromProjectAndBrandKit_WithoutClairDeskDefaults()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject
                {
                    Name = "OmniFlow",
                    Concept = "Unified warehouse logistics for SMBs",
                    Problem = "Inventory count mismatches cause fulfillment delays",
                    Solution = "Real-time barcode scanning and dispatch routing",
                    TargetUser = "Warehouse Operations Managers"
                },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        Offers = new List<PricingOffer>
                        {
                            new()
                            {
                                Id = "offer-1",
                                Name = "Pro Tier",
                                Price = 49,
                                RecommendedPrice = 49,
                                Currency = "EUR",
                                BillingFrequency = BillingFrequency.Monthly,
                                FounderEdited = true
                            }
                        }
                    }
                }
            };

            var brandKit = new BrandKit
            {
                IdeaId = "idea-abc",
                UserId = "user-123",
                Strategy = new BrandStrategy
                {
                    BusinessName = "OmniFlow Logistics",
                    Positioning = new BrandProvenancedText { Value = "The fastest dispatch platform for growing warehouses." },
                    Concept = new BrandProvenancedText { Value = "Warehouse logistics automation." },
                    TargetAudience = new BrandProvenancedText { Value = "Warehouse Managers" }
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _brandKitsMock.Setup(b => b.GetByIdeaIdAsync("idea-abc", "user-123"))
                .ReturnsAsync(brandKit);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GenerateLaunchAssetsAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res.Assets);
            Assert.Equal("OmniFlow Logistics", res.Assets.BrandName);
            Assert.Equal("The fastest dispatch platform for growing warehouses.", res.Assets.Headline);
            Assert.Contains("OmniFlow Logistics is being built for Warehouse Managers", res.Assets.Description);
            Assert.Contains("Inventory count mismatches cause fulfillment delays", res.Assets.ProblemStatement);
            Assert.Equal(49, res.Assets.PricingExclusion.ChosenPrice);
            Assert.Contains("€49", res.Assets.PricingExclusion.Reason);
            Assert.DoesNotContain("ClairDesk", res.Assets.BrandName);
            Assert.DoesNotContain("ClairDesk", res.Assets.Description);
        }

        [Fact]
        public async Task GenerateLaunchAssetsAsync_RespectsGtmFounderOverrides_ForLaunchCustomerGroup()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject { Name = "AcmeTool" },
                Phase4Data = new CreatorPhase4Data
                {
                    GtmStrategy = new GtmStrategy
                    {
                        PrimaryLaunchSegment = "General B2B",
                        FounderOverrides = new Dictionary<string, string>
                        {
                            { "CustomCustomerGroup", "Boutique Shopify Agencies" }
                        }
                    }
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GenerateLaunchAssetsAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res.Assets);
            Assert.Equal("Boutique Shopify Agencies", res.Assets.BrandStudio.TargetAudience);
            Assert.Contains("boutique shopify agencies", res.Assets.ProblemStatement.ToLowerInvariant());
        }

        [Fact]
        public async Task UpdateLaunchAssetsAsync_UpdatesFieldsAndPersists()
        {
            // Arrange
            var existingPlan = new LaunchAssetsPlan
            {
                BrandName = "TestApp",
                Headline = "Old Headline",
                ButtonLabel = "Express interest",
                ButtonDestinationType = "NotSet",
                ButtonDestinationValue = ""
            };
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 2,
                Phase4Data = new CreatorPhase4Data
                {
                    LaunchAssets = existingPlan
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var updateReq = new UpdateLaunchAssetsRequest
            {
                IdeaId = "idea-abc",
                Headline = "New Strategic Headline",
                ButtonDestinationType = "Email",
                ButtonDestinationValue = "founder@testapp.io"
            };
            var res = await service.UpdateLaunchAssetsAsync("user-123", updateReq);

            // Assert
            Assert.NotNull(res.Assets);
            Assert.Equal("New Strategic Headline", res.Assets.Headline);
            Assert.Equal("Email", res.Assets.ButtonDestinationType);
            Assert.Equal("founder@testapp.io", res.Assets.ButtonDestinationValue);
            Assert.True(res.Assets.ButtonDestinationConfigured);
        }

        [Fact]
        public async Task Versioning_CreateAndSelectVersion_WorksCorrectly()
        {
            // Arrange
            var existingPlan = new LaunchAssetsPlan
            {
                Version = 1,
                ReleaseTag = "v1.0-rc",
                Status = "Draft"
            };
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 2,
                Phase4Data = new CreatorPhase4Data
                {
                    LaunchAssets = existingPlan
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act 1: Create New Version
            var resVersion = await service.CreateNewVersionAsync("user-123", "idea-abc");
            Assert.Equal(2, resVersion.Assets!.Version);
            Assert.Equal("v1.2-rc", resVersion.Assets.ReleaseTag);
            Assert.Equal("Draft", resVersion.Assets.Status);

            // Act 2: Select Version
            var resSelect = await service.SelectVersionAsync("user-123", "idea-abc");
            Assert.Equal("Selected", resSelect.Assets!.Status);
        }

        [Fact]
        public async Task GetSourceCodeBundleAsync_GeneratesStandaloneHtml_WithEscapingAndSectionFiltering()
        {
            // Arrange
            var plan = new LaunchAssetsPlan
            {
                BrandName = "Secure<script>App",
                Headline = "Clean & Fast Operations",
                Description = "Built for modern founders.",
                ButtonLabel = "Contact Us",
                ButtonDestinationType = "Email",
                ButtonDestinationValue = "team@secureapp.io",
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "problem", IsIncluded = true },
                    new() { Key = "solution", IsIncluded = false }, // EXCLUDED
                    new() { Key = "how-it-works", IsIncluded = true },
                    new() { Key = "faq", IsIncluded = true },
                    new() { Key = "final-cta", IsIncluded = true },
                    new() { Key = "footer", IsIncluded = true }
                }
            };

            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                Phase4Data = new CreatorPhase4Data { LaunchAssets = plan }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var html = await service.GetSourceCodeBundleAsync("user-123", "idea-abc");

            // Assert
            Assert.Contains("<!DOCTYPE html>", html);
            Assert.Contains("mailto:team@secureapp.io", html);
            Assert.Contains("Secure&lt;script&gt;App", html); // XSS escaped
            Assert.DoesNotContain("<script>App", html);
            Assert.Contains("Clean &amp; Fast Operations", html);
        }

        [Fact]
        public async Task PricingSemantics_MissingPrice_SetsUnconfirmedStatus()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject { Name = "FreeApp" },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        Offers = new List<PricingOffer>() // No offers configured
                    }
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GenerateLaunchAssetsAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res.Assets?.PricingExclusion);
            Assert.Null(res.Assets.PricingExclusion.ChosenPrice);
            Assert.Equal("Unconfirmed", res.Assets.PricingExclusion.PriceStatus);
            Assert.Contains("Pricing has not been confirmed", res.Assets.PricingExclusion.Reason);
        }

        [Fact]
        public async Task PricingSemantics_ExplicitConfirmedZero_SetsConfirmedZeroStatus()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject { Name = "FreeApp" },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        Offers = new List<PricingOffer>
                        {
                            new()
                            {
                                Id = "offer-free",
                                Name = "Community Edition",
                                PricingModel = RevenueModelType.Freemium,
                                FounderPrice = 0m,
                                Price = 0m,
                                FounderEdited = true,
                                BillingFrequency = BillingFrequency.Monthly,
                                Currency = "EUR"
                            }
                        }
                    }
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GenerateLaunchAssetsAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res.Assets?.PricingExclusion);
            Assert.Equal(0m, res.Assets.PricingExclusion.ChosenPrice);
            Assert.Equal("ConfirmedZero", res.Assets.PricingExclusion.PriceStatus);
            Assert.Equal("offer-free", res.Assets.PricingExclusion.SelectedOfferId);
            Assert.Contains("explicitly free", res.Assets.PricingExclusion.Reason);
        }

        [Fact]
        public async Task PricingSemantics_InvalidNegativePrice_SetsInvalidNegativeStatus()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject { Name = "NegApp" },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        Offers = new List<PricingOffer>
                        {
                            new()
                            {
                                Id = "offer-neg",
                                Name = "Buggy Plan",
                                FounderPrice = -25m,
                                Price = -25m,
                                FounderEdited = true
                            }
                        }
                    }
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GenerateLaunchAssetsAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res.Assets?.PricingExclusion);
            Assert.Equal(-25m, res.Assets.PricingExclusion.ChosenPrice);
            Assert.Equal("InvalidNegative", res.Assets.PricingExclusion.PriceStatus);
            Assert.Contains("invalid (cannot be negative)", res.Assets.PricingExclusion.Reason);
        }

        [Fact]
        public async Task PricingSemantics_FounderSelectedFreeOffer_OverridesSystemRecommendedPaidOffer()
        {
            // Arrange
            // Offer A is system-recommended and paid (€49/mo)
            // Offer B is explicitly founder-selected and free (€0/mo)
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject { Name = "DualOfferApp" },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        LaunchRecommendation = new LaunchPricingRecommendation
                        {
                            RecommendedOffers = new List<string> { "offer-a-paid" }
                        },
                        Offers = new List<PricingOffer>
                        {
                            new()
                            {
                                Id = "offer-a-paid",
                                Name = "Pro Tier",
                                Price = 49m,
                                RecommendedPrice = 49m,
                                Currency = "EUR",
                                BillingFrequency = BillingFrequency.Monthly,
                                FounderEdited = false
                            },
                            new()
                            {
                                Id = "offer-b-free",
                                Name = "Community Tier",
                                Price = 0m,
                                FounderPrice = 0m,
                                FounderEdited = true,
                                Currency = "EUR",
                                BillingFrequency = BillingFrequency.Monthly,
                                PricingModel = RevenueModelType.Freemium
                            }
                        }
                    }
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GenerateLaunchAssetsAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res.Assets?.PricingExclusion);
            Assert.Equal("offer-b-free", res.Assets.PricingExclusion.SelectedOfferId);
            Assert.Equal("Community Tier", res.Assets.PricingExclusion.SelectedOfferName);
            Assert.Equal(0m, res.Assets.PricingExclusion.ChosenPrice);
            Assert.Equal("ConfirmedZero", res.Assets.PricingExclusion.PriceStatus);
            Assert.Equal("€", res.Assets.PricingExclusion.Currency);
            Assert.Equal("monthly", res.Assets.PricingExclusion.BillingPeriod);
            Assert.Contains("explicitly free", res.Assets.PricingExclusion.Reason);
        }

        [Fact]
        public async Task PricingSemantics_SystemRecommendation_WithoutFounderConfirmation_ExposesUnconfirmedNeedsReviewState()
        {
            // Arrange: Recommended offer exists, but founder has not confirmed/edited it
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject { Name = "MultiOfferApp" },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        LaunchRecommendation = new LaunchPricingRecommendation
                        {
                            RecommendedOffers = new List<string> { "offer-pro" }
                        },
                        Offers = new List<PricingOffer>
                        {
                            new() { Id = "offer-starter", Name = "Starter", Price = 10, Currency = "EUR", FounderEdited = false },
                            new() { Id = "offer-pro", Name = "Pro Tier", Price = 79, Currency = "EUR", FounderEdited = false },
                            new() { Id = "offer-enterprise", Name = "Enterprise", Price = 299, Currency = "EUR", FounderEdited = false }
                        }
                    }
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GenerateLaunchAssetsAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res.Assets?.PricingExclusion);
            Assert.Null(res.Assets.PricingExclusion.ChosenPrice);
            Assert.Equal("Unconfirmed", res.Assets.PricingExclusion.PriceStatus);
            Assert.Equal("offer-pro", res.Assets.PricingExclusion.SelectedOfferId);
            Assert.Equal("Pro Tier", res.Assets.PricingExclusion.SelectedOfferName);
            Assert.Contains("has not been confirmed by the founder yet", res.Assets.PricingExclusion.Reason);
        }

        [Fact]
        public async Task PricingInclusion_IsIncludedFalse_ExcludedFalse_ConfirmedPositive_PricingAbsent()
        {
            // Arrange: Canonical section says IsIncluded=false, legacy flag stale Excluded=false, price is confirmed positive (€49)
            var plan = new LaunchAssetsPlan
            {
                BrandName = "TestApp",
                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = false, // Stale legacy flag
                    PriceStatus = "ConfirmedPositive",
                    ChosenPrice = 49m,
                    Currency = "€",
                    BillingPeriod = "monthly",
                    SelectedOfferName = "Pro Tier"
                },
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "pricing", IsIncluded = false } // Canonical founder exclusion
                }
            };

            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                Phase4Data = new CreatorPhase4Data { LaunchAssets = plan }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var html = await service.GetSourceCodeBundleAsync("user-123", "idea-abc");

            // Assert: Section container and content are completely absent
            Assert.DoesNotContain("id=\"pricing-section\"", html);
            Assert.DoesNotContain("Transparent Pricing", html);
            Assert.DoesNotContain("€49", html);
            Assert.DoesNotContain("Pro Tier", html);
        }

        [Fact]
        public async Task PricingInclusion_IsIncludedFalse_ExcludedFalse_ConfirmedZero_PricingAbsent()
        {
            // Arrange: Canonical section says IsIncluded=false, legacy flag stale Excluded=false, price is confirmed zero (€0)
            var plan = new LaunchAssetsPlan
            {
                BrandName = "TestApp",
                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = false, // Stale legacy flag
                    PriceStatus = "ConfirmedZero",
                    ChosenPrice = 0m,
                    Currency = "€",
                    BillingPeriod = "monthly",
                    SelectedOfferName = "Free Community Tier"
                },
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "pricing", IsIncluded = false } // Canonical founder exclusion
                }
            };

            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                Phase4Data = new CreatorPhase4Data { LaunchAssets = plan }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var html = await service.GetSourceCodeBundleAsync("user-123", "idea-abc");

            // Assert: Section container and content are completely absent
            Assert.DoesNotContain("id=\"pricing-section\"", html);
            Assert.DoesNotContain("Transparent Pricing", html);
            Assert.DoesNotContain("Free Community Tier", html);
        }

        [Fact]
        public async Task PricingInclusion_IsIncludedTrue_ExcludedTrue_ValidConfirmedPrice_CanonicalSectionWins()
        {
            // Arrange: Canonical section says IsIncluded=true, legacy flag says Excluded=true, valid confirmed positive price (€79)
            var plan = new LaunchAssetsPlan
            {
                BrandName = "TestApp",
                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = true, // Legacy flag
                    PriceStatus = "ConfirmedPositive",
                    ChosenPrice = 79m,
                    Currency = "€",
                    BillingPeriod = "monthly",
                    SelectedOfferName = "Growth Tier",
                    Reason = "Straightforward pricing for scaling teams."
                },
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "pricing", IsIncluded = true } // Canonical founder inclusion wins
                }
            };

            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                Phase4Data = new CreatorPhase4Data { LaunchAssets = plan }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var html = await service.GetSourceCodeBundleAsync("user-123", "idea-abc");

            // Assert: Section container and content are rendered
            Assert.Contains("id=\"pricing-section\"", html);
            Assert.Contains("Transparent Pricing", html);
            Assert.Contains("Growth Tier", html);
            Assert.Contains("€79", html);
            Assert.Contains("Straightforward pricing for scaling teams.", html);
        }

        [Fact]
        public async Task PricingInclusion_MissingSection_FallbackToLegacyExcludedFlag()
        {
            // Arrange Case A: Sections list does not contain pricing section key, Excluded=false, price confirmed -> renders
            var planA = new LaunchAssetsPlan
            {
                BrandName = "TestApp",
                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = false, // Legacy inclusion signal
                    PriceStatus = "ConfirmedPositive",
                    ChosenPrice = 49m,
                    Currency = "€",
                    BillingPeriod = "monthly",
                    SelectedOfferName = "Pro Tier"
                },
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "problem", IsIncluded = true }
                    // Pricing section omitted from list
                }
            };

            var journeyA = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                Phase4Data = new CreatorPhase4Data { LaunchAssets = planA }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journeyA);

            var service = CreateService();

            var htmlA = await service.GetSourceCodeBundleAsync("user-123", "idea-abc");
            Assert.Contains("id=\"pricing-section\"", htmlA);
            Assert.Contains("Transparent Pricing", htmlA);

            // Arrange Case B: Sections list does not contain pricing section key, Excluded=true -> pricing absent
            var planB = new LaunchAssetsPlan
            {
                BrandName = "TestApp",
                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = true, // Legacy exclusion signal
                    PriceStatus = "ConfirmedPositive",
                    ChosenPrice = 49m,
                    Currency = "€",
                    BillingPeriod = "monthly",
                    SelectedOfferName = "Pro Tier"
                },
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "problem", IsIncluded = true }
                }
            };
            var journeyB = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                Phase4Data = new CreatorPhase4Data { LaunchAssets = planB }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journeyB);

            var htmlB = await service.GetSourceCodeBundleAsync("user-123", "idea-abc");
            Assert.DoesNotContain("id=\"pricing-section\"", htmlB);
            Assert.DoesNotContain("Transparent Pricing", htmlB);
        }

        [Fact]
        public async Task PricingInclusion_UnconfirmedOrInvalidPrice_PricingAbsentRegardlessOfInclusion()
        {
            // Case 1: Unconfirmed price with IsIncluded=true
            var planUnconfirmed = new LaunchAssetsPlan
            {
                BrandName = "TestApp",
                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = false,
                    PriceStatus = "Unconfirmed",
                    ChosenPrice = null,
                    SelectedOfferName = "Unconfirmed Plan"
                },
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "pricing", IsIncluded = true }
                }
            };

            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                Phase4Data = new CreatorPhase4Data { LaunchAssets = planUnconfirmed }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            var htmlUnconfirmed = await service.GetSourceCodeBundleAsync("user-123", "idea-abc");
            Assert.DoesNotContain("id=\"pricing-section\"", htmlUnconfirmed);
            Assert.DoesNotContain("Transparent Pricing", htmlUnconfirmed);
            Assert.DoesNotContain("Unconfirmed Plan", htmlUnconfirmed);

            // Case 2: Invalid negative price with IsIncluded=true
            var planInvalid = new LaunchAssetsPlan
            {
                BrandName = "TestApp",
                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = false,
                    PriceStatus = "InvalidNegative",
                    ChosenPrice = -25m,
                    SelectedOfferName = "Negative Plan"
                },
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "pricing", IsIncluded = true }
                }
            };
            journey.Phase4Data.LaunchAssets = planInvalid;

            var htmlInvalid = await service.GetSourceCodeBundleAsync("user-123", "idea-abc");
            Assert.DoesNotContain("id=\"pricing-section\"", htmlInvalid);
            Assert.DoesNotContain("Transparent Pricing", htmlInvalid);
            Assert.DoesNotContain("Negative Plan", htmlInvalid);
        }

        [Fact]
        public async Task UpdateLaunchAssetsAsync_SynchronizesExcludedFlagWhenSectionsUpdated()
        {
            // Arrange: Existing plan with pricing section included
            var existingPlan = new LaunchAssetsPlan
            {
                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = false,
                    PriceStatus = "ConfirmedPositive",
                    ChosenPrice = 49m
                },
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "pricing", IsIncluded = true }
                }
            };
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                Phase4Data = new CreatorPhase4Data { LaunchAssets = existingPlan }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .Callback<string, LaunchAssetsPlan, string?>((u, p, i) => journey.Phase4Data.LaunchAssets = p)
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act 1: Toggle pricing section to excluded
            var updateReqExclude = new UpdateLaunchAssetsRequest
            {
                IdeaId = "idea-abc",
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "pricing", IsIncluded = false }
                }
            };
            var resExclude = await service.UpdateLaunchAssetsAsync("user-123", updateReqExclude);

            // Assert 1: Compatibility field PricingExclusion.Excluded synchronized to true
            Assert.False(resExclude.Assets!.Sections.First(s => s.Key == "pricing").IsIncluded);
            Assert.True(resExclude.Assets.PricingExclusion.Excluded);

            // Act 2: Toggle pricing section back to included
            var updateReqInclude = new UpdateLaunchAssetsRequest
            {
                IdeaId = "idea-abc",
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", IsIncluded = true },
                    new() { Key = "pricing", IsIncluded = true }
                }
            };
            var resInclude = await service.UpdateLaunchAssetsAsync("user-123", updateReqInclude);

            // Assert 2: Compatibility field PricingExclusion.Excluded synchronized to false
            Assert.True(resInclude.Assets!.Sections.First(s => s.Key == "pricing").IsIncluded);
            Assert.False(resInclude.Assets.PricingExclusion.Excluded);
        }

        [Fact]
        public async Task Versioning_SequencePreservesVersionAWhileVersionBIsEdited()
        {
            // Step 1: Save and select version A (Version 1)
            var plan = new LaunchAssetsPlan
            {
                Version = 1,
                SelectedVersion = 1,
                Status = "Draft",
                Headline = "Version A Original Headline"
            };
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Phase4Data = new CreatorPhase4Data { LaunchAssets = plan }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.SetPhase4LaunchAssetsAsync("user-123", It.IsAny<LaunchAssetsPlan>(), "idea-abc"))
                .Callback<string, LaunchAssetsPlan, string?>((u, p, i) => journey.Phase4Data.LaunchAssets = p)
                .ReturnsAsync(journey);

            var service = CreateService();

            // Select Version A
            var selectRes = await service.SelectVersionAsync("user-123", "idea-abc");
            Assert.Equal(1, selectRes.Assets!.Version);
            Assert.Equal(1, selectRes.Assets.SelectedVersion);
            Assert.Equal("Selected", selectRes.Assets.Status);

            // Step 2: Create version B (Version 2)
            var newVerRes = await service.CreateNewVersionAsync("user-123", "idea-abc");
            Assert.Equal(2, newVerRes.Assets!.Version);
            Assert.Equal(1, newVerRes.Assets.SelectedVersion); // Still selected version 1!
            Assert.Equal("Draft", newVerRes.Assets.Status);

            // Step 3: Edit and save Version B
            var updateReq = new UpdateLaunchAssetsRequest
            {
                IdeaId = "idea-abc",
                Headline = "Version B Modified Headline"
            };
            var updateRes = await service.UpdateLaunchAssetsAsync("user-123", updateReq);
            Assert.Equal(2, updateRes.Assets!.Version);
            Assert.Equal(1, updateRes.Assets.SelectedVersion);
            Assert.Equal("Version B Modified Headline", updateRes.Assets.Headline);

            // Step 4: Confirm Version A snapshot in history exists unchanged
            var snapshotA = updateRes.Assets.VersionHistory.FirstOrDefault(s => s.Version == 1);
            Assert.NotNull(snapshotA);
            Assert.Equal("Version A Original Headline", snapshotA.Headline);
            Assert.Equal("Selected", snapshotA.Status);

            // Step 5: Download source bundle for Version 1 vs Version 2
            var htmlVersion1 = await service.GetSourceCodeBundleAsync("user-123", "idea-abc", 1);
            Assert.Contains("Version A Original Headline", htmlVersion1);
            Assert.DoesNotContain("Version B Modified Headline", htmlVersion1);

            var htmlVersion2 = await service.GetSourceCodeBundleAsync("user-123", "idea-abc", 2);
            Assert.Contains("Version B Modified Headline", htmlVersion2);

            // Step 6: Explicitly select Version B
            var selectBRes = await service.SelectVersionAsync("user-123", "idea-abc", 2);
            Assert.Equal(2, selectBRes.Assets!.SelectedVersion);
            Assert.Equal("Selected", selectBRes.Assets.Status);
        }
    }
}
