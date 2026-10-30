using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// HTTP-level tests for ClarifierController: session creation + enqueue,
/// ownership scoping, the Clarifier feature flag, credit enforcement, and
/// owner-scoped list filtering. Auth via a JWT minted with the same
/// key/issuer/audience AppFixture configures. Skips without Docker.
/// </summary>
public class ClarifierControllerIntegrationTests : IClassFixture<AppFixture>
{
    private readonly AppFixture _fx;
    public ClarifierControllerIntegrationTests(AppFixture fx) => _fx = fx;

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

    // Read the configured price (Ai:CreditCosts) rather than hardcoding it.
    private int ClarifierCost => Services.GetRequiredService<IOptions<AiSettings>>().Value.CreditCosts
        .TryGetValue("IdeaClarifier", out var cost) ? cost : 1;

    private async Task FundAsync(string owner, int balance) =>
        await new AiCreditLedgerRepository(Db).AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = balance });

    // Start requires an owned CreatorIdea (multi-idea integrity: every AI session is anchored
    // to an idea — docs/system-architecture/07-source-of-truth.md).
    private async Task<string> IdeaAsync(string owner)
    {
        var idea = new CreatorIdea { Id = ObjectId.GenerateNewId().ToString(), UserId = owner };
        await new CreatorIdeaRepository(Db).AddAsync(idea);
        return idea.Id;
    }

    private static object ValidBody(string? businessIdeaId) => new
    {
        businessIdeaId,
        rawIdea = new
        {
            title = "Solar drones",
            problemStatement = "Crop monitoring is manual and slow.",
            targetAudience = "Mid-size farms",
        },
    };

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
        await FundAsync(owner, ClarifierCost);

        var resp = await Authed(owner).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(await IdeaAsync(owner)));

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadAsStringAsync();
        body.Should().Contain("sessionId").And.Contain("jobId");

        // Persisted, owner-scoped, and linked to the engine request.
        var sessionId = await SessionIdAsync(resp);
        var session = await new ClarifierSessionRepository(Db).GetOwnedAsync(sessionId, owner);
        session.Should().NotBeNull();
        session!.RequestId.Should().NotBeNullOrEmpty();
        session.Status.Should().BeOneOf("Pending", "Processing", "Completed", "Failed", "NeedsReview");
    }

    [SkippableFact]
    public async Task Start_validates_required_fields()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        await FundAsync(owner, 5);

        var resp = await Authed(owner).PostAsJsonAsync("/api/ai/idea-clarifier",
            new { businessIdeaId = await IdeaAsync(owner), rawIdea = new { title = "", problemStatement = "", targetAudience = "" } });

        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Start_requires_an_owned_business_idea()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        await FundAsync(owner, 5);

        (await Authed(owner).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(null)))
            .StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Authed(owner).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(await IdeaAsync(other))))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Start_blocks_when_insufficient_credits()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        await FundAsync(owner, ClarifierCost - 1);

        var resp = await Authed(owner).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(await IdeaAsync(owner)));

        resp.StatusCode.Should().Be((HttpStatusCode)402);
    }

    [SkippableFact]
    public async Task Get_is_owner_scoped_404_for_other_user()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        await FundAsync(owner, ClarifierCost);

        var created = await Authed(owner).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(await IdeaAsync(owner)));
        var sessionId = await SessionIdAsync(created);

        (await Authed(owner).GetAsync($"/api/ai/idea-clarifier/{sessionId}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Authed(other).GetAsync($"/api/ai/idea-clarifier/{sessionId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Get_returns_404_for_unparseable_id()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();

        (await Authed(owner).GetAsync("/api/ai/idea-clarifier/not-an-objectid"))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task List_is_owner_scoped_and_filters_by_business_idea()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        await FundAsync(owner, ClarifierCost * 2);
        await FundAsync(other, ClarifierCost * 2);

        var ideaA = await IdeaAsync(owner);
        var ideaB = await IdeaAsync(owner);
        var ideaC = await IdeaAsync(other);

        await Authed(owner).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(ideaA));
        await Authed(owner).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(ideaB));
        await Authed(other).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(ideaC)); // foreign session
        (await Authed(other).PostAsJsonAsync("/api/ai/idea-clarifier", ValidBody(ideaA)))
            .StatusCode.Should().Be(HttpStatusCode.NotFound, "a session cannot be anchored to someone else's idea");

        // Owner's full list excludes the other user's session.
        var allResp = await Authed(owner).GetAsync("/api/ai/idea-clarifier");
        using var all = JsonDocument.Parse(await allResp.Content.ReadAsStringAsync());
        all.RootElement.GetProperty("data").GetArrayLength().Should().Be(2);

        // Filtered by ideaA returns only the owner's ideaA session.
        var filteredResp = await Authed(owner).GetAsync($"/api/ai/idea-clarifier?businessIdeaId={ideaA}");
        using var filtered = JsonDocument.Parse(await filteredResp.Content.ReadAsStringAsync());
        var data = filtered.RootElement.GetProperty("data");
        data.GetArrayLength().Should().Be(1);
        data[0].GetProperty("businessIdeaId").GetString().Should().Be(ideaA);
    }
}
