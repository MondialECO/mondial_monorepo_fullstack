using System.Text.Json;
using FluentAssertions;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Third instance of the raw-model-on-the-wire pattern, after the workroom (f673521) and
/// earnings (00e20fa) sets. ContractResponse.Terms embeds the ContractTerms BSON model
/// itself rather than a remapped DTO, so these four enum declarations are the wire
/// contract for the contract panel.
///
/// Wider blast radius than the previous two: all four are shared enums reused across
/// Service Catalog, Leads and Workroom (canon §4.2). Every other consumer maps them to
/// string with .ToString() at the DTO boundary, which is unaffected by a JSON attribute —
/// ContractResponse.Terms was the only raw exposure.
/// </summary>
public class ContractTermsEnumSerializationTests
{
    private static readonly JsonSerializerOptions ApiOptions = new(JsonSerializerDefaults.Web);

    /// <summary>Serialises through the real response shape, not the model in isolation.</summary>
    private static JsonElement SerializeTerms(ContractTerms terms)
    {
        var response = new ContractResponse { Id = "c1", Terms = terms, Status = "Signed" };
        return JsonDocument.Parse(JsonSerializer.Serialize(response, ApiOptions))
            .RootElement.GetProperty("terms");
    }

    private static void ShouldBeStringNamed(JsonElement root, string property, string expected)
    {
        root.TryGetProperty(property, out var element).Should().BeTrue($"'{property}' should be present");
        element.ValueKind.Should().Be(
            JsonValueKind.String,
            $"'{property}' must reach the client as an enum name, not an ordinal");
        element.GetString().Should().Be(expected);
    }

    [Fact]
    public void All_four_contract_term_enums_serialise_as_names()
    {
        var terms = SerializeTerms(new ContractTerms
        {
            PricingType = PricingModel.Hourly,
            DeliveryTimeUnit = DeliveryTimeUnit.Weeks,
            DeliveryDayType = DeliveryDayType.BusinessDays,
            DeliveryStartRule = DeliveryStartRule.AfterEscrowFunding,
        });

        // isHourlyPricing gates the Time Entries tab on this exact value.
        ShouldBeStringNamed(terms, "pricingType", "Hourly");
        ShouldBeStringNamed(terms, "deliveryTimeUnit", "Weeks");
        ShouldBeStringNamed(terms, "deliveryDayType", "BusinessDays");
        ShouldBeStringNamed(terms, "deliveryStartRule", "AfterEscrowFunding");
    }

    /// <summary>
    /// Round-trips every member of all four enums, so inserting a value at the front of a
    /// declaration — which §4.2 forbids for BSON reasons anyway — cannot pass unnoticed.
    /// </summary>
    [Theory]
    [InlineData(typeof(PricingModel))]
    [InlineData(typeof(DeliveryTimeUnit))]
    [InlineData(typeof(DeliveryDayType))]
    [InlineData(typeof(DeliveryStartRule))]
    public void Every_member_of_every_shared_enum_serialises_as_its_name(Type enumType)
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
    /// The §4.2 ordinal-stability rule is about BSON, and this change does not touch it.
    /// MongoDB.Driver ignores System.Text.Json attributes, so stored documents keep their
    /// integer representation and no migration is implied.
    /// </summary>
    [Fact]
    public void Bson_still_persists_ordinals()
    {
        var bson = new ContractTerms
        {
            PricingType = PricingModel.Hourly,
            DeliveryDayType = DeliveryDayType.CalendarDays,
        }.ToBsonDocument();

        bson["PricingType"].BsonType.Should().Be(BsonType.Int32);
        bson["DeliveryDayType"].AsInt32.Should().Be((int)DeliveryDayType.CalendarDays);
    }

    /// <summary>
    /// Pins the declared order the ordinal-stability rule protects. A JSON attribute must
    /// never be an excuse to reorder these, because stored documents hold the ordinal.
    /// </summary>
    [Fact]
    public void Declared_order_is_unchanged_by_the_json_attribute()
    {
        ((int)PricingModel.FixedPrice).Should().Be(0);
        ((int)PricingModel.Hourly).Should().Be(1);
        Enum.GetValues<PricingModel>().Last().Should().Be(PricingModel.Other, "Other must stay last");

        ((int)DeliveryTimeUnit.Hours).Should().Be(0);
        ((int)DeliveryDayType.BusinessDays).Should().Be(0);
        ((int)DeliveryStartRule.AfterOrderConfirmation).Should().Be(0);
    }

    /// <summary>
    /// Consumers that already map with .ToString() are unaffected: calling ToString() on an
    /// enum bypasses the JSON layer entirely, so those DTOs emit exactly what they did
    /// before and the two paths now agree.
    /// </summary>
    [Fact]
    public void Manual_ToString_mapping_agrees_with_the_json_form()
    {
        var manual = DeliveryStartRule.AfterClientRequirementsComplete.ToString();
        var viaJson = JsonSerializer.Serialize(
            DeliveryStartRule.AfterClientRequirementsComplete, ApiOptions).Trim('"');

        viaJson.Should().Be(manual);
    }
}
