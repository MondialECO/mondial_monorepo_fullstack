//using System.Text;
//using FluentAssertions;
//using Microsoft.AspNetCore.Http;
//using MongoDB.Bson;
//using MongoDB.Driver;
//using Moq;
//using WebApp.DbContext;
//using WebApp.Models.DatabaseModels;
//using WebApp.Models.Dtos;
//using WebApp.Services;
//using Xunit;

//namespace WebApp.Tests.Unit;

///// <summary>
///// Unit tests for CompanyService covering all core business operations:
///// - Company creation and retrieval
///// - Legal information management
///// - Document upload and tracking
///// - Revenue and financial calculations
///// - Valuation and cap table management
///// - Phase progression and validation
///// - Data room and investor matching
///// - Deal execution workflow
///// </summary>
//public class CompanyServiceTests
//{
//    private readonly Mock<MongoDbContext> _mockDbContext;
//    private readonly Mock<IValuationEngine> _mockValuationEngine;
//    private readonly Mock<ICapTableCalculator> _mockCapTableCalculator;
//    private readonly Mock<IInvestorMatcher> _mockInvestorMatcher;
//    private readonly Mock<IAiReviewEngine> _mockAiReviewEngine;
//    private readonly Mock<IDocumentManager> _mockDocumentManager;
//    private readonly Mock<IPhaseValidator> _mockPhaseValidator;
//    private readonly Mock<IMongoCollection<Companies>> _mockCompaniesCollection;
//    private readonly CompanyService _service;

//    public CompanyServiceTests()
//    {
//        _mockDbContext = new Mock<MongoDbContext>(
//            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
//        _mockValuationEngine = new Mock<IValuationEngine>();
//        _mockCapTableCalculator = new Mock<ICapTableCalculator>();
//        _mockInvestorMatcher = new Mock<IInvestorMatcher>();
//        _mockAiReviewEngine = new Mock<IAiReviewEngine>();
//        _mockDocumentManager = new Mock<IDocumentManager>();
//        _mockPhaseValidator = new Mock<IPhaseValidator>();
//        _mockCompaniesCollection = new Mock<IMongoCollection<Companies>>();

//        _mockDbContext.Setup(x => x.Companies).Returns(_mockCompaniesCollection.Object);

//        _service = new CompanyService(
//            _mockDbContext.Object,
//            _mockValuationEngine.Object,
//            _mockCapTableCalculator.Object,
//            _mockInvestorMatcher.Object,
//            _mockAiReviewEngine.Object,
//            _mockDocumentManager.Object,
//            _mockPhaseValidator.Object
//        );
//    }

//    #region Create Company Tests

//    [Fact]
//    public async Task CreateCompanyAsync_WithValidData_CreatesAndReturnsCompany()
//    {
//        // Arrange
//        var userId = "user-123";
//        var createDto = new CreateCompanyDto
//        {
//            CompanyName = "Tech Startup Inc",
//            Industry = "Technology",
//            Website = "https://techstartup.com",
//            Tagline = "Building the future"
//        };

//        Companies savedCompany = null;
//        _mockCompaniesCollection.Setup(x => x.InsertOneAsync(It.IsAny<Companies>(), null, CancellationToken.None))
//            .Callback<Companies, InsertOneOptions, CancellationToken>((c, _, _) => savedCompany = c)
//            .Returns(Task.CompletedTask);

//        // Act
//        var result = await _service.CreateCompanyAsync(userId, createDto);

//        // Assert
//        result.Should().NotBeNull();
//        result.OwnerId.Should().Be(userId);
//        result.CompanyName.Should().Be(createDto.CompanyName);
//        result.Industry.Should().Be(createDto.Industry);
//        result.CurrentPhase.Should().Be(2);
//        result.TrustScore.Should().Be(0);
//        result.IsInvestorReady.Should().BeFalse();
//        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
//        _mockCompaniesCollection.Verify(x => x.InsertOneAsync(It.IsAny<Companies>(), null, CancellationToken.None), Times.Once);
//    }

//    [Fact]
//    public async Task CreateCompanyAsync_WithEmptyCompanyName_StillCreatesCompany()
//    {
//        // Arrange
//        var userId = "user-456";
//        var createDto = new CreateCompanyDto
//        {
//            CompanyName = "",
//            Industry = "Finance",
//            Website = "https://finance.com",
//            Tagline = ""
//        };

//        _mockCompaniesCollection.Setup(x => x.InsertOneAsync(It.IsAny<Companies>(), null, CancellationToken.None))
//            .Returns(Task.CompletedTask);

//        // Act
//        var result = await _service.CreateCompanyAsync(userId, createDto);

//        // Assert
//        result.CompanyName.Should().Be("");
//        result.OwnerId.Should().Be(userId);
//    }

//    #endregion

//    #region Get Company Tests

//    [Fact]
//    public async Task GetCompanyAsync_WithValidId_ReturnsCompany()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var company = new Companies
//        {
//            Id = companyId,
//            OwnerId = "user-123",
//            CompanyName = "Test Company",
//            CurrentPhase = 2,
//            CreatedAt = DateTime.UtcNow
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetCompanyAsync(companyId);

//        // Assert
//        result.Should().NotBeNull();
//        result.Id.Should().Be(companyId);
//        result.CompanyName.Should().Be("Test Company");
//        result.CurrentPhase.Should().Be(2);
//    }

//    [Fact]
//    public async Task GetCompanyAsync_WithNonexistentId_ThrowsKeyNotFoundException()
//    {
//        // Arrange
//        var companyId = "nonexistent-123";

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync((Companies)null);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act & Assert
//        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GetCompanyAsync(companyId));
//    }

//    [Fact]
//    public async Task GetCompanyByUserIdAsync_WithValidUserId_ReturnsCompany()
//    {
//        // Arrange
//        var userId = "user-123";
//        var company = new Companies
//        {
//            Id = "comp-123",
//            OwnerId = userId,
//            CompanyName = "User's Company"
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetCompanyByUserIdAsync(userId);

//        // Assert
//        result.Should().NotBeNull();
//        result.OwnerId.Should().Be(userId);
//    }

//    [Fact]
//    public async Task GetCompanyByUserIdAsync_WithNoCompany_ReturnsNull()
//    {
//        // Arrange
//        var userId = "orphan-user";

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync((Companies)null);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetCompanyByUserIdAsync(userId);

//        // Assert
//        result.Should().BeNull();
//    }

//    #endregion

//    #region Update Legal Info Tests

//    [Fact]
//    public async Task UpdateLegalInfoAsync_WithValidData_UpdatesCompanyLegalFields()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var company = new Companies { Id = companyId, OwnerId = "user-123" };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        _mockCompaniesCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        var updateRequest = new UpdateLegalInfoRequest
//        {
//            LegalName = "Tech Startup LLC",
//            RegistrationNumber = "REG-123456",
//            LegalStructure = "LLC",
//            IncorporationDate = new DateTime(2023, 1, 15),
//            RegisteredAddress = "123 Tech Street, SF",
//            Country = "USA",
//            NafCode = "6201Z"
//        };

//        // Act
//        var result = await _service.UpdateLegalInfoAsync(companyId, updateRequest);

//        // Assert
//        result.LegalName.Should().Be("Tech Startup LLC");
//        result.RegistrationNumber.Should().Be("REG-123456");
//        result.LegalStructure.Should().Be("LLC");
//        result.Country.Should().Be("USA");
//        _mockCompaniesCollection.Verify(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None), Times.Once);
//    }

//    #endregion

//    #region Document Upload Tests

//    [Fact]
//    public async Task UploadDocumentAsync_WithValidData_UploadAndSavesDocument()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var company = new Companies
//        {
//            Id = companyId,
//            DocumentStatuses = new List<DocumentStatusResponse>()
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        _mockCompaniesCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        _mockDocumentManager.Setup(x => x.SaveDocumentAsync(companyId, It.IsAny<string>(), It.IsAny<byte[]>()))
//            .ReturnsAsync("https://storage.example.com/doc-123.pdf");

//        var uploadRequest = new DocumentUploadRequest
//        {
//            DocumentType = "articles_of_incorporation",
//            File = CreateFormFile("articles.pdf", new byte[] { 1, 2, 3, 4, 5 })
//        };

//        // Act
//        var result = await _service.UploadDocumentAsync(companyId, uploadRequest);

//        // Assert
//        result.Should().NotBeNull();
//        result.Type.Should().Be("articles_of_incorporation");
//        result.FileName.Should().Be("articles.pdf");
//        result.Status.Should().Be("pending");
//        result.UploadedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
//        result.StoragePath.Should().Be("https://storage.example.com/doc-123.pdf");
//        result.FileSize.Should().Be(5);
//        _mockDocumentManager.Verify(x => x.SaveDocumentAsync(companyId, "articles.pdf", It.IsAny<byte[]>()), Times.Once);
//    }

//    private static IFormFile CreateFormFile(string fileName, byte[] content)
//    {
//        var stream = new MemoryStream(content);
//        return new FormFile(stream, 0, content.Length, "file", fileName)
//        {
//            Headers = new HeaderDictionary(),
//            ContentType = "application/octet-stream"
//        };
//    }

//    [Fact]
//    public async Task UploadDocumentAsync_WithMultipleDocuments_AddsToExistingList()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var existingDoc = new DocumentStatusResponse { DocumentId = "doc-1", FileName = "doc1.pdf" };
//        var company = new Companies
//        {
//            Id = companyId,
//            DocumentStatuses = new List<DocumentStatusResponse> { existingDoc }
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        _mockCompaniesCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        _mockDocumentManager.Setup(x => x.SaveDocumentAsync(companyId, It.IsAny<string>(), It.IsAny<byte[]>()))
//            .ReturnsAsync("https://storage.example.com/doc-2.pdf");

//        var uploadRequest = new DocumentUploadRequest
//        {
//            DocumentType = "business_license",
//            File = CreateFormFile("license.pdf", new byte[] { 5, 4, 3, 2, 1 })
//        };

//        // Act
//        var result = await _service.UploadDocumentAsync(companyId, uploadRequest);

//        // Assert
//        result.FileName.Should().Be("license.pdf");
//        company.DocumentStatuses.Should().HaveCount(2);
//    }

//    [Fact]
//    public async Task GetDocumentStatusAsync_WithDocuments_ReturnsDocumentList()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var docs = new List<DocumentStatusResponse>
//        {
//            new DocumentStatusResponse { DocumentId = "doc-1", FileName = "doc1.pdf", Status = "approved" },
//            new DocumentStatusResponse { DocumentId = "doc-2", FileName = "doc2.pdf", Status = "pending" }
//        };
//        var company = new Companies { Id = companyId, DocumentStatuses = docs };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetDocumentStatusAsync(companyId);

//        // Assert
//        result.Should().HaveCount(2);
//        result[0].FileName.Should().Be("doc1.pdf");
//        result[1].Status.Should().Be("pending");
//    }

//    #endregion

//    #region Revenue & Valuation Tests

//    [Fact]
//    public async Task SaveRevenueDataAsync_WithValidData_UpdatesRevenueQuarters()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var company = new Companies { Id = companyId };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        _mockCompaniesCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        var revenueRequest = new SaveRevenueDataRequest
//        {
//            Q1Revenue = 10000,
//            Q2Revenue = 15000,
//            Q3Revenue = 20000,
//            Q4Revenue = 25000
//        };

//        // Act
//        var result = await _service.SaveRevenueDataAsync(companyId, revenueRequest);

//        // Assert
//        result.Q1Revenue.Should().Be(10000);
//        result.Q2Revenue.Should().Be(15000);
//        result.Q3Revenue.Should().Be(20000);
//        result.Q4Revenue.Should().Be(25000);
//    }

//    [Fact]
//    public async Task CalculateValuationAsync_WithValidRevenue_ReturnsFinancialSummary()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var company = new Companies
//        {
//            Id = companyId,
//            Industry = "SaaS",
//            Q1Revenue = 10000,
//            Q2Revenue = 12000,
//            Q3Revenue = 14000,
//            Q4Revenue = 16000
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        _mockCompaniesCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        _mockValuationEngine.Setup(x => x.CalculateValuationAsync(It.IsAny<decimal>(), It.IsAny<double>(), "SaaS", It.IsAny<int>()))
//            .ReturnsAsync(new ValuationResultDto { EstimatedValuation = 5000000 });

//        // Act
//        var result = await _service.CalculateValuationAsync(companyId);

//        // Assert
//        result.Should().NotBeNull();
//        result.TotalRevenue.Should().Be(52000);
//        result.FinalValuation.Should().Be(5000000);
//        result.AnnualRecurringRevenue.Should().Be(52000);
//        result.MonthlyRecurringRevenue.Should().Be(52000 / 12);
//        _mockValuationEngine.Verify(x => x.CalculateValuationAsync(It.IsAny<decimal>(), It.IsAny<double>(), "SaaS", It.IsAny<int>()), Times.Once);
//    }

//    [Fact]
//    public async Task CalculateValuationAsync_WithZeroRevenue_StillCalculatesValuation()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var company = new Companies
//        {
//            Id = companyId,
//            Industry = "Biotech",
//            Q1Revenue = 0,
//            Q2Revenue = 0,
//            Q3Revenue = 0,
//            Q4Revenue = 0
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        _mockCompaniesCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        _mockValuationEngine.Setup(x => x.CalculateValuationAsync(It.IsAny<decimal>(), It.IsAny<double>(), "Biotech", It.IsAny<int>()))
//            .ReturnsAsync(new ValuationResultDto { EstimatedValuation = 2000000 });

//        // Act
//        var result = await _service.CalculateValuationAsync(companyId);

//        // Assert
//        result.TotalRevenue.Should().Be(0);
//        result.FinalValuation.Should().Be(2000000);
//    }

//    #endregion

//    #region Beneficial Owners Tests

//    [Fact]
//    public async Task UpdateBeneficialOwnersAsync_WithValidData_UpdatesOwnersList()
//    {
//        // Arrange
//        var companyId = "comp-123";
//        var company = new Companies { Id = companyId };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        _mockCompaniesCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        var owners = new List<BeneficialOwnerDto>
//        {
//            new BeneficialOwnerDto { FullName = "John Doe", OwnershipPercent = 60, Nationality = "US" },
//            new BeneficialOwnerDto { FullName = "Jane Smith", OwnershipPercent = 40, Nationality = "FR" }
//        };

//        var updateRequest = new UpdateBeneficialOwnersRequest { Owners = owners };

//        // Act
//        var result = await _service.UpdateBeneficialOwnersAsync(companyId, updateRequest);

//        // Assert
//        result.BeneficialOwnersDto.Should().HaveCount(2);
//        result.BeneficialOwnersDto[0].FullName.Should().Be("John Doe");
//        result.BeneficialOwnersDto[0].OwnershipPercent.Should().Be(60);
//    }

//    #endregion

//    #region Phase Progression Tests

//    [Fact]
//    public async Task GetCurrentPhaseAsync_WithValidUser_ReturnsPhaseProgress()
//    {
//        // Arrange
//        var userId = "user-123";
//        var company = new Companies
//        {
//            Id = "comp-123",
//            OwnerId = userId,
//            CurrentPhase = 3,
//            CompletedPhases = new List<int> { 1, 2 },
//            TrustScore = 75,
//            IsInvestorReady = false,
//            CreatedAt = DateTime.UtcNow
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetCurrentPhaseAsync(userId);

//        // Assert
//        result.Should().NotBeNull();
//        result.CurrentPhase.Should().Be(3);
//        result.CompletedPhases.Should().ContainInOrder(1, 2);
//        result.TrustScore.Should().Be(75);
//        result.IsInvestorReady.Should().BeFalse();
//    }

//    [Fact]
//    public async Task GetCurrentPhaseAsync_WithNoCompany_ReturnsPhase2()
//    {
//        // Arrange - when no company exists, user is in Universal Phase 1; Entrepreneur phases start at 2
//        var userId = "orphan-user";

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync((Companies)null);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetCurrentPhaseAsync(userId);

//        // Assert
//        result.Should().NotBeNull();
//        result.CompanyId.Should().Be(string.Empty);
//        result.CurrentPhase.Should().Be(2);
//        result.CompletedPhases.Should().BeEmpty();
//    }

//    [Fact]
//    public async Task AdvancePhaseAsync_WithValidPhaseProgression_AdvancesPhaseAndReturnsProgress()
//    {
//        // Arrange - company is at Phase 2, completing it advances to Phase 3
//        var userId = "user-123";
//        var company = new Companies
//        {
//            Id = "comp-123",
//            OwnerId = userId,
//            CurrentPhase = 2,
//            CompletedPhases = new List<int>()
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        _mockCompaniesCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        _mockPhaseValidator.Setup(x => x.ValidatePhase2Async(It.IsAny<Companies>()))
//            .ReturnsAsync((true, new List<string>()));

//        // Act - complete phase 2
//        var result = await _service.AdvancePhaseAsync(userId, 2, new { });

//        // Assert - should advance to phase 3
//        result.Should().NotBeNull();
//        result.CurrentPhase.Should().Be(3);
//        result.CompletedPhases.Should().Contain(2);
//    }

//    [Fact]
//    public async Task AdvancePhaseAsync_WithInvalidPhaseNumber_ThrowsArgumentException()
//    {
//        // Arrange
//        var userId = "user-123";
//        var company = new Companies
//        {
//            Id = "comp-123",
//            OwnerId = userId,
//            CompletedPhases = new List<int>()
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act & Assert
//        await Assert.ThrowsAsync<ArgumentException>(() => _service.AdvancePhaseAsync(userId, 10, new { }));
//    }

//    [Fact]
//    public async Task AdvancePhaseAsync_WithPhaseNotCurrent_ThrowsInvalidOperationException()
//    {
//        // Arrange - company is at phase 2, trying to complete phase 3
//        var userId = "user-123";
//        var company = new Companies
//        {
//            Id = "comp-123",
//            OwnerId = userId,
//            CurrentPhase = 2,
//            CompletedPhases = new List<int>()
//        };

//        var mockCursor = new Mock<IAsyncCursor<Companies>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(company);

//        _mockCompaniesCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Companies>>(), null))
//            .Returns(mockCursor.Object);

//        // Act & Assert - trying to complete phase 3 when currently at phase 2
//        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.AdvancePhaseAsync(userId, 3, new { }));
//    }

//    #endregion
//}
