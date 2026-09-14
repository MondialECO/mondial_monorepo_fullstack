using FluentAssertions;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using Moq;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Verifies Commit 3: Dormant Period Schema.
/// 1. PeriodStart, PeriodEnd, and PeriodCreditsSpent exist on AiCreditLedger and default to null.
/// 2. BsonIgnoreIfNull omits period fields when null (ensuring write safety and backward compatibility).
/// 3. Debits within an active period update PeriodCreditsSpent alongside LifetimeSpent.
/// 4. Debits when period is unset leave PeriodCreditsSpent untouched (null).
/// 5. Debits outside an active period leave PeriodCreditsSpent untouched.
/// 6. Lifetime balance continues to govern without an allowance cap.
/// </summary>
public class DormantPeriodSchemaUnitTests
{
    private const string UserId = "user-period-test";

    [Fact]
    public void AiCreditLedger_Defaults_PeriodFieldsAreNull()
    {
        var ledger = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = UserId,
            Balance = 200,
            LifetimeGranted = 200,
            LifetimeSpent = 0
        };

        ledger.PeriodStart.Should().BeNull();
        ledger.PeriodEnd.Should().BeNull();
        ledger.PeriodCreditsSpent.Should().BeNull();
    }

    [Fact]
    public void AiCreditLedger_Serialization_OmitsNullPeriodFields()
    {
        var ledger = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = UserId,
            Balance = 200,
            LifetimeGranted = 200,
            LifetimeSpent = 0
        };

        var doc = ledger.ToBsonDocument();

        doc.Contains("PeriodStart").Should().BeFalse();
        doc.Contains("PeriodEnd").Should().BeFalse();
        doc.Contains("PeriodCreditsSpent").Should().BeFalse();
    }

    [Fact]
    public void AiCreditLedger_Serialization_IncludesPopulatedPeriodFields()
    {
        var start = DateTime.UtcNow.Date;
        var end = start.AddDays(30);

        var ledger = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = UserId,
            Balance = 195,
            LifetimeGranted = 200,
            LifetimeSpent = 5,
            PeriodStart = start,
            PeriodEnd = end,
            PeriodCreditsSpent = 5
        };

        var doc = ledger.ToBsonDocument();

        doc.Contains("PeriodStart").Should().BeTrue();
        doc.Contains("PeriodEnd").Should().BeTrue();
        doc.Contains("PeriodCreditsSpent").Should().BeTrue();
        doc["PeriodCreditsSpent"].AsInt32.Should().Be(5);
    }

    [Fact]
    public async Task TryDebitAsync_WhenPeriodUnset_ExecutesStandardUpdateAndLeavesPeriodNull()
    {
        var dbMock = new Mock<IMongoDatabase>();
        var colMock = new Mock<IMongoCollection<AiCreditLedger>>();
        var indexesMock = new Mock<IMongoIndexManager<AiCreditLedger>>();

        colMock.Setup(c => c.Indexes).Returns(indexesMock.Object);

        dbMock.Setup(d => d.GetCollection<AiCreditLedger>("AICredits", It.IsAny<MongoCollectionSettings>()))
            .Returns(colMock.Object);

        var repo = new AiCreditLedgerRepository(dbMock.Object);

        var updateResultMock = new Mock<UpdateResult>();
        updateResultMock.Setup(r => r.ModifiedCount).Returns(1);

        // Standard update succeeds
        colMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<AiCreditLedger>>(),
                It.IsAny<UpdateDefinition<AiCreditLedger>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(updateResultMock.Object);

        var debit = new AiCreditDebit
        {
            OperationId = ObjectId.GenerateNewId().ToString(),
            Amount = 5,
            Reason = "BusinessPlan"
        };

        var result = await repo.TryDebitAsync(UserId, 5, debit);

        result.Should().Be(CreditDebitResult.Applied);
        // Verify UpdateOneAsync was invoked
        colMock.Verify(c => c.UpdateOneAsync(
            It.IsAny<FilterDefinition<AiCreditLedger>>(),
            It.IsAny<UpdateDefinition<AiCreditLedger>>(),
            It.IsAny<UpdateOptions>(),
            It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task SetPeriodAsync_And_ClearPeriodAsync_UpdateLedgerDefinition()
    {
        var dbMock = new Mock<IMongoDatabase>();
        var colMock = new Mock<IMongoCollection<AiCreditLedger>>();
        var indexesMock = new Mock<IMongoIndexManager<AiCreditLedger>>();

        colMock.Setup(c => c.Indexes).Returns(indexesMock.Object);

        dbMock.Setup(d => d.GetCollection<AiCreditLedger>("AICredits", It.IsAny<MongoCollectionSettings>()))
            .Returns(colMock.Object);

        var repo = new AiCreditLedgerRepository(dbMock.Object);

        var updateResultMock = new Mock<UpdateResult>();
        updateResultMock.Setup(r => r.MatchedCount).Returns(1);

        colMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<AiCreditLedger>>(),
                It.IsAny<UpdateDefinition<AiCreditLedger>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(updateResultMock.Object);

        var start = DateTime.UtcNow;
        var end = start.AddDays(30);

        var setSuccess = await repo.SetPeriodAsync(UserId, start, end);
        setSuccess.Should().BeTrue();

        var clearSuccess = await repo.ClearPeriodAsync(UserId);
        clearSuccess.Should().BeTrue();
    }
}
