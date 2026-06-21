using FluentAssertions;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Prompts;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// C-3 P2: the Business-Plan prompt template is registered for seeding, and its
/// output contract is the locked seven-section hand-off shape (schemaVersion = 1)
/// with no funding ask. The template feeds the existing 5-layer
/// <see cref="PromptBuilder"/> unchanged.
/// </summary>
public class BusinessPlanPromptTests
{
    private static readonly PromptTemplate Template = PromptTemplate.BusinessPlan;

    [Fact]
    public void Is_registered_in_All_for_startup_seeding()
    {
        PromptTemplate.All.Should().Contain(Template);
        PromptTemplate.All.Should().Contain(PromptTemplate.IdeaClarifier); // existing templates untouched
        PromptTemplate.All.Should().Contain(PromptTemplate.Probe);
    }

    [Fact]
    public void Has_stable_key_and_version()
    {
        Template.Key.Should().Be("business-plan");
        Template.Version.Should().Be(1);
        Template.SystemText.Should().NotBeNullOrWhiteSpace();
        Template.OutputContract.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Output_contract_pins_schema_version_to_the_dto_contract()
    {
        BusinessPlanOutputDto.CurrentSchemaVersion.Should().Be(1);
        Template.OutputContract.Should().Contain("\"schemaVersion\": 1");
        Template.OutputContract.Should().Contain("schemaVersion MUST be 1");
    }

    [Theory]
    [InlineData("executiveSummary")]
    [InlineData("marketAnalysis")]
    [InlineData("competitorAnalysis")]
    [InlineData("revenueModel")]
    [InlineData("goToMarket")]
    [InlineData("operationsPlan")]
    [InlineData("risks")]
    public void Output_contract_declares_every_locked_section(string key)
        => Template.OutputContract.Should().Contain($"\"{key}\"");

    [Fact]
    public void Output_contract_excludes_funding_ask()
    {
        // Locked C-3 decision #1: v1 has no funding ask.
        Template.OutputContract.Should().NotContain("fundingAsk");
        Template.OutputContract.Should().Contain("do NOT add any funding ask");
    }

    [Fact]
    public void Output_contract_constrains_enums_and_keeps_sizing_qualitative()
    {
        Template.OutputContract.Should().Contain("low, medium, or high");
        Template.OutputContract.Should().Contain("qualitative reach statement");
    }

    [Fact]
    public void Builds_into_the_five_layer_composition_with_safety_and_contract()
    {
        var composition = new PromptBuilder().Build(
            Template,
            userContext: "CLARIFIED OPPORTUNITY: solar crop-monitoring drones for mid-size farms.",
            task: "Produce the business plan JSON contract.");

        composition.Layers.Select(l => l.Name).Should().ContainInOrder(
            PromptLayerNames.System,
            PromptLayerNames.ProductContext,
            PromptLayerNames.UserContext,
            PromptLayerNames.Task,
            PromptLayerNames.OutputFormat);

        var system = composition.Messages[0].Content;
        system.Should().Contain("Business Plan Architect"); // template system text
        system.Should().Contain(SafetyRules.Text);          // builder-injected safety
        system.Should().Contain("\"executiveSummary\"");    // output format layer

        var user = composition.Messages[1].Content;
        user.Should().Contain("solar crop-monitoring drones"); // user context
        user.Should().Contain("business plan JSON contract");  // task
    }
}
