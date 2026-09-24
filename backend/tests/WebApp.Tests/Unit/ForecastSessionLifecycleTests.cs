using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class ForecastSessionLifecycleTests
{
    private readonly Mock<IForecastSessionStore> _sessions = new();
    private readonly Mock<ICreatorIdeaStore> _ideas = new();
    private readonly Mock<IMarketStudySessionStore> _marketStudies = new();
    private readonly Mock<IBusinessModelSessionStore> _businessModels = new();

    private FinancialAssumptionsService Service() =>
        new(_sessions.Object, _ideas.Object, _marketStudies.Object, _businessModels.Object, NullLogger<FinancialAssumptionsService>.Instance);

    #region Requirement 1: Completed Forecast Detection

    [Fact]
    public void CompletedForecastDetection_SessionWithInputsOnly_ReturnsFalse()
    {
        var session = new ForecastSession
        {
            Id = "session-inputs-only",
            Status = "Pending",
            Inputs = new ForecastInputs
            {
                StartingBudget = 50000,
                LaunchSubscribers = 100,
                Arpu = 30
            },
            Versions = new List<ForecastVersion>()
        };

        session.HasValidCompletedForecast().Should().BeFalse();
    }

    [Fact]
    public void CompletedForecastDetection_FailedOrIncompleteVersion_ReturnsFalse()
    {
        var session = new ForecastSession
        {
            Id = "session-failed",
            Status = "Failed",
            CurrentVersion = 1,
            Inputs = new ForecastInputs { StartingBudget = 25000 },
            Versions = new List<ForecastVersion>
            {
                new()
                {
                    Version = 1,
                    Content = null,
                    GeneratedContent = null
                }
            }
        };

        session.HasValidCompletedForecast().Should().BeFalse();
    }

    [Fact]
    public void CompletedForecastDetection_CompletedVersionWithNullOutput_ReturnsFalse()
    {
        var session = new ForecastSession
        {
            Id = "session-null-output",
            Status = "Completed",
            CurrentVersion = 1,
            Inputs = new ForecastInputs { StartingBudget = 25000 },
            Versions = new List<ForecastVersion>
            {
                new()
                {
                    Version = 1,
                    Content = null,
                    GeneratedContent = null
                }
            }
        };

        session.HasValidCompletedForecast().Should().BeFalse();
    }

    [Fact]
    public void CompletedForecastDetection_ValidCompletedVersion_ReturnsTrue()
    {
        var validRevMonthly = new BsonArray();
        var validCostMonthly = new BsonArray();
        for (int m = 1; m <= 12; m++)
        {
            validRevMonthly.Add(new BsonDocument { ["month"] = m, ["amount"] = m * 1000.0 });
            validCostMonthly.Add(new BsonDocument { ["month"] = m, ["fixedCosts"] = 2000.0, ["variableCosts"] = 500.0 });
        }

        var content = new BsonDocument
        {
            ["revenueForecast"] = new BsonDocument { ["monthly"] = validRevMonthly },
            ["costForecast"] = new BsonDocument { ["monthly"] = validCostMonthly }
        };

        var session = new ForecastSession
        {
            Id = "session-valid",
            Status = "Completed",
            CurrentVersion = 1,
            Inputs = new ForecastInputs { StartingBudget = 25000 },
            Versions = new List<ForecastVersion>
            {
                new()
                {
                    Version = 1,
                    Content = content
                }
            }
        };

        session.HasValidCompletedForecast().Should().BeTrue();
        session.GetLatestValidCompletedVersion().Should().NotBeNull();
        session.GetLatestValidCompletedVersion()!.Version.Should().Be(1);
    }

    [Fact]
    public void CompletedForecastDetection_Version3CompletedAndVersion4Failed_ReturnsTrueAndResolvesVersion3()
    {
        var validRevMonthly = new BsonArray();
        var validCostMonthly = new BsonArray();
        for (int m = 1; m <= 12; m++)
        {
            validRevMonthly.Add(new BsonDocument { ["month"] = m, ["amount"] = m * 1000.0 });
            validCostMonthly.Add(new BsonDocument { ["month"] = m, ["fixedCosts"] = 2000.0, ["variableCosts"] = 500.0 });
        }

        var validContent = new BsonDocument
        {
            ["revenueForecast"] = new BsonDocument { ["monthly"] = validRevMonthly },
            ["costForecast"] = new BsonDocument { ["monthly"] = validCostMonthly }
        };

        var session = new ForecastSession
        {
            Id = "session-v3-completed-v4-failed",
            Status = "Failed",
            CurrentVersion = 4,
            Inputs = new ForecastInputs { StartingBudget = 50000 },
            Versions = new List<ForecastVersion>
            {
                new() { Version = 1, Content = validContent },
                new() { Version = 2, Content = validContent },
                new() { Version = 3, Content = validContent },
                new() { Version = 4, Content = null, GeneratedContent = null } // Failed run
            }
        };

        session.HasValidCompletedForecast().Should().BeTrue();
        var latestValid = session.GetLatestValidCompletedVersion();
        latestValid.Should().NotBeNull();
        latestValid!.Version.Should().Be(3);
    }

    [Fact]
    public void CompletedForecastDetection_Version3CompletedAndVersion4Processing_ReturnsTrueAndResolvesVersion3()
    {
        var validRevMonthly = new BsonArray();
        var validCostMonthly = new BsonArray();
        for (int m = 1; m <= 12; m++)
        {
            validRevMonthly.Add(new BsonDocument { ["month"] = m, ["amount"] = m * 1000.0 });
            validCostMonthly.Add(new BsonDocument { ["month"] = m, ["fixedCosts"] = 2000.0, ["variableCosts"] = 500.0 });
        }

        var validContent = new BsonDocument
        {
            ["revenueForecast"] = new BsonDocument { ["monthly"] = validRevMonthly },
            ["costForecast"] = new BsonDocument { ["monthly"] = validCostMonthly }
        };

        var session = new ForecastSession
        {
            Id = "session-v3-completed-v4-processing",
            Status = "Processing",
            CurrentVersion = 4,
            Inputs = new ForecastInputs { StartingBudget = 50000 },
            Versions = new List<ForecastVersion>
            {
                new() { Version = 1, Content = validContent },
                new() { Version = 2, Content = validContent },
                new() { Version = 3, Content = validContent },
                new() { Version = 4, Content = null } // Currently in flight
            }
        };

        session.HasValidCompletedForecast().Should().BeTrue();
        var latestValid = session.GetLatestValidCompletedVersion();
        latestValid.Should().NotBeNull();
        latestValid!.Version.Should().Be(3);
    }

    [Fact]
    public void CompletedForecastDetection_OnlyFailedVersion1_ReturnsFalseAndResolvesNull()
    {
        var session = new ForecastSession
        {
            Id = "session-v1-failed",
            Status = "Failed",
            CurrentVersion = 1,
            Inputs = new ForecastInputs { StartingBudget = 50000 },
            Versions = new List<ForecastVersion>
            {
                new() { Version = 1, Content = null, GeneratedContent = null }
            }
        };

        session.HasValidCompletedForecast().Should().BeFalse();
        session.GetLatestValidCompletedVersion().Should().BeNull();
    }

    #endregion

    #region Requirement 2: Missing vs Zero Semantics

    [Fact]
    public async Task MissingVsZero_ZeroValues_AreExplicitNumericValues_NotMissing()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs()
        };

        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        // Founder explicitly confirms 0 starting budget (bootstrapping), 0 launch subscribers, 0 growth, 0 churn
        var update = new UpdateFinancialAssumptionsDto
        {
            StartingBudget = 0,
            LaunchSubscribers = 0,
            MonthlyGrowthPct = 0,
            MonthlyChurnPct = 0,
            Arpu = 0,
            VariableCost = 0,
            Opex = 0
        };

        var updated = await Service().UpdateFounderAssumptionsAsync(ideaId, "user-1", update);

        // 0 must NOT be converted to missing/null
        updated.Inputs!.StartingBudget.Should().Be(0);
        updated.Inputs.LaunchSubscribers.Should().Be(0);
        updated.Inputs.MonthlyGrowthPct.Should().Be(0);
        updated.Inputs.MonthlyChurnPct.Should().Be(0);
        updated.Inputs.Arpu.Should().Be(0);
        updated.Inputs.VariableCost.Should().Be(0);
        updated.Inputs.Opex.Should().Be(0);

        // NeedsFounderInput must be false because explicit 0 was provided
        updated.Inputs.NeedsFounderInput!["startingBudget"].Should().BeFalse();
        updated.Inputs.NeedsFounderInput["launchSubscribers"].Should().BeFalse();
        updated.Inputs.NeedsFounderInput["monthlyGrowthPct"].Should().BeFalse();
        updated.Inputs.NeedsFounderInput["monthlyChurnPct"].Should().BeFalse();
        updated.Inputs.NeedsFounderInput["arpu"].Should().BeFalse();
        updated.Inputs.NeedsFounderInput["variableCost"].Should().BeFalse();
        updated.Inputs.NeedsFounderInput["opex"].Should().BeFalse();
    }

    [Fact]
    public async Task MissingVsZero_NullValues_RemainMissing_AndFlagNeedsFounderInput()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var session = new ForecastSession
        {
            Id = "session-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs()
        };

        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetOwnedAsync("session-1", "user-1")).ReturnsAsync(session);

        // Pass empty update without explicit values
        var update = new UpdateFinancialAssumptionsDto();

        var updated = await Service().UpdateFounderAssumptionsAsync(ideaId, "user-1", update);

        updated.Inputs!.StartingBudget.Should().BeNull();
        updated.Inputs.LaunchSubscribers.Should().BeNull();
        updated.Inputs.MonthlyGrowthPct.Should().BeNull();
        updated.Inputs.MonthlyChurnPct.Should().BeNull();
        updated.Inputs.Arpu.Should().BeNull();
        updated.Inputs.VariableCost.Should().BeNull();
        updated.Inputs.Opex.Should().BeNull();
    }

    [Fact]
    public void FinancialForecastEngine_ZeroVsNull_BehavesExplicitly()
    {
        // 0 starting budget means Month 1 opening cash is 0
        var inputsZeroBudget = new ForecastInputs
        {
            BusinessModelType = "saas",
            StartingBudget = 0,
            LaunchSubscribers = 10,
            Arpu = 100,
            Opex = 5000,
            VariableCost = 10,
            MonthlyGrowthPct = 0,
            MonthlyChurnPct = 0
        };

        var calcZero = FinancialForecastEngine.Calculate(inputsZeroBudget);
        calcZero.Monthly[0].OpeningCash.Should().Be(0);
        // Revenue = 10 * 100 = 1000. Total Cost = 5000 + 100 = 5100. Net Cash Flow = -4100. Ending cash = -4100.
        calcZero.Monthly[0].EndingCash.Should().Be(-4100);
        calcZero.RunwayExhaustionMonth.Should().Be(1);

        // 0 growth means units stay flat across 36 months
        calcZero.Monthly[35].Units.Should().Be(10);
    }

    #endregion

    #region Requirement 5: End-to-End Lifecycle Test

    [Fact]
    public async Task CanonicalLifecycle_Step31_Step32_FounderEdit_ForecastGeneration_Step32Regeneration_TAMProtection()
    {
        var ideaId = ObjectId.GenerateNewId().ToString();
        var idea = new CreatorIdea
        {
            Id = ideaId,
            UserId = "user-1",
            Project = new CreatorJourneyProject
            {
                Name = "HealthTrack",
                Solution = "Wearable Health Analytics Platform",
                Sector = "HealthTech SaaS"
            }
        };

        // Shared ForecastSession (SINGLE SOURCE OF TRUTH: no duplicate sessions)
        var session = new ForecastSession
        {
            Id = "session-lifecycle-1",
            OwnerUserId = "user-1",
            BusinessIdeaId = ideaId,
            Inputs = new ForecastInputs()
        };

        _ideas.Setup(x => x.GetOwnedAsync(ideaId, "user-1")).ReturnsAsync(idea);
        _sessions.Setup(x => x.GetByIdeaAsync(ideaId, "user-1")).ReturnsAsync(session);
        _sessions.Setup(x => x.GetOwnedAsync("session-lifecycle-1", "user-1")).ReturnsAsync(session);

        // Phase A: Step 3.1 generated -> partial assumptions created in ForecastSession.Inputs
        var step31Content = new BsonDocument
        {
            ["marketSizing"] = new BsonDocument
            {
                ["tam"] = new BsonDocument { ["value"] = 800000000.0 },
                ["som"] = new BsonDocument { ["growthRate"] = 15.0 }
            }
        };

        var afterStep31 = await Service().UpdateFromMarketStudyAsync(ideaId, "user-1", step31Content, 1);

        afterStep31.Inputs.Should().NotBeNull();
        afterStep31.Inputs!.Tam.Should().Be(800000000.0);
        afterStep31.Inputs.Provenance!["tam"].Should().Be("upstream_market");
        afterStep31.Inputs.MonthlyGrowthPct.Should().Be(15.0);
        afterStep31.Inputs.Provenance["monthlyGrowthPct"].Should().Be("upstream_market");

        // Phase B: Step 3.2 generated -> SAME ForecastSession.Inputs enriched
        var step32Content = new BsonDocument
        {
            ["unitEconomics"] = new BsonDocument
            {
                ["arpu"] = new BsonDocument { ["amount"] = 49.0 },
                ["margins"] = new BsonDocument { ["grossMarginPct"] = 80.0 }
            },
            ["canvas"] = new BsonDocument
            {
                ["costStructure"] = new BsonDocument { ["type"] = "lean digital cloud operation" }
            }
        };

        var afterStep32 = await Service().UpdateFromBusinessModelAsync(ideaId, "user-1", step32Content, 1);

        afterStep32.Inputs.Should().BeSameAs(session.Inputs); // Same session inputs, no duplicate
        afterStep32.Inputs.Tam.Should().Be(800000000.0); // TAM unchanged
        afterStep32.Inputs.Arpu.Should().Be(49.0);
        afterStep32.Inputs.Provenance!["arpu"].Should().Be("upstream_business_model");
        afterStep32.Inputs.VariableCost.Should().Be(9.8); // 49 * (1 - 0.8)
        afterStep32.Inputs.Provenance["variableCost"].Should().Be("upstream_business_model");
        afterStep32.Inputs.Opex.Should().Be(5000.0);
        afterStep32.Inputs.Provenance["opex"].Should().Be("upstream_business_model");

        // Phase C: Step 3.3 opened -> Founder edits one editable assumption (launchSubscribers)
        var founderEdit = new UpdateFinancialAssumptionsDto
        {
            LaunchSubscribers = 250,
            Provenance = new Dictionary<string, string> { ["launchSubscribers"] = "founder_edited" }
        };

        var afterFounderEdit = await Service().UpdateFounderAssumptionsAsync(ideaId, "user-1", founderEdit);

        afterFounderEdit.Inputs!.LaunchSubscribers.Should().Be(250);
        afterFounderEdit.Inputs.Provenance!["launchSubscribers"].Should().Be("founder_edited");

        // Phase D: Forecast generated -> exact persisted value reaches FinancialForecastEngine -> output reflects that value
        var forecastResult = FinancialForecastEngine.Calculate(afterFounderEdit.Inputs);

        forecastResult.Monthly[0].Units.Should().Be(250);
        // Revenue = 250 * 49.0 = 12250.0
        forecastResult.Monthly[0].Revenue.Should().Be(12250.0);

        // Phase E: Step 3.2 regenerates later with different ARPU and attempts to overwrite launchSubscribers
        var step32RegenContent = new BsonDocument
        {
            ["unitEconomics"] = new BsonDocument
            {
                ["arpu"] = new BsonDocument { ["amount"] = 59.0 },
                ["margins"] = new BsonDocument { ["grossMarginPct"] = 80.0 }
            }
        };

        var afterStep32Regen = await Service().UpdateFromBusinessModelAsync(ideaId, "user-1", step32RegenContent, 2);

        // Founder-edited field remains unchanged!
        afterStep32Regen.Inputs!.LaunchSubscribers.Should().Be(250);
        afterStep32Regen.Inputs.Provenance!["launchSubscribers"].Should().Be("founder_edited");

        // Unlocked field (ARPU) updated to v2
        afterStep32Regen.Inputs.Arpu.Should().Be(59.0);
        afterStep32Regen.Inputs.BusinessModelVersion.Should().Be(2);

        // TAM remains canonical/read-only from Step 3.1
        afterStep32Regen.Inputs.Tam.Should().Be(800000000.0);
        afterStep32Regen.Inputs.Provenance["tam"].Should().Be("upstream_market");
    }

    #endregion
}
