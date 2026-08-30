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
            // Base industry multiple
            var baseMultiple = _industryMultipliers.ContainsKey(industrySegment?.ToLower() ?? "other")
                ? _industryMultipliers[industrySegment.ToLower()]
                : _industryMultipliers["other"];

            // --- PRE-REVENUE VALUATION (Scorecard / Factor Methodology) ---
            if (totalRevenue <= 0)
            {
                // Base pre-revenue baseline by industry
                double preRevenueBase = Math.Round(750_000 * (baseMultiple / 3.0), 0);

                // Stage / Product Readiness Factor
                double stageFactor = context.Stage?.ToLowerInvariant() switch
                {
                    "beta" => 400_000,
                    "mvp" => 250_000,
                    "idea" => 100_000,
                    _ => 150_000
                };

                // Founding Team / Governance Factor
                double teamFactor = (context.FounderCount >= 2 ? 200_000 : 100_000)
                                  + (context.LargestOwnershipPct <= 80 ? 100_000 : 0);

                // Legal & Regulatory Readiness Factor
                double legalFactor = (context.IsLegalEntityFormed ? 150_000 : 0)
                                   + (context.DocumentsVerified ? 150_000 : 0);

                // Market / Investor Traction Factor
                double tractionFactor = context.NdaSignedCount > 0 ? 100_000 : 0;

                double preDiscountValuation = preRevenueBase + stageFactor + teamFactor + legalFactor + tractionFactor;

                // Additive Risk Discount system
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

                double riskDiscountAmount = preDiscountValuation * riskDiscountRate;
                double finalValuation = preDiscountValuation - riskDiscountAmount;

                // Pre-revenue confidence score: transparently reflects heuristic baseline (45-60)
                int confidenceScore = 45;
                if (context.IsLegalEntityFormed) confidenceScore += 5;
                if (context.DocumentsVerified) confidenceScore += 5;
                if (context.FounderCount >= 2) confidenceScore += 5;
                confidenceScore = Math.Clamp(confidenceScore, 0, 100);

                return new ValuationResult
                {
                    EstimatedValuation = Math.Round(finalValuation, 2),
                    RevenueMultiple = 0.0,
                    RiskDiscountRate = riskDiscountRate,
                    ConfidenceScore = confidenceScore,
                    Rationale = $"Pre-Revenue Scorecard: Base {preRevenueBase:C0} ({industrySegment}) + Stage {stageFactor:C0} ({context.Stage}) + Team {teamFactor:C0} + Legal {legalFactor:C0} + Traction {tractionFactor:C0} − {riskDiscountRate:P0} risk discount"
                };
            }

            // --- REVENUE-GENERATING VALUATION (Revenue Multiple Methodology) ---
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
            double revenueRiskDiscountRate = 0.0;
            if (context.Stage is "idea" or "mvp") revenueRiskDiscountRate += 0.05;
            if (!context.IsLegalEntityFormed) revenueRiskDiscountRate += 0.03;
            if (context.FounderCount <= 1) revenueRiskDiscountRate += 0.02;
            if (context.KpiDataSource == "manual") revenueRiskDiscountRate += 0.02;
            if (context.RevenueEnteredManually) revenueRiskDiscountRate += 0.01;
            if (context.DocumentsVerified) revenueRiskDiscountRate -= 0.02;
            if (context.NdaSignedCount > 3) revenueRiskDiscountRate -= 0.01;
            if (context.LargestOwnershipPct > 80) revenueRiskDiscountRate += 0.03;
            else if (context.LargestOwnershipPct <= 50) revenueRiskDiscountRate -= 0.01;
            revenueRiskDiscountRate = Math.Clamp(revenueRiskDiscountRate, 0.0, 0.25);

            double revenuePreDiscountValuation = baseValuation * growthAdjustment;
            double revenueRiskDiscountAmount = revenuePreDiscountValuation * revenueRiskDiscountRate;
            double revenueFinalValuation = revenuePreDiscountValuation - revenueRiskDiscountAmount;

            // Confidence score: how trustworthy the valuation inputs are.
            int revenueConfidenceScore = 60;
            bool allQuartersPresent = context.Q1 > 0 && context.Q2 > 0
                                      && context.Q3 > 0 && context.Q4 > 0;
            if (allQuartersPresent) revenueConfidenceScore += 15;
            if (context.KpiDataSource != "manual") revenueConfidenceScore += 15;
            if ((context.Q4 - context.Q1) / Math.Max(context.Q1, 1) > 0.30)
                revenueConfidenceScore += 10;
            revenueConfidenceScore = Math.Clamp(revenueConfidenceScore, 0, 100);

            return new ValuationResult
            {
                EstimatedValuation = revenueFinalValuation,
                RevenueMultiple = baseMultiple,
                RiskDiscountRate = revenueRiskDiscountRate,
                ConfidenceScore = revenueConfidenceScore,
                Rationale = $"Revenue {totalRevenue:C} × {baseMultiple}x {industrySegment} multiple × {growthAdjustment:F2} growth adj (weight {growthWeight:F1}) − {revenueRiskDiscountRate:P0} risk discount"
            };
        });
    }
}
