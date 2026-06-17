using FluentAssertions;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Ai.Prompts;
using Xunit;

namespace WebApp.Tests.Unit;

public class AiJobEngineTests
{
    // ---- AiTaskHandlerRegistry ----

    [Fact]
    public void Registry_resolves_registered_handler()
    {
        var reg = new AiTaskHandlerRegistry(new IAiTaskHandler[] { new NoOpProbeHandler() });

        reg.Resolve(AiJobType.Probe).Should().BeOfType<NoOpProbeHandler>();
        reg.IsSupported(AiJobType.Probe).Should().BeTrue();
        reg.IsSupported(AiJobType.BusinessPlan).Should().BeFalse();
    }

    [Fact]
    public void Registry_throws_for_unregistered_type()
    {
        var reg = new AiTaskHandlerRegistry(new IAiTaskHandler[] { new NoOpProbeHandler() });

        var act = () => reg.Resolve(AiJobType.Forecast);
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Registry_rejects_duplicate_handlers_for_a_type()
    {
        var act = () => new AiTaskHandlerRegistry(new IAiTaskHandler[] { new NoOpProbeHandler(), new NoOpProbeHandler() });
        act.Should().Throw<InvalidOperationException>();
    }

    // ---- NoOpProbeHandler ----

    [Fact]
    public async Task ProbeHandler_uses_probe_template_and_input_message()
    {
        var handler = new NoOpProbeHandler();
        var request = new AiRequest { JobType = "Probe", InputPayload = new BsonDocument("message", "are you up?") };

        var prep = await handler.PrepareAsync(request);

        prep.PromptKey.Should().Be(PromptTemplate.Probe.Key);
        prep.TaskType.Should().Be("Probe");
        prep.Task.Should().Be("are you up?");
        prep.MaxTokens.Should().Be(64);
    }

    [Fact]
    public async Task ProbeHandler_defaults_task_when_no_message()
    {
        var prep = await new NoOpProbeHandler().PrepareAsync(new AiRequest { JobType = "Probe" });
        prep.Task.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ProbeHandler_interprets_completion_into_payload()
    {
        var completion = new AiCompletion
        {
            Text = "pipeline ok",
            Model = "test/model",
            Usage = new AiTokenUsage(1, 2, 3),
        };

        var result = await new NoOpProbeHandler().InterpretAsync(new AiRequest(), completion);

        result.OutputPayload.Should().NotBeNull();
        result.OutputPayload!["text"].AsString.Should().Be("pipeline ok");
        result.OutputPayload!["model"].AsString.Should().Be("test/model");
    }
}
