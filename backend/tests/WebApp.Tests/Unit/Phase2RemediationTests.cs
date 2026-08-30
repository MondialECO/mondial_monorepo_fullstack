using FluentAssertions;
using MongoDB.Driver;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class Phase2RemediationTests
{
    private readonly PhaseValidator _validator;

    public Phase2RemediationTests()
    {
        var mockDbContext = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _validator = new PhaseValidator(mockDbContext.Object);
    }

    [Fact]
    public async Task Phase2_MissingRegistrationNumber_ReturnsGenericErrorWithoutSiret()
    {
        var company = new Companies
        {
            LegalName = "Global Ventures Inc",
            RegistrationNumber = "", // Empty
            LegalStructure = "LLC",
            IncorporationDate = "2024-01-01",
            RegisteredAddress = "100 Main St, New York, NY",
            Country = "United States",
            BeneficialOwnersDto = new List<BeneficialOwnerDto>
            {
                new()
                {
                    FullName = "John Doe",
                    Email = "john@example.com",
                    OwnershipPercent = 100,
                    Nationality = "American",
                }
            },
            DocumentStatuses = new List<DocumentStatusResponse>
            {
                new() { Type = "kbis", Status = "pending" },
                new() { Type = "rib", Status = "pending" },
                new() { Type = "tax", Status = "pending" },
                new() { Type = "insurance", Status = "pending" },
            }
        };

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain("Company registration number is required");
        errors.Should().NotContain(e => e.Contains("SIRET", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Phase2_AllValidFields_PassesValidation()
    {
        var company = new Companies
        {
            LegalName = "Global Ventures Inc",
            RegistrationNumber = "US-12345678",
            LegalStructure = "LLC",
            IncorporationDate = "2024-01-01",
            RegisteredAddress = "100 Main St, New York, NY",
            Country = "United States",
            BeneficialOwnersDto = new List<BeneficialOwnerDto>
            {
                new()
                {
                    FullName = "John Doe",
                    Email = "john@example.com",
                    OwnershipPercent = 100,
                    Nationality = "American",
                }
            },
            DocumentStatuses = new List<DocumentStatusResponse>
            {
                new() { Type = "kbis", Status = "pending" },
                new() { Type = "rib", Status = "pending" },
                new() { Type = "tax", Status = "pending" },
                new() { Type = "insurance", Status = "pending" },
            }
        };

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }
}
