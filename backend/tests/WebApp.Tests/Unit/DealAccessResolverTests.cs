using FluentAssertions;
using WebApp.Services;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Pure role-resolution invariants for the bilateral deal authorization
/// foundation (Phase D-2). These pin the security-critical rule that an
/// investor is matched ONLY by InvestorProfile.InvestorId, never the raw
/// user id (Readiness Audit Risk B-1).
/// </summary>
public class DealAccessResolverTests
{
    private const string UserId = "11111111-1111-1111-1111-111111111111";
    private const string InvestorProfileId = "inv-catalogue-99";

    [Fact]
    public void Founder_is_resolved_when_user_owns_the_company()
    {
        var result = DealAccessResolver.Resolve(
            userId: UserId,
            companyOwnerId: UserId,
            investorProfileId: null,
            dealInvestorIds: new[] { "inv-other" });

        result.Should().NotBeNull();
        result!.Role.Should().Be(DealRoles.Founder);
        result.PrincipalId.Should().Be(UserId);
    }

    [Fact]
    public void Investor_is_resolved_by_catalogue_investor_id()
    {
        var result = DealAccessResolver.Resolve(
            userId: UserId,
            companyOwnerId: "some-other-owner",
            investorProfileId: InvestorProfileId,
            dealInvestorIds: new[] { "inv-x", InvestorProfileId });

        result.Should().NotBeNull();
        result!.Role.Should().Be(DealRoles.Investor);
        result.PrincipalId.Should().Be(InvestorProfileId);
    }

    [Fact]
    public void Wrong_key_user_id_present_in_deal_investors_does_not_grant_access()
    {
        // Even if the deal's investor list literally contains the caller's user
        // id, matching must require the InvestorProfile.InvestorId. The caller
        // here is not the owner and has no investor profile.
        var result = DealAccessResolver.Resolve(
            userId: UserId,
            companyOwnerId: "some-other-owner",
            investorProfileId: null,
            dealInvestorIds: new[] { UserId });

        result.Should().BeNull();
    }

    [Fact]
    public void Non_participant_investor_profile_not_in_deal_returns_null()
    {
        var result = DealAccessResolver.Resolve(
            userId: UserId,
            companyOwnerId: "some-other-owner",
            investorProfileId: InvestorProfileId,
            dealInvestorIds: new[] { "inv-y", "inv-z" });

        result.Should().BeNull();
    }

    [Fact]
    public void No_investor_profile_and_not_owner_returns_null()
    {
        var result = DealAccessResolver.Resolve(
            userId: UserId,
            companyOwnerId: "some-other-owner",
            investorProfileId: null,
            dealInvestorIds: new[] { "inv-y" });

        result.Should().BeNull();
    }
}
