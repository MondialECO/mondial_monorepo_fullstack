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
        ValuationContext context)
    {
        return await Task.Run(() =>
        {
            // Base valuation: revenue * industry multiple
            var baseMultiple = _industryMultipliers.ContainsKey(industrySegment?.ToLower() ?? "other")
                ? _industryMultipliers[industrySegment.ToLower()]
                : _industryMultipliers["other"];

            var baseValuation = totalRevenue * baseMultiple;

            // Growth weight classifier (growthRate is a fraction, e.g. 0.20 = 20%).
            double growthRatePct = growthRate * 100;
            double growthWeight =
                growthRatePct < 5 ? 0.5 :
                growthRatePct < 15 ? 1.0 :
                growthRatePct < 30 ? 1.5 : 2.0;

            // Growth adjustment: faster growth = higher multiple, weighted.
            var growthAdjustment = growthRate > 0
                ? 1 + (Math.Min(growthRate, 2.0) * 0.2 * growthWeight)
                : Math.Max(0.5, 1 - (Math.Abs(growthRate) * 0.1));  // Down to -10% for decline

            // Additive Risk Discount system (replaces the old runway adjustment).
            double riskDiscountRate = 0.0;
            if (context.Stage is "idea" or "mvp") riskDiscountRate += 0.05;
            if (!context.IsLegalEntityFormed) riskDiscountRate += 0.03;
            if (context.FounderCount <= 1) riskDiscountRate += 0.02;
            if (context.KpiDataSource == "manual") riskDiscountRate += 0.02;
            if (context.RevenueEnteredManually) riskDiscountRate += 0.01;
            if (context.DocumentsVerified) riskDiscountRate -= 0.02;
            if (context.NdaSignedCount > 3) riskDiscountRate -= 0.01;
            if (context.LargestOwnershipPct > 80) riskDiscountRate += 0.03;
            else if (context.LargestOwnershipPct <= 50) riskDiscountRate -= 0.01;
            riskDiscountRate = Math.Clamp(riskDiscountRate, 0.0, 0.25);

            double preDiscountValuation = baseValuation * growthAdjustment;
            double riskDiscountAmount = preDiscountValuation * riskDiscountRate;
            double finalValuation = preDiscountValuation - riskDiscountAmount;

            // Confidence score: how trustworthy the valuation inputs are.
            int confidenceScore = 60;
            bool allQuartersPresent = context.Q1 > 0 && context.Q2 > 0
                                      && context.Q3 > 0 && context.Q4 > 0;
            if (allQuartersPresent) confidenceScore += 15;
            if (context.KpiDataSource != "manual") confidenceScore += 15;
            if ((context.Q4 - context.Q1) / Math.Max(context.Q1, 1) > 0.30)
                confidenceScore += 10;
            confidenceScore = Math.Clamp(confidenceScore, 0, 100);

            return new ValuationResult
            {
                EstimatedValuation = finalValuation,
                RevenueMultiple = baseMultiple,
                RiskDiscountRate = riskDiscountRate,
                ConfidenceScore = confidenceScore,
                Rationale = $"Revenue {totalRevenue:C} × {baseMultiple}x {industrySegment} multiple × {growthAdjustment:F2} growth adj (weight {growthWeight:F1}) − {riskDiscountRate:P0} risk discount"
            };
        });
    }
}
