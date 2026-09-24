using FluentAssertions;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class FinancialForecastEngineTests
{
    [Fact]
    public void SaaS_LaunchSubscribers_AffectsUnitTrajectoryAndRevenue()
    {
        var inputsLow = new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 50,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 3,
            Arpu = 30,
            VariableCost = 5,
            Opex = 5000
        };

        var inputsHigh = new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 150,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 3,
            Arpu = 30,
            VariableCost = 5,
            Opex = 5000
        };

        var resLow = FinancialForecastEngine.Calculate(inputsLow);
        var resHigh = FinancialForecastEngine.Calculate(inputsHigh);

        resLow.Monthly[0].Units.Should().Be(50);
        resLow.Monthly[0].Revenue.Should().Be(1500); // 50 * 30

        resHigh.Monthly[0].Units.Should().Be(150);
        resHigh.Monthly[0].Revenue.Should().Be(4500); // 150 * 30

        resHigh.Monthly[11].Revenue.Should().BeGreaterThan(resLow.Monthly[11].Revenue);
    }

    [Fact]
    public void SaaS_Churn_ReducesFutureSubscribersAndRevenue()
    {
        var inputsNoChurn = new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 100,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 0,
            Arpu = 50,
            VariableCost = 5,
            Opex = 5000
        };

        var inputsWithChurn = new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 100,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 5,
            Arpu = 50,
            VariableCost = 5,
            Opex = 5000
        };

        var resNoChurn = FinancialForecastEngine.Calculate(inputsNoChurn);
        var resWithChurn = FinancialForecastEngine.Calculate(inputsWithChurn);

        // Month 1 should have same launch subscribers
        resNoChurn.Monthly[0].Units.Should().Be(100);
        resWithChurn.Monthly[0].Units.Should().Be(100);

        // Month 2: no churn has 100 + 10 = 110
        // with churn has 100 + 10 - 5 = 105
        resNoChurn.Monthly[1].Units.Should().Be(110);
        resWithChurn.Monthly[1].Units.Should().Be(105);

        // Future months revenue strictly reduced by churn
        resWithChurn.Monthly[11].Revenue.Should().BeLessThan(resNoChurn.Monthly[11].Revenue);
        resWithChurn.Monthly[35].Units.Should().BeLessThan(resNoChurn.Monthly[35].Units);
    }

    [Fact]
    public void Ecommerce_DoesNotApplySaaSChurn_RevenueEqualsOrdersTimesAOV()
    {
        var inputs = new ForecastInputs
        {
            BusinessModelType = "ecommerce",
            StartingBudget = 30000,
            LaunchSubscribers = 200, // 200 initial orders
            AverageOrderValue = 85.0, // AOV €85
            MonthlyGrowthPct = 8,
            MonthlyChurnPct = 15, // should NOT be subtracted from orders
            VariableCost = 35.0, // COGS + fulfillment per order
            Opex = 6000
        };

        var result = FinancialForecastEngine.Calculate(inputs);

        // Month 1: revenue = orders * AOV
        result.Monthly[0].Units.Should().Be(200);
        result.Monthly[0].Revenue.Should().Be(17000); // 200 * 85
        result.Monthly[0].VariableCosts.Should().Be(7000); // 200 * 35

        // Month 2: orders grow by order growth rate (8%), churn rate (15%) is NOT subtracted
        // orders_m2 = 200 * 1.08 = 216 orders
        result.Monthly[1].Units.Should().Be(216);
        result.Monthly[1].Revenue.Should().Be(216 * 85);
    }

    [Fact]
    public void Service_ACVAndMonthlyRevenueSemantics_DeliveryCostReflectsDelivery()
    {
        var inputs = new ForecastInputs
        {
            BusinessModelType = "service",
            StartingBudget = 25000,
            LaunchSubscribers = 5, // 5 retained clients
            Arpu = 24000, // Annual contract value of €24,000 -> €2,000 / month
            VariableCost = 400, // Direct contractor / delivery cost per client
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 5,
            Opex = 4000
        };

        var result = FinancialForecastEngine.Calculate(inputs);

        // Month 1: 5 clients * €2,000 monthlyRetainer = €10,000 revenue
        result.Monthly[0].Units.Should().Be(5);
        result.Monthly[0].Revenue.Should().Be(10000);
        result.Monthly[0].VariableCosts.Should().Be(2000); // 5 * 400
        result.Monthly[0].FixedCosts.Should().Be(4000);
        result.Monthly[0].OperatingProfit.Should().Be(4000); // 10000 - 6000
    }

    [Fact]
    public void Marketplace_RevenueEqualsGMVTimesTakeRate_TakeRateNotTreatedAsARPU()
    {
        var inputs = new ForecastInputs
        {
            BusinessModelType = "marketplace",
            StartingBudget = 40000,
            LaunchSubscribers = 500, // 500 transactions
            AverageOrderValue = 120.0, // average transaction value
            TakeRatePct = 15.0, // 15% platform take rate
            VariableCost = 2.50, // payment & server processing cost per transaction
            MonthlyGrowthPct = 12,
            MonthlyChurnPct = 4,
            Opex = 7000
        };

        var result = FinancialForecastEngine.Calculate(inputs);

        // Month 1:
        // GMV = 500 * €120 = €60,000
        // platformRevenue = €60,000 * 15% = €9,000 (NOT 500 * 15 which would be €7,500)
        // variableCost = 500 * €2.50 = €1,250
        result.Monthly[0].Units.Should().Be(500);
        result.Monthly[0].Revenue.Should().Be(9000);
        result.Monthly[0].VariableCosts.Should().Be(1250);
        result.Monthly[0].FixedCosts.Should().Be(7000);
    }

    [Fact]
    public void OperatingBreakEven_UsesRevenueVsTotalOperatingCosts_OperatingProfitGteZero()
    {
        // Month 1: 20 subs * 100 = 2000 rev; Costs = 5000 + 200 = 5200 -> Operating Profit = -3200
        // With 15% net growth per month, operating profit crosses >= 0 in later months
        var inputs = new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 100000, // Large starting cash must NOT trigger false break-even
            LaunchSubscribers = 20,
            MonthlyGrowthPct = 20,
            MonthlyChurnPct = 5,
            Arpu = 100,
            VariableCost = 10,
            Opex = 5000
        };

        var result = FinancialForecastEngine.Calculate(inputs);

        result.IsBreakEvenAchieved.Should().BeTrue();
        result.BreakEvenMonth.Should().NotBeNull();
        result.BreakEvenMonth.Should().BeGreaterThan(1);

        int beMonth = result.BreakEvenMonth!.Value;
        var bePoint = result.Monthly[beMonth - 1];
        bePoint.Revenue.Should().BeGreaterOrEqualTo(bePoint.FixedCosts + bePoint.VariableCosts);
        bePoint.OperatingProfit.Should().BeGreaterOrEqualTo(0);

        // Prior month was operating loss
        if (beMonth > 1)
        {
            var priorPoint = result.Monthly[beMonth - 2];
            priorPoint.OperatingProfit.Should().BeLessThan(0);
        }
    }

    [Fact]
    public void StartingBudget_AnchorsCashCorrectly_OpeningCashChain()
    {
        double startingCash = 42500;
        var inputs = new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = startingCash,
            LaunchSubscribers = 10,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 2,
            Arpu = 50,
            VariableCost = 5,
            Opex = 3000
        };

        var result = FinancialForecastEngine.Calculate(inputs);

        // Month 1 opening cash must equal exact confirmed Starting Budget
        result.Monthly[0].OpeningCash.Should().Be(startingCash);
        double m1Net = result.Monthly[0].NetCashFlow;
        result.Monthly[0].EndingCash.Should().Be(startingCash + m1Net);

        // Continuous chain: openingCash_(m+1) == endingCash_m
        for (int i = 1; i < result.Monthly.Count; i++)
        {
            result.Monthly[i].OpeningCash.Should().Be(result.Monthly[i - 1].EndingCash);
            result.Monthly[i].EndingCash.Should().Be(result.Monthly[i].OpeningCash + result.Monthly[i].NetCashFlow);
        }
    }

    [Fact]
    public void EveryEditableDriver_MateriallyAffectsForecastOutput()
    {
        var baseline = new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 100,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 5,
            Arpu = 40,
            VariableCost = 8,
            Opex = 5000
        };
        var baseRes = FinancialForecastEngine.Calculate(baseline);

        // 1. Changing starting budget changes cash balance
        var resBudget = FinancialForecastEngine.Calculate(new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 90000,
            LaunchSubscribers = 100,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 5,
            Arpu = 40,
            VariableCost = 8,
            Opex = 5000
        });
        resBudget.Monthly[0].OpeningCash.Should().NotBe(baseRes.Monthly[0].OpeningCash);

        // 2. Changing launch subscribers changes Month 1 revenue
        var resSubs = FinancialForecastEngine.Calculate(new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 200,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 5,
            Arpu = 40,
            VariableCost = 8,
            Opex = 5000
        });
        resSubs.Monthly[0].Revenue.Should().NotBe(baseRes.Monthly[0].Revenue);

        // 3. Changing growth changes Month 12 revenue
        var resGrowth = FinancialForecastEngine.Calculate(new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 100,
            MonthlyGrowthPct = 20,
            MonthlyChurnPct = 5,
            Arpu = 40,
            VariableCost = 8,
            Opex = 5000
        });
        resGrowth.Monthly[11].Revenue.Should().NotBe(baseRes.Monthly[11].Revenue);

        // 4. Changing ARPU changes revenue
        var resArpu = FinancialForecastEngine.Calculate(new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 100,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 5,
            Arpu = 75,
            VariableCost = 8,
            Opex = 5000
        });
        resArpu.Monthly[0].Revenue.Should().NotBe(baseRes.Monthly[0].Revenue);

        // 5. Changing variable cost changes total cost
        var resVarCost = FinancialForecastEngine.Calculate(new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 100,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 5,
            Arpu = 40,
            VariableCost = 18,
            Opex = 5000
        });
        resVarCost.Monthly[0].VariableCosts.Should().NotBe(baseRes.Monthly[0].VariableCosts);

        // 6. Changing OPEX changes fixed cost and net cash flow
        var resOpex = FinancialForecastEngine.Calculate(new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 50000,
            LaunchSubscribers = 100,
            MonthlyGrowthPct = 10,
            MonthlyChurnPct = 5,
            Arpu = 40,
            VariableCost = 8,
            Opex = 9000
        });
        resOpex.Monthly[0].FixedCosts.Should().NotBe(baseRes.Monthly[0].FixedCosts);
    }
}
