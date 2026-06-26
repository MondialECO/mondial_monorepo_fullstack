//using FluentAssertions;
//using WebApp.Models.DatabaseModels;
//using WebApp.Services.Implementations;
//using Xunit;

//namespace WebApp.Tests.Unit;

///// <summary>
///// Unit tests for PhaseValidator covering all 9 phases of the entrepreneur onboarding:
///// - Phase 1: Company identity & basic info (name, industry, website, tagline)
///// - Phase 2: Legal info & documentation (registration, structure, owners, documents)
///// - Phase 3: Financial data & valuation (revenue, equity, funding ask)
///// - Phase 4: Cap table & dilution simulation (equity structure, total shares)
///// - Phase 5: Resource allocation (capital allocation, hiring plan)
///// - Phase 6: Data room (published, documents, required categories)
///// - Phase 7: AI review (score, investor-ready badge)
///// - Phase 8: Investor matching (informational phase, no strict validation)
///// - Phase 9: Deal execution (deal-level validation, placeholder for now)
///// </summary>
//public class PhaseValidatorTests
//{
//    private readonly PhaseValidator _validator;

//    public PhaseValidatorTests()
//    {
//        _validator = new PhaseValidator();
//    }

//    #region Phase 1 Tests

//    [Fact]
//    public async Task ValidatePhase1Async_WithAllRequiredFields_ReturnsValid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            CompanyName = "Tech Startup",
//            Industry = "SaaS",
//            Website = "https://techstartup.com",
//            Tagline = "The future of work"
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase1Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    [Fact]
//    public async Task ValidatePhase1Async_WithMissingCompanyName_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            CompanyName = "",
//            Industry = "SaaS",
//            Website = "https://techstartup.com",
//            Tagline = "The future of work"
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase1Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Company name is required");
//    }

//    [Fact]
//    public async Task ValidatePhase1Async_WithMissingIndustry_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            CompanyName = "Tech Startup",
//            Industry = null,
//            Website = "https://techstartup.com",
//            Tagline = "The future of work"
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase1Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Industry is required");
//    }

//    [Fact]
//    public async Task ValidatePhase1Async_WithMissingWebsite_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            CompanyName = "Tech Startup",
//            Industry = "SaaS",
//            Website = "",
//            Tagline = "The future of work"
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase1Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Website is required");
//    }

//    [Fact]
//    public async Task ValidatePhase1Async_WithMissingTagline_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            CompanyName = "Tech Startup",
//            Industry = "SaaS",
//            Website = "https://techstartup.com",
//            Tagline = null
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase1Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Tagline is required");
//    }

//    [Fact]
//    public async Task ValidatePhase1Async_WithMultipleMissingFields_ReturnsMultipleErrors()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            CompanyName = "",
//            Industry = "",
//            Website = "",
//            Tagline = ""
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase1Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().HaveCount(4);
//        errors.Should().Contain("Company name is required");
//        errors.Should().Contain("Industry is required");
//        errors.Should().Contain("Website is required");
//        errors.Should().Contain("Tagline is required");
//    }

//    #endregion

//    #region Phase 2 Tests

//    [Fact]
//    public async Task ValidatePhase2Async_WithAllRequiredFields_ReturnsValid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            LegalName = "Tech Startup LLC",
//            RegistrationNumber = "123456789",
//            LegalStructure = "LLC",
//            IncorporationDate = "2023-01-15",
//            RegisteredAddress = "123 Main St, San Francisco, CA",
//            Country = "USA",
//            BeneficialOwners = new List<BeneficialOwner> { new BeneficialOwner { Name = "John Doe" } },
//            Documents = new List<Document> { new Document { Status = "approved" } }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    [Fact]
//    public async Task ValidatePhase2Async_WithMissingLegalName_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            LegalName = "",
//            RegistrationNumber = "123456789",
//            LegalStructure = "LLC",
//            IncorporationDate = "2023-01-15",
//            RegisteredAddress = "123 Main St",
//            Country = "USA",
//            BeneficialOwners = new List<BeneficialOwner> { new BeneficialOwner() },
//            Documents = new List<Document> { new Document { Status = "approved" } }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Legal name is required");
//    }

//    [Fact]
//    public async Task ValidatePhase2Async_WithMissingBeneficialOwners_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            LegalName = "Tech Startup LLC",
//            RegistrationNumber = "123456789",
//            LegalStructure = "LLC",
//            IncorporationDate = "2023-01-15",
//            RegisteredAddress = "123 Main St",
//            Country = "USA",
//            BeneficialOwners = null,
//            Documents = new List<Document> { new Document { Status = "approved" } }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("At least one beneficial owner is required");
//    }

//    [Fact]
//    public async Task ValidatePhase2Async_WithNoBeneficialOwners_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            LegalName = "Tech Startup LLC",
//            RegistrationNumber = "123456789",
//            LegalStructure = "LLC",
//            IncorporationDate = "2023-01-15",
//            RegisteredAddress = "123 Main St",
//            Country = "USA",
//            BeneficialOwners = new List<BeneficialOwner>(),
//            Documents = new List<Document> { new Document { Status = "approved" } }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("At least one beneficial owner is required");
//    }

//    [Fact]
//    public async Task ValidatePhase2Async_WithNoDocuments_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            LegalName = "Tech Startup LLC",
//            RegistrationNumber = "123456789",
//            LegalStructure = "LLC",
//            IncorporationDate = "2023-01-15",
//            RegisteredAddress = "123 Main St",
//            Country = "USA",
//            BeneficialOwners = new List<BeneficialOwner> { new BeneficialOwner() },
//            Documents = new List<Document>()
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("At least one document must be uploaded");
//    }

//    [Fact]
//    public async Task ValidatePhase2Async_WithPendingDocuments_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            LegalName = "Tech Startup LLC",
//            RegistrationNumber = "123456789",
//            LegalStructure = "LLC",
//            IncorporationDate = "2023-01-15",
//            RegisteredAddress = "123 Main St",
//            Country = "USA",
//            BeneficialOwners = new List<BeneficialOwner> { new BeneficialOwner() },
//            Documents = new List<Document>
//            {
//                new Document { Status = "pending" },
//                new Document { Status = "pending" }
//            }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("2 document(s) still pending review");
//    }

//    #endregion

//    #region Phase 3 Tests

//    [Fact]
//    public async Task ValidatePhase3Async_WithAllRequiredFields_ReturnsValid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            Q1Revenue = 10000,
//            Q2Revenue = 15000,
//            Q3Revenue = 20000,
//            Q4Revenue = 25000,
//            Valuation = 5000000,
//            EquityStructure = new List<Equity> { new Equity { SharesOwned = 1000 } },
//            FundingAskAmount = 1000000,
//            FundingRoundType = "Series A"
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    [Fact]
//    public async Task ValidatePhase3Async_WithZeroRevenue_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            Q1Revenue = 0,
//            Q2Revenue = 0,
//            Q3Revenue = 0,
//            Q4Revenue = 0,
//            Valuation = 5000000,
//            EquityStructure = new List<Equity>(),
//            FundingAskAmount = 1000000,
//            FundingRoundType = "Series A"
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Must have positive quarterly revenue data");
//    }

//    [Fact]
//    public async Task ValidatePhase3Async_WithNoValuation_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            Q1Revenue = 10000,
//            Q2Revenue = 15000,
//            Q3Revenue = 20000,
//            Q4Revenue = 25000,
//            Valuation = null,
//            EquityStructure = new List<Equity>(),
//            FundingAskAmount = 1000000,
//            FundingRoundType = "Series A"
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Valuation must be calculated");
//    }

//    [Fact]
//    public async Task ValidatePhase3Async_WithNoEquityStructure_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            Q1Revenue = 10000,
//            Q2Revenue = 15000,
//            Q3Revenue = 20000,
//            Q4Revenue = 25000,
//            Valuation = 5000000,
//            EquityStructure = null,
//            FundingAskAmount = 1000000,
//            FundingRoundType = "Series A"
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase3Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Equity structure must be defined");
//    }

//    #endregion

//    #region Phase 4 Tests

//    [Fact]
//    public async Task ValidatePhase4Async_WithValidCapTable_ReturnsValid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            EquityStructure = new List<Equity>
//            {
//                new Equity { SharesOwned = 600 },
//                new Equity { SharesOwned = 400 }
//            },
//            TotalShares = 1000
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase4Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    [Fact]
//    public async Task ValidatePhase4Async_WithNoEquityStructure_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            EquityStructure = null,
//            TotalShares = 1000
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase4Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Cap table must be defined");
//    }

//    [Fact]
//    public async Task ValidatePhase4Async_WithNoTotalShares_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            EquityStructure = new List<Equity>(),
//            TotalShares = null
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase4Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Total shares must be set");
//    }

//    [Fact]
//    public async Task ValidatePhase4Async_WithImbalancedOwnership_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            EquityStructure = new List<Equity>
//            {
//                new Equity { SharesOwned = 600 },
//                new Equity { SharesOwned = 300 }
//            },
//            TotalShares = 1000
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase4Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Cap table must total 100%");
//    }

//    #endregion

//    #region Phase 5 Tests

//    [Fact]
//    public async Task ValidatePhase5Async_WithAllRequiredFields_ReturnsValid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            FundingAskAmount = 1000000,
//            FundingRoundType = "Series A",
//            CapitalAllocation = new List<CapitalAllocation>
//            {
//                new CapitalAllocation { Percent = 50 },
//                new CapitalAllocation { Percent = 50 }
//            },
//            ResourceMap = new ResourceMap
//            {
//                HiringPlan = new List<HiringPlanItem> { new HiringPlanItem() }
//            }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase5Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    [Fact]
//    public async Task ValidatePhase5Async_WithNoCapitalAllocation_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            FundingAskAmount = 1000000,
//            FundingRoundType = "Series A",
//            CapitalAllocation = null,
//            ResourceMap = new ResourceMap { HiringPlan = new List<HiringPlanItem>() }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase5Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Capital allocation breakdown is required");
//    }

//    [Fact]
//    public async Task ValidatePhase5Async_WithNoHiringPlan_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            FundingAskAmount = 1000000,
//            FundingRoundType = "Series A",
//            CapitalAllocation = new List<CapitalAllocation> { new CapitalAllocation { Percent = 100 } },
//            ResourceMap = new ResourceMap { HiringPlan = new List<HiringPlanItem>() }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase5Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Hiring plan is required");
//    }

//    #endregion

//    #region Phase 6 Tests

//    [Fact]
//    public async Task ValidatePhase6Async_WithPublishedDataRoom_ReturnsValid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            IsDataRoomLive = true,
//            DataRoomDocuments = new List<DataRoomDocument>
//            {
//                new DataRoomDocument { Category = "legal" },
//                new DataRoomDocument { Category = "financial" },
//                new DataRoomDocument { Category = "business" }
//            }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase6Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    [Fact]
//    public async Task ValidatePhase6Async_WithUnpublishedDataRoom_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            IsDataRoomLive = false,
//            DataRoomDocuments = new List<DataRoomDocument>()
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase6Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Data room must be published");
//    }

//    [Fact]
//    public async Task ValidatePhase6Async_WithMissingDocumentCategories_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            IsDataRoomLive = true,
//            DataRoomDocuments = new List<DataRoomDocument>
//            {
//                new DataRoomDocument { Category = "legal" }
//            }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase6Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Missing required document categories");
//    }

//    #endregion

//    #region Phase 7 Tests

//    [Fact]
//    public async Task ValidatePhase7Async_WithValidAiReview_ReturnsValid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            AiReview = new AiReview
//            {
//                OverallScore = 75,
//                InvestorReadyBadge = true
//            }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase7Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    [Fact]
//    public async Task ValidatePhase7Async_WithNoAiReview_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies { AiReview = null };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase7Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("AI review must be completed");
//    }

//    [Fact]
//    public async Task ValidatePhase7Async_WithLowScore_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            AiReview = new AiReview
//            {
//                OverallScore = 50,
//                InvestorReadyBadge = false
//            }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase7Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("AI review score must be at least 60");
//    }

//    [Fact]
//    public async Task ValidatePhase7Async_WithoutInvestorReadyBadge_ReturnsInvalid()
//    {
//        // Arrange
//        var company = new Companies
//        {
//            AiReview = new AiReview
//            {
//                OverallScore = 75,
//                InvestorReadyBadge = false
//            }
//        };

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase7Async(company);

//        // Assert
//        isValid.Should().BeFalse();
//        errors.Should().Contain("Company must receive investor-ready badge");
//    }

//    #endregion

//    #region Phase 8 Tests

//    [Fact]
//    public async Task ValidatePhase8Async_AlwaysReturnsValid()
//    {
//        // Arrange
//        var company = new Companies();

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase8Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    #endregion

//    #region Phase 9 Tests

//    [Fact]
//    public async Task ValidatePhase9Async_AlwaysReturnsValid()
//    {
//        // Arrange
//        var company = new Companies();

//        // Act
//        var (isValid, errors) = await _validator.ValidatePhase9Async(company);

//        // Assert
//        isValid.Should().BeTrue();
//        errors.Should().BeEmpty();
//    }

//    #endregion
//}
