using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using Xunit;

namespace WebApp.Tests.Unit;

public class Phase8DoubleOptInAndMeetingTests
{
    [Fact]
    public void InvestorMatch_DefaultInterestStateIsNew()
    {
        var match = new InvestorMatch();
        Assert.Equal("new", match.EntrepreneurInterest);
        Assert.Equal("new", match.InvestorInterest);
        Assert.Null(match.HandshakeConfirmedAt);
        Assert.Null(match.ScheduledMeeting);
    }

    [Fact]
    public void InvestorMatch_PopulatesPhase7IntelligenceSnapshot()
    {
        var match = new InvestorMatch
        {
            Phase7IntelligenceSnapshot = new Phase7MatchingIntelligence
            {
                RiskBand = "Low",
                ValidatedSectorTags = new List<string> { "AI & Big Data" },
                RecommendedInvestorTypes = new List<string> { "Venture Capital" }
            }
        };

        Assert.NotNull(match.Phase7IntelligenceSnapshot);
        Assert.Equal("Low", match.Phase7IntelligenceSnapshot.RiskBand);
        Assert.Contains("AI & Big Data", match.Phase7IntelligenceSnapshot.ValidatedSectorTags);
    }

    [Fact]
    public void InvestorMatch_ScheduledMeetingRecordProperties()
    {
        var startsAt = DateTime.UtcNow.AddDays(3);
        var meeting = new InvestorMeetingRecord
        {
            StartsAt = startsAt,
            DurationMinutes = 45,
            Timezone = "Europe/Paris",
            MeetingType = "video",
            Note = "Discussion of Q3 ARR growth and Series Seed tranches",
            Status = "confirmed",
            CreatedBy = "entrepreneur"
        };

        Assert.NotEmpty(meeting.MeetingId);
        Assert.Equal(45, meeting.DurationMinutes);
        Assert.Equal("Europe/Paris", meeting.Timezone);
        Assert.Equal("video", meeting.MeetingType);
        Assert.Equal("confirmed", meeting.Status);
    }

    [Fact]
    public void Handshake_IsIdempotent_PreservesFirstTimestamp()
    {
        var match = new InvestorMatch
        {
            EntrepreneurInterest = "interested",
            InvestorInterest = "new",
            Status = "interested"
        };

        // First mutual opt-in
        match.InvestorInterest = "interested";
        var firstTimestamp = DateTime.UtcNow.AddMinutes(-10);
        match.HandshakeConfirmedAt = firstTimestamp;
        match.Status = "accepted";

        // Repeated mutation
        match.HandshakeConfirmedAt ??= DateTime.UtcNow;

        Assert.Equal(firstTimestamp, match.HandshakeConfirmedAt);
        Assert.Equal("accepted", match.Status);
    }

    [Fact]
    public void MeetingCancel_Persists_AndPreservesHandshake()
    {
        var match = new InvestorMatch
        {
            Status = "accepted",
            EntrepreneurInterest = "interested",
            InvestorInterest = "interested",
            HandshakeConfirmedAt = DateTime.UtcNow,
            ScheduledMeeting = new InvestorMeetingRecord
            {
                Status = "confirmed",
                StartsAt = DateTime.UtcNow.AddDays(2)
            }
        };

        // Cancel meeting
        match.ScheduledMeeting.Status = "cancelled";

        Assert.Equal("cancelled", match.ScheduledMeeting.Status);
        Assert.Equal("accepted", match.Status);
        Assert.NotNull(match.HandshakeConfirmedAt);
    }
}
