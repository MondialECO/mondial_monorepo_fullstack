namespace WebApp.Services.Implementations;

public class ValuationEngine : IValuationEngine
{
    private readonly Dictionary<string, double> _industryMultipliers = new()
    {
        { "saas", 8.0 },
        { "ecommerce", 2.5 },
        { "fintech", 6.0 },
        { "healthtech", 5.5 },
        { "edtech", 4.5 },
        { "logistics", 1.8 },
        { "marketplace", 3.5 },
        { "other", 3.0 }
    };

    public async Task<ValuationResult> CalculateValuationAsync(
        double totalRevenue,
        double growthRate,
        string industrySegment,
        int runwayMonths)
    {
        return await Task.Run(() =>
        {
            // Base valuation: revenue * industry multiple
            var baseMultiple = _industryMultipliers.ContainsKey(industrySegment?.ToLower() ?? "other")
                ? _industryMultipliers[industrySegment.ToLower()]
                : _industryMultipliers["other"];

            var baseValuation = totalRevenue * baseMultiple;

            // Growth adjustment: faster growth = higher multiple
            var growthAdjustment = growthRate > 0
                ? 1 + (Math.Min(growthRate, 2.0) * 0.2)  // Up to +40% for extreme growth
                : Math.Max(0.5, 1 - (Math.Abs(growthRate) * 0.1));  // Down to -10% for decline

            var growthAdjustedValuation = baseValuation * growthAdjustment;

            // Runway adjustment: better runway = better valuation
            var runwayAdjustment = runwayMonths > 36 ? 1.15 : // Strong position
                                   runwayMonths > 24 ? 1.0 :
                                   runwayMonths > 12 ? 0.9 :
                                   runwayMonths > 6 ? 0.75 : 0.5;

            var finalValuation = growthAdjustedValuation * runwayAdjustment;

            return new ValuationResult
            {
                EstimatedValuation = finalValuation,
                RevenueMultiple = baseMultiple,
                Rationale = $"Revenue {totalRevenue:C} × {baseMultiple}x {industrySegment} multiple × {growthAdjustment:F2} growth adjustment × {runwayAdjustment:F2} runway adjustment"
            };
        });
    }
}
