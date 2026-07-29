using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Audit;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// Empirically proves the four-step editor's final submit is atomic across the
/// three SP split collections against a REAL single-node replica set
/// (Mongo:TransactionsEnabled=true): a fault injected on the LAST in-transaction
/// write (the version-conditional professional publish) must leave the
/// ServiceProviderProfiles and UserCredentials writes rolled back, the draft
/// intact, and ProfileVersion unincremented; a clean retry then fully succeeds.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable.
/// </summary>
public class ProfileEditorTransactionIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public ProfileEditorTransactionIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;

    private static SubmitProfileEditorRequest SubmitRequest(int version) => new()
    {
        BasedOnVersion = version,
        Draft = new ProfileDraftRequest
        {
            BasedOnVersion = version,
            LastStep = 4,
            Headline = "Transactional headline",
            Bio = "Bio",
            Skills = new() { "Modeling" },
            ServiceCategories = new() { "Finance" },
        },
    };

    private async Task<(ApplicationUser User, MongoDbContext Db, UserManager<ApplicationUser> Users)> SeedProviderAsync()
    {
        using var scope = Sp.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = Sp.GetRequiredService<MongoDbContext>();

        var user = new ApplicationUser
        {
            UserName = $"sp-txn-{Guid.NewGuid():N}@example.com",
            Email = $"sp-txn-{Guid.NewGuid():N}@example.com",
            Name = "Txn Provider",
            User = "ServiceProvider",
            ServiceProviderProfile = new ServiceProviderProfile
            {
                ProviderId = "txn-provider",
                Headline = "Original headline",
                Skills = new() { "Modeling" },
                ServiceCategories = new() { ServiceCategory.Finance },
            },
        };
        (await users.CreateAsync(user, "Str0ng!Passw0rd")).Succeeded.Should().BeTrue();
        return (user, db, users);
    }

    private ProfileEditorService Editor(
        UserManager<ApplicationUser> users,
        MongoDbContext db,
        IProfessionalProfileStore? professionalOverride = null)
    {
        var professional = professionalOverride ?? new ProfessionalProfileStore(db);
        var sp = new ServiceProviderProfileStore(db);
        var credentials = new UserCredentialStore(db);
        var migrator = new ServiceProviderProfileSplitMigration(
            users, professional, sp, credentials,
            NullLogger<ServiceProviderProfileSplitMigration>.Instance);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Mongo:TransactionsEnabled"] = "true" })
            .Build();
        return new ProfileEditorService(
            users, professional, sp, credentials, migrator,
            Sp.GetRequiredService<IMongoClient>(), configuration,
            new SaveFile(), Mock.Of<IFileSecurityScanner>(), Mock.Of<IAuditLogger>(),
            NullLogger<ProfileEditorService>.Instance);
    }

    /// <summary>Fails the version-conditional publish (the transaction's last write).</summary>
    private sealed class FaultingProfessionalStore(MongoDbContext db) : IProfessionalProfileStore
    {
        private readonly ProfessionalProfileStore _inner = new(db);
        public Task<ProfessionalProfileRecord?> GetByUserIdAsync(string userId, CancellationToken ct = default) => _inner.GetByUserIdAsync(userId, ct);
        public Task<Dictionary<string, ProfessionalProfileRecord>> GetByUserIdsAsync(IEnumerable<string> ids, CancellationToken ct = default) => _inner.GetByUserIdsAsync(ids, ct);
        public Task<bool> UpsertAsync(ProfessionalProfileRecord record, IClientSessionHandle? session = null, CancellationToken ct = default) => _inner.UpsertAsync(record, session, ct);
        public Task<bool> SetEditorDraftAsync(string userId, ProfessionalProfileDraft? draft, CancellationToken ct = default) => _inner.SetEditorDraftAsync(userId, draft, ct);
        public Task<bool> ReplacePublishedIfVersionAsync(ProfessionalProfileRecord record, int expectedVersion, IClientSessionHandle? session = null, CancellationToken ct = default) =>
            throw new InvalidOperationException("injected mid-transaction failure (professional publish)");
    }

    [SkippableFact]
    public async Task Successful_submit_publishes_all_three_collections_and_clears_the_draft()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var (user, db, users) = await SeedProviderAsync();
        var editor = Editor(users, db);
        var userId = user.Id.ToString();

        // Seed a documented Draft credential so the submit promotes it in-transaction.
        var credentialStore = new UserCredentialStore(db);
        await credentialStore.UpsertAsync(new UserCredentialRecord
        {
            UserId = userId,
            Title = "Cert",
            Status = CredentialStatus.Draft,
            Document = new ProviderMediaAsset { PublicUrl = "/uploads/service-provider/credentials/c.pdf" },
        });

        var result = await editor.SubmitAsync(userId, SubmitRequest(0));

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        var professional = await new ProfessionalProfileStore(db).GetByUserIdAsync(userId);
        professional!.Headline.Should().Be("Transactional headline");
        professional.ProfileVersion.Should().Be(1); // exactly once
        professional.EditorDraft.Should().BeNull();
        (await new ServiceProviderProfileStore(db).GetByUserIdAsync(userId))!
            .ServiceCategories.Should().Equal(ServiceCategory.Finance);
        (await credentialStore.GetByUserIdAsync(userId)).Single().Status.Should().Be(CredentialStatus.PendingReview);
    }

    [SkippableFact]
    public async Task Aborted_submit_rolls_back_every_collection_and_keeps_draft_and_documents()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var (user, db, users) = await SeedProviderAsync();
        var userId = user.Id.ToString();

        // Migrate + save a draft first (real stores).
        var plainEditor = Editor(users, db);
        (await plainEditor.SaveDraftAsync(userId, SubmitRequest(0).Draft)).Outcome.Should().Be(ServiceProviderOutcome.Ok);

        var credentialStore = new UserCredentialStore(db);
        await credentialStore.UpsertAsync(new UserCredentialRecord
        {
            UserId = userId,
            Title = "Cert",
            Status = CredentialStatus.Draft,
            Document = new ProviderMediaAsset { PublicUrl = "/uploads/service-provider/credentials/c.pdf" },
        });

        var faultingEditor = Editor(users, db, new FaultingProfessionalStore(db));
        var result = await faultingEditor.SubmitAsync(userId, SubmitRequest(0));

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);

        // Transaction abort: nothing published anywhere, draft intact, credential
        // still Draft with its document reference untouched.
        var professional = await new ProfessionalProfileStore(db).GetByUserIdAsync(userId);
        professional!.Headline.Should().Be("Original headline");
        professional.ProfileVersion.Should().Be(0);
        professional.EditorDraft.Should().NotBeNull();
        var credential = (await credentialStore.GetByUserIdAsync(userId)).Single();
        credential.Status.Should().Be(CredentialStatus.Draft);
        credential.Document!.PublicUrl.Should().Be("/uploads/service-provider/credentials/c.pdf");

        // A clean retry fully succeeds.
        var retry = await Editor(users, db).SubmitAsync(userId, SubmitRequest(0));
        retry.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        (await new ProfessionalProfileStore(db).GetByUserIdAsync(userId))!.ProfileVersion.Should().Be(1);
    }

    [SkippableFact]
    public async Task Stale_version_submit_aborts_without_touching_any_collection()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var (user, db, users) = await SeedProviderAsync();
        var userId = user.Id.ToString();
        var editor = Editor(users, db);

        (await editor.SubmitAsync(userId, SubmitRequest(0))).Outcome.Should().Be(ServiceProviderOutcome.Ok);

        // Same BasedOnVersion again — now stale (stored version is 1).
        var stale = await editor.SubmitAsync(userId, SubmitRequest(0));

        stale.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        (await new ProfessionalProfileStore(db).GetByUserIdAsync(userId))!.ProfileVersion.Should().Be(1);
    }
}
