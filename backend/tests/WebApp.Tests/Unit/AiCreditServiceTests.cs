using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Moq;
using WebApp.Configuration.AiOptions;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Repository.Ai;
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

    [Fact]
    public async Task GetBalanceAsync_Guarantees_Starter_Credits_And_Returns_Ledger_Balance_And_Costs()
    {
        var repo = new Moq.Mock<AiCreditLedgerRepository>(Moq.Mock.Of<MongoDB.Driver.IMongoDatabase>());
        var settings = new AiSettings
        {
            StarterCredits = 200,
            CreditCosts = new Dictionary<string, int>
            {
                ["Clarifier"] = 1,
                ["BusinessPlan"] = 3,
                ["Forecast"] = 5
            }
        };

        repo.Setup(r => r.TryGrantInitialAsync("user-balance-1", 200))
            .ReturnsAsync(true);

        repo.Setup(r => r.GetByOwnerAsync("user-balance-1"))
            .ReturnsAsync(new WebApp.Models.DatabaseModels.Ai.AiCreditLedger
            {
                OwnerUserId = "user-balance-1",
                Balance = 195,
                LifetimeGranted = 200,
                LifetimeSpent = 5
            });

        var service = new AiCreditService(repo.Object, Options.Create(settings));

        var balance = await service.GetBalanceAsync("user-balance-1");

        balance.Should().NotBeNull();
        balance.Balance.Should().Be(195);
        balance.LifetimeGranted.Should().Be(200);
        balance.LifetimeSpent.Should().Be(5);
        balance.Costs.Should().BeEquivalentTo(settings.CreditCosts);
        repo.Verify(r => r.TryGrantInitialAsync("user-balance-1", 200), Moq.Times.Once);
    }

    [Fact]
    public async Task GetBalanceAsync_When_No_Ledger_Exists_Falls_Back_To_StarterCredits()
    {
        var repo = new Moq.Mock<AiCreditLedgerRepository>(Moq.Mock.Of<MongoDB.Driver.IMongoDatabase>());
        var settings = new AiSettings
        {
            StarterCredits = 200,
            CreditCosts = new Dictionary<string, int> { ["Forecast"] = 5 }
        };

        repo.Setup(r => r.TryGrantInitialAsync("user-empty", 200))
            .ReturnsAsync(false);
        repo.Setup(r => r.GetByOwnerAsync("user-empty"))
            .ReturnsAsync((WebApp.Models.DatabaseModels.Ai.AiCreditLedger?)null);

        var service = new AiCreditService(repo.Object, Options.Create(settings));

        var balance = await service.GetBalanceAsync("user-empty");

        balance.Balance.Should().Be(200);
        balance.LifetimeGranted.Should().Be(200);
        balance.LifetimeSpent.Should().Be(0);
        balance.Costs.Should().ContainKey("Forecast").WhoseValue.Should().Be(5);
    }
}

