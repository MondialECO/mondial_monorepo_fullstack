using WebApp.Services;
using WebApp.Services.Implementations;

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

        // Register CompanyService (depends on all the above)
        services.AddScoped<ICompanyService, CompanyService>();

        // Register notification and background job services
        services.AddScoped<IPhaseNotificationService, PhaseNotificationService>();
        services.AddScoped<IBackgroundJobService, BackgroundJobService>();

        return services;
    }
}
