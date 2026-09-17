using FluentAssertions;
using WebApp.Services.Ai.Jobs;
using Xunit;

namespace WebApp.Tests.Unit;

public class BusinessModelOutputParserTests
{
    private static string ValidJson() =>
        """
        {
          "schemaVersion": 1,
          "canvas": {
            "keyPartners": ["Cloud Provider", "Payment Gateway"],
            "keyActivities": ["Product Dev", "Sales"],
            "keyResources": ["IP", "Engineering team"],
            "valuePropositions": [
              { "headline": "Automated carbon audit", "details": "10x faster reporting", "marketStudyFootnote": "Addresses 40% YoY demand growth identified in Market Study" }
            ],
            "customerRelationships": ["Self-serve", "Dedicated CSM for enterprise"],
            "channels": ["Direct Sales", "Partner Referrals"],
            "customerSegments": [
              { "segment": "Mid-market logistics", "marketStudyFootnote": "Matches French SOM beachhead segment" }
            ],
            "costStructure": ["Server hosting", "Payroll", "Marketing"],
            "revenueStreams": [
              { "stream": "Subscription SaaS", "marketStudyFootnote": "Standard in sector as noted in competitor review" }
            ]
          },
          "revenueTiers": [
            { "tierName": "Starter", "pricing": "€49/mo", "targetSegment": "SMBs", "features": ["Core reporting"], "projectedContributionPct": 30 },
            { "tierName": "Enterprise", "pricing": "€499/mo", "targetSegment": "Mid-market", "features": ["API access", "Priority support"], "projectedContributionPct": 70 }
          ],
          "unitEconomics": {
            "arpu": { "amount": 250, "currency": "EUR", "period": "monthly", "isModelled": true },
            "cac": { "amount": 600, "currency": "EUR", "isModelled": true },
            "ltv": { "amount": 3000, "currency": "EUR", "isModelled": true },
            "ltvToCacRatio": 5.0,
            "paybackPeriodMonths": 2.4,
            "commentary": "Strong unit economics assuming 2% monthly churn."
          },
          "assumptions": [
            { "category": "Acquisition", "assumption": "Paid search conversion > 3%", "evidenceLevel": "modelled" }
          ]
        }
        """;

    [Fact]
    public void TryParse_ValidJson_ReturnsTrue()
    {
        BusinessModelOutputParser.TryParse(ValidJson(), out var doc, out var error).Should().BeTrue();
        error.Should().BeEmpty();
        doc.Should().NotBeNull();
        doc.Contains("canvas").Should().BeTrue();
    }

    [Fact]
    public void TryParse_WithFences_ReturnsTrue()
    {
        var fenced = "```json\n" + ValidJson() + "\n```";
        BusinessModelOutputParser.TryParse(fenced, out var doc, out var error).Should().BeTrue();
        error.Should().BeEmpty();
    }

    [Fact]
    public void TryParse_MissingField_ReturnsFalse()
    {
        var invalid = "{\"schemaVersion\": 1, \"canvas\": {}}";
        BusinessModelOutputParser.TryParse(invalid, out _, out var error).Should().BeFalse();
        error.Should().Contain("missing required field");
    }
}
