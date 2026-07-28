using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class AnalyticsModuleTests
{
    [Fact]
    public void Shared_repeat_client_calculator_uses_unique_client_weighting()
    {
        var result = Calculator().Calculate(new[]
        {
            Engagement("a", EngagementStatus.Completed),
            Engagement("a", EngagementStatus.Archived),
            Engagement("b", EngagementStatus.Completed),
        });

        result.CompletedProjectCount.Should().Be(3);
        result.TotalClientCount.Should().Be(2);
        result.RepeatClientCount.Should().Be(1);
        result.RepeatClientRate.Should().Be(50);
        result.RepeatClientIds.Should().BeEquivalentTo("a");
    }

    [Fact]
    public void Shared_repeat_client_calculator_ignores_unfinished_work()
    {
        var result = Calculator().Calculate(new[]
        {
            Engagement("a", EngagementStatus.Active),
            Engagement("a", EngagementStatus.Cancelled),
            Engagement("b", EngagementStatus.Completed),
        });
        result.CompletedProjectCount.Should().Be(1);
        result.RepeatClientRate.Should().Be(0);
    }

    [Fact]
    public void Shared_repeat_client_calculator_is_neutral_without_clients()
        => Calculator().Calculate(Array.Empty<WorkroomEngagement>()).RepeatClientRate.Should().BeNull();

    [Fact]
    public void Shared_on_time_calculator_uses_submitted_at_against_stored_due_date()
    {
        var due = DateTime.UtcNow;
        var result = Calculator().CalculateOnTimeRate(new[]
        {
            new WorkroomMilestone { DueDate = due, SubmittedAt = due.AddMinutes(-1) },
            new WorkroomMilestone { DueDate = due, SubmittedAt = due.AddMinutes(1) },
            new WorkroomMilestone { DueDate = due },
        });
        result.Should().Be(50);
    }

    [Theory]
    [InlineData("Last7Days", 7)]
    [InlineData("Last30Days", 30)]
    [InlineData("Last90Days", 90)]
    public void Rolling_periods_have_equal_previous_windows(string range, int days)
    {
        var now = new DateTime(2026, 7, 27, 12, 0, 0, DateTimeKind.Utc);
        var result = AnalyticsPeriodResolver.Resolve(new AnalyticsQuery { Range = range }, now);
        (result.To - result.From).TotalDays.Should().Be(days);
        (result.ComparisonTo - result.ComparisonFrom).Should().Be(result.To - result.From);
        result.ComparisonTo.Should().Be(result.From);
    }

    [Fact]
    public void This_month_compares_the_same_elapsed_window_in_the_previous_month()
    {
        var now = new DateTime(2026, 7, 28, 12, 0, 0, DateTimeKind.Utc);
        var result = AnalyticsPeriodResolver.Resolve(new AnalyticsQuery { Range = "ThisMonth" }, now);
        result.From.Should().Be(new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc));
        result.ComparisonFrom.Should().Be(new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        (result.ComparisonTo - result.ComparisonFrom).Should().Be(result.To - result.From);
    }

    [Fact]
    public void This_year_compares_same_elapsed_window_in_previous_year()
    {
        var now = new DateTime(2026, 7, 27, 12, 0, 0, DateTimeKind.Utc);
        var result = AnalyticsPeriodResolver.Resolve(new AnalyticsQuery { Range = "ThisYear" }, now);
        result.From.Should().Be(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        result.ComparisonFrom.Year.Should().Be(2025);
        result.ComparisonTo.Should().Be(now.AddYears(-1));
    }

    [Fact]
    public void Previous_year_is_a_full_calendar_year()
    {
        var result = AnalyticsPeriodResolver.Resolve(
            new AnalyticsQuery { Range = "PreviousYear" },
            new DateTime(2026, 7, 27, 0, 0, 0, DateTimeKind.Utc));
        result.From.Should().Be(new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        result.To.Should().Be(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void Custom_range_requires_an_ordered_pair()
    {
        var action = () => AnalyticsPeriodResolver.Resolve(new AnalyticsQuery
        {
            Range = "Custom",
            From = new DateTime(2026, 2, 1),
            To = new DateTime(2026, 1, 1),
        }, DateTime.UtcNow);
        action.Should().Throw<ArgumentException>().WithMessage("*earlier*");
    }

    [Fact]
    public void Change_is_not_fabricated_when_comparison_is_zero()
        => AnalyticsMath.Change(10, 0).Should().BeNull();

    [Fact]
    public void Zero_to_zero_change_is_zero()
        => AnalyticsMath.Change(0, 0).Should().Be(0);

    [Fact]
    public void Rate_is_percentage_and_handles_empty_denominator()
    {
        AnalyticsMath.Rate(1, 4).Should().Be(25);
        AnalyticsMath.Rate(0, 0).Should().Be(0);
    }

    [Fact]
    public void Not_tracked_metric_has_no_numeric_value()
    {
        var metric = AnalyticsMetricResponse.NotTracked("No source exists.", "percent");
        metric.State.Should().Be("notTracked");
        metric.Value.Should().BeNull();
        metric.PreviousValue.Should().BeNull();
        metric.ChangePercentage.Should().BeNull();
    }

    [Fact]
    public void Unavailable_tracking_makes_first_three_growth_rules_unavailable()
    {
        var result = GrowthObservationRules.Evaluate(null, null, null, null, null, 20);
        result.Observations.Should().BeEmpty();
        result.UnavailableRules.Should().BeEquivalentTo(
            GrowthObservationRules.ServiceConversionRule,
            GrowthObservationRules.ProfileContactRule,
            GrowthObservationRules.ProposalVisibilityRule);
    }

    [Fact]
    public void Repeat_client_rule_is_display_time_positive_reinforcement()
    {
        var result = GrowthObservationRules.Evaluate(null, null, null, null, null, 31);
        result.Observations.Should().ContainSingle(x =>
            x.RuleId == GrowthObservationRules.RepeatClientRule && x.Tone == "positive");
    }

    [Fact]
    public void Repeat_client_rule_threshold_is_strictly_greater_than_thirty()
        => GrowthObservationRules.Evaluate(null, null, null, null, null, 30)
            .Observations.Should().BeEmpty();

    [Fact]
    public void All_four_growth_rules_are_deterministic()
    {
        var result = GrowthObservationRules.Evaluate(501, 9, 1001, 4, 39, 31);
        result.Observations.Select(x => x.RuleId).Should().BeEquivalentTo(
            GrowthObservationRules.ServiceConversionRule,
            GrowthObservationRules.ProfileContactRule,
            GrowthObservationRules.ProposalVisibilityRule,
            GrowthObservationRules.RepeatClientRule);
        result.UnavailableRules.Should().BeEmpty();
    }

    [Fact]
    public void Growth_task_schema_matches_the_single_stateful_exception()
    {
        typeof(GrowthTask).GetProperties().Select(x => x.Name).Should().BeEquivalentTo(new[]
        {
            "Id", "ProviderId", "TaskType", "Title", "Description", "Status",
            "TriggerRuleId", "RelatedEntityType", "RelatedEntityId", "CreatedAt",
            "UpdatedAt", "ExpiresAt",
        });
    }

    [Fact]
    public void Growth_task_is_provider_owned_and_serializes_as_one_document()
    {
        var document = new GrowthTask
        {
            Id = ObjectId.GenerateNewId().ToString(),
            ProviderId = "provider-1",
            Title = "Refresh portfolio",
            Description = "Add recent work",
        }.ToBsonDocument();
        document["ProviderId"].AsString.Should().Be("provider-1");
        document["Status"].Should().NotBeNull();
    }

    [Theory]
    [InlineData(GrowthTaskStatus.Open)]
    [InlineData(GrowthTaskStatus.InProgress)]
    [InlineData(GrowthTaskStatus.Completed)]
    [InlineData(GrowthTaskStatus.Dismissed)]
    [InlineData(GrowthTaskStatus.Expired)]
    public void Growth_task_supports_the_approved_statuses(GrowthTaskStatus status)
        => Enum.IsDefined(status).Should().BeTrue();

    [Fact]
    public void Dashboard_discloses_the_test_provenance_limitation()
    {
        var response = new AnalyticsDashboardResponse();
        response.IncludesRecordsWithoutTestProvenance.Should().BeTrue();
        response.DataLimitation.Should().Contain("cannot exclude test records");
    }

    [Fact]
    public void Analytics_contract_surfaces_real_detail_views_without_new_event_claims()
    {
        var response = new AnalyticsDashboardResponse();

        response.Profile.TierMeaning.Should().Contain("ranking").And.NotContain("commission");
        response.Proposals.ProposalViewRate.Value.Should().BeNull();
        response.Services.Should().BeEmpty();
        response.AvailableCurrencies.Should().BeEmpty();
    }

    [Fact]
    public void Analytics_detail_contract_includes_all_current_proposal_statuses()
    {
        var names = typeof(ProposalAnalyticsResponse).GetProperties().Select(x => x.Name);

        names.Should().Contain(new[]
        {
            "Drafts", "Submitted", "Viewed", "ChangesRequested", "Revised",
            "ClientReviewing", "Accepted", "Declined", "Withdrawn", "Expired",
            "ConvertedToProject",
        });
    }

    [Fact]
    public void Analytics_detail_contract_has_no_commission_rate_field()
    {
        var contracts = new[]
        {
            typeof(AnalyticsDashboardResponse), typeof(ServiceAnalyticsItemResponse),
            typeof(ProfileAnalyticsResponse), typeof(ProposalAnalyticsResponse),
            typeof(RevenueAnalyticsResponse), typeof(ClientAnalyticsResponse),
        };

        contracts.SelectMany(x => x.GetProperties()).Select(x => x.Name)
            .Should().NotContain(x => x.Contains("CommissionRate", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Analytics_history_gate_defaults_to_not_ready_without_a_verified_at_timestamp()
    {
        var response = new AnalyticsDashboardResponse();
        response.HistoryStartedAt.Should().BeNull();
        response.HasMinimumHistory.Should().BeFalse();
    }

    [Fact]
    public void Module_five_does_not_retrofit_test_provenance_onto_upstream_entities()
    {
        var upstream = new[] { typeof(Proposal), typeof(WorkroomEngagement), typeof(FinancialTransaction), typeof(ServiceListing) };
        upstream.SelectMany(x => x.GetProperties()).Select(x => x.Name)
            .Should().NotContain(x => x.Contains("IsTest", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Brief_based_work_has_an_explicit_custom_unattributed_bucket()
        => AnalyticsService.CustomServiceLabel.Should().Be("Custom/Unattributed");

    [Fact]
    public void Analytics_controller_requires_authorization()
        => typeof(AnalyticsController).GetCustomAttributes(typeof(AuthorizeAttribute), true)
            .Should().ContainSingle();

    [Fact]
    public void Provider_overview_has_a_dedicated_authenticated_api_route()
    {
        var action = typeof(AnalyticsController).GetMethod(nameof(AnalyticsController.Overview));
        action.Should().NotBeNull();
        action!.GetCustomAttributes(typeof(HttpGetAttribute), true)
            .Cast<HttpGetAttribute>().Should().ContainSingle(x => x.Template == "overview");
    }

    [Fact]
    public void Provider_overview_contract_keeps_untracked_states_numeric_free()
    {
        var response = new ProviderDashboardResponse
        {
            ServiceViews = new ProviderDashboardServiceViewsResponse
            {
                State = "notTracked",
                Impressions = null,
                Clicks = null,
                Reason = "No dated events exist.",
            },
            TierProgress = new ProviderDashboardProgressResponse
            {
                State = "notTracked",
                Value = null,
                Detail = "No tier progression rule exists.",
            },
        };

        response.ServiceViews.Impressions.Should().BeNull();
        response.ServiceViews.Clicks.Should().BeNull();
        response.TierProgress.Value.Should().BeNull();
    }

    private static ClientRelationshipCalculator Calculator() => new();

    private static WorkroomEngagement Engagement(string clientId, EngagementStatus status) => new()
    {
        ClientId = clientId,
        EngagementStatus = status,
    };
}
