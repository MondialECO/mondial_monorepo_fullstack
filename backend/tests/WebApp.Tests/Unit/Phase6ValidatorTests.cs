using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 6 (Data Room) validator coverage. Backend-authoritative.
///
/// Phase 6 completes only when the data room is published, contains at least
/// the minimum document count, every required category has a non-rejected
/// document, every document has a non-empty StoragePath + FileName + FileSize > 0,
/// every category is on the whitelist, and every access grant is well-formed
/// (non-empty investorId + accessLevel, expiresAt not in the past).
/// </summary>
public class Phase6ValidatorTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly PhaseValidator _validator;

    public Phase6ValidatorTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _validator = new PhaseValidator(_mockDbContext.Object);
    }

    private static DataRoomDocumentResponse GoodDoc(string category, string name) => new()
    {
        DocumentId = Guid.NewGuid().ToString(),
        Title = name,
        Category = category,
        Status = "draft",
        UploadedAt = DateTime.UtcNow,
        FileName = $"{name}.pdf",
        StoragePath = $"/storage/{name}.pdf",
        FileSize = 1024,
        MimeType = "application/pdf",
        UploadedBy = "owner-1",
    };

    private static Companies GoodCompany() => new()
    {
        Id = "comp-1",
        IsDataRoomLive = true,
        IsDataRoomNdaRequired = false,
        DataRoomDocuments = new List<DataRoomDocumentResponse>
        {
            GoodDoc("legal", "Articles"),
            GoodDoc("financial", "PnL"),
            GoodDoc("business", "Plan"),
        },
        DataRoomAccessRecords = new List<DataRoomAccessRecord>(),
    };

    [Fact]
    public async Task Phase6_AllValid_Passes()
    {
        var (isValid, errors) = await _validator.ValidatePhase6Async(GoodCompany());
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase6_NotPublished_Fails()
    {
        var c = GoodCompany();
        c.IsDataRoomLive = false;
        var (isValid, errors) = await _validator.ValidatePhase6Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain("Data room must be published");
    }

    [Fact]
    public async Task Phase6_NoDocuments_Fails()
    {
        var c = GoodCompany();
        c.DataRoomDocuments = new List<DataRoomDocumentResponse>();
        var (isValid, errors) = await _validator.ValidatePhase6Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain("Data room must contain at least one document");
    }

    [Fact]
    public async Task Phase6_MissingRequiredCategory_Fails()
    {
        var c = GoodCompany();
        c.DataRoomDocuments = new List<DataRoomDocumentResponse>
        {
            GoodDoc("legal", "Articles"),
            GoodDoc("financial", "PnL"),
            // business missing
            GoodDoc("ip", "Patents"),
        };
        var (isValid, errors) = await _validator.ValidatePhase6Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("Missing required document categories") && e.Contains("business"));
    }

    [Fact]
    public async Task Phase6_DisallowedCategory_Fails()
    {
        var c = GoodCompany();
        c.DataRoomDocuments.Add(GoodDoc("not-a-category", "Weird"));
        var (isValid, errors) = await _validator.ValidatePhase6Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("not in the allowed whitelist"));
    }

    [Fact]
    public async Task Phase6_MalformedUpload_Fails()
    {
        var c = GoodCompany();
        c.DataRoomDocuments[0].StoragePath = "";
        c.DataRoomDocuments[1].FileSize = 0;
        var (isValid, errors) = await _validator.ValidatePhase6Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("storagePath is missing"));
        errors.Should().Contain(e => e.Contains("fileSize must be > 0"));
    }

    [Fact]
    public async Task Phase6_ExpiredAccessGrant_Fails()
    {
        var c = GoodCompany();
        c.DataRoomAccessRecords = new List<DataRoomAccessRecord>
        {
            new() { InvestorId = "inv-1", AccessLevel = "view_only",
                    GrantedAt = DateTime.UtcNow.AddDays(-30),
                    ExpiresAt = DateTime.UtcNow.AddDays(-1) },
        };
        var (isValid, errors) = await _validator.ValidatePhase6Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("expired at"));
    }

    [Fact]
    public async Task Phase6_GrantMissingInvestorId_Fails()
    {
        var c = GoodCompany();
        c.DataRoomAccessRecords = new List<DataRoomAccessRecord>
        {
            new() { InvestorId = "", AccessLevel = "view_only",
                    GrantedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(30) },
        };
        var (isValid, errors) = await _validator.ValidatePhase6Async(c);
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("investorId is missing"));
    }
}
