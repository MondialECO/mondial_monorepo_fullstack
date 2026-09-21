using System;
using System.Linq;
using System.Reflection;
using FluentAssertions;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class LegacyPhase4AntiRegressionTests
    {
        [Fact]
        public void LegacyPhase4Controller_NoLongerRegistered()
        {
            var webAppAssembly = typeof(CreatorPhase4ConstructionController).Assembly;
            var legacyControllerType = webAppAssembly.GetTypes().FirstOrDefault(t => t.Name == "CreatorPhase4Controller");
            legacyControllerType.Should().BeNull("CreatorPhase4Controller must be completely removed from the backend");
        }

        [Fact]
        public void Phase5_RemainsAvailable()
        {
            typeof(CreatorPhase5Controller).Should().NotBeNull("CreatorPhase5Controller must remain active and preserved");
            var routeAttr = typeof(CreatorPhase5Controller).GetCustomAttribute<Microsoft.AspNetCore.Mvc.RouteAttribute>();
            routeAttr.Should().NotBeNull();
            routeAttr!.Template.Should().Be("api/creator");
        }

        [Fact]
        public void Phase6_RemainsAvailable()
        {
            typeof(CreatorPhase6Controller).Should().NotBeNull("CreatorPhase6Controller must remain active and preserved");
            var routeAttr = typeof(CreatorPhase6Controller).GetCustomAttribute<Microsoft.AspNetCore.Mvc.RouteAttribute>();
            routeAttr.Should().NotBeNull();
            routeAttr!.Template.Should().Be("api/creator");
        }

        [Fact]
        public void CanonicalPricing_DoesNotWriteCreatorIdeaLegacyTiers()
        {
            var p4Props = typeof(CreatorPhase4Data).GetProperties().Select(p => p.Name).ToList();
            p4Props.Should().NotContain("Tiers");
            p4Props.Should().NotContain("PricingModel");
            p4Props.Should().NotContain("PricingForecastContext");
        }

        [Fact]
        public void CanonicalGtm_DoesNotWriteCreatorIdeaLegacyGtmSetup()
        {
            var p4Props = typeof(CreatorPhase4Data).GetProperties().Select(p => p.Name).ToList();
            p4Props.Should().NotContain("GtmSetup");
            p4Props.Should().NotContain("ResourceCalculation");
        }

        [Fact]
        public void ICreatorJourneyService_DoesNotExposeLegacySetters()
        {
            var methods = typeof(ICreatorJourneyService).GetMethods().Select(m => m.Name).ToList();
            methods.Should().NotContain("SetPhase4PricingAsync");
            methods.Should().NotContain("SetPhase4ResourceAsync");
            methods.Should().NotContain("SetPhase4GtmAsync");
        }

        [Fact]
        public void CreatorPhase4Data_ExposesCanonicalEnginesOnly()
        {
            var p4Props = typeof(CreatorPhase4Data).GetProperties().Select(p => p.Name).ToList();
            p4Props.Should().Contain("ConstructionSnapshot");
            p4Props.Should().Contain("Roadmap");
            p4Props.Should().Contain("NeedsAnalysis");
            p4Props.Should().Contain("SkillsPlan");
            p4Props.Should().Contain("SupportPlan");
            p4Props.Should().Contain("PricingStrategy");
            p4Props.Should().Contain("GtmStrategy");
            p4Props.Should().Contain("SourceVersions");
            p4Props.Count.Should().Be(8);
        }
    }
}
