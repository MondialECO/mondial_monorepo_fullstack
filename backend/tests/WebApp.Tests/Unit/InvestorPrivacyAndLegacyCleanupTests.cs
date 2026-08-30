using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

public class InvestorPrivacyAndLegacyCleanupTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoDatabase> _mongoDbMock = new();
    private readonly Mock<IInvestorService> _mockInvestorService;
    private readonly Mock<IInvestmentsService> _mockInvestmentsService;
    private readonly Mock<ICompanyService> _mockCompanyService;
    private readonly Mock<IPhaseNotificationService> _mockNotificationService;
    private readonly Mock<SaveFile> _mockSaveFile;
    private readonly Mock<ILogger<InvestorController>> _mockLogger;
    private readonly Mock<ILogger<InvestorPhaseController>> _mockPhaseLogger;
    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;

    private readonly List<Investor> _investorsDb = new();
    private readonly List<Companies> _companiesDb = new();
    private readonly List<ApplicationUser> _usersDb = new();

    public InvestorPrivacyAndLegacyCleanupTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(_mongoDbMock.Object);
        _mockInvestorService = new Mock<IInvestorService>();
        _mockInvestmentsService = new Mock<IInvestmentsService>();
        _mockCompanyService = new Mock<ICompanyService>();
        _mockNotificationService = new Mock<IPhaseNotificationService>();
        _mockSaveFile = new Mock<SaveFile>();
        _mockLogger = new Mock<ILogger<InvestorController>>();
        _mockPhaseLogger = new Mock<ILogger<InvestorPhaseController>>();

        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _mockUserManager = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _mockUserManager.Setup(m => m.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((string id) => _usersDb.FirstOrDefault(u => u.Id.ToString() == id));

        SetupMockCollection(_investorsDb, mock => _mockDbContext.Setup(db => db.Investors).Returns(mock.Object));
        SetupMockCollection(_companiesDb, mock => _mockDbContext.Setup(db => db.Companies).Returns(mock.Object));
        SetupMockCollection(_usersDb, mock => _mockDbContext.Setup(db => db.ApplicationUsers).Returns(mock.Object));
    }

    private void SetupMockCollection<T>(List<T> dataStore, Action<Mock<IMongoCollection<T>>> register) where T : class
    {
        var mockCollection = new Mock<IMongoCollection<T>>();

        mockCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<T>>(),
            It.IsAny<FindOptions<T, T>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((FilterDefinition<T> _, FindOptions<T, T> _, CancellationToken _) =>
            {
                return CreateAsyncCursor(dataStore.ToList());
            });

        register(mockCollection);
    }

    private static IAsyncCursor<T> CreateAsyncCursor<T>(List<T> items)
    {
        var mockCursor = new Mock<IAsyncCursor<T>>();
        var enumerated = false;
        mockCursor.Setup(c => c.MoveNext(It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                if (!enumerated)
                {
                    enumerated = true;
                    return true;
                }
                return false;
            });
        mockCursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                if (!enumerated)
                {
                    enumerated = true;
                    return true;
                }
                return false;
            });
        mockCursor.Setup(c => c.Current).Returns(items);
        return mockCursor.Object;
    }

    private Investor CreateSampleInvestor(string id = "inv-1")
    {
        return new Investor
        {
            Id = id,
            Name = "Green Horizons Capital",
            Type = "vc",
            Headline = "Early Stage CleanTech Ventures",
            Bio = "Investing in sustainable energy and circular economy startups.",
            Website = "https://greenhorizons.example.com",
            LogoUrl = "https://cdn.example.com/logos/green.png",
            CoverImageUrl = "https://cdn.example.com/covers/green.png",
            SocialLinks = new Dictionary<string, string> { { "linkedin", "https://linkedin.com/in/green" } },
            IsPublic = true,
            PreferredSectors = new List<string> { "CleanTech", "Energy" },
            PreferredStages = new List<string> { "seed", "series_a" },
            MinCheckSize = 250_000,
            MaxCheckSize = 1_500_000,
            PreferredGeographies = new List<string> { "Europe", "UK" },
            RequiresProRataRights = true,
            RequiresBoardSeat = false,
            PreferredEquityTypes = new List<string> { "preferred", "safe" },
            ThesisStatement = "Decarbonizing industrial supply chains across Europe.",
            TargetReturnMultiple = "5-10x",
            FollowOnPolicy = "always_pro_rata",
            PreferredRole = "lead",
            BoardParticipationLevel = "observer",
            SuccessfulExits = 4,
            AverageCheckSize = 500_000,
            CompletedDeals = 12,
            ActiveInvestments = 8,
            ProfileScore = 94,
            // Sensitive / private fields:
            PrimaryContact = "Sarah Jenkins",
            PrimaryEmail = "sarah.private@greenhorizons.example.com",
            PrimaryPhone = "+44 20 7946 0991",
            LinkedUserId = "user-inv-guid",
            IsActive = true
        };
    }

    private InvestorPhaseController CreatePhaseController(string userId, string role = "Investor")
    {
        var controller = new InvestorPhaseController(
            _mockDbContext.Object,
            _mockPhaseLogger.Object,
            _mockUserManager.Object,
            _mockInvestmentsService.Object,
            _mockInvestorService.Object,
            _mockCompanyService.Object,
            _mockNotificationService.Object,
            _mockSaveFile.Object);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };

        return controller;
    }

    [Fact]
    public void PublicInvestorDto_DoesNotExposeEmail()
    {
        var investor = CreateSampleInvestor();
        var dto = PublicInvestorProfileDto.FromInvestor(investor, isFinanceVerified: true);

        var properties = typeof(PublicInvestorProfileDto).GetProperties().Select(p => p.Name).ToList();
        Assert.DoesNotContain("PrimaryEmail", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("Email", properties, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void PublicInvestorDto_DoesNotExposePhone()
    {
        var investor = CreateSampleInvestor();
        var dto = PublicInvestorProfileDto.FromInvestor(investor, isFinanceVerified: true);

        var properties = typeof(PublicInvestorProfileDto).GetProperties().Select(p => p.Name).ToList();
        Assert.DoesNotContain("PrimaryPhone", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("Phone", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("PhoneNumber", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("PrimaryContact", properties, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void PublicInvestorDto_DoesNotExposeFinanceEvidence()
    {
        var properties = typeof(PublicInvestorProfileDto).GetProperties().Select(p => p.Name).ToList();
        Assert.DoesNotContain("FinanceVerification", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("EvidenceDocuments", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("DeclaredAvailableCapital", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("SourceOfFunds", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("StorageKey", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("Kyc", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("IdentityDocument", properties, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain("LinkedUserId", properties, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void PublicInvestorDto_ReturnsSafeProfileFields()
    {
        var investor = CreateSampleInvestor();
        var dto = PublicInvestorProfileDto.FromInvestor(investor, isFinanceVerified: true);

        Assert.Equal("inv-1", dto.Id);
        Assert.Equal("Green Horizons Capital", dto.Name);
        Assert.Equal("vc", dto.Type);
        Assert.Equal("Early Stage CleanTech Ventures", dto.Headline);
        Assert.Equal("Investing in sustainable energy and circular economy startups.", dto.Bio);
        Assert.Equal("https://greenhorizons.example.com", dto.Website);
        Assert.True(dto.IsPublic);
        Assert.True(dto.IsFinanceVerified);
        Assert.Equal(250_000, dto.MinCheckSize);
        Assert.Equal(1_500_000, dto.MaxCheckSize);
        Assert.Contains("CleanTech", dto.PreferredSectors);
        Assert.Equal("Decarbonizing industrial supply chains across Europe.", dto.ThesisStatement);
        Assert.Equal("5-10x", dto.TargetReturnMultiple);
        Assert.Equal(4, dto.SuccessfulExits);
        Assert.Equal(94, dto.ProfileScore);
    }

    [Fact]
    public void PublicInvestorDto_StrictSerializationExcludesPrivateProperties()
    {
        var investor = CreateSampleInvestor();
        var dto = PublicInvestorProfileDto.FromInvestor(investor, isFinanceVerified: true);

        var json = JsonSerializer.Serialize(dto);
        var jsonLower = json.ToLowerInvariant();

        Assert.DoesNotContain("primaryemail", jsonLower);
        Assert.DoesNotContain("primaryphone", jsonLower);
        Assert.DoesNotContain("primarycontact", jsonLower);
        Assert.DoesNotContain("linkeduserid", jsonLower);
        Assert.DoesNotContain("declaredavailablecapital", jsonLower);
        Assert.DoesNotContain("sourceoffunds", jsonLower);
        Assert.DoesNotContain("storagekey", jsonLower);
        Assert.DoesNotContain("kyc", jsonLower);
        Assert.DoesNotContain("identitydocument", jsonLower);
        Assert.DoesNotContain("financeverification", jsonLower);
        Assert.DoesNotContain("evidencedocuments", jsonLower);
    }

    [Fact]
    public async Task InvestorController_GetInvestor_ReturnsPublicDto()
    {
        var investor = CreateSampleInvestor();
        _mockInvestorService.Setup(s => s.GetInvestorAsync("inv-1")).ReturnsAsync(investor);

        var controller = new InvestorController(_mockInvestorService.Object, _mockDbContext.Object, _mockLogger.Object);
        var result = await controller.GetInvestor("inv-1");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<PublicInvestorProfileDto>(okResult.Value);

        Assert.Equal("inv-1", dto.Id);
        Assert.Equal("Green Horizons Capital", dto.Name);
    }

    [Fact]
    public async Task InvestorController_GetAllInvestors_ReturnsPublicDtos()
    {
        var investor = CreateSampleInvestor();
        _mockInvestorService.Setup(s => s.GetAllActiveInvestorsAsync()).ReturnsAsync(new List<Investor> { investor });

        var controller = new InvestorController(_mockInvestorService.Object, _mockDbContext.Object, _mockLogger.Object);
        var result = await controller.GetAllInvestors();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<PublicInvestorProfileDto>>(okResult.Value);

        Assert.Single(list);
        Assert.Equal("inv-1", list[0].Id);
    }

    [Fact]
    public async Task InvestorController_FindInvestors_ReturnsPublicDtos()
    {
        var investor = CreateSampleInvestor();
        _mockInvestorService.Setup(s => s.FindInvestorsByPreferencesAsync(
            It.IsAny<List<string>>(), It.IsAny<List<string>>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<string>()))
            .ReturnsAsync(new List<Investor> { investor });

        var controller = new InvestorController(_mockInvestorService.Object, _mockDbContext.Object, _mockLogger.Object);
        var result = await controller.FindInvestors("CleanTech", "seed");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var list = Assert.IsType<List<PublicInvestorProfileDto>>(okResult.Value);

        Assert.Single(list);
        Assert.Equal("inv-1", list[0].Id);
    }

    [Fact]
    public async Task LegacyNdaPlaceholder_IsDeprecated()
    {
        var userGuid = Guid.NewGuid();
        _usersDb.Add(new ApplicationUser
        {
            Id = userGuid,
            Onboarding = new OnboardingState { Phase = 1 }
        });

        var controller = CreatePhaseController(userGuid.ToString());

        var result = await controller.CreateNda(new CreateNdaRequest { CompanyId = "comp-1" });
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);

        var json = JsonSerializer.Serialize(badRequestResult.Value);
        Assert.Contains("deprecated", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("demo.docusign.net", json);
    }

    [Fact]
    public async Task LegacyGetDealDiscovery_PopulatesRealFounderName()
    {
        var founderGuid = Guid.NewGuid();
        var investorGuid = Guid.NewGuid();

        _usersDb.Add(new ApplicationUser
        {
            Id = investorGuid,
            Onboarding = new OnboardingState { Phase = 1 }
        });
        _usersDb.Add(new ApplicationUser
        {
            Id = founderGuid,
            Name = "Alex Rivera",
            Onboarding = new OnboardingState { Phase = 1 }
        });

        _companiesDb.Add(new Companies
        {
            Id = "comp-discover-1",
            CompanyName = "Quantum Solar",
            CurrentPhase = 8,
            OwnerId = founderGuid.ToString(),
            Industry = "CleanTech",
            FundingRoundType = "Seed",
            FundingAskAmount = 750_000,
            CreatedAt = DateTime.UtcNow
        });

        var controller = CreatePhaseController(investorGuid.ToString());

        var result = await controller.GetDealDiscovery();
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var deals = Assert.IsType<List<DealDiscoveryResponse>>(okResult.Value);

        Assert.Single(deals);
        Assert.Equal("comp-discover-1", deals[0].CompanyId);
        Assert.Equal("Alex Rivera", deals[0].FounderName);
        Assert.NotEqual("Founder", deals[0].FounderName);
    }

    [Fact]
    public void AdminInvestorDto_RetainsAdminFields()
    {
        var investor = CreateSampleInvestor();
        var adminDto = AdminInvestorDto.FromInvestor(investor, isFinanceVerified: true);

        Assert.Equal("Sarah Jenkins", adminDto.PrimaryContact);
        Assert.Equal("sarah.private@greenhorizons.example.com", adminDto.PrimaryEmail);
        Assert.Equal("+44 20 7946 0991", adminDto.PrimaryPhone);
        Assert.Equal("user-inv-guid", adminDto.LinkedUserId);
        Assert.True(adminDto.IsActive);
    }
}
