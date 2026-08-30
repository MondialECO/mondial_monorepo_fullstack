using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 6 data-room management: grant deduplication, investor-existence
/// validation on grant, and the NDA lock that prevents disabling enforcement
/// after an investor has signed.
/// </summary>
public class Phase6DataRoomManagementTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<Companies>> _companies;
    private readonly Mock<IMongoCollection<Investor>> _investors;
    private readonly Mock<IMongoCollection<Phase6NdaAcceptance>> _ndas;
    private readonly Mock<IDocumentManager> _mockDocManager;
    private readonly CompanyService _service;

    public Phase6DataRoomManagementTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _companies = new Mock<IMongoCollection<Companies>>();
        _investors = new Mock<IMongoCollection<Investor>>();
        _ndas = new Mock<IMongoCollection<Phase6NdaAcceptance>>();
        _mockDocManager = new Mock<IDocumentManager>();

        _mockDb.Setup(d => d.Companies).Returns(_companies.Object);
        _mockDb.Setup(d => d.Investors).Returns(_investors.Object);
        _mockDb.Setup(d => d.Phase6NdaAcceptances).Returns(_ndas.Object);

        _mockDocManager.Setup(d => d.SaveDocumentAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<byte[]>()))
            .ReturnsAsync((string compId, string name, byte[] bytes) => $"/uploads/{compId}/{name}");

        _companies.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<Companies>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

        _service = new CompanyService(
            _mockDb.Object,
            new Mock<IValuationEngine>().Object,
            new Mock<ICapTableCalculator>().Object,
            new Mock<IInvestorMatcher>().Object,
            new Mock<IAiReviewEngine>().Object,
            _mockDocManager.Object,
            new Mock<IPhaseValidator>().Object,
            new Mock<IDealEventPublisher>().Object);
    }

    private static IFormFile FakeFormFile(string name = "test.pdf", long length = 1024)
    {
        var fileMock = new Mock<IFormFile>();
        var ms = new MemoryStream(new byte[length]);
        fileMock.Setup(f => f.FileName).Returns(name);
        fileMock.Setup(f => f.Length).Returns(length);
        fileMock.Setup(f => f.ContentType).Returns("application/pdf");
        fileMock.Setup(f => f.OpenReadStream()).Returns(ms);
        fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns<Stream, CancellationToken>((stream, _) => ms.CopyToAsync(stream));
        return fileMock.Object;
    }

    // Fresh cursor per call so methods that read the company more than once
    // (grant → GetDataRoomStatus) both resolve.
    private void SetupCompanyFind(Companies company)
    {
        _companies.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
            .Returns(() => Task.FromResult(MakeCursor(company)));
    }

    private void SetupInvestorFind(Investor? investor)
    {
        _investors.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Investor>>(),
                It.IsAny<FindOptions<Investor, Investor>>(),
                It.IsAny<CancellationToken>()))
            .Returns(() => Task.FromResult(MakeCursor(investor)));
    }

    private static IAsyncCursor<T> MakeCursor<T>(T? item) where T : class
    {
        var list = item == null ? new List<T>() : new List<T> { item };
        var cursor = new Mock<IAsyncCursor<T>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
        return cursor.Object;
    }

    private static Companies Company(List<DataRoomAccessRecord>? grants = null, DateTime? ndaLockedAt = null, List<DataRoomDocumentResponse>? docs = null)
        => new()
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            IsDataRoomLive = true,
            IsDataRoomNdaRequired = true,
            DataRoomNdaLockedAt = ndaLockedAt,
            DataRoomDocuments = docs ?? new List<DataRoomDocumentResponse>(),
            DataRoomAccessRecords = grants ?? new List<DataRoomAccessRecord>(),
        };

    private static Investor LiveInvestor() => new() { Id = "inv-1", Name = "Acme Capital" };

    // ============================================================
    // Delete tests
    // ============================================================

    [Fact]
    public async Task Phase6_FounderCanDeleteOwnDocument()
    {
        var doc = new DataRoomDocumentResponse { DocumentId = "doc-1", Title = "Articles", Category = "legal", FileName = "articles.pdf" };
        SetupCompanyFind(Company(docs: new List<DataRoomDocumentResponse> { doc }));

        var res = await _service.DeleteDataRoomDocumentAsync("comp-1", "doc-1");
        res.Documents.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase6_CannotDeleteForeignCompanyDocument()
    {
        var doc = new DataRoomDocumentResponse { DocumentId = "doc-1", Title = "Articles", Category = "legal", FileName = "articles.pdf" };
        SetupCompanyFind(Company(docs: new List<DataRoomDocumentResponse> { doc }));

        var act = async () => await _service.DeleteDataRoomDocumentAsync("comp-1", "doc-999");
        (await act.Should().ThrowAsync<KeyNotFoundException>())
            .Which.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task Phase6_DeleteRemovesMetadata()
    {
        var doc1 = new DataRoomDocumentResponse { DocumentId = "doc-1", Title = "Articles", Category = "legal" };
        var doc2 = new DataRoomDocumentResponse { DocumentId = "doc-2", Title = "PnL", Category = "financial" };
        SetupCompanyFind(Company(docs: new List<DataRoomDocumentResponse> { doc1, doc2 }));

        var res = await _service.DeleteDataRoomDocumentAsync("comp-1", "doc-1");
        res.Documents.Should().HaveCount(1);
        res.Documents[0].DocumentId.Should().Be("doc-2");
    }

    [Fact]
    public async Task Phase6_DeleteReducesDocumentCount()
    {
        var doc1 = new DataRoomDocumentResponse { DocumentId = "doc-1", Title = "Articles", Category = "legal" };
        var doc2 = new DataRoomDocumentResponse { DocumentId = "doc-2", Title = "PnL", Category = "financial" };
        var doc3 = new DataRoomDocumentResponse { DocumentId = "doc-3", Title = "Plan", Category = "business" };
        SetupCompanyFind(Company(docs: new List<DataRoomDocumentResponse> { doc1, doc2, doc3 }));

        var res = await _service.DeleteDataRoomDocumentAsync("comp-1", "doc-2");
        res.TotalDocuments.Should().Be(2);
    }

    // ============================================================
    // Replace tests
    // ============================================================

    [Fact]
    public async Task Phase6_ReplaceUploadsNewBeforeRemovingOld()
    {
        var doc1 = new DataRoomDocumentResponse { DocumentId = "doc-1", Title = "Old Articles", Category = "legal", FileName = "old.pdf", StoragePath = "/uploads/comp-1/old.pdf" };
        SetupCompanyFind(Company(docs: new List<DataRoomDocumentResponse> { doc1 }));

        var req = new UploadDataRoomDocumentRequest
        {
            File = FakeFormFile("new.pdf"),
            Title = "New Articles",
            Category = "legal"
        };

        var res = await _service.ReplaceDataRoomDocumentAsync("comp-1", "doc-1", req, "owner-1");
        res.Title.Should().Be("New Articles");
        res.FileName.Should().Be("new.pdf");
        res.Category.Should().Be("legal");
        res.DocumentId.Should().NotBe("doc-1");
    }

    [Fact]
    public async Task Phase6_ReplacePreservesCategory()
    {
        var doc1 = new DataRoomDocumentResponse { DocumentId = "doc-1", Title = "Articles", Category = "legal" };
        SetupCompanyFind(Company(docs: new List<DataRoomDocumentResponse> { doc1 }));

        var req = new UploadDataRoomDocumentRequest
        {
            File = FakeFormFile("v2.pdf"),
            Title = "Articles V2",
            Category = "" // empty, should preserve original category
        };

        var res = await _service.ReplaceDataRoomDocumentAsync("comp-1", "doc-1", req, "owner-1");
        res.Category.Should().Be("legal");
    }

    [Fact]
    public async Task Phase6_ReplaceFailureKeepsOldDocument()
    {
        var doc1 = new DataRoomDocumentResponse { DocumentId = "doc-1", Title = "Articles", Category = "legal" };
        var c = Company(docs: new List<DataRoomDocumentResponse> { doc1 });
        SetupCompanyFind(c);

        var req = new UploadDataRoomDocumentRequest
        {
            File = null, // will fail
            Title = "Articles V2",
            Category = "legal"
        };

        var act = async () => await _service.ReplaceDataRoomDocumentAsync("comp-1", "doc-1", req, "owner-1");
        await act.Should().ThrowAsync<ArgumentException>();

        c.DataRoomDocuments.Should().HaveCount(1);
        c.DataRoomDocuments[0].DocumentId.Should().Be("doc-1");
    }

    [Fact]
    public async Task Phase6_ReplaceDoesNotLeaveDuplicateActiveDocument()
    {
        var doc1 = new DataRoomDocumentResponse { DocumentId = "doc-1", Title = "Articles", Category = "legal" };
        var c = Company(docs: new List<DataRoomDocumentResponse> { doc1 });
        SetupCompanyFind(c);

        var req = new UploadDataRoomDocumentRequest
        {
            File = FakeFormFile("new.pdf"),
            Title = "Articles Updated",
            Category = "legal"
        };

        await _service.ReplaceDataRoomDocumentAsync("comp-1", "doc-1", req, "owner-1");
        c.DataRoomDocuments.Should().HaveCount(1);
        c.DataRoomDocuments[0].Title.Should().Be("Articles Updated");
    }

    // ============================================================
    // Grant validation + dedupe
    // ============================================================

    [Fact]
    public async Task Grant_InvalidInvestor_Throws()
    {
        SetupCompanyFind(Company());
        SetupInvestorFind(null); // investor does not exist

        var act = async () => await _service.GrantDataRoomAccessAsync(
            "comp-1", new DataRoomAccessRequest { InvestorId = "ghost", AccessLevel = "download", DaysValid = 30 });

        (await act.Should().ThrowAsync<ArgumentException>())
            .Which.Message.Should().Contain("not found");
    }

    [Fact]
    public async Task Grant_EmptyInvestorId_Throws()
    {
        SetupCompanyFind(Company());

        var act = async () => await _service.GrantDataRoomAccessAsync(
            "comp-1", new DataRoomAccessRequest { InvestorId = "  ", AccessLevel = "download", DaysValid = 30 });

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task Grant_SameInvestorTwice_DedupesToOneRecord()
    {
        var existing = new DataRoomAccessRecord
        {
            InvestorId = "inv-1",
            AccessLevel = "view_only",
            GrantedAt = DateTime.UtcNow.AddDays(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(2),
        };
        SetupCompanyFind(Company(new List<DataRoomAccessRecord> { existing }));
        SetupInvestorFind(LiveInvestor());

        var result = await _service.GrantDataRoomAccessAsync(
            "comp-1", new DataRoomAccessRequest { InvestorId = "inv-1", AccessLevel = "download", DaysValid = 30 });

        result.AccessGrants.Should().HaveCount(1);
        result.AccessGrants[0].InvestorId.Should().Be("inv-1");
        result.AccessGrants[0].AccessLevel.Should().Be("download"); // updated, not stacked
        result.AccessGrants[0].InvestorName.Should().Be("Acme Capital");
    }

    // ============================================================
    // NDA lock
    // ============================================================

    [Fact]
    public async Task NdaToggle_DisableAfterLock_Throws()
    {
        SetupCompanyFind(Company(ndaLockedAt: DateTime.UtcNow.AddDays(-1)));

        var act = async () => await _service.UpdateNdaRequirementAsync("comp-1", required: false);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("cannot be disabled after investors have signed");
    }

    [Fact]
    public async Task NdaToggle_DisableBeforeLock_Succeeds()
    {
        SetupCompanyFind(Company(ndaLockedAt: null));

        var act = async () => await _service.UpdateNdaRequirementAsync("comp-1", required: false);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task NdaToggle_EnableAlways_Succeeds()
    {
        SetupCompanyFind(Company(ndaLockedAt: DateTime.UtcNow.AddDays(-1)));

        // Enabling NDA is always allowed, even when locked.
        var act = async () => await _service.UpdateNdaRequirementAsync("comp-1", required: true);

        await act.Should().NotThrowAsync();
    }
}
