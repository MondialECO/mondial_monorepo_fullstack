//using FluentAssertions;
//using MongoDB.Bson;
//using MongoDB.Driver;
//using Moq;
//using WebApp.DbContext;
//using WebApp.Models.DatabaseModels;
//using WebApp.Services.Implementations;
//using Xunit;
//using Microsoft.Extensions.Logging;

//namespace WebApp.Tests.Unit;

///// <summary>
///// Unit tests for InvestorService covering:
///// - Investor CRUD operations (create, read, update, delete)
///// - Investor queries (get all active, find by preferences)
///// - Investor match count tracking
///// - Logging and error handling
///// </summary>
//public class InvestorServiceTests
//{
//    private readonly Mock<MongoDbContext> _mockDbContext;
//    private readonly Mock<ILogger<InvestorService>> _mockLogger;
//    private readonly Mock<IMongoCollection<Investor>> _mockInvestorsCollection;
//    private readonly Mock<IMongoCollection<InvestorMatch>> _mockMatchesCollection;
//    private readonly InvestorService _service;

//    public InvestorServiceTests()
//    {
//        _mockDbContext = new Mock<MongoDbContext>(
//            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
//        _mockLogger = new Mock<ILogger<InvestorService>>();
//        _mockInvestorsCollection = new Mock<IMongoCollection<Investor>>();
//        _mockMatchesCollection = new Mock<IMongoCollection<InvestorMatch>>();

//        _mockDbContext.Setup(x => x.Investors).Returns(_mockInvestorsCollection.Object);
//        _mockDbContext.Setup(x => x.InvestorMatches).Returns(_mockMatchesCollection.Object);

//        _service = new InvestorService(_mockDbContext.Object, _mockLogger.Object);
//    }

//    #region Create Investor Tests

//    [Fact]
//    public async Task CreateInvestorAsync_WithValidData_CreatesAndReturnsInvestor()
//    {
//        // Arrange
//        var investor = new Investor
//        {
//            Name = "Tech Ventures Fund",
//            Email = "contact@techventures.com",
//            IsActive = true,
//            ProfileScore = 85,
//            MinCheckSize = 50000,
//            MaxCheckSize = 1000000,
//            PreferredSectors = new List<string> { "SaaS", "AI" },
//            PreferredStages = new List<string> { "Seed", "Series A" }
//        };

//        Investor savedInvestor = null;
//        _mockInvestorsCollection.Setup(x => x.InsertOneAsync(It.IsAny<Investor>(), null, CancellationToken.None))
//            .Callback<Investor, InsertOneOptions, CancellationToken>((i, _, _) => savedInvestor = i)
//            .Returns(Task.CompletedTask);

//        // Act
//        var result = await _service.CreateInvestorAsync(investor);

//        // Assert
//        result.Should().NotBeNull();
//        result.Name.Should().Be("Tech Ventures Fund");
//        result.Id.Should().NotBeNullOrEmpty();
//        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
//        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
//        _mockInvestorsCollection.Verify(x => x.InsertOneAsync(It.IsAny<Investor>(), null, CancellationToken.None), Times.Once);
//        _mockLogger.Verify(
//            x => x.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), null, It.IsAny<Func<It.IsAnyType, Exception, string>>()),
//            Times.Once);
//    }

//    #endregion

//    #region Get Investor Tests

//    [Fact]
//    public async Task GetInvestorAsync_WithValidId_ReturnsInvestor()
//    {
//        // Arrange
//        var investorId = "investor-123";
//        var investor = new Investor
//        {
//            Id = investorId,
//            Name = "Tech Ventures",
//            IsActive = true
//        };

//        var mockCursor = new Mock<IAsyncCursor<Investor>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync(investor);

//        _mockInvestorsCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Investor>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetInvestorAsync(investorId);

//        // Assert
//        result.Should().NotBeNull();
//        result.Id.Should().Be(investorId);
//        result.Name.Should().Be("Tech Ventures");
//    }

//    [Fact]
//    public async Task GetInvestorAsync_WithNonexistentId_ThrowsKeyNotFoundException()
//    {
//        // Arrange
//        var investorId = "nonexistent-123";

//        var mockCursor = new Mock<IAsyncCursor<Investor>>();
//        mockCursor.Setup(x => x.FirstOrDefaultAsync(CancellationToken.None))
//            .ReturnsAsync((Investor)null);

//        _mockInvestorsCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Investor>>(), null))
//            .Returns(mockCursor.Object);

//        // Act & Assert
//        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GetInvestorAsync(investorId));
//    }

//    #endregion

//    #region Get All Active Investors Tests

//    [Fact]
//    public async Task GetAllActiveInvestorsAsync_WithActiveInvestors_ReturnsAndSortsByScore()
//    {
//        // Arrange
//        var investors = new List<Investor>
//        {
//            new Investor { Id = "inv-1", Name = "Fund A", IsActive = true, ProfileScore = 85 },
//            new Investor { Id = "inv-2", Name = "Fund B", IsActive = true, ProfileScore = 95 },
//            new Investor { Id = "inv-3", Name = "Fund C", IsActive = true, ProfileScore = 75 }
//        };

//        var mockCursor = new Mock<IAsyncCursor<Investor>>();
//        mockCursor.SetupSequence(x => x.ToListAsync(CancellationToken.None))
//            .ReturnsAsync(investors.OrderByDescending(i => i.ProfileScore).ToList());

//        _mockInvestorsCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Investor>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetAllActiveInvestorsAsync();

//        // Assert
//        result.Should().HaveCount(3);
//        result[0].ProfileScore.Should().Be(95);
//        result[1].ProfileScore.Should().Be(85);
//        result[2].ProfileScore.Should().Be(75);
//    }

//    [Fact]
//    public async Task GetAllActiveInvestorsAsync_WithNoActiveInvestors_ReturnsEmptyList()
//    {
//        // Arrange
//        var mockCursor = new Mock<IAsyncCursor<Investor>>();
//        mockCursor.Setup(x => x.ToListAsync(CancellationToken.None))
//            .ReturnsAsync(new List<Investor>());

//        _mockInvestorsCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Investor>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.GetAllActiveInvestorsAsync();

//        // Assert
//        result.Should().BeEmpty();
//    }

//    #endregion

//    #region Find By Preferences Tests

//    [Fact]
//    public async Task FindInvestorsByPreferencesAsync_WithAllPreferences_ReturnsMatchingInvestors()
//    {
//        // Arrange
//        var investors = new List<Investor>
//        {
//            new Investor
//            {
//                Id = "inv-1",
//                Name = "SaaS Specialist",
//                ProfileScore = 90,
//                IsActive = true,
//                MinCheckSize = 25000,
//                MaxCheckSize = 500000,
//                PreferredSectors = new List<string> { "SaaS", "FinTech" },
//                PreferredStages = new List<string> { "Series A", "Series B" },
//                PreferredGeographies = new List<string> { "USA", "EU" }
//            }
//        };

//        var mockCursor = new Mock<IAsyncCursor<Investor>>();
//        mockCursor.Setup(x => x.ToListAsync(CancellationToken.None))
//            .ReturnsAsync(investors);

//        _mockInvestorsCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Investor>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.FindInvestorsByPreferencesAsync(
//            new List<string> { "SaaS" },
//            new List<string> { "Series A" },
//            25000,
//            750000,
//            "USA"
//        );

//        // Assert
//        result.Should().HaveCount(1);
//        result[0].Name.Should().Be("SaaS Specialist");
//    }

//    [Fact]
//    public async Task FindInvestorsByPreferencesAsync_WithPartialPreferences_ReturnsMatches()
//    {
//        // Arrange
//        var investors = new List<Investor>
//        {
//            new Investor
//            {
//                Id = "inv-1",
//                IsActive = true,
//                MinCheckSize = 25000,
//                MaxCheckSize = 500000,
//                PreferredSectors = new List<string> { "AI" },
//                PreferredStages = new List<string> { "Seed" },
//                PreferredGeographies = new List<string> { "USA" }
//            }
//        };

//        var mockCursor = new Mock<IAsyncCursor<Investor>>();
//        mockCursor.Setup(x => x.ToListAsync(CancellationToken.None))
//            .ReturnsAsync(investors);

//        _mockInvestorsCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Investor>>(), null))
//            .Returns(mockCursor.Object);

//        // Act - No sectors specified
//        var result = await _service.FindInvestorsByPreferencesAsync(
//            null,
//            new List<string> { "Seed" },
//            25000,
//            750000,
//            null
//        );

//        // Assert
//        result.Should().HaveCount(1);
//    }

//    [Fact]
//    public async Task FindInvestorsByPreferencesAsync_WithNoMatches_ReturnsEmptyList()
//    {
//        // Arrange
//        var mockCursor = new Mock<IAsyncCursor<Investor>>();
//        mockCursor.Setup(x => x.ToListAsync(CancellationToken.None))
//            .ReturnsAsync(new List<Investor>());

//        _mockInvestorsCollection.Setup(x => x.Find(It.IsAny<FilterDefinition<Investor>>(), null))
//            .Returns(mockCursor.Object);

//        // Act
//        var result = await _service.FindInvestorsByPreferencesAsync(
//            new List<string> { "Biotech" },
//            new List<string> { "Series C" },
//            5000000,
//            10000000,
//            "Asia"
//        );

//        // Assert
//        result.Should().BeEmpty();
//    }

//    #endregion

//    #region Update Investor Tests

//    [Fact]
//    public async Task UpdateInvestorAsync_WithValidData_UpdatesAndReturnsInvestor()
//    {
//        // Arrange
//        var investorId = "investor-123";
//        var updatedInvestor = new Investor
//        {
//            Id = investorId,
//            Name = "Updated Fund",
//            ProfileScore = 92,
//            IsActive = true
//        };

//        _mockInvestorsCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Investor>>(), It.IsAny<Investor>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

//        // Act
//        var result = await _service.UpdateInvestorAsync(investorId, updatedInvestor);

//        // Assert
//        result.Should().NotBeNull();
//        result.Name.Should().Be("Updated Fund");
//        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
//        _mockInvestorsCollection.Verify(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Investor>>(), It.IsAny<Investor>(), null, CancellationToken.None), Times.Once);
//    }

//    [Fact]
//    public async Task UpdateInvestorAsync_WithNonexistentId_ThrowsKeyNotFoundException()
//    {
//        // Arrange
//        var investorId = "nonexistent-123";
//        var investor = new Investor { Name = "Test" };

//        _mockInvestorsCollection.Setup(x => x.ReplaceOneAsync(It.IsAny<FilterDefinition<Investor>>(), It.IsAny<Investor>(), null, CancellationToken.None))
//            .ReturnsAsync(new ReplaceOneResult.Acknowledged(0, 0, null));

//        // Act & Assert
//        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateInvestorAsync(investorId, investor));
//    }

//    #endregion

//    #region Delete Investor Tests

//    [Fact]
//    public async Task DeleteInvestorAsync_WithValidId_DeletesInvestor()
//    {
//        // Arrange
//        var investorId = "investor-123";

//        _mockInvestorsCollection.Setup(x => x.DeleteOneAsync(It.IsAny<FilterDefinition<Investor>>(), null, CancellationToken.None))
//            .ReturnsAsync(new DeleteResult.Acknowledged(1));

//        // Act
//        await _service.DeleteInvestorAsync(investorId);

//        // Assert
//        _mockInvestorsCollection.Verify(x => x.DeleteOneAsync(It.IsAny<FilterDefinition<Investor>>(), null, CancellationToken.None), Times.Once);
//        _mockLogger.Verify(
//            x => x.Log(LogLevel.Information, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), null, It.IsAny<Func<It.IsAnyType, Exception, string>>()),
//            Times.Once);
//    }

//    [Fact]
//    public async Task DeleteInvestorAsync_WithNonexistentId_ThrowsKeyNotFoundException()
//    {
//        // Arrange
//        var investorId = "nonexistent-123";

//        _mockInvestorsCollection.Setup(x => x.DeleteOneAsync(It.IsAny<FilterDefinition<Investor>>(), null, CancellationToken.None))
//            .ReturnsAsync(new DeleteResult.Acknowledged(0));

//        // Act & Assert
//        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.DeleteInvestorAsync(investorId));
//    }

//    #endregion

//    #region Get Match Count Tests

//    [Fact]
//    public async Task GetInvestorMatchCountAsync_WithMatches_ReturnsCount()
//    {
//        // Arrange
//        var investorId = "investor-123";

//        _mockMatchesCollection.Setup(x => x.CountDocumentsAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), null, CancellationToken.None))
//            .ReturnsAsync(5);

//        // Act
//        var result = await _service.GetInvestorMatchCountAsync(investorId);

//        // Assert
//        result.Should().Be(5);
//        _mockMatchesCollection.Verify(x => x.CountDocumentsAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), null, CancellationToken.None), Times.Once);
//    }

//    [Fact]
//    public async Task GetInvestorMatchCountAsync_WithNoMatches_ReturnsZero()
//    {
//        // Arrange
//        var investorId = "investor-no-matches";

//        _mockMatchesCollection.Setup(x => x.CountDocumentsAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), null, CancellationToken.None))
//            .ReturnsAsync(0);

//        // Act
//        var result = await _service.GetInvestorMatchCountAsync(investorId);

//        // Assert
//        result.Should().Be(0);
//    }

//    #endregion
//}
