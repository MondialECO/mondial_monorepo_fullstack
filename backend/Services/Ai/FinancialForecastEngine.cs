using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Ai
{
    /// <summary>
    /// Canonical 36-month deterministic financial calculation engine.
    /// Handles business archetype semantics (SaaS, E-commerce, Service, Marketplace),
    /// operating break-even calculations, and starting budget cash flow dynamics.
    /// </summary>
    public static class FinancialForecastEngine
    {
        public const int HorizonMonths = 36;

        public sealed class MonthlyPoint
        {
            public int Month { get; set; }
            public double Units { get; set; }
            public double Revenue { get; set; }
            public double FixedCosts { get; set; }
            public double VariableCosts { get; set; }
            public double TotalCosts => FixedCosts + VariableCosts;
            public double OperatingProfit => Revenue - TotalCosts;
            public double NetCashFlow => OperatingProfit;
            public double OpeningCash { get; set; }
            public double EndingCash { get; set; }
            public string Notes { get; set; } = string.Empty;
        }

        public sealed class CalculationResult
        {
            public string Archetype { get; set; } = "saas";
            public List<MonthlyPoint> Monthly { get; set; } = new();
            public int? BreakEvenMonth { get; set; }
            public bool IsBreakEvenAchieved => BreakEvenMonth.HasValue;
            public double BreakEvenUnits { get; set; }
            public double BreakEvenRevenue { get; set; }
            public string BreakEvenSummary { get; set; } = string.Empty;
            public int? RunwayExhaustionMonth { get; set; }
            public double MinCashBalance { get; set; }
            public int MinCashMonth { get; set; }
        }

        public static CalculationResult Calculate(ForecastInputs inputs)
        {
            var archetype = NormalizeArchetype(inputs.BusinessModelType);
            var result = new CalculationResult { Archetype = archetype };

            double startingBudget = inputs.StartingBudget ?? 0;
            double launchVolume = Math.Max(0, inputs.LaunchSubscribers ?? 0);
            double growthRate = Math.Max(0, inputs.MonthlyGrowthPct ?? 0) / 100.0;
            bool isChurnInactive = inputs.ActiveDrivers != null
                && inputs.ActiveDrivers.TryGetValue("monthlyChurnPct", out var active)
                && !active;
            double churnRate = isChurnInactive ? 0.0 : (Math.Max(0, inputs.MonthlyChurnPct ?? 0) / 100.0);
            double opex = Math.Max(0, inputs.Opex ?? 0);
            double unitPrice = Math.Max(0, inputs.Arpu ?? 0);
            double unitVarCost = Math.Max(0, inputs.VariableCost ?? 0);
            double tam = inputs.Tam ?? double.MaxValue;
            double maxMonthlyRevenue = tam > 0 && tam < double.MaxValue ? tam / 12.0 : double.MaxValue;

            double currentUnits = launchVolume;
            double runningCash = startingBudget;
            double minCash = startingBudget;
            int minCashMonth = 1;
            int? runwayExhaustionMonth = null;

            for (int m = 1; m <= HorizonMonths; m++)
            {
                if (m > 1)
                {
                    currentUnits = ComputeNextMonthUnits(archetype, currentUnits, growthRate, churnRate);
                }

                var (revenue, varCost) = ComputeRevenueAndVariableCost(inputs, archetype, currentUnits, maxMonthlyRevenue);
                double fixedCost = opex;
                double totalCost = fixedCost + varCost;
                double netCashFlow = revenue - totalCost;

                double openingCash = runningCash;
                runningCash += netCashFlow;
                double endingCash = runningCash;

                if (endingCash < 0 && !runwayExhaustionMonth.HasValue)
                {
                    runwayExhaustionMonth = m;
                }

                if (endingCash < minCash)
                {
                    minCash = endingCash;
                    minCashMonth = m;
                }

                string note = GenerateMonthlyNote(archetype, m, currentUnits, revenue);

                result.Monthly.Add(new MonthlyPoint
                {
                    Month = m,
                    Units = currentUnits,
                    Revenue = Math.Round(revenue, 2),
                    FixedCosts = Math.Round(fixedCost, 2),
                    VariableCosts = Math.Round(varCost, 2),
                    OpeningCash = Math.Round(openingCash, 2),
                    EndingCash = Math.Round(endingCash, 2),
                    Notes = note
                });
            }

            result.RunwayExhaustionMonth = runwayExhaustionMonth;
            result.MinCashBalance = Math.Round(minCash, 2);
            result.MinCashMonth = minCashMonth;

            // Operating break-even: first month where Revenue >= Variable Costs + Fixed Costs (Operating Profit >= 0)
            int? breakEvenMonth = null;
            double breakEvenUnits = 0;
            double breakEvenRev = 0;
            foreach (var point in result.Monthly)
            {
                if (point.OperatingProfit >= 0)
                {
                    breakEvenMonth = point.Month;
                    breakEvenUnits = point.Units;
                    breakEvenRev = point.Revenue;
                    break;
                }
            }

            result.BreakEvenMonth = breakEvenMonth;
            result.BreakEvenUnits = breakEvenUnits;
            result.BreakEvenRevenue = breakEvenRev;
            result.BreakEvenSummary = GenerateBreakEvenSummary(archetype, breakEvenMonth, breakEvenUnits, breakEvenRev);

            return result;
        }

        public static BsonDocument BuildForecastContract(ForecastInputs inputs, BsonDocument? existingContract = null)
        {
            var calc = Calculate(inputs);

            var revMonthly = new BsonArray();
            var costMonthly = new BsonArray();
            var cashMonthly = new BsonArray();

            foreach (var pt in calc.Monthly)
            {
                revMonthly.Add(new BsonDocument
                {
                    ["month"] = pt.Month,
                    ["amount"] = pt.Revenue,
                    ["notes"] = pt.Notes
                });

                costMonthly.Add(new BsonDocument
                {
                    ["month"] = pt.Month,
                    ["fixedCosts"] = pt.FixedCosts,
                    ["variableCosts"] = pt.VariableCosts,
                    ["notes"] = pt.Notes
                });

                cashMonthly.Add(new BsonDocument
                {
                    ["month"] = pt.Month,
                    ["netCashFlow"] = pt.NetCashFlow,
                    ["endingBalance"] = pt.EndingCash,
                    ["notes"] = pt.Notes
                });
            }

            var contract = existingContract ?? new BsonDocument();

            string currency = "EUR";
            if (contract.Contains("revenueForecast") && contract["revenueForecast"].IsBsonDocument)
            {
                var rf = contract["revenueForecast"].AsBsonDocument;
                if (rf.Contains("currency") && rf["currency"].IsString && !string.IsNullOrWhiteSpace(rf["currency"].AsString))
                {
                    currency = rf["currency"].AsString;
                }
            }

            contract["schemaVersion"] = 1;
            contract["aiMonthCount"] = HorizonMonths;

            contract["revenueForecast"] = new BsonDocument
            {
                ["currency"] = currency,
                ["summary"] = $"36-month {calc.Archetype.ToUpperInvariant()} revenue projection scaling from {currency} {calc.Monthly.FirstOrDefault()?.Revenue:N0}/mo to {currency} {calc.Monthly.LastOrDefault()?.Revenue:N0}/mo.",
                ["monthly"] = revMonthly
            };

            contract["costForecast"] = new BsonDocument
            {
                ["currency"] = currency,
                ["summary"] = $"Operational fixed and variable cost structure supporting {calc.Archetype.ToUpperInvariant()} growth.",
                ["monthly"] = costMonthly
            };

            contract["cashFlowProjection"] = new BsonDocument
            {
                ["currency"] = currency,
                ["summary"] = calc.RunwayExhaustionMonth.HasValue
                    ? $"Runway exhausted in Month {calc.RunwayExhaustionMonth.Value} without additional funding."
                    : "Cash flow remains positive across the 36-month horizon.",
                ["monthly"] = cashMonthly
            };

            contract["breakEvenAnalysis"] = new BsonDocument
            {
                ["breakEvenMonth"] = calc.BreakEvenMonth.HasValue ? (BsonValue)calc.BreakEvenMonth.Value : BsonNull.Value,
                ["isAchievedWithinHorizon"] = calc.IsBreakEvenAchieved,
                ["summary"] = calc.BreakEvenSummary
            };

            if (!contract.Contains("assumptions") || !contract["assumptions"].IsBsonArray || contract["assumptions"].AsBsonArray.Count == 0)
            {
                var assumptionsArr = new BsonArray
                {
                    $"Starting budget: €{inputs.StartingBudget:N0}",
                    $"{FormatLaunchAssumption(calc.Archetype, inputs)}",
                    $"{FormatGrowthAssumption(calc.Archetype, inputs)}",
                    $"{FormatPricingAssumption(calc.Archetype, inputs)}",
                    $"{FormatOpexAssumption(inputs)}",
                    "36-month deterministic projection model with monotonic version control."
                };
                contract["assumptions"] = assumptionsArr;
            }

            if (!contract.Contains("risks") || !contract["risks"].IsBsonArray || contract["risks"].AsBsonArray.Count == 0)
            {
                var risksArr = new BsonArray
                {
                    new BsonDocument
                    {
                        ["category"] = "Liquidity / Runway Risk",
                        ["description"] = calc.RunwayExhaustionMonth.HasValue
                            ? $"Budget is depleted by Month {calc.RunwayExhaustionMonth.Value}. Requires capital buffer."
                            : "Runway sustains operations across the modelled horizon.",
                        ["likelihood"] = calc.RunwayExhaustionMonth.HasValue ? "High" : "Low",
                        ["mitigation"] = "Optimize unit acquisition cost or secure bridge seed funding."
                    },
                    new BsonDocument
                    {
                        ["category"] = "Growth Shortfall",
                        ["description"] = "A 25% drop in monthly expansion extends the break-even milestone.",
                        ["likelihood"] = "Medium",
                        ["mitigation"] = "Diversify customer acquisition channels."
                    }
                };
                contract["risks"] = risksArr;
            }

            if (!contract.Contains("advisoryNotice"))
            {
                contract["advisoryNotice"] = "Projections are based on mathematical modeling of stated unit economics and growth parameters.";
            }

            return contract;
        }

        private static string NormalizeArchetype(string? archetype)
        {
            if (string.IsNullOrWhiteSpace(archetype)) return "saas";
            var lower = archetype.Trim().ToLowerInvariant();
            if (lower.Contains("ecommerce") || lower.Contains("e-commerce") || lower.Contains("retail") || lower.Contains("d2c"))
                return "ecommerce";
            if (lower.Contains("service") || lower.Contains("agency") || lower.Contains("consulting"))
                return "service";
            if (lower.Contains("marketplace") || lower.Contains("two-sided") || lower.Contains("platform"))
                return "marketplace";
            return "saas";
        }

        private static double ComputeNextMonthUnits(string archetype, double prevUnits, double growthRate, double churnRate)
        {
            return archetype switch
            {
                // SaaS: active subscribers with both new acquisition and churn
                // newSubscribers = previousSubscribers * growthRate
                // lostSubscribers = previousSubscribers * churnRate
                // subscribers = previousSubscribers + newSubscribers - lostSubscribers
                "saas" => Math.Max(0, Math.Round(prevUnits + (prevUnits * growthRate) - (prevUnits * churnRate))),

                // E-commerce: monthly orders grow with order growth rate; no subscription churn
                // orders_m = orders_(m-1) * (1 + orderGrowthRate)
                "ecommerce" => Math.Max(0, Math.Round(prevUnits * (1 + growthRate))),

                // Service / Agency: retainer clients with acquisition and client turnover
                // clients_m = clients_(m-1) + newClients - lostClients
                "service" => Math.Max(0, Math.Round(prevUnits + (prevUnits * growthRate) - (prevUnits * churnRate))),

                // Marketplace: transaction volume scaling
                // txs_m = txs_(m-1) * (1 + txGrowthRate - dropOffRate)
                "marketplace" => Math.Max(0, Math.Round(prevUnits + (prevUnits * growthRate) - (prevUnits * churnRate))),

                _ => Math.Max(0, Math.Round(prevUnits * (1 + growthRate - churnRate)))
            };
        }

        private static (double revenue, double variableCost) ComputeRevenueAndVariableCost(
            ForecastInputs inputs,
            string archetype,
            double units,
            double maxMonthlyRevenue)
        {
            double unitPrice = Math.Max(0, inputs.Arpu ?? 0);
            double unitVarCost = Math.Max(0, inputs.VariableCost ?? 0);
            double revenue;
            double variableCost;

            switch (archetype)
            {
                case "ecommerce":
                    // Section 4: orders, AOV, orderGrowth, COGS per order, fulfillment / variable cost
                    // revenue = orders * AOV
                    // variableCost = orders * (COGS + fulfillment)
                    double aov = inputs.AverageOrderValue ?? (unitPrice > 0 ? unitPrice : 0);
                    revenue = units * aov;
                    variableCost = units * unitVarCost;
                    break;

                case "service":
                    // Section 5: monthlyRevenuePerClient, averageProjectValue, monthlyRetainer or ACV / 12 when ACV is annual
                    // delivery cost reflects actual delivery / team cost
                    double monthlyRevPerClient = (unitPrice >= 1200) ? unitPrice / 12.0 : unitPrice;
                    revenue = units * monthlyRevPerClient;
                    variableCost = units * unitVarCost;
                    break;

                case "marketplace":
                    // Section 6: GMV = transactionVolume * averageTransactionValue
                    // platformRevenue = GMV * takeRate
                    // variableCost = transactionVolume * processingCostPerTransaction
                    // Take rate must be represented as a percentage/rate, not currency ARPU
                    double avgTxVal = inputs.AverageOrderValue ?? 100.0;
                    double takeRate = 0.15; // default 15% rate if not specified
                    if (inputs.TakeRatePct.HasValue && inputs.TakeRatePct.Value > 0)
                    {
                        takeRate = inputs.TakeRatePct.Value <= 1.0 ? inputs.TakeRatePct.Value : inputs.TakeRatePct.Value / 100.0;
                    }
                    else if (unitPrice > 0)
                    {
                        takeRate = unitPrice <= 1.0 ? unitPrice : unitPrice / 100.0;
                    }

                    double gmv = units * avgTxVal;
                    revenue = gmv * takeRate;
                    variableCost = units * unitVarCost; // processing cost per transaction
                    break;

                case "saas":
                default:
                    // Section 3: revenue = subscribers * ARPU
                    // variableCost = subscribers * variableCostPerSubscriber
                    revenue = units * unitPrice;
                    variableCost = units * unitVarCost;
                    break;
            }

            if (revenue > maxMonthlyRevenue)
            {
                revenue = maxMonthlyRevenue;
            }

            return (revenue, variableCost);
        }

        private static string GenerateMonthlyNote(string archetype, int month, double units, double revenue)
        {
            if (month == 1)
            {
                return archetype switch
                {
                    "ecommerce" => $"Launch Month · {units:N0} orders",
                    "service" => $"Launch Month · {units:N0} retained clients",
                    "marketplace" => $"Launch Month · {units:N0} transactions",
                    _ => $"Launch Month · {units:N0} subscribers"
                };
            }

            return archetype switch
            {
                "ecommerce" => $"{units:N0} orders · €{revenue:N0} revenue",
                "service" => $"{units:N0} clients · €{revenue:N0} billing",
                "marketplace" => $"{units:N0} txs · €{revenue:N0} take revenue",
                _ => $"{units:N0} subs · €{revenue:N0} revenue"
            };
        }

        private static string GenerateBreakEvenSummary(string archetype, int? breakEvenMonth, double breakEvenUnits, double breakEvenRev)
        {
            if (!breakEvenMonth.HasValue)
            {
                return "Operating break-even is not reached within the 36-month horizon under current assumptions.";
            }

            return archetype switch
            {
                "ecommerce" => $"Operating break-even reached in Month {breakEvenMonth.Value} with {breakEvenUnits:N0} monthly orders (€{breakEvenRev:N0}/mo).",
                "service" => $"Operating break-even reached in Month {breakEvenMonth.Value} with {breakEvenUnits:N0} retained clients (€{breakEvenRev:N0}/mo).",
                "marketplace" => $"Operating break-even reached in Month {breakEvenMonth.Value} with {breakEvenUnits:N0} monthly transactions (€{breakEvenRev:N0}/mo).",
                _ => $"Operating break-even reached in Month {breakEvenMonth.Value} with {breakEvenUnits:N0} subscribers (€{breakEvenRev:N0}/mo)."
            };
        }

        private static string FormatLaunchAssumption(string archetype, ForecastInputs inputs)
        {
            double vol = inputs.LaunchSubscribers ?? 0;
            return archetype switch
            {
                "ecommerce" => $"{vol:N0} orders at launch (Month 1)",
                "service" => $"{vol:N0} active clients at launch",
                "marketplace" => $"{vol:N0} monthly transactions at launch",
                _ => $"{vol:N0} subscribers at launch"
            };
        }

        private static string FormatGrowthAssumption(string archetype, ForecastInputs inputs)
        {
            double g = inputs.MonthlyGrowthPct ?? 0;
            double c = inputs.MonthlyChurnPct ?? 0;
            return archetype switch
            {
                "ecommerce" => $"{g}% monthly order growth",
                _ => $"{g}% monthly acquisition growth and {c}% monthly attrition"
            };
        }

        private static string FormatPricingAssumption(string archetype, ForecastInputs inputs)
        {
            double price = inputs.Arpu ?? 0;
            double cost = inputs.VariableCost ?? 0;
            return archetype switch
            {
                "ecommerce" => $"€{price:N2} Average Order Value (AOV), €{cost:N2} COGS & fulfillment per order",
                "service" => $"€{price:N0}/mo average retainer per client, €{cost:N0} direct delivery cost",
                "marketplace" => $"€{price:N2} take rate revenue per transaction, €{cost:N2} processing fee",
                _ => $"€{price:N2}/mo ARPU, €{cost:N2} variable cost per subscriber"
            };
        }

        private static string FormatOpexAssumption(ForecastInputs inputs)
        {
            return $"€{inputs.Opex ?? 0:N0} monthly fixed operating overhead (OPEX)";
        }
    }
}
