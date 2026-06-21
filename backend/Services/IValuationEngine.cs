namespace WebApp.Services;

public class ValuationResult
{
    public double EstimatedValuation { get; set; }
    public double RevenueMultiple { get; set; }
    public string Rationale { get; set; }
}

public interface IValuationEngine
{
    Task<ValuationResult> CalculateValuationAsync(
        double totalRevenue,
        double growthRate,
        string industrySegment,
        int runwayMonths
    );
}
