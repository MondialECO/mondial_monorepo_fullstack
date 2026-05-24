using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

/// <summary>
/// Single backend definition of Phase 4 (Cap Table Submission) requirements.
///
/// Semantic model: Phase 4 = "cap table submitted, awaiting compliance review".
/// Verification is awarded separately by a reviewer.
/// </summary>
public static class Phase4Requirements
{
    // ---- ownership reconciliation bands ----
    public const double OwnershipMinPercent = 0.0;
    public const double OwnershipMaxPercent = 100.0;
    public const double OwnershipReconciledMin = 90.0;
    public const double OwnershipReconciledMax = 100.0;

    // ---- vesting cliff schedule (canonical, used by the UI and validator) ----
    // Standard 4-year monthly cliff:
    //   0–11 months → 0%
    //   12 months  → 25%
    //   24 months  → 50%
    //   36 months  → 75%
    //   48 months  → 100%
    public const int StandardCliffMonths = 12;
    public const int StandardTotalVestMonths = 48;

    /// <summary>
    /// Compute the canonical vested percent at a given month, per product spec.
    /// Pre-cliff is 0; otherwise linear between cliff and total vest.
    /// </summary>
    public static double ComputeVestedPercent(int monthsSinceGrant, int cliffMonths, int totalVestMonths)
    {
        if (totalVestMonths <= 0) return 0;
        if (cliffMonths < 0 || monthsSinceGrant < 0) return 0;
        if (monthsSinceGrant < cliffMonths) return 0;
        if (monthsSinceGrant >= totalVestMonths) return 100;
        return (monthsSinceGrant / (double)totalVestMonths) * 100.0;
    }

    public static int ComputeVestedShares(int sharesGranted, int monthsSinceGrant, int cliffMonths, int totalVestMonths)
    {
        var pct = ComputeVestedPercent(monthsSinceGrant, cliffMonths, totalVestMonths);
        return (int)Math.Floor((pct / 100.0) * sharesGranted);
    }

    public static int MonthsBetween(DateTime grantDate, DateTime now)
    {
        if (now < grantDate) return 0;
        var months = ((now.Year - grantDate.Year) * 12) + (now.Month - grantDate.Month);
        if (now.Day < grantDate.Day) months -= 1;
        return Math.Max(0, months);
    }

    /// <summary>
    /// Validate vesting params on an individual grant. Returns the list of
    /// human-readable errors (empty if OK). Used both at write time (controller
    /// + service) and in ValidatePhase4Async.
    /// </summary>
    public static List<string> ValidateVesting(int cliffMonths, int totalVestMonths, string stakeholderLabel)
    {
        var errors = new List<string>();
        if (totalVestMonths < 0) errors.Add($"{stakeholderLabel}: total vest months must be >= 0");
        if (cliffMonths < 0) errors.Add($"{stakeholderLabel}: cliff months must be >= 0");
        if (cliffMonths > totalVestMonths)
            errors.Add($"{stakeholderLabel}: cliff months ({cliffMonths}) cannot exceed total vest months ({totalVestMonths})");
        return errors;
    }

    /// <summary>
    /// Validate a full cap-table submission shape at write time. Returns the
    /// list of errors; an empty list means the request is structurally sound.
    /// Domain reconciliation (totals) is in <c>ValidateCapTableTotals</c>.
    /// </summary>
    public static List<string> ValidateCapTableShape(SubmitCapTableRequest req)
    {
        var errors = new List<string>();
        if (req == null) { errors.Add("Cap table request is required"); return errors; }
        if (req.TotalShares <= 0) errors.Add("Total shares must be > 0");
        if (req.EsopPoolPercent < 0 || req.EsopPoolPercent > 100)
            errors.Add("ESOP pool percent must be between 0 and 100");
        if (req.EsopPoolPercent > 0 && req.EsopVestingMonths <= 0)
            errors.Add("ESOP vesting months must be > 0 when ESOP pool is non-zero");
        if (req.Grants == null || req.Grants.Count == 0)
            errors.Add("Cap table must contain at least one grant");
        return errors;
    }

    /// <summary>
    /// Validate per-grant shape (shares, share class, vesting, ownership signs).
    /// </summary>
    public static List<string> ValidateGrants(IEnumerable<EquityGrantDto> grants, int totalShares)
    {
        var errors = new List<string>();
        if (grants == null) return errors;

        // Founder presence is enforced separately (caller can decide if required).
        int idx = 0;
        foreach (var g in grants)
        {
            idx++;
            var label = string.IsNullOrWhiteSpace(g.StakeholderName) ? $"row #{idx}" : g.StakeholderName;
            if (string.IsNullOrWhiteSpace(g.StakeholderName))
                errors.Add($"Grant {idx}: stakeholder name is required");
            if (string.IsNullOrWhiteSpace(g.StakeholderType))
                errors.Add($"{label}: stakeholder type is required");
            if (g.SharesGranted <= 0)
                errors.Add($"{label}: shares granted must be > 0 (got {g.SharesGranted})");
            if (g.SharesGranted > totalShares)
                errors.Add($"{label}: shares granted ({g.SharesGranted}) exceed total shares ({totalShares})");
            if (g.InvestmentAmount.HasValue && g.InvestmentAmount.Value < 0)
                errors.Add($"{label}: investment amount must be >= 0");
            if (!ShareClasses.IsValid(g.ShareClass))
                errors.Add($"{label}: invalid share class '{g.ShareClass}' (allowed: {string.Join(", ", ShareClasses.All)})");
            errors.AddRange(ValidateVesting(g.CliffMonths, g.TotalVestMonths, label));
        }

        return errors;
    }

    /// <summary>
    /// Duplicate detection on (stakeholderName, shareClass). Called at write
    /// time so a partial save still catches dup rows immediately.
    /// </summary>
    public static List<string> ValidateDuplicateRows(SubmitCapTableRequest req)
    {
        var errors = new List<string>();
        if (req?.Grants == null) return errors;
        var dupKeys = req.Grants
            .GroupBy(g => $"{(g.StakeholderName ?? string.Empty).Trim().ToLowerInvariant()}::{(g.ShareClass ?? string.Empty).Trim().ToLowerInvariant()}")
            .Where(grp => grp.Count() > 1)
            .Select(grp => grp.Key)
            .ToList();
        foreach (var k in dupKeys)
            errors.Add($"Duplicate cap-table row detected for {k.Replace("::", " / ")}");
        return errors;
    }
}
