using System.Text.Json;
using FluentAssertions;
using WebApp.Models.Dtos.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// C-4 P2: JSON round-trip / shape checks for the Forecast DTO contracts. Uses the
/// same camelCase policy the controllers serialize with (see BusinessPlanController),
/// so the on-wire keys match the locked Forecast prompt output contract: seven
/// fields, numeric monthly arrays over a fixed 12-month horizon, no funding ask.
/// </summary>
public class ForecastDtoSerializationTests
{
    private static readonly JsonSerializerOptions CamelCase = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static string Json<T>(T value) => JsonSerializer.Serialize(value, CamelCase);
    private static T RoundTrip<T>(T value) => JsonSerializer.Deserialize<T>(Json(value), CamelCase)!;

    private static ForecastOutputDto Sample()
    {
        var output = new ForecastOutputDto
        {
            RevenueForecast = { Currency = "USD", Summary = "ramping" },
            CostForecast = { Currency = "USD", Summary = "lean" },
            CashFlowProjection = { Currency = "USD", Summary = "tightening" },
            BreakEvenAnalysis = new BreakEvenAnalysisDto
            {
                BreakEvenMonth = 9,
                Summary = "break-even in month 9",
                IsAchievedWithinHorizon = true,
            },
            Assumptions = { "10% MoM growth", "fixed headcount" },
            Risks =
            {
                new ForecastRiskDto
                {
                    Category = "market", Description = "slow adoption",
                    Likelihood = "medium", Impact = "high", Mitigation = "pilot programs",
                },
            },
            AdvisoryNotice = "Planning estimates, not guarantees. Seek professional advice.",
        };

        for (var m = 1; m <= ForecastOutputDto.MonthsInHorizon; m++)
        {
            output.RevenueForecast.Monthly.Add(new RevenueMonthDto { Month = m, Amount = 1000m * m });
            output.CostForecast.Monthly.Add(new CostMonthDto { Month = m, FixedCosts = 500m, VariableCosts = 100m * m });
            output.CashFlowProjection.Monthly.Add(new CashFlowMonthDto { Month = m, NetCashFlow = 400m * m, EndingBalance = 400m * m });
        }

        return output;
    }

    [Fact]
    public void Output_defaults_pin_schema_version_and_fixed_horizon()
    {
        ForecastOutputDto.CurrentSchemaVersion.Should().Be(1);
        ForecastOutputDto.MonthsInHorizon.Should().Be(12);
        new ForecastOutputDto().SchemaVersion.Should().Be(1);
    }

    [Fact]
    public void Output_serializes_all_seven_locked_fields_as_camelcase()
    {
        var json = Json(Sample());

        json.Should().Contain("\"schemaVersion\":1");
        json.Should().Contain("\"revenueForecast\"");
        json.Should().Contain("\"costForecast\"");
        json.Should().Contain("\"cashFlowProjection\"");
        json.Should().Contain("\"breakEvenAnalysis\"");
        json.Should().Contain("\"assumptions\"");
        json.Should().Contain("\"risks\"");
        json.Should().Contain("\"advisoryNotice\"");
    }

    [Fact]
    public void Output_has_no_funding_ask_field()
    {
        var json = Json(Sample()).ToLowerInvariant();
        json.Should().NotContain("funding");
        json.Should().NotContain("valuation");
        json.Should().NotContain("capitalrequest");
    }

    [Fact]
    public void Output_round_trips_with_twelve_numeric_monthly_periods()
    {
        var back = RoundTrip(Sample());

        back.SchemaVersion.Should().Be(1);
        back.RevenueForecast.Monthly.Should().HaveCount(12);
        back.CostForecast.Monthly.Should().HaveCount(12);
        back.CashFlowProjection.Monthly.Should().HaveCount(12);

        back.RevenueForecast.Monthly.Select(x => x.Month).Should().Equal(Enumerable.Range(1, 12));
        back.RevenueForecast.Monthly[11].Amount.Should().Be(12000m);
        back.CostForecast.Monthly[0].FixedCosts.Should().Be(500m);
        back.CashFlowProjection.Monthly[2].NetCashFlow.Should().Be(1200m);

        back.BreakEvenAnalysis.BreakEvenMonth.Should().Be(9);
        back.BreakEvenAnalysis.IsAchievedWithinHorizon.Should().BeTrue();
        back.Risks.Should().ContainSingle();
        back.Assumptions.Should().HaveCount(2);
        back.AdvisoryNotice.Should().Contain("not guarantees");
    }

    [Fact]
    public void Break_even_month_is_nullable_when_not_reached()
    {
        var output = Sample();
        output.BreakEvenAnalysis = new BreakEvenAnalysisDto
        {
            BreakEvenMonth = null,
            IsAchievedWithinHorizon = false,
            Summary = "not reached within 12 months",
        };

        var back = RoundTrip(output);
        back.BreakEvenAnalysis.BreakEvenMonth.Should().BeNull();
        back.BreakEvenAnalysis.IsAchievedWithinHorizon.Should().BeFalse();
    }

    [Fact]
    public void Session_inlines_output_and_version_history()
    {
        var session = new ForecastSessionDto
        {
            SessionId = "fc-1",
            Status = "Completed",
            BusinessPlanSessionId = "bp-1",
            CurrentVersion = 1,
            SchemaVersion = 1,
            Output = Sample(),
            Versions =
            {
                new ForecastVersionDto { Version = 1, IsEdited = false, RequestId = "req-1", Content = Sample() },
            },
        };

        var json = Json(session);
        json.Should().Contain("\"sessionId\":\"fc-1\"");
        json.Should().Contain("\"businessPlanSessionId\":\"bp-1\"");
        json.Should().Contain("\"versions\"");

        var back = RoundTrip(session);
        back.SessionId.Should().Be("fc-1");
        back.BusinessPlanSessionId.Should().Be("bp-1");
        back.CurrentVersion.Should().Be(1);
        back.Versions.Should().ContainSingle();
        back.Versions[0].Version.Should().Be(1);
    }

    [Fact]
    public void Start_request_carries_business_plan_session_reference()
    {
        var back = RoundTrip(new StartForecastRequest { BusinessPlanSessionId = "bp-9", BusinessIdeaId = "idea-3" });
        back.BusinessPlanSessionId.Should().Be("bp-9");
        back.BusinessIdeaId.Should().Be("idea-3");
    }

    [Fact]
    public void Edit_request_round_trips_the_forecast_contract()
    {
        var back = RoundTrip(new EditForecastRequest { Forecast = Sample() });
        back.Forecast.SchemaVersion.Should().Be(1);
        back.Forecast.RevenueForecast.Monthly.Should().HaveCount(12);
        back.Forecast.AdvisoryNotice.Should().NotBeNullOrWhiteSpace();
    }
}
