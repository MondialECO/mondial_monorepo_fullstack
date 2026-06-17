namespace WebApp.Services;

public enum DealAction
{
    EditTerms,
    ProgressChecklist,
    UpdateStatus,
    MutateDueDiligence,
    UploadDocument,
    DownloadDocument,
    SignTermSheet,
    CloseDeal,
    // Offer-system actions (Phase D-4).
    CreateOffer,
    AcceptOffer,
    RejectOffer,
    CounterOffer,
}

/// <summary>
/// Role-differentiated permission matrix + turn rules for deal write actions
/// (Phase D-3). Founder runs deal execution; the investor signs, uploads,
/// downloads, and responds to offers. The two roles are intentionally NOT
/// equivalent.
/// </summary>
public static class DealActionPolicy
{
    // (founderAllowed, investorAllowed) per action.
    private static readonly IReadOnlyDictionary<DealAction, (bool Founder, bool Investor)> Matrix =
        new Dictionary<DealAction, (bool, bool)>
        {
            [DealAction.EditTerms]          = (true,  false),
            [DealAction.ProgressChecklist]  = (true,  false),
            [DealAction.UpdateStatus]       = (true,  false),
            [DealAction.MutateDueDiligence] = (true,  false),
            [DealAction.UploadDocument]     = (true,  true),
            [DealAction.DownloadDocument]   = (true,  true),
            [DealAction.SignTermSheet]      = (true,  true),
            [DealAction.CloseDeal]          = (true,  false),
            [DealAction.CreateOffer]        = (true,  true),
            [DealAction.AcceptOffer]        = (true,  true),
            [DealAction.RejectOffer]        = (true,  true),
            [DealAction.CounterOffer]       = (true,  true),
        };

    public static bool CanPerform(string role, DealAction action)
    {
        if (!Matrix.TryGetValue(action, out var perm)) return false;
        return role switch
        {
            DealRoles.Founder => perm.Founder,
            DealRoles.Investor => perm.Investor,
            _ => false,
        };
    }

    public static void AssertCanPerform(string role, DealAction action)
    {
        if (!CanPerform(role, action))
            throw new UnauthorizedAccessException(
                $"Role '{role}' is not permitted to perform '{action}' on this deal.");
    }

    /// <summary>
    /// Turn rule: a party may never accept/reject/counter an offer it proposed
    /// itself (e.g. an investor cannot accept their own offer).
    /// </summary>
    public static bool CanRespondToOffer(string responderRole, string proposerRole)
        => !string.IsNullOrWhiteSpace(responderRole)
           && !string.IsNullOrWhiteSpace(proposerRole)
           && !string.Equals(responderRole, proposerRole, StringComparison.Ordinal);

    /// <summary>
    /// The signature slot a role writes. A caller can only ever sign their own
    /// slot, so cross-slot signing is impossible by construction.
    /// </summary>
    public static string SignatureSlotForRole(string role) => role;
}
