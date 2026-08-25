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

    [Fact]
    public void A_manual_canonical_edit_is_not_replaced_by_older_ai_history()
    {
        var project = new CreatorJourneyProject
        {
            Solution = "Creator's corrected solution",
            Problem = "Creator's corrected problem",
        };

        CreatorIdeaCoreMapper.ApplyClarifier(
            project, "Old AI problem", "Customer", "Old AI solution", 60, new(), "Gap", "Edge", "Alternatives", "Timing", "Risk");

        project.Problem.Should().Be("Creator's corrected problem");
        project.Solution.Should().Be("Creator's corrected solution");
    }
}
