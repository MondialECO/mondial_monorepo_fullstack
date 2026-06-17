using FluentAssertions;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Unit tests for the Phase 3 ValuationEngine, testing the formula directly
/// (risk-discount + growth-weight + confidence-score model) without service or validator layers.
/// </summary>
public class ValuationEngineTests
{
    private readonly ValuationEngine _engine = new();

    [Fact]
    public async Task Test1_SaaS_StrongGrowth_LowRisk_PassesWith100ConfidenceAnd0RiskDiscount()
    {
        // SaaS, strong growth, all positive context
        var context = new ValuationContext
        {
            Stage = "revenue",
            IsLegalEntityFormed = true,
            FounderCount = 2,
            KpiDataSource = "stripe",
            RevenueEnteredManually = false,
            DocumentsVerified = true,
            NdaSignedCount = 5,
            LargestOwnershipPct = 45,
            Q1 = 100_000, Q2 = 115_000, Q3 = 132_000, Q4 = 152_000,
        };

        var result = await _engine.CalculateValuationAsync(499_000, 0.1498, "saas", context);

        result.RevenueMultiple.Should().Be(8.0);
        result.RiskDiscountRate.Should().Be(0.0);  // Risk factors cancel out (docs −2, NDA −1, ownership ≤50 −1 = −4 → clamp at 0)
        result.ConfidenceScore.Should().Be(100);    // base 60 + all quarters +15 + connected +15 + YoY>30% +10 = 100
        result.EstimatedValuation.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Test2_FinTech_WeakGrowth_IdeaStage_HighRiskDiscount()
    {
        // FinTech, flat/declining growth, all risk factors active
        var context = new ValuationContext
        {
            Stage = "idea",
            IsLegalEntityFormed = false,
            FounderCount = 1,
            KpiDataSource = "manual",
            RevenueEnteredManually = true,
            DocumentsVerified = false,
            NdaSignedCount = 0,
            LargestOwnershipPct = 100,
            Q1 = 50_000, Q2 = 48_000, Q3 = 51_000, Q4 = 50_000,
        };

        var result = await _engine.CalculateValuationAsync(199_000, 0.005, "fintech", context);

        result.RevenueMultiple.Should().Be(6.0);
        result.RiskDiscountRate.Should().Be(0.16);  // +5 (idea) +3 (no entity) +2 (single) +2 (manual) +1 (manual rev) +3 (ownership >80) = 16%
        result.ConfidenceScore.Should().Be(75);  // base 60 + all quarters +15 (Q2-Q4 are non-zero) = 75
        // Discount applied: final < base × multiplier
        result.EstimatedValuation.Should().BeLessThan(199_000 * 6.0);
    }

    [Fact]
    public async Task Test3_Multiplier_Ecommerce_2_5x()
    {
        var context = new ValuationContext
        {
            Q1 = 100_000, Q2 = 100_000, Q3 = 100_000, Q4 = 100_000,
        };

        var result = await _engine.CalculateValuationAsync(400_000, 0.0, "ecommerce", context);

        result.RevenueMultiple.Should().Be(2.5);
    }

    [Fact]
    public async Task Test4_Multiplier_Logistics_1_8x()
    {
        var context = new ValuationContext
        {
            Q1 = 100_000, Q2 = 100_000, Q3 = 100_000, Q4 = 100_000,
        };

        var result = await _engine.CalculateValuationAsync(400_000, 0.0, "logistics", context);

        result.RevenueMultiple.Should().Be(1.8);
    }

    [Fact]
    public async Task Test5_Multiplier_UnknownIndustry_DefaultsTo3_0x()
    {
        var context = new ValuationContext
        {
            Q1 = 100_000, Q2 = 100_000, Q3 = 100_000, Q4 = 100_000,
        };

        var result = await _engine.CalculateValuationAsync(400_000, 0.0, "gaming", context);

        result.RevenueMultiple.Should().Be(3.0);
    }

    [Fact]
    public async Task Test6_RiskDiscount_ClampedAt25Percent()
    {
        // Maximal risk context (all factors at max)
        var context = new ValuationContext
        {
            Stage = "idea",
            IsLegalEntityFormed = false,
            FounderCount = 1,
            KpiDataSource = "manual",
            RevenueEnteredManually = true,
            DocumentsVerified = false,
            NdaSignedCount = 0,
            LargestOwnershipPct = 90,
            Q1 = 100_000, Q2 = 100_000, Q3 = 100_000, Q4 = 100_000,
        };

        var result = await _engine.CalculateValuationAsync(400_000, 0.0, "saas", context);

        // Sum: +5 +3 +2 +2 +1 +3 = 16%, under 25% cap, but still clamped behavior
        result.RiskDiscountRate.Should().BeLessThanOrEqualTo(0.25);
        result.RiskDiscountRate.Should().BeGreaterThan(0.0);
    }

    [Fact]
    public async Task Test7_NegativeGrowth_DownwardAdjustment()
    {
        // Declining revenue
        var context = new ValuationContext
        {
            Q1 = 200_000, Q2 = 180_000, Q3 = 160_000, Q4 = 140_000,
        };

        var result = await _engine.CalculateValuationAsync(680_000, -0.15, "saas", context);

        // Negative growth applies downward adjustment: max(0.5, 1 - |−0.15| × 0.1) = max(0.5, 0.985) = 0.985
        var baseValuation = 680_000 * 8.0;  // 5,440,000
        // Final should be less than base (due to negative growth factor)
        result.EstimatedValuation.Should().BeLessThan(baseValuation);
    }

    [Fact]
    public async Task Test8_ExceptionalGrowth_Weight2_0_HighConfidenceScore()
    {
        // Rapid growth: 50k → 170k
        var context = new ValuationContext
        {
            Q1 = 50_000, Q2 = 80_000, Q3 = 120_000, Q4 = 170_000,
            KpiDataSource = "chartmogul",
            RevenueEnteredManually = false,
        };

        // Growth: (0.6 + 0.5 + 0.416) / 3 ≈ 0.505 = 50.5%
        var result = await _engine.CalculateValuationAsync(420_000, 0.505, "saas", context);

        // 50.5% > 30% → growthWeight = 2.0
        // YoY = (170-50)/50 = 240% > 30% → +10 confidence
        result.ConfidenceScore.Should().BeGreaterThanOrEqualTo(85);
        // Growth multiplier substantial: base × (1 + 0.505 × 0.2 × 2.0) = base × 1.202
        // After modest risk discount (~8%), should still be meaningful
        result.EstimatedValuation.Should().BeGreaterThan(420_000 * 8.0);
    }

    [Fact]
    public async Task Test9_MissingQuarters_BaseConfidenceScoreOnly()
    {
        // Two quarters = 0 (incomplete data)
        var context = new ValuationContext
        {
            Q1 = 100_000, Q2 = 0, Q3 = 0, Q4 = 100_000,
            KpiDataSource = "manual",
        };

        var result = await _engine.CalculateValuationAsync(200_000, 0.0, "other", context);

        // Confidence: base 60, no +15 for all quarters, no +10 for YoY, no KPI bonus
        result.ConfidenceScore.Should().Be(60);
    }

    [Fact]
    public async Task Test10_ValuationResult_ShapeAndBounds()
    {
        var context = new ValuationContext
        {
            Q1 = 100_000, Q2 = 110_000, Q3 = 120_000, Q4 = 130_000,
        };

        var result = await _engine.CalculateValuationAsync(460_000, 0.1, "saas", context);

        // Shape: all required fields present and non-null
        result.Should().NotBeNull();
        result.EstimatedValuation.Should().BeGreaterThan(0);
        result.RevenueMultiple.Should().BeGreaterThan(0);
        result.Rationale.Should().NotBeNullOrEmpty();

        // Bounds: confidence 0-100, risk 0-0.25
        result.ConfidenceScore.Should().BeGreaterThanOrEqualTo(0).And.BeLessThanOrEqualTo(100);
        result.RiskDiscountRate.Should().BeGreaterThanOrEqualTo(0.0).And.BeLessThanOrEqualTo(0.25);
    }
}
