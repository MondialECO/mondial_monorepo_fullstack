using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

/// <summary>
/// Single backend definition of Phase 3 (Financial Submission) completion
/// requirements. Same status vocabulary as <see cref="Phase2Requirements"/>:
/// pending / approved both count as submitted; rejected does not.
///
/// Semantic model: Phase 3 = "financials submitted, awaiting compliance
/// review". Verification is awarded separately by a reviewer.
/// </summary>
public static class Phase3Requirements
{
    public const string ReportStatusPending = "pending";
    public const string ReportStatusApproved = "approved";
    public const string ReportStatusRejected = "rejected";

    /// <summary>
    /// Report types every company must submit before Phase 3 can complete.
    /// </summary>
    public static readonly IReadOnlyList<string> RequiredReportTypes = new[]
    {
        "pnl",
        "balance",
    };

    /// <summary>Capital allocation total percent must land in this band.</summary>
    public const double AllocationMinTotalPercent = 95.0;
    public const double AllocationMaxTotalPercent = 105.0;

    /// <summary>Equity ownership share total must land in this band of TotalShares.</summary>
    public const double EquityMinPercentOfTotalShares = 90.0;
    public const double EquityMaxPercentOfTotalShares = 100.0;

    public static bool IsAcceptableReportStatus(string status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        return !string.Equals(status, ReportStatusRejected, StringComparison.OrdinalIgnoreCase);
    }

    public static bool MatchesReportType(string type, string required)
    {
        if (string.IsNullOrWhiteSpace(type)) return false;
        return string.Equals(type, required, StringComparison.OrdinalIgnoreCase);
    }

    public static List<string> ValidateKpiBaseline(Phase3Kpi kpi)
    {
        var errors = new List<string>();
        if (kpi == null)
        {
            errors.Add("KPI baseline is required");
            return errors;
        }

        if (kpi.Mrr < 0) errors.Add("KPI: MRR must be non-negative");
        if (kpi.Arr < 0) errors.Add("KPI: ARR must be non-negative");
        if (kpi.GrossMarginPercent < -100 || kpi.GrossMarginPercent > 100)
            errors.Add("KPI: gross margin must be between -100 and 100");
        if (kpi.Cac < 0) errors.Add("KPI: CAC must be non-negative");
        if (kpi.Ltv < 0) errors.Add("KPI: LTV must be non-negative");
        if (kpi.ChurnPercent < 0 || kpi.ChurnPercent > 100)
            errors.Add("KPI: churn percent must be between 0 and 100");
        if (kpi.ActiveAccounts < 0) errors.Add("KPI: active accounts must be non-negative");

        // Baseline must show *some* signal — at least one of Mrr/Arr/ActiveAccounts > 0.
        if (kpi.Mrr <= 0 && kpi.Arr <= 0 && kpi.ActiveAccounts <= 0)
            errors.Add("KPI baseline must include at least one of MRR, ARR, or active accounts");

        return errors;
    }
}
