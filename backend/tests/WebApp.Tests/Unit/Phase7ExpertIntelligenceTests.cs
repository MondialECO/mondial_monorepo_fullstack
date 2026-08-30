using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class Phase7ExpertIntelligenceTests
{
    [Fact]
    public void CrossModuleInconsistencyDetector_FlagsAllocationMismatch()
    {
        var company = new Companies
        {
            FundingAskAmount = 500000,
            CapitalAllocation = new List<CapitalAllocationDto>
            {
                new() { Category = "Engineering", Percent = 40 },
                new() { Category = "Marketing", Percent = 40 } // sums to 80%, not 100%
            }
        };

        var inconsistencies = CrossModuleInconsistencyDetector.DetectInconsistencies(company);

        Assert.Contains(inconsistencies, i => i.ModuleB.Contains("Capital Allocation") && i.Severity == "HIGH");
    }

    [Fact]
    public void CrossModuleInconsistencyDetector_FlagsValuationDilutionInversion()
    {
        var company = new Companies
        {
            FundingAskAmount = 1000000,
            PreMoneyValuation = 500000 // pre-money valuation lower than raise amount
        };

        var inconsistencies = CrossModuleInconsistencyDetector.DetectInconsistencies(company);

        Assert.Contains(inconsistencies, i => i.Severity == "CRITICAL" && i.Description.Contains("dilution"));
    }

    [Fact]
    public void CrossModuleInconsistencyDetector_FlagsExcessiveFounderPlusOfferedEquity()
    {
        var company = new Companies
        {
            TotalShares = 100,
            EquityOfferedPercent = 25,
            EquityStructure = new List<EquityEntryDto>
            {
                new() { StakeholderName = "Founder A", SharesOwned = 50 },
                new() { StakeholderName = "Founder B", SharesOwned = 40 } // total 90% + 25% = 115%
            }
        };

        var inconsistencies = CrossModuleInconsistencyDetector.DetectInconsistencies(company);

        Assert.Contains(inconsistencies, i => i.Severity == "CRITICAL" && i.Description.Contains("exceeds 100%"));
    }

    [Fact]
    public async Task AiReviewEngine_SynthesizesQualitativeIntelligenceWithDeterministicScores()
    {
        var engine = new AiReviewEngine(); // uses fallback without external DB/LLM call
        var company = new Companies
        {
            CompanyName = "Quantum Analytics",
            Industry = "Enterprise AI",
            Country = "France",
            LegalName = "Quantum Analytics SAS",
            RegistrationNumber = "123456789",
            BeneficialOwnersDto = new List<BeneficialOwnerDto> { new() { FullName = "Jane Doe", OwnershipPercent = 100 } },
            DocumentStatuses = new List<DocumentStatusResponse> { new() { Type = "kbis", Status = "approved" } },
            Q1Revenue = 50000,
            Q2Revenue = 60000,
            Q3Revenue = 70000,
            Q4Revenue = 80000,
            Valuation = 3000000,
            CurrentFunds = 250000,
            TotalShares = 1000000,
            EsopPoolPercent = 10,
            EquityStructure = new List<EquityEntryDto> { new() { StakeholderName = "Jane Doe", SharesOwned = 900000 } },
            FundingAskAmount = 500000,
            FundingRoundType = "Seed",
            PreMoneyValuation = 3000000,
            EquityOfferedPercent = 15,
            CapitalAllocation = new List<CapitalAllocationDto>
            {
                new() { Category = "Product", Percent = 50 },
                new() { Category = "Go-to-market", Percent = 50 }
            },
            PitchDeckFileName = "pitch_deck_q4.pdf",
            IsDataRoomLive = true,
            IsDataRoomNdaRequired = true,
            DataRoomDocuments = new List<DataRoomDocumentResponse>
            {
                new() { DocumentId = "doc1", Title = "Cap Table", Category = "financial" },
                new() { DocumentId = "doc2", Title = "Articles of Association", Category = "legal" },
                new() { DocumentId = "doc3", Title = "Pitch Deck", Category = "pitch" }
            }
        };

        var review = await engine.RunReviewAsync(company);

        // Deterministic baseline verification
        Assert.True(review.OverallScore >= 70);
        Assert.True(review.InvestorReadyBadge);
        Assert.Equal(100, review.ScoreBreakdown.VerificationScore);
        Assert.Equal(100, review.ScoreBreakdown.FinancialScore);
        Assert.Equal(100, review.ScoreBreakdown.EquityScore);

        // Qualitative synthesis verification
        Assert.NotEmpty(review.ExecutiveSummary);
        Assert.NotEmpty(review.Strengths);
        Assert.Contains(review.Strengths, s => s.Contains("Quantum Analytics SAS"));
        Assert.True(review.PitchDeckContentAvailable);
        Assert.NotNull(review.PitchDeckAnalysis);
    }
}
