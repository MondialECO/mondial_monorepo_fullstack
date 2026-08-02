using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>A suggested price band. Guidance only — never a quote.</summary>
public readonly record struct PriceRange(decimal Min, decimal Max, string Currency);

/// <summary>
/// Deterministic suggested-price-range lookup by <see cref="ServiceCategory"/>, optionally
/// refined by <see cref="PricingModel"/> (canon §6.1). **No AI, ever; no competitor
/// benchmark** (§2) — a static in-code table, guidance not a quote. The baseline numbers
/// are provisional placeholders; the mechanism (deterministic, testable) is the point.
/// Swapping the table for a data-backed source later is a localized change behind Suggest().
/// </summary>
public static class PricingGuidance
{
    // Per-category PROJECT-level bands (EUR). Placeholder values.
    private static readonly Dictionary<ServiceCategory, (decimal Min, decimal Max)> ProjectBands = new()
    {
        [ServiceCategory.Development] = (800m, 8000m),
        [ServiceCategory.Design] = (400m, 5000m),
        [ServiceCategory.Marketing] = (300m, 4000m),
        [ServiceCategory.Legal] = (500m, 6000m),
        [ServiceCategory.Finance] = (500m, 6000m),
        [ServiceCategory.Accounting] = (300m, 3000m),
        [ServiceCategory.Operations] = (400m, 4000m),
        [ServiceCategory.Strategy] = (600m, 7000m),
        [ServiceCategory.DueDiligence] = (700m, 8000m),
        [ServiceCategory.FundraisingSupport] = (800m, 10000m),
        [ServiceCategory.AiAutomation] = (600m, 7000m),
        [ServiceCategory.HrRecruitment] = (400m, 4000m),
        [ServiceCategory.Other] = (300m, 3000m),
    };

    /// <summary>
    /// Suggested range for a category, optionally refined by pricing model. Project-style
    /// models (FixedPrice/ProjectBased/EquityCompensation/RevenueShare/Other/none) return the
    /// project band; Hourly returns a deterministic hourly band (project ÷ 50 … ÷ 20);
    /// MonthlyRetainer returns roughly half the project band (monthly cadence). Deterministic.
    /// </summary>
    public static PriceRange Suggest(ServiceCategory category, PricingModel? model = null, string currency = "EUR")
    {
        var band = ProjectBands.TryGetValue(category, out var b) ? b : (Min: 300m, Max: 3000m);

        var (min, max) = model switch
        {
            PricingModel.Hourly => (Math.Round(band.Min / 50m), Math.Round(band.Max / 20m)),
            PricingModel.MonthlyRetainer => (Math.Round(band.Min / 2m), Math.Round(band.Max / 2m)),
            _ => (band.Min, band.Max),
        };

        return new PriceRange(min, max, currency);
    }
}
