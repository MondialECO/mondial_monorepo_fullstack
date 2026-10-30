using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class CreatorIdeaCoreMapperTests
{
    [Fact]
    public void Clarifier_populates_the_canonical_core_without_a_second_representation()
    {
        var project = new CreatorJourneyProject();

        CreatorIdeaCoreMapper.ApplyClarifier(
            project,
            "Dispatchers lose time to phone calls.", "Regional delivery operators", "A route coordination app.", 82,
            new List<string> { "logistics" }, "Live exception handling", "I ran dispatch operations for five years.",
            "Calls, spreadsheets, and WhatsApp", "Smartphone adoption makes field coordination practical now.",
            "Drivers will use the app every day.");

        project.Problem.Should().Be("Dispatchers lose time to phone calls.");
        project.TargetUser.Should().Be("Regional delivery operators");
        project.ExistingAlternatives.Should().Be("Calls, spreadsheets, and WhatsApp");
        project.Solution.Should().Be("A route coordination app.");
        project.MarketGap.Should().Be("Live exception handling");
        project.CreatorEdge.Should().Be("I ran dispatch operations for five years.");
        project.WhyNow.Should().Be("Smartphone adoption makes field coordination practical now.");
        project.RiskiestAssumption.Should().Be("Drivers will use the app every day.");
        project.SourceMethod.Should().Be("clarifier");
    }

    [Fact]
    public void Discovery_populates_the_same_core_and_leaves_unknown_fields_empty()
    {
        var project = new CreatorJourneyProject();
        var concept = new CreatorDiscoveryConcept
        {
            CoreProblem = "Small farms cannot schedule irrigation efficiently.",
            TargetUser = "Smallholder farms",
            Solution = "A weather-aware irrigation planner.",
            MarketGap = "Simple setup for low-connectivity farms",
            FounderEdge = "Agronomy background",
            Category = "AgriTech",
            Concept = "Irrigation planning for small farms",
            Score = 75,
        };

        CreatorIdeaCoreMapper.ApplyDiscovery(project, concept);

        project.Problem.Should().Be(concept.CoreProblem);
        project.TargetUser.Should().Be(concept.TargetUser);
        project.Solution.Should().Be(concept.Solution);
        project.MarketGap.Should().Be(concept.MarketGap);
        project.CreatorEdge.Should().Be(concept.FounderEdge);
        project.SourceMethod.Should().Be("discovery");
        project.ExistingAlternatives.Should().BeEmpty();
        project.WhyNow.Should().BeEmpty();
        project.RiskiestAssumption.Should().BeEmpty();
    }

    [Fact]
    public void Separate_ideas_remain_isolated_when_their_cores_are_mapped()
    {
        var ideaA = new CreatorJourneyProject();
        var ideaB = new CreatorJourneyProject();

        CreatorIdeaCoreMapper.ApplyClarifier(ideaA, "A problem", "A customer", "A solution", 80, new(), "A gap", "A founder edge", "A alternative", "A timing", "A risk");
        CreatorIdeaCoreMapper.ApplyDiscovery(ideaB, new CreatorDiscoveryConcept { CoreProblem = "B problem", TargetUser = "B customer", Solution = "B solution" });

        ideaA.Problem.Should().Be("A problem");
        ideaB.Problem.Should().Be("B problem");
        ideaA.SourceMethod.Should().Be("clarifier");
        ideaB.SourceMethod.Should().Be("discovery");
    }

    private static CreatorJourneyProject Summarized()
    {
        var project = new CreatorJourneyProject();
        CreatorIdeaCoreMapper.ApplyClarifier(
            project, "Thin problem", "Students", "An app", 42, new List<string> { "food" }, "Old gap", "Old edge",
            "Old alternatives", "Old timing", "Old risk");
        return project;
    }

    [Fact]
    public void Rerunning_the_summary_overwrites_every_clarifier_owned_field_and_the_score()
    {
        var project = Summarized();

        CreatorIdeaCoreMapper.ApplyClarifier(
            project, "Dorm students can't find cheap healthy food.", "Dorm students", "A meal-sharing app.", 81,
            new List<string> { "foodtech" }, "Student-cooked meals", "Lived in a dorm three years",
            "Uber Eats is too expensive", "Food prices rose", "Trust in strangers' cooking");

        project.Should().BeEquivalentTo(new
        {
            Problem = "Dorm students can't find cheap healthy food.",
            TargetUser = "Dorm students",
            Solution = "A meal-sharing app.",
            Concept = "A meal-sharing app.",
            MarketGap = "Student-cooked meals",
            CreatorEdge = "Lived in a dorm three years",
            ExistingAlternatives = "Uber Eats is too expensive",
            WhyNow = "Food prices rose",
            RiskiestAssumption = "Trust in strangers' cooking",
            Tags = new List<string> { "foodtech" },
            ClarityScore = 81.0,
        }, o => o.ExcludingMissingMembers());
        project.FieldProvenance.Should().OnlyContain(kv => kv.Value == ProjectFieldProvenance.Clarifier);
        project.FieldProvenance!.Keys.Should().BeEquivalentTo(ProjectFieldProvenance.ClarifierOwned);
    }

    [Fact]
    public void A_field_the_creator_edited_by_hand_is_kept_on_a_summary_rerun()
    {
        var project = Summarized();
        project.Problem = "Creator's corrected problem";
        CreatorIdeaCoreMapper.MarkUserEdited(project, ProjectFieldProvenance.Problem);

        CreatorIdeaCoreMapper.ApplyClarifier(
            project, "New AI problem", "Dorm students", "A meal-sharing app.", 81, new(), "Gap", "Edge", "Alternatives", "Timing", "Risk");

        project.Problem.Should().Be("Creator's corrected problem");
        project.FieldProvenance![ProjectFieldProvenance.Problem].Should().Be(ProjectFieldProvenance.UserEdited);
        project.Solution.Should().Be("A meal-sharing app.", "fields not edited by hand still follow the new summary");
    }

    [Fact]
    public void An_empty_value_in_the_new_summary_keeps_the_current_field()
    {
        var project = Summarized();

        CreatorIdeaCoreMapper.ApplyClarifier(project, "New problem", "", "", 70, new(), "", "", "", "", "");

        project.Problem.Should().Be("New problem");
        project.TargetUser.Should().Be("Students");
        project.WhyNow.Should().Be("Old timing");
        project.Tags.Should().Equal("food");
        project.ClarityScore.Should().Be(70);
    }

    [Fact]
    public void A_legacy_project_without_provenance_is_treated_as_clarifier_owned()
    {
        var legacy = new CreatorJourneyProject
        {
            Problem = "Legacy problem", Solution = "Legacy solution", ClarityScore = 55, SourceMethod = "clarifier",
        };

        CreatorIdeaCoreMapper.ApplyClarifier(
            legacy, "Re-run problem", "Customer", "Re-run solution", 77, new(), "Gap", "Edge", "Alternatives", "Timing", "Risk");

        legacy.Problem.Should().Be("Re-run problem");
        legacy.Solution.Should().Be("Re-run solution");
        legacy.ClarityScore.Should().Be(77);
        legacy.SourceMethod.Should().Be("clarifier");
        legacy.FieldProvenance.Should().NotBeNull();
    }
}
