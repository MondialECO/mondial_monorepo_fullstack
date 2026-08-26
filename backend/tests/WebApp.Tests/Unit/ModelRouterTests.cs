using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;
using WebApp.Services.Ai.Providers;
using Xunit;

namespace WebApp.Tests.Unit;

public class ModelRouterTests
{
    private static ModelRouter Build(Dictionary<string, string> models, string defaultModel)
    {
        var settings = new AiSettings
        {
            ModelRouting = new ModelRoutingSettings { Models = models, DefaultModel = defaultModel }
        };
        return new ModelRouter(Options.Create(settings), NullLogger<ModelRouter>.Instance);
    }

    [Fact]
    public void Resolves_explicit_route_for_known_task()
    {
        var router = Build(new() { ["Probe"] = "openai/gpt-4o-mini", ["BusinessPlan"] = "openai/gpt-4o" }, "default/model");

        router.Resolve("Probe").Should().Be("openai/gpt-4o-mini");
        router.Resolve("BusinessPlan").Should().Be("openai/gpt-4o");
    }

    // ---- C-2 P4: IdeaClarifier routing (mirrors the shipped appsettings map) ----

    private static ModelRouter ShippedRouter() => Build(new()
    {
        ["Probe"] = "minimax/minimax-m2.7:free",
        ["IdeaClarifier"] = "minimax/minimax-m2.7:free",
        ["BusinessPlan"] = "minimax/minimax-m2.7:free",
        ["Forecast"] = "minimax/minimax-m2.7:free",
        ["IdeaGenerator"] = "minimax/minimax-m2.7:free",
    }, "minimax/minimax-m2.7:free");

    [Fact]
    public void Shipped_router_routes_all_tasks_to_minimax_free_model()
    {
        var router = ShippedRouter();
        router.Resolve("Probe").Should().Be("minimax/minimax-m2.7:free");
        router.Resolve("IdeaClarifier").Should().Be("minimax/minimax-m2.7:free");
        router.Resolve("BusinessPlan").Should().Be("minimax/minimax-m2.7:free");
        router.Resolve("Forecast").Should().Be("minimax/minimax-m2.7:free");
        router.Resolve("IdeaGenerator").Should().Be("minimax/minimax-m2.7:free");
        router.Resolve("UnknownFallback").Should().Be("minimax/minimax-m2.7:free");
    }

    [Fact]
    public void Routes_business_plan_to_minimax_free_model()
    {
        var resolved = ShippedRouter().Resolve("BusinessPlan");
        resolved.Should().Be("minimax/minimax-m2.7:free");
        resolved.Should().NotBe("minimax/minimax-m2.7");
    }

    [Fact]
    public void Routes_idea_clarifier_to_minimax_free_model()
    {
        ShippedRouter().Resolve("IdeaClarifier").Should().Be("minimax/minimax-m2.7:free");
    }

    [Fact]
    public void Idea_clarifier_explicit_route_wins_over_default()
    {
        // Explicit map entry, not the DefaultModel fallback.
        var router = Build(new() { ["IdeaClarifier"] = "openai/gpt-4o" }, defaultModel: "openai/gpt-4o-mini");

        router.Resolve("IdeaClarifier").Should().Be("openai/gpt-4o");
        router.Resolve("IdeaClarifier").Should().NotBe("openai/gpt-4o-mini");
    }

    [Fact]
    public void Probe_routing_remains_on_minimax_free_model()
    {
        ShippedRouter().Resolve("Probe").Should().Be("minimax/minimax-m2.7:free");
    }

    [Fact]
    public void Falls_back_to_default_for_unknown_task()
    {
        var router = Build(new() { ["Probe"] = "openai/gpt-4o-mini" }, "default/model");

        router.Resolve("SomethingUnmapped").Should().Be("default/model");
    }

    [Fact]
    public void Throws_when_unknown_task_and_no_default()
    {
        var router = Build(new() { ["Probe"] = "openai/gpt-4o-mini" }, defaultModel: "");

        var act = () => router.Resolve("Unmapped");
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Throws_for_blank_task_type()
    {
        var router = Build(new(), "default/model");

        var act = () => router.Resolve("  ");
        act.Should().Throw<ArgumentException>();
    }
}
