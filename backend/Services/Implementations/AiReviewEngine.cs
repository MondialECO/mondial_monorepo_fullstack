using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

/// <summary>
/// Automated Readiness Review engine.
///
/// ====================================================================
/// CURRENT MODE: deterministic rule-based scorer.
/// ====================================================================
/// This is NOT an LLM. It is NOT an "AI" model. Despite the legacy class
/// name <c>AiReviewEngine</c> (kept to avoid a churning rename across the
/// service + controller + tests), the implementation is a sum-of-features
/// scorer over real persisted Phase 2-6 data with hardcoded recommendation
/// templates. Output is deterministic — same inputs always produce the
/// same score.
///
/// The class name will be retired when the LLM provider swap below lands.
/// Until then, all user-facing copy should say "Automated Readiness Review",
/// NOT "AI Expert Review" or "AI-Generated Review".
///
/// ====================================================================
/// FUTURE LLM INTEGRATION (P1 — DO NOT WIRE YET, NO PROVIDER CREDENTIALS).
/// ====================================================================
/// When the org has Claude/OpenAI/Anthropic credentials and a budget for
/// inference, replace the body of <see cref="RunReviewAsync"/> with the
/// flow described inline below. Keep this rule-based scorer as the
/// no-credentials fallback so dev / CI runs do not require a network call.
/// </summary>
public class AiReviewEngine : IAiReviewEngine
{
    public async Task<AiReviewResponse> RunReviewAsync(Companies company)
    {
        // --- FUTURE LLM step 1: assemble a deterministic company snapshot ---
        // var snapshot = CompanySnapshotBuilder.Build(company,
        //     dataRoomDocs, kpiBaseline, capTable, fundingProfile, /* etc */);
        //
        // The snapshot should be a JSON document hashed for cache-key purposes
        // (so identical company state hits the LLM cache and is free on retry).

        // --- FUTURE LLM step 2: call the model with a structured prompt ---
        // var llmRaw = await _llmProvider.CompleteAsync(prompt, snapshot, schema);
        //
        // Use prompt caching. Pin the model id (e.g. "claude-opus-4-7") in
        // Phase7ReviewSnapshot.EngineVersion for reproducibility.

        // --- FUTURE LLM step 3: validate the JSON-schema output ---
        // var parsed = AiReviewSchemaValidator.Parse(llmRaw);
        // if (!parsed.IsValid) FALL BACK TO THE RULE-BASED SCORER below.
        //
        // Keep the deterministic fallback always available. If the model
        // returns malformed output, returns 5xx, or the org has no
        // credentials configured, run the rule-based scorer and tag the
        // snapshot EngineVersion accordingly.

        // --- CURRENT MODE: deterministic rule-based scorer ----------------
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
                InvestorReadyBadge = Phase7Requirements.MeetsBadgeThreshold(overallScore),
                Recommendations = recommendations,
                ReviewedAt = DateTime.UtcNow
            };
        });
    }

    private (int VerificationScore, int FinancialScore, int EquityScore, int FundingScore, int DataRoomScore) CalculateScores(Companies company)
    {
        // Verification — reads the Phase 2 hardened fields (BeneficialOwnersDto,
        // DocumentStatuses). The legacy lists (BeneficialOwners, Documents) are
        // never written by the current upload flow and would always be empty.
        int verificationScore = 50; // Base
        if (!string.IsNullOrEmpty(company.LegalName)) verificationScore += 10;
        if (!string.IsNullOrEmpty(company.RegistrationNumber)) verificationScore += 15;
        if (company.BeneficialOwnersDto?.Count > 0) verificationScore += 15;
        if (company.DocumentStatuses?.Count > 0) verificationScore += 10;

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
        // FUTURE LLM: replace these hardcoded templates with per-company
        // recommendation text generated from the snapshot above. Until then,
        // do NOT claim these are personalised or LLM-derived in the UI.
        var recommendations = new List<RecommendationDto>();

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
