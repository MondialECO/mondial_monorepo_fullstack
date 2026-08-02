namespace WebApp.Services.Implementations;

/// <summary>
/// Pure revision-entitlement math (canon §6.4). Built in Module 2 so the formula is
/// proven in isolation; Module 4 supplies the live <c>purchasedAdditional</c> /
/// <c>used</c> counts. No I/O, no state — trivially unit-testable.
/// </summary>
public static class RevisionCalculator
{
    /// <summary>
    /// Remaining = Included + Purchased Additional − Used (canon §6.4, verbatim).
    /// Returned exactly (not clamped) so the formula is testable literally; Module 4
    /// never lets <c>used</c> exceed entitlement, so a negative should not occur live.
    /// </summary>
    public static int Remaining(int includedRevisionCount, int purchasedAdditionalRevisions, int usedRevisionCount)
        => includedRevisionCount + purchasedAdditionalRevisions - usedRevisionCount;

    /// <summary>
    /// Whether another revision may be requested: always true when the package is
    /// unlimited; otherwise Remaining(...) must be &gt; 0.
    /// </summary>
    public static bool HasRemaining(bool unlimitedRevisions, int includedRevisionCount, int purchasedAdditionalRevisions, int usedRevisionCount)
        => unlimitedRevisions || Remaining(includedRevisionCount, purchasedAdditionalRevisions, usedRevisionCount) > 0;
}
