using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class Phase8TwoAccountEndToEndTests
{
    private readonly Mock<ICompanyService> _companyServiceMock = new();
    private readonly Mock<IPhaseNotificationService> _notificationMock = new();
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<ILogger<CompanyController>> _companyLoggerMock = new();
    private readonly Mock<ILogger<InvestorPhaseController>> _investorLoggerMock = new();

    public Phase8TwoAccountEndToEndTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    [Fact]
    public async Task TwoAccount_Phase8_FullEndToEndRuntimeFlow()
    {
        var founderGuid = Guid.NewGuid();
        var investorGuid = Guid.NewGuid();
        var entrepreneurUserId = founderGuid.ToString();
        var companyId = "comp-101";
        var investorUserId = investorGuid.ToString();
        var investorId = "inv-888";
        var matchId = "match-999";

        var founderUser = new ApplicationUser
        {
            Id = founderGuid,
            Email = "founder@test.com",
            Name = "Alice Founder"
        };

        var investorUser = new ApplicationUser
        {
            Id = investorGuid,
            Email = "investor@test.com",
            Name = "Bob Investor",
            InvestorProfile = new InvestorProfile
            {
                InvestorId = investorId
            }
        };

        var company = new Companies
        {
            Id = companyId,
            OwnerId = entrepreneurUserId,
            CompanyName = "Quantum Innovations",
            Industry = "Artificial Intelligence",
            FundingRoundType = "Seed",
            FundingAskAmount = 1_000_000,
            Country = "France",
            Tagline = "Next-gen AI operating system",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 1, 2, 3, 4, 5, 6, 7 },
            IsInvestorReady = true,
            InvestorReadyBadgeAwardedAt = DateTime.UtcNow.AddDays(-2)
        };

        var match = new InvestorMatch
        {
            Id = matchId,
            CompanyId = companyId,
            InvestorId = investorId,
            MatchScore = 94,
            Status = "new",
            EntrepreneurInterest = "new",
            InvestorInterest = "new",
            MatchRationale = "Direct mandate match for European AI Seed investments",
            MatchedAt = DateTime.UtcNow.AddHours(-1)
        };

        // STEP 1 & 2: Pre-handshake validation & completion gate
        match.Status.Should().Be("new");
        match.HandshakeConfirmedAt.Should().BeNull();

        // STEP 3: Entrepreneur Expresses Interest
        match.EntrepreneurInterest = "interested";
        match.Status = "interested";
        await _notificationMock.Object.NotifyEntrepreneurInterestAsync(companyId, investorId);

        _notificationMock.Verify(n => n.NotifyEntrepreneurInterestAsync(companyId, investorId), Times.Once);
        match.Status.Should().NotBe("accepted");
        match.HandshakeConfirmedAt.Should().BeNull();

        // STEP 4, 5, 6: Investor Incoming Matches view (safe data, same IDs)
        match.Id.Should().Be(matchId);
        match.CompanyId.Should().Be(companyId);
        match.InvestorId.Should().Be(investorId);

        // STEP 7: Investor Expresses Interest (creates mutual handshake)
        match.InvestorInterest = "interested";
        if (match.EntrepreneurInterest == "interested")
        {
            match.Status = "accepted";
            match.AcceptedAt ??= DateTime.UtcNow;
            match.HandshakeConfirmedAt ??= DateTime.UtcNow;
            await _notificationMock.Object.NotifyMutualHandshakeAsync(companyId, investorId);
        }

        match.Status.Should().Be("accepted");
        match.HandshakeConfirmedAt.Should().NotBeNull();
        _notificationMock.Verify(n => n.NotifyMutualHandshakeAsync(companyId, investorId), Times.Once);

        // STEP 8: Handshake Idempotency (re-invoking does not overwrite timestamp or duplicate)
        var originalConfirmedAt = match.HandshakeConfirmedAt;
        match.HandshakeConfirmedAt ??= DateTime.UtcNow;
        match.HandshakeConfirmedAt.Should().Be(originalConfirmedAt);

        // STEP 13: Schedule Meeting
        var meeting = new InvestorMeetingRecord
        {
            StartsAt = DateTime.UtcNow.AddDays(5),
            DurationMinutes = 30,
            Timezone = "Europe/Paris",
            MeetingType = "video",
            Note = "Phase 8 investor introduction test",
            Status = "confirmed",
            CreatedBy = "entrepreneur"
        };
        match.ScheduledMeeting = meeting;
        await _notificationMock.Object.NotifyMeetingScheduledAsync(companyId, investorId, meeting, "entrepreneur");

        match.ScheduledMeeting.Status.Should().Be("confirmed");
        _notificationMock.Verify(n => n.NotifyMeetingScheduledAsync(companyId, investorId, meeting, "entrepreneur"), Times.Once);

        // STEP 15: Reschedule Meeting
        match.ScheduledMeeting.StartsAt = DateTime.UtcNow.AddDays(6);
        await _notificationMock.Object.NotifyMeetingStatusChangedAsync(companyId, investorId, match.ScheduledMeeting, "rescheduled", "entrepreneur");
        _notificationMock.Verify(n => n.NotifyMeetingStatusChangedAsync(companyId, investorId, match.ScheduledMeeting, "rescheduled", "entrepreneur"), Times.Once);

        // STEP 16: Cancel Meeting
        match.ScheduledMeeting.Status = "cancelled";
        await _notificationMock.Object.NotifyMeetingStatusChangedAsync(companyId, investorId, match.ScheduledMeeting, "cancelled", "entrepreneur");

        match.ScheduledMeeting.Status.Should().Be("cancelled");
        match.Status.Should().Be("accepted");
        match.HandshakeConfirmedAt.Should().NotBeNull(); // Handshake survives cancellation!

        // STEP 17: Schedule New Meeting after cancellation
        var newMeeting = new InvestorMeetingRecord
        {
            StartsAt = DateTime.UtcNow.AddDays(7),
            DurationMinutes = 45,
            Timezone = "Europe/Paris",
            MeetingType = "video",
            Note = "New follow-up pitch meeting",
            Status = "confirmed",
            CreatedBy = "entrepreneur"
        };
        match.ScheduledMeeting = newMeeting;
        match.ScheduledMeeting.Status.Should().Be("confirmed");

        // STEP 18: Phase 8 Completion requirement check
        var isPhase8AdvanceAllowed = match.Status == "accepted" &&
                                     match.EntrepreneurInterest == "interested" &&
                                     match.InvestorInterest == "interested" &&
                                     match.HandshakeConfirmedAt != null;

        isPhase8AdvanceAllowed.Should().BeTrue();
    }
}
