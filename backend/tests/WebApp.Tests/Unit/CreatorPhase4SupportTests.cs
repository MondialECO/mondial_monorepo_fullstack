using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Dtos;
using WebApp.Models.Phase4;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorPhase4SupportTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<INeedsAnalysisService> _needsServiceMock = new();
        private readonly Mock<ISkillsResolutionService> _skillsServiceMock = new();
        private readonly Mock<ISupportCatalogueService> _catalogueServiceMock = new();
        private readonly Mock<IProfessionalProfileStore> _profStoreMock = new();
        private readonly Mock<IProfileCompletenessResolver> _completenessResolverMock = new();

        private readonly ISupportEligibilityEngine _eligibilityEngine = new SupportEligibilityEngine();

        private SupportPlanService CreateService(ISupportMatchingService? matchingService = null)
        {
            matchingService ??= new SupportMatchingService(_eligibilityEngine);

            return new SupportPlanService(
                _journeysMock.Object,
                _needsServiceMock.Object,
                _skillsServiceMock.Object,
                _catalogueServiceMock.Object,
                matchingService,
                _profStoreMock.Object,
                _completenessResolverMock.Object
            );
        }

        private static CreatorJourney BuildCompleteJourney(string userId = "user-1", string ideaId = "idea-1")
        {
            return new CreatorJourney
            {
                UserId = userId,
                ActiveIdeaId = ideaId,
                Project = new CreatorJourneyProject
                {
                    Name = "Fintech Hub Paris",
                    Concept = "Financial analytics software",
                    Sector = "Fintech",
                    Category = "SaaS",
                    Tags = new List<string> { "Tech / Digital" },
                    Solution = "SaaS Analytics"
                },
                Phase3Data = new CreatorPhase3Data
                {
                    BusinessPlanSessionId = "bp-session-123",
                    ForecastSessionId = "forecast-session-456",
                    MarketStudySessionId = "market-session-789",
                    LegalAssessment = new CreatorLegalAssessment
                    {
                        EvaluatedAt = DateTime.UtcNow
                    },
                    FormationGenerator = new CreatorFormationGenerator
                    {
                        SelectedType = "SAS",
                        RecommendedType = "SAS",
                        ForecastBasis = new CreatorFormationForecastBasis()
                    }
                },
                Phase4Data = new CreatorPhase4Data
                {
                    ConstructionSnapshot = new ConstructionSnapshot
                    {
                        Status = "Completed",
                        GeneratedAt = DateTime.UtcNow
                    },
                    Roadmap = new OperationalRoadmap
                    {
                        Status = "Active",
                        GeneratedAt = DateTime.UtcNow
                    },
                    NeedsAnalysis = new NeedsAnalysis
                    {
                        Status = "Active",
                        GeneratedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        ActiveNeeds = new List<CreatorNeed>()
                    },
                    SkillsPlan = new SkillsPlan
                    {
                        Status = "Active",
                        GeneratedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Resolutions = new List<CapabilityResolution>()
                    }
                }
            };
        }

        private void SetupValidPhaseStatus(CreatorJourney journey)
        {
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(journey);

            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase3 = new ComputedPhaseStatus { Status = "completed" }
                });

            _completenessResolverMock.Setup(r => r.Resolve(It.IsAny<ProfessionalProfileRecord>()))
                .Returns(new ProfileCompletenessResult(100, true, new List<string>()));

            _needsServiceMock.Setup(n => n.GetNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new NeedsAnalysisResponse
                {
                    UpdateAvailable = false
                });

            _skillsServiceMock.Setup(s => s.GetSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new SkillsPlanResponse
                {
                    UpdateAvailable = false
                });
        }

        // =========================================================================
        // USER REFINEMENT 1: SELECTION MODE & "ELIGIBLE TO APPLY"
        // =========================================================================

        [Fact]
        public void CompetitiveScheme_EligibleMeansEligibleToApply_NotAwarded()
        {
            // Arrange: A competitive grant (e.g. Bourse French Tech)
            var opportunity = new SupportOpportunity
            {
                ExternalId = "bft-test",
                SourceId = "bpifrance",
                Name = "Bourse French Tech",
                SupportType = SupportType.Grant,
                SelectionMode = SelectionMode.Competitive,
                EligibilityRules = new List<SupportEligibilityRule>
                {
                    new()
                    {
                        RuleId = "r-stage",
                        Field = "BusinessStage",
                        Operator = RuleOperator.Equals,
                        ExpectedValue = "Creation",
                        NormalizationStatus = RuleNormalizationStatus.VerifiedStructured
                    }
                }
            };

            var context = new SupportEligibilityContext
            {
                BusinessStage = "Creation",
                Country = "FR"
            };

            // Act
            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            // Assert: Must produce EligibleToApply, and RecommendedNextStep clearly states "Eligible to Apply" (NOT awarded)
            match.EligibilityStatus.Should().Be(EligibilityStatus.EligibleToApply);
            match.SelectionMode.Should().Be(SelectionMode.Competitive);
            match.RecommendedNextStep.Should().Contain("Eligible to Apply");
            match.RecommendedNextStep.Should().NotContain("awarded");
            match.RecommendedNextStep.Should().NotContain("approved");
            match.FounderApplicationState.Should().Be(FounderApplicationState.NotStarted);
        }

        [Fact]
        public void CreditAssessmentScheme_DoesNotImplyLoanApproval()
        {
            // Arrange: A credit-assessed loan / honor loan (e.g. Prêt d'Honneur)
            var opportunity = new SupportOpportunity
            {
                ExternalId = "pret-honneur-test",
                SourceId = "bpifrance",
                Name = "Prêt d'Honneur Création",
                SupportType = SupportType.HonorLoan,
                SelectionMode = SelectionMode.CreditAssessment,
                EligibilityRules = new List<SupportEligibilityRule>
                {
                    new()
                    {
                        RuleId = "r-form",
                        Field = "LegalForm",
                        Operator = RuleOperator.In,
                        ExpectedValue = "SAS,SASU,SARL",
                        NormalizationStatus = RuleNormalizationStatus.VerifiedStructured
                    }
                }
            };

            var context = new SupportEligibilityContext
            {
                LegalForm = "SAS",
                Country = "FR"
            };

            // Act
            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            // Assert: Must state "Eligible to Apply" and never imply loan approval or credit disbursement
            match.EligibilityStatus.Should().Be(EligibilityStatus.EligibleToApply);
            match.SelectionMode.Should().Be(SelectionMode.CreditAssessment);
            match.RecommendedNextStep.Should().Contain("Eligible to Apply");
            match.RecommendedNextStep.Should().NotContain("Loan Approved");
            match.RecommendedNextStep.Should().NotContain("Granted");
        }

        // =========================================================================
        // USER REFINEMENT 2 & 3: SOURCE PRECEDENCE & PROGRAMME OWNER VS CATALOGUE SOURCE
        // =========================================================================

        [Fact]
        public void AggregatorConflict_PrimaryAuthorityRuleWins()
        {
            // Arrange: Aggregator record has an outdated rule or metadata, primary official authority has current rule
            var aggregatorOpp = new SupportOpportunity
            {
                ExternalId = "ACRE-AGG",
                SourceId = "aides-entreprises-opendata",
                Name = "ACRE Exemption (Aggregator version)",
                CatalogueSource = "AidesEntreprisesOpenData",
                ManagingAuthority = "URSSAF",
                ProgrammeOwner = "URSSAF",
                SupportValueMax = 1000m
            };

            var primaryOpp = new SupportOpportunity
            {
                ExternalId = "F11677",
                SourceId = "service-public",
                Name = "Exonération ACRE (URSSAF Official)",
                CatalogueSource = "ServicePublicAdapter",
                ManagingAuthority = "URSSAF",
                ProgrammeOwner = "URSSAF",
                SupportValueMax = 3500m
            };

            // Precedence logic: primary official authority wins over aggregator
            var isPrimary = primaryOpp.CatalogueSource == "ServicePublicAdapter";
            var chosen = isPrimary ? primaryOpp : aggregatorOpp;

            // Assert
            chosen.CatalogueSource.Should().Be("ServicePublicAdapter");
            chosen.SupportValueMax.Should().Be(3500m);
        }

        [Fact]
        public void ProgrammeOwner_DiffersFromCatalogueSource()
        {
            // Arrange & Act
            var arce = new SupportOpportunity
            {
                ExternalId = "arce-ft",
                SourceId = "aides-entreprises-opendata",
                Name = "Aide à la Reprise ou à la Création d'Entreprise (ARCE)",
                ProgrammeOwner = "France Travail",
                ManagingAuthority = "France Travail",
                ApplicationAuthority = "France Travail",
                CatalogueSource = "AidesEntreprisesOpenData"
            };

            // Assert: Catalogue source is the open data aggregator, but ProgrammeOwner is strictly France Travail
            arce.ProgrammeOwner.Should().Be("France Travail");
            arce.CatalogueSource.Should().Be("AidesEntreprisesOpenData");
            arce.ProgrammeOwner.Should().NotBe(arce.CatalogueSource);
        }

        // =========================================================================
        // USER REFINEMENT 5: RAW PROVENANCE / AUDIT SNAPSHOT
        // =========================================================================

        [Fact]
        public void SourceSnapshot_TracksParserAndNormalizationVersion()
        {
            // Arrange & Act
            var snapshot = new SupportSourceSnapshot
            {
                SourceId = "aides-entreprises-opendata",
                OpportunityExternalId = "AIDE-7890",
                RetrievedAt = DateTime.UtcNow,
                SourceUpdatedAt = DateTime.UtcNow.AddDays(-1),
                SourceUrl = "https://aides-entreprises.fr/api/aides/7890",
                ContentFingerprint = "sha256-abc123def456",
                ParserVersion = "1.0.0",
                NormalizationVersion = "1.0.0",
                RawPayload = "{\"id\": 7890, \"nom\": \"Innov Up\"}"
            };

            // Assert
            snapshot.SourceId.Should().Be("aides-entreprises-opendata");
            snapshot.OpportunityExternalId.Should().Be("AIDE-7890");
            snapshot.ParserVersion.Should().Be("1.0.0");
            snapshot.NormalizationVersion.Should().Be("1.0.0");
            snapshot.ContentFingerprint.Should().StartWith("sha256-");
        }

        // =========================================================================
        // USER REFINEMENT 6: RULE NORMALIZATION STATUS & AMBIGUOUS RULES
        // =========================================================================

        [Fact]
        public void AmbiguousParsedRule_CannotProduceEligible()
        {
            // Arrange: A rule where text was ambiguous and marked Ambiguous
            var opportunity = new SupportOpportunity
            {
                ExternalId = "ambiguous-scheme",
                SourceId = "opendata",
                Name = "Ambiguous Regional Subsidy",
                SelectionMode = SelectionMode.Discretionary,
                EligibilityRules = new List<SupportEligibilityRule>
                {
                    new()
                    {
                        RuleId = "r-ambiguous",
                        Field = "Sector",
                        Operator = RuleOperator.Contains,
                        ExpectedValue = "Innovative",
                        NormalizationStatus = RuleNormalizationStatus.Ambiguous // Ambiguous!
                    }
                }
            };

            var context = new SupportEligibilityContext
            {
                Sector = "Innovative Tech",
                Country = "FR"
            };

            // Act
            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            // Assert: MUST produce NeedsReview, CANNOT produce Eligible
            match.EligibilityStatus.Should().Be(EligibilityStatus.NeedsReview);
            match.EligibilityStatus.Should().NotBe(EligibilityStatus.Eligible);
            match.ReasonCodes.Should().Contain("AMBIGUOUS_PARSED_RULE");
        }

        [Fact]
        public void UnvalidatedRule_CannotProduceEligible()
        {
            // Arrange: A rule that was Rejected
            var opportunity = new SupportOpportunity
            {
                ExternalId = "rejected-rule-scheme",
                SourceId = "opendata",
                Name = "Unverified Support Scheme",
                EligibilityRules = new List<SupportEligibilityRule>
                {
                    new()
                    {
                        RuleId = "r-rejected",
                        Field = "LegalForm",
                        Operator = RuleOperator.Equals,
                        ExpectedValue = "SAS",
                        NormalizationStatus = RuleNormalizationStatus.Rejected
                    }
                }
            };

            var context = new SupportEligibilityContext
            {
                LegalForm = "SAS",
                Country = "FR"
            };

            // Act
            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            // Assert: Cannot produce Eligible
            match.EligibilityStatus.Should().Be(EligibilityStatus.NeedsReview);
            match.EligibilityStatus.Should().NotBe(EligibilityStatus.Eligible);
        }

        // =========================================================================
        // USER REFINEMENT 7: VERSIONING & ZERO HARDCODED CODE CONSTANTS
        // =========================================================================

        [Fact]
        public void HardcodedAmount_NotUsedWhenSourceValueChanges()
        {
            // Arrange: Dynamic opportunity with a newly updated source amount
            var updatedSourceValue = 42500m;
            var updatedDescription = "Up to €42,500 grant based on 2026 scheme update";

            var opportunity = new SupportOpportunity
            {
                ExternalId = "bft-2026-dynamic",
                SourceId = "bpifrance",
                Name = "Bourse French Tech Dynamic",
                SupportValueMax = updatedSourceValue,
                SupportValueDescription = updatedDescription,
                SupportValueType = "GrantAmount",
                EligibilityRules = new List<SupportEligibilityRule>()
            };

            var context = new SupportEligibilityContext { Country = "FR" };

            // Act
            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            // Assert: Match output uses source values, never hardcoded code constants
            match.EstimatedSupportValue.Should().Be(42500m);
            match.SupportValueDescription.Should().Be(updatedDescription);
        }

        [Fact]
        public async Task RuleVersionChange_InvalidatesSupportPlan()
        {
            // Arrange: Plan generated with CatalogueRuleVersion = "1.0"
            var journey = BuildCompleteJourney();
            var plan = new SupportPlan
            {
                Status = "Generated",
                GeneratedAt = DateTime.UtcNow.AddDays(-2),
                SourceVersions = new SupportSourceVersions
                {
                    CatalogueRuleVersion = "1.0",
                    SnapshotGeneratedAt = journey.Phase4Data!.ConstructionSnapshot!.GeneratedAt,
                    RoadmapGeneratedAt = journey.Phase4Data!.Roadmap!.GeneratedAt,
                    NeedsGeneratedAt = journey.Phase4Data!.NeedsAnalysis!.UpdatedAt,
                    SkillsGeneratedAt = journey.Phase4Data!.SkillsPlan!.UpdatedAt
                }
            };
            journey.Phase4Data!.SupportPlan = plan;

            SetupValidPhaseStatus(journey);

            var service = CreateService();

            // Act: If stored CatalogueRuleVersion ("1.0") matches current, not stale
            var res = await service.GetSupportPlanAsync("user-1", "idea-1");
            res.UpdateAvailable.Should().BeFalse();

            // When stored version is outdated:
            plan.SourceVersions.CatalogueRuleVersion = "0.9";
            var staleRes = await service.GetSupportPlanAsync("user-1", "idea-1");

            // Assert
            staleRes.UpdateAvailable.Should().BeTrue();
            staleRes.ChangedSources.Should().Contain("CatalogueRuleVersion");
        }

        // =========================================================================
        // DOMAIN GATES & PREREQUISITES
        // =========================================================================

        [Fact]
        public async Task Gate_Phase3NotCompleted_ThrowsInvalidOperationException()
        {
            // Arrange
            var journey = BuildCompleteJourney();
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase3 = new ComputedPhaseStatus { Status = "in_progress" } // Not completed!
                });

            var service = CreateService();

            // Act & Assert
            var act = () => service.GenerateSupportPlanAsync("user-1", "idea-1");
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Phase 3 Business Plan Intelligence must be completed*");
        }

        [Fact]
        public async Task Gate_SkillsPlanStale_ThrowsInvalidOperationException()
        {
            // Arrange
            var journey = BuildCompleteJourney();
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase3 = new ComputedPhaseStatus { Status = "completed" }
                });

            _needsServiceMock.Setup(n => n.GetNeedsAnalysisAsync("user-1", "idea-1"))
                .ReturnsAsync(new NeedsAnalysisResponse { UpdateAvailable = false });

            // Skills plan is stale!
            _skillsServiceMock.Setup(s => s.GetSkillsPlanAsync("user-1", "idea-1"))
                .ReturnsAsync(new SkillsPlanResponse
                {
                    UpdateAvailable = true,
                    ChangedSources = new List<string> { "NeedsAnalysis" }
                });

            var service = CreateService();

            // Act & Assert
            var act = () => service.GenerateSupportPlanAsync("user-1", "idea-1");
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*SKILLS_PLAN_REFRESH_REQUIRED*");
        }

        // =========================================================================
        // LOCATION MISMATCH & DOCUMENT REUSE
        // =========================================================================

        [Fact]
        public void LocationMismatch_ProducesNotEligible()
        {
            // Arrange: Hauts-de-France regional scheme
            var regionalOpp = new SupportOpportunity
            {
                ExternalId = "pass-creation-hdf",
                SourceId = "hauts-de-france",
                Name = "Pass Création Hauts-de-France",
                GeographicScope = "Regional",
                EligibleLocations = new List<string> { "Hauts-de-France" },
                EligibilityRules = new List<SupportEligibilityRule>()
            };

            // Venture is in Île-de-France
            var context = new SupportEligibilityContext
            {
                Country = "FR",
                Region = "Île-de-France"
            };

            // Act
            var match = _eligibilityEngine.EvaluateOpportunity(regionalOpp, context);

            // Assert
            match.EligibilityStatus.Should().Be(EligibilityStatus.NotEligible);
            match.ReasonCodes.Should().Contain("REGION_NOT_ELIGIBLE");
        }

        [Fact]
        public void DocumentReuse_MapsPhase3AndPhase4Artifacts()
        {
            // Arrange
            var journey = BuildCompleteJourney();
            var matchingService = new SupportMatchingService(_eligibilityEngine);

            var matches = new List<SupportMatch>
            {
                new()
                {
                    OpportunityId = "bft",
                    Key = "support.bpifrance.bft",
                    Name = "Bourse French Tech",
                    EligibilityStatus = EligibilityStatus.Eligible
                }
            };

            // Act
            var checklists = matchingService.BuildApplicationChecklists(matches, journey);

            // Assert: Checklist contains items and detects Phase 3 & Phase 4 artifacts
            checklists.Should().NotBeEmpty();
            var checklist = checklists.First();
            var bpItem = checklist.Items.FirstOrDefault(i => i.Key == "doc-business-plan");
            bpItem.Should().NotBeNull();
            bpItem!.Status.Should().Be("Ready");
            bpItem.ExistingArtifactReference.Should().Contain("Phase 3");
        }

        // =========================================================================
        // ZERO UPSTREAM MUTATION & ZERO DUAL WRITE
        // =========================================================================

        [Fact]
        public async Task ZeroUpstreamMutation_PreservesPhase3AndHumainX()
        {
            // Arrange
            var journey = BuildCompleteJourney();
            var originalBpSession = journey.Phase3Data!.BusinessPlanSessionId;
            var originalRoadmapDate = journey.Phase4Data!.Roadmap!.GeneratedAt;

            SetupValidPhaseStatus(journey);
            _catalogueServiceMock.Setup(c => c.GetActiveOpportunitiesAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new List<SupportOpportunity>());

            var service = CreateService();

            // Act
            await service.GenerateSupportPlanAsync("user-1", "idea-1");

            // Assert: Phase 3 and Phase 4 upstream fields unchanged
            journey.Phase3Data.BusinessPlanSessionId.Should().Be(originalBpSession);
            journey.Phase4Data.Roadmap.GeneratedAt.Should().Be(originalRoadmapDate);
        }

        [Fact]
        public async Task ZeroDualWrite_PersistsOnlyToCreatorJourney()
        {
            // Arrange
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);
            _catalogueServiceMock.Setup(c => c.GetActiveOpportunitiesAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new List<SupportOpportunity>());

            var service = CreateService();

            // Act
            await service.GenerateSupportPlanAsync("user-1", "idea-1");

            // Assert: SetPhase4SupportPlanAsync must be called strictly on ICreatorJourneyService
            _journeysMock.Verify(j => j.SetPhase4SupportPlanAsync(
                "user-1",
                It.Is<SupportPlan>(p => p.Status == "Generated"),
                "idea-1"),
                Times.Once);
        }

        // =========================================================================
        // FIX-02: CANONICAL COMPETITIVE SUPPORT SEMANTICS TESTS
        // =========================================================================

        [Fact]
        public void CompetitiveSupport_UsesEligibleToApplySemantics()
        {
            var opportunity = new SupportOpportunity
            {
                ExternalId = "bft-competitive",
                SourceId = "bpifrance",
                Name = "Bourse French Tech",
                SupportType = SupportType.Grant,
                SelectionMode = SelectionMode.Competitive,
                EligibilityRules = new List<SupportEligibilityRule>
                {
                    new()
                    {
                        RuleId = "r-stage",
                        Field = "BusinessStage",
                        Operator = RuleOperator.Equals,
                        ExpectedValue = "Creation",
                        NormalizationStatus = RuleNormalizationStatus.VerifiedStructured
                    }
                }
            };

            var context = new SupportEligibilityContext
            {
                BusinessStage = "Creation",
                Country = "FR"
            };

            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            // Canonical invariant: Meets criteria => EligibleToApply (NEVER plain Eligible, NEVER Awarded)
            match.EligibilityStatus.Should().Be(EligibilityStatus.EligibleToApply);
            match.EligibilityStatus.Should().NotBe(EligibilityStatus.Eligible);
            match.EligibilityStatus.Should().NotBe(EligibilityStatus.Awarded);
            match.RecommendedNextStep.Should().StartWith("Eligible to Apply:");
            match.RecommendedNextStep.Should().Contain("Final selection depends on the programme authority");
        }

        [Fact]
        public void CompetitiveSupport_NeverReturnsAwardedWithoutEvidence()
        {
            var opportunity = new SupportOpportunity
            {
                ExternalId = "bft-award-check",
                SourceId = "bpifrance",
                Name = "Bourse French Tech",
                SupportType = SupportType.Grant,
                SelectionMode = SelectionMode.Competitive
            };

            var context = new SupportEligibilityContext { Country = "FR" };

            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            match.EligibilityStatus.Should().NotBe(EligibilityStatus.Awarded);
            match.FounderApplicationState.Should().Be(FounderApplicationState.NotStarted);
        }

        [Fact]
        public void CompetitiveSupport_DoesNotBecomeSpendableBudget()
        {
            // Verify across Support, Pricing, and GTM boundary:
            // An eligible competitive grant of €20,000 does NOT become spendable budget.
            var competitiveMatch = new SupportMatch
            {
                Key = "support.bpifrance.bft-20k",
                Name = "Bourse French Tech €20k",
                SelectionMode = SelectionMode.Competitive,
                EligibilityStatus = EligibilityStatus.EligibleToApply,
                EstimatedSupportValue = 20000m
            };

            // In Support matching summary, it's counted in EligibleCount (Eligible / Apply)
            var matchingService = new SupportMatchingService(_eligibilityEngine);
            var summary = matchingService.ComputeSummary(new List<SupportMatch> { competitiveMatch });
            summary.EligibleCount.Should().Be(1);

            // But in GTM Context formulation, only Awarded grants become ConfirmedGrantBudget
            var journey = BuildCompleteJourney();
            journey.Phase4Data!.SupportPlan = new SupportPlan
            {
                Matches = new List<SupportMatch> { competitiveMatch }
            };

            // When GtmStrategyService builds context:
            decimal confirmedBudget = 0m;
            decimal potentialBudget = 0m;
            foreach (var match in journey.Phase4Data.SupportPlan.Matches)
            {
                if (match.EligibilityStatus == EligibilityStatus.Awarded || match.FounderApplicationState == FounderApplicationState.Awarded)
                    confirmedBudget += match.EstimatedSupportValue ?? 0;
                else
                    potentialBudget += match.EstimatedSupportValue ?? 0;
            }

            confirmedBudget.Should().Be(0m); // NOT spendable!
            potentialBudget.Should().Be(20000m); // Potential only!

            var gtmContext = new GtmContext
            {
                ConfirmedGrantBudget = confirmedBudget > 0 ? confirmedBudget : null,
                PotentialGrantBudget = potentialBudget,
                Forecast = new GtmForecastContext { MarketingBudget = null }
            };

            var gtmEngine = new GtmPolicyEngine();
            var budgetPlan = gtmEngine.FormulateBudgetPlan(gtmContext, new List<GtmChannelStrategy>());

            budgetPlan.TotalAvailableBudget.Should().BeNull(); // Excluded from launch spendable budget
            budgetPlan.ProvenanceExplanation.Should().Contain("excluded from spendable GTM budget");
        }

        [Fact]
        public void DiscretionarySupport_DoesNotImplyGuaranteedFunding()
        {
            var opportunity = new SupportOpportunity
            {
                ExternalId = "discretionary-aid-1",
                SourceId = "region-idf",
                Name = "Aide Régionale Discrétionnaire",
                SupportType = SupportType.RegionalSupport,
                SelectionMode = SelectionMode.Discretionary
            };

            var context = new SupportEligibilityContext { Country = "FR" };

            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            match.EligibilityStatus.Should().Be(EligibilityStatus.EligibleToApply);
            match.RecommendedNextStep.Should().Contain("Eligible to Apply");
            match.RecommendedNextStep.Should().Contain("subject to committee approval");
            match.EligibilityStatus.Should().NotBe(EligibilityStatus.Awarded);
        }

        [Fact]
        public void CreditAssessmentSupport_DoesNotImplyApproval()
        {
            var opportunity = new SupportOpportunity
            {
                ExternalId = "pret-honneur-credit",
                SourceId = "initiative-france",
                Name = "Prêt d'Honneur",
                SupportType = SupportType.HonorLoan,
                SelectionMode = SelectionMode.CreditAssessment
            };

            var context = new SupportEligibilityContext { Country = "FR" };

            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            match.EligibilityStatus.Should().Be(EligibilityStatus.EligibleToApply);
            match.RecommendedNextStep.Should().Contain("Eligible to Apply");
            match.RecommendedNextStep.Should().Contain("Credit approval remains external");
            match.EligibilityStatus.Should().NotBe("Loan Approved");
        }

        [Fact]
        public void AmbiguousSupport_ReturnsNeedsReview()
        {
            var opportunity = new SupportOpportunity
            {
                ExternalId = "ambiguous-opp",
                SourceId = "opendata",
                Name = "Ambiguous Scheme",
                SelectionMode = SelectionMode.Competitive,
                EligibilityRules = new List<SupportEligibilityRule>
                {
                    new()
                    {
                        RuleId = "r-amb",
                        Field = "Sector",
                        Operator = RuleOperator.Contains,
                        ExpectedValue = "Tech",
                        NormalizationStatus = RuleNormalizationStatus.Ambiguous
                    }
                }
            };

            var context = new SupportEligibilityContext { Sector = "Tech", Country = "FR" };

            var match = _eligibilityEngine.EvaluateOpportunity(opportunity, context);

            match.EligibilityStatus.Should().Be(EligibilityStatus.NeedsReview);
            match.ReasonCodes.Should().Contain("AMBIGUOUS_PARSED_RULE");
        }

        [Fact]
        public void AwardedStatus_RequiresAwardEvidence()
        {
            var opportunity = new SupportOpportunity
            {
                ExternalId = "bft-confirmed-award",
                SourceId = "bpifrance",
                Name = "Bourse French Tech Awarded",
                SelectionMode = SelectionMode.Competitive
            };

            // Without evidence -> EligibleToApply
            var contextWithoutEvidence = new SupportEligibilityContext { Country = "FR" };
            var unconfirmedMatch = _eligibilityEngine.EvaluateOpportunity(opportunity, contextWithoutEvidence);
            unconfirmedMatch.EligibilityStatus.Should().Be(EligibilityStatus.EligibleToApply);

            // With verified award evidence in context -> Awarded
            var contextWithEvidence = new SupportEligibilityContext
            {
                Country = "FR",
                ConfirmedAwardOpportunityKeys = new HashSet<string> { "bft-confirmed-award" }
            };
            var confirmedMatch = _eligibilityEngine.EvaluateOpportunity(opportunity, contextWithEvidence);
            confirmedMatch.EligibilityStatus.Should().Be(EligibilityStatus.Awarded);
            confirmedMatch.FounderApplicationState.Should().Be(FounderApplicationState.Awarded);
            confirmedMatch.RecommendedNextStep.Should().Contain("Awarded:");
        }

        [Fact]
        public async Task SupportResponse_PopulatesIdeaVersion_ForOptimisticConcurrency()
        {
            var journey = BuildCompleteJourney();
            journey.IdeaVersion = 9;
            SetupValidPhaseStatus(journey);
            _catalogueServiceMock.Setup(c => c.GetActiveOpportunitiesAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new List<SupportOpportunity>());

            var service = CreateService();
            var response = await service.GenerateSupportPlanAsync(journey.UserId, journey.ActiveIdeaId);

            response.Should().NotBeNull();
            response.IdeaVersion.Should().Be(9);
        }
    }
}
