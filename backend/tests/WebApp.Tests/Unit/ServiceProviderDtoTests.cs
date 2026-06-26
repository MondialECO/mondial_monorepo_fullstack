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

    // ---------------- Stage 2 (D-2 Phase 2) ----------------

    [Fact]
    public void CreateOrUpdate_request_round_trips_stage2_fields()
    {
        var req = new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new List<string> { "contracts" },
            ServiceCategories = new List<string> { "Legal" },
            Headline = "Fractional CFO",
            Bio = "15 years in finance.",
            Industries = new List<string> { "Fintech", "SaaS" },
            Languages = new List<string> { "English" },
            PricingModels = new List<string> { "MonthlyRetainer", "EquityCompensation" },
        };

        var json = Json(req);
        json.Should().Contain("\"headline\"").And.Contain("\"industries\"")
            .And.Contain("\"languages\"").And.Contain("\"pricingModels\"");

        var back = RoundTrip(req);
        back.Headline.Should().Be("Fractional CFO");
        back.Bio.Should().Be("15 years in finance.");
        back.Industries.Should().Equal("Fintech", "SaaS");
        back.Languages.Should().Equal("English");
        back.PricingModels.Should().Equal("MonthlyRetainer", "EquityCompensation");
    }

    [Fact]
    public void Request_stage2_collections_default_to_empty()
    {
        var req = new CreateOrUpdateServiceProviderProfileRequest();
        req.Industries.Should().BeEmpty();
        req.Languages.Should().BeEmpty();
        req.PricingModels.Should().BeEmpty();
        req.Headline.Should().BeNull();
        req.Bio.Should().BeNull();
    }

    [Fact]
    public void Mapping_projects_stage2_fields_and_pricing_models_as_names()
    {
        var profile = new ServiceProviderProfile
        {
            Headline = "Fractional CFO",
            Bio = "bio",
            Industries = new List<string> { "Fintech" },
            Languages = new List<string> { "English", "French" },
            PricingModels = new List<PricingModel> { PricingModel.RevenueShare, PricingModel.Other },
        };

        var resp = profile.ToResponse();
        resp.Headline.Should().Be("Fractional CFO");
        resp.Bio.Should().Be("bio");
        resp.Industries.Should().Equal("Fintech");
        resp.Languages.Should().Equal("English", "French");
        resp.PricingModels.Should().Equal("RevenueShare", "Other");
    }

    [Fact]
    public void Mapping_default_profile_yields_empty_stage2_collections_not_null()
    {
        var resp = new ServiceProviderProfile().ToResponse();
        resp.Industries.Should().BeEmpty();
        resp.Languages.Should().BeEmpty();
        resp.PricingModels.Should().BeEmpty();
        resp.Headline.Should().BeNull();
        resp.Bio.Should().BeNull();
    }

    [Fact]
    public void Completion_is_zero_for_empty_profile()
    {
        var resp = new ServiceProviderProfile().ToResponse();
        resp.CompletionPercent.Should().Be(0);
        resp.ProfileComplete.Should().BeFalse();
    }

    [Fact]
    public void Completion_sums_locked_weights_for_partial_profile()
    {
        // Headline 15 + Skill 15 + ServiceCategory 15 + Portfolio 10 = 55.
        var profile = new ServiceProviderProfile
        {
            Headline = "h",
            Skills = new List<string> { "a" },
            ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal },
            PortfolioItems = new List<PortfolioItem> { new() { Title = "t" } },
        };

        var resp = profile.ToResponse();
        resp.CompletionPercent.Should().Be(55);
        resp.ProfileComplete.Should().BeFalse();
    }

    [Fact]
    public void Completion_ignores_blank_headline_and_bio()
    {
        // Whitespace-only Headline/Bio must not count toward completion.
        var profile = new ServiceProviderProfile
        {
            Headline = "   ",
            Bio = "",
            Languages = new List<string> { "English" }, // 10
        };

        profile.ToResponse().CompletionPercent.Should().Be(10);
    }

    [Fact]
    public void Completion_is_100_and_profile_complete_when_all_present()
    {
        var profile = new ServiceProviderProfile
        {
            Headline = "h",                                                       // 15
            Bio = "b",                                                            // 15
            Skills = new List<string> { "a" },                                    // 15
            ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal }, // 15
            Industries = new List<string> { "Fintech" },                          // 15
            Languages = new List<string> { "English" },                           // 10
            PricingModels = new List<PricingModel> { PricingModel.FixedPrice },    // 5
            PortfolioItems = new List<PortfolioItem> { new() { Title = "t" } },    // 10
        };

        var resp = profile.ToResponse();
        resp.CompletionPercent.Should().Be(100);
        resp.ProfileComplete.Should().BeTrue();
    }

    [Fact]
    public void Completion_backward_compatible_with_stage1_only_profile()
    {
        // A Stage-1 profile (no Stage-2 fields) maps without error and scores only
        // its Stage-1 contributions: Skill 15 + ServiceCategory 15 + Portfolio 10.
        var stage1 = new ServiceProviderProfile
        {
            Skills = new List<string> { "contracts" },
            ServiceCategories = new List<ServiceCategory> { ServiceCategory.Finance },
            PortfolioItems = new List<PortfolioItem> { new() { Title = "A" } },
        };

        var resp = stage1.ToResponse();
        resp.CompletionPercent.Should().Be(40);
        resp.ProfileComplete.Should().BeFalse();
        resp.PricingModels.Should().BeEmpty();
        resp.Industries.Should().BeEmpty();
    }
}
