using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Mondial.Controllers;
using Mondial.Services;
using Mondial.Models;
using Mondial.Models.DTOs;

namespace Mondial.Tests
{
    public class CompanyControllerTests
    {
        private readonly Mock<ICompanyService> _mockCompanyService;
        private readonly CompanyController _controller;

        public CompanyControllerTests()
        {
            _mockCompanyService = new Mock<ICompanyService>();
            _controller = new CompanyController(_mockCompanyService.Object);
        }

        [Fact]
        public async Task CreateCompany_WithValidData_ReturnsOkResult()
        {
            // Arrange
            var createRequest = new
            {
                companyName = "Test Company",
                industry = "SaaS",
                website = "https://test.com",
                tagline = "Test tagline"
            };

            var expectedCompany = new CompanyDto
            {
                Id = "123",
                CompanyName = "Test Company",
                Industry = "SaaS",
                Website = "https://test.com",
                Tagline = "Test tagline"
            };

            _mockCompanyService
                .Setup(s => s.CreateCompanyAsync(It.IsAny<CreateCompanyDto>()))
                .ReturnsAsync(expectedCompany);

            // Act
            var result = await _controller.CreateCompany(
                new CreateCompanyDto
                {
                    CompanyName = createRequest.companyName,
                    Industry = createRequest.industry,
                    Website = createRequest.website,
                    Tagline = createRequest.tagline
                }
            );

            // Assert
            Assert.NotNull(result);
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedCompany = Assert.IsType<CompanyDto>(okResult.Value);
            Assert.Equal("Test Company", returnedCompany.CompanyName);
            Assert.Equal("SaaS", returnedCompany.Industry);
        }

        [Fact]
        public async Task UpdateLegalInfo_WithValidCompanyId_ReturnsOkResult()
        {
            // Arrange
            var companyId = "123";
            var legalInfoDto = new
            {
                legalName = "Test SARL",
                registrationNumber = "12345678901234",
                legalStructure = "SARL",
                incorporationDate = "2023-01-01",
                registeredAddress = "123 Main St",
                country = "France"
            };

            _mockCompanyService
                .Setup(s => s.UpdateLegalInfoAsync(companyId, It.IsAny<UpdateLegalInfoDto>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.UpdateLegalInfo(
                companyId,
                new UpdateLegalInfoDto
                {
                    LegalName = legalInfoDto.legalName,
                    RegistrationNumber = legalInfoDto.registrationNumber,
                    LegalStructure = legalInfoDto.legalStructure,
                    IncorporationDate = legalInfoDto.incorporationDate,
                    RegisteredAddress = legalInfoDto.registeredAddress,
                    Country = legalInfoDto.country
                }
            );

            // Assert
            Assert.NotNull(result);
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.True((bool)okResult.Value);
        }

        [Fact]
        public async Task SaveRevenue_WithValidData_ReturnsOkResult()
        {
            // Arrange
            var companyId = "123";
            var revenueDto = new
            {
                q1Revenue = 10000m,
                q2Revenue = 15000m,
                q3Revenue = 20000m,
                q4Revenue = 25000m,
                arr = 70000m
            };

            _mockCompanyService
                .Setup(s => s.SaveRevenueAsync(companyId, It.IsAny<SaveRevenueDto>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.SaveRevenue(
                companyId,
                new SaveRevenueDto
                {
                    Q1Revenue = revenueDto.q1Revenue,
                    Q2Revenue = revenueDto.q2Revenue,
                    Q3Revenue = revenueDto.q3Revenue,
                    Q4Revenue = revenueDto.q4Revenue,
                    Arr = revenueDto.arr
                }
            );

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.True((bool)okResult.Value);
        }

        [Fact]
        public async Task GetCompanyList_ReturnsAllUserCompanies()
        {
            // Arrange
            var userId = "user-123";
            var expectedCompanies = new List<CompanyDto>
            {
                new CompanyDto
                {
                    Id = "company-1",
                    CompanyName = "Company One",
                    CurrentPhase = 1,
                    TrustScore = 50
                },
                new CompanyDto
                {
                    Id = "company-2",
                    CompanyName = "Company Two",
                    CurrentPhase = 2,
                    TrustScore = 75
                }
            };

            _mockCompanyService
                .Setup(s => s.GetCompanyListByUserAsync(userId))
                .ReturnsAsync(expectedCompanies);

            // Act
            var result = await _controller.GetCompanies();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedCompanies = Assert.IsType<List<CompanyDto>>(okResult.Value);
            Assert.Equal(2, returnedCompanies.Count);
            Assert.Equal("Company One", returnedCompanies[0].CompanyName);
        }

        [Fact]
        public async Task AdvancePhase_WithValidData_ReturnsOkResult()
        {
            // Arrange
            var companyId = "123";
            var advanceRequest = new { phase = 2 };

            var expectedResponse = new CompanyProgressResponse
            {
                CompanyId = companyId,
                CurrentPhase = 2,
                IsPhaseComplete = false
            };

            _mockCompanyService
                .Setup(s => s.AdvancePhaseAsync(companyId, It.IsAny<int>(), It.IsAny<object>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.AdvancePhase(
                companyId,
                new AdvancePhaseRequest { Phase = advanceRequest.phase }
            );

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<CompanyProgressResponse>(okResult.Value);
            Assert.Equal(2, response.CurrentPhase);
        }

        [Fact]
        public async Task EnqueueAiReview_ReturnsJobIdWithAccepted()
        {
            // Arrange
            var companyId = "123";
            var expectedJobId = "job-456";

            _mockCompanyService
                .Setup(s => s.EnqueueAiReviewAsync(companyId))
                .ReturnsAsync(expectedJobId);

            // Act
            var result = await _controller.EnqueueAiReview(companyId);

            // Assert
            var acceptedResult = Assert.IsType<AcceptedResult>(result);
            Assert.Equal(202, acceptedResult.StatusCode);
        }

        [Fact]
        public async Task UploadDocument_WithValidFile_ReturnsOkResult()
        {
            // Arrange
            var companyId = "123";
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns("test.pdf");
            mockFile.Setup(f => f.Length).Returns(1000);

            var expectedResponse = new
            {
                documentId = "doc-123",
                status = "uploaded"
            };

            _mockCompanyService
                .Setup(s => s.UploadDocumentAsync(companyId, It.IsAny<IFormFile>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _controller.UploadDocument(companyId, mockFile.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }

    // DTOs for testing
    public class CreateCompanyDto
    {
        public string CompanyName { get; set; }
        public string Industry { get; set; }
        public string Website { get; set; }
        public string Tagline { get; set; }
    }

    public class UpdateLegalInfoDto
    {
        public string LegalName { get; set; }
        public string RegistrationNumber { get; set; }
        public string LegalStructure { get; set; }
        public string IncorporationDate { get; set; }
        public string RegisteredAddress { get; set; }
        public string Country { get; set; }
    }

    public class SaveRevenueDto
    {
        public decimal Q1Revenue { get; set; }
        public decimal Q2Revenue { get; set; }
        public decimal Q3Revenue { get; set; }
        public decimal Q4Revenue { get; set; }
        public decimal Arr { get; set; }
    }

    public class AdvancePhaseRequest
    {
        public int Phase { get; set; }
    }

    public class CompanyProgressResponse
    {
        public string CompanyId { get; set; }
        public int CurrentPhase { get; set; }
        public bool IsPhaseComplete { get; set; }
    }
}
