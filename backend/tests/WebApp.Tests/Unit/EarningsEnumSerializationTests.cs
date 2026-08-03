using System.Text.Json;
using FluentAssertions;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Sibling of WorkroomEnumSerializationTests, same root cause on the financial surface.
/// ProviderFinancialSummaryResponse returns FinancialTransaction, PayoutRequest, Invoice
/// and ProviderFinancialSettings as the BSON models themselves, and StatementResponse
/// returns FinancialTransaction, so these enum declarations are the wire contract.
///
/// Unannotated they serialised as integer ordinals while types/workroom.ts declares the
/// fields `string` — so transactionTone(), the PayoutCompleted sign check and every
/// words() label had never once matched real data.
/// </summary>
public class EarningsEnumSerializationTests
{
    // Mirrors the API's default: ASP.NET Core uses System.Text.Json with camelCase naming,
    // and nothing in Program.cs overrides enum handling.
    private static readonly JsonSerializerOptions ApiOptions = new(JsonSerializerDefaults.Web);

    private static JsonElement Serialize<T>(T value) =>
        JsonDocument.Parse(JsonSerializer.Serialize(value, ApiOptions)).RootElement;

    private static void ShouldBeStringNamed(JsonElement root, string property, string expected)
    {
        root.TryGetProperty(property, out var element).Should().BeTrue($"'{property}' should be present");
        element.ValueKind.Should().Be(
            JsonValueKind.String,
            $"'{property}' must reach the client as an enum name, not an ordinal");
        element.GetString().Should().Be(expected);
    }

    /// <summary>
    /// PayoutCompleted is the specific value transactionAmount() tests to render a payout
    /// as money leaving. As an ordinal it never matched, so payouts displayed positive.
    /// </summary>
    [Fact]
    public void FinancialTransaction_type_and_status_serialise_as_names()
    {
        var json = Serialize(new FinancialTransaction
        {
            TransactionType = FinancialTransactionType.PayoutCompleted,
            PaymentStatus = PaymentStatus.Completed,
        });

        ShouldBeStringNamed(json, "transactionType", "PayoutCompleted");
        ShouldBeStringNamed(json, "paymentStatus", "Completed");
    }

    [Fact]
    public void PayoutRequest_status_serialises_as_a_name()
        => ShouldBeStringNamed(Serialize(new PayoutRequest { Status = PayoutStatus.Processing }),
            "status", "Processing");

    [Fact]
    public void Invoice_status_serialises_as_a_name()
        => ShouldBeStringNamed(Serialize(new Invoice { Status = InvoiceStatus.Issued }),
            "status", "Issued");

    [Fact]
    public void MaskedPayoutMethod_rail_serialises_as_a_name()
        => ShouldBeStringNamed(Serialize(new MaskedPayoutMethod { Rail = PayoutRail.StripeConnect }),
            "rail", "StripeConnect");

    /// <summary>
    /// Nested one level down inside the settings object, which is how the client actually
    /// receives it — a top-level check would miss a regression in the containing shape.
    /// </summary>
    [Fact]
    public void Rail_survives_serialisation_inside_the_financial_settings_graph()
    {
        var settings = new ProviderFinancialSettings
        {
            PayoutMethods = new() { new MaskedPayoutMethod { Rail = PayoutRail.BankTransfer } },
        };

        var rail = Serialize(settings).GetProperty("payoutMethods")[0].GetProperty("rail");

        rail.ValueKind.Should().Be(JsonValueKind.String);
        rail.GetString().Should().Be("BankTransfer");
    }

    /// <summary>
    /// Round-trips every member of every in-scope enum, so inserting a member at the front
    /// of a declaration — shifting every ordinal — cannot pass unnoticed.
    /// </summary>
    [Theory]
    [InlineData(typeof(FinancialTransactionType))]
    [InlineData(typeof(PaymentStatus))]
    [InlineData(typeof(PayoutStatus))]
    [InlineData(typeof(InvoiceStatus))]
    [InlineData(typeof(PayoutRail))]
    public void Every_in_scope_enum_serialises_every_member_as_its_name(Type enumType)
    {
        foreach (var member in Enum.GetValues(enumType))
        {
            var json = JsonSerializer.Serialize(member, enumType, ApiOptions);

            json.Should().Be(
                $"\"{member}\"",
                $"{enumType.Name}.{member} must serialise as its name");
        }
    }

    /// <summary>
    /// JsonIgnore/JsonConverter are System.Text.Json concerns. MongoDB.Driver has its own
    /// serializer, so stored documents keep their existing representation and no migration
    /// is implied.
    /// </summary>
    [Fact]
    public void Bson_storage_is_unaffected()
    {
        var bson = new FinancialTransaction
        {
            Id = ObjectId.GenerateNewId().ToString(),
            EngagementId = ObjectId.GenerateNewId().ToString(),
            TransactionType = FinancialTransactionType.PayoutCompleted,
            PaymentStatus = PaymentStatus.Completed,
        }.ToBsonDocument();

        bson["TransactionType"].BsonType.Should().Be(BsonType.Int32,
            "BSON is untouched by the JSON converter");
        MongoDB.Bson.Serialization.BsonSerializer.Deserialize<FinancialTransaction>(bson)
            .TransactionType.Should().Be(FinancialTransactionType.PayoutCompleted);
    }
}
