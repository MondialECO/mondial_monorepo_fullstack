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

    [Fact]
    public void TryParse_Normalizes_Enums_And_Methodology()
    {
        var raw = """
        {
          "marketSizing": {
            "tam": { "value": 1000 },
            "sam": { "value": 500 },
            "som": { "value": 100 }
          },
          "competitorLandscape": {
            "directCompetitors": [],
            "indirectCompetitors": [
              { "name": "A", "threatLevel": "elevated" },
              { "name": "B", "threatLevel": "minimal" },
              { "name": "C", "threatLevel": "random_threat" }
            ]
          },
          "demandSignals": [],
          "sizingRisks": [
            { "risk": "R1", "impactOnSom": "critical" },
            { "risk": "R2", "impactOnSom": "unknown_impact" }
          ],
          "marketGapValidation": {
            "primaryGap": "Gap",
            "confidenceLevel": "strong"
          }
        }
        """;

        var ok = MarketStudyOutputParser.TryParse(raw, out var doc, out var error);
        ok.Should().BeTrue();
        error.Should().BeEmpty();

        doc["marketSizing"]["methodology"].AsString.Should().Be("triangulated");

        var indirect = doc["competitorLandscape"]["indirectCompetitors"].AsBsonArray;
        indirect[0]["threatLevel"].AsString.Should().Be("high");   // "elevated" -> "high"
        indirect[1]["threatLevel"].AsString.Should().Be("low");    // "minimal" -> "low"
        indirect[2]["threatLevel"].AsString.Should().Be("medium"); // unknown -> "medium" (safe fallback)

        var risks = doc["sizingRisks"].AsBsonArray;
        risks[0]["impactOnSom"].AsString.Should().Be("high");      // "critical" -> "high"
        risks[1]["impactOnSom"].AsString.Should().Be("medium");    // unknown -> "medium" (safe fallback)

        doc["marketGapValidation"]["confidenceLevel"].AsString.Should().Be("high"); // "strong" -> "high"
    }

    [Fact]
    public void TryParse_DirectCompetitor_WithOrWithoutSegment_ParsesCorrectly()
    {
        var raw = """
        {
          "marketSizing": {
            "tam": { "value": 1000 },
            "sam": { "value": 500 },
            "som": { "value": 100 }
          },
          "competitorLandscape": {
            "directCompetitors": [
              { "name": "Comp Modern", "segment": "Enterprise / Fortune 500", "estimatedMarketShare": "25%", "pricingModel": "Annual SaaS", "exploitableGap": "Complex onboarding" },
              { "name": "Comp Legacy", "estimatedMarketShare": "10%", "pricingModel": "Per-seat", "exploitableGap": "Outdated UI" }
            ],
            "indirectCompetitors": []
          },
          "demandSignals": [],
          "sizingRisks": [],
          "marketGapValidation": {
            "primaryGap": "Developer-first supply chain tooling"
          }
        }
        """;

        var ok = MarketStudyOutputParser.TryParse(raw, out var doc, out var error);
        ok.Should().BeTrue();
        error.Should().BeEmpty();

        var direct = doc["competitorLandscape"]["directCompetitors"].AsBsonArray;
        direct.Count.Should().Be(2);
        direct[0]["name"].AsString.Should().Be("Comp Modern");
        direct[0]["segment"].AsString.Should().Be("Enterprise / Fortune 500");
        direct[1]["name"].AsString.Should().Be("Comp Legacy");
        direct[1].AsBsonDocument.Contains("segment").Should().BeFalse();
    }

    [Fact]
    public void TryParse_DirectCompetitor_WithAliasSegment_NormalizesToSegment()
    {
        var raw = """
        {
          "marketSizing": {
            "tam": { "value": 1000 },
            "sam": { "value": 500 },
            "som": { "value": 100 }
          },
          "competitorLandscape": {
            "directCompetitors": [
              { "name": "Comp A", "targetSegment": "Fintech SMBs", "estimatedMarketShare": "15%" },
              { "name": "Comp B", "marketSegment": "Global Enterprise", "estimatedMarketShare": "30%" }
            ],
            "indirectCompetitors": []
          },
          "demandSignals": [],
          "sizingRisks": [],
          "marketGapValidation": {
            "primaryGap": "Developer-first supply chain tooling"
          }
        }
        """;

        var ok = MarketStudyOutputParser.TryParse(raw, out var doc, out var error);
        ok.Should().BeTrue();
        error.Should().BeEmpty();

        var direct = doc["competitorLandscape"]["directCompetitors"].AsBsonArray;
        direct[0]["segment"].AsString.Should().Be("Fintech SMBs");
        direct[1]["segment"].AsString.Should().Be("Global Enterprise");
    }
}

