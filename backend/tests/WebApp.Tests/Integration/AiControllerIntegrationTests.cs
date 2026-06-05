using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// HTTP-level tests for AiController: ownership scoping, credit enforcement and
/// the per-user "ai" rate-limit policy. Auth via a JWT minted with the same
/// key/issuer/audience AppFixture configures. Skips without Docker.
/// </summary>
public class AiControllerIntegrationTests : IClassFixture<AppFixture>
{
    private readonly AppFixture _fx;
    public AiControllerIntegrationTests(AppFixture fx) => _fx = fx;

    private IServiceProvider Services => _fx.Factory!.Services;
    private IMongoDatabase Db => Services.GetRequiredService<IMongoDatabase>();

    private static string Jwt(string userId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(new string('k', 48)));
        var token = new JwtSecurityToken(
            issuer: "test",
            audience: "test",
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

    [SkippableFact]
    public async Task GetJob_is_owner_scoped_404_for_other_user()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var userA = Guid.NewGuid().ToString();
        var userB = Guid.NewGuid().ToString();

        var req = new AiRequest { OwnerUserId = userA, JobType = "Probe", Status = "Pending" };
        await new AiRequestRepository(Db).AddAsync(req);

        (await Authed(userA).GetAsync($"/api/ai/jobs/{req.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Authed(userB).GetAsync($"/api/ai/jobs/{req.Id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task GetJob_inlines_result_when_completed()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var req = new AiRequest { OwnerUserId = owner, JobType = "Probe", Status = "Completed" };
        await new AiRequestRepository(Db).AddAsync(req);
        await new AiResponseRepository(Db).AddAsync(new AiResponse
        {
            RequestId = req.Id, OwnerUserId = owner, Model = "test/model", RawText = "hello",
            TokenUsage = new AiResponseTokenUsage { TotalTokens = 7 },
        });

        var resp = await Authed(owner).GetAsync($"/api/ai/jobs/{req.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        (await resp.Content.ReadAsStringAsync()).Should().Contain("hello"); // inlined result text
    }

    [SkippableFact]
    public async Task Feedback_is_owner_scoped()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        var response = new AiResponse { RequestId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), OwnerUserId = owner, Model = "m" };
        await new AiResponseRepository(Db).AddAsync(response); // repo assigns the ObjectId Id

        var ok = await Authed(owner).PostAsJsonAsync("/api/ai/feedback", new { responseId = response.Id, rating = 5 });
        ok.StatusCode.Should().Be(HttpStatusCode.OK);

        var foreign = await Authed(other).PostAsJsonAsync("/api/ai/feedback", new { responseId = response.Id, rating = 5 });
        foreign.StatusCode.Should().Be(HttpStatusCode.NotFound); // not owner -> 404

        var invalid = await Authed(owner).PostAsJsonAsync("/api/ai/feedback", new { responseId = response.Id, rating = 9 });
        invalid.StatusCode.Should().Be(HttpStatusCode.BadRequest); // validator: rating 1..5
    }

    [SkippableFact]
    public async Task Usage_endpoint_returns_owner_totals()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        await new AiModelUsageRepository(Db).AddAsync(new AiModelUsage { OwnerUserId = owner, RequestId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(), Model = "m", TotalTokens = 42, EstimatedCost = 0.01m });
        await new AiCreditLedgerRepository(Db).AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 5, LifetimeGranted = 10, LifetimeSpent = 5 });

        var resp = await Authed(owner).GetAsync("/api/ai/usage");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.Content.ReadAsStringAsync();
        body.Should().Contain("\"totalTokens\":42").And.Contain("\"creditBalance\":5");
    }

    [SkippableFact]
    public async Task Credit_enforcement_debits_and_blocks_when_insufficient()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        using var scope = Services.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<IAiCreditService>();

        // Zero balance -> blocked for a costed job (IdeaClarifier costs 1 in appsettings).
        var broke = Guid.NewGuid().ToString();
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = broke, Balance = 0 });
        await Assert.ThrowsAsync<InsufficientCreditsException>(() => svc.DebitForJobAsync(broke, AiJobType.IdeaClarifier));

        // Sufficient balance -> debited.
        var funded = Guid.NewGuid().ToString();
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = funded, Balance = 5 });
        await svc.DebitForJobAsync(funded, AiJobType.IdeaClarifier);
        (await credits.GetByOwnerAsync(funded))!.Balance.Should().Be(4);

        // Free job (Probe = 0) never touches the ledger.
        var free = Guid.NewGuid().ToString();
        await svc.DebitForJobAsync(free, AiJobType.Probe); // no throw, no ledger needed
    }

    [SkippableFact]
    public async Task Enqueue_is_rate_limited_per_partition()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var client = _fx.Factory!.CreateClient(); // anonymous: limiter runs before auth, partitions by IP

        HttpResponseMessage? last = null;
        for (var i = 1; i <= 21; i++)
            last = await client.PostAsJsonAsync("/api/ai/jobs", new { jobType = "Probe" });

        // First 20 are permitted (then 401 at auth); the 21st is rejected by the "ai" limiter.
        last!.StatusCode.Should().Be((HttpStatusCode)429);
    }
}
