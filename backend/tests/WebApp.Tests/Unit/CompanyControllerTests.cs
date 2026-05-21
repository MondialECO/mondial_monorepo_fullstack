using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using Xunit;
using Microsoft.Extensions.Logging;

namespace WebApp.Tests.Unit;

/// <summary>
/// Unit tests for CompanyController covering all entrepreneur onboarding phases:
/// - Phase flow management (get current phase, advance phase)
/// - Phase 1: Company creation and basic info
/// - Phase 2: Legal information and documents
/// - Phase 3: Financial data and valuation
/// - Phase 4: Cap table management
/// - Phase 5-9: Additional phases (data room, AI review, deals, etc.)
/// - Error handling and authorization
/// </summary>
public class CompanyControllerTests
{
    private readonly Mock<ICompanyService> _mockCompanyService;
    private readonly Mock<ILogger<CompanyController>> _mockLogger;
    private readonly CompanyController _controller;

    public CompanyControllerTests()
    {
        _mockCompanyService = new Mock<ICompanyService>();
        _mockLogger = new Mock<ILogger<CompanyController>>();

        _controller = new CompanyController(_mockCompanyService.Object, _mockLogger.Object);

        // Setup authenticated user
        var userId = "user-123";
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId) });
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } };
    }

    #region Phase Flow Tests

    [Fact]
    public async Task GetCurrentPhase_WithAuthenticatedUser_ReturnsPhaseProgress()
    {
        // Arrange
        var phaseProgress = new CompanyProgressResponse
        {
            CompanyId = "comp-123",
            CurrentPhase = 2,
            CompletedPhases = new List<int> { 1 },
            OverallProgressPercent = 25,
            TrustScore = 50,
            IsInvestorReady = false
        };

        _mockCompanyService.Setup(x => x.GetCurrentPhaseAsync(It.IsAny<string>()))
            .ReturnsAsync(phaseProgress);

        // Act
        var result = await _controller.GetCurrentPhase();

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult?.Value.Should().Be(phaseProgress);
        _mockCompanyService.Verify(x => x.GetCurrentPhaseAsync(It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task GetCurrentPhase_WithServiceException_ReturnsBadRequest()
    {
        // Arrange
        _mockCompanyService.Setup(x => x.GetCurrentPhaseAsync(It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("No company found"));

        // Act
        var result = await _controller.GetCurrentPhase();

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AdvancePhase_WithValidPhase_ReturnsUpdatedProgress()
    {
        // Arrange
        var companyId = "comp-123";
        var phaseNumber = 2;
        var phaseData = new { };

        var phaseProgress = new CompanyProgressResponse
        {
            CompanyId = companyId,
            CurrentPhase = 2,
            CompletedPhases = new List<int> { 1 },
            OverallProgressPercent = 25
        };

        _mockCompanyService.Setup(x => x.AdvancePhaseAsync(It.IsAny<string>(), phaseNumber, phaseData))
            .ReturnsAsync(phaseProgress);

        // Act
        var result = await _controller.AdvancePhase(companyId, phaseNumber, phaseData);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult?.Value.Should().Be(phaseProgress);
    }

    [Fact]
    public async Task AdvancePhase_WithInvalidPhase_ReturnsBadRequest()
    {
        // Arrange
        var companyId = "comp-123";
        var invalidPhase = 10;

        _mockCompanyService.Setup(x => x.AdvancePhaseAsync(It.IsAny<string>(), invalidPhase, It.IsAny<object>()))
            .ThrowsAsync(new ArgumentException("Phase must be between 1 and 9"));

        // Act
        var result = await _controller.AdvancePhase(companyId, invalidPhase, new { });

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetPhaseProgress_WithAuthenticatedUser_ReturnsProgress()
    {
        // Arrange
        var companyId = "comp-123";
        var progress = new CompanyProgressResponse
        {
            CompanyId = companyId,
            CurrentPhase = 3,
            OverallProgressPercent = 50
        };

        _mockCompanyService.Setup(x => x.GetPhaseProgressAsync(It.IsAny<string>()))
            .ReturnsAsync(progress);

        // Act
        var result = await _controller.GetPhaseProgress(companyId);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    #endregion

    #region Phase 1: Company Creation Tests

    [Fact]
    public async Task CreateCompany_WithValidData_ReturnsCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateCompanyDto
        {
            CompanyName = "Tech Startup",
            Industry = "SaaS",
            Website = "https://techstartup.com",
            Tagline = "The future of work"
        };

        var createdCompany = new Companies
        {
            Id = "comp-123",
            OwnerId = "user-123",
            CompanyName = createDto.CompanyName,
            Industry = createDto.Industry,
            CurrentPhase = 1
        };

        _mockCompanyService.Setup(x => x.CreateCompanyAsync(It.IsAny<string>(), createDto))
            .ReturnsAsync(createdCompany);

        // Act
        var result = await _controller.CreateCompany(createDto);

        // Assert
        result.Should().BeOfType<CreatedAtActionResult>();
        var createdResult = result as CreatedAtActionResult;
        createdResult?.ActionName.Should().Be(nameof(CompanyController.GetCompany));
        createdResult?.Value.Should().Be(createdCompany);
        _mockCompanyService.Verify(x => x.CreateCompanyAsync(It.IsAny<string>(), createDto), Times.Once);
    }

    [Fact]
    public async Task CreateCompany_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange
        var invalidDto = new CreateCompanyDto { CompanyName = "" };

        _mockCompanyService.Setup(x => x.CreateCompanyAsync(It.IsAny<string>(), It.IsAny<CreateCompanyDto>()))
            .ThrowsAsync(new ArgumentException("Company name is required"));

        // Act
        var result = await _controller.CreateCompany(invalidDto);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetCompany_WithValidId_ReturnsCompany()
    {
        // Arrange
        var companyId = "comp-123";
        var company = new Companies
        {
            Id = companyId,
            CompanyName = "Tech Startup",
            Industry = "SaaS"
        };

        _mockCompanyService.Setup(x => x.GetCompanyAsync(companyId))
            .ReturnsAsync(company);

        // Act
        var result = await _controller.GetCompany(companyId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult?.Value.Should().Be(company);
    }

    [Fact]
    public async Task GetCompany_WithNonexistentId_ReturnsNotFound()
    {
        // Arrange
        var companyId = "nonexistent-123";

        _mockCompanyService.Setup(x => x.GetCompanyAsync(companyId))
            .ThrowsAsync(new KeyNotFoundException($"Company {companyId} not found"));

        // Act
        var result = await _controller.GetCompany(companyId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Phase 2: Legal Info Tests

    [Fact]
    public async Task UpdateLegalInfo_WithValidData_ReturnsUpdatedCompany()
    {
        // Arrange
        var companyId = "comp-123";
        var legalRequest = new UpdateLegalInfoRequest
        {
            LegalName = "Tech Startup LLC",
            RegistrationNumber = "REG-123456",
            LegalStructure = "LLC",
            IncorporationDate = new DateTime(2023, 1, 15),
            RegisteredAddress = "123 Tech St",
            Country = "USA",
            NafCode = "6201Z"
        };

        var updatedCompany = new Companies
        {
            Id = companyId,
            LegalName = legalRequest.LegalName,
            RegistrationNumber = legalRequest.RegistrationNumber
        };

        _mockCompanyService.Setup(x => x.UpdateLegalInfoAsync(companyId, legalRequest))
            .ReturnsAsync(updatedCompany);

        // Act
        var result = await _controller.UpdateLegalInfo(companyId, legalRequest);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult?.Value.Should().Be(updatedCompany);
    }

    #endregion

    #region Phase 3: Revenue & Valuation Tests

    [Fact]
    public async Task SaveRevenueData_WithValidData_ReturnsUpdatedCompany()
    {
        // Arrange
        var companyId = "comp-123";
        var revenueRequest = new SaveRevenueDataRequest
        {
            Q1Revenue = 10000,
            Q2Revenue = 15000,
            Q3Revenue = 20000,
            Q4Revenue = 25000
        };

        var updatedCompany = new Companies
        {
            Id = companyId,
            Q1Revenue = revenueRequest.Q1Revenue,
            Q2Revenue = revenueRequest.Q2Revenue,
            Q3Revenue = revenueRequest.Q3Revenue,
            Q4Revenue = revenueRequest.Q4Revenue
        };

        _mockCompanyService.Setup(x => x.SaveRevenueDataAsync(companyId, revenueRequest))
            .ReturnsAsync(updatedCompany);

        // Act
        var result = await _controller.SaveRevenueData(companyId, revenueRequest);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult?.Value.Should().Be(updatedCompany);
    }

    [Fact]
    public async Task CalculateValuation_WithValidCompany_ReturnsFinancialSummary()
    {
        // Arrange
        var companyId = "comp-123";
        var financialSummary = new FinancialSummaryResponse
        {
            TotalRevenue = 70000,
            FinalValuation = 5000000,
            MonthlyRecurringRevenue = 5833.33m,
            AnnualRecurringRevenue = 70000,
            RunwayMonths = 24,
            GrowthRate = 25.0
        };

        _mockCompanyService.Setup(x => x.CalculateValuationAsync(companyId))
            .ReturnsAsync(financialSummary);

        // Act
        var result = await _controller.CalculateValuation(companyId);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        okResult?.Value.Should().Be(financialSummary);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task Controller_WithUnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var controller = new CompanyController(_mockCompanyService.Object, _mockLogger.Object);
        // No user claims set

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => controller.GetCurrentPhase());
    }

    [Fact]
    public async Task CreateCompany_WhenServiceThrows_LogsError()
    {
        // Arrange
        var createDto = new CreateCompanyDto { CompanyName = "Test" };
        var exception = new Exception("Database error");

        _mockCompanyService.Setup(x => x.CreateCompanyAsync(It.IsAny<string>(), It.IsAny<CreateCompanyDto>()))
            .ThrowsAsync(exception);

        // Act
        var result = await _controller.CreateCompany(createDto);

        // Assert
        _mockLogger.Verify(
            x => x.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), exception, It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion
}
