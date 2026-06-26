using WebApp.Models.DatabaseModels;

namespace WebApp.Services;

public static class DealRoles
{
    public const string Founder = "founder";
    public const string Investor = "investor";
}

/// <summary>
/// Resolved authorization context for a deal. Produced ONLY by
/// <c>EnsureDealParticipantAsync</c>; carries the caller's role and the
/// principal id it was matched on (founder = ApplicationUser id, investor =
/// InvestorProfile.InvestorId). Deal services require this object rather than a
/// bare dealId, so a missing controller gate cannot reach a mutation/read.
/// </summary>
public class DealAccessContext
{
    public DealExecution Deal { get; init; } = null!;
    public string Role { get; init; } = "";
    public string PrincipalId { get; init; } = "";

    public bool IsFounder => Role == DealRoles.Founder;
    public bool IsInvestor => Role == DealRoles.Investor;
}

/// <summary>
/// Pure, side-effect-free deal role resolver — unit-testable without IO.
///   Founder : caller's user id == the company owner id.
///   Investor: caller's InvestorProfile.InvestorId ∈ the deal's participant
///             investor ids.
/// The investor is NEVER matched by raw user id — the two participants are
/// keyed by different id types and conflating them is a privilege-escalation
/// risk (see Deal Execution Readiness Audit, Risk B-1).
/// </summary>
public static class DealAccessResolver
{
    public sealed record Resolution(string Role, string PrincipalId);

    public static Resolution? Resolve(
        string? userId,
        string? companyOwnerId,
        string? investorProfileId,
        IEnumerable<string> dealInvestorIds)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        // Founder takes precedence and needs no investor profile.
        if (!string.IsNullOrWhiteSpace(companyOwnerId) &&
            string.Equals(companyOwnerId, userId, StringComparison.Ordinal))
            return new Resolution(DealRoles.Founder, userId);

        // Investor must match the catalogue InvestorId — never the user id.
        if (!string.IsNullOrWhiteSpace(investorProfileId) &&
            dealInvestorIds.Any(id => string.Equals(id, investorProfileId, StringComparison.Ordinal)))
            return new Resolution(DealRoles.Investor, investorProfileId!);

        return null; // non-participant
    }
}
