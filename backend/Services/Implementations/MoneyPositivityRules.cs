using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// Floors for every money value that can reach a buyer's total or a funded milestone.
///
/// Only the base package price had one. Add-on prices, the additional-revision price and
/// individual milestone amounts were all unchecked, so a negative value could subtract
/// from the amount charged — and from the 12% commission base with it — while the totals
/// still looked plausible.
///
/// Pure so the rules are unit-testable without a database; the services that own the
/// surrounding workflow call in.
/// </summary>
public static class MoneyPositivityRules
{
    /// <summary>
    /// Money requirements a package must satisfy before it can be published, phrased to
    /// append to the existing "Complete these before publishing: ..." list.
    ///
    /// Zero is permitted on a component price — a free add-on is a legitimate offer — but
    /// negative never is. The package's own price must be strictly positive, which is the
    /// pre-existing rule, kept here so all the money floors live together.
    /// </summary>
    public static List<string> MissingMoneyRequirements(ServicePackage pkg)
    {
        var missing = new List<string>();

        if (pkg.Price <= 0) missing.Add("price > 0");
        if ((pkg.AddOns ?? []).Any(a => a.Enabled && a.Price < 0))
            missing.Add("non-negative prices on every enabled add-on");
        if (pkg.AdditionalRevisionAvailable && pkg.AdditionalRevisionPrice < 0)
            missing.Add("a non-negative additional-revision price");

        return missing;
    }

    /// <summary>
    /// Validates a proposal's milestone plan. Returns null when valid, otherwise the
    /// reason.
    ///
    /// The sum check alone was insufficient: a plan of [-500, +1500] sums to 1000 and
    /// passed, producing a negative-amount milestone that would authorise negative escrow
    /// and book a negative commission row at release. Both conditions are required —
    /// per-item positivity does not imply the total matches, and the total matching does
    /// not imply the items are positive.
    /// </summary>
    public static string? ValidateMilestonePlan(IReadOnlyList<ProposalMilestonePlanItem> plans, decimal proposedPrice)
    {
        if (plans.Count > 0 && plans.Sum(x => x.Amount) != proposedPrice)
            return "Proposal milestone amounts must equal the accepted proposal price.";

        if (HasNonPositiveMilestone(plans))
            return NonPositiveMilestoneMessage;

        return null;
    }

    public const string NonPositiveMilestoneMessage =
        "Every proposal milestone amount must be greater than zero.";

    /// <summary>
    /// The per-item rule on its own, for the submission-time check. Submission
    /// deliberately does NOT also enforce the sum rule: that has only ever been checked at
    /// conversion, and newly rejecting it here would change behaviour for proposals this
    /// batch is not about.
    /// </summary>
    public static bool HasNonPositiveMilestone(IReadOnlyList<ProposalMilestonePlanItem> plans) =>
        plans.Any(x => x.Amount <= 0);
}
