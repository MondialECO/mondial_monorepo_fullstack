using System.Text.Json;
using Microsoft.Extensions.Hosting;
using MongoDB.Bson;
using MongoDB.Driver;
using Serilog;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;

namespace WebApp.Extensions;

/// <summary>
/// Demo seed data for non-production environments. Currently seeds the
/// Investor catalogue so the investor list, matching, and dashboards have
/// something to render on a fresh database.
///
/// Double-gated: only runs when the host is Development AND
/// configuration flag SeedDemoData=true. Production appsettings ships with
/// SeedDemoData=false so a misconfigured prod env still won't seed.
///
/// Idempotent: if the Investors collection already has any documents the
/// seeder no-ops, so crash-loops and re-deploys are safe.
/// </summary>
public static class SeedingExtensions
{
    public static async Task SeedDemoDataAsync(this IServiceProvider services, IHostEnvironment env, IConfiguration config)
    {
        // Hard gate 1: never in non-Development environments.
        if (!env.IsDevelopment())
        {
            return;
        }

        // Hard gate 2: explicit opt-in flag.
        if (!config.GetValue<bool>("SeedDemoData"))
        {
            return;
        }

        try
        {
            await SeedInvestorsAsync(services);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Demo seeding skipped (non-fatal)");
        }
    }

    private static async Task SeedInvestorsAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        // Idempotency gate: bail if anyone (admin, prior seed, signup) has
        // already put rows in the catalogue.
        var existing = await dbContext.Investors.CountDocumentsAsync(FilterDefinition<Investor>.Empty);
        if (existing > 0)
        {
            Log.Information("Investor catalogue already populated ({Count}) — seed skipped", existing);
            return;
        }

        var seedPath = Path.Combine(AppContext.BaseDirectory, "Configuration", "SeedData", "investors.json");
        if (!File.Exists(seedPath))
        {
            Log.Warning("Investor seed file not found at {Path}", seedPath);
            return;
        }

        var json = await File.ReadAllTextAsync(seedPath);
        var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var investors = JsonSerializer.Deserialize<List<Investor>>(json, jsonOpts);

        if (investors == null || investors.Count == 0)
        {
            Log.Warning("Investor seed file parsed to empty list");
            return;
        }

        var now = DateTime.UtcNow;
        foreach (var inv in investors)
        {
            inv.Id = ObjectId.GenerateNewId().ToString();
            inv.CreatedAt = now;
            inv.UpdatedAt = now;
            inv.LastActiveAt = now;
            inv.LinkedUserId = null;
        }

        await dbContext.Investors.InsertManyAsync(investors);
        Log.Information("Seeded {Count} demo investor(s) into the catalogue", investors.Count);
    }
}
