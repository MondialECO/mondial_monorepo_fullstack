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
    public class CreatorPhase4SkillsTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<INeedsAnalysisService> _needsServiceMock = new();
        private readonly ICapabilityMatcher _capabilityMatcher = new CapabilityMatcher();
        private readonly Mock<IProfessionalProfileStore> _profStoreMock = new();
        private readonly Mock<IProfileCompletenessResolver> _completenessResolverMock = new();

        private SkillsResolutionService CreateService()
        {
            var policy = new CapabilityResolutionPolicy(_capabilityMatcher);
            return new SkillsResolutionService(
                _journeysMock.Object,
                _needsServiceMock.Object,
                policy,
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
                    Name = "Mondial Analytics",
                    Concept = "Fintech SaaS",
                    Sector = "Software",
                    Category = "SaaS"
                },
                Phase3Data = new CreatorPhase3Data
                {
                    LegalAssessment = new CreatorLegalAssessment
                    {
                        EvaluatedAt = DateTime.UtcNow,
                        Items = new List<CreatorLegalChecklistItem>
                        {
                            new()
                            {
                                Id = "legal.statutory-capital",
                                Title = "Dépôt de capital en séquestre",
                                Priority = "critical",
                                RequiresEvidence = true,
                                Category = "corporate"
                            }
                        }
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
                        GeneratedAt = DateTime.UtcNow,
                        Tasks = new List<RoadmapTask>
                        {
                            new()
                            {
                                Key = "task.backend",
                                Title = "Build backend services",
                                Stage = RoadmapStages.Now
                            }
                        }
                    },
                    NeedsAnalysis = new NeedsAnalysis
                    {
                        Status = "Active",
                        GeneratedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        ActiveNeeds = new List<CreatorNeed>
                        {
                            new()
                            {
                                Key = "need.backend-dev",
                                Title = "Backend Engineering",
                                CapabilityRequired = "Software Development",
                                Category = NeedCategories.Team,
                                RequirementType = RequirementTypes.Capability,
                                Priority = NeedPriority.Critical,
                                Timing = NeedTiming.Now,
                                Blocking = true,
                                RelatedRoadmapTaskKeys = new List<string> { "task.backend" },
                                Source = new List<string> { "Roadmap:task.backend" }
                            },
                            new()
                            {
                                Key = "need.seo-growth",
                                Title = "SEO Optimization",
                                CapabilityRequired = "SEO Optimization",
                                Category = NeedCategories.Marketing,
                                RequirementType = RequirementTypes.Capability,
                                Priority = NeedPriority.Medium,
                                Timing = NeedTiming.Later,
                                Blocking = false,
                                RelatedRoadmapTaskKeys = new List<string>(),
                                Source = new List<string> { "GrowthStrategy" }
                            }
                        },
                        CoveredRequirements = new List<CreatorNeed>
                        {
                            new()
                            {
                                Key = "covered.product-strategy",
                                Title = "Product Strategy",
                                CapabilityRequired = "Product Strategy",
                                Category = NeedCategories.Team,
                                WhyNeeded = "10 years product manager experience",
                                SystemStatus = NeedSystemStatus.Satisfied,
                                Source = new List<string> { "Phase4.3.NeedsAnalysis.Covered" }
                            }
                        }
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
                    NeedsAnalysis = journey.Phase4Data!.NeedsAnalysis,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>()
                });

            _journeysMock.Setup(j => j.SetPhase4SkillsPlanAsync(journey.UserId, It.IsAny<SkillsPlan>(), journey.ActiveIdeaId))
                .Callback<string, SkillsPlan, string?>((u, p, i) =>
                {
                    journey.Phase4Data!.SkillsPlan = p;
                })
                .ReturnsAsync(journey);
        }

        [Fact]
        public async Task GenerateSkillsPlan_Fails_When_NeedsAnalysis_Not_Generated()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data!.NeedsAnalysis = null;
            SetupValidPhaseStatus(journey);

            var service = CreateService();

            var act = async () => await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Needs & Requirements analysis must be completed*");
        }

        [Fact]
        public async Task GenerateSkillsPlan_Fails_When_NeedsAnalysis_Is_Stale()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            _needsServiceMock.Setup(n => n.GetNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new NeedsAnalysisResponse
                {
                    NeedsAnalysis = journey.Phase4Data!.NeedsAnalysis,
                    UpdateAvailable = true,
                    ChangedSources = new List<string> { "Roadmap" }
                });

            var service = CreateService();

            var act = async () => await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*stale because upstream sources changed*");
        }

        [Fact]
        public async Task Correction1_AdvancedSkill_NormalRequirement_Resolves_Covered()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var profile = new ProfessionalProfileRecord
            {
                UserId = journey.UserId,
                Skills = new List<ProfileSkill>
                {
                    new() { Name = "Software Development", Level = "Advanced" }
                },
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "15-25h",
                    LearningPreference = "HandsOn"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(profile);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            res.SkillsPlan.Should().NotBeNull();
            var backendRes = res.SkillsPlan!.Resolutions.FirstOrDefault(r => r.NeedKey == "need.backend-dev");
            backendRes.Should().NotBeNull();
            backendRes!.ResolutionMode.Should().Be(ResolutionModes.Covered);
        }

        [Fact]
        public async Task Correction1_ComfortableSkill_NormalRequirement_Resolves_Covered()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var profile = new ProfessionalProfileRecord
            {
                UserId = journey.UserId,
                Skills = new List<ProfileSkill>
                {
                    new() { Name = "SEO Optimization", Level = "Comfortable" }
                },
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "15-25h"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(profile);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var seoRes = res.SkillsPlan!.Resolutions.FirstOrDefault(r => r.NeedKey == "need.seo-growth");
            seoRes.Should().NotBeNull();
            seoRes!.ResolutionMode.Should().Be(ResolutionModes.Covered);
        }

        [Fact]
        public async Task Correction1_ComfortableSkill_ComplexCritical_WithoutExperience_Resolves_NeedsReview()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var profile = new ProfessionalProfileRecord
            {
                UserId = journey.UserId,
                Skills = new List<ProfileSkill>
                {
                    new() { Name = "Software Development", Level = "Comfortable" }
                },
                Experiences = new List<ProfessionalExperience>(),
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "15-25h"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(profile);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var backendRes = res.SkillsPlan!.Resolutions.FirstOrDefault(r => r.NeedKey == "need.backend-dev");
            backendRes.Should().NotBeNull();
            backendRes!.ResolutionMode.Should().Be(ResolutionModes.NeedsReview);
            backendRes.ReasonCode.Should().Be(ResolutionReasonCodes.InsufficientEvidence);
        }

        [Fact]
        public async Task Correction1_BeginnerSkill_Never_Covered_Defaults_To_Learn_Or_Delegate()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var profile = new ProfessionalProfileRecord
            {
                UserId = journey.UserId,
                Skills = new List<ProfileSkill>
                {
                    new() { Name = "SEO Optimization", Level = "Beginner" }
                },
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "15-25h",
                    LearningPreference = "HandsOn"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(profile);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var seoRes = res.SkillsPlan!.Resolutions.FirstOrDefault(r => r.NeedKey == "need.seo-growth");
            seoRes.Should().NotBeNull();
            seoRes!.ResolutionMode.Should().NotBe(ResolutionModes.Covered);
            seoRes.ResolutionMode.Should().Be(ResolutionModes.Learn);
            seoRes.LearningAction.Should().NotBeNull();
            seoRes.LearningAction!.CurrentLevel.Should().Be("Beginner");
        }

        [Fact]
        public async Task Correction2_Authoritative_Phase3_Legal_Marks_Mandatory_Verify()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data!.NeedsAnalysis!.ActiveNeeds.Add(new CreatorNeed
            {
                Key = "legal.statutory-capital",
                Title = "Dépôt de capital en séquestre",
                CapabilityRequired = "Corporate Law Escrow",
                Category = NeedCategories.LegalAndAdministration,
                RequirementType = RequirementTypes.LegalAdministrative,
                Priority = NeedPriority.Critical,
                Timing = NeedTiming.Now,
                Blocking = true,
                Source = new List<string> { "Phase3.LegalAssessment" }
            });

            SetupValidPhaseStatus(journey);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var legalRes = res.SkillsPlan!.Resolutions.FirstOrDefault(r => r.NeedKey == "legal.statutory-capital");
            legalRes.Should().NotBeNull();
            legalRes!.ResolutionMode.Should().Be(ResolutionModes.Verify);
            legalRes.IsMandatoryVerification.Should().BeTrue();
            legalRes.VerificationRequirement.Should().NotBeNull();
            legalRes.VerificationRequirement!.IsMandatory.Should().BeTrue();
        }

        [Fact]
        public async Task Correction3_Verify_Can_Carry_Optional_Learning_Supplement()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data!.NeedsAnalysis!.ActiveNeeds.Add(new CreatorNeed
            {
                Key = "legal.statutory-capital",
                Title = "Dépôt de capital en séquestre",
                CapabilityRequired = "Corporate Law Escrow",
                Category = NeedCategories.LegalAndAdministration,
                RequirementType = RequirementTypes.LegalAdministrative,
                Priority = NeedPriority.Critical,
                Timing = NeedTiming.Now,
                Blocking = true,
                Source = new List<string> { "Phase3.LegalAssessment" }
            });

            SetupValidPhaseStatus(journey);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var legalRes = res.SkillsPlan!.Resolutions.FirstOrDefault(r => r.NeedKey == "legal.statutory-capital");
            legalRes.Should().NotBeNull();
            legalRes!.VerificationRequirement.Should().NotBeNull();
            legalRes.VerificationRequirement!.OptionalLearningSupplement.Should().NotBeNull();
            legalRes.VerificationRequirement!.OptionalLearningSupplement!.LearningTopics.Should().Contain("Capital Deposit Basics");
        }

        [Fact]
        public async Task Correction4_Phase4_3_Covered_Requirements_Pass_Through_Directly()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            res.SkillsPlan!.CoveredCapabilities.Should().NotBeEmpty();
            var covered = res.SkillsPlan.CoveredCapabilities.FirstOrDefault(c => c.Capability == "Product Strategy");
            covered.Should().NotBeNull();
            covered!.CoverageSource.Should().Be("Phase4.3Covered");
        }

        [Fact]
        public async Task Correction5_Curated_Taxonomy_Generates_Deterministic_Topics()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var profile = new ProfessionalProfileRecord
            {
                UserId = journey.UserId,
                Skills = new List<ProfileSkill>(),
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "15-25h",
                    LearningPreference = "SelfPaced"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(profile);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var seoRes = res.SkillsPlan!.Resolutions.FirstOrDefault(r => r.NeedKey == "need.seo-growth");
            seoRes.Should().NotBeNull();
            seoRes!.ResolutionMode.Should().Be(ResolutionModes.Learn);
            seoRes.LearningAction.Should().NotBeNull();
            seoRes.LearningAction!.LearningTopics.Should().Contain("Keyword Research & Target Search Intent Mapping");
            seoRes.LearningAction!.LearningTopics.Should().Contain("On-Page SEO & Metadata Optimization");
        }

        [Fact]
        public async Task Correction6_FounderDecision_Decoupled_From_ResolutionMode_And_Preserved_On_Refresh()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var service = CreateService();
            var genRes = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var target = genRes.SkillsPlan!.Resolutions.First(r => r.NeedKey == "need.seo-growth");
            var originalMode = target.ResolutionMode;

            var updateReq = new UpdateResolutionRequest
            {
                IdeaId = journey.ActiveIdeaId,
                FounderDecision = FounderDecisionChoices.ChooseDelegate,
                FounderNotes = "Prefer to hire an agency for SEO"
            };

            _journeysMock.Setup(j => j.SetPhase4SkillsPlanAsync(journey.UserId, It.IsAny<SkillsPlan>(), journey.ActiveIdeaId))
                .Callback<string, SkillsPlan, string?>((u, p, i) =>
                {
                    journey.Phase4Data!.SkillsPlan = p;
                })
                .ReturnsAsync(journey);

            var updatedRes = await service.UpdateResolutionAsync(journey.UserId, target.Key, updateReq);
            var updatedTarget = updatedRes.SkillsPlan!.Resolutions.First(r => r.Key == target.Key);

            updatedTarget.ResolutionMode.Should().Be(originalMode);
            updatedTarget.FounderDecision.Should().Be(FounderDecisionChoices.ChooseDelegate);
            updatedTarget.FounderNotes.Should().Be("Prefer to hire an agency for SEO");

            var refreshRes = await service.RefreshSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);
            var refreshedTarget = refreshRes.SkillsPlan!.Resolutions.First(r => r.Key == target.Key);

            refreshedTarget.FounderDecision.Should().Be(FounderDecisionChoices.ChooseDelegate);
            refreshedTarget.FounderNotes.Should().Be("Prefer to hire an agency for SEO");
        }

        [Fact]
        public async Task Correction6_Mandatory_Verification_Cannot_Be_Overridden_With_Learn_Or_Delegate()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data!.NeedsAnalysis!.ActiveNeeds.Add(new CreatorNeed
            {
                Key = "legal.statutory-capital",
                Title = "Dépôt de capital en séquestre",
                CapabilityRequired = "Corporate Law Escrow",
                Category = NeedCategories.LegalAndAdministration,
                RequirementType = RequirementTypes.LegalAdministrative,
                Priority = NeedPriority.Critical,
                Timing = NeedTiming.Now,
                Blocking = true,
                Source = new List<string> { "Phase3.LegalAssessment" }
            });

            SetupValidPhaseStatus(journey);

            var service = CreateService();
            var genRes = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var legalRes = genRes.SkillsPlan!.Resolutions.First(r => r.NeedKey == "legal.statutory-capital");
            legalRes.IsMandatoryVerification.Should().BeTrue();

            _journeysMock.Setup(j => j.SetPhase4SkillsPlanAsync(journey.UserId, It.IsAny<SkillsPlan>(), journey.ActiveIdeaId))
                .Callback<string, SkillsPlan, string?>((u, p, i) =>
                {
                    journey.Phase4Data!.SkillsPlan = p;
                })
                .ReturnsAsync(journey);

            var learnAct = async () => await service.UpdateResolutionAsync(
                journey.UserId,
                legalRes.Key,
                new UpdateResolutionRequest { IdeaId = journey.ActiveIdeaId, FounderDecision = FounderDecisionChoices.ChooseLearn });

            await learnAct.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Statutory verification cannot be waived*");

            var delegateAct = async () => await service.UpdateResolutionAsync(
                journey.UserId,
                legalRes.Key,
                new UpdateResolutionRequest { IdeaId = journey.ActiveIdeaId, FounderDecision = FounderDecisionChoices.ChooseDelegate });

            await delegateAct.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Statutory verification cannot be waived*");
        }

        [Fact]
        public async Task LowAvailability_Forces_Delegate_For_Urgent_Need()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var profile = new ProfessionalProfileRecord
            {
                UserId = journey.UserId,
                Skills = new List<ProfileSkill>(),
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "1-5h",
                    LearningPreference = "HandsOn"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(profile);

            var service = CreateService();
            var res = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);

            var backendRes = res.SkillsPlan!.Resolutions.FirstOrDefault(r => r.NeedKey == "need.backend-dev");
            backendRes.Should().NotBeNull();
            backendRes!.ResolutionMode.Should().Be(ResolutionModes.Delegate);
            backendRes.ReasonCode.Should().Be(ResolutionReasonCodes.LowAvailableTime);
            backendRes.DelegationRequirement.Should().NotBeNull();
        }

        [Fact]
        public async Task Staleness_Detects_When_WeeklyAvailability_Or_Preference_Changes()
        {
            var journey = BuildCompleteJourney();
            SetupValidPhaseStatus(journey);

            var initialProfile = new ProfessionalProfileRecord
            {
                UserId = journey.UserId,
                Skills = new List<ProfileSkill>(),
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "15-25h",
                    LearningPreference = "SelfPaced"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(initialProfile);

            var service = CreateService();
            var genRes = await service.GenerateSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);
            journey.Phase4Data!.SkillsPlan = genRes.SkillsPlan;

            var changedProfile = new ProfessionalProfileRecord
            {
                UserId = journey.UserId,
                Skills = new List<ProfileSkill>(),
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "1-5h",
                    LearningPreference = "SelfPaced"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(changedProfile);

            var getRes = await service.GetSkillsPlanAsync(journey.UserId, journey.ActiveIdeaId);
            getRes.UpdateAvailable.Should().BeTrue();
            getRes.ChangedSources.Should().Contain("WeeklyAvailability");
        }
    }
}
