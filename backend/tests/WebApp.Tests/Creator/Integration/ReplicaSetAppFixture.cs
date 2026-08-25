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
            Console.WriteLine("[ReplicaSetAppFixture] Starting MongoDb container (mongo:7 with --replSet rs0)...");
            _mongo = new MongoDbBuilder()
                .WithImage("mongo:7")
                .WithUsername(string.Empty)
                .WithPassword(string.Empty)
                .WithEnvironment("MONGO_INITDB_ROOT_USERNAME", string.Empty)
                .WithEnvironment("MONGO_INITDB_ROOT_PASSWORD", string.Empty)
                .WithCommand("--replSet", "rs0", "--bind_ip_all")
                .Build();

            Console.WriteLine("[ReplicaSetAppFixture] Starting Redis container (redis:7)...");
            _redis = new RedisBuilder().WithImage("redis:7").Build();

            var startMongoTask = _mongo.StartAsync();
            var startRedisTask = _redis.StartAsync();

            await Task.WhenAll(startMongoTask, startRedisTask);

            var mappedPort = _mongo.GetMappedPublicPort(27017);
            var connStr = _mongo.GetConnectionString();
            Console.WriteLine($"[ReplicaSetAppFixture] Mongo started on mapped port {mappedPort}. Connection string: {connStr}");

            Console.WriteLine("[ReplicaSetAppFixture] Initiating replica set rs0 via mongosh...");
            var initResult = await _mongo.ExecAsync(new[]
            {
                "mongosh", "--quiet", "--eval",
                "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
            });
            Console.WriteLine($"[ReplicaSetAppFixture] rs.initiate ExitCode: {initResult.ExitCode}, Stdout: '{initResult.Stdout.Trim()}', Stderr: '{initResult.Stderr.Trim()}'");

            if (initResult.ExitCode != 0 && !initResult.Stdout.Contains("already initialized", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"rs.initiate failed with exit code {initResult.ExitCode}: {initResult.Stderr} {initResult.Stdout}");
            }

            Console.WriteLine("[ReplicaSetAppFixture] Waiting for primary...");
            await WaitForPrimaryAsync(_mongo);
            Console.WriteLine("[ReplicaSetAppFixture] Replica set rs0 primary elected successfully!");

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
                            ["OpenRouter:ApiKey"] = "sk-or-test-key",
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
            var mongoLogs = "";
            var rsStatus = "";
            if (_mongo != null)
            {
                try
                {
                    var (stdout, stderr) = await _mongo.GetLogsAsync();
                    mongoLogs = $"STDOUT:\n{stdout}\nSTDERR:\n{stderr}";
                }
                catch { }

                try
                {
                    var res = await _mongo.ExecAsync(new[] { "mongosh", "--quiet", "--eval", "rs.status()" });
                    rsStatus = res.Stdout + "\n" + res.Stderr;
                }
                catch { }
            }

            var fullDiag = $"[ReplicaSetAppFixture FAILURE]\nError: {ex.Message}\nStack: {ex.StackTrace}\n--- Mongo Logs ---\n{mongoLogs}\n--- RS Status ---\n{rsStatus}";
            Console.WriteLine(fullDiag);

            Available = false;
            SkipReason = fullDiag;

            if (_mongo != null)
            {
                throw new InvalidOperationException(fullDiag, ex);
            }
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
            var outText = result.Stdout.Trim();
            if (outText.Equals("true", StringComparison.OrdinalIgnoreCase))
                return;
            await Task.Delay(500);
        }

        var statusRes = await mongo.ExecAsync(new[] { "mongosh", "--quiet", "--eval", "rs.status()" });
        throw new InvalidOperationException($"Replica set did not elect a primary in 15 seconds. rs.status(): {statusRes.Stdout} {statusRes.Stderr}");
    }

    public async Task DisposeAsync()
    {
        if (Factory is not null) await Factory.DisposeAsync();
        if (_redis is not null) await _redis.DisposeAsync();
        if (_mongo is not null) await _mongo.DisposeAsync();
    }
}
