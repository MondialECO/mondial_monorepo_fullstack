using FluentAssertions;
using WebApp.Services.Ai.Prompts;
using Xunit;

namespace WebApp.Tests.Unit;

public class PromptBuilderTests
{
    private static readonly PromptTemplate Template = new()
    {
        Key = "probe",
        Version = 1,
        SystemText = "You are a probe.",
        OutputContract = "Plain text only.",
    };

    private static PromptComposition Build(string userContext = "User runs a SaaS startup.", string task = "Say hello.")
        => new PromptBuilder().Build(Template, userContext, task);

    [Fact]
    public void Emits_five_layers_in_canonical_order()
    {
        var result = Build();

        result.Layers.Select(l => l.Name).Should().ContainInOrder(
            PromptLayerNames.System,
            PromptLayerNames.ProductContext,
            PromptLayerNames.UserContext,
            PromptLayerNames.Task,
            PromptLayerNames.OutputFormat);
        result.Layers.Should().HaveCount(5);
    }

    [Fact]
    public void System_layer_includes_template_text_and_central_safety_rules()
    {
        var system = Build().Layers.First(l => l.Name == PromptLayerNames.System).Content;

        system.Should().Contain("You are a probe.");
        system.Should().Contain(SafetyRules.Text);
    }

    [Fact]
    public void Product_context_layer_is_the_central_product_context()
    {
        Build().Layers.First(l => l.Name == PromptLayerNames.ProductContext).Content
            .Should().Be(ProductContext.Text);
    }

    [Fact]
    public void Maps_to_a_system_message_and_a_user_message()
    {
        var msgs = Build(userContext: "Fintech founder.", task: "Draft a tagline.").Messages;

        msgs.Should().HaveCount(2);
        msgs[0].Role.Should().Be("system");
        msgs[0].Content.Should().Contain(ProductContext.Text);
        msgs[0].Content.Should().Contain("Plain text only.");      // output format
        msgs[0].Content.Should().Contain(SafetyRules.Text);

        msgs[1].Role.Should().Be("user");
        msgs[1].Content.Should().Contain("Fintech founder.");      // user context
        msgs[1].Content.Should().Contain("Draft a tagline.");      // task
    }

    [Fact]
    public void Blank_user_context_falls_back_to_placeholder()
    {
        Build(userContext: "   ").Layers.First(l => l.Name == PromptLayerNames.UserContext).Content
            .Should().Contain("no additional user context");
    }

    [Fact]
    public void Throws_when_task_is_blank()
    {
        var act = () => new PromptBuilder().Build(Template, "ctx", "  ");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Throws_when_template_is_null()
    {
        var act = () => new PromptBuilder().Build(null!, "ctx", "task");
        act.Should().Throw<ArgumentNullException>();
    }
}
