using WebApp.Services;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;

namespace WebApp.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCompanyServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register investor service first (used by InvestorMatcher)
        services.AddScoped<IInvestorService, InvestorService>();

        // Register business logic engines (dependencies first)
        services.AddScoped<IValuationEngine, ValuationEngine>();
        services.AddScoped<ICapTableCalculator, CapTableCalculator>();
        services.AddScoped<IInvestorMatcher, InvestorMatcher>();
        services.AddScoped<IAiReviewEngine, AiReviewEngine>();
        services.AddScoped<IPhaseValidator, PhaseValidator>();

        // Register document manager
        var uploadsPath = configuration["FileStorage:UploadPath"] ?? "uploads";
        services.AddScoped<IDocumentManager>(provider => new DocumentManager(uploadsPath));

        // Deal/offer realtime event publisher (per-user groups on NotificationHub)
        services.AddScoped<IDealEventPublisher, DealEventPublisher>();

        // Register CompanyService (depends on all the above)
        services.AddScoped<ICompanyService, CompanyService>();

        // Register notification and background job services
        services.AddScoped<IPhaseNotificationService, PhaseNotificationService>();
        services.AddScoped<IBackgroundJobService, BackgroundJobService>();

        // Creator journey (Phases 2–6 source of truth; derived-status engine)
        services.AddScoped<ICreatorJourneyService, CreatorJourneyService>();

        // Multi-idea STEP 3: idea resolution/management. Registered but NOT yet called
        // by any controller — cutover happens in step 4 all at once.
        services.AddScoped<ICreatorIdeaService, CreatorIdeaService>();

        // Shared M50 SP match formula (Phase 2 designers + Phase 3 formation)
        services.AddScoped<ISpMatchingService, SpMatchingService>();

        // Shared smart-matching formula (Phase 5 buyers + Phase 6 investors)
        services.AddScoped<ISmartMatchingService, SmartMatchingService>();

        return services;
    }
}
