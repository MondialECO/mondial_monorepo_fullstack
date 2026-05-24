using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

/// <summary>
/// Single backend definition of Phase 5 (Funding Submission) requirements.
///
/// Semantic model: Phase 5 = "funding submission complete, awaiting review".
/// NOT "funding live", NOT "investor ready", NOT "actively fundraising" —
/// those are downstream phases.
/// </summary>
public static class Phase5Requirements
{
    public static readonly IReadOnlyList<string> ShareTypeWhitelist = new[]
    {
        "preferred",
        "safe",
        "note",
    };

    public static readonly IReadOnlyList<string> HiringPriorityWhitelist = new[]
    {
        "high",
        "medium",
        "low",
    };

    public const int NarrativeMinLength = 200;
    public const double ValuationMin = 1.0;
    public const double EquityOfferedMin = 0.0001;
    public const double EquityOfferedMax = 100.0;
    public const double AllocationMinTotalPercent = 95.0;
    public const double AllocationMaxTotalPercent = 105.0;

    public static bool IsValidShareType(string s)
        => !string.IsNullOrWhiteSpace(s)
            && ShareTypeWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidHiringPriority(string s)
        => !string.IsNullOrWhiteSpace(s)
            && HiringPriorityWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    /// <summary>
    /// Per-row capital allocation validation. Rejects blank categories, NaN /
    /// infinite percent or amount, negative values, and percentages over 100.
    /// Totals are checked separately by the validator.
    /// </summary>
    public static List<string> ValidateAllocationRows(IEnumerable<CapitalAllocationDto> rows)
    {
        var errors = new List<string>();
        if (rows == null) return errors;
        int idx = 0;
        foreach (var r in rows)
        {
            idx++;
            var label = string.IsNullOrWhiteSpace(r?.Category) ? $"row #{idx}" : r.Category.Trim();

            if (r == null || string.IsNullOrWhiteSpace(r.Category))
                errors.Add($"Allocation row #{idx}: category is required");

            if (r != null)
            {
                if (!double.IsFinite(r.Percent))
                    errors.Add($"Allocation '{label}': percent must be a finite number");
                else if (r.Percent < 0)
                    errors.Add($"Allocation '{label}': percent must be >= 0");
                else if (r.Percent > 100)
                    errors.Add($"Allocation '{label}': percent must be <= 100");

                if (!double.IsFinite(r.Amount))
                    errors.Add($"Allocation '{label}': amount must be a finite number");
                else if (r.Amount < 0)
                    errors.Add($"Allocation '{label}': amount must be >= 0");
            }
        }
        return errors;
    }

    /// <summary>
    /// Per-row hiring plan validation. Rejects blank role, blank timeline,
    /// NaN / infinite or negative salary, and invalid priority values.
    /// </summary>
    public static List<string> ValidateHiringPlanRows(IEnumerable<HiringPlanDto> rows)
    {
        var errors = new List<string>();
        if (rows == null) return errors;
        int idx = 0;
        foreach (var h in rows)
        {
            idx++;
            var label = string.IsNullOrWhiteSpace(h?.Role) ? $"row #{idx}" : h.Role.Trim();

            if (h == null || string.IsNullOrWhiteSpace(h.Role))
                errors.Add($"Hiring row #{idx}: role is required");
            if (h != null && string.IsNullOrWhiteSpace(h.Timeline))
                errors.Add($"Hiring '{label}': timeline is required");
            if (h != null)
            {
                if (!double.IsFinite(h.Salary))
                    errors.Add($"Hiring '{label}': salary must be a finite number");
                else if (h.Salary < 0)
                    errors.Add($"Hiring '{label}': salary must be >= 0");

                if (!IsValidHiringPriority(h.Priority))
                    errors.Add(
                        $"Hiring '{label}': priority must be one of {string.Join(", ", HiringPriorityWhitelist)}");
            }
        }
        return errors;
    }
}
