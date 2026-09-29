using FluentAssertions;
using MongoDB.Bson;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Jobs;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 3 Step 3.3 tolerant Forecast output parser — strips code fences, extracts the
/// first balanced JSON object, requires qualitative fields (assumptions, risks, advisoryNotice),
/// drops any funding ask, and pins schemaVersion = 1. Never throws; returns false with a reason.
/// </summary>
public class ForecastOutputParserTests
{
    private static string ValidJson() => """
        {
          "schemaVersion": 7,
          "summary": "Sustainable growth model with initial organic acquisition.",
          "assumptions": ["10% MoM growth based on early pilot interest"],
          "risks": [ { "category": "market", "description": "slow adoption", "likelihood": "medium", "impact": "high", "mitigation": "pilots" } ],
          "advisoryNotice": "estimates only; not guarantees."
        }
        """;

    [Fact]
    public void Parses_valid_output_and_pins_schema_version()
    {
        ForecastOutputParser.TryParse(ValidJson(), out var doc, out var error).Should().BeTrue();
        error.Should().BeEmpty();
        doc["schemaVersion"].AsInt32.Should().Be(ForecastOutputDto.CurrentSchemaVersion); // pinned to 1 even though input said 7
        doc.Contains("assumptions").Should().BeTrue();
        doc.Contains("risks").Should().BeTrue();
        doc.Contains("advisoryNotice").Should().BeTrue();
    }

    [Fact]
    public void Strips_code_fences()
    {
        var fenced = "```json\n" + ValidJson() + "\n```";
        ForecastOutputParser.TryParse(fenced, out _, out var error).Should().BeTrue();
        error.Should().BeEmpty();
    }

    [Fact]
    public void Extracts_object_ignoring_surrounding_prose()
    {
        var noisy = "Here is your forecast analysis:\n" + ValidJson() + "\nHope that helps!";
        ForecastOutputParser.TryParse(noisy, out var doc, out _).Should().BeTrue();
        doc.Contains("assumptions").Should().BeTrue();
    }

    [Fact]
    public void Drops_any_funding_ask()
    {
        var withFunding = ValidJson().TrimEnd().TrimEnd('}') + ", \"fundingAsk\": { \"amount\": 250000 } }";
        ForecastOutputParser.TryParse(withFunding, out var doc, out _).Should().BeTrue();
        doc.Contains("fundingAsk").Should().BeFalse();
    }

    [Theory]
    [InlineData("assumptions")]
    [InlineData("risks")]
    [InlineData("advisoryNotice")]
    public void Rejects_output_missing_a_required_field(string missing)
    {
        // Remove one required field by parsing valid JSON, deleting it, re-serializing.
        var doc = BsonDocument.Parse(ValidJson());
        doc.Remove(missing);

        ForecastOutputParser.TryParse(doc.ToJson(), out _, out var error).Should().BeFalse();
        error.Should().Contain(missing);
    }

    [Fact]
    public void Rejects_non_array_assumptions_or_risks()
    {
        var badAssumptions = """
        {
          "summary": "Good",
          "assumptions": "not an array",
          "risks": [],
          "advisoryNotice": "notice"
        }
        """;
        ForecastOutputParser.TryParse(badAssumptions, out _, out var error).Should().BeFalse();
        error.Should().Contain("assumptions");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Rejects_empty_output(string? raw)
    {
        ForecastOutputParser.TryParse(raw, out _, out var error).Should().BeFalse();
        error.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Rejects_non_json_without_throwing()
    {
        ForecastOutputParser.TryParse("the model rambled with no json", out _, out var error).Should().BeFalse();
        error.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Rejects_malformed_json_without_throwing()
    {
        ForecastOutputParser.TryParse("{ \"assumptions\": [ ", out _, out var error).Should().BeFalse();
        error.Should().NotBeNullOrEmpty();
    }
}
