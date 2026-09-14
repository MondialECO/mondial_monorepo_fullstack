using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Verifies Commit 4: Period-Measurable Usage Aggregation.
/// 1. GET /ai/usage without period or with period=lifetime returns exact legacy shape (period fields omitted).
/// 2. GET /ai/usage with period=current and an active period returns periodActive: true, bounds, and periodCreditsSpent alongside lifetime figures.
/// 3. GET /ai/usage with period=current and no active period returns periodActive: false alongside lifetime figures.
/// 4. GET /ai/usage with period=current and an expired period returns periodActive: false.
/// </summary>
public class AiUsageServicePeriodTests
{
    private const string UserId = "user-usage-test";

    [Theory]
    [InlineData(null)]
    [InlineData("lifetime")]
    public async Task GetUsageAsync_WhenPeriodOmittedOrLifetime_ReturnsLegacyShape_WithoutPeriodFields(string? period)
    {
        var usageRepo = new Mock<AiModelUsageRepository>(Mock.Of<IMongoDatabase>());
        var creditRepo = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
        var insightRepo = new Mock<AiInsightRepository>(Mock.Of<IMongoDatabase>());

        var ledger = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = UserId,
            Balance = 150,
            LifetimeGranted = 200,
            LifetimeSpent = 50,
            PeriodStart = DateTime.UtcNow.AddDays(-5),
            PeriodEnd = DateTime.UtcNow.AddDays(25),
            PeriodCreditsSpent = 15
        };

        usageRepo.Setup(u => u.GetByOwnerAsync(UserId))
            .ReturnsAsync(new List<AiModelUsage>());

        creditRepo.Setup(c => c.GetByOwnerAsync(UserId))
            .ReturnsAsync(ledger);

        var service = new AiUsageService(usageRepo.Object, creditRepo.Object, insightRepo.Object);

        var result = await service.GetUsageAsync(UserId, period);

        result.Should().NotBeNull();
        result.CreditBalance.Should().Be(150);
        result.LifetimeSpent.Should().Be(50);
        result.PeriodActive.Should().BeNull();
        result.PeriodStart.Should().BeNull();
        result.PeriodEnd.Should().BeNull();
        result.PeriodCreditsSpent.Should().BeNull();

        // Verify JSON serialization omits period fields completely
        var json = JsonSerializer.Serialize(result);
        json.Should().NotContain("PeriodActive");
        json.Should().NotContain("PeriodStart");
        json.Should().NotContain("PeriodEnd");
        json.Should().NotContain("PeriodCreditsSpent");
    }

    [Fact]
    public async Task GetUsageAsync_WhenPeriodCurrent_AndPeriodIsActive_ReturnsPeriodMetricsAlongsideLifetime()
    {
        var usageRepo = new Mock<AiModelUsageRepository>(Mock.Of<IMongoDatabase>());
        var creditRepo = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
        var insightRepo = new Mock<AiInsightRepository>(Mock.Of<IMongoDatabase>());

        var start = DateTime.UtcNow.AddDays(-10);
        var end = DateTime.UtcNow.AddDays(20);

        var ledger = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = UserId,
            Balance = 160,
            LifetimeGranted = 200,
            LifetimeSpent = 40,
            PeriodStart = start,
            PeriodEnd = end,
            PeriodCreditsSpent = 15
        };

        usageRepo.Setup(u => u.GetByOwnerAsync(UserId))
            .ReturnsAsync(new List<AiModelUsage>());

        creditRepo.Setup(c => c.GetByOwnerAsync(UserId))
            .ReturnsAsync(ledger);

        var service = new AiUsageService(usageRepo.Object, creditRepo.Object, insightRepo.Object);

        var result = await service.GetUsageAsync(UserId, "current");

        result.Should().NotBeNull();
        result.CreditBalance.Should().Be(160);
        result.LifetimeSpent.Should().Be(40);
        result.PeriodActive.Should().BeTrue();
        result.PeriodStart.Should().Be(start);
        result.PeriodEnd.Should().Be(end);
        result.PeriodCreditsSpent.Should().Be(15);

        // Verify JSON serialization includes period fields
        var json = JsonSerializer.Serialize(result);
        json.Should().Contain("\"PeriodActive\":true");
        json.Should().Contain("\"PeriodCreditsSpent\":15");
    }

    [Fact]
    public async Task GetUsageAsync_WhenPeriodCurrent_AndPeriodIsUnset_ReturnsPeriodActiveFalse()
    {
        var usageRepo = new Mock<AiModelUsageRepository>(Mock.Of<IMongoDatabase>());
        var creditRepo = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
        var insightRepo = new Mock<AiInsightRepository>(Mock.Of<IMongoDatabase>());

        var ledger = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = UserId,
            Balance = 200,
            LifetimeGranted = 200,
            LifetimeSpent = 0,
            PeriodStart = null,
            PeriodEnd = null,
            PeriodCreditsSpent = null
        };

        usageRepo.Setup(u => u.GetByOwnerAsync(UserId))
            .ReturnsAsync(new List<AiModelUsage>());

        creditRepo.Setup(c => c.GetByOwnerAsync(UserId))
            .ReturnsAsync(ledger);

        var service = new AiUsageService(usageRepo.Object, creditRepo.Object, insightRepo.Object);

        var result = await service.GetUsageAsync(UserId, "current");

        result.Should().NotBeNull();
        result.CreditBalance.Should().Be(200);
        result.PeriodActive.Should().BeFalse();
        result.PeriodStart.Should().BeNull();
        result.PeriodEnd.Should().BeNull();
        result.PeriodCreditsSpent.Should().BeNull();
    }

    [Fact]
    public async Task GetUsageAsync_WhenPeriodCurrent_AndPeriodIsExpired_ReturnsPeriodActiveFalse()
    {
        var usageRepo = new Mock<AiModelUsageRepository>(Mock.Of<IMongoDatabase>());
        var creditRepo = new Mock<AiCreditLedgerRepository>(Mock.Of<IMongoDatabase>());
        var insightRepo = new Mock<AiInsightRepository>(Mock.Of<IMongoDatabase>());

        var ledger = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = UserId,
            Balance = 150,
            LifetimeGranted = 200,
            LifetimeSpent = 50,
            PeriodStart = DateTime.UtcNow.AddDays(-40),
            PeriodEnd = DateTime.UtcNow.AddDays(-10), // Expired 10 days ago
            PeriodCreditsSpent = 30
        };

        usageRepo.Setup(u => u.GetByOwnerAsync(UserId))
            .ReturnsAsync(new List<AiModelUsage>());

        creditRepo.Setup(c => c.GetByOwnerAsync(UserId))
            .ReturnsAsync(ledger);

        var service = new AiUsageService(usageRepo.Object, creditRepo.Object, insightRepo.Object);

        var result = await service.GetUsageAsync(UserId, "current");

        result.Should().NotBeNull();
        result.PeriodActive.Should().BeFalse();
    }
}
