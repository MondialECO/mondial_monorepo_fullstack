using FluentAssertions;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Creator.Unit;

/// <summary>What the clarifier-related service writes actually send to the idea document.</summary>
public class CreatorJourneyClarifierWriteTests
{
    private const string UserId = "user-1";
    private const string IdeaId = "idea-1";

    private readonly Mock<ICreatorIdeaStore> _ideas = new();
    private readonly List<BsonDocument> _writes = new();

    private CreatorJourneyService Service(CreatorIdea idea, bool versionMatches = true)
    {
        var journey = new CreatorJourney { Id = "journey-1", UserId = UserId, ActiveIdeaId = idea.Id };
        var cursor = new Mock<IAsyncCursor<CreatorJourney>>();
        cursor.Setup(c => c.Current).Returns(new List<CreatorJourney> { journey });
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
        var journeys = new Mock<IMongoCollection<CreatorJourney>>();
        journeys.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorJourney>>(),
                It.IsAny<FindOptions<CreatorJourney, CreatorJourney>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
        var db = new Mock<IMongoDatabase>();
        db.Setup(d => d.GetCollection<CreatorJourney>("CreatorJourneys", null)).Returns(journeys.Object);

        _ideas.Setup(s => s.GetOwnedAsync(idea.Id, UserId)).ReturnsAsync(idea);
        _ideas.Setup(s => s.ListByUserAsync(UserId)).ReturnsAsync(new List<CreatorIdea> { idea });
        _ideas.Setup(s => s.UpdateAsync(idea.Id, UserId, It.IsAny<UpdateDefinition<CreatorIdea>>(), It.IsAny<long?>(), It.IsAny<IClientSessionHandle?>()))
            .Callback<string, string, UpdateDefinition<CreatorIdea>, long?, IClientSessionHandle?>((_, _, update, _, _) =>
            {
                if (versionMatches) _writes.Add(Render(update));
            })
            .ReturnsAsync(versionMatches);

        return new CreatorJourneyService(new MongoDbContext(db.Object), Mock.Of<IBusinessPlanSessionStore>(),
            Mock.Of<IForecastSessionStore>(), _ideas.Object, Mock.Of<IClarifierSessionStore>());
    }

    private static BsonDocument Render(UpdateDefinition<CreatorIdea> update) =>
        update.Render(BsonSerializer.SerializerRegistry.GetSerializer<CreatorIdea>(), BsonSerializer.SerializerRegistry).AsBsonDocument;

    private static CreatorIdea Idea() => new()
    {
        Id = IdeaId,
        UserId = UserId,
        Project = new CreatorJourneyProject
        {
            Problem = "AI problem",
            FieldProvenance = new Dictionary<string, string> { [ProjectFieldProvenance.Problem] = ProjectFieldProvenance.Clarifier },
        },
    };

    // ---- one write per chat turn ----

    private static ClarifierTurnWrite Turn() => new(
        new List<ClarifierAnswer> { new() { QuestionIndex = 1, Status = ClarifierAnswerStatus.Accepted, RawAnswer = "idea" } },
        new ClarifierTurnMessage("user", "idea", null, 1),
        new ClarifierTurnMessage("ai", "Who has it?", "question", 2),
        OffTopicStreak: 0,
        OffTopicCount: 2);

    [Fact]
    public async Task ClarifierTurn_IsOneUpdate_SettingTopicsAndCounters_AndPushingBothMessages()
    {
        var result = await Service(Idea()).SaveClarifierTurnAsync(UserId, Turn(), IdeaId);

        var update = _writes.Should().ContainSingle().Subject;
        update["$set"].AsBsonDocument.Names.Should().Contain(new[]
        {
            "Phase2Data.ClarifierAnswers", "Phase2Data.ClarifierOffTopicStreak", "Phase2Data.ClarifierOffTopicCount",
        });
        var pushed = update["$push"]["Phase2Data.ChatMessages"]["$each"].AsBsonArray;
        pushed.Select(m => m["Sender"].AsString).Should().Equal("user", "ai");
        result.Phase2Data.ChatMessages.Select(m => m.Text).Should().Equal("idea", "Who has it?");
    }

    [Fact]
    public async Task ClarifierTurn_VersionConflict_Is409_AndStoresNothing()
    {
        var act = () => Service(Idea(), versionMatches: false).SaveClarifierTurnAsync(UserId, Turn(), IdeaId);

        (await act.Should().ThrowAsync<CreatorJourneyException>()).Which.StatusCode.Should().Be(409);
        _writes.Should().BeEmpty();
    }

    // ---- PATCH provenance ----

    [Fact]
    public async Task Patch_MarksEveryChangedClarifierOwnedField_AsUserEdited_InTheWrite()
    {
        var result = await Service(Idea()).UpdateProjectAsync(UserId, new UpdateProjectRequest
        {
            Problem = "My own problem", WhyNow = "Rents doubled", Tags = new List<string> { "food" }, ClarityScore = 80,
            Tagline = "not clarifier-owned",
        }, IdeaId);

        var provenance = result.Project.FieldProvenance!;
        provenance.Should().Contain(ProjectFieldProvenance.Problem, ProjectFieldProvenance.UserEdited)
            .And.Contain(ProjectFieldProvenance.WhyNow, ProjectFieldProvenance.UserEdited)
            .And.Contain(ProjectFieldProvenance.Tags, ProjectFieldProvenance.UserEdited)
            .And.Contain(ProjectFieldProvenance.ClarityScore, ProjectFieldProvenance.UserEdited)
            .And.NotContainKey("Tagline");

        var written = _writes.Should().ContainSingle().Subject["$set"]["Project"]["FieldProvenance"].AsBsonDocument;
        written[ProjectFieldProvenance.Problem].AsString.Should().Be(ProjectFieldProvenance.UserEdited);
        written[ProjectFieldProvenance.WhyNow].AsString.Should().Be(ProjectFieldProvenance.UserEdited);
    }

    [Fact]
    public async Task Patch_ThenSummaryReRun_KeepsTheCreatorsText()
    {
        var idea = Idea();
        var result = await Service(idea).UpdateProjectAsync(UserId, new UpdateProjectRequest { Problem = "My own problem" }, IdeaId);

        CreatorIdeaCoreMapper.ApplyClarifier(result.Project, problem: "New AI problem", targetUser: "students",
            solution: "", clarityScore: 70, tags: new List<string>(), marketGap: "", creatorEdge: "",
            existingAlternatives: "", whyNow: "", riskiestAssumption: "");

        result.Project.Problem.Should().Be("My own problem");
        result.Project.TargetUser.Should().Be("students");
    }

    [Fact]
    public async Task Patch_OfOnlyNonClarifierFields_LeavesProvenanceAlone()
    {
        var result = await Service(Idea()).UpdateProjectAsync(UserId, new UpdateProjectRequest { Name = "Distinct name", Tagline = "t" }, IdeaId);

        result.Project.FieldProvenance.Should().Equal(new Dictionary<string, string> { [ProjectFieldProvenance.Problem] = ProjectFieldProvenance.Clarifier });
    }
}
