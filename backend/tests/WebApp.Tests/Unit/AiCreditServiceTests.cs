using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using Xunit;

namespace WebApp.Tests.Unit;

public class AiCreditServiceTests
{
    [Fact]
    public void AiSettings_Default_StarterCredits_Is_200()
    {
        var settings = new AiSettings();
        settings.StarterCredits.Should().Be(200);
    }

    [Fact]
    public void Production_Base_Appsettings_Resolves_StarterCredits_As_200()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", optional: false)
            .Build();

        var starterCredits = config.GetValue<int>("Ai:StarterCredits");
        starterCredits.Should().Be(200);
    }

    [Fact]
    public void Development_Appsettings_Resolves_StarterCredits_As_200()
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.Development.json", optional: false)
            .Build();

        var starterCredits = config.GetValue<int>("Ai:StarterCredits");
        starterCredits.Should().Be(200);
    }

    [Fact]
    public async Task Free_job_skips_ledger_interaction()
    {
        var settings = new AiSettings
        {
            CreditCosts = new Dictionary<string, int> { ["Probe"] = 0 }
        };
        // If cost is 0, DebitForJobAsync / RefundForJobAsync returns immediately without touching repo
        var service = new AiCreditService(null!, Options.Create(settings));

        await service.DebitForJobAsync("user-1", AiJobType.Probe, "op-1");
        var result = await service.RefundForJobAsync("user-1", AiJobType.Probe, "op-1");
        result.Should().Be(WebApp.Models.DatabaseModels.Ai.CreditRefundResult.Applied);
    }
}
