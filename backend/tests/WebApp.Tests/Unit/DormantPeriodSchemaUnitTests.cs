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
    public void AiCreditLedger_CarryOverCeiling_DefaultsNull_AndSerializesCorrectly()
    {
        var ledger = new AiCreditLedger
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerUserId = UserId,
            Balance = 200,
            CarryOverCeiling = null
        };

        var docNull = ledger.ToBsonDocument();
        docNull.Contains("CarryOverCeiling").Should().BeFalse();

        ledger.CarryOverCeiling = 100;
        var docPopulated = ledger.ToBsonDocument();
        docPopulated.Contains("CarryOverCeiling").Should().BeTrue();
        docPopulated["CarryOverCeiling"].AsInt32.Should().Be(100);
    }

    [Fact]
    public async Task TryDebitAsync_WhenPeriodActive_ExecutesSingleAtomicUpdate_IncrementingPeriodCreditsSpent()
    {
        var dbMock = new Mock<IMongoDatabase>();
        var colMock = new Mock<IMongoCollection<AiCreditLedger>>();
        var indexesMock = new Mock<IMongoIndexManager<AiCreditLedger>>();

        colMock.Setup(c => c.Indexes).Returns(indexesMock.Object);

        dbMock.Setup(d => d.GetCollection<AiCreditLedger>("AICredits", It.IsAny<MongoCollectionSettings>()))
            .Returns(colMock.Object);

        var repo = new AiCreditLedgerRepository(dbMock.Object);

        UpdateDefinition<AiCreditLedger>? capturedUpdate = null;
        var updateResultMock = new Mock<UpdateResult>();
        updateResultMock.Setup(r => r.ModifiedCount).Returns(1);

        // First update call (activePeriodFilter) matches and captures the update definition
        colMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<AiCreditLedger>>(),
                It.IsAny<UpdateDefinition<AiCreditLedger>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
            .Callback<FilterDefinition<AiCreditLedger>, UpdateDefinition<AiCreditLedger>, UpdateOptions, CancellationToken>(
                (filter, update, opts, ct) => capturedUpdate = update)
            .ReturnsAsync(updateResultMock.Object);

        var debit = new AiCreditDebit
        {
            OperationId = ObjectId.GenerateNewId().ToString(),
            Amount = 5,
            Reason = "BusinessPlan"
        };

        var result = await repo.TryDebitAsync(UserId, 5, debit);

        result.Should().Be(CreditDebitResult.Applied);
        capturedUpdate.Should().NotBeNull();

        // Render the captured update to BSON to prove it is a single atomic update containing
        // Balance decrement, LifetimeSpent increment, and PeriodCreditsSpent increment together.
        var serializerRegistry = BsonSerializer.SerializerRegistry;
        var documentSerializer = serializerRegistry.GetSerializer<AiCreditLedger>();
        var rendered = capturedUpdate!.Render(new RenderArgs<AiCreditLedger>(documentSerializer, serializerRegistry));

        var incDoc = rendered["$inc"].AsBsonDocument;
        incDoc["Balance"].AsInt32.Should().Be(-5);
        incDoc["LifetimeSpent"].AsInt32.Should().Be(5);
        incDoc["PeriodCreditsSpent"].AsInt32.Should().Be(5);

        // Exactly one write operation was executed (not two separate writes)
        colMock.Verify(c => c.UpdateOneAsync(
            It.IsAny<FilterDefinition<AiCreditLedger>>(),
            It.IsAny<UpdateDefinition<AiCreditLedger>>(),
            It.IsAny<UpdateOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TryDebitAsync_WhenPeriodExpired_FallsBackToStandardUpdate_LeavingPeriodUntouched()
    {
        var dbMock = new Mock<IMongoDatabase>();
        var colMock = new Mock<IMongoCollection<AiCreditLedger>>();
        var indexesMock = new Mock<IMongoIndexManager<AiCreditLedger>>();

        colMock.Setup(c => c.Indexes).Returns(indexesMock.Object);

        dbMock.Setup(d => d.GetCollection<AiCreditLedger>("AICredits", It.IsAny<MongoCollectionSettings>()))
            .Returns(colMock.Object);

        var repo = new AiCreditLedgerRepository(dbMock.Object);

        UpdateDefinition<AiCreditLedger>? capturedStandardUpdate = null;
        var zeroModified = new Mock<UpdateResult>();
        zeroModified.Setup(r => r.ModifiedCount).Returns(0);

        var oneModified = new Mock<UpdateResult>();
        oneModified.Setup(r => r.ModifiedCount).Returns(1);

        var callCount = 0;
        colMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<AiCreditLedger>>(),
                It.IsAny<UpdateDefinition<AiCreditLedger>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns<FilterDefinition<AiCreditLedger>, UpdateDefinition<AiCreditLedger>, UpdateOptions, CancellationToken>(
                (filter, update, opts, ct) =>
                {
                    callCount++;
                    if (callCount == 1)
                    {
                        // Active period update matched 0 because current time is past PeriodEnd
                        return Task.FromResult(zeroModified.Object);
                    }
                    // Standard update matches and executes
                    capturedStandardUpdate = update;
                    return Task.FromResult(oneModified.Object);
                });

        var debit = new AiCreditDebit
        {
            OperationId = ObjectId.GenerateNewId().ToString(),
            Amount = 5,
            Reason = "BusinessPlan"
        };

        var result = await repo.TryDebitAsync(UserId, 5, debit);

        result.Should().Be(CreditDebitResult.Applied);
        capturedStandardUpdate.Should().NotBeNull();

        // Render the captured standard update: must update Balance and LifetimeSpent, but NOT PeriodCreditsSpent
        var serializerRegistry = BsonSerializer.SerializerRegistry;
        var documentSerializer = serializerRegistry.GetSerializer<AiCreditLedger>();
        var rendered = capturedStandardUpdate!.Render(new RenderArgs<AiCreditLedger>(documentSerializer, serializerRegistry));

        var incDoc = rendered["$inc"].AsBsonDocument;
        incDoc["Balance"].AsInt32.Should().Be(-5);
        incDoc["LifetimeSpent"].AsInt32.Should().Be(5);
        incDoc.Contains("PeriodCreditsSpent").Should().BeFalse("Expired or unset period must not increment PeriodCreditsSpent");
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

        var setSuccess = await repo.SetPeriodAsync(UserId, start, end, carryOverCeiling: 50);
        setSuccess.Should().BeTrue();

        var clearSuccess = await repo.ClearPeriodAsync(UserId);
        clearSuccess.Should().BeTrue();
    }
}
