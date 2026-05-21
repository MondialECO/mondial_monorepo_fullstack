using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

public class AiReviewEngine : IAiReviewEngine
{
    public async Task<AiReviewResponse> RunReviewAsync(Companies company)
    {
        return await Task.Run(() =>
        {
            var scores = CalculateScores(company);
            var overallScore = (scores.VerificationScore + scores.FinancialScore + scores.EquityScore + scores.FundingScore + scores.DataRoomScore) / 5;

            var recommendations = GenerateRecommendations(company, scores);

            return new AiReviewResponse
            {
                OverallScore = overallScore,
                ScoreBreakdown = new ScoreBreakdownDto
                {
                    VerificationScore = scores.VerificationScore,
                    FinancialScore = scores.FinancialScore,
                    EquityScore = scores.EquityScore,
                    FundingScore = scores.FundingScore,
                    DataRoomScore = scores.DataRoomScore,
                    OverallScore = overallScore
                },
                InvestorReadyBadge = overallScore >= 70,
                Recommendations = recommendations,
                ReviewedAt = DateTime.UtcNow
            };
        });
    }

    private (int VerificationScore, int FinancialScore, int EquityScore, int FundingScore, int DataRoomScore) CalculateScores(Companies company)
    {
        int verificationScore = 50; // Base
        if (!string.IsNullOrEmpty(company.LegalName)) verificationScore += 10;
        if (!string.IsNullOrEmpty(company.RegistrationNumber)) verificationScore += 15;
        if (company.BeneficialOwners?.Count > 0) verificationScore += 15;
        if (company.Documents?.Count > 0) verificationScore += 10;

        int financialScore = 30; // Base
        var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        if (totalRevenue > 0) financialScore += 20;
        if (totalRevenue > 100000) financialScore += 20;
        if (company.Valuation > 0) financialScore += 15;
        if (company.CurrentFunds > 0) financialScore += 15;

        int equityScore = 40; // Base
        if (company.EquityStructure?.Count > 0) equityScore += 20;
        if (company.TotalShares > 0) equityScore += 20;
        if (company.EsopPoolPercent > 0) equityScore += 20;

        int fundingScore = 30; // Base
        if (company.FundingAskAmount > 0) fundingScore += 25;
        if (!string.IsNullOrEmpty(company.FundingRoundType)) fundingScore += 20;
        if (company.CapitalAllocation?.Count > 0) fundingScore += 15;
        if (company.ResourceMap?.HiringPlan?.Count > 0) fundingScore += 10;

        int dataRoomScore = 20; // Base
        if (company.DataRoomDocuments?.Count > 0) dataRoomScore += 30;
        if (company.IsDataRoomLive) dataRoomScore += 20;
        if (company.IsDataRoomNdaRequired) dataRoomScore += 15;
        if (company.DataRoomAccessRecords?.Count > 0) dataRoomScore += 15;

        return (
            Math.Min(verificationScore, 100),
            Math.Min(financialScore, 100),
            Math.Min(equityScore, 100),
            Math.Min(fundingScore, 100),
            Math.Min(dataRoomScore, 100)
        );
    }

    private List<RecommendationDto> GenerateRecommendations(Companies company, (int V, int F, int E, int Fu, int D) scores)
    {
        var recommendations = new List<RecommendationDto>();

        // Verification recommendations
        if (scores.V < 60)
        {
            recommendations.Add(new RecommendationDto
            {
                Title = "Complete Legal Verification",
                Description = "Upload company registration documents and beneficial owner details to verify company legitimacy.",
                Priority = "high",
                PotentialPointGain = 20
            });
        }

        // Financial recommendations
        if (scores.F < 70)
        {
            recommendations.Add(new RecommendationDto
            {
                Title = "Improve Financial Documentation",
                Description = "Provide detailed quarterly revenue data and financial statements for investor confidence.",
                Priority = "high",
                PotentialPointGain = 25
            });
        }

        // Equity recommendations
        if (scores.E < 70)
        {
            recommendations.Add(new RecommendationDto
            {
                Title = "Finalize Cap Table",
                Description = "Define complete equity structure including founder stakes, investor allocations, and ESOP pool.",
                Priority = "high",
                PotentialPointGain = 20
            });
        }

        // Funding recommendations
        if (scores.Fu < 70)
        {
            recommendations.Add(new RecommendationDto
            {
                Title = "Clarify Use of Funds",
                Description = "Provide detailed breakdown of how capital will be allocated across operations, hiring, and growth.",
                Priority = "medium",
                PotentialPointGain = 25
            });
        }

        // Data room recommendations
        if (scores.D < 70)
        {
            recommendations.Add(new RecommendationDto
            {
                Title = "Set Up Investor Data Room",
                Description = "Upload key documents (pitch deck, financial models, term sheets) to demonstrate transparency.",
                Priority = "medium",
                PotentialPointGain = 30
            });
        }

        // Additional polishing
        if (scores.V + scores.F + scores.E + scores.Fu + scores.D < 350)
        {
            recommendations.Add(new RecommendationDto
            {
                Title = "Strengthen Overall Profile",
                Description = "Continue completing profile sections to increase investor confidence and match quality.",
                Priority = "medium",
                PotentialPointGain = 15
            });
        }

        return recommendations;
    }
}
