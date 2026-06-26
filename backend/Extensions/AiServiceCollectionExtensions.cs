using Hangfire;
using Hangfire.Mongo;
using Hangfire.Mongo.Migration.Strategies;
using Hangfire.Mongo.Migration.Strategies.Backup;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;
using WebApp.HealthChecks;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

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
        // ---- AI configuration binding ----
        services.Configure<AnthropicSettings>(configuration.GetSection(AnthropicSettings.SectionName));
        services.Configure<AiSettings>(configuration.GetSection(AiSettings.SectionName));

        // ---- Anthropic (Claude) provider: typed HttpClient + model routing ----
        services.AddSingleton<IModelRouter, ModelRouter>();

        // Typed client. Auth (x-api-key) + anthropic-version headers + BaseAddress
        // come from AnthropicSettings; a Polly retry policy (429/5xx) is layered on top.
        services.AddHttpClient<IAiProvider, AnthropicClient>((sp, client) =>
        {
            var s = sp.GetRequiredService<IOptions<AnthropicSettings>>().Value;
            AnthropicClient.ConfigureHttpClient(client, s);
        })
        .AddPolicyHandler((sp, _) =>
        {
            var s = sp.GetRequiredService<IOptions<AnthropicSettings>>().Value;
            return AnthropicResiliencePolicies.Default(s.MaxRetries);
        });

        // Separate client for the readiness ping (opt-in); headers set per-request.
        services.AddHttpClient(AnthropicHealthCheck.PingClientName);

        // ---- AI persistence (Phase 2): repositories for the 7 AI collections ----
        // Singletons (like NotificationRepository / BackgroundJobRepository) so the
        // ctor index creation runs once per process against the shared IMongoDatabase.
        services.AddSingleton<AiRequestRepository>();
        services.AddSingleton<AiResponseRepository>();
        services.AddSingleton<PromptVersionRepository>();
        services.AddSingleton<AiModelUsageRepository>();
        services.AddSingleton<AiFeedbackRepository>();
        services.AddSingleton<AiInsightRepository>();
        services.AddSingleton<AiCreditLedgerRepository>();

        // ---- Phase 2 Discovery: Idea Generator (source-of-truth session store) ----
        services.AddSingleton<Services.Repository.Ai.IIdeaGenerationSessionRepository, Services.Repository.Ai.IdeaGenerationSessionRepository>();

        // ---- C-2 Idea Clarifier (source-of-truth session store) ----
        services.AddSingleton<ClarifierSessionRepository>();
        services.AddSingleton<IClarifierSessionStore>(sp => sp.GetRequiredService<ClarifierSessionRepository>());
        services.AddSingleton<Services.Ai.Jobs.IAiInsightWriter, Services.Ai.Jobs.AiInsightWriter>();

        // ---- C-3 Business Plan (source-of-truth session store) ----
        services.AddSingleton<BusinessPlanSessionRepository>();
        services.AddSingleton<IBusinessPlanSessionStore>(sp => sp.GetRequiredService<BusinessPlanSessionRepository>());

        // ---- C-4 Forecast (source-of-truth session store) ----
        services.AddSingleton<ForecastSessionRepository>();
        services.AddSingleton<IForecastSessionStore>(sp => sp.GetRequiredService<ForecastSessionRepository>());

        // ---- Prompt framework (Phase 3) ----
        // Builder is stateless; store wraps the PromptVersions repository. Both
        // singletons. Startup seeding of in-code templates happens in Program.cs.
        services.AddSingleton<Services.Ai.Prompts.IPromptBuilder, Services.Ai.Prompts.PromptBuilder>();
        services.AddSingleton<Services.Ai.Prompts.IPromptVersionStore, Services.Ai.Prompts.PromptVersionStore>();

        // ---- AI job engine (Phase 4) ----
        // Handlers self-register as IAiTaskHandler; the registry builds the
        // type->handler map. C-1 ships only the Probe handler. Runner + service
        // are scoped (Hangfire resolves the runner in a fresh per-job scope).
        services.AddScoped<Services.Ai.Jobs.IAiTaskHandler, Services.Ai.Jobs.NoOpProbeHandler>();
        services.AddScoped<Services.Ai.Jobs.IAiTaskHandler, Services.Ai.Jobs.IdeaGeneratorHandler>();   // Phase 2 Discovery
        services.AddScoped<Services.Ai.Jobs.IAiTaskHandler, Services.Ai.Jobs.IdeaClarifierHandler>(); // C-2
        services.AddScoped<Services.Ai.Jobs.IAiTaskHandler, Services.Ai.Jobs.BusinessPlanHandler>();  // C-3
        services.AddScoped<Services.Ai.Jobs.IAiTaskHandler, Services.Ai.Jobs.ForecastHandler>();      // C-4
        services.AddScoped<Services.Ai.Jobs.AiTaskHandlerRegistry>();
        services.AddScoped<Services.Ai.Jobs.IAiJobRunner, Services.Ai.Jobs.AiJobRunner>();
        services.AddScoped<Services.Ai.Jobs.IAiJobService, Services.Ai.Jobs.AiJobService>();

        // ---- Notifications + realtime (Phase 5) ----
        // Reuse the existing NotificationService + NotificationHub. The event
        // publisher mirrors DealEventPublisher (owner per-user group, no new hub).
        services.AddScoped<Services.Ai.Jobs.IAiEventPublisher, Services.Ai.Jobs.AiEventPublisher>();
        services.AddScoped<Services.Ai.Jobs.IAiJobCompletionHandler, Services.Ai.Jobs.AiJobCompletionHandler>();

        // ---- API surface services (Phase 6) ----
        services.AddScoped<Services.Ai.IAiUsageService, Services.Ai.AiUsageService>();
        services.AddScoped<Services.Ai.IAiCreditService, Services.Ai.AiCreditService>();

        // ---- Operational: idempotent starter-credit backfill (Phase 7) ----
        services.AddScoped<Services.Ai.IAiCreditSeeder, Services.Ai.AiCreditSeeder>();

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
