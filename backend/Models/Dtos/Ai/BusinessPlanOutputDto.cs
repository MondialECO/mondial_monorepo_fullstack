namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// The structured Business-Plan output contract (v1) — the typed mirror of the
    /// JSON the model is asked to return (see the BusinessPlan prompt's output
    /// contract) and of each <c>BusinessPlanVersion.Content</c>. Seven locked
    /// sections; <c>FundingAsk</c> is intentionally excluded from v1 (locked C-3
    /// decision #1). <see cref="SchemaVersion"/> keeps it forward-compatible.
    /// </summary>
    public class BusinessPlanOutputDto
    {
        /// <summary>Current contract version emitted by C-3.</summary>
        public const int CurrentSchemaVersion = 1;

        public int SchemaVersion { get; set; } = CurrentSchemaVersion;

        public ExecutiveSummaryDto ExecutiveSummary { get; set; } = new();

        public MarketAnalysisDto MarketAnalysis { get; set; } = new();

        public CompetitorAnalysisDto CompetitorAnalysis { get; set; } = new();

        public RevenueModelDto RevenueModel { get; set; } = new();

        public GoToMarketDto GoToMarket { get; set; } = new();

        public OperationsPlanDto OperationsPlan { get; set; } = new();

        public List<BusinessRiskDto> Risks { get; set; } = new();
    }

    public class ExecutiveSummaryDto
    {
        public string Overview { get; set; } = "";
        public string? ValueProposition { get; set; }
        public List<string> Highlights { get; set; } = new();
    }

    public class MarketAnalysisDto
    {
        public string Overview { get; set; } = "";
        public List<string> TargetSegments { get; set; } = new();

        /// <summary>Qualitative market size/reach statement — never a guaranteed figure.</summary>
        public string? MarketSizeQualitative { get; set; }
        public List<string> Trends { get; set; } = new();
    }

    public class CompetitorAnalysisDto
    {
        public string Overview { get; set; } = "";
        public List<CompetitorDto> Competitors { get; set; } = new();
    }

    public class CompetitorDto
    {
        public string Name { get; set; } = "";
        public string? Positioning { get; set; }
        public List<string> Strengths { get; set; } = new();
        public List<string> Weaknesses { get; set; } = new();

        /// <summary>How the venture differentiates against this competitor.</summary>
        public string? OurAdvantage { get; set; }
    }

    public class RevenueModelDto
    {
        public string Summary { get; set; } = "";
        public List<RevenueStreamDto> RevenueStreams { get; set; } = new();
        public string? PricingStrategy { get; set; }

        /// <summary>Qualitative drivers/metrics — no quantitative projections in v1.</summary>
        public List<string> KeyMetrics { get; set; } = new();
    }

    public class RevenueStreamDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
    }

    public class GoToMarketDto
    {
        public string Strategy { get; set; } = "";
        public List<string> Channels { get; set; } = new();
        public List<GoToMarketPhaseDto> Phases { get; set; } = new();
    }

    public class GoToMarketPhaseDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
    }

    public class OperationsPlanDto
    {
        public string Overview { get; set; } = "";
        public List<string> KeyActivities { get; set; } = new();
        public List<string> Resources { get; set; } = new();
        public List<OperationsMilestoneDto> Milestones { get; set; } = new();
    }

    public class OperationsMilestoneDto
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }

        /// <summary>Qualitative timeframe (e.g. "first 30 days") — no fixed dates.</summary>
        public string? Timeframe { get; set; }
    }

    public class BusinessRiskDto
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
