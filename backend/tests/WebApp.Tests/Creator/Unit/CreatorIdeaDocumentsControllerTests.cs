using System.Reflection;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit;

public class CreatorIdeaDocumentsControllerTests : IDisposable
{
    private const string OwnerId = "creator-a";
    private const string IdeaAId = "idea-a";
    private const string IdeaBId = "idea-b";
    private readonly string _uploadRoot = Path.Combine(Path.GetTempPath(), "mondial-creator-docs", Guid.NewGuid().ToString("N"));
    private readonly Mock<ICreatorIdeaStore> _ideas = new();

    private CreatorIdeaDocumentsController CreateController(string userId = OwnerId)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["FileStorage:UploadPath"] = _uploadRoot })
            .Build();
        return new CreatorIdeaDocumentsController(_ideas.Object, configuration)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[] { new Claim(ClaimTypes.NameIdentifier, userId) }, "test")),
                },
            },
        };
    }

    private static CreatorIdea Idea(string id, params CreatorIdeaDocument[] documents) => new()
    {
        Id = id,
        UserId = OwnerId,
        Documents = documents.ToList(),
    };

    private string WriteAsset(CreatorIdea idea, string storageReference, string content = "real document")
    {
        var path = Path.Combine(_uploadRoot, "creator-ideas", idea.UserId, idea.Id, storageReference);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        File.WriteAllText(path, content);
        return path;
    }

    private static IReadOnlyList<object> DocumentsFrom(IActionResult result)
    {
        var body = ((OkObjectResult)result).Value.Should().BeOfType<ApiResponse>().Subject;
        var property = body.Data!.GetType().GetProperty("documents", BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
        return property!.GetValue(body.Data)!.Should().BeAssignableTo<System.Collections.IEnumerable>().Subject
            .Cast<object>().ToList();
    }

    [Fact]
    public async Task Empty_vault_returns_no_mock_rows()
    {
        _ideas.Setup(store => store.GetOwnedAsync(IdeaAId, OwnerId)).ReturnsAsync(Idea(IdeaAId));

        var result = await CreateController().List(IdeaAId);

        DocumentsFrom(result).Should().BeEmpty();
    }

    [Fact]
    public async Task Lists_only_real_ready_asset_for_the_requested_idea()
    {
        var businessPlan = new CreatorIdeaDocument
        {
            Id = "plan-a",
            DocumentType = CreatorIdeaDocumentTypes.BusinessPlan,
            Title = "Approved business plan",
            FileName = "plan.pdf",
            MimeType = "application/pdf",
            StorageReference = "plan-a.pdf",
            SourceModule = "business-plan",
            CreatedAt = new DateTime(2026, 8, 25, 0, 0, 0, DateTimeKind.Utc),
        };
        var ideaA = Idea(IdeaAId, businessPlan);
        WriteAsset(ideaA, businessPlan.StorageReference, "real A plan");
        _ideas.Setup(store => store.GetOwnedAsync(IdeaAId, OwnerId)).ReturnsAsync(ideaA);
        _ideas.Setup(store => store.GetOwnedAsync(IdeaBId, OwnerId)).ReturnsAsync(Idea(IdeaBId,
            new CreatorIdeaDocument
            {
                Id = "forecast-b", DocumentType = CreatorIdeaDocumentTypes.FinancialForecast,
                Title = "Forecast B", FileName = "forecast.xlsx", StorageReference = "forecast-b.xlsx",
            }));

        var result = await CreateController().List(IdeaAId);

        var document = DocumentsFrom(result).Should().ContainSingle().Subject;
        document.GetType().GetProperty("id")!.GetValue(document).Should().Be("plan-a");
        document.GetType().GetProperty("title")!.GetValue(document).Should().Be("Approved business plan");
        document.GetType().GetProperty("sizeBytes")!.GetValue(document).Should().Be(new FileInfo(Path.Combine(_uploadRoot, "creator-ideas", OwnerId, IdeaAId, "plan-a.pdf")).Length);
        _ideas.Verify(store => store.GetOwnedAsync(IdeaBId, OwnerId), Times.Never);
    }

    [Fact]
    public async Task Missing_or_non_ready_metadata_is_not_presented_as_a_document()
    {
        var idea = Idea(IdeaAId,
            new CreatorIdeaDocument
            {
                Id = "missing", DocumentType = CreatorIdeaDocumentTypes.BusinessPlan,
                Title = "Missing", FileName = "missing.pdf", StorageReference = "missing.pdf",
            },
            new CreatorIdeaDocument
            {
                Id = "generating", DocumentType = CreatorIdeaDocumentTypes.BusinessPlan,
                Title = "Generating", FileName = "generating.pdf", StorageReference = "generating.pdf", Status = "generating",
            });
        WriteAsset(idea, "generating.pdf");
        _ideas.Setup(store => store.GetOwnedAsync(IdeaAId, OwnerId)).ReturnsAsync(idea);

        var result = await CreateController().List(IdeaAId);

        DocumentsFrom(result).Should().BeEmpty();
    }

    [Fact]
    public async Task Download_returns_the_real_owned_file()
    {
        var document = new CreatorIdeaDocument
        {
            Id = "plan-a", DocumentType = CreatorIdeaDocumentTypes.BusinessPlan,
            Title = "Plan", FileName = "plan.pdf", MimeType = "application/pdf", StorageReference = "plan-a.pdf",
        };
        var idea = Idea(IdeaAId, document);
        var expectedPath = WriteAsset(idea, document.StorageReference);
        _ideas.Setup(store => store.GetOwnedAsync(IdeaAId, OwnerId)).ReturnsAsync(idea);

        var result = await CreateController().Download(IdeaAId, document.Id);

        var file = result.Should().BeOfType<PhysicalFileResult>().Subject;
        file.FileName.Should().Be(expectedPath);
        file.FileDownloadName.Should().Be("plan.pdf");
    }

    [Fact]
    public async Task Other_creators_cannot_list_or_download_an_idea_document()
    {
        _ideas.Setup(store => store.GetOwnedAsync(IdeaAId, "creator-b")).ReturnsAsync((CreatorIdea?)null);
        var controller = CreateController("creator-b");

        (await controller.List(IdeaAId)).Should().BeOfType<NotFoundObjectResult>();
        (await controller.Download(IdeaAId, "plan-a")).Should().BeOfType<NotFoundObjectResult>();
    }

    public void Dispose()
    {
        if (Directory.Exists(_uploadRoot)) Directory.Delete(_uploadRoot, recursive: true);
    }
}
