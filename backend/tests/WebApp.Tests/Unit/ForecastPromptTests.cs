using FluentAssertions;
using WebApp.Services.Ai.Prompts;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// C-4 P1: the Forecast prompt template is registered for seeding, and its output
/// contract is the locked seven-field hand-off shape (schemaVersion = 1) over a
/// fixed 12-month horizon, with no funding ask. The template feeds the existing
/// 5-layer <see cref="PromptBuilder"/> unchanged.
/// </summary>
public class ForecastPromptTests
{
    private static readonly PromptTemplate Template = PromptTemplate.Forecast;

    [Fact]
    public void Is_registered_in_All_for_startup_seeding()
    {
        PromptTemplate.All.Should().Contain(Template);
        PromptTemplate.All.Should().Contain(PromptTemplate.BusinessPlan);   // existing templates untouched
        PromptTemplate.All.Should().Contain(PromptTemplate.IdeaClarifier);
        PromptTemplate.All.Should().Contain(PromptTemplate.Probe);
    }

    [Fact]
    public void Has_stable_key_and_version()
    {
        Template.Key.Should().Be("forecast");
        Template.Version.Should().Be(1);
        Template.SystemText.Should().NotBeNullOrWhiteSpace();
        Template.OutputContract.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Output_contract_pins_schema_version_to_one()
    {
        Template.OutputContract.Should().Contain("\"schemaVersion\": 1");
        Template.OutputContract.Should().Contain("schemaVersion MUST be 1");
    }

    [Theory]
    [InlineData("revenueForecast")]
    [InlineData("costForecast")]
    [InlineData("cashFlowProjection")]
    [InlineData("breakEvenAnalysis")]
    [InlineData("assumptions")]
    [InlineData("risks")]
    [InlineData("advisoryNotice")]
    public void Output_contract_declares_every_locked_field(string key)
        => Template.OutputContract.Should().Contain($"\"{key}\"");

    [Fact]
    public void Horizon_is_fixed_to_twelve_monthly_periods()
    {
        // Locked C-4: 12 monthly periods, no custom horizon, no yearly forecast.
        Template.OutputContract.Should().Contain("exactly 12");
        Template.SystemText.Should().Contain("12 consecutive monthly periods");
        Template.SystemText.Should().Contain("never a yearly forecast");
        Template.OutputContract.Should().NotContain("yearly");
    }

    [Fact]
    public void Output_contract_excludes_funding_ask()
    {
        // Funding ask must not appear as a field anywhere; only the guard remains.
        Template.OutputContract.Should().NotContain("fundingAsk");
        Template.OutputContract.Should().NotContain("\"fundingAsk\"");
        Template.OutputContract.Should().Contain("do NOT add any funding ask");
        Template.SystemText.Should().Contain("Do NOT include any funding ask");
    }

    [Fact]
    public void Advisory_notice_aligns_with_safety_rules()
    {
        // advisoryNotice carries the estimate disclaimer mandated by SafetyRules.
        Template.OutputContract.Should().Contain("advisoryNotice");
        Template.OutputContract.Should().Contain("planning estimates");
        Template.OutputContract.Should().Contain("not guarantees");
        Template.OutputContract.Should().Contain("professional advice");
    }

    [Fact]
    public void Output_contract_constrains_risk_enums()
        => Template.OutputContract.Should().Contain("low, medium, or high");

    [Fact]
    public void Builds_into_the_five_layer_composition_with_safety_and_contract()
    {
        var composition = new PromptBuilder().Build(
            Template,
            userContext: "BUSINESS PLAN: solar crop-monitoring drones for mid-size farms.",
            task: "Produce the 12-month forecast JSON contract.");

        composition.Layers.Select(l => l.Name).Should().ContainInOrder(
            PromptLayerNames.System,
            PromptLayerNames.ProductContext,
            PromptLayerNames.UserContext,
            PromptLayerNames.Task,
            PromptLayerNames.OutputFormat);

        var system = composition.Messages[0].Content;
        system.Should().Contain("Financial Forecast Analyst"); // template system text
        system.Should().Contain(SafetyRules.Text);             // builder-injected safety
        system.Should().Contain("\"revenueForecast\"");        // output format layer

        var user = composition.Messages[1].Content;
        user.Should().Contain("solar crop-monitoring drones"); // user context
        user.Should().Contain("12-month forecast JSON contract"); // task
    }
}
