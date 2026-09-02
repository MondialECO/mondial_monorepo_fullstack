using FluentAssertions;
using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Audit;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Approved SP data split: migrator idempotency + checksums, dual-read aggregate
/// reader, ProviderTier ownership, editor submit on the split stores (gated
/// non-transactional path — the transactional path runs on the replica-set
/// fixture), and the embedded-write freeze.
/// </summary>
public class ServiceProviderProfileSplitTests
{
    private readonly Mock<UserManager<ApplicationUser>> _users =
        new(Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);
    private readonly SpSplitTestHarness _harness = new();

    private ApplicationUser GivenUser(ApplicationUser user)
    {
        _users.Setup(m => m.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        return user;
    }

    private static ApplicationUser CompleteEmbeddedUser() => new()
    {
        Name = "Legacy Provider",
        ServiceProviderProfile = new ServiceProviderProfile
        {
            ProviderId = "legacy-provider",
            VerificationStatus = ServiceProviderVerificationStatus.Verified,
            VerifiedAt = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc),
            TrustScore = 72,
            Headline = "Fractional CFO",
            Bio = "Finance lead.",
            Skills = new() { "Financial Modeling" },
            ServiceCategories = new() { ServiceCategory.Finance },
            Industries = new() { "SaaS" },
            Languages = new() { "English", "French" },
            PricingModels = new() { PricingModel.Hourly },
            PortfolioItems = new() { new PortfolioItem { Id = "portfolio-1", Title = "Model" } },
            Credentials = new()
            {
                new ProviderCredential
                {
                    Id = "credential-1",
                    Title = "CFA",
                    Status = CredentialStatus.Verified,
                    ReviewedAt = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                },
            },
            ProfileVersion = 3,
            EditorDraft = new ProfessionalProfileDraft { BasedOnVersion = 3, LastStep = 2, Headline = "Draft headline" },
        },
    };

    // ---------------- Migration ----------------

    [Fact]
    public async Task Migration_copies_every_field_and_preserves_stable_ids()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        var migrator = _harness.CreateMigrator(_users.Object);

        var (professional, sp) = await migrator.EnsureMigratedAsync(user);

        professional.Headline.Should().Be("Fractional CFO");
        professional.ProfileVersion.Should().Be(3);
        professional.EditorDraft!.LastStep.Should().Be(2); // in-flight draft survives
        professional.Languages.Should().Equal("English", "French");
        sp.PortfolioItems.Single().Id.Should().Be("portfolio-1");
        sp.TrustScore.Should().Be(72);
        var credential = _harness.Credentials.Records.Values.Single();
        credential.Id.Should().Be("credential-1");
        credential.Status.Should().Be(CredentialStatus.Verified); // review status preserved
        credential.ApplicableRoles.Should().Equal(CredentialApplicableRole.ServiceProvider);
    }

    [Fact]
    public async Task Migration_is_idempotent_and_never_overwrites_migrated_records()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        var migrator = _harness.CreateMigrator(_users.Object);

        var (first, _) = await migrator.EnsureMigratedAsync(user);
        first.Headline = "Edited after migration";
        await _harness.Professional.UpsertAsync(first);

        var (second, _) = await migrator.EnsureMigratedAsync(user); // re-run

        second.Headline.Should().Be("Edited after migration"); // frozen embedded copy did not regress it
        _harness.Professional.Records.Should().HaveCount(1);
        _harness.Sp.Records.Should().HaveCount(1);
        _harness.Credentials.Records.Should().HaveCount(1); // no duplicate credentials
    }

    [Fact]
    public async Task Migration_checksum_matches_between_embedded_and_split_projections()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        var migrator = _harness.CreateMigrator(_users.Object);
        var (professional, sp) = await migrator.EnsureMigratedAsync(user);

        var legacy = ServiceProviderProfileSplitMigration.Checksum(user.ServiceProviderProfile!.ToResponse());
        var composite = ServiceProviderProfileSplitMigration.Checksum(
            SpProfileSplitMapper.ToCompositeView(
                professional, sp, await _harness.Credentials.GetByUserIdAsync(user.Id.ToString()))
            .ToResponse());

        composite.Should().Be(legacy);
    }

    [Theory]
    [InlineData(ServiceProviderVerificationStatus.Pending, ProviderTier.Tier1)]
    [InlineData(ServiceProviderVerificationStatus.UnderReview, ProviderTier.Tier1)]
    [InlineData(ServiceProviderVerificationStatus.Rejected, ProviderTier.Tier1)]
    [InlineData(ServiceProviderVerificationStatus.Verified, ProviderTier.Tier2)]
    public void Migration_derives_tier_from_verification_never_from_Tier_level(
        ServiceProviderVerificationStatus status, ProviderTier expected)
    {
        var user = new ApplicationUser
        {
            Tier_level = 4, // must be ignored — no blind copy, no fabricated Tier 3/4
            ServiceProviderProfile = new ServiceProviderProfile { VerificationStatus = status },
        };

        SpProfileSplitMapper.ToServiceProviderRecord(user).ProviderTier.Should().Be(expected);
    }

    [Fact]
    public void ServiceProviderProfileRecord_Default_Id_Is_Not_Empty()
    {
        var record = new ServiceProviderProfileRecord();
        record.Id.Should().NotBe(MongoDB.Bson.ObjectId.Empty);
    }

    [Fact]
    public async Task Two_Different_Users_Migrate_With_Distinct_Non_Empty_ObjectIds()
    {
        var userA = GivenUser(new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Name = "Provider A",
            ServiceProviderProfile = new ServiceProviderProfile { ProviderId = "prov-a" }
        });
        var userB = GivenUser(new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Name = "Provider B",
            ServiceProviderProfile = new ServiceProviderProfile { ProviderId = "prov-b" }
        });

        var migrator = _harness.CreateMigrator(_users.Object);
        var (_, spA) = await migrator.EnsureMigratedAsync(userA);
        var (_, spB) = await migrator.EnsureMigratedAsync(userB);

        spA.Id.Should().NotBe(MongoDB.Bson.ObjectId.Empty);
        spB.Id.Should().NotBe(MongoDB.Bson.ObjectId.Empty);
        spA.Id.Should().NotBe(spB.Id);
    }

    [Fact]
    public async Task Repeat_Migration_Preserves_Existing_ObjectId()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        var migrator = _harness.CreateMigrator(_users.Object);

        var (_, first) = await migrator.EnsureMigratedAsync(user);
        var initialId = first.Id;
        initialId.Should().NotBe(MongoDB.Bson.ObjectId.Empty);

        var (_, second) = await migrator.EnsureMigratedAsync(user);
        second.Id.Should().Be(initialId);
    }

    [Fact]
    public async Task Store_Upsert_Preserves_Existing_Id()
    {
        var initialRecord = new ServiceProviderProfileRecord
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId(),
            UserId = "user-upsert-test",
            VerificationStatus = ServiceProviderVerificationStatus.UnderReview
        };

        await _harness.Sp.UpsertAsync(initialRecord);

        var updatedRecord = new ServiceProviderProfileRecord
        {
            Id = MongoDB.Bson.ObjectId.Empty, // intentionally empty on DTO/caller
            UserId = "user-upsert-test",
            VerificationStatus = ServiceProviderVerificationStatus.Verified
        };

        await _harness.Sp.UpsertAsync(updatedRecord);

        var stored = await _harness.Sp.GetByUserIdAsync("user-upsert-test");
        stored.Should().NotBeNull();
        stored!.Id.Should().Be(initialRecord.Id);
        stored.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.Verified);
    }

    [Fact]
    public async Task Live_Mongo_Database_Has_No_Zero_Id_Record()
    {
        try
        {
            var client = new MongoClient("mongodb://localhost:27017");
            var db = client.GetDatabase("MondialEcoDev");
            var col = db.GetCollection<ServiceProviderProfileRecord>("ServiceProviderProfiles");
            var zeroIdDoc = await col.Find(x => x.Id == MongoDB.Bson.ObjectId.Empty).FirstOrDefaultAsync();
            zeroIdDoc.Should().BeNull();
        }
        catch (MongoException)
        {
            // If local Mongo daemon is not running on 27017 in this runner environment, pass gracefully
        }
    }

    // ---------------- Aggregate reader (dual-read) ----------------

    private ServiceProviderProfileReader Reader() =>
        new(_users.Object, _harness.Professional, _harness.Sp, _harness.Credentials);

    [Fact]
    public async Task Reader_falls_back_to_embedded_profile_for_unmigrated_users()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        user.Tier_level = 1;

        var composite = await Reader().GetCompositeForUserAsync(user);

        composite.FromNewCollections.Should().BeFalse();
        composite.View.Headline.Should().Be("Fractional CFO");
        composite.TierLevel.Should().Be(1); // legacy clamp
    }

    [Fact]
    public async Task Reader_prefers_split_records_and_reports_ProviderTier()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        await _harness.CreateMigrator(_users.Object).EnsureMigratedAsync(user);
        user.ServiceProviderProfile!.Headline = "STALE EMBEDDED VALUE";

        var composite = await Reader().GetCompositeForUserAsync(user);

        composite.FromNewCollections.Should().BeTrue();
        composite.View.Headline.Should().Be("Fractional CFO"); // split record wins
        composite.TierLevel.Should().Be((int)ProviderTier.Tier2); // Verified → Tier2
        composite.View.Credentials.Single().Id.Should().Be("credential-1");
    }

    [Fact]
    public async Task Reader_composite_keeps_the_existing_DTO_contract_and_completion_percent()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        var legacyResponse = user.ServiceProviderProfile!.ToResponse();
        await _harness.CreateMigrator(_users.Object).EnsureMigratedAsync(user);

        var composite = await Reader().GetCompositeForUserAsync(user);
        var response = composite.View.ToResponse();

        response.CompletionPercent.Should().Be(legacyResponse.CompletionPercent);
        response.Headline.Should().Be(legacyResponse.Headline);
        response.PortfolioItems.Single().Id.Should().Be("portfolio-1");
        response.ProfileVersion.Should().Be(legacyResponse.ProfileVersion);
    }

    [Fact]
    public void Public_projection_hides_private_credential_data_and_rejection_reason()
    {
        var user = CompleteEmbeddedUser();
        user.ServiceProviderProfile!.RejectionReason = "internal note";
        user.ServiceProviderProfile.Credentials.Add(new ProviderCredential
        {
            Id = "pending-1",
            Title = "Pending credential",
            Status = CredentialStatus.PendingReview,
            CredentialNumber = "SECRET-123",
            Document = new ProviderMediaAsset { PublicUrl = "/uploads/service-provider/credentials/doc.pdf" },
        });

        var publicResponse = user.ServiceProviderProfile.ToPublicResponse();

        publicResponse.RejectionReason.Should().BeNull();
        publicResponse.Credentials.Should().OnlyContain(c => c.Status == "Verified");
        publicResponse.Credentials.Should().OnlyContain(c =>
            c.DocumentUrl == null && c.CredentialNumber == null && c.ReviewNote == null);
    }

    // ---------------- Editor submit on the split stores ----------------

    private ProfileEditorService Editor()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Mongo:TransactionsEnabled"] = "false" })
            .Build();
        return new ProfileEditorService(
            _users.Object,
            _harness.Professional,
            _harness.Sp,
            _harness.Credentials,
            _harness.CreateMigrator(_users.Object),
            Mock.Of<MongoDB.Driver.IMongoClient>(),
            configuration,
            new SaveFile(),
            Mock.Of<IFileSecurityScanner>(),
            Mock.Of<IAuditLogger>(),
            NullLogger<ProfileEditorService>.Instance);
    }

    private static SubmitProfileEditorRequest SubmitRequest(int basedOnVersion) => new()
    {
        BasedOnVersion = basedOnVersion,
        Draft = new ProfileDraftRequest
        {
            BasedOnVersion = basedOnVersion,
            LastStep = 4,
            Headline = "Published headline",
            Bio = "Published bio",
            Skills = new() { "Modeling" },
            ServiceCategories = new() { "Finance" },
            PricingModels = new() { "Hourly" },
            LanguageProficiencies = new()
            {
                new ProviderLanguageRequest { Language = "English", Proficiency = "Fluent" },
            },
        },
    };

    [Fact]
    public async Task Submit_publishes_to_both_records_and_promotes_documented_credentials()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        await _harness.CreateMigrator(_users.Object).EnsureMigratedAsync(user);
        _harness.Credentials.Records["draft-1"] = new UserCredentialRecord
        {
            Id = "draft-1",
            UserId = user.Id.ToString(),
            Title = "New cert",
            Status = CredentialStatus.Draft,
            Document = new ProviderMediaAsset { PublicUrl = "/uploads/service-provider/credentials/x.pdf" },
        };
        _harness.Credentials.Records["undocumented"] = new UserCredentialRecord
        {
            Id = "undocumented",
            UserId = user.Id.ToString(),
            Title = "No file yet",
            Status = CredentialStatus.Draft,
        };

        var result = await Editor().SubmitAsync(user.Id.ToString(), SubmitRequest(3));

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.Outcome.Should().Be("ProfileSubmittedPendingReview");
        result.Value.CredentialsPendingReview.Should().Be(1);

        var professional = _harness.Professional.Records[user.Id.ToString()];
        professional.Headline.Should().Be("Published headline");
        professional.ProfileVersion.Should().Be(4); // exactly +1
        professional.EditorDraft.Should().BeNull(); // cleared only on success
        professional.Languages.Should().Equal("English"); // legacy mirror follows

        _harness.Sp.Records[user.Id.ToString()].ServiceCategories.Should().Equal(ServiceCategory.Finance);
        _harness.Credentials.Records["draft-1"].Status.Should().Be(CredentialStatus.PendingReview);
        _harness.Credentials.Records["undocumented"].Status.Should().Be(CredentialStatus.Draft);
        _harness.Credentials.Records["credential-1"].Status.Should().Be(CredentialStatus.Verified); // untouched
    }

    [Fact]
    public async Task Submit_with_stale_version_conflicts_and_publishes_nothing()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        await _harness.CreateMigrator(_users.Object).EnsureMigratedAsync(user);

        var result = await Editor().SubmitAsync(user.Id.ToString(), SubmitRequest(2)); // stored version is 3

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        var professional = _harness.Professional.Records[user.Id.ToString()];
        professional.Headline.Should().Be("Fractional CFO"); // unchanged
        professional.ProfileVersion.Should().Be(3);
        professional.EditorDraft.Should().NotBeNull(); // draft preserved
    }

    [Fact]
    public async Task Failed_publish_write_keeps_draft_and_published_fields()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        await _harness.CreateMigrator(_users.Object).EnsureMigratedAsync(user);
        _harness.Professional.FailNextWrite = true; // the version-conditional publish fails

        var result = await Editor().SubmitAsync(user.Id.ToString(), SubmitRequest(3));

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        var professional = _harness.Professional.Records[user.Id.ToString()];
        professional.Headline.Should().Be("Fractional CFO");
        professional.ProfileVersion.Should().Be(3); // version increments only on success
        professional.EditorDraft.Should().NotBeNull();
    }

    [Fact]
    public async Task Submit_cannot_change_tier_or_verification()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        await _harness.CreateMigrator(_users.Object).EnsureMigratedAsync(user);
        var before = _harness.Sp.Records[user.Id.ToString()];
        var tierBefore = before.ProviderTier;
        var statusBefore = before.VerificationStatus;

        (await Editor().SubmitAsync(user.Id.ToString(), SubmitRequest(3))).Outcome.Should().Be(ServiceProviderOutcome.Ok);

        var after = _harness.Sp.Records[user.Id.ToString()];
        after.ProviderTier.Should().Be(tierBefore);
        after.VerificationStatus.Should().Be(statusBefore);
    }

    [Fact]
    public async Task Draft_save_writes_only_the_editor_draft_and_never_published_fields()
    {
        var user = GivenUser(CompleteEmbeddedUser());
        await _harness.CreateMigrator(_users.Object).EnsureMigratedAsync(user);

        var request = SubmitRequest(3).Draft;
        request.Headline = "Only in the draft";
        var result = await Editor().SaveDraftAsync(user.Id.ToString(), request);

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        var professional = _harness.Professional.Records[user.Id.ToString()];
        professional.Headline.Should().Be("Fractional CFO"); // published untouched
        professional.EditorDraft!.Headline.Should().Be("Only in the draft");
        professional.ProfileVersion.Should().Be(3); // draft saves never bump the version
    }

    // ---------------- Tier via matching ----------------

    [Fact]
    public async Task Matching_includes_Tier2_and_excludes_Tier1_providers()
    {
        var tier2 = new ServiceProviderProfileRecord
        {
            UserId = "user-tier2",
            VerificationStatus = ServiceProviderVerificationStatus.Verified,
            ProviderTier = ProviderTier.Tier2,
            ServiceCategories = new() { ServiceCategory.Design },
            NewOrderAvailability = true,
        };
        var tier1 = new ServiceProviderProfileRecord
        {
            UserId = "user-tier1",
            VerificationStatus = ServiceProviderVerificationStatus.Verified,
            ProviderTier = ProviderTier.Tier1,
            ServiceCategories = new() { ServiceCategory.Design },
            NewOrderAvailability = true,
        };
        _harness.Sp.Records[tier2.UserId] = tier2;
        _harness.Sp.Records[tier1.UserId] = tier1;
        _users.Setup(m => m.FindByIdAsync("user-tier2")).ReturnsAsync(new ApplicationUser { Name = "Two" });

        var matching = new SpMatchingService(_harness.Sp, _harness.Professional, _users.Object);
        var matches = await matching.MatchAsync(ServiceCategory.Design, "SaaS", 10);

        matches.Should().HaveCount(1);
        matches.Single().User.Name.Should().Be("Two");
        SpMatchingService.IsEligibleCandidate(tier1, ServiceCategory.Design).Should().BeFalse();
        SpMatchingService.IsEligibleCandidate(tier2, ServiceCategory.Design).Should().BeTrue();
    }

    [Fact]
    public async Task Verification_approval_grants_Tier2_but_never_downgrades_a_higher_tier()
    {
        var user = GivenUser(new ApplicationUser
        {
            ServiceProviderProfile = new ServiceProviderProfile
            {
                VerificationStatus = ServiceProviderVerificationStatus.UnderReview,
            },
        });
        var service = new ServiceProviderService(
            _users.Object, _harness.Professional, _harness.Sp, _harness.Credentials,
            _harness.CreateMigrator(_users.Object),
            Mock.Of<IAuditLogger>(), Mock.Of<INotificationService>(), Mock.Of<IBackgroundJobClient>(),
            NullLogger<ServiceProviderService>.Instance);

        (await service.ApproveVerificationAsync(user.Id.ToString(), "admin")).Outcome.Should().Be(ServiceProviderOutcome.Ok);
        _harness.Sp.Records[user.Id.ToString()].ProviderTier.Should().Be(ProviderTier.Tier2);

        // A separately-earned Tier3 is never downgraded by a later approval cycle.
        _harness.Sp.Records[user.Id.ToString()].ProviderTier = ProviderTier.Tier3;
        _harness.Sp.Records[user.Id.ToString()].VerificationStatus = ServiceProviderVerificationStatus.UnderReview;
        (await service.ApproveVerificationAsync(user.Id.ToString(), "admin")).Outcome.Should().Be(ServiceProviderOutcome.Ok);
        _harness.Sp.Records[user.Id.ToString()].ProviderTier.Should().Be(ProviderTier.Tier3);
    }
}
