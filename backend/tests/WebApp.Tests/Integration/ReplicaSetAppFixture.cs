using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.MongoDb;
using Testcontainers.Redis;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// Like <see cref="AppFixture"/>, but the MongoDB container runs as a SINGLE-NODE
/// REPLICA SET so multi-document transactions work (the standalone <see cref="AppFixture"/>
/// cannot run transactions — they throw). Boots the full app with
/// <c>Mongo:TransactionsEnabled = true</c> so the Level Up transaction path is exercised
/// for real, not the ordered-writes fallback.
///
/// Skips (via <see cref="Available"/>) when Docker/Testcontainers is unavailable.
///
/// Gotchas handled here (single-node RS in Testcontainers):
///  - container started with <c>--replSet rs0</c>, then <c>rs.initiate()</c> via mongosh exec;
///  - the client connects with <c>directConnection=true</c> so SDAM doesn't try to reach the
///    RS-config host (the container-internal address) from the test host.
/// </summary>
public sealed class ReplicaSetAppFixture : IAsyncLifetime
{
    private MongoDbContainer? _mongo;
    private RedisContainer? _redis;

    public WebApplicationFactory<Program>? Factory { get; private set; }
    public bool Available { get; private set; }
    public string SkipReason { get; private set; } = "Docker not available";

    public async Task InitializeAsync()
    {
        try
        {
            // Single-node replica set. --bind_ip_all so the mapped port is reachable.
            _mongo = new MongoDbBuilder()
                .WithImage("mongo:7")
                .WithCommand("--replSet", "rs0", "--bind_ip_all")
                .Build();
            _redis = new RedisBuilder().WithImage("redis:7").Build();

            await _mongo.StartAsync();
            await _redis.StartAsync();

            // Initiate the replica set, then wait until the node is primary.
            await _mongo.ExecAsync(new[]
            {
                "mongosh", "--quiet", "--eval",
                "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
            });
            await WaitForPrimaryAsync(_mongo);

            // directConnection=true: talk to the mapped port directly; transactions still
            // work against a single-node RS this way.
            var connString = _mongo.GetConnectionString();
            connString += connString.Contains('?') ? "&directConnection=true" : "?directConnection=true";

            Factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(b =>
                {
                    b.UseEnvironment("Development");
                    b.ConfigureAppConfiguration((_, cfg) =>
                    {
                        cfg.AddInMemoryCollection(new Dictionary<string, string?>
                        {
                            ["MongoDbSettings:ConnectionString"] = connString,
                            ["MongoDbSettings:DatabaseName"] = "IntegrationTestRs",
                            // The whole point: exercise the REAL transaction path.
                            ["Mongo:TransactionsEnabled"] = "true",
                            ["JwtSettings:Issuer"] = "test",
                            ["JwtSettings:Audience"] = "test",
                            ["JwtSettings:Key"] = new string('k', 48),
                            ["EmailSettings:SmtpServer"] = "smtp.test",
                            ["EmailSettings:Email"] = "test@test.com",
                            ["EmailSettings:Password"] = "pw",
                            ["Anthropic:ApiKey"] = "sk-ant-test-key",
                            ["Redis:Configuration"] = _redis.GetConnectionString(),
                            ["Redis:InstanceName"] = "Test",
                        });
                    });
                });

            _ = Factory.Services; // force host build
            Available = true;
        }
        catch (Exception ex)
        {
            Available = false;
            SkipReason = $"Docker/replica-set unavailable: {ex.Message}";
        }
    }

    private static async Task WaitForPrimaryAsync(MongoDbContainer mongo)
    {
        for (var i = 0; i < 30; i++)
        {
            var result = await mongo.ExecAsync(new[]
            {
                "mongosh", "--quiet", "--eval", "db.hello().isWritablePrimary"
            });
            if (result.Stdout.Trim().Equals("true", StringComparison.OrdinalIgnoreCase))
                return;
            await Task.Delay(500);
        }
        throw new InvalidOperationException("Replica set did not elect a primary in time.");
    }

    public async Task DisposeAsync()
    {
        if (Factory is not null) await Factory.DisposeAsync();
        if (_redis is not null) await _redis.DisposeAsync();
        if (_mongo is not null) await _mongo.DisposeAsync();
    }
}
