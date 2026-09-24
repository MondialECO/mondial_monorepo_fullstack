namespace WebApp.Models.Dtos.Ai
{
    public class UpdateFinancialAssumptionsDto
    {
        public string? BusinessIdeaId { get; set; }
        public string? BusinessModelType { get; set; }
        public double? StartingBudget { get; set; }
        public double? LaunchSubscribers { get; set; }
        public double? VariableCost { get; set; }
        public double? Arpu { get; set; }
        public double? Opex { get; set; }
        public double? MonthlyGrowthPct { get; set; }
        public double? MonthlyChurnPct { get; set; }
        public double? AverageOrderValue { get; set; }
        public double? TakeRatePct { get; set; }
        public double? TaxRatePct { get; set; }
        public string? StartingBudgetProvenance { get; set; }
        public Dictionary<string, string>? Provenance { get; set; }
        public Dictionary<string, bool>? ActiveDrivers { get; set; }
    }
}
