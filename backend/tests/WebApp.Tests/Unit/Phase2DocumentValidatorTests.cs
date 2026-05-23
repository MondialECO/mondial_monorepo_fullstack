using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 2 document-requirements coverage for <see cref="PhaseValidator.ValidatePhase2Async"/>.
///
/// Backend-authoritative rule (semantic model = "Documents Submitted"):
/// every required document type in <see cref="Phase2Requirements.RequiredDocumentTypes"/>
/// must have at least one matching <see cref="DocumentStatusResponse"/> on
/// <see cref="Companies.DocumentStatuses"/> whose Status is non-rejected
/// (pending and approved both qualify; empty/null/rejected do not).
/// </summary>
public class Phase2DocumentValidatorTests
{
    private readonly PhaseValidator _validator = new();

    private static Companies BaseValidCompany() => new()
    {
        LegalName = "Tech Startup SAS",
        RegistrationNumber = "123456789",
        LegalStructure = "SAS",
        IncorporationDate = "2023-01-15",
        RegisteredAddress = "1 rue de Paris, 75001 Paris",
        Country = "France",
        BeneficialOwnersDto = new List<BeneficialOwnerDto>
        {
            new()
            {
                FullName = "Alice Founder",
                Email = "alice@example.com",
                OwnershipPercent = 100,
            },
        },
        DocumentStatuses = new List<DocumentStatusResponse>(),
    };

    private static DocumentStatusResponse Doc(string type, string status = Phase2Requirements.DocumentStatusPending)
        => new()
        {
            DocumentId = Guid.NewGuid().ToString(),
            Type = type,
            FileName = $"{type}.pdf",
            Status = status,
            UploadedAt = DateTime.UtcNow,
        };

    [Fact]
    public async Task Phase2Async_WithOnlyOneDocument_FailsWithMissingRequiredTypes()
    {
        var company = BaseValidCompany();
        company.DocumentStatuses.Add(Doc("kbis"));

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain("Required document 'articles' is missing or rejected");
        errors.Should().Contain("Required document 'license' is missing or rejected");
        errors.Should().Contain("Required document 'tax' is missing or rejected");
    }

    [Fact]
    public async Task Phase2Async_WithMissingTaxDocument_Fails()
    {
        var company = BaseValidCompany();
        company.DocumentStatuses.Add(Doc("kbis"));
        company.DocumentStatuses.Add(Doc("articles"));
        company.DocumentStatuses.Add(Doc("license"));

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain("Required document 'tax' is missing or rejected");
        errors.Should().NotContain(e => e.Contains("kbis"));
        errors.Should().NotContain(e => e.Contains("articles"));
        errors.Should().NotContain(e => e.Contains("license"));
    }

    [Fact]
    public async Task Phase2Async_WithRejectedRequiredDocument_Fails()
    {
        var company = BaseValidCompany();
        company.DocumentStatuses.Add(Doc("kbis"));
        company.DocumentStatuses.Add(Doc("articles"));
        company.DocumentStatuses.Add(Doc("license"));
        company.DocumentStatuses.Add(Doc("tax", Phase2Requirements.DocumentStatusRejected));

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeFalse();
        errors.Should().Contain("Required document 'tax' is missing or rejected");
    }

    [Fact]
    public async Task Phase2Async_WithAllRequiredDocumentsSubmitted_Passes()
    {
        var company = BaseValidCompany();
        company.DocumentStatuses.Add(Doc("kbis"));
        company.DocumentStatuses.Add(Doc("articles"));
        company.DocumentStatuses.Add(Doc("license"));
        company.DocumentStatuses.Add(Doc("tax"));

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase2Async_WithApprovedDocumentsCountsTowardSubmission()
    {
        var company = BaseValidCompany();
        company.DocumentStatuses.Add(Doc("kbis", Phase2Requirements.DocumentStatusApproved));
        company.DocumentStatuses.Add(Doc("articles", Phase2Requirements.DocumentStatusApproved));
        company.DocumentStatuses.Add(Doc("license", Phase2Requirements.DocumentStatusApproved));
        company.DocumentStatuses.Add(Doc("tax", Phase2Requirements.DocumentStatusApproved));

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase2Async_RejectedDocumentIgnoredButReplacementPendingCounts()
    {
        var company = BaseValidCompany();
        company.DocumentStatuses.Add(Doc("kbis"));
        company.DocumentStatuses.Add(Doc("articles"));
        company.DocumentStatuses.Add(Doc("license"));
        // First tax was rejected; user re-uploaded a pending version.
        company.DocumentStatuses.Add(Doc("tax", Phase2Requirements.DocumentStatusRejected));
        company.DocumentStatuses.Add(Doc("tax"));

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase2Async_DocumentTypeMatchIsCaseInsensitive()
    {
        var company = BaseValidCompany();
        company.DocumentStatuses.Add(Doc("KBIS"));
        company.DocumentStatuses.Add(Doc("Articles"));
        company.DocumentStatuses.Add(Doc("LICENSE"));
        company.DocumentStatuses.Add(Doc("Tax"));

        var (isValid, errors) = await _validator.ValidatePhase2Async(company);

        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }
}
