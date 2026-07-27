using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

// Module 2 (canon §6.3). 2024-01-01 is a Monday — the anchor for business-day assertions.
public class DeliveryScheduleCalculatorTests
{
    private static readonly DateTime Monday = new(2024, 1, 1); // Mon

    [Fact]
    public void AddBusinessDays_skips_weekend()
    {
        // Mon + 5 business days = next Mon (skips Sat 6th, Sun 7th).
        DeliveryScheduleCalculator.AddBusinessDays(Monday, 5).Should().Be(new DateTime(2024, 1, 8));
        // Fri 2024-01-05 + 1 business day = Mon 2024-01-08.
        DeliveryScheduleCalculator.AddBusinessDays(new DateTime(2024, 1, 5), 1).Should().Be(new DateTime(2024, 1, 8));
    }

    [Fact]
    public void AddBusinessDays_skips_holidays()
    {
        var holidays = new HashSet<DateOnly> { new(2024, 1, 2) }; // Tue is a holiday
        // Mon + 1 business day would be Tue, but Tue is a holiday → Wed 2024-01-03.
        DeliveryScheduleCalculator.AddBusinessDays(Monday, 1, holidays).Should().Be(new DateTime(2024, 1, 3));
    }

    [Fact]
    public void ComputeDueDate_calendar_days_is_a_plain_add()
        => DeliveryScheduleCalculator.ComputeDueDate(Monday, 10, DeliveryTimeUnit.Days, DeliveryDayType.CalendarDays)
            .Should().Be(Monday.AddDays(10));

    [Fact]
    public void ComputeDueDate_business_days_with_addon_and_extension()
    {
        // 10 business days + 2 add-on + 1 extension = 13 business days from Mon 2024-01-01.
        var due = DeliveryScheduleCalculator.ComputeDueDate(
            Monday, 10, DeliveryTimeUnit.Days, DeliveryDayType.BusinessDays,
            addOnAdjustmentDays: 2, extensionDays: 1);
        due.Should().Be(DeliveryScheduleCalculator.AddBusinessDays(Monday, 13));
    }

    [Fact]
    public void ComputeDueDate_weeks_business_is_five_days_each()
        => DeliveryScheduleCalculator.ComputeDueDate(Monday, 2, DeliveryTimeUnit.Weeks, DeliveryDayType.BusinessDays)
            .Should().Be(DeliveryScheduleCalculator.AddBusinessDays(Monday, 10));

    [Theory]
    [InlineData(false, false, DeliveryClockState.NotStarted)] // not started
    public void ComputeState_not_started(bool started, bool delivered, DeliveryClockState expected)
        => DeliveryScheduleCalculator.ComputeState(Monday, Monday.AddDays(5), started, delivered).Should().Be(expected);

    [Fact]
    public void ComputeState_covers_delivered_overdue_today_soon_inprogress()
    {
        var now = new DateTime(2024, 1, 10, 9, 0, 0);
        DeliveryScheduleCalculator.ComputeState(now, now.AddDays(5), started: true, delivered: true).Should().Be(DeliveryClockState.Delivered);
        DeliveryScheduleCalculator.ComputeState(now, now.AddDays(-1), true, false).Should().Be(DeliveryClockState.Overdue);
        DeliveryScheduleCalculator.ComputeState(now, now.Date.AddHours(18), true, false).Should().Be(DeliveryClockState.DueToday);
        DeliveryScheduleCalculator.ComputeState(now, now.AddHours(30), true, false).Should().Be(DeliveryClockState.DueSoon);
        DeliveryScheduleCalculator.ComputeState(now, now.AddDays(10), true, false).Should().Be(DeliveryClockState.InProgress);
    }
}
