using FluentAssertions;
using WebApp.Services.Ai.Prompts;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 3 Step 3.3 Forecast prompt template is registered for seeding, and its output
/// contract is the compact qualitative analysis shape (schemaVersion = 1) with no funding ask.
/// The template feeds the existing 5-layer <see cref="PromptBuilder"/> unchanged.
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
    [InlineData("summary")]
    [InlineData("assumptions")]
    [InlineData("risks")]
    [InlineData("advisoryNotice")]
    public void Output_contract_declares_every_locked_field(string key)
        => Template.OutputContract.Should().Contain($"\"{key}\"");

    [Fact]
    public void Prompt_does_not_require_monthly_numeric_projection_tables()
    {
        Template.SystemText.Should().Contain("Do NOT generate monthly numeric projection tables");
        Template.OutputContract.Should().NotContain("\"revenueForecast\"");
        Template.OutputContract.Should().NotContain("\"monthly\"");
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
            task: "Produce the compact qualitative forecast assessment.");

        composition.Layers.Select(l => l.Name).Should().ContainInOrder(
            PromptLayerNames.System,
            PromptLayerNames.ProductContext,
            PromptLayerNames.UserContext,
            PromptLayerNames.Task,
            PromptLayerNames.OutputFormat);

        var system = composition.Messages[0].Content;
        system.Should().Contain("Financial Forecast Strategic Analyst"); // template system text
        system.Should().Contain(SafetyRules.Text);                       // builder-injected safety
        system.Should().Contain("\"advisoryNotice\"");                   // output format layer

        var user = composition.Messages[1].Content;
        user.Should().Contain("solar crop-monitoring drones"); // user context
        user.Should().Contain("Produce the compact qualitative forecast assessment."); // task
    }
}
