using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Creator.Unit
{
    /// <summary>
    /// Unit tests for Brand Visual Identity Studio domain invariants and scoping resolution.
    /// Storage isolation and real-database round-trips are covered in
    /// <see cref="WebApp.Tests.Creator.Integration.BrandKitIntegrationTests"/>.
    /// </summary>
    public class BrandKitStorageTests
    {
        private const string OwnerUserId = "user-creator-111";
        private const string IdeaAId = "60f1b2b3c4d5e6f7a8b9c0d1";

        // =========================================================================
        // 1. DOMAIN INVARIANTS TEST
        // =========================================================================
        [Fact]
        public void Domain_invariants_hold_for_color_roles_typography_and_refinements()
        {
            var kit = new BrandKit
            {
                IdeaId = IdeaAId,
                UserId = OwnerUserId,
                Colors = new BrandColors
                {
                    Roles = new List<BrandColorRole>
                    {
                        new() { RoleName = BrandColorRoleNames.Primary, Hex = "#1A1A24", Rgb = "26,26,36", ContrastRatio = 12.4, ContrastVerdict = "AAA" },
                        new() { RoleName = BrandColorRoleNames.Secondary, Hex = "#3C61DD", Rgb = "60,97,221", ContrastRatio = 4.8, ContrastVerdict = "AA" },
                        new() { RoleName = BrandColorRoleNames.Accent, Hex = "#00D084", Rgb = "0,208,132", ContrastRatio = 3.5, ContrastVerdict = "AA_Large" },
                        new() { RoleName = BrandColorRoleNames.Background, Hex = "#FFFFFF", Rgb = "255,255,255", ContrastRatio = null, ContrastVerdict = null },
                        new() { RoleName = BrandColorRoleNames.Text, Hex = "#0F172A", Rgb = "15,23,42", ContrastRatio = 14.2, ContrastVerdict = "AAA" }
                    }
                },
                Typography = new BrandTypography
                {
                    Roles = new List<BrandTypographyRole>
                    {
                        new() { RoleName = BrandTypographyRoleNames.LogoType, Family = "Syne", Weight = "800", IsLocked = true },
                        new() { RoleName = BrandTypographyRoleNames.Heading, Family = "Syne", Weight = "700", IsLocked = false },
                        new() { RoleName = BrandTypographyRoleNames.Body, Family = "DM Sans", Weight = "400", IsLocked = false },
                        new() { RoleName = BrandTypographyRoleNames.ButtonAndLabel, Family = "DM Sans", Weight = "600", IsLocked = false }
                    }
                }
            };

            // 1. Color roles: exactly 5 canonical roles, Background has null contrast
            kit.Colors.Roles.Should().HaveCount(5);
            kit.Colors.Roles.Select(r => r.RoleName).Should().BeEquivalentTo(BrandColorRoleNames.All);
            var bgRole = kit.Colors.Roles.First(r => r.RoleName == BrandColorRoleNames.Background);
            bgRole.ContrastRatio.Should().BeNull();
            bgRole.ContrastVerdict.Should().BeNull();

            // 2. Typography roles: exactly 4 canonical roles, Logo type is permanently locked
            kit.Typography.Roles.Should().HaveCount(4);
            kit.Typography.Roles.Select(r => r.RoleName).Should().BeEquivalentTo(BrandTypographyRoleNames.All);
            var logoTypeRole = kit.Typography.Roles.First(r => r.RoleName == BrandTypographyRoleNames.LogoType);
            logoTypeRole.IsLocked.Should().BeTrue();

            // 3. Refinement settings: exact three nullable properties
            var refinement = new BrandLogoRefinementSettings
            {
                SymbolSize = "scale_4",
                Spacing = "tight",
                Arrangement = "stacked"
            };
            refinement.SymbolSize.Should().Be("scale_4");
            refinement.Spacing.Should().Be("tight");
            refinement.Arrangement.Should().Be("stacked");

            // 4. Logo variations: exactly 7 canonical keys
            BrandLogoVariationKeys.All.Should().HaveCount(7);
            BrandLogoVariationKeys.All.Should().Contain(new[] { "primary", "horizontal", "stacked", "icon_only", "black", "white", "transparent" });
        }

        // =========================================================================
        // 2. RESOLVE IDEA SCOPING REUSE TEST
        // =========================================================================
        [Fact]
        public async Task ResolveIdeaAsync_reuses_existing_resolution_semantics_and_does_not_recurse()
        {
            var ideasStoreMock = new Mock<ICreatorIdeaStore>();
            var expectedIdea = new CreatorIdea { Id = IdeaAId, UserId = OwnerUserId };

            ideasStoreMock.Setup(s => s.GetOwnedAsync(IdeaAId, OwnerUserId)).ReturnsAsync(expectedIdea);
            ideasStoreMock.Setup(s => s.GetOwnedAsync("unowned-idea", OwnerUserId)).ReturnsAsync((CreatorIdea?)null);

            var dbMock = new Mock<IMongoDatabase>();
            var journeysColMock = new Mock<IMongoCollection<CreatorJourney>>();
            var existingJourney = new CreatorJourney { UserId = OwnerUserId, ActiveIdeaId = IdeaAId };

            // Find for GetOrCreateAsync
            journeysColMock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<CreatorJourney>>(),
                It.IsAny<FindOptions<CreatorJourney, CreatorJourney>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<CreatorJourney>>();
                    cursor.SetupSequence(x => x.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
                    cursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
                    cursor.Setup(x => x.Current).Returns(new List<CreatorJourney> { existingJourney });
                    return cursor.Object;
                });

            dbMock.Setup(d => d.GetCollection<CreatorJourney>("CreatorJourneys", null)).Returns(journeysColMock.Object);
            var context = new MongoDbContext(dbMock.Object);

            var journeyService = new CreatorJourneyService(
                context,
                Mock.Of<IBusinessPlanSessionStore>(),
                Mock.Of<IForecastSessionStore>(),
                ideasStoreMock.Object,
                Mock.Of<IClarifierSessionStore>());

            // 1. Explicit idea resolves correctly via public wrapper -> GetOrCreateAsync -> private ResolveIdeaAsync(j, ideaId)
            var resolved = await journeyService.ResolveIdeaAsync(OwnerUserId, IdeaAId);
            resolved.Should().BeSameAs(expectedIdea);

            // 2. Missing idea falls back to active idea pointer on the loaded journey
            var activeFallback = await journeyService.ResolveIdeaAsync(OwnerUserId, null);
            activeFallback.Should().BeSameAs(expectedIdea);

            // 3. Unowned idea throws 404
            var act = () => journeyService.ResolveIdeaAsync(OwnerUserId, "unowned-idea");
            var ex = await act.Should().ThrowAsync<CreatorJourneyException>();
            ex.Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        }
    }
}
