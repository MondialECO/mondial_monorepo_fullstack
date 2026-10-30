using FluentAssertions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>The off-topic streak is read from and written back to the idea in the same turn write.</summary>
public class ClarifierChatTurnRunnerTests
{
    private const string UserId = "user-1";
    private readonly Mock<ICreatorJourneyService> _journeys = new();
    private readonly Mock<IClarifierTurnService> _turns = new();
    private ClarifierTopicsInput? _input;

    private (int streak, int count, List<ClarifierAnswer> answers) _saved;

    private void Journey(int streak, int count, List<ClarifierAnswer>? answers = null)
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
        _journeys.Setup(j => j.AppendChatMessageAsync(UserId, "user", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int?>()))
            .ReturnsAsync(journey);
        _journeys.Setup(j => j.SaveClarifierTurnAsync(UserId, It.IsAny<List<ClarifierAnswer>>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<List<string>?>(), It.IsAny<int>(), It.IsAny<int>()))
            .Callback<string, List<ClarifierAnswer>, string, string, int?, string, List<string>?, int, int>(
                (_, answers, _, _, _, _, _, streak, count) => _saved = (streak, count, answers))
            .ReturnsAsync(journey);
    }

    private void Ai(ClarifierTopicsResult result) =>
        _turns.Setup(t => t.EvaluateAsync(It.IsAny<ClarifierTopicsInput>(), It.IsAny<CancellationToken>()))
            .Callback<ClarifierTopicsInput, CancellationToken>((input, _) => _input = input)
            .ReturnsAsync(result);

    private ClarifierChatTurnRunner Runner() => new(_journeys.Object, _turns.Object);

    [Fact]
    public async Task OffTopicTurn_IncrementsStreakAndCount_LeavesTopicsAlone_AndReasksTheLastQuestion()
    {
        Journey(streak: 0, count: 4);
        Ai(new ClarifierTopicsResult { AiUsed = true, Relevance = ClarifierRelevance.OffTopic, Nudge = "Back to it!" });

        var response = await Runner().RunAsync(UserId, "hi", "en", "idea-1");

        _saved.streak.Should().Be(1);
        _saved.count.Should().Be(5);
        _saved.answers.Should().ContainSingle(a => a.QuestionIndex == 1, "no topic record was created or changed");
        response.AiText.Should().Be("Back to it!\n\nWho has this problem the most?");
        _input!.AiCallsSoFar.Should().Be(3 + 4, "off-topic turns count toward the per-idea AI cap");
    }

    [Fact]
    public async Task OnTopicTurn_ResetsTheStreak_AndKeepsTheCount()
    {
        Journey(streak: 2, count: 4);
        Ai(new ClarifierTopicsResult
        {
            AiUsed = true,
            Topics = new() { [2] = new ClarifierTopicJudgement { Status = ClarifierTopicState.Clear, Extracted = new() { ["targetUser"] = "Dorm students." } } },
        });

        await Runner().RunAsync(UserId, "dorm students", "en", "idea-1");

        _saved.streak.Should().Be(0);
        _saved.count.Should().Be(4);
    }
}
