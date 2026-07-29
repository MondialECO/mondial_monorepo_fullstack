using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Hosting;
using MongoDB.Bson;
using MongoDB.Driver;
using Serilog;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Repository.Ai;

namespace WebApp.Extensions;

/// <summary>
/// Demo seed data for non-production environments. Seeds, in order, the
/// Investor catalogue, demo creator + investor users, demo business ideas,
/// and demo investments that link the demo investor to the demo ideas.
///
/// Double-gated: only runs when the host is Development OR the dedicated
/// Demo environment, AND configuration flag SeedDemoData=true. Production
/// appsettings ships with SeedDemoData=false so a misconfigured prod env
/// still won't seed.
///
/// Each step is independently idempotent. Re-runs are no-ops once the
/// target rows exist.
/// </summary>
public static class SeedingExtensions
{
    private const string DemoCreatorEmail = "demo.creator@mondial.local";
    private const string DemoInvestorEmail = "demo.investor@mondial.local";
    private const string DemoEntrepreneurEmail = "demo.entrepreneur@mondial.local";
    private const string DemoServiceProviderEmail = "demo.provider@mondial.local";
    private const string DemoAdminEmail = "demo.admin@mondial.local";
    private const string DemoPassword = "DemoP@ss1";
    private const string DemoNdaText = "This is a demo NDA — do not use in production.";

    // Starter AI credit balance granted to demo users so the AI Studio flow
    // (Idea Clarifier 1 + Business Plan 5 + Forecast 5 = 11 per full run) can
    // be exercised end-to-end. ~9 full runs before top-up is required.
    private const int DemoAiCredits = 100;

    public static async Task SeedDemoDataAsync(this IServiceProvider services, IHostEnvironment env, IConfiguration config)
    {
        // Allow seeding in Development or a dedicated Demo environment (VPS
        // demo runs ASPNETCORE_ENVIRONMENT=Demo to keep production hardening
        // while still seeding). Production never satisfies this gate.
        if (!env.IsDevelopment() && !env.IsEnvironment("Demo")) return;
        if (!config.GetValue<bool>("SeedDemoData")) return;

        try
        {
            await SeedInvestorsAsync(services);
            var (creator, investor) = await SeedDemoUsersAsync(services);
            var ideas = await SeedBusinessIdeasAsync(services, creator);
            await SeedInvestmentsAsync(services, investor, ideas);

            // Investor-demo seed pipeline (P0 for the 2026-06-10 demo). Each
            // step is independently idempotent and inherits the
            // Development/Demo + SeedDemoData=true gates from this parent method.
            var entrepreneur = await SeedDemoEntrepreneurAsync(services);
            var companies = await SeedDemoCompaniesAsync(services, entrepreneur);
            await SeedInvestorMatchesAsync(services, investor, companies);
            await SeedNdaAcceptancesAsync(services, investor, companies);
            await SeedDataRoomDocsAsync(services, companies);
            await SeedAccessLogsAsync(services, investor, companies);
            await SeedDealExecutionAsync(services, investor, companies);

            // Demo-readiness seed pipeline (P0 for the 2026-06-10 demo): a
            // service-provider user so entrepreneur↔provider chat exists, AI
            // credits so the Creator AI Studio runs, and realistic inbox
            // conversations. Each step is independently idempotent.
            await SeedDemoAdminAsync(services);
            var serviceProvider = await SeedDemoServiceProviderAsync(services);
            await SeedDemoAiCreditsAsync(services, creator, investor, entrepreneur);
            await SeedDemoConversationsAsync(services, creator, investor, entrepreneur, serviceProvider);
        }
        catch (Exception ex)
        {
            // Forensic-quality warning: include the flattened ToString so the
            // full inner-exception chain survives any structured-attachment
            // truncation or async-sink buffering.
            Log.Warning(ex, "Demo seeding skipped (non-fatal). Full={Full}", ex.ToString());
        }
    }

    // ---- 1) Investor catalogue ----

    private static async Task SeedInvestorsAsync(IServiceProvider services)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var existing = await dbContext.Investors.CountDocumentsAsync(FilterDefinition<Investor>.Empty);
        if (existing > 0)
        {
            Log.Information("Investor catalogue already populated ({Count}) - seed skipped", existing);
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

    // ---- 2) Demo users (creator + investor) ----

    private static async Task<(ApplicationUser creator, ApplicationUser investor)> SeedDemoUsersAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var investorService = services.GetRequiredService<IInvestorService>();

        var creator = await GetOrCreateDemoUserAsync(
            userManager, roleManager,
            email: DemoCreatorEmail,
            name: "Demo Creator",
            role: "Creator");

        var investor = await GetOrCreateDemoUserAsync(
            userManager, roleManager,
            email: DemoInvestorEmail,
            name: "Demo Investor",
            role: "Investor");

        // Link the demo investor to an Investor catalogue row exactly the
        // way AuthController.Register's P0-1 wiring does. Done here in the
        // seeder rather than as a signup side effect so demo data is
        // available at boot without any user action.
        //
        // P1-1 self-healing: a reseed (or a manually dropped Investors
        // collection) can leave InvestorProfile.InvestorId pointing at a row
        // that no longer exists. Treat a non-empty-but-dangling link the same
        // as a missing one and relink. Idempotent: a valid link is left
        // untouched; a missing/dangling one is recreated.
        var linkedInvestorId = investor.InvestorProfile?.InvestorId;
        var needsLink = string.IsNullOrEmpty(linkedInvestorId);
        if (!needsLink)
        {
            try
            {
                await investorService.GetInvestorAsync(linkedInvestorId!);
            }
            catch (KeyNotFoundException)
            {
                Log.Warning("Demo investor link {InvestorId} is dangling - relinking", linkedInvestorId);
                needsLink = true;
            }
        }

        if (needsLink)
        {
            try
            {
                var stub = new Investor
                {
                    Name = investor.Name ?? "Demo Investor",
                    Type = "angel",
                    PrimaryEmail = investor.Email,
                    IsActive = true,
                    ProfileScore = 60,
                    LinkedUserId = investor.Id.ToString(),
                    PreferredSectors = new List<string> { "SaaS", "HealthTech", "ClimaTech" },
                    PreferredStages = new List<string> { "seed", "series_a" },
                    MinCheckSize = 50000,
                    MaxCheckSize = 750000,
                    PreferredGeographies = new List<string> { "EU" }
                };

                var created = await investorService.CreateInvestorAsync(stub);

                investor.InvestorProfile ??= new InvestorProfile();
                investor.InvestorProfile.InvestorId = created.Id;
                await userManager.UpdateAsync(investor);
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Demo investor catalogue link failed (non-fatal)");
            }
        }

        return (creator, investor);
    }

    private static async Task<ApplicationUser> GetOrCreateDemoUserAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        string email,
        string name,
        string role)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            Log.Information("Demo user {Email} already exists - skip", email);
            return existing;
        }

        if (!await roleManager.RoleExistsAsync(role))
        {
            // Defensive only - Program.cs role seeding runs before us. Skip
            // creating a user we can't legally assign a role to.
            Log.Warning("Role {Role} missing; cannot create demo user {Email}", role, email);
            throw new InvalidOperationException($"Role '{role}' is not seeded");
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            Name = name,
            User = role,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
            // Phase 1 universal onboarding pre-completed so dashboards
            // unlock without an OTP/identity walkthrough during the demo.
            Onboarding = new OnboardingState
            {
                Phase = 1,
                EmailOtpVerified = true,
                PhoneVerified = true,
                IdentityDocumentVerified = true,
                FaceVerified = true,
                CompletedAt = DateTime.UtcNow
            }
        };

        var createResult = await userManager.CreateAsync(user, DemoPassword);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create demo user {email}: {errors}");
        }

        var roleResult = await userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            var errors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to assign role {role} to {email}: {errors}");
        }

        Log.Information("Seeded demo user {Email} with role {Role}", email, role);
        return user;
    }

    // ---- 3) Business ideas (owned by demo creator) ----

    private static async Task<List<BusinessIdeas>> SeedBusinessIdeasAsync(IServiceProvider services, ApplicationUser creator)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var existing = await dbContext.BusinessIdeas.CountDocumentsAsync(FilterDefinition<BusinessIdeas>.Empty);
        if (existing > 0)
        {
            Log.Information("BusinessIdeas already populated ({Count}) - seed skipped", existing);
            // Return what the demo creator owns so downstream steps still
            // get a coherent set (or an empty list if the existing rows
            // belong to someone else - investments step will then no-op).
            var ownIdeas = await dbContext.BusinessIdeas
                .Find(i => i.CreatorId == creator.Id.ToString())
                .ToListAsync();
            return ownIdeas;
        }

        var seedPath = Path.Combine(AppContext.BaseDirectory, "Configuration", "SeedData", "business-ideas.json");
        if (!File.Exists(seedPath))
        {
            Log.Warning("Business-ideas seed file not found at {Path}", seedPath);
            return new List<BusinessIdeas>();
        }

        var json = await File.ReadAllTextAsync(seedPath);
        var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var ideas = JsonSerializer.Deserialize<List<BusinessIdeas>>(json, jsonOpts);

        if (ideas == null || ideas.Count == 0)
        {
            Log.Warning("Business-ideas seed file parsed to empty list");
            return new List<BusinessIdeas>();
        }

        var creatorId = creator.Id.ToString();
        var now = DateTime.UtcNow;
        foreach (var idea in ideas)
        {
            idea.Id = ObjectId.GenerateNewId().ToString();
            idea.CreatorId = creatorId;
            idea.CreatedAt = now;
            idea.UpdatedAt = now;
            idea.Milestones ??= new List<Milestone>();
            idea.InvestmentRounds ??= new List<InvestmentRound>();
            idea.ImageVideo ??= new List<string>();
            idea.DocumentUrls ??= new List<string>();
        }

        await dbContext.BusinessIdeas.InsertManyAsync(ideas);
        Log.Information("Seeded {Count} demo business idea(s) for creator {Email}", ideas.Count, creator.Email);
        return ideas;
    }

    // ---- 4) Investments (linking demo investor to demo ideas) ----

    private static async Task SeedInvestmentsAsync(IServiceProvider services, ApplicationUser investor, List<BusinessIdeas> ideas)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var existing = await dbContext.Investments.CountDocumentsAsync(FilterDefinition<Investments>.Empty);
        if (existing > 0)
        {
            Log.Information("Investments already populated ({Count}) - seed skipped", existing);
            return;
        }

        if (ideas.Count == 0)
        {
            Log.Information("No demo ideas available to invest in - investments step skipped");
            return;
        }

        // Invest in up to the first 3 ideas at 20% of the asked amount each.
        var target = ideas.Take(3).ToList();
        var now = DateTime.UtcNow;
        var docs = new List<Investments>();

        for (var i = 0; i < target.Count; i++)
        {
            var idea = target[i];
            var amount = Math.Round(idea.FundingRequired * 0.2m, 2);
            var equity = Math.Round(idea.EquityOffered * 0.2, 4);
            var createdAt = now.AddDays(-30 * (target.Count - i)); // 90/60/30 days ago

            docs.Add(new Investments
            {
                Id = ObjectId.GenerateNewId().ToString(),
                RoundId = ObjectId.GenerateNewId().ToString(),
                IdeaId = idea.Id,
                ideaName = idea.Name,
                InvestorId = investor.Id,
                InvestorName = investor.Name ?? "Demo Investor",
                RoundName = "Seed",
                Amount = amount,
                EquityPercentage = equity,
                Status = "Escrowed",
                CreatedAt = createdAt
            });
        }

        await dbContext.Investments.InsertManyAsync(docs);
        Log.Information("Seeded {Count} demo investment(s) for investor {Email}", docs.Count, investor.Email);
    }

    // ---- 5) Demo entrepreneur (Companies owner for investor demo) ----

    private static async Task<ApplicationUser> SeedDemoEntrepreneurAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        return await GetOrCreateDemoUserAsync(
            userManager, roleManager,
            email: DemoEntrepreneurEmail,
            name: "Demo Entrepreneur",
            role: "Entrepreneur");
    }

    // ---- 6) Demo companies (one per pipeline column for the investor view) ----

    private static async Task<List<Companies>> SeedDemoCompaniesAsync(IServiceProvider services, ApplicationUser entrepreneur)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var existing = await dbContext.Companies.CountDocumentsAsync(FilterDefinition<Companies>.Empty);
        if (existing > 0)
        {
            Log.Information("Companies already populated ({Count}) - seed skipped", existing);
            var owned = await dbContext.Companies
                .Find(c => c.OwnerId == entrepreneur.Id.ToString())
                .ToListAsync();

            // Self-heal demo DBs seeded before the phase fix: Investor Deal
            // Discovery requires CurrentPhase >= 8, so bump any demo company
            // still parked below 8 up to 8. Idempotent — once at 8 this no-ops.
            var stale = owned.Where(c => c.CurrentPhase < 8).ToList();
            foreach (var c in stale)
            {
                var bump = Builders<Companies>.Update
                    .Set(x => x.CurrentPhase, 8)
                    .Set(x => x.CompletedPhases, new List<int> { 1, 2, 3, 4, 5, 6, 7 })
                    .Set(x => x.UpdatedAt, DateTime.UtcNow);
                await dbContext.Companies.UpdateOneAsync(x => x.Id == c.Id, bump);
                c.CurrentPhase = 8;
            }
            if (stale.Count > 0)
                Log.Information("Backfilled {Count} demo company(s) to CurrentPhase 8 for discovery", stale.Count);

            return owned;
        }

        var seedPath = Path.Combine(AppContext.BaseDirectory, "Configuration", "SeedData", "companies.json");
        if (!File.Exists(seedPath))
        {
            Log.Warning("Companies seed file not found at {Path}", seedPath);
            return new List<Companies>();
        }

        var json = await File.ReadAllTextAsync(seedPath);
        var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var seeds = JsonSerializer.Deserialize<List<CompanySeedRecord>>(json, jsonOpts);
        if (seeds == null || seeds.Count == 0)
        {
            Log.Warning("Companies seed file parsed to empty list");
            return new List<Companies>();
        }

        var ownerId = entrepreneur.Id.ToString();
        var now = DateTime.UtcNow;
        var docs = new List<Companies>();
        foreach (var s in seeds)
        {
            docs.Add(new Companies
            {
                Id = ObjectId.GenerateNewId().ToString(),
                OwnerId = ownerId,
                CompanyName = s.CompanyName,
                Industry = s.Industry,
                Tagline = s.Tagline,
                Country = s.Country,
                // Investor Deal Discovery filters on CurrentPhase >= 8
                // (InvestorPhaseController.GetDealDiscovery). Seeding at 8 makes
                // the demo companies discoverable; anything lower leaves the
                // investor discovery view empty.
                CurrentPhase = 8,
                CompletedPhases = new List<int> { 1, 2, 3, 4, 5, 6, 7 },
                TrustScore = s.TrustScore,
                IsInvestorReady = s.IsInvestorReady,
                InvestorReadyBadgeAwardedAt = s.IsInvestorReady ? now.AddDays(-7) : null,
                VerificationStatus = "verified",
                VerifiedBadge = true,
                FundingRoundType = s.FundingRoundType,
                FundingAskAmount = s.FundingAskAmount,
                EquityOfferedPercent = s.EquityOfferedPercent,
                PreMoneyValuation = s.PreMoneyValuation,
                Valuation = s.Valuation,
                ShareType = s.ShareType,
                MarketSizeEstimate = s.MarketSizeEstimate,
                GrowthPotentialScore = s.GrowthPotentialScore,
                FundingNarrative = s.FundingNarrative,
                EsopPoolPercent = s.EsopPoolPercent,
                TotalShares = s.TotalShares,
                EquityStructure = new List<EquityEntryDto>
                {
                    new() { StakeholderName = "Founder & CEO", Type = "founder", SharesOwned = 600000 },
                    new() { StakeholderName = "Co-Founder", Type = "founder", SharesOwned = 250000 },
                    new() { StakeholderName = "ESOP Pool", Type = "esop", SharesOwned = 100000 },
                },
                CreatedAt = now.AddDays(-60),
                UpdatedAt = now,
            });
        }

        await dbContext.Companies.InsertManyAsync(docs);
        Log.Information("Seeded {Count} demo company(s) for entrepreneur {Email}", docs.Count, entrepreneur.Email);
        return docs;
    }

    // ---- 7) InvestorMatches (link demo investor to demo companies, one per column) ----

    private static async Task SeedInvestorMatchesAsync(IServiceProvider services, ApplicationUser investorUser, List<Companies> companies)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var existing = await dbContext.InvestorMatches.CountDocumentsAsync(FilterDefinition<InvestorMatch>.Empty);
        if (existing > 0)
        {
            Log.Information("InvestorMatches already populated ({Count}) - seed skipped", existing);
            return;
        }

        if (companies.Count == 0) return;

        var investorId = investorUser.InvestorProfile?.InvestorId;
        if (string.IsNullOrEmpty(investorId))
        {
            Log.Warning("Demo investor has no InvestorProfile.InvestorId - match seeding skipped");
            return;
        }

        var seedPath = Path.Combine(AppContext.BaseDirectory, "Configuration", "SeedData", "companies.json");
        var json = await File.ReadAllTextAsync(seedPath);
        var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var seeds = JsonSerializer.Deserialize<List<CompanySeedRecord>>(json, jsonOpts) ?? new();
        var seedsByName = seeds.ToDictionary(s => s.CompanyName);

        var now = DateTime.UtcNow;
        var docs = new List<InvestorMatch>();
        for (var i = 0; i < companies.Count; i++)
        {
            var co = companies[i];
            if (!seedsByName.TryGetValue(co.CompanyName, out var s)) continue;
            docs.Add(new InvestorMatch
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = co.Id,
                InvestorId = investorId,
                MatchScore = s.MatchScore,
                Status = s.MatchStatus,
                MatchedAt = now.AddHours(-i * 3),
                LastInteractionAt = now.AddHours(-i),
                UpdatedAt = now,
                MatchRationale = $"Sector fit {s.MatchScore}; stage {co.FundingRoundType}; geography {co.Country}.",
                EngineVersion = "rule_based_v1",
                InvestorNameSnapshot = investorUser.Name ?? "Demo Investor",
                InvestorTypeSnapshot = "angel",
                InvestmentRangeSnapshot = "EUR 50K - 750K",
                PreferredSectorsSnapshot = new List<string> { "FinTech", "ClimaTech", "HealthTech" },
            });
        }

        if (docs.Count > 0)
        {
            await dbContext.InvestorMatches.InsertManyAsync(docs);
            Log.Information("Seeded {Count} demo investor match(es) for investor {Email}", docs.Count, investorUser.Email);
        }
    }

    // ---- 8) NDA acceptances (3 of 5 companies) ----

    private static async Task SeedNdaAcceptancesAsync(IServiceProvider services, ApplicationUser investorUser, List<Companies> companies)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var existing = await dbContext.Phase6NdaAcceptances.CountDocumentsAsync(FilterDefinition<Phase6NdaAcceptance>.Empty);
        if (existing > 0)
        {
            Log.Information("Phase6NdaAcceptances already populated ({Count}) - seed skipped", existing);
            return;
        }

        var investorId = investorUser.InvestorProfile?.InvestorId;
        if (string.IsNullOrEmpty(investorId)) return;

        var targets = new[] { "Helio Solar", "Veris Health", "Rousseau Technologies SAS" };
        var ndaTextHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(DemoNdaText)));

        var now = DateTime.UtcNow;
        var docs = new List<Phase6NdaAcceptance>();
        foreach (var name in targets)
        {
            var co = companies.FirstOrDefault(c => c.CompanyName == name);
            if (co == null) continue;
            docs.Add(new Phase6NdaAcceptance
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = co.Id,
                InvestorId = investorId,
                AcceptedAt = now.AddDays(-3),
                NdaTextHash = ndaTextHash,
                IpHash = "DEMO_SEED",
            });
        }

        if (docs.Count > 0)
        {
            await dbContext.Phase6NdaAcceptances.InsertManyAsync(docs);
            Log.Information("Seeded {Count} demo NDA acceptance(s)", docs.Count);
        }
    }

    // ---- 9) Data room documents on Rousseau ----

    private static async Task SeedDataRoomDocsAsync(IServiceProvider services, List<Companies> companies)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var rousseau = companies.FirstOrDefault(c => c.CompanyName == "Rousseau Technologies SAS");
        if (rousseau == null) return;

        // Ensure a real, downloadable PDF exists on disk for the demo
        // "Pitch Deck v3" document so the investor demo flow can perform
        // an end-to-end download. Other seeded docs stay metadata-only.
        var demoPdfPath = EnsureDemoPitchPdf();
        var demoPdfSize = new FileInfo(demoPdfPath).Length;

        // Backfill: if docs were previously seeded with empty StoragePath,
        // upgrade the Pitch Deck row in place so existing dev DBs are fixed
        // without requiring a destructive re-seed.
        if (rousseau.DataRoomDocuments != null && rousseau.DataRoomDocuments.Count > 0)
        {
            var pitch = rousseau.DataRoomDocuments.FirstOrDefault(d => d.Title == "Pitch Deck v3");
            if (pitch != null && string.IsNullOrWhiteSpace(pitch.StoragePath))
            {
                pitch.StoragePath = demoPdfPath;
                pitch.FileSize = demoPdfSize;
                var upd = Builders<Companies>.Update.Set(c => c.DataRoomDocuments, rousseau.DataRoomDocuments);
                await dbContext.Companies.UpdateOneAsync(c => c.Id == rousseau.Id, upd);
                Log.Information("Backfilled Pitch Deck v3 StoragePath on Rousseau ({Path})", demoPdfPath);
            }
            else
            {
                Log.Information("Rousseau already has data-room docs ({Count}) - seed skipped", rousseau.DataRoomDocuments.Count);
            }
            return;
        }

        var docs = new (string Title, string Category, string FileName, string Mime, long Size, string Path)[]
        {
            ("Pitch Deck v3", "business", "pitch-v3.pdf", "application/pdf", demoPdfSize, demoPdfPath),
            ("Financial Model 2025-26", "financial", "fin-model.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 524288, ""),
            ("Cap Table — details", "financial", "cap-table.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 131072, ""),
            ("Articles of Incorporation", "legal", "articles.pdf", "application/pdf", 262144, ""),
            ("Customer LOIs (3)", "business", "lois.pdf", "application/pdf", 1048576, ""),
        };

        var now = DateTime.UtcNow;
        var responses = docs.Select(d => new DataRoomDocumentResponse
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            Title = d.Title,
            Category = d.Category,
            Status = "published",
            UploadedAt = now.AddDays(-2),
            ViewCount = 0,
            DownloadCount = 0,
            FileName = d.FileName,
            MimeType = d.Mime,
            FileSize = d.Size,
            StoragePath = d.Path, // Pitch Deck v3 points to a real file; others stay metadata-only for MVP.
            UploadedBy = rousseau.OwnerId,
        }).ToList();

        var update = Builders<Companies>.Update
            .Set(c => c.DataRoomDocuments, responses)
            .Set(c => c.IsDataRoomLive, true)
            .Set(c => c.IsDataRoomNdaRequired, true)
            .Set(c => c.UpdatedAt, now);
        await dbContext.Companies.UpdateOneAsync(c => c.Id == rousseau.Id, update);
        // Reflect in the in-memory company too so later seed steps see them.
        rousseau.DataRoomDocuments = responses;
        rousseau.IsDataRoomLive = true;
        rousseau.IsDataRoomNdaRequired = true;
        Log.Information("Seeded {Count} data-room document(s) on company {Name}", responses.Count, rousseau.CompanyName);
    }

    // Writes a minimal valid PDF to disk the first time it's needed and returns
    // its absolute path. Idempotent — subsequent calls just return the path.
    private static string EnsureDemoPitchPdf()
    {
        var dir = Path.Combine(AppContext.BaseDirectory, "Configuration", "SeedData");
        Directory.CreateDirectory(dir);
        var pdfPath = Path.Combine(dir, "demo-pitch.pdf");
        if (!File.Exists(pdfPath))
        {
            File.WriteAllBytes(pdfPath, BuildMinimalDemoPdf());
        }
        return pdfPath;
    }

    private static byte[] BuildMinimalDemoPdf()
    {
        // Hand-built minimal PDF 1.4 with one blank Letter-sized page.
        // Offsets are computed from the body so the xref table stays consistent.
        const string header = "%PDF-1.4\n";
        const string obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
        const string obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
        const string obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n";

        int pos1 = header.Length;
        int pos2 = pos1 + obj1.Length;
        int pos3 = pos2 + obj2.Length;
        int xrefPos = pos3 + obj3.Length;

        var xref = new System.Text.StringBuilder();
        xref.Append("xref\n");
        xref.Append("0 4\n");
        xref.Append("0000000000 65535 f \n");
        xref.Append($"{pos1:D10} 00000 n \n");
        xref.Append($"{pos2:D10} 00000 n \n");
        xref.Append($"{pos3:D10} 00000 n \n");
        xref.Append("trailer\n<< /Size 4 /Root 1 0 R >>\n");
        xref.Append("startxref\n");
        xref.Append(xrefPos);
        xref.Append("\n%%EOF\n");

        return System.Text.Encoding.ASCII.GetBytes(header + obj1 + obj2 + obj3 + xref);
    }

    // ---- 10) Access logs (view/download events on Rousseau + Veris) ----

    private static async Task SeedAccessLogsAsync(IServiceProvider services, ApplicationUser investorUser, List<Companies> companies)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var existing = await dbContext.Phase6AccessLogs.CountDocumentsAsync(FilterDefinition<Phase6AccessLog>.Empty);
        if (existing > 0)
        {
            Log.Information("Phase6AccessLogs already populated ({Count}) - seed skipped", existing);
            return;
        }

        var investorId = investorUser.InvestorProfile?.InvestorId;
        if (string.IsNullOrEmpty(investorId)) return;

        var rousseau = companies.FirstOrDefault(c => c.CompanyName == "Rousseau Technologies SAS");
        var veris = companies.FirstOrDefault(c => c.CompanyName == "Veris Health");
        if (rousseau == null) return;

        var now = DateTime.UtcNow;
        var logs = new List<Phase6AccessLog>();

        // Rousseau: 2 distinct documents viewed, 1 downloaded, 1 extra view event.
        var pitchDoc = rousseau.DataRoomDocuments?.FirstOrDefault(d => d.Title == "Pitch Deck v3");
        var finDoc = rousseau.DataRoomDocuments?.FirstOrDefault(d => d.Title == "Financial Model 2025-26");
        if (pitchDoc != null)
        {
            logs.Add(NewAccessLog(rousseau.Id, pitchDoc.DocumentId, investorId, "view", now.AddHours(-22)));
            logs.Add(NewAccessLog(rousseau.Id, pitchDoc.DocumentId, investorId, "download", now.AddHours(-21)));
            logs.Add(NewAccessLog(rousseau.Id, pitchDoc.DocumentId, investorId, "view", now.AddHours(-3)));
        }
        if (finDoc != null)
        {
            logs.Add(NewAccessLog(rousseau.Id, finDoc.DocumentId, investorId, "view", now.AddHours(-2)));
        }

        // Veris: 1 view event with a synthetic document id so the dataRoom
        // pipeline column populates without seeding a separate doc set.
        if (veris != null)
        {
            logs.Add(NewAccessLog(veris.Id, ObjectId.GenerateNewId().ToString(), investorId, "view", now.AddHours(-12)));
        }

        if (logs.Count > 0)
        {
            await dbContext.Phase6AccessLogs.InsertManyAsync(logs);
            Log.Information("Seeded {Count} demo data-room access log(s)", logs.Count);
        }
    }

    private static Phase6AccessLog NewAccessLog(string companyId, string documentId, string investorId, string eventType, DateTime occurredAt)
        => new()
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            DocumentId = documentId,
            InvestorId = investorId,
            EventType = eventType,
            OccurredAt = occurredAt,
            IpHash = "DEMO_SEED",
        };

    // ---- 11) DealExecution draft term sheet on Rousseau ----

    private static async Task SeedDealExecutionAsync(IServiceProvider services, ApplicationUser investorUser, List<Companies> companies)
    {
        var dbContext = services.GetRequiredService<MongoDbContext>();

        var existing = await dbContext.DealExecutions.CountDocumentsAsync(FilterDefinition<DealExecution>.Empty);
        if (existing > 0)
        {
            Log.Information("DealExecutions already populated ({Count}) - seed skipped", existing);
            return;
        }

        var investorId = investorUser.InvestorProfile?.InvestorId;
        if (string.IsNullOrEmpty(investorId)) return;

        var rousseau = companies.FirstOrDefault(c => c.CompanyName == "Rousseau Technologies SAS");
        if (rousseau == null) return;

        var now = DateTime.UtcNow;
        var deal = new DealExecution
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = rousseau.Id,
            Status = "initiated",
            Investors = new List<DealParticipant>
            {
                new()
                {
                    InvestorId = investorId,
                    InvestorName = investorUser.Name ?? "Demo Investor",
                    CommittedAmount = 450000,
                    Status = "interested",
                    EquityPercentage = 15.78,
                    JoinedAt = now.AddDays(-1),
                }
            },
            TermSheet = new TermSheet
            {
                TotalRaiseAmount = 450000,
                PreMoneyValuation = 2400000,
                PostMoneyValuation = 2850000,
                EquityType = "preferred",
                InvestorEquityPercent = 15.78,
                ProRataRights = true,
                LiquidationPreference = "1x_non_participating",
                BoardSeats = 1,
                AntiDilutionProtection = "broad_based",
                VestingYears = 4,
                CliffMonths = 12,
                InvestorRights = new List<string> { "information_rights", "voting_rights", "rofr" },
                InfoRightsTermination = true,
                ProposedClosingDate = now.AddDays(30),
                Status = "draft",
            },
            DueDiligenceChecklist = new List<DueDigligenceItem>
            {
                new() { ItemName = "Legal entity check", Category = "legal", Status = "completed" },
                new() { ItemName = "Cap table verification", Category = "financial", Status = "completed" },
                new() { ItemName = "Customer references", Category = "business", Status = "in_progress" },
                new() { ItemName = "Tech architecture review", Category = "technical", Status = "pending" },
            },
            InvestorNameSnapshot = investorUser.Name ?? "Demo Investor",
            InvestorTypeSnapshot = "angel",
            CreatedByUserId = investorUser.Id.ToString(),
            CreatedAt = now.AddDays(-1),
            UpdatedAt = now,
        };

        await dbContext.DealExecutions.InsertOneAsync(deal);
        Log.Information("Seeded demo deal execution for company {Name}", rousseau.CompanyName);
    }

    // ---- 11b) Demo admin (login + admin-route access for the demo) ----

    // Creates the demo Admin account. GetOrCreateDemoUserAsync already sets
    // EmailConfirmed=true, a completed universal Phase-1 onboarding state, and
    // the DemoP@ss1 password, so the account can log in and reach admin routes
    // immediately. No dashboard features are seeded — account creation only.
    private static async Task<ApplicationUser> SeedDemoAdminAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        return await GetOrCreateDemoUserAsync(
            userManager, roleManager,
            email: DemoAdminEmail,
            name: "Demo Admin",
            role: "Admin");
    }

    // ---- 12) Demo service provider (counterpart for entrepreneur↔provider chat) ----

    private static async Task<ApplicationUser> SeedDemoServiceProviderAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        var provider = await GetOrCreateDemoUserAsync(
            userManager, roleManager,
            email: DemoServiceProviderEmail,
            name: "Demo Service Provider",
            role: "ServiceProvider");

        // P1-3: seed an explicit moderation/re-review example so the admin
        // queue (GetPendingVerificationsAsync filters on UnderReview), public
        // provider profile, and trust score are all demonstrable. Normal first
        // submissions now auto-verify and do not populate this queue.
        // Idempotent: only (re)seed while the profile is absent or still
        // Pending; an already-UnderReview/Verified/Rejected profile is left as
        // the admin (or a prior run) set it.
        var profile = provider.ServiceProviderProfile;
        if (profile == null || profile.VerificationStatus == ServiceProviderVerificationStatus.Pending)
        {
            var now = DateTime.UtcNow;
            provider.ServiceProviderProfile = new ServiceProviderProfile
            {
                ProviderId = provider.Id.ToString(),
                CurrentPhase = 2,
                VerificationStatus = ServiceProviderVerificationStatus.UnderReview,
                VerificationSubmittedAt = now.AddDays(-2),
                TrustScore = 72,
                Headline = "Fractional CFO & Fundraising Advisor",
                Bio = "Ex-Big-4 finance lead helping early-stage founders close seed and Series A rounds — term sheets, cap tables, and financial models.",
                Skills = new List<string> { "Financial Modeling", "Term Sheet Review", "Cap Table", "Fundraising" },
                ServiceCategories = new List<ServiceCategory>
                {
                    ServiceCategory.Finance,
                    ServiceCategory.FundraisingSupport,
                    ServiceCategory.DueDiligence,
                },
                Industries = new List<string> { "SaaS", "ClimaTech", "HealthTech" },
                Languages = new List<string> { "English", "French" },
                PricingModels = new List<PricingModel> { PricingModel.FixedPrice, PricingModel.Hourly },
                CreatedAt = now.AddDays(-5),
                UpdatedAt = now.AddDays(-2),
            };
            await userManager.UpdateAsync(provider);
            Log.Information("Seeded demo service-provider verification state (UnderReview) for {Email}", provider.Email);
        }
        else
        {
            Log.Information("Demo service-provider already has verification state ({Status}) - seed skipped",
                profile.VerificationStatus);
        }

        // SP data split: run the real idempotent migrator so the demo provider
        // exists in the split collections (admin queue and matching read them).
        // Re-runs converge; already-migrated records are never overwritten.
        try
        {
            var splitMigrator = services
                .GetRequiredService<WebApp.Services.Migrations.IServiceProviderProfileSplitMigration>();
            await splitMigrator.EnsureMigratedAsync(provider);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Demo service-provider split migration failed (non-fatal; dual-read covers it).");
        }

        return provider;
    }

    // ---- 13) Demo AI credits (so the Creator AI Studio runs end-to-end) ----

    // Grants each demo user a starter AICredits ledger via the SAME idempotent
    // upsert used by the production starter-credit seeder. No bypass, no
    // hardcoded exemption — debits still flow through AiCreditService normally;
    // these users simply start with a real balance. Safe to re-run: an existing
    // ledger is never touched (TryGrantInitialAsync only inserts).
    private static async Task SeedDemoAiCreditsAsync(
        IServiceProvider services,
        params ApplicationUser[] users)
    {
        var credits = services.GetRequiredService<AiCreditLedgerRepository>();

        var granted = 0;
        foreach (var user in users)
        {
            if (await credits.TryGrantInitialAsync(user.Id.ToString(), DemoAiCredits))
                granted++;
        }

        if (granted > 0)
            Log.Information("Seeded {Count} demo AI credit ledger(s) ({Amount} each)", granted, DemoAiCredits);
        else
            Log.Information("Demo AI credit ledgers already present - seed skipped");
    }

    // ---- 14) Demo conversations (realistic inbox threads for the demo) ----

    // Seeds three Direct conversations with backdated messages so the inbox is
    // populated at boot. Writes straight to the Conversations / ChatMessages
    // collections (the same ones MessagesRepository/ConversationRepository use)
    // so messages render and unread counts compute exactly as live chat would.
    // The final message in each thread is left unread for its recipient so the
    // notification bell / unread badge has something to show.
    private static async Task SeedDemoConversationsAsync(
        IServiceProvider services,
        ApplicationUser creator,
        ApplicationUser investor,
        ApplicationUser entrepreneur,
        ApplicationUser serviceProvider)
    {
        var database = services.GetRequiredService<IMongoDatabase>();
        var conversations = database.GetCollection<Conversation>("Conversations");
        var messages = database.GetCollection<ChatMessage>("ChatMessages");

        var existing = await conversations.CountDocumentsAsync(FilterDefinition<Conversation>.Empty);
        if (existing > 0)
        {
            Log.Information("Conversations already populated ({Count}) - seed skipped", existing);
            return;
        }

        var now = DateTime.UtcNow;

        // Creator ↔ Investor — interest in a seeded idea, ends investor-side (unread for creator).
        await SeedConversationAsync(conversations, messages, creator, investor, now.AddDays(-2), new (Guid, string)[]
        {
            (investor.Id, "Hi! I came across GridPulse on the platform — really impressive concept. Would love to learn more about your traction."),
            (creator.Id, "Thanks so much! We're piloting with two municipal grids and seeing an 18% peak-load reduction. Happy to share the deck."),
            (investor.Id, "That's compelling. Could you send the latest business plan and forecast? Keen to understand your funding ask."),
            (creator.Id, "Just generated an updated plan in AI Studio — sending it over now. We're raising €500K at seed."),
            (investor.Id, "Perfect, I'll review it today. Let's set up a call this week."),
        });

        // Entrepreneur ↔ Investor — live deal on Rousseau, ends entrepreneur-side (unread for investor).
        await SeedConversationAsync(conversations, messages, entrepreneur, investor, now.AddDays(-1).AddHours(-6), new (Guid, string)[]
        {
            (investor.Id, "I've signed the NDA and reviewed the Rousseau data room — the pitch deck and financials look solid."),
            (entrepreneur.Id, "Great to hear! Happy to answer any questions on the cap table or the customer LOIs."),
            (investor.Id, "The term sheet draft looks fair. I'm comfortable committing €450K at the €2.4M pre-money."),
            (entrepreneur.Id, "Fantastic — that works for us. I'll have our counsel confirm the closing timeline and revert shortly."),
        });

        // Entrepreneur ↔ Service Provider — advisory engagement, ends provider-side (unread for entrepreneur).
        await SeedConversationAsync(conversations, messages, entrepreneur, serviceProvider, now.AddHours(-20), new (Guid, string)[]
        {
            (entrepreneur.Id, "Hi — we're closing a seed round and need help reviewing our term sheet and cap table. Are you available?"),
            (serviceProvider.Id, "Absolutely, that's right in our wheelhouse. We offer fixed-fee term sheet reviews for early-stage founders."),
            (entrepreneur.Id, "Perfect. The round is €450K at €2.4M pre-money, preferred shares. Can you turn it around this week?"),
            (serviceProvider.Id, "Yes — send the draft over and we'll have comments back within 48 hours."),
        });

        Log.Information("Seeded 3 demo conversation(s) with messages");
    }

    // Inserts one Direct conversation and its messages. All but the last message
    // are marked read; the last stays unread so its recipient sees an unread
    // badge. Timestamps step forward 30 min from startedAt to read naturally.
    private static async Task SeedConversationAsync(
        IMongoCollection<Conversation> conversations,
        IMongoCollection<ChatMessage> messages,
        ApplicationUser a,
        ApplicationUser b,
        DateTime startedAt,
        (Guid SenderId, string Message)[] script)
    {
        var conversation = new Conversation
        {
            Id = ObjectId.GenerateNewId(),
            Participants = new List<Guid> { a.Id, b.Id },
            Type = "Direct",
            CreatedAt = startedAt,
        };
        await conversations.InsertOneAsync(conversation);

        var docs = new List<ChatMessage>();
        for (var i = 0; i < script.Length; i++)
        {
            var isLast = i == script.Length - 1;
            docs.Add(new ChatMessage
            {
                Id = ObjectId.GenerateNewId(),
                ConversationId = conversation.Id,
                SenderId = script[i].SenderId,
                Message = script[i].Message,
                MessageType = "Text",
                IsRead = !isLast, // leave the final message unread for its recipient
                CreatedAt = startedAt.AddMinutes(30 * i),
            });
        }
        await messages.InsertManyAsync(docs);

        var last = docs[^1];
        var update = Builders<Conversation>.Update
            .Set(c => c.LastMessage, last.Message)
            .Set(c => c.LastMessageAt, last.CreatedAt);
        await conversations.UpdateOneAsync(c => c.Id == conversation.Id, update);
    }

    /// <summary>
    /// Lightweight record matching companies.json shape. Lives here (private)
    /// so the seed file stays readable without polluting public DTOs.
    /// </summary>
    private class CompanySeedRecord
    {
        public string CompanyName { get; set; }
        public string Industry { get; set; }
        public string Tagline { get; set; }
        public string Country { get; set; }
        public string FundingRoundType { get; set; }
        public double FundingAskAmount { get; set; }
        public double EquityOfferedPercent { get; set; }
        public double PreMoneyValuation { get; set; }
        public double Valuation { get; set; }
        public string ShareType { get; set; }
        public int TrustScore { get; set; }
        public bool IsInvestorReady { get; set; }
        public double MarketSizeEstimate { get; set; }
        public double GrowthPotentialScore { get; set; }
        public string FundingNarrative { get; set; }
        public double EsopPoolPercent { get; set; }
        public int TotalShares { get; set; }
        public string PipelineColumn { get; set; }
        public int MatchScore { get; set; }
        public string MatchStatus { get; set; }
    }
}
