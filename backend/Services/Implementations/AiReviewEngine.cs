using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Ai.Providers;

namespace WebApp.Services.Implementations;

/// <summary>
/// AI Expert Review Engine for Phase 7.
/// Combines deterministic platform evidence with qualitative intelligence,
/// cross-module inconsistency detection, gap analysis, and pitch refinement.
/// </summary>
public class AiReviewEngine : IAiReviewEngine
{
    private readonly MongoDbContext? _dbContext;
    private readonly IAiProvider? _aiProvider;
    private readonly ILogger<AiReviewEngine> _logger;

    public const string EngineVersion = "expert_intelligence_v1";

    public AiReviewEngine(
        MongoDbContext dbContext,
        IAiProvider? aiProvider = null,
        ILogger<AiReviewEngine>? logger = null)
    {
        _dbContext = dbContext;
        _aiProvider = aiProvider;
        _logger = logger ?? NullLogger<AiReviewEngine>.Instance;
    }

    public AiReviewEngine()
    {
        _dbContext = null;
        _aiProvider = null;
        _logger = NullLogger<AiReviewEngine>.Instance;
    }

    public async Task<AiReviewResponse> RunReviewAsync(Companies company)
    {
        // 1. Calculate deterministic platform baseline scores (authoritative)
        var scores = CalculateScores(company);
        var overallScore = (scores.VerificationScore + scores.FinancialScore + scores.EquityScore + scores.FundingScore + scores.DataRoomScore) / 5;

        var recommendations = GenerateRecommendations(company, scores);
        var pitchDeckAnalysis = CalculatePitchDeckAnalysis(scores);

        // 2. Build structured expert review context
        Phase7ExpertReviewContext? context = null;
        if (_dbContext != null)
        {
            try
            {
                var builder = new Phase7ExpertReviewContextBuilder(_dbContext);
                context = await builder.BuildContextAsync(company);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to build full Phase 7 context; falling back to company document state.");
            }
        }

        // 3. Deterministic cross-module inconsistency detection
        var inconsistencies = CrossModuleInconsistencyDetector.DetectInconsistencies(company);

        // 4. Synthesize qualitative intelligence (Strengths, Weaknesses, Risks, Gaps, Pitch Refinements, Actions, Matching Intelligence)
        var qualitative = SynthesizeQualitativeReview(company, scores, overallScore, inconsistencies, context, pitchDeckAnalysis);

        // 5. LLM Qualitative Enrichment (if AI provider is configured)
        if (_aiProvider != null)
        {
            try
            {
                // Optional LLM enrichment can augment qualitative narrative
                var prompt = $"Analyze company {company.CompanyName} ({company.Industry}) seeking {company.FundingAskAmount:C} at {company.PreMoneyValuation:C} valuation.";
                var request = new AiCompletionRequest
                {
                    Model = "openai/gpt-4o-mini",
                    Messages = new List<AiMessage>
                    {
                        new("system", "You are an expert venture capital investment committee reviewer."),
                        new("user", prompt)
                    },
                    MaxTokens = 500,
                    Temperature = 0.2
                };
                var completion = await _aiProvider.CompleteAsync(request);
                if (!string.IsNullOrWhiteSpace(completion?.Text))
                {
                    qualitative.ExecutiveSummary += " " + completion.Text.Trim();
                }
            }
            catch (Exception ex)
            {
                _logger.LogInformation("LLM qualitative enrichment skipped or unavailable ({Message}). Using deterministic synthesis baseline.", ex.Message);
            }
        }

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
            PitchDeckAnalysis = pitchDeckAnalysis,
            ReviewedAt = DateTime.UtcNow,
            ExecutiveSummary = qualitative.ExecutiveSummary,
            Strengths = qualitative.Strengths,
            Weaknesses = qualitative.Weaknesses,
            Risks = qualitative.Risks,
            Inconsistencies = inconsistencies,
            MissingItems = qualitative.MissingItems,
            PitchRecommendations = qualitative.PitchRecommendations,
            ActionItems = qualitative.ActionItems,
            PitchDeckContentAvailable = !string.IsNullOrWhiteSpace(company.PitchDeckFileName)
        };
    }

    private (int VerificationScore, int FinancialScore, int EquityScore, int FundingScore, int DataRoomScore) CalculateScores(Companies company)
    {
        int verificationScore = 50;
        if (!string.IsNullOrEmpty(company.LegalName)) verificationScore += 10;
        if (!string.IsNullOrEmpty(company.RegistrationNumber)) verificationScore += 15;
        if (company.BeneficialOwnersDto?.Count > 0) verificationScore += 15;
        if (company.DocumentStatuses?.Count > 0) verificationScore += 10;

        int financialScore = 30;
        var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        if (totalRevenue > 0) financialScore += 20;
        if (totalRevenue > 100000) financialScore += 20;
        if (company.Valuation > 0) financialScore += 15;
        if (company.CurrentFunds > 0) financialScore += 15;

        int equityScore = 40;
        if (company.EquityStructure?.Count > 0) equityScore += 20;
        if (company.TotalShares > 0) equityScore += 20;
        if (company.EsopPoolPercent > 0) equityScore += 20;

        int fundingScore = 30;
        if (company.FundingAskAmount > 0) fundingScore += 25;
        if (!string.IsNullOrEmpty(company.FundingRoundType)) fundingScore += 20;
        if (company.CapitalAllocation?.Count > 0) fundingScore += 15;
        if (company.ResourceMap?.HiringPlan?.Count > 0) fundingScore += 10;

        int dataRoomScore = 20;
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

    private PitchDeckAnalysisDto CalculatePitchDeckAnalysis((int VerificationScore, int FinancialScore, int EquityScore, int FundingScore, int DataRoomScore) scores)
    {
        var clarityNarrative = (scores.VerificationScore + scores.FundingScore) / 2 / 10;
        var marketSizeProof = scores.FundingScore / 10;
        var tractionMetrics = scores.FinancialScore / 10;
        var teamPedigree = (scores.VerificationScore + scores.EquityScore) / 2 / 10;

        var averageScore = (clarityNarrative + marketSizeProof + tractionMetrics + teamPedigree) / 4;

        var grade = averageScore switch
        {
            >= 9 => "A+",
            >= 8 => "A",
            >= 7 => "B+",
            >= 6 => "B",
            >= 5 => "C+",
            _ => "C"
        };

        return new PitchDeckAnalysisDto
        {
            Grade = grade,
            AverageScore = averageScore,
            ClarityNarrative = clarityNarrative,
            MarketSizeProof = marketSizeProof,
            TractionMetrics = tractionMetrics,
            TeamPedigree = teamPedigree
        };
    }

    private (
        string ExecutiveSummary,
        List<string> Strengths,
        List<string> Weaknesses,
        List<ExpertRiskItem> Risks,
        List<MissingItemGap> MissingItems,
        List<PitchRefinementItem> PitchRecommendations,
        List<ActionRemediationItem> ActionItems,
        Phase7MatchingIntelligence MatchingIntelligence
    ) SynthesizeQualitativeReview(
        Companies company,
        (int V, int F, int E, int Fu, int D) scores,
        int overallScore,
        List<CrossModuleInconsistency> inconsistencies,
        Phase7ExpertReviewContext? context,
        PitchDeckAnalysisDto? pitchDeckAnalysis = null)
    {
        var strengths = new List<string>();
        var weaknesses = new List<string>();
        var risks = new List<ExpertRiskItem>();
        var missingItems = new List<MissingItemGap>();
        var pitchRecs = new List<PitchRefinementItem>();
        var actionItems = new List<ActionRemediationItem>();

        // 1. Strengths
        if (!string.IsNullOrWhiteSpace(company.LegalName) && !string.IsNullOrWhiteSpace(company.RegistrationNumber))
        {
            var entityDesc = !string.IsNullOrWhiteSpace(company.LegalStructure)
                ? $"{company.LegalName} ({company.LegalStructure}, {company.Country})"
                : $"{company.LegalName} ({company.Country})";
            strengths.Add($"Corporate entity established and registered: {entityDesc}.");
        }
        if (scores.F >= 60)
            strengths.Add("Commercial financial track record recorded with positive quarterly performance.");
        if (company.EsopPoolPercent > 0)
            strengths.Add($"Governance includes a {company.EsopPoolPercent:F1}% ESOP allocation for talent retention.");
        if (company.IsDataRoomLive && company.DataRoomDocuments?.Count > 0)
            strengths.Add($"Secure investor Data Room active with {company.DataRoomDocuments.Count} documents published.");
        if (company.FundingAskAmount > 0 && company.CapitalAllocation?.Count > 0)
            strengths.Add($"Clear fundraising structure: EUR {company.FundingAskAmount:N0} target with itemized capital allocation.");

        if (strengths.Count == 0)
            strengths.Add("Company workspace initialized with primary venture baseline.");

        // 2. Weaknesses
        var totalRev = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        if (totalRev <= 0)
            weaknesses.Add("No actual operating revenue recorded yet on file.");
        if (string.IsNullOrWhiteSpace(company.PitchDeckFileName))
            weaknesses.Add("Pitch deck document has not been uploaded to the company repository.");
        if (company.CapitalAllocation == null || company.CapitalAllocation.Count == 0)
            weaknesses.Add("Use of funds / capital allocation breakdown is missing.");
        if (company.DataRoomDocuments == null || company.DataRoomDocuments.Count < 3)
            weaknesses.Add("Data Room has limited documentation (< 3 documents on file).");
        if (string.IsNullOrWhiteSpace(company.FundingNarrative) || company.FundingNarrative.Length < 200)
            weaknesses.Add("Funding narrative is brief or missing detailed investment rationale.");

        if (pitchDeckAnalysis != null)
        {
            if (pitchDeckAnalysis.TractionMetrics < 8)
                weaknesses.Add($"Traction evidence is limited ({pitchDeckAnalysis.TractionMetrics}/10); consider adding customer validation and verified growth metrics.");
            if (pitchDeckAnalysis.MarketSizeProof < 8)
                weaknesses.Add($"Market size proof can be strengthened ({pitchDeckAnalysis.MarketSizeProof}/10) with verified TAM/SAM/SOM sources.");
            if (pitchDeckAnalysis.ClarityNarrative < 8)
                weaknesses.Add($"Pitch narrative clarity ({pitchDeckAnalysis.ClarityNarrative}/10) can be refined for institutional investor readiness.");
            if (pitchDeckAnalysis.TeamPedigree < 8)
                weaknesses.Add($"Team profile ({pitchDeckAnalysis.TeamPedigree}/10) can be enhanced with advisory board and key operator details.");
        }

        if (scores.V < 70 && !weaknesses.Any(w => w.Contains("registration", StringComparison.OrdinalIgnoreCase) || w.Contains("entity", StringComparison.OrdinalIgnoreCase)))
            weaknesses.Add("Corporate verification has pending documents or incomplete registry details.");
        if (scores.F < 70 && totalRev > 0)
            weaknesses.Add("Financial metrics show thin margins or incomplete quarterly track record.");
        if (scores.E < 70)
            weaknesses.Add("Cap table structure has unallocated founder shares or missing pool allocations.");
        if (scores.Fu < 70 && company.FundingAskAmount > 0)
            weaknesses.Add("Funding terms or valuation justification require additional market comparables.");
        if (scores.D < 70 && (company.DataRoomDocuments?.Count ?? 0) >= 3)
            weaknesses.Add("Data Room requires essential legal/financial agreements before due diligence.");

        // 3. Risks
        if (inconsistencies.Count > 0)
        {
            foreach (var inc in inconsistencies)
            {
                risks.Add(new ExpertRiskItem
                {
                    Category = "Financial Inconsistency",
                    Severity = inc.Severity,
                    Title = inc.Description,
                    Explanation = $"Cross-module verification between {inc.ModuleA} and {inc.ModuleB} detected a material discrepancy.",
                    Evidence = inc.Evidence,
                    RecommendedAction = "Review and harmonize figures across the relevant phase forms."
                });
            }
        }

        if (company.PreMoneyValuation > 5000000 && totalRev < 100000)
        {
            risks.Add(new ExpertRiskItem
            {
                Category = "Valuation Justification",
                Severity = "HIGH",
                Title = "High Valuation Multiple vs Revenue",
                Explanation = "Pre-money valuation reflects aggressive forward growth assumptions relative to current actual traction.",
                Evidence = $"Pre-Money Valuation: EUR {company.PreMoneyValuation:N0} | Recorded Annual Revenue: EUR {totalRev:N0}",
                RecommendedAction = "Include market comparables and traction metrics in Phase 3 concept overview."
            });
        }

        if (company.EquityOfferedPercent.HasValue && company.EquityOfferedPercent.Value > 30)
        {
            risks.Add(new ExpertRiskItem
            {
                Category = "Dilution",
                Severity = "MEDIUM",
                Title = "High Round Dilution",
                Explanation = $"Offering {company.EquityOfferedPercent:F1}% equity in a single round may leave inadequate equity for future funding rounds.",
                Evidence = $"Equity Offered: {company.EquityOfferedPercent:F1}%",
                RecommendedAction = "Consider right-sizing the round ask or structuring in tranches in Phase 5."
            });
        }

        // 4. Missing Items
        if (string.IsNullOrWhiteSpace(company.PitchDeckFileName))
            missingItems.Add(new MissingItemGap { Category = "Pitch Deck", Description = "Investor Pitch Deck PDF", RequiredBy = "Phase 5 Funding Ask & Phase 6 Data Room" });
        if (company.BeneficialOwnersDto == null || company.BeneficialOwnersDto.Count == 0)
            missingItems.Add(new MissingItemGap { Category = "Governance", Description = "Beneficial Ownership Register", RequiredBy = "Phase 2 Legal Verification" });
        if (company.ResourceMap?.HiringPlan == null || company.ResourceMap.HiringPlan.Count == 0)
            missingItems.Add(new MissingItemGap { Category = "Operations", Description = "Key Personnel Hiring Plan", RequiredBy = "Phase 5 Resource Mapping" });

        // 5. Pitch Refinements
        pitchRecs.Add(new PitchRefinementItem
        {
            Section = "Market Opportunity & TAM",
            Problem = "Market sizing needs explicit bottom-up proof points alongside top-down industry estimates.",
            Recommendation = "Detail SAM and SOM metrics derived from target customer segment calculations.",
            Priority = "high"
        });
        pitchRecs.Add(new PitchRefinementItem
        {
            Section = "Use of Funds & Milestones",
            Problem = "Milestone targets should be tied directly to capital deployment tranches.",
            Recommendation = "State the exact 12-month KPI milestones unlocked by the requested raise amount.",
            Priority = "medium"
        });

        // 6. Action Items mapped to Phases
        if (scores.V < 70)
            actionItems.Add(new ActionRemediationItem { PhaseNumber = 2, Title = "Update Legal Documents", Description = "Upload SIRET registration and owner identity records.", Priority = "high", PotentialPointGain = 15 });
        if (scores.F < 70)
            actionItems.Add(new ActionRemediationItem { PhaseNumber = 3, Title = "Record Live Financials", Description = "Provide quarterly revenue entries and update cash burn metrics.", Priority = "high", PotentialPointGain = 20 });
        if (scores.E < 70)
            actionItems.Add(new ActionRemediationItem { PhaseNumber = 4, Title = "Reconcile Cap Table", Description = "Verify 100% share allocation and ESOP pool parameters.", Priority = "medium", PotentialPointGain = 15 });
        if (scores.Fu < 70)
            actionItems.Add(new ActionRemediationItem { PhaseNumber = 5, Title = "Refine Funding Ask", Description = "Balance capital allocation and expand investment narrative.", Priority = "high", PotentialPointGain = 20 });
        if (scores.D < 70)
            actionItems.Add(new ActionRemediationItem { PhaseNumber = 6, Title = "Publish Data Room", Description = "Upload essential documents across legal, financial, and IP categories.", Priority = "medium", PotentialPointGain = 25 });

        // 7. Matching Intelligence
        var sectorTags = new List<string>();
        if (!string.IsNullOrWhiteSpace(company.Industry)) sectorTags.Add(company.Industry);
        if (!string.IsNullOrWhiteSpace(company.Country)) sectorTags.Add(company.Country);

        var matchingIntel = new Phase7MatchingIntelligence
        {
            ValidatedSectorTags = sectorTags,
            BusinessModelTags = new List<string> { company.Industry ?? "B2B SaaS", "Growth Venture" },
            RiskBand = overallScore >= 75 ? "Low" : overallScore >= 50 ? "Moderate" : "Elevated",
            FundingFitSignals = new List<string> { company.FundingRoundType ?? "seed", $"Ask ~ EUR {company.FundingAskAmount:N0}" },
            RecommendedInvestorTypes = new List<string> { "Venture Capital", "Angel Syndicate", "Strategic Industry Fund" },
            QualitativeStrengthTags = strengths.Take(3).ToList()
        };

        var execSummary = $"Automated readiness review for {company.CompanyName ?? "the venture"} scores {overallScore}/100 across 5 verified dimensions. " +
            (overallScore >= 70
                ? "The company satisfies core investor-readiness criteria with verified platform evidence. Review recommendations to maximize matching suitability."
                : "Key documentation and operational baselines require completion before investor outreach.");

        return (execSummary, strengths, weaknesses, risks, missingItems, pitchRecs, actionItems, matchingIntel);
    }
}
