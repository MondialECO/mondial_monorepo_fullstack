using FluentAssertions;
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
/// Covers the centralised Phase 6 data-room access policy applied by both
/// <c>DownloadDataRoomDocumentAsync</c> and <c>TrackDataRoomEventAsync</c>.
///
/// The fix removed two distinct exploits:
///   P0-1 — view_only / comment grants could download.
///   P0-2 — any authenticated user could forge analytics events.
///
/// Each test exercises one slice of the policy via the real CompanyService.
/// </summary>
public class Phase6AccessPolicyTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<Companies>> _companies;
    private readonly Mock<IMongoCollection<Phase6NdaAcceptance>> _ndas;
    private readonly Mock<IMongoCollection<Phase6AccessLog>> _logs;
    private readonly CompanyService _service;

    public Phase6AccessPolicyTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _companies = new Mock<IMongoCollection<Companies>>();
        _ndas = new Mock<IMongoCollection<Phase6NdaAcceptance>>();
        _logs = new Mock<IMongoCollection<Phase6AccessLog>>();

        _mockDb.Setup(d => d.Companies).Returns(_companies.Object);
        _mockDb.Setup(d => d.Phase6NdaAcceptances).Returns(_ndas.Object);
        _mockDb.Setup(d => d.Phase6AccessLogs).Returns(_logs.Object);

        _service = new CompanyService(
            _mockDb.Object,
            new Mock<IValuationEngine>().Object,
            new Mock<ICapTableCalculator>().Object,
            new Mock<IInvestorMatcher>().Object,
            new Mock<IAiReviewEngine>().Object,
            new Mock<IDocumentManager>().Object,
            new Mock<IPhaseValidator>().Object);
    }

    private static Companies CompanyWithGrant(string accessLevel, bool ndaRequired = false, bool published = true)
    {
        return new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            IsDataRoomLive = published,
            IsDataRoomNdaRequired = ndaRequired,
            DataRoomDocuments = new List<DataRoomDocumentResponse>
            {
                new()
                {
                    DocumentId = "doc-1",
                    Title = "Articles",
                    Category = "legal",
                    FileName = "articles.pdf",
                    StoragePath = "irrelevant-but-non-empty",
                    FileSize = 1,
                },
            },
            DataRoomAccessRecords = new List<DataRoomAccessRecord>
            {
                new()
                {
                    InvestorId = "inv-1",
                    AccessLevel = accessLevel,
                    GrantedAt = DateTime.UtcNow.AddDays(-1),
                    ExpiresAt = DateTime.UtcNow.AddDays(30),
                },
            },
        };
    }

    private void SetupCompanyLookup(Companies company)
    {
        var cursor = new Mock<IAsyncCursor<Companies>>();
        var list = new List<Companies> { company };
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _companies.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private void SetupNdaLookup(Phase6NdaAcceptance? nda)
    {
        var cursor = new Mock<IAsyncCursor<Phase6NdaAcceptance>>();
        var list = nda == null ? new List<Phase6NdaAcceptance>() : new List<Phase6NdaAcceptance> { nda };
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
        _ndas.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Phase6NdaAcceptance>>(),
                It.IsAny<FindOptions<Phase6NdaAcceptance, Phase6NdaAcceptance>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    // ============================================================
    // P0-1: download access-level enforcement
    // ============================================================

    [Fact]
    public async Task Download_ViewOnlyGrant_Denied()
    {
        SetupCompanyLookup(CompanyWithGrant("view_only"));

        var act = async () => await _service.DownloadDataRoomDocumentAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false);

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Contain("does not permit downloads");
    }

    [Fact]
    public async Task Download_CommentGrant_Denied()
    {
        SetupCompanyLookup(CompanyWithGrant("comment"));

        var act = async () => await _service.DownloadDataRoomDocumentAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false);

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Contain("does not permit downloads");
    }

    [Fact]
    public async Task Download_DownloadGrant_DoesNotThrowAuth()
    {
        SetupCompanyLookup(CompanyWithGrant("download"));

        // Path resolution still fails (storagePath is dummy), but the
        // UnauthorizedAccessException must NOT be the failure mode.
        var act = async () => await _service.DownloadDataRoomDocumentAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false);

        await act.Should().NotThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Download_FullAccessGrant_DoesNotThrowAuth()
    {
        SetupCompanyLookup(CompanyWithGrant("full_access"));

        var act = async () => await _service.DownloadDataRoomDocumentAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false);

        await act.Should().NotThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Download_Owner_BypassesAccessLevelCheck()
    {
        SetupCompanyLookup(CompanyWithGrant("view_only"));

        var act = async () => await _service.DownloadDataRoomDocumentAsync(
            "comp-1", "doc-1", "owner-1", callerIsOwner: true);

        await act.Should().NotThrowAsync<UnauthorizedAccessException>();
    }

    // ============================================================
    // P0-2: analytics forgery prevention
    // ============================================================

    [Fact]
    public async Task TrackView_NoGrant_Blocked()
    {
        var c = CompanyWithGrant("download");
        c.DataRoomAccessRecords = new List<DataRoomAccessRecord>(); // no grant for inv-1
        SetupCompanyLookup(c);

        var act = async () => await _service.TrackDataRoomEventAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false, "view", "ip-hash");

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Contain("No data-room access grant");
    }

    [Fact]
    public async Task TrackDownload_ViewOnlyGrant_Blocked()
    {
        SetupCompanyLookup(CompanyWithGrant("view_only"));

        var act = async () => await _service.TrackDataRoomEventAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false, "download", "ip-hash");

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Contain("does not permit downloads");
    }

    [Fact]
    public async Task Track_UnpublishedRoom_Blocked()
    {
        SetupCompanyLookup(CompanyWithGrant("download", published: false));

        var act = async () => await _service.TrackDataRoomEventAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false, "view", "ip-hash");

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Contain("not published");
    }

    [Fact]
    public async Task Track_ExpiredGrant_Blocked()
    {
        var c = CompanyWithGrant("download");
        c.DataRoomAccessRecords[0].ExpiresAt = DateTime.UtcNow.AddDays(-1);
        SetupCompanyLookup(c);

        var act = async () => await _service.TrackDataRoomEventAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false, "view", "ip-hash");

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Contain("expired");
    }

    [Fact]
    public async Task Track_NdaRequiredAndMissing_Blocked()
    {
        SetupCompanyLookup(CompanyWithGrant("download", ndaRequired: true));
        SetupNdaLookup(null);

        var act = async () => await _service.TrackDataRoomEventAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false, "view", "ip-hash");

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Contain("NDA acceptance is required");
    }

    [Fact]
    public async Task Download_NdaRequiredAndMissing_Blocked()
    {
        SetupCompanyLookup(CompanyWithGrant("download", ndaRequired: true));
        SetupNdaLookup(null);

        var act = async () => await _service.DownloadDataRoomDocumentAsync(
            "comp-1", "doc-1", "inv-1", callerIsOwner: false);

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Contain("NDA acceptance is required");
    }
}
