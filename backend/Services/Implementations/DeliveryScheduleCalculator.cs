using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>Coarse delivery-clock state for due-date math (canon §6.3). The full
/// per-package state set (Waiting for Requirements/Escrow, Paused, …) is driven by
/// engagement conditions in Module 4; this calculator covers the time-based subset.</summary>
public enum DeliveryClockState
{
    NotStarted,
    InProgress,
    DueSoon,   // <48h remaining before the due date
    DueToday,
    Overdue,
    Delivered,
}

/// <summary>
/// Deterministic delivery-time math (canon §6.3): business-day stepping, the due-date
/// formula, and the time-based clock states. Built in Module 2 so Module 4 consumes it
/// rather than reimplementing. Pure functions — no I/O, no state. The delivery clock
/// only *starts* under Module-4 conditions ("Ready to Start"); nothing here fires live
/// in Module 2.
/// </summary>
public static class DeliveryScheduleCalculator
{
    /// <summary>Add <paramref name="days"/> business days, skipping Sat/Sun and any
    /// platform holidays. Negative counts step backwards (e.g. Priority Delivery).</summary>
    public static DateTime AddBusinessDays(DateTime from, int days, IReadOnlySet<DateOnly>? holidays = null)
    {
        if (days == 0) return from;
        var step = days > 0 ? 1 : -1;
        var remaining = Math.Abs(days);
        var cursor = from;
        while (remaining > 0)
        {
            cursor = cursor.AddDays(step);
            if (IsBusinessDay(cursor, holidays)) remaining--;
        }
        return cursor;
    }

    private static bool IsBusinessDay(DateTime d, IReadOnlySet<DateOnly>? holidays)
    {
        if (d.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) return false;
        return holidays is null || !holidays.Contains(DateOnly.FromDateTime(d));
    }

    /// <summary>
    /// Due Date = Start + Package Delivery Duration + Approved Add-on Delivery Time +
    /// Approved Extension Time (canon §6.3). Duration and adjustments are expressed in
    /// the package's <paramref name="dayType"/>. Weeks = ×5 business or ×7 calendar days.
    /// For an Hours unit, the base hours are added on top of the day-stepped date, and
    /// the add-on/extension day adjustments still apply in the day-type.
    /// </summary>
    public static DateTime ComputeDueDate(
        DateTime startUtc,
        int deliveryTimeValue,
        DeliveryTimeUnit unit,
        DeliveryDayType dayType,
        int addOnAdjustmentDays = 0,
        int extensionDays = 0,
        IReadOnlySet<DateOnly>? holidays = null)
    {
        var baseDays = unit switch
        {
            DeliveryTimeUnit.Days => deliveryTimeValue,
            DeliveryTimeUnit.Weeks => dayType == DeliveryDayType.BusinessDays ? deliveryTimeValue * 5 : deliveryTimeValue * 7,
            _ => 0, // Hours: no day component from the base; hours added below
        };

        var totalDays = baseDays + addOnAdjustmentDays + extensionDays;
        var due = dayType == DeliveryDayType.BusinessDays
            ? AddBusinessDays(startUtc, totalDays, holidays)
            : startUtc.AddDays(totalDays);

        if (unit == DeliveryTimeUnit.Hours) due = due.AddHours(deliveryTimeValue);
        return due;
    }

    /// <summary>Time-based clock state given the current time and the due date. The
    /// system reports state but never auto-extends, submits, or clears late (canon §6.3).</summary>
    public static DeliveryClockState ComputeState(DateTime nowUtc, DateTime dueUtc, bool started, bool delivered)
    {
        if (!started) return DeliveryClockState.NotStarted;
        if (delivered) return DeliveryClockState.Delivered;
        if (nowUtc.Date > dueUtc.Date) return DeliveryClockState.Overdue;
        if (nowUtc.Date == dueUtc.Date) return DeliveryClockState.DueToday;
        if (dueUtc - nowUtc < TimeSpan.FromHours(48)) return DeliveryClockState.DueSoon;
        return DeliveryClockState.InProgress;
    }
}
