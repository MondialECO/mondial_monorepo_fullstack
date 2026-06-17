namespace WebApp.Services;

/// <summary>
/// Inputs to the Phase 3 valuation risk-discount + confidence model. Built by
/// <c>CompanyService.BuildValuationContextAsync</c> from the company document,
/// embedded beneficial owners, and related collections. All fields have safe
/// defaults so a partially-populated company still produces a deterministic
/// valuation.
/// </summary>
public record ValuationContext
{
    public string Stage { get; init; } = "mvp";
    public bool IsLegalEntityFormed { get; init; } = false;
    public int FounderCount { get; init; } = 1;
    public string KpiDataSource { get; init; } = "manual";
    public bool RevenueEnteredManually { get; init; } = true;
    public bool DocumentsVerified { get; init; } = false;
    public int NdaSignedCount { get; init; } = 0;
    public double LargestOwnershipPct { get; init; } = 100;
    public double Q1 { get; init; }
    public double Q2 { get; init; }
    public double Q3 { get; init; }
    public double Q4 { get; init; }
}
