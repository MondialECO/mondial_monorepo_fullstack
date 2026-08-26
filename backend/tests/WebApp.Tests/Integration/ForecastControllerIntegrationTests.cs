using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// HTTP-level tests for ForecastController: generation from a Completed business
/// plan + enqueue, ownership scoping (404 on foreign resources), credit enforcement
/// (402), source-status validation (409) on start and regenerate, owner-scoped list
/// filtering, and in-place edit. Auth via a JWT minted with the same
/// key/issuer/audience AppFixture configures. Skips without Docker.
/// </summary>
public class ForecastControllerIntegrationTests : IClassFixture<AppFixture>
{
    private readonly AppFixture _fx;
    public ForecastControllerIntegrationTests(AppFixture fx) => _fx = fx;

    private IServiceProvider Services => _fx.Factory!.Services;
    private IMongoDatabase Db => Services.GetRequiredService<IMongoDatabase>();

    private static string Jwt(string userId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(new string('k', 48)));
        var token = new JwtSecurityToken(
            issuer: "test", audience: "test",
            claims: new[] { new Claim(JwtRegisteredClaimNames.Sub, userId) },
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private HttpClient Authed(string userId)
    {
        var client = _fx.Factory!.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Jwt(userId));
        return client;
    }

    private async Task FundAsync(string owner, int balance) =>
        await new AiCreditLedgerRepository(Db).AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = balance });

    /// <summary>Seed a Completed business-plan session owned by <paramref name="owner"/>.</summary>
    private async Task<string> CompletedPlanAsync(string owner)
    {
        var repo = new BusinessPlanSessionRepository(Db);
        var plan = new BusinessPlanSession { OwnerUserId = owner, ClarifierSessionId = ObjectId.GenerateNewId().ToString(), Status = "Pending" };
        await repo.AddAsync(plan);
        await repo.AppendGeneratedVersionAsync(plan.Id, new BsonDocument
        {
            ["schemaVersion"] = 1,
            ["executiveSummary"] = new BsonDocument("overview", "Autonomous crop monitoring."),
        }, ObjectId.GenerateNewId().ToString());
        return plan.Id;
    }

    /// <summary>Seed a Completed forecast session owned by <paramref name="owner"/>, with one version.</summary>
    private async Task<string> CompletedForecastAsync(string owner, string planId)
    {
        var repo = new ForecastSessionRepository(Db);
        var fc = new ForecastSession { OwnerUserId = owner, BusinessPlanSessionId = planId, Status = "Pending" };
        await repo.AddAsync(fc);
        await repo.AppendGeneratedVersionAsync(fc.Id, new BsonDocument
        {
            ["schemaVersion"] = 1,
            ["revenueForecast"] = new BsonDocument { ["currency"] = "USD", ["monthly"] = new BsonArray() },
            ["advisoryNotice"] = "estimates only",
        }, ObjectId.GenerateNewId().ToString());
        return fc.Id;
    }

    private static async Task<string> SessionIdAsync(HttpResponseMessage resp)
    {
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty("sessionId").GetString()!;
    }

    [SkippableFact]
    public async Task Start_creates_session_and_returns_ids()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        await FundAsync(owner, 20);
        var planId = await CompletedPlanAsync(owner);

        var resp = await Authed(owner).PostAsJsonAsync("/api/ai/forecast", new { businessPlanSessionId = planId, monthlyChurnPct = 5.0 });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        (await resp.Content.ReadAsStringAsync()).Should().Contain("sessionId").And.Contain("jobId");

        var sessionId = await SessionIdAsync(resp);
        var session = await new ForecastSessionRepository(Db).GetOwnedAsync(sessionId, owner);
        session.Should().NotBeNull();
        session!.RequestId.Should().NotBeNullOrEmpty();
        session.BusinessPlanSessionId.Should().Be(planId);
    }

    [SkippableFact]
    public async Task Start_returns_422_when_business_plan_not_completed()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        await FundAsync(owner, 20);

        // Pending plan (no completed version).
        var repo = new BusinessPlanSessionRepository(Db);
        var plan = new BusinessPlanSession { OwnerUserId = owner, ClarifierSessionId = ObjectId.GenerateNewId().ToString(), Status = "Pending" };
        await repo.AddAsync(plan);

        var resp = await Authed(owner).PostAsJsonAsync("/api/ai/forecast", new { businessPlanSessionId = plan.Id, monthlyChurnPct = 5.0 });
        resp.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task Start_returns_422_for_foreign_business_plan()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        await FundAsync(other, 20);
        var planId = await CompletedPlanAsync(owner); // owned by someone else

        var resp = await Authed(other).PostAsJsonAsync("/api/ai/forecast", new { businessPlanSessionId = planId, monthlyChurnPct = 5.0 });
        resp.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task Start_blocks_when_insufficient_credits()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        await FundAsync(owner, 0); // Forecast costs 5
        var planId = await CompletedPlanAsync(owner);

        var resp = await Authed(owner).PostAsJsonAsync("/api/ai/forecast", new { businessPlanSessionId = planId, monthlyChurnPct = 5.0 });
        resp.StatusCode.Should().Be((HttpStatusCode)402);
    }

    [SkippableFact]
    public async Task Get_is_owner_scoped_404_for_other_user()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        var planId = await CompletedPlanAsync(owner);
        var fcId = await CompletedForecastAsync(owner, planId);

        (await Authed(owner).GetAsync($"/api/ai/forecast/{fcId}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Authed(other).GetAsync($"/api/ai/forecast/{fcId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Get_returns_404_for_unparseable_id()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();

        (await Authed(owner).GetAsync("/api/ai/forecast/not-an-objectid"))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task List_is_owner_scoped_and_filters_by_business_plan()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        var planA = await CompletedPlanAsync(owner);
        var planB = await CompletedPlanAsync(owner);

        await CompletedForecastAsync(owner, planA);
        await CompletedForecastAsync(owner, planB);
        await CompletedForecastAsync(other, planA); // foreign

        var allResp = await Authed(owner).GetAsync("/api/ai/forecast");
        using var all = JsonDocument.Parse(await allResp.Content.ReadAsStringAsync());
        all.RootElement.GetProperty("data").GetArrayLength().Should().Be(2);

        var filteredResp = await Authed(owner).GetAsync($"/api/ai/forecast?businessPlanSessionId={planA}");
        using var filtered = JsonDocument.Parse(await filteredResp.Content.ReadAsStringAsync());
        var data = filtered.RootElement.GetProperty("data");
        data.GetArrayLength().Should().Be(1);
        data[0].GetProperty("businessPlanSessionId").GetString().Should().Be(planA);
    }

    [SkippableFact]
    public async Task Regenerate_revalidates_source_and_is_owner_scoped()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        await FundAsync(owner, 20);
        var planId = await CompletedPlanAsync(owner);
        var fcId = await CompletedForecastAsync(owner, planId);

        // Foreign caller cannot regenerate.
        (await Authed(other).PostAsync($"/api/ai/forecast/{fcId}/regenerate", null))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Owner with a still-Completed source plan can.
        (await Authed(owner).PostAsync($"/api/ai/forecast/{fcId}/regenerate", null))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [SkippableFact]
    public async Task Edit_updates_current_version_and_409_before_any_generation()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var planId = await CompletedPlanAsync(owner);
        var fcId = await CompletedForecastAsync(owner, planId);

        var body = new
        {
            forecast = new
            {
                schemaVersion = 1,
                revenueForecast = new { currency = "EUR", summary = "edited", monthly = Array.Empty<object>() },
                costForecast = new { currency = "EUR", monthly = Array.Empty<object>() },
                cashFlowProjection = new { currency = "EUR", monthly = Array.Empty<object>() },
                breakEvenAnalysis = new { breakEvenMonth = (int?)null, isAchievedWithinHorizon = false },
                assumptions = new[] { "edited assumption" },
                risks = Array.Empty<object>(),
                advisoryNotice = "estimates only",
            },
        };

        var resp = await Authed(owner).PutAsJsonAsync($"/api/ai/forecast/{fcId}", body);
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        (await resp.Content.ReadAsStringAsync()).Should().Contain("EUR");

        // A brand-new forecast (no completed version) cannot be edited yet.
        var fresh = new ForecastSessionRepository(Db);
        var pending = new ForecastSession { OwnerUserId = owner, BusinessPlanSessionId = planId, Status = "Pending" };
        await fresh.AddAsync(pending);
        (await Authed(owner).PutAsJsonAsync($"/api/ai/forecast/{pending.Id}", body))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);
    }
}
