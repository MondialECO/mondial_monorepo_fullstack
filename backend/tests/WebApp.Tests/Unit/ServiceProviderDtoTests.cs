using System.Text.Json;
using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// D-1 P2: JSON round-trip / shape checks and entity→DTO mapping for the Service
/// Provider Stage-1 contracts. Uses the controllers' camelCase policy so on-wire
/// keys match what clients will see. No MongoDB server required.
/// </summary>
public class ServiceProviderDtoTests
{
    private static readonly JsonSerializerOptions CamelCase = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static string Json<T>(T value) => JsonSerializer.Serialize(value, CamelCase);
    private static T RoundTrip<T>(T value) => JsonSerializer.Deserialize<T>(Json(value), CamelCase)!;

    // ---------------- Requests ----------------

    [Fact]
    public void CreateOrUpdate_request_round_trips_with_camelcase_keys()
    {
        var req = new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new List<string> { "contracts", "fundraising" },
            ServiceCategories = new List<string> { "Legal", "Finance" },
        };

        var json = Json(req);
        json.Should().Contain("\"skills\"").And.Contain("\"serviceCategories\"");

        var back = RoundTrip(req);
        back.Skills.Should().Equal("contracts", "fundraising");
        back.ServiceCategories.Should().Equal("Legal", "Finance");
    }

    [Fact]
    public void Request_defaults_are_non_null_empty_collections()
    {
        var req = new CreateOrUpdateServiceProviderProfileRequest();
        req.Skills.Should().BeEmpty();
        req.ServiceCategories.Should().BeEmpty();
    }

    [Fact]
    public void Portfolio_requests_round_trip()
    {
        var add = RoundTrip(new AddPortfolioItemRequest { Title = "Series A docs", Url = "https://x" });
        add.Title.Should().Be("Series A docs");
        add.Url.Should().Be("https://x");
        add.Description.Should().BeNull();

        var upd = RoundTrip(new UpdatePortfolioItemRequest { Index = 2, Title = "Updated" });
        upd.Index.Should().Be(2);
        upd.Title.Should().Be("Updated");
    }

    [Fact]
    public void SubmitVerification_request_round_trips()
    {
        var back = RoundTrip(new SubmitVerificationRequest { ConfirmAccuracy = true, Note = "ready" });
        back.ConfirmAccuracy.Should().BeTrue();
        back.Note.Should().Be("ready");
    }

    // ---------------- Responses ----------------

    [Fact]
    public void ProfileResponse_round_trips_all_fields()
    {
        var resp = new ServiceProviderProfileResponse
        {
            ProviderId = "sp-1",
            CurrentPhase = 1,
            VerificationStatus = "UnderReview",
            TrustScore = 42.5,
            Skills = new List<string> { "a" },
            ServiceCategories = new List<string> { "Legal" },
            PortfolioItems = new List<PortfolioItemResponse>
            {
                new() { Index = 0, Title = "t", Url = "u" },
            },
        };

        var back = RoundTrip(resp);
        back.ProviderId.Should().Be("sp-1");
        back.VerificationStatus.Should().Be("UnderReview");
        back.TrustScore.Should().Be(42.5);
        back.PortfolioItems.Should().ContainSingle();
        back.PortfolioItems[0].Title.Should().Be("t");
    }

    // ---------------- Mapping ----------------

    [Fact]
    public void Mapping_projects_entity_to_full_profile_response()
    {
        var submitted = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        var profile = new ServiceProviderProfile
        {
            ProviderId = "sp-9",
            CurrentPhase = 1,
            VerificationStatus = ServiceProviderVerificationStatus.UnderReview,
            VerificationSubmittedAt = submitted,
            TrustScore = 12.0,
            Skills = new List<string> { "contracts" },
            ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal, ServiceCategory.FundraisingSupport },
            PortfolioItems = new List<PortfolioItem>
            {
                new() { Title = "A" },
                new() { Title = "B" },
            },
        };

        var resp = profile.ToResponse();
        resp.ProviderId.Should().Be("sp-9");
        resp.VerificationStatus.Should().Be("UnderReview");
        resp.VerificationSubmittedAt.Should().Be(submitted);
        resp.ServiceCategories.Should().Equal("Legal", "FundraisingSupport");
        resp.PortfolioItems.Should().HaveCount(2);
        resp.PortfolioItems[0].Index.Should().Be(0);
        resp.PortfolioItems[1].Index.Should().Be(1);
        resp.PortfolioItems[1].Title.Should().Be("B");
    }

    [Fact]
    public void Mapping_projects_verification_view_and_badge()
    {
        var verified = new ServiceProviderProfile
        {
            VerificationStatus = ServiceProviderVerificationStatus.Verified,
            TrustScore = 80,
        }.ToVerificationResponse();

        verified.VerificationStatus.Should().Be("Verified");
        verified.IsVerified.Should().BeTrue();
        verified.TrustScore.Should().Be(80);

        var pending = new ServiceProviderProfile().ToVerificationResponse();
        pending.VerificationStatus.Should().Be("Pending");
        pending.IsVerified.Should().BeFalse();
    }

    [Fact]
    public void Mapping_default_profile_yields_empty_collections_not_null()
    {
        var resp = new ServiceProviderProfile().ToResponse();
        resp.Skills.Should().BeEmpty();
        resp.ServiceCategories.Should().BeEmpty();
        resp.PortfolioItems.Should().BeEmpty();
        resp.VerificationStatus.Should().Be("Pending");
    }
}
