using FluentAssertions;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Prompts;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// C-2 P2: the Idea-Clarifier prompt template is registered for seeding, and its
/// output contract is the locked C-3/C-4 hand-off shape (schemaVersion = 1). The
/// template feeds the existing 5-layer <see cref="PromptBuilder"/> unchanged.
/// </summary>
public class IdeaClarifierPromptTests
{
    private static readonly PromptTemplate Template = PromptTemplate.IdeaClarifier;

    [Fact]
    public void Is_registered_in_All_for_startup_seeding()
    {
        PromptTemplate.All.Should().Contain(Template);
        PromptTemplate.All.Should().Contain(PromptTemplate.Probe); // existing template untouched
    }

    [Fact]
    public void Has_stable_key_and_version()
    {
        Template.Key.Should().Be("idea-clarifier");
        Template.Version.Should().Be(1);
        Template.SystemText.Should().NotBeNullOrWhiteSpace();
        Template.OutputContract.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Output_contract_pins_schema_version_to_the_dto_contract()
    {
        // The locked hand-off contract version must match the DTO C-3/C-4 read.
        ClarifierOutputDto.CurrentSchemaVersion.Should().Be(1);
        Template.OutputContract.Should().Contain("\"schemaVersion\": 1");
        Template.OutputContract.Should().Contain("schemaVersion MUST be 1");
    }

    [Theory]
    [InlineData("problemDefinition")]
    [InlineData("painPoints")]
    [InlineData("targetAudience")]
    [InlineData("primarySegment")]
    [InlineData("sizeQualitative")]
    [InlineData("existingAlternatives")]
    [InlineData("proposedSolution")]
    [InlineData("differentiation")]
    [InlineData("valueProposition")]
    [InlineData("riskAssessment")]
    [InlineData("mitigation")]
    [InlineData("assumptions")]
    [InlineData("clarityScore")]
    [InlineData("clarityRationale")]
    [InlineData("tags")]
    public void Output_contract_declares_every_locked_field(string key)
        => Template.OutputContract.Should().Contain($"\"{key}\"");

    [Fact]
    public void Output_contract_constrains_enums_and_score_range()
    {
        Template.OutputContract.Should().Contain("0 and 100");
        Template.OutputContract.Should().Contain("low, medium, or high");
        // No quantitative market/revenue guarantees in the audience sizing.
        Template.OutputContract.Should().Contain("qualitative reach statement");
    }

    [Fact]
    public void Builds_into_the_five_layer_composition_with_safety_and_contract()
    {
        var composition = new PromptBuilder().Build(
            Template,
            userContext: "Title: Solar drones. Problem: crop monitoring is manual.",
            task: "Clarify this idea and return the JSON contract.");

        composition.Layers.Select(l => l.Name).Should().ContainInOrder(
            PromptLayerNames.System,
            PromptLayerNames.ProductContext,
            PromptLayerNames.UserContext,
            PromptLayerNames.Task,
            PromptLayerNames.OutputFormat);

        var system = composition.Messages[0].Content;
        system.Should().Contain("Idea Clarifier");      // template system text
        system.Should().Contain(SafetyRules.Text);      // builder-injected safety
        system.Should().Contain("\"schemaVersion\": 1"); // output format layer

        var user = composition.Messages[1].Content;
        user.Should().Contain("Solar drones");          // user context
        user.Should().Contain("return the JSON contract"); // task
    }
}
