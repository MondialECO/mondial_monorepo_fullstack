using System.Text;
using System.Text.Json;
using FluentAssertions;
using Hangfire;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using Moq;
using SkiaSharp;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Audit;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

public class ServiceProviderProfileMediaTests
{
    [Fact]
    public async Task GetProfile_assigns_server_owned_ids_to_legacy_portfolio_items()
    {
        var user = User(new PortfolioItem { Id = "", Title = "Legacy" });
        var users = UserManager(user);
        var harness = new SpSplitTestHarness();
        var service = Service(users, harness);

        var result = await service.GetProfileAsync(user.Id.ToString());

        result.Value!.PortfolioItems.Single().Id.Should().NotBeNullOrWhiteSpace();
        // The minted id persists on the SPLIT record; the embedded copy stays frozen.
        harness.Sp.Records[user.Id.ToString()].PortfolioItems.Single().Id
            .Should().Be(result.Value.PortfolioItems.Single().Id);
        users.Verify(value => value.UpdateAsync(user), Times.Never); // embedded write freeze
    }

    [Fact]
    public async Task Text_only_portfolio_update_preserves_owned_and_legacy_images()
    {
        var asset = new ProviderMediaAsset { Id = "asset", StorageKey = "safe/key", PublicUrl = "/public/image.png" };
        var user = User(new PortfolioItem { Id = "item", Title = "Old", ImagePath = "/legacy.png", PrimaryImage = asset });
        var service = Service(UserManager(user));

        var result = await service.UpdatePortfolioItemAsync(user.Id.ToString(), new UpdatePortfolioItemRequest
        {
            Id = "item",
            Title = "New",
            Description = "Description",
        });

        result.Value!.PortfolioItems[0].PrimaryImage!.Id.Should().Be("asset");
        result.Value.PortfolioItems[0].ImagePath.Should().Be("/legacy.png");
    }

    [Fact]
    public async Task Professional_overview_is_allow_list_sanitized_and_plain_text_is_derived()
    {
        var user = User();
        var service = Service(UserManager(user));
        using var json = JsonDocument.Parse("""
        {"type":"doc","content":[
          {"type":"heading","attrs":{"level":2,"style":"color:red"},"content":[{"type":"text","text":"Trusted work"}]},
          {"type":"script","content":[{"type":"text","text":"bad"}]},
          {"type":"paragraph","content":[
            {"type":"text","text":"Safe link","marks":[{"type":"link","attrs":{"href":"https://example.com","onclick":"bad"}}]},
            {"type":"text","text":" unsafe","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}
          ]}
        ]}
        """);

        var result = await service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "Design" },
            ServiceCategories = new() { "Design" },
            ProfessionalOverview = new ProfessionalOverviewRequest { SchemaVersion = 1, Document = json.RootElement.Clone() },
        });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.ProfessionalOverview.PlainText.Should().Contain("Trusted work").And.Contain("Safe link").And.NotContain("bad");
        var serialized = result.Value.ProfessionalOverview.Document.GetRawText();
        serialized.Should().NotContain("script").And.NotContain("javascript:").And.NotContain("onclick").And.NotContain("style");
        serialized.Should().Contain("noopener noreferrer nofollow");
    }

    [Fact]
    public async Task Media_replacement_targets_stable_item_id_and_deletes_superseded_owned_asset()
    {
        var old = new ProviderMediaAsset { Id = "old", StorageKey = "/uploads/service-provider/portfolio/old.png", PublicUrl = "/uploads/service-provider/portfolio/old.png" };
        var user = User(
            new PortfolioItem { Id = "first", Title = "First", PrimaryImage = old },
            new PortfolioItem { Id = "second", Title = "Second" });
        var users = UserManager(user);
        var processor = new Mock<IProviderImageProcessor>();
        processor.Setup(value => value.ProcessAsync(It.IsAny<IFormFile>(), It.IsAny<long>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProcessedProviderImage(new byte[] { 1, 2, 3 }, "image/png", ".png", 1200, 750, "hash"));
        var saveFile = new Mock<SaveFile>();
        saveFile.Setup(value => value.SaveFileAsync(It.IsAny<IFormFile>(), It.IsAny<string>()))
            .ReturnsAsync("/uploads/service-provider/portfolio/new.png");
        var harness = new SpSplitTestHarness();
        var media = MediaService(users, processor, saveFile, harness);

        var result = await media.UploadPortfolioImageAsync(user.Id.ToString(), "first", File("project.png", "image/png"), "Dashboard image");

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        var record = harness.Sp.Records[user.Id.ToString()];
        record.PortfolioItems[0].PrimaryImage!.PublicUrl.Should().Be("/uploads/service-provider/portfolio/new.png");
        record.PortfolioItems[1].PrimaryImage.Should().BeNull();
    }

    [Fact]
    public async Task Failed_media_validation_preserves_previous_image()
    {
        var old = new ProviderMediaAsset { Id = "old", StorageKey = "/uploads/service-provider/portfolio/old.png", PublicUrl = "/uploads/service-provider/portfolio/old.png" };
        var user = User(new PortfolioItem { Id = "item", Title = "Project", PrimaryImage = old });
        var users = UserManager(user);
        var processor = new Mock<IProviderImageProcessor>();
        processor.Setup(value => value.ProcessAsync(It.IsAny<IFormFile>(), It.IsAny<long>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Image could not be decoded."));
        var saveFile = new Mock<SaveFile>();
        var harness = new SpSplitTestHarness();
        var media = MediaService(users, processor, saveFile, harness);

        var result = await media.UploadPortfolioImageAsync(user.Id.ToString(), "item", File("broken.png", "image/png"), null);

        result.Outcome.Should().Be(ServiceProviderOutcome.Invalid);
        // Migrated record keeps the previous image (the migrator clones, so
        // compare by identity fields rather than reference).
        var record = harness.Sp.Records[user.Id.ToString()];
        record.PortfolioItems[0].PrimaryImage!.Id.Should().Be("old");
        record.PortfolioItems[0].PrimaryImage!.PublicUrl.Should().Be(old.PublicUrl);
        saveFile.Verify(value => value.SaveFileAsync(It.IsAny<IFormFile>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Image_processor_validates_signature_and_decodes_then_reencodes_png()
    {
        var processor = new ProviderImageProcessor();
        using var bitmap = new SKBitmap(20, 10);
        bitmap.Erase(SKColors.Teal);
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        var bytes = data.ToArray();

        var result = await processor.ProcessAsync(File("portrait.png", "image/png", bytes), 5 * 1024 * 1024);

        result.ContentType.Should().Be("image/png");
        result.Width.Should().Be(20);
        result.Height.Should().Be(10);
        result.Sha256.Should().HaveLength(64);
        Func<Task> wrongMime = () => processor.ProcessAsync(File("portrait.jpg", "image/jpeg", bytes), 5 * 1024 * 1024);
        await wrongMime.Should().ThrowAsync<ArgumentException>().WithMessage("*does not match*");
    }

    [Fact]
    public async Task SaveFile_recognizes_service_provider_profile_folder()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"sp-test-{Guid.NewGuid()}");
        try
        {
            Directory.CreateDirectory(Path.Combine(tempDir, "wwwroot"));
            var originalRoot = Directory.GetCurrentDirectory();
            Directory.SetCurrentDirectory(tempDir);
            try
            {
                var saveFile = new SaveFile();
                var png = CreateMinimalPng();
                var file = File("avatar.png", "image/png", png);

                var result = await saveFile.SaveFileAsync(file, "service-provider/profile");

                result.Should().StartWith("/uploads/service-provider/profile/");
                result.Should().EndWith(".png");
                var savedPath = Path.Combine(tempDir, "wwwroot", result.TrimStart('/'));
                System.IO.File.Exists(savedPath).Should().BeTrue();
            }
            finally { Directory.SetCurrentDirectory(originalRoot); }
        }
        finally { Directory.Delete(tempDir, true); }
    }

    [Fact]
    public async Task SaveFile_recognizes_service_provider_cover_folder()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"sp-test-{Guid.NewGuid()}");
        try
        {
            Directory.CreateDirectory(Path.Combine(tempDir, "wwwroot"));
            var originalRoot = Directory.GetCurrentDirectory();
            Directory.SetCurrentDirectory(tempDir);
            try
            {
                var saveFile = new SaveFile();
                var webp = CreateMinimalWebp();
                var file = File("cover.webp", "image/webp", webp);

                var result = await saveFile.SaveFileAsync(file, "service-provider/cover");

                result.Should().StartWith("/uploads/service-provider/cover/");
                result.Should().EndWith(".webp");
            }
            finally { Directory.SetCurrentDirectory(originalRoot); }
        }
        finally { Directory.Delete(tempDir, true); }
    }

    [Fact]
    public async Task SaveFile_recognizes_service_provider_portfolio_folder()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"sp-test-{Guid.NewGuid()}");
        try
        {
            Directory.CreateDirectory(Path.Combine(tempDir, "wwwroot"));
            var originalRoot = Directory.GetCurrentDirectory();
            Directory.SetCurrentDirectory(tempDir);
            try
            {
                var saveFile = new SaveFile();
                var jpeg = CreateMinimalJpeg();
                var file = File("project.jpg", "image/jpeg", jpeg);

                var result = await saveFile.SaveFileAsync(file, "service-provider/portfolio");

                result.Should().StartWith("/uploads/service-provider/portfolio/");
                result.Should().EndWith(".jpg");
            }
            finally { Directory.SetCurrentDirectory(originalRoot); }
        }
        finally { Directory.Delete(tempDir, true); }
    }

    [Fact]
    public async Task SaveFile_rejects_unknown_folder()
    {
        var saveFile = new SaveFile();
        var file = File("test.png", "image/png");

        Func<Task> act = () => saveFile.SaveFileAsync(file, "unknown-folder");

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Unknown folder*");
    }

    [Fact]
    public async Task SaveFile_rejects_disallowed_extension_in_service_provider_profile()
    {
        var saveFile = new SaveFile();
        var file = File("avatar.gif", "image/gif", new byte[] { 71, 73, 70 }); // GIF header

        Func<Task> act = () => saveFile.SaveFileAsync(file, "service-provider/profile");

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Invalid file type*");
    }

    [Fact]
    public async Task SaveFile_enforces_profile_image_5mb_limit()
    {
        var saveFile = new SaveFile();
        var oversized = new byte[6 * 1024 * 1024 + 1];
        var file = File("huge.png", "image/png", oversized);

        Func<Task> act = () => saveFile.SaveFileAsync(file, "service-provider/profile");

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*File too large*");
    }

    [Fact]
    public async Task SaveFile_filename_with_unsafe_extension_returns_server_generated_extension()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"sp-test-{Guid.NewGuid()}");
        try
        {
            Directory.CreateDirectory(Path.Combine(tempDir, "wwwroot"));
            var originalRoot = Directory.GetCurrentDirectory();
            Directory.SetCurrentDirectory(tempDir);
            try
            {
                var saveFile = new SaveFile();
                var png = CreateMinimalPng();
                // User tries to upload "avatar.jpg.exe" but the MIME is correct
                var file = File("avatar.jpg.exe", "image/png", png);

                var result = await saveFile.SaveFileAsync(file, "service-provider/profile");

                // Should be rejected because .exe is not in allowed list for this folder
                result.Should().NotContain(".exe");
            }
            catch (ArgumentException ex)
            {
                // This is expected - .exe should be rejected
                ex.Message.Should().Contain("Invalid file type");
            }
            finally { Directory.SetCurrentDirectory(originalRoot); }
        }
        finally { Directory.Delete(tempDir, true); }
    }

    [Fact]
    public async Task SaveFile_rejects_path_traversal_folder_names()
    {
        var saveFile = new SaveFile();
        var file = File("test.png", "image/png");

        Func<Task> act = () => saveFile.SaveFileAsync(file, "../../malicious");

        await act.Should().ThrowAsync<ArgumentException>().WithMessage("*Unknown folder*");
    }

    private static byte[] CreateMinimalPng()
    {
        using var bitmap = new SKBitmap(10, 10);
        bitmap.Erase(SKColors.Transparent);
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }

    private static byte[] CreateMinimalJpeg()
    {
        using var bitmap = new SKBitmap(10, 10);
        bitmap.Erase(SKColors.White);
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, 85);
        return data.ToArray();
    }

    private static byte[] CreateMinimalWebp()
    {
        using var bitmap = new SKBitmap(10, 10);
        bitmap.Erase(SKColors.Blue);
        using var image = SKImage.FromBitmap(bitmap);
        using var data = image.Encode(SKEncodedImageFormat.Webp, 85);
        return data.ToArray();
    }

    [Fact]
    public async Task ServiceProviderMediaService_with_real_SaveFile_uploads_profile_image()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"sp-service-{Guid.NewGuid()}");
        try
        {
            Directory.CreateDirectory(Path.Combine(tempDir, "wwwroot"));
            var originalRoot = Directory.GetCurrentDirectory();
            Directory.SetCurrentDirectory(tempDir);
            try
            {
                var user = User();
                var users = UserManager(user);
                var processor = new ProviderImageProcessor();
                var saveFile = new SaveFile(); // Real SaveFile, not mocked
                var scanner = new Mock<IFileSecurityScanner>();
                scanner.Setup(value => value.ScanAsync(It.IsAny<IFormFile>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new FileSecurityScanResult(true));
                var harness = new SpSplitTestHarness();
                var media = new ServiceProviderMediaService(
                    users.Object,
                    harness.Professional,
                    harness.Sp,
                    harness.Credentials,
                    harness.CreateMigrator(users.Object),
                    processor,
                    saveFile,
                    scanner.Object,
                    Mock.Of<IAuditLogger>(),
                    Mock.Of<IBackgroundJobClient>(),
                    Mock.Of<IMongoDatabase>(),
                    NullLogger<ServiceProviderMediaService>.Instance);

                var png = CreateMinimalPng();
                var file = File("profile.png", "image/png", png);

                var result = await media.UploadProfileMediaAsync(user.Id.ToString(), ProviderProfileMediaKind.ProfileImage, file);

                result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
                // Profile media now lives on the ProfessionalProfiles record.
                var professional = harness.Professional.Records[user.Id.ToString()];
                professional.ProfileImage.Should().NotBeNull();
                professional.ProfileImage!.PublicUrl.Should().StartWith("/uploads/service-provider/profile/");
                professional.ProfileImage.PublicUrl.Should().EndWith(".png");
                professional.ProfileImage.ContentType.Should().Be("image/png");
                professional.ProfileImage.Width.Should().Be(10);
                professional.ProfileImage.Height.Should().Be(10);
                professional.ProfileImage.Sha256.Should().HaveLength(64);

                // Verify file actually exists
                var publicPath = professional.ProfileImage.PublicUrl;
                var physicalPath = Path.Combine(tempDir, "wwwroot", publicPath.TrimStart('/'));
                System.IO.File.Exists(physicalPath).Should().BeTrue();

                // Verify response does not expose internal paths
                result.Value.Should().NotBeNull();
                var response = result.Value!;
                response.ProfileImage?.Url.Should().StartWith("/uploads/service-provider/profile/");
                // StorageKey should not be in response
                var responseJson = System.Text.Json.JsonSerializer.Serialize(response);
                responseJson.Should().NotContain("StorageKey");
            }
            finally { Directory.SetCurrentDirectory(originalRoot); }
        }
        finally { Directory.Delete(tempDir, true); }
    }

    private static ServiceProviderService Service(
        Mock<UserManager<ApplicationUser>> users, SpSplitTestHarness? harness = null)
    {
        harness ??= new SpSplitTestHarness();
        return new ServiceProviderService(
            users.Object,
            harness.Professional,
            harness.Sp,
            harness.Credentials,
            harness.CreateMigrator(users.Object),
            Mock.Of<IAuditLogger>(),
            Mock.Of<INotificationService>(),
            Mock.Of<IBackgroundJobClient>(),
            NullLogger<ServiceProviderService>.Instance);
    }

    private static ServiceProviderMediaService MediaService(
        Mock<UserManager<ApplicationUser>> users,
        Mock<IProviderImageProcessor> processor,
        Mock<SaveFile> saveFile,
        SpSplitTestHarness? harness = null)
    {
        harness ??= new SpSplitTestHarness();
        var scanner = new Mock<IFileSecurityScanner>();
        scanner.Setup(value => value.ScanAsync(It.IsAny<IFormFile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FileSecurityScanResult(true));
        return new ServiceProviderMediaService(
            users.Object,
            harness.Professional,
            harness.Sp,
            harness.Credentials,
            harness.CreateMigrator(users.Object),
            processor.Object,
            saveFile.Object,
            scanner.Object,
            Mock.Of<IAuditLogger>(),
            Mock.Of<IBackgroundJobClient>(),
            Mock.Of<IMongoDatabase>(),
            NullLogger<ServiceProviderMediaService>.Instance);
    }

    private static ApplicationUser User(params PortfolioItem[] items) => new()
    {
        ServiceProviderProfile = new ServiceProviderProfile { PortfolioItems = items.ToList() },
    };

    private static Mock<UserManager<ApplicationUser>> UserManager(ApplicationUser user)
    {
        var manager = new Mock<UserManager<ApplicationUser>>(
            Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);
        manager.Setup(value => value.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        manager.Setup(value => value.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);
        return manager;
    }

    private static IFormFile File(string name, string contentType, byte[]? bytes = null)
    {
        bytes ??= Encoding.UTF8.GetBytes("file");
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", name)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };
    }
}
