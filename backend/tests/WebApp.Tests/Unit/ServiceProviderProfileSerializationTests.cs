using FluentAssertions;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using WebApp.Models.DatabaseModels;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// BSON mapping/round-trip and backward-compatibility checks for the embedded
/// ServiceProviderProfile (D-1 Phase 1, Stage 1). No MongoDB server required.
/// </summary>
public class ServiceProviderProfileSerializationTests
{
    private static BsonDocument Bson<T>(T entity) => entity!.ToBsonDocument();
    private static T RoundTrip<T>(T entity) => BsonSerializer.Deserialize<T>(Bson(entity));

    [Fact]
    public void ServiceProviderProfile_round_trips_all_stage1_fields()
    {
        var submitted = new DateTime(2026, 1, 2, 3, 4, 5, DateTimeKind.Utc);
        var verified = new DateTime(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc);

        var e = new ServiceProviderProfile
        {
            ProviderId = "sp-1",
            CurrentPhase = 1,
            VerificationStatus = ServiceProviderVerificationStatus.UnderReview,
            VerificationSubmittedAt = submitted,
            VerifiedAt = verified,
            RejectionReason = "incomplete",
            TrustScore = 42.5,
            Skills = new List<string> { "contracts", "fundraising" },
            ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal, ServiceCategory.Financial },
            PortfolioItems = new List<PortfolioItem>
            {
                new() { Title = "Series A docs", Description = "led the round", Url = "https://x", ImagePath = "/img/a.png" },
            },
        };

        var back = RoundTrip(e);
        back.ProviderId.Should().Be("sp-1");
        back.CurrentPhase.Should().Be(1);
        back.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.UnderReview);
        back.VerificationSubmittedAt.Should().Be(submitted);
        back.VerifiedAt.Should().Be(verified);
        back.RejectionReason.Should().Be("incomplete");
        back.TrustScore.Should().Be(42.5);
        back.Skills.Should().Equal("contracts", "fundraising");
        back.ServiceCategories.Should().Equal(ServiceCategory.Legal, ServiceCategory.Financial);
        back.PortfolioItems.Should().ContainSingle();
        back.PortfolioItems[0].Title.Should().Be("Series A docs");
        back.PortfolioItems[0].Url.Should().Be("https://x");
    }

    [Fact]
    public void ServiceProviderProfile_defaults_are_safe_and_empty()
    {
        var e = new ServiceProviderProfile();

        e.CurrentPhase.Should().Be(1);
        e.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.Pending);
        e.TrustScore.Should().Be(0);
        e.Skills.Should().BeEmpty();
        e.ServiceCategories.Should().BeEmpty();
        e.PortfolioItems.Should().BeEmpty();

        var back = RoundTrip(e);
        back.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.Pending);
        back.Skills.Should().BeEmpty();
        back.PortfolioItems.Should().BeEmpty();
    }

    [Fact]
    public void VerificationStatus_is_independent_of_kyc_status()
    {
        // A provider can be KYC-verified yet still pending provider verification.
        var user = new ApplicationUser
        {
            Kyc = new KycVerification { Status = VerificationStatus.Verified },
            ServiceProviderProfile = new ServiceProviderProfile
            {
                VerificationStatus = ServiceProviderVerificationStatus.Pending,
            },
        };

        var back = RoundTrip(user);
        back.Kyc.Status.Should().Be(VerificationStatus.Verified);
        back.ServiceProviderProfile.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.Pending);
    }

    [Fact]
    public void ApplicationUser_without_provider_field_deserializes_to_default_profile()
    {
        // Backward compatibility: documents written before D-1 have no
        // ServiceProviderProfile element; deserialization must yield a usable
        // default rather than null.
        var legacy = new BsonDocument
        {
            ["_id"] = Guid.NewGuid().ToString(),
            ["Name"] = "legacy user",
            ["KycStatus"] = "Approved",
        };

        var back = BsonSerializer.Deserialize<ApplicationUser>(legacy);
        back.ServiceProviderProfile.Should().NotBeNull();
        back.ServiceProviderProfile.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.Pending);
        back.ServiceProviderProfile.Skills.Should().BeEmpty();
        back.ServiceProviderProfile.PortfolioItems.Should().BeEmpty();
    }

    [Fact]
    public void ApplicationUser_serializes_provider_profile_under_named_element()
    {
        var user = new ApplicationUser
        {
            ServiceProviderProfile = new ServiceProviderProfile { ProviderId = "sp-9" },
        };

        var bson = Bson(user);
        bson.Contains("ServiceProviderProfile").Should().BeTrue();
        bson["ServiceProviderProfile"]["ProviderId"].AsString.Should().Be("sp-9");
    }
}
