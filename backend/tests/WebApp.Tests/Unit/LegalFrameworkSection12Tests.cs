using FluentAssertions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Legal;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class LegalFrameworkSection12Tests
    {
        private LegalFrameworkSectionBuilder CreateBuilder()
        {
            return new LegalFrameworkSectionBuilder();
        }

        private CreatorIdea CreateTestIdea(string businessName)
        {
            return new CreatorIdea
            {
                Id = "idea-sec12-1",
                UserId = "user-sec12-1",
                Project = new CreatorJourneyProject
                {
                    Name = businessName,
                    Problem = "Test problem",
                    Solution = "Test solution",
                    TargetUser = "Test user"
                },
                Documents = new List<CreatorIdeaDocument>(),
                Phase3Data = new CreatorPhase3Data()
            };
        }

        private LegalRulesCatalogFile CreateSampleCatalog()
        {
            return new LegalRulesCatalogFile
            {
                RulesVersion = "FR-2026.1",
                Jurisdiction = "FR",
                Title = "France Commercial & Tech Legal Catalog 2026"
            };
        }

        [Fact]
        public void Scenario1_FranceB2BSaaS_GeneratesExpectedSubsections()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("CloudMetrics SaaS");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 40.0,
                EvaluatedAt = DateTime.UtcNow,
                DetectedArchetypes = new List<string> { "SaaS", "B2B" },
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-CORP-001",
                        Category = "corporate",
                        Title = "Dépôt de capital et statuts SAS",
                        Stage = LegalStages.CompanyCreation,
                        Status = LegalItemStatuses.Completed,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable,
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "Légifrance",
                            Title = "Code de commerce L223-7",
                            Url = "https://legifrance.gouv.fr"
                        }
                    },
                    new()
                    {
                        Id = "FR-PRIV-001",
                        Category = "data_privacy",
                        Title = "Registre des traitements RGPD & DPA B2B",
                        Stage = LegalStages.BeforeLaunch,
                        Status = LegalItemStatuses.InProgress,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable,
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "CNIL",
                            Title = "Guide RGPD B2B",
                            Url = "https://cnil.fr"
                        }
                    }
                },
                StageBreakdown = new List<LegalStageBreakdown>
                {
                    new() { Stage = LegalStages.CompanyCreation, StageName = "Company Creation", TotalCount = 1, CompletedCount = 1 },
                    new() { Stage = LegalStages.BeforeLaunch, StageName = "Before Launch", TotalCount = 1, CompletedCount = 0 }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.Should().NotBeNull();
            result.Jurisdiction.Should().Be("France");
            result.RulesVersion.Should().Be("FR-2026.1");
            result.PlanningReadinessPercentage.Should().Be(40);
            result.IsStale.Should().BeFalse();
            // 12.1 & 12.2 are always present, 12.3 is Formation, 12.5 is RGPD
            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.1");
            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.2");
            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.3");
            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.5");
            // Pure B2B SaaS suppresses Consumer Terms (12.7)
            result.Subsections.Should().NotContain(s => s.SubsectionKey == "12.7");
            result.RoadmapSummary.Should().NotBeEmpty();
            result.OfficialSources.Should().HaveCount(2);
        }

        [Fact]
        public void Scenario2_B2CSubscriptionSaaS_IncludesConsumerLawAndRGPD()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("FitApp Subscriptions");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 25.0,
                EvaluatedAt = DateTime.UtcNow,
                DetectedArchetypes = new List<string> { "SaaS", "B2C", "Subscription" },
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-CONS-001",
                        Category = "consumer_protection",
                        Title = "Droit de rétractation 14 jours & CGV Consommateur",
                        Stage = LegalStages.BeforeSale,
                        Status = LegalItemStatuses.ActionRequired,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable,
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "DGCCRF",
                            Title = "Code de la consommation L221-18",
                            Url = "https://legifrance.gouv.fr"
                        }
                    },
                    new()
                    {
                        Id = "FR-PRIV-001",
                        Category = "data_privacy",
                        Title = "Politique de cookies et traceurs RGPD",
                        Stage = LegalStages.BeforeLaunch,
                        Status = LegalItemStatuses.InProgress,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable,
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "CNIL",
                            Title = "Recommandations Cookies CNIL",
                            Url = "https://cnil.fr"
                        }
                    }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.5"); // Data Privacy RGPD
            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.7"); // Commercial & Consumer Terms
        }

        [Fact]
        public void Scenario3_EcommercePhysicalGoods_IncludesConsumerAndDigitalCommerce()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("EcoShop France");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 50.0,
                EvaluatedAt = DateTime.UtcNow,
                DetectedArchetypes = new List<string> { "E-commerce", "B2C" },
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-DIGI-001",
                        Category = "commercial",
                        Title = "Mentions légales e-commerce LCEN et hébergeur",
                        Stage = LegalStages.BeforeLaunch,
                        Status = LegalItemStatuses.Completed,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable,
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "DGCCRF",
                            Title = "Loi Confiance dans l'Economie Numérique",
                            Url = "https://legifrance.gouv.fr"
                        }
                    }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.6"); // Digital Commerce / LCEN
        }

        [Fact]
        public void Scenario4_MarketplaceTwoSided_IncludesPlatformObligations()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("MarketMatch Plateforme");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 10.0,
                EvaluatedAt = DateTime.UtcNow,
                DetectedArchetypes = new List<string> { "Marketplace", "B2B", "B2C" },
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-PLAT-001",
                        Category = "regulatory",
                        Title = "Obligations Réglementées pour Plateformes et Opérateurs en Ligne",
                        Stage = LegalStages.BeforeLaunch,
                        Status = LegalItemStatuses.ActionRequired,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable,
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "DGCCRF",
                            Title = "Obligations de transparence plateformes L111-7",
                            Url = "https://legifrance.gouv.fr"
                        }
                    }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.4"); // Regulatory Requirements
        }

        [Fact]
        public void Scenario5_ConsultingServices_FocusesOnProfessionalLiabilityAndInsurance()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("Elite Strategy Consulting");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 70.0,
                EvaluatedAt = DateTime.UtcNow,
                DetectedArchetypes = new List<string> { "Consulting", "B2B" },
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-INS-001",
                        Category = "insurance",
                        Title = "Assurance Responsabilité Civile Professionnelle (RC Pro)",
                        Stage = LegalStages.Ongoing,
                        Status = LegalItemStatuses.Completed,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable,
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "France Assureurs",
                            Title = "Recommandations RC Pro Conseil",
                            Url = "https://franceassureurs.fr"
                        }
                    }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.9"); // Insurance & Operational Safeguards
        }

        [Fact]
        public void Scenario6_NeedsInformation_CorrectlyCategorizedInSection12()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("Fintech PayPay");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 30.0,
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-FIN-001",
                        Category = "regulatory",
                        Title = "Agrément ACPR Prestataire de Services de Paiement",
                        Stage = LegalStages.BeforeLaunch,
                        Status = LegalItemStatuses.ActionRequired,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.NeedsInformation,
                        WhyItApplies = "Préciser si la plateforme encaisse des fonds pour compte de tiers ou délègue à un PSP tiers agréé.",
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "ACPR",
                            Title = "Réglementation DSP2",
                            Url = "https://acpr.banque-france.fr"
                        }
                    }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.NeedsInformationItems.Should().HaveCount(1);
            var item = result.NeedsInformationItems[0];
            item.RequirementId.Should().Be("FR-FIN-001");
            item.ClarificationGuidance.Should().Contain("Préciser si la plateforme encaisse");
        }

        [Fact]
        public void Scenario7_ZeroEvidence_ReportsZeroDocumentsLinked()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("ZeroProof Venture");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 0.0,
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-CORP-001",
                        Category = "corporate",
                        Title = "Dépôt de capital",
                        Stage = LegalStages.CompanyCreation,
                        Status = LegalItemStatuses.ActionRequired,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable
                    }
                },
                EvidenceLinks = new List<LegalEvidenceLink>()
            };

            var result = builder.Build(assessment, idea, catalog);

            result.EvidenceSummary.Should().NotBeNull();
            result.EvidenceSummary.TotalDocumentsLinked.Should().Be(0);
            result.EvidenceSummary.AcceptedForPlanningCount.Should().Be(0);
            result.EvidenceSummary.SummaryText.Should().Contain("0 supporting document(s)");
        }

        [Fact]
        public void Scenario8_MultipleEvidenceLinks_ReflectedInEvidenceSummary()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("MultiProof Venture");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 80.0,
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-001", Category = "corporate", Title = "Dépôt de capital", Stage = LegalStages.CompanyCreation, Status = LegalItemStatuses.Completed, EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable },
                    new() { Id = "FR-CORP-002", Category = "corporate", Title = "Statuts signés", Stage = LegalStages.CompanyCreation, Status = LegalItemStatuses.Completed, EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable }
                },
                EvidenceLinks = new List<LegalEvidenceLink>
                {
                    new() { DocumentId = "doc-1", RequirementId = "FR-CORP-001", Status = LegalEvidenceStatuses.AcceptedForPlanning },
                    new() { DocumentId = "doc-2", RequirementId = "FR-CORP-002", Status = LegalEvidenceStatuses.NeedsReview }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.EvidenceSummary.Should().NotBeNull();
            result.EvidenceSummary.TotalDocumentsLinked.Should().Be(2);
            result.EvidenceSummary.AcceptedForPlanningCount.Should().Be(1);
            result.EvidenceSummary.NeedsReviewCount.Should().Be(1);
        }

        [Fact]
        public void Scenario9_100PercentReadiness_ReflectsFullPlanningReadiness()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("ReadyCorp");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 100.0,
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-001", Category = "corporate", Title = "Statuts signés", Stage = LegalStages.CompanyCreation, Status = LegalItemStatuses.Completed, EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable }
                },
                StageBreakdown = new List<LegalStageBreakdown>
                {
                    new() { Stage = LegalStages.CompanyCreation, StageName = "Company Creation", TotalCount = 1, CompletedCount = 1 }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.PlanningReadinessPercentage.Should().Be(100);
            result.PriorityOpenItems.Should().BeEmpty();
            result.Summary.Should().Contain("100%");
        }

        [Fact]
        public void Scenario10_PartialReadiness_ListsPriorityOpenItems()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("PartialCorp");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 35.0,
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-001", Category = "corporate", Title = "Compte bancaire et dépôt de capital", Stage = LegalStages.BeforeCreation, Priority = LegalPriorities.Critical, Status = LegalItemStatuses.ActionRequired, EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable },
                    new() { Id = "FR-PRIV-001", Category = "data_privacy", Title = "Formalités RGPD", Stage = LegalStages.BeforeLaunch, Priority = LegalPriorities.Recommended, Status = LegalItemStatuses.InProgress, EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.PriorityOpenItems.Should().HaveCount(2);
            result.PriorityOpenItems.Should().Contain(i => i.RequirementId == "FR-CORP-001" && i.Priority == "Immediate");
        }

        [Fact]
        public void Scenario11_StaleLegalAssessment_DetectedWhenFlaggedOrModifiedAfterwards()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("OutdatedCorp");
            idea.UpdatedAt = DateTime.UtcNow; // Updated after evaluation
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 50.0,
                EvaluatedAt = DateTime.UtcNow.AddMinutes(-30),
                IsPotentiallyOutdated = true,
                Items = new List<CreatorLegalChecklistItem>()
            };

            var result = builder.Build(assessment, idea, catalog);

            result.IsStale.Should().BeTrue();
            result.StaleReason.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void Scenario12_AiUnavailableFallback_DeterministicSection12BuildsFullyWithoutAi()
        {
            var builder = CreateBuilder();
            var idea = CreateTestIdea("NoAiVenture");
            var catalog = CreateSampleCatalog();

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                PlanningReadinessPct = 50.0,
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-TAX-001", Category = "tax_social", Title = "Option TVA et régime fiscal de Facturation", Stage = LegalStages.BeforeLaunch, Status = LegalItemStatuses.Completed, EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable }
                }
            };

            var result = builder.Build(assessment, idea, catalog);

            result.Should().NotBeNull();
            result.Subsections.Should().Contain(s => s.SubsectionKey == "12.10"); // Tax & Invoicing
            result.DisclaimerNotice.Should().Contain("Planning guidance only");
        }

        [Fact]
        public void Scenario13_EvidenceReplacement_PreservesDocumentAndUpdatesActiveLink()
        {
            var idea = CreateTestIdea("ReplaceProofCorp");
            var catalog = CreateSampleCatalog();

            idea.Documents.Add(new CreatorIdeaDocument
            {
                Id = "doc-old-1",
                Title = "Old Statuts Draft",
                FileName = "statuts-draft-v1.pdf"
            });
            idea.Documents.Add(new CreatorIdeaDocument
            {
                Id = "doc-new-2",
                Title = "New Statuts Final",
                FileName = "statuts-final-v2.pdf"
            });

            var assessment = new CreatorLegalAssessment
            {
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-CORP-002",
                        Category = "corporate",
                        Title = "Statuts constitutifs",
                        EvidenceDocumentId = "doc-new-2",
                        EvidenceFileName = "statuts-final-v2.pdf",
                        Status = LegalItemStatuses.ReadyForReview,
                        EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable
                    }
                },
                EvidenceLinks = new List<LegalEvidenceLink>
                {
                    new()
                    {
                        Id = "link-1",
                        RequirementId = "FR-CORP-002",
                        DocumentId = "doc-old-1",
                        DocumentFileName = "statuts-draft-v1.pdf",
                        Status = LegalEvidenceStatuses.Replaced
                    },
                    new()
                    {
                        Id = "link-2",
                        RequirementId = "FR-CORP-002",
                        DocumentId = "doc-new-2",
                        DocumentFileName = "statuts-final-v2.pdf",
                        Status = LegalEvidenceStatuses.Linked
                    }
                }
            };

            var builder = CreateBuilder();
            var section12 = builder.Build(assessment, idea, catalog);

            // Replaced document remains in Documents collection
            idea.Documents.Should().HaveCount(2);
            // Section 12 evidence summary counts only active linked documents (non-replaced)
            section12.EvidenceSummary.TotalDocumentsLinked.Should().Be(1);
        }
    }
}
