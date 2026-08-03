using FluentAssertions;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// The rule that a user cannot be both provider and client on one engagement. Pure, so it
/// is tested directly; the wiring into the four call sites is covered by
/// SelfDealingIntegrationTests, which needs a real database.
/// </summary>
public class SelfDealingGuardTests
{
    private const string User = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    private const string Other = "8b1a9953-c461-4c1a-9f0e-2b6d4a1c7e55";

    [Fact]
    public void The_same_user_on_both_sides_is_self_dealing()
        => SelfDealingGuard.IsSelfDealing(User, User).Should().BeTrue();

    [Fact]
    public void Two_different_users_are_not_self_dealing()
        => SelfDealingGuard.IsSelfDealing(User, Other).Should().BeFalse();

    /// <summary>
    /// These are GUID strings copied between the identity store, proposals and
    /// engagements; nothing guarantees casing survives that round trip identically, and a
    /// case-sensitive compare would let the whole guard be bypassed by casing alone.
    /// </summary>
    [Fact]
    public void Casing_does_not_defeat_the_guard()
    {
        SelfDealingGuard.IsSelfDealing(User.ToUpperInvariant(), User.ToLowerInvariant())
            .Should().BeTrue();
    }

    /// <summary>
    /// Blank ids must read as "not self-dealing" rather than matching each other. Two
    /// missing ids are missing data, not one user on both sides, and the call sites reject
    /// unresolvable accounts separately — turning absence into a match here would surface
    /// as a confusing self-dealing refusal on an unrelated fault.
    /// </summary>
    [Theory]
    [InlineData(null, null)]
    [InlineData("", "")]
    [InlineData("   ", "   ")]
    [InlineData(null, User)]
    [InlineData(User, null)]
    [InlineData("", User)]
    [InlineData(User, "")]
    public void Missing_ids_are_never_treated_as_a_match(string? providerId, string? clientId)
        => SelfDealingGuard.IsSelfDealing(providerId, clientId).Should().BeFalse();

    /// <summary>
    /// The message reaches the buyer verbatim at both entry points, so it must explain the
    /// rule rather than name internals. A provider browsing the shared marketplace can
    /// reach this without malice.
    /// </summary>
    [Fact]
    public void The_refusal_message_is_user_facing()
    {
        SelfDealingGuard.Message.Should().NotBeNullOrWhiteSpace();
        SelfDealingGuard.Message.Should().NotContainAny("ProviderId", "ClientId", "null", "Exception");
    }
}
