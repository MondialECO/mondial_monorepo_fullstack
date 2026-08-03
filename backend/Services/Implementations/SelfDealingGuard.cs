namespace WebApp.Services.Implementations;

/// <summary>
/// A user must never be both the provider and the client on the same engagement.
///
/// Nothing enforced this before, and the consequences compounded well past the obvious
/// one. A provider could buy their own published package, carry the engagement to
/// Completed alone (funding, activating, submitting and approving every step, because
/// each role check passes when both roles are the same person), then submit themselves a
/// five-star Review — which lands as <c>VerificationStatus.Verified</c> by model default,
/// with no moderation step. <c>WorkroomService.RefreshTrust</c> filters none of this out,
/// so Client Satisfaction, On-time Delivery and Repeat-Client Rate all inflate, and
/// <c>SpMatchingService</c> ranks the result above honest providers. Repeat-client
/// coupons and the marketplace CompletedOrders/rating figures follow the same records.
///
/// The rule lives here rather than being restated at each call site so the three
/// entry-point guards and the structural one in ConvertProposalAsync cannot drift apart
/// on what "same user" means.
/// </summary>
public static class SelfDealingGuard
{
    /// <summary>
    /// Shown to the user at both entry points. Deliberately explains the rule rather than
    /// the mechanism — this is reachable through the normal UI by anyone who happens to be
    /// a provider browsing the shared marketplace, so it is not necessarily an attack.
    /// </summary>
    public const string Message = "You cannot buy your own service. The provider and the client on an engagement must be different accounts.";

    /// <summary>
    /// Case-insensitive because these are GUID strings whose casing is not guaranteed
    /// stable across the identity store and the various collections that copy them —
    /// matching how <c>WorkroomService</c> keys its display-name dictionaries.
    /// Blank ids are treated as "not self-dealing" so this never turns missing data into
    /// a spurious rejection; the callers already reject unresolvable accounts separately.
    /// </summary>
    public static bool IsSelfDealing(string? providerId, string? clientId) =>
        !string.IsNullOrWhiteSpace(providerId)
        && !string.IsNullOrWhiteSpace(clientId)
        && string.Equals(providerId, clientId, StringComparison.OrdinalIgnoreCase);
}
