using FluentAssertions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>A turn is judged in memory and persisted in exactly one write (message + reply + topics + counters).</summary>
public class ClarifierChatTurnRunnerTests
{
    private const string UserId = "user-1";
    private readonly Mock<ICreatorJourneyService> _journeys = new();
    private readonly Mock<IClarifierTurnService> _turns = new();
    private ClarifierTopicsInput? _input;
    private readonly List<ClarifierTurnWrite> _saved = new();

    private void Journey(int streak, int count, List<ClarifierAnswer>? answers = null, Exception? saveFails = null)
    {
        var journey = new CreatorJourney
        {
            Phase2Data = new CreatorPhase2Data
            {
                ClarifierAnswers = answers ?? new List<ClarifierAnswer> { new() { QuestionIndex = 1, Status = ClarifierAnswerStatus.Accepted, Attempts = 3 } },
                ClarifierOffTopicStreak = streak,
                ClarifierOffTopicCount = count,
                ChatMessages = new List<CreatorChatMessage>
                {
                    new() { Sender = "ai", QuestionIndex = 2, Text = "Nice.\n\nWho has this problem the most?" },
                },
            },
        };
        _journeys.Setup(j => j.GetOrCreateComposedAsync(UserId, It.IsAny<string>())).ReturnsAsync(journey);
        var save = _journeys.Setup(j => j.SaveClarifierTurnAsync(UserId, It.IsAny<ClarifierTurnWrite>(), It.IsAny<string>()))
            .Callback<string, ClarifierTurnWrite, string>((_, turn, _) => _saved.Add(turn));
        if (saveFails != null) save.ThrowsAsync(saveFails);
        else save.ReturnsAsync(journey);
    }

    private void Ai(ClarifierTopicsResult result) =>
        _turns.Setup(t => t.EvaluateAsync(It.IsAny<ClarifierTopicsInput>(), It.IsAny<CancellationToken>()))
            .Callback<ClarifierTopicsInput, CancellationToken>((input, _) => _input = input)
            .ReturnsAsync(result);

    private ClarifierChatTurnRunner Runner() => new(_journeys.Object, _turns.Object);

    private static ClarifierTopicsResult ClearWho() => new()
    {
        AiUsed = true,
        Topics = new() { [2] = new ClarifierTopicJudgement { Status = ClarifierTopicState.Clear, Extracted = new() { ["targetUser"] = "Dorm students." } } },
    };

    [Fact]
    public async Task Success_WritesOnce_WithTheUserMessageReplyTopicsAndCounters()
    {
        Journey(streak: 0, count: 0);
        Ai(ClearWho());

        await Runner().RunAsync(UserId, "dorm students", "en", "idea-1");

        var turn = _saved.Should().ContainSingle().Subject;
        turn.Incoming.Should().Be(new ClarifierTurnMessage("user", "dorm students", null, 2));
        turn.Reply.Sender.Should().Be("ai");
        turn.Answers.Should().Contain(a => a.QuestionIndex == 2 && a.Status == ClarifierAnswerStatus.Accepted);
        _input!.LatestMessage.Should().Be("dorm students", "the AI sees the new message in memory, before any write");
        _input.Transcript.Should().ContainSingle();
    }

    [Fact]
    public async Task VersionConflict_Returns409_AndNothingElseIsWritten()
    {
        Journey(streak: 0, count: 0, saveFails: new CreatorJourneyException(409, "This idea was updated in another tab."));
        Ai(ClearWho());

        var act = () => Runner().RunAsync(UserId, "dorm students", "en", "idea-1");

        (await act.Should().ThrowAsync<CreatorJourneyException>()).Which.StatusCode.Should().Be(409);
        _saved.Should().ContainSingle("the one turn write is the only write attempted");
        _journeys.Verify(j => j.SaveClarifierTurnAsync(It.IsAny<string>(), It.IsAny<ClarifierTurnWrite>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task AiFailure_StillWritesOnce_FailOpen()
    {
        Journey(streak: 0, count: 0);
        Ai(ClarifierTopicsResult.FailOpen());

        await Runner().RunAsync(UserId, "dorm students", "en", "idea-1");

        var turn = _saved.Should().ContainSingle().Subject;
        turn.Answers.Should().Contain(a => a.QuestionIndex == 2 && a.Status == ClarifierAnswerStatus.AcceptedWeak);
        turn.Incoming.Text.Should().Be("dorm students");
    }

    [Fact]
    public async Task OffTopicTurn_IncrementsStreakAndCount_LeavesTopicsAlone_AndReasksTheLastQuestion()
    {
        Journey(streak: 0, count: 4);
        Ai(new ClarifierTopicsResult { AiUsed = true, Relevance = ClarifierRelevance.OffTopic, Nudge = "Back to it!" });

        var response = await Runner().RunAsync(UserId, "hi", "en", "idea-1");

        var turn = _saved.Should().ContainSingle().Subject;
        turn.OffTopicStreak.Should().Be(1);
        turn.OffTopicCount.Should().Be(5);
        turn.Answers.Should().ContainSingle(a => a.QuestionIndex == 1, "no topic record was created or changed");
        response.AiText.Should().Be("Back to it!\n\nWho has this problem the most?");
        _input!.AiCallsSoFar.Should().Be(3 + 4, "off-topic turns count toward the per-idea AI cap");
    }

    [Fact]
    public async Task Skip_OnAFollowUp_WritesOnce_WithASystemNote_AndNeverCallsTheAi()
    {
        Journey(streak: 1, count: 4, answers: new List<ClarifierAnswer>
        {
            new() { QuestionIndex = 1, Status = ClarifierAnswerStatus.Accepted, Attempts = 1 },
            new() { QuestionIndex = 2, Status = ClarifierAnswerStatus.Pending, Attempts = 1, FollowUpUsed = true, RawAnswer = "students" },
        });
        var p2 = (await _journeys.Object.GetOrCreateComposedAsync(UserId, "idea-1")).Phase2Data!;
        p2.ChatMessages!.Add(new CreatorChatMessage { Sender = "ai", Kind = "followup", QuestionIndex = 2, Text = "Which students?" });

        var response = await Runner().SkipFollowUpAsync(UserId, "fr", "idea-1");

        _turns.Verify(t => t.EvaluateAsync(It.IsAny<ClarifierTopicsInput>(), It.IsAny<CancellationToken>()), Times.Never);
        var turn = _saved.Should().ContainSingle().Subject;
        turn.Incoming.Should().Be(new ClarifierTurnMessage("system", ClarifierScript.SkipNoteFr, "skip", 2));
        turn.Reply.Should().BeEquivalentTo(new { Sender = "ai", Text = ClarifierScript.BaseQuestion(4, "fr"), Kind = "question", QuestionIndex = (int?)4 });
        turn.Answers.Single(a => a.QuestionIndex == 2).Status.Should().Be(ClarifierAnswerStatus.AcceptedWeak);
        turn.Answers.Sum(a => a.Attempts).Should().Be(2, "a Skip never counts toward the AI cap");
        turn.OffTopicStreak.Should().Be(0);
        turn.OffTopicCount.Should().Be(4);
        response.AiUsed.Should().BeFalse();
        response.CurrentTopic.Should().Be(4);
    }

    [Fact]
    public async Task Skip_WhenTheLatestMessageIsNotAFollowUp_Is409_AndWritesNothing()
    {
        Journey(streak: 0, count: 0, answers: new List<ClarifierAnswer>
        {
            new() { QuestionIndex = 1, Status = ClarifierAnswerStatus.Accepted },
            new() { QuestionIndex = 2, Status = ClarifierAnswerStatus.Pending, FollowUpUsed = true },
        });

        var act = () => Runner().SkipFollowUpAsync(UserId, "en", "idea-1");

        (await act.Should().ThrowAsync<CreatorJourneyException>()).Which.StatusCode.Should().Be(409);
        _saved.Should().BeEmpty();
    }

    [Fact]
    public async Task OnTopicTurn_ResetsTheStreak_AndKeepsTheCount()
    {
        Journey(streak: 2, count: 4);
        Ai(ClearWho());

        await Runner().RunAsync(UserId, "dorm students", "en", "idea-1");

        _saved.Single().OffTopicStreak.Should().Be(0);
        _saved.Single().OffTopicCount.Should().Be(4);
    }
}
