using FluentAssertions;
using Microsoft.Extensions.Configuration;
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
        ["Probe"] = "google/gemini-3.8-flash",
        ["IdeaClarifier"] = "google/gemini-3.8-flash",
        ["BusinessPlan"] = "google/gemini-3.8-flash",
        ["Forecast"] = "google/gemini-3.8-flash",
        ["IdeaGenerator"] = "google/gemini-3.8-flash",
    }, "google/gemini-3.8-flash");

    [Fact]
    public void Shipped_router_routes_all_tasks_to_gemini_model()
    {
        var router = ShippedRouter();
        router.Resolve("Probe").Should().Be("google/gemini-3.8-flash");
        router.Resolve("IdeaClarifier").Should().Be("google/gemini-3.8-flash");
        router.Resolve("BusinessPlan").Should().Be("google/gemini-3.8-flash");
        router.Resolve("Forecast").Should().Be("google/gemini-3.8-flash");
        router.Resolve("IdeaGenerator").Should().Be("google/gemini-3.8-flash");
        router.Resolve("UnknownFallback").Should().Be("google/gemini-3.8-flash");
    }

    [Fact]
    public void Routes_business_plan_to_gemini_model()
    {
        var resolved = ShippedRouter().Resolve("BusinessPlan");
        resolved.Should().Be("google/gemini-3.8-flash");
        resolved.Should().NotBe("minimax/minimax-m2.7:free");
    }

    [Fact]
    public void Routes_idea_clarifier_to_gemini_model()
    {
        ShippedRouter().Resolve("IdeaClarifier").Should().Be("google/gemini-3.8-flash");
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
    public void Probe_routing_is_on_gemini_model()
    {
        ShippedRouter().Resolve("Probe").Should().Be("google/gemini-3.8-flash");
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
    public void Physical_appsettings_json_resolves_all_capabilities_to_gemini()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "appsettings.json")))
        {
            dir = dir.Parent;
        }
        dir.Should().NotBeNull("Must find directory containing appsettings.json");
        var appsettingsPath = Path.Combine(dir!.FullName, "appsettings.json");
        File.Exists(appsettingsPath).Should().BeTrue("appsettings.json must exist in backend root");

        var json = File.ReadAllText(appsettingsPath);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var aiJson = doc.RootElement.GetProperty("Ai").GetRawText();
        var aiSettings = System.Text.Json.JsonSerializer.Deserialize<AiSettings>(
            aiJson,
            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

        var router = new ModelRouter(Options.Create(aiSettings), NullLogger<ModelRouter>.Instance);
        router.Resolve("Probe").Should().Be("google/gemini-3.8-flash");
        router.Resolve("IdeaClarifier").Should().Be("google/gemini-3.8-flash");
        router.Resolve("BusinessPlan").Should().Be("google/gemini-3.8-flash");
        router.Resolve("Forecast").Should().Be("google/gemini-3.8-flash");
        router.Resolve("IdeaGenerator").Should().Be("google/gemini-3.8-flash");
        router.Resolve("UnmappedCapability").Should().Be("google/gemini-3.8-flash");
    }
}
