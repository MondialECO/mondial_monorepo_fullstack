using Hangfire;
using Hangfire.Mongo;
using Hangfire.Mongo.Migration.Strategies;
using Hangfire.Mongo.Migration.Strategies.Backup;
using WebApp.Configuration.AiOptions;
using WebApp.Services.Repository;

namespace WebApp.Extensions;

/// <summary>
/// DI module for the C-1 AI infrastructure. Phase 0 wires only the durable job
/// engine (Hangfire on the existing Mongo connection) + the legacy-job
/// persistence + AI configuration binding. The provider client, persistence
/// repositories, prompt framework, AI job engine and controllers land in
/// Phases 1–6 and will be registered here too (single AddAiServices entry
/// point, mirroring AddCompanyServices).
/// </summary>
public static class AiServiceCollectionExtensions
{
    public static IServiceCollection AddAiServices(this IServiceCollection services, IConfiguration configuration)
    {
        // ---- AI configuration binding (consumed from Phase 1 onward) ----
        services.Configure<OpenRouterSettings>(configuration.GetSection(OpenRouterSettings.SectionName));
        services.Configure<AiSettings>(configuration.GetSection(AiSettings.SectionName));

        // ---- Durable legacy-job persistence (dedicated BackgroundJobs collection) ----
        // Singleton to match the IMongoDatabase lifetime and create indexes once.
        services.AddSingleton<IBackgroundJobRepository, BackgroundJobRepository>();

        // Hangfire processor (resolved per-job in a fresh scope by the server).
        services.AddScoped<Services.Implementations.BackgroundJobProcessor>();

        // ---- Hangfire + Mongo storage ----
        var mongoConnectionString = configuration["MongoDbSettings:ConnectionString"];
        var mongoDatabaseName = configuration["MongoDbSettings:DatabaseName"];

        var storageOptions = new MongoStorageOptions
        {
            // Hangfire.Mongo auto-creates/migrates its own collections on first
            // server start. Migrate (not drop) so a future upgrade keeps job
            // state; back up the migrated collections defensively.
            MigrationOptions = new MongoMigrationOptions
            {
                MigrationStrategy = new MigrateMongoMigrationStrategy(),
                BackupStrategy = new CollectionMongoBackupStrategy(),
            },
            Prefix = "hangfire",
            CheckConnection = false,
        };

        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseMongoStorage(mongoConnectionString, mongoDatabaseName, storageOptions));

        // ---- Hangfire server ----
        // AI calls are I/O-bound and rate-limited, so keep the worker count
        // bounded (config override Hangfire:WorkerCount). Listen on BOTH the
        // default queue (legacy jobs) and the dedicated "ai" queue (future AI
        // jobs, Phase 4) so both families process correctly through one server.
        var workerCount = configuration.GetValue("Hangfire:WorkerCount", 4);
        services.AddHangfireServer(options =>
        {
            options.WorkerCount = workerCount;
            options.Queues = new[] { "default", "ai" };
        });

        return services;
    }
}
