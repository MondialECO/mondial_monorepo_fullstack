using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using WebApp.Services.Ai.Prompts;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// Real-MongoDB tests for prompt seeding + active-version resolution. Uses the
/// store resolved from the booted app. Skips without Docker/Testcontainers.
/// Each test uses a unique key so the shared db stays isolated across tests.
/// </summary>
public class PromptVersionStoreIntegrationTests : IClassFixture<AppFixture>
{
    private readonly AppFixture _fx;

    public PromptVersionStoreIntegrationTests(AppFixture fx) => _fx = fx;

    private IPromptVersionStore Store => _fx.Factory!.Services.GetRequiredService<IPromptVersionStore>();

    private static PromptTemplate Template(string key, int version, string system) => new()
    {
        Key = key,
        Version = version,
        SystemText = system,
        OutputContract = "json",
    };

    [SkippableFact]
    public async Task Seeds_and_resolves_active_version()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var key = "probe-" + Guid.NewGuid();

        var seeded = await Store.SeedAsync(new[] { Template(key, 1, "system-v1") });

        seeded.Should().Be(1);
        var active = await Store.GetActiveAsync(key);
        active.Should().NotBeNull();
        active!.Version.Should().Be(1);
        active.SystemText.Should().Be("system-v1");
    }

    [SkippableFact]
    public async Task Reseeding_same_version_is_idempotent()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var key = "probe-" + Guid.NewGuid();
        var templates = new[] { Template(key, 1, "system-v1") };

        (await Store.SeedAsync(templates)).Should().Be(1);
        (await Store.SeedAsync(templates)).Should().Be(0); // no-op second run

        (await Store.GetActiveAsync(key))!.Version.Should().Be(1);
    }

    [SkippableFact]
    public async Task New_version_supersedes_and_only_one_stays_active()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var key = "probe-" + Guid.NewGuid();

        await Store.SeedAsync(new[] { Template(key, 1, "system-v1") });
        await Store.SeedAsync(new[] { Template(key, 2, "system-v2") });

        var active = await Store.GetActiveAsync(key);
        active!.Version.Should().Be(2);
        active.SystemText.Should().Be("system-v2");
    }

    [SkippableFact]
    public async Task GetActive_returns_null_for_unknown_key()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        (await Store.GetActiveAsync("never-seeded-" + Guid.NewGuid())).Should().BeNull();
    }

    [SkippableFact]
    public async Task IdeaClarifier_template_is_seeded_on_boot_and_resolves_active()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        // C-2 P2: PromptTemplate.All is seeded on startup, so the active
        // idea-clarifier version (with its locked output contract) resolves.
        var active = await Store.GetActiveAsync(PromptTemplate.IdeaClarifier.Key);

        active.Should().NotBeNull();
        active!.Version.Should().Be(1);
        active.SystemText.Should().Contain("Idea Clarifier");
        active.OutputContract.Should().Contain("\"schemaVersion\": 1");
    }
}
