using FluentAssertions;
using MongoDB.Bson;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai.Jobs;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// C-4 P4: the tolerant Forecast output parser — strips code fences, extracts the
/// first balanced JSON object, requires the seven locked fields, drops any funding
/// ask, and pins schemaVersion = 1. Never throws; returns false with a reason.
/// </summary>
public class ForecastOutputParserTests
{
    private static string ValidJson() => """
        {
          "schemaVersion": 7,
          "revenueForecast": { "currency": "USD", "monthly": [] },
          "costForecast": { "currency": "USD", "monthly": [] },
          "cashFlowProjection": { "currency": "USD", "monthly": [] },
          "breakEvenAnalysis": { "breakEvenMonth": null, "isAchievedWithinHorizon": false },
          "assumptions": [],
          "risks": [],
          "advisoryNotice": "estimates only"
        }
        """;

    [Fact]
    public void Parses_valid_output_and_pins_schema_version()
    {
        ForecastOutputParser.TryParse(ValidJson(), out var doc, out var error).Should().BeTrue();
        error.Should().BeEmpty();
        doc["schemaVersion"].AsInt32.Should().Be(ForecastOutputDto.CurrentSchemaVersion); // pinned to 1 even though input said 7
        doc.Contains("revenueForecast").Should().BeTrue();
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
        var noisy = "Here is your forecast:\n" + ValidJson() + "\nHope that helps!";
        ForecastOutputParser.TryParse(noisy, out var doc, out _).Should().BeTrue();
        doc.Contains("cashFlowProjection").Should().BeTrue();
    }

    [Fact]
    public void Drops_any_funding_ask()
    {
        var withFunding = ValidJson().TrimEnd().TrimEnd('}') + ", \"fundingAsk\": { \"amount\": 250000 } }";
        ForecastOutputParser.TryParse(withFunding, out var doc, out _).Should().BeTrue();
        doc.Contains("fundingAsk").Should().BeFalse();
    }

    [Theory]
    [InlineData("revenueForecast")]
    [InlineData("costForecast")]
    [InlineData("cashFlowProjection")]
    [InlineData("breakEvenAnalysis")]
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
        ForecastOutputParser.TryParse("{ \"revenueForecast\": { ", out _, out var error).Should().BeFalse();
        error.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Parses_trimmed_contract_without_notes_on_cost_and_cash_flow()
    {
        const string trimmedJson = """
        {
          "schemaVersion": 1,
          "revenueForecast": {
            "currency": "EUR",
            "summary": "Revenue growth",
            "monthly": [
              { "month": 1, "amount": 10000, "notes": "Launch month" },
              { "month": 2, "amount": 12000, "notes": "Word-of-mouth" }
            ]
          },
          "costForecast": {
            "currency": "EUR",
            "summary": "Fixed OPEX + margin",
            "monthly": [
              { "month": 1, "fixedCosts": 5000, "variableCosts": 2000 },
              { "month": 2, "fixedCosts": 5000, "variableCosts": 2400 }
            ]
          },
          "cashFlowProjection": {
            "currency": "EUR",
            "summary": "Positive operational cash flow",
            "monthly": [
              { "month": 1, "netCashFlow": 3000, "endingBalance": 3000 },
              { "month": 2, "netCashFlow": 4600, "endingBalance": 7600 }
            ]
          },
          "breakEvenAnalysis": { "breakEvenMonth": 1, "isAchievedWithinHorizon": true, "summary": "Profitable from M1" },
          "assumptions": ["Conservative ARPU"],
          "risks": [{ "category": "Market", "description": "Competition", "likelihood": "low", "impact": "medium", "mitigation": "Speed" }],
          "advisoryNotice": "Planning estimates only."
        }
        """;

        ForecastOutputParser.TryParse(trimmedJson, out var doc, out var error).Should().BeTrue();
        error.Should().BeEmpty();
        doc["revenueForecast"]["monthly"][0]["notes"].AsString.Should().Be("Launch month");
        doc["costForecast"]["monthly"][0].AsBsonDocument.Contains("notes").Should().BeFalse();
        doc["cashFlowProjection"]["monthly"][0].AsBsonDocument.Contains("notes").Should().BeFalse();
    }
}
