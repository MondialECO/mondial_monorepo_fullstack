using System.Linq;
using FluentAssertions;
using WebApp.Services;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Deal realtime event contract (Phase D-4.5): the six event names emitted to
/// participants' per-user groups are defined and distinct, and each offer
/// action maps to its event.
/// </summary>
public class DealEventTests
{
    [Fact]
    public void All_deal_event_names_are_defined_and_distinct()
    {
        var names = new[]
        {
            DealEventNames.OfferReceived,
            DealEventNames.OfferViewed,
            DealEventNames.OfferCountered,
            DealEventNames.OfferAccepted,
            DealEventNames.OfferRejected,
            DealEventNames.DealUpdated,
        };

        names.Should().OnlyContain(n => !string.IsNullOrWhiteSpace(n));
        names.Distinct().Should().HaveCount(names.Length);
    }

    [Fact]
    public void Offer_events_use_pascal_case_client_method_names()
    {
        DealEventNames.OfferReceived.Should().Be("OfferReceived");
        DealEventNames.OfferCountered.Should().Be("OfferCountered");
        DealEventNames.OfferAccepted.Should().Be("OfferAccepted");
        DealEventNames.OfferRejected.Should().Be("OfferRejected");
        DealEventNames.OfferViewed.Should().Be("OfferViewed");
        DealEventNames.DealUpdated.Should().Be("DealUpdated");
    }
}
