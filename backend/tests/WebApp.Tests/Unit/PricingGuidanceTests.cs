using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

// Module 2 (canon §6.1). Deterministic, no AI — same inputs → same output.
public class PricingGuidanceTests
{
    [Fact]
    public void Project_band_for_a_category()
    {
        var r = PricingGuidance.Suggest(ServiceCategory.Development);
        r.Min.Should().Be(800m);
        r.Max.Should().Be(8000m);
        r.Currency.Should().Be("EUR");
    }

    [Fact]
    public void Hourly_refinement_scales_the_band_down()
    {
        var r = PricingGuidance.Suggest(ServiceCategory.Development, PricingModel.Hourly);
        r.Min.Should().Be(16m);   // 800 / 50
        r.Max.Should().Be(400m);  // 8000 / 20
    }

    [Fact]
    public void MonthlyRetainer_refinement_halves_the_band()
    {
        var r = PricingGuidance.Suggest(ServiceCategory.Development, PricingModel.MonthlyRetainer);
        r.Min.Should().Be(400m);
        r.Max.Should().Be(4000m);
    }

    [Fact]
    public void Is_deterministic()
    {
        var a = PricingGuidance.Suggest(ServiceCategory.Legal, PricingModel.FixedPrice);
        var b = PricingGuidance.Suggest(ServiceCategory.Legal, PricingModel.FixedPrice);
        a.Should().Be(b);
    }

    [Theory]
    [InlineData(ServiceCategory.Development)]
    [InlineData(ServiceCategory.Design)]
    [InlineData(ServiceCategory.Legal)]
    [InlineData(ServiceCategory.Other)]
    public void Every_category_yields_a_valid_range(ServiceCategory c)
    {
        var r = PricingGuidance.Suggest(c);
        r.Min.Should().BeGreaterThan(0);
        r.Max.Should().BeGreaterThan(r.Min);
    }
}
