using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Floors for money that reaches a buyer's total or a funded milestone. Only the base
/// package price had one; add-on prices, the additional-revision price and individual
/// milestone amounts were unchecked, so a negative value could cut the amount charged —
/// and the 12% commission base with it — while the totals still looked plausible.
/// </summary>
public class MoneyPositivityRulesTests
{
    private static ServicePackage Package(decimal price = 1000m) => new()
    {
        PackageTitle = "Basic",
        Price = price,
        Currency = "EUR",
        DeliveryTimeValue = 5,
        RevisionRequestWindowDays = 3,
    };

    private static ProposalMilestonePlanItem Item(decimal amount, int order = 0) =>
        new() { Title = $"M{order}", Amount = amount, DisplayOrder = order };

    // ---- package publish money rules ----

    [Fact]
    public void A_sound_package_has_no_missing_money_requirements()
        => MoneyPositivityRules.MissingMoneyRequirements(Package()).Should().BeEmpty();

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void A_non_positive_base_price_blocks_publish(decimal price)
        => MoneyPositivityRules.MissingMoneyRequirements(Package(price))
            .Should().ContainSingle().Which.Should().Contain("price");

    [Fact]
    public void A_negative_enabled_add_on_blocks_publish()
    {
        var pkg = Package();
        pkg.AddOns = new() { new ServiceAddOn { Name = "Discount", Price = -900m, Enabled = true } };

        MoneyPositivityRules.MissingMoneyRequirements(pkg)
            .Should().ContainSingle().Which.Should().Contain("add-on");
    }

    /// <summary>
    /// Zero is a legitimate offer — a genuinely free add-on — so the floor is "not
    /// negative", not "positive".
    /// </summary>
    [Fact]
    public void A_free_add_on_is_allowed()
    {
        var pkg = Package();
        pkg.AddOns = new() { new ServiceAddOn { Name = "Bonus", Price = 0m, Enabled = true } };

        MoneyPositivityRules.MissingMoneyRequirements(pkg).Should().BeEmpty();
    }

    /// <summary>
    /// A disabled add-on cannot be selected at purchase (LeadsService filters on Enabled),
    /// so it cannot reach the total and must not block publishing.
    /// </summary>
    [Fact]
    public void A_negative_but_disabled_add_on_does_not_block_publish()
    {
        var pkg = Package();
        pkg.AddOns = new() { new ServiceAddOn { Name = "Old", Price = -50m, Enabled = false } };

        MoneyPositivityRules.MissingMoneyRequirements(pkg).Should().BeEmpty();
    }

    [Fact]
    public void A_negative_additional_revision_price_blocks_publish_when_offered()
    {
        var pkg = Package();
        pkg.AdditionalRevisionAvailable = true;
        pkg.AdditionalRevisionPrice = -75m;

        MoneyPositivityRules.MissingMoneyRequirements(pkg)
            .Should().ContainSingle().Which.Should().Contain("additional-revision");
    }

    /// <summary>Not offered means it can never be charged, so it is not a publish blocker.</summary>
    [Fact]
    public void A_negative_additional_revision_price_is_ignored_when_not_offered()
    {
        var pkg = Package();
        pkg.AdditionalRevisionAvailable = false;
        pkg.AdditionalRevisionPrice = -75m;

        MoneyPositivityRules.MissingMoneyRequirements(pkg).Should().BeEmpty();
    }

    [Fact]
    public void Every_money_failure_is_reported_at_once_not_one_at_a_time()
    {
        var pkg = Package(0m);
        pkg.AddOns = new() { new ServiceAddOn { Name = "Discount", Price = -1m, Enabled = true } };
        pkg.AdditionalRevisionAvailable = true;
        pkg.AdditionalRevisionPrice = -1m;

        MoneyPositivityRules.MissingMoneyRequirements(pkg).Should().HaveCount(3);
    }

    // ---- milestone plan rules ----

    [Fact]
    public void A_plan_that_sums_correctly_with_positive_items_is_valid()
        => MoneyPositivityRules.ValidateMilestonePlan(
                new[] { Item(400m), Item(600m, 1) }, 1000m)
            .Should().BeNull();

    [Fact]
    public void An_empty_plan_is_valid_because_conversion_synthesises_one()
        => MoneyPositivityRules.ValidateMilestonePlan(Array.Empty<ProposalMilestonePlanItem>(), 1000m)
            .Should().BeNull();

    [Fact]
    public void A_plan_whose_items_do_not_sum_to_the_price_is_rejected()
        => MoneyPositivityRules.ValidateMilestonePlan(new[] { Item(400m) }, 1000m)
            .Should().Contain("equal the accepted proposal price");

    /// <summary>
    /// The exploit the sum check alone allowed: offsetting amounts total correctly, so it
    /// passed, while leaving a negative milestone that would authorise negative escrow and
    /// book a negative commission row at release.
    /// </summary>
    [Fact]
    public void A_negative_item_offset_by_a_larger_positive_one_is_rejected_despite_summing()
    {
        var plan = new[] { Item(-500m), Item(1500m, 1) };

        plan.Sum(x => x.Amount).Should().Be(1000m, "the plan sums correctly — that is the point");
        MoneyPositivityRules.ValidateMilestonePlan(plan, 1000m)
            .Should().Be(MoneyPositivityRules.NonPositiveMilestoneMessage);
    }

    [Fact]
    public void A_zero_amount_milestone_is_rejected()
        => MoneyPositivityRules.ValidateMilestonePlan(new[] { Item(0m), Item(1000m, 1) }, 1000m)
            .Should().Be(MoneyPositivityRules.NonPositiveMilestoneMessage);

    /// <summary>
    /// Conversion runs this after substituting the fallback milestone, which carries
    /// ProposedPrice verbatim — so a non-positive proposal price is caught here rather than
    /// creating a non-positive milestone unchecked.
    /// </summary>
    [Fact]
    public void The_synthesised_fallback_milestone_is_covered_by_the_same_rule()
        => MoneyPositivityRules.ValidateMilestonePlan(new[] { Item(0m) }, 0m)
            .Should().Be(MoneyPositivityRules.NonPositiveMilestoneMessage);

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    public void The_submission_time_check_flags_non_positive_items(decimal amount)
        => MoneyPositivityRules.HasNonPositiveMilestone(new[] { Item(amount) }).Should().BeTrue();

    [Fact]
    public void The_submission_time_check_ignores_the_sum_rule()
        => MoneyPositivityRules.HasNonPositiveMilestone(new[] { Item(1m) }).Should().BeFalse(
            "submission has never enforced the sum, and this batch does not change that");
}
