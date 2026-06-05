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
