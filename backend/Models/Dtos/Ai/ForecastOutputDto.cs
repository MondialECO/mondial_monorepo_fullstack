namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// The structured Forecast output contract (v1) — the typed mirror of the JSON
    /// the model is asked to return (see the Forecast prompt's output contract) and
    /// of each <c>ForecastVersion.Content</c>. Seven locked fields over a fixed
    /// 12-month horizon (<see cref="MonthsInHorizon"/>): the monthly arrays are
    /// numeric projections, one entry per month (1..12), no custom horizon and no
    /// yearly roll-up. No funding ask is present (aligned with the locked C-3/C-4
    /// decision). <see cref="SchemaVersion"/> keeps it forward-compatible.
    /// </summary>
    public class ForecastOutputDto
    {
        /// <summary>Current contract version emitted by C-4.</summary>
        public const int CurrentSchemaVersion = 1;

        /// <summary>Fixed forecast horizon — 12 monthly periods, no custom horizon.</summary>
        public const int MonthsInHorizon = 12;

        public int SchemaVersion { get; set; } = CurrentSchemaVersion;

        public RevenueForecastDto RevenueForecast { get; set; } = new();

        public CostForecastDto CostForecast { get; set; } = new();

        public CashFlowProjectionDto CashFlowProjection { get; set; } = new();

        public BreakEvenAnalysisDto BreakEvenAnalysis { get; set; } = new();

        /// <summary>Key assumptions driving the projection.</summary>
        public List<string> Assumptions { get; set; } = new();

        public List<ForecastRiskDto> Risks { get; set; } = new();

        /// <summary>
        /// Human-readable estimate disclaimer aligned with SafetyRules — these are
        /// planning estimates, not guarantees of financial outcomes.
        /// </summary>
        public string? AdvisoryNotice { get; set; }
    }

    public class RevenueForecastDto
    {
        /// <summary>ISO currency code for all amounts in this section (e.g. "USD").</summary>
        public string? Currency { get; set; }
        public string? Summary { get; set; }

        /// <summary>Exactly 12 entries, one per month (1..12).</summary>
        public List<RevenueMonthDto> Monthly { get; set; } = new();
    }

    public class RevenueMonthDto
    {
        /// <summary>1-based month index within the fixed 12-month horizon (1..12).</summary>
        public int Month { get; set; }
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
    }

    public class CostForecastDto
    {
        public string? Currency { get; set; }
        public string? Summary { get; set; }

        /// <summary>Exactly 12 entries, one per month (1..12).</summary>
        public List<CostMonthDto> Monthly { get; set; } = new();
    }

    public class CostMonthDto
    {
        /// <summary>1-based month index within the fixed 12-month horizon (1..12).</summary>
        public int Month { get; set; }
        public decimal FixedCosts { get; set; }
        public decimal VariableCosts { get; set; }
        public string? Notes { get; set; }
    }

    public class CashFlowProjectionDto
    {
        public string? Currency { get; set; }
        public string? Summary { get; set; }

        /// <summary>Exactly 12 entries, one per month (1..12).</summary>
        public List<CashFlowMonthDto> Monthly { get; set; } = new();
    }

    public class CashFlowMonthDto
    {
        /// <summary>1-based month index within the fixed 12-month horizon (1..12).</summary>
        public int Month { get; set; }
        public decimal NetCashFlow { get; set; }
        public decimal EndingBalance { get; set; }
        public string? Notes { get; set; }
    }

    public class BreakEvenAnalysisDto
    {
        /// <summary>Month break-even is reached (1..12), or null if not within the horizon.</summary>
        public int? BreakEvenMonth { get; set; }
        public string? Summary { get; set; }

        /// <summary>True when break-even is reached inside the 12-month horizon.</summary>
        public bool IsAchievedWithinHorizon { get; set; }
    }

    public class ForecastRiskDto
    {
        public string Category { get; set; } = "";
        public string Description { get; set; } = "";

        /// <summary>low | medium | high</summary>
        public string? Likelihood { get; set; }

        /// <summary>low | medium | high</summary>
        public string? Impact { get; set; }
        public string? Mitigation { get; set; }
    }
}
