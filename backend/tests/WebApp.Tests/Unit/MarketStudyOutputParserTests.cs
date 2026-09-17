using FluentAssertions;
using WebApp.Services.Ai.Jobs;
using Xunit;

namespace WebApp.Tests.Unit;

public class MarketStudyOutputParserTests
{
    private static string ValidJson() =>
        """
        {
          "schemaVersion": 1,
          "marketSizing": {
            "tam": { "value": 5000000000, "currency": "EUR", "label": "Global Market", "derivation": "Top down estimation", "sourceAttribution": "Statista 2026" },
            "sam": { "value": 1000000000, "currency": "EUR", "label": "EU Market", "percentageOfTam": 20, "derivation": "EU Segment", "sourceAttribution": "Eurostat" },
            "som": { "value": 50000000, "currency": "EUR", "label": "France Initial", "percentageOfSam": 5, "derivation": "Beachhead target", "sourceAttribution": "Internal model" },
            "methodology": "Triangulated bottom-up and top-down"
          },
          "competitorLandscape": {
            "summary": "Moderately fragmented market",
            "directCompetitors": [
              { "name": "Comp A", "estimatedMarketShare": "15%", "pricingModel": "SaaS", "strengths": ["Brand"], "weaknesses": ["Legacy UI"], "exploitableGap": "Modern API", "sourceAttribution": "Industry Report" }
            ],
            "indirectCompetitors": [
              { "name": "Comp B", "substituteApproach": "Spreadsheets", "threatLevel": "medium" }
            ]
          },
          "demandSignals": [
            { "signal": "Search volume growth +40% YoY", "evidence": "Google Trends", "sourceAttribution": "Google Trends 2026", "relevanceScore": 9 }
          ],
          "sizingRisks": [
            { "risk": "Regulatory delay", "impactOnSom": "medium", "mitigation": "Early compliance audit" }
          ],
          "marketGapValidation": {
            "primaryGap": "Lack of developer-friendly API for sustainable supply chain",
            "validationRationale": "Direct feedback from 20 pilot interviews",
            "confidenceLevel": "high"
          }
        }
        """;

    [Fact]
    public void TryParse_ValidJson_ReturnsTrue()
    {
        MarketStudyOutputParser.TryParse(ValidJson(), out var doc, out var error).Should().BeTrue();
        error.Should().BeEmpty();
        doc.Should().NotBeNull();
        doc.Contains("marketSizing").Should().BeTrue();
    }

    [Fact]
    public void TryParse_WithFences_ReturnsTrue()
    {
        var fenced = "```json\n" + ValidJson() + "\n```";
        MarketStudyOutputParser.TryParse(fenced, out var doc, out var error).Should().BeTrue();
        error.Should().BeEmpty();
    }

    [Fact]
    public void TryParse_MissingField_ReturnsFalse()
    {
        var invalid = "{\"schemaVersion\": 1, \"marketSizing\": {}}";
        MarketStudyOutputParser.TryParse(invalid, out _, out var error).Should().BeFalse();
        error.Should().Contain("missing required field");
    }
}
