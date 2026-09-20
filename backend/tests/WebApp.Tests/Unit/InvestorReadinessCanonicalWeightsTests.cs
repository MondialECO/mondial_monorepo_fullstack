using System.Collections.Generic;
using FluentAssertions;
using MongoDB.Bson;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.DatabaseModels.Legal;
using Xunit;

namespace WebApp.Tests.Unit;

public class InvestorReadinessCanonicalWeightsTests
{
    [Fact]
    public void InvestorReadiness_Asserts_AllFiveCanonicalWeights_SumTo100()
    {
        // Canonical Weighting specification:
        // Concept Clarity:      20
        // Market Evidence:      20
        // Financial Model:      25
        // Legal Readiness:      15
        // Team Credibility:     20
        // Total:               100

        var journey = new CreatorJourney
        {
            Project = new CreatorJourneyProject
            {
                ClarityScore = 100, // ConceptClarity = (100 / 100) * 20 = 20
                TargetUser = "Enterprise small business owners", // +6 MarketEvidence
                CreatorEdge = "Deep industry domain expertise in French B2B labor law", // +14 TeamCredibility
                Branding = new CreatorBranding { BrandingMethod = "m50_designer" } // +6 TeamCredibility
            },
            Phase3Data = new CreatorPhase3Data
            {
                MarketStudySessionId = "ms_session_123", // +8 MarketEvidence (Canonical Step 3.1)
                BusinessPlanSessionId = "bp_session_123", // +6 MarketEvidence
                FormationGenerator = new CreatorFormationGenerator
                {
                    MatchedSpIds = new List<string> { "sp_1" }
                },
                LegalAssessment = new CreatorLegalAssessment
                {
                    PlanningReadinessPct = 100 // +15 LegalReadiness
                }
            }
        };

        var forecast = new ForecastSession
        {
            Inputs = new ForecastInputs
            {
                Tam = 500_000_000, // > 100M => +8 MarketEvidence
                Arpu = 100,
                MonthlyChurnPct = 3.0 // LTV = 100/0.03 = 3333, CAC = 300, LTV/CAC = 11.1 >= 3.0 => +7 FinancialModel
            },
            Versions = new List<ForecastVersion>
            {
                new ForecastVersion
                {
                    Version = 1,
                    Content = new BsonDocument
                    {
                        { "breakEvenAnalysis", new BsonDocument { { "breakEvenMonth", 14 } } } // <= 24 => +8 FinancialModel
                    }
                }
            }
        };

        var score = CreatorPhase3Controller.ComputeReadiness(journey, forecast);

        // 1. Assert individual dimensions match canonical weights
        score.Breakdown.ConceptClarity.Should().Be(20.0, "Concept Clarity weight must be exactly 20 points");
        score.Breakdown.MarketEvidence.Should().Be(20.0, "Market Evidence weight must be exactly 20 points");
        score.Breakdown.FinancialModel.Should().Be(25.0, "Financial Model weight must be exactly 25 points");
        score.Breakdown.LegalReadiness.Should().Be(15.0, "Legal Readiness weight must be exactly 15 points");
        score.Breakdown.TeamCredibility.Should().Be(20.0, "Team Credibility weight must be exactly 20 points");

        // 2. Assert total sums to 100
        score.Total.Should().Be(100.0, "Total aggregated readiness score must be exactly 100 points");
        score.Label.Should().Be("Investor-Ready");
        score.Deductions.Should().BeEmpty("100% readiness should have zero deductions");
    }

    [Fact]
    public void InvestorReadiness_ConceptClarity_ScalesLinearlyWithClarityScore()
    {
        var journey = new CreatorJourney
        {
            Project = new CreatorJourneyProject { ClarityScore = 50 } // 50% of 20 = 10 points
        };

        var score = CreatorPhase3Controller.ComputeReadiness(journey, null);
        score.Breakdown.ConceptClarity.Should().Be(10.0);
    }

    [Fact]
    public void InvestorReadiness_FinancialModel_DisaggregatesBaseBreakevenAndUnitEconomics()
    {
        // Baseline: Forecast session present gives base +10
        var forecast = new ForecastSession
        {
            Inputs = new ForecastInputs { Arpu = 0 }, // no valid ARPU -> LTV/CAC +0
            Versions = new List<ForecastVersion>() // no breakeven doc -> breakeven +0
        };

        var journey = new CreatorJourney();
        var score = CreatorPhase3Controller.ComputeReadiness(journey, forecast);

        score.Breakdown.FinancialModel.Should().Be(10.0, "Forecast alone awards baseline 10 points of 25");

        // Adding Breakeven <= 24 adds +8
        forecast.Versions.Add(new ForecastVersion
        {
            Version = 1,
            Content = new BsonDocument
            {
                { "breakEvenAnalysis", new BsonDocument { { "breakEvenMonth", 18 } } }
            }
        });
        var scoreWithBe = CreatorPhase3Controller.ComputeReadiness(journey, forecast);
        scoreWithBe.Breakdown.FinancialModel.Should().Be(18.0, "Forecast + Breakeven <= 24 awards 18 points");

        // Adding healthy LTV/CAC adds +7
        forecast.Inputs.Arpu = 50;
        forecast.Inputs.MonthlyChurnPct = 2.5; // LTV/CAC = 1 / (3 * 0.025) = 13.3 >= 3.0
        var scoreFullFin = CreatorPhase3Controller.ComputeReadiness(journey, forecast);
        scoreFullFin.Breakdown.FinancialModel.Should().Be(25.0, "Full financial model awards 25 points");
    }

    [Fact]
    public void InvestorReadiness_LegalReadiness_WeightIs15Percent()
    {
        var journey = new CreatorJourney
        {
            Phase3Data = new CreatorPhase3Data
            {
                LegalAssessment = new CreatorLegalAssessment
                {
                    PlanningReadinessPct = 60 // 60% of 15 = 9.0 points
                }
            }
        };

        var score = CreatorPhase3Controller.ComputeReadiness(journey, null);
        score.Breakdown.LegalReadiness.Should().Be(9.0);
    }

    [Fact]
    public void InvestorReadiness_MarketStudyMissing_ForecastExists_DeductsMarketScore_AndRoutesToStep31()
    {
        // P3-AUDIT-005 Regression: Forecast exists with large TAM, but Step 3.1 Market Study is missing
        var journey = new CreatorJourney
        {
            Project = new CreatorJourneyProject
            {
                TargetUser = "Enterprise small business owners" // +6
            },
            Phase3Data = new CreatorPhase3Data
            {
                MarketStudySessionId = null, // Missing!
                BusinessPlanSessionId = "bp_session_123" // +6
            }
        };

        var forecast = new ForecastSession
        {
            Inputs = new ForecastInputs { Tam = 1_000_000_000 }
        };

        var score = CreatorPhase3Controller.ComputeReadiness(journey, forecast);

        // Market evidence must NOT use Forecast TAM to award 8 points
        score.Breakdown.MarketEvidence.Should().Be(12.0, "Missing market study should withhold 8 points even if Forecast exists");
        score.Deductions.Should().Contain(d =>
            d.Dimension == "MarketEvidence" &&
            d.PointsLost == 8 &&
            d.RemediationRoute == "/dashboard/creator/phase-3/market-study");
    }

    [Fact]
    public void InvestorReadiness_MarketStudyExists_ForecastMissing_EvaluatesIndependently()
    {
        // P3-AUDIT-005 Regression: Market Study completed, Forecast not yet created
        var journey = new CreatorJourney
        {
            Project = new CreatorJourneyProject
            {
                TargetUser = "SMBs" // +6
            },
            Phase3Data = new CreatorPhase3Data
            {
                MarketStudySessionId = "ms_session_completed", // +8
                BusinessPlanSessionId = null
            }
        };

        var score = CreatorPhase3Controller.ComputeReadiness(journey, null);

        score.Breakdown.MarketEvidence.Should().Be(14.0, "Market study (+8) and TargetUser (+6) evaluate independently of Forecast");
        score.Deductions.Should().NotContain(d => d.Issue.Contains("Market sizing"));
    }
}
