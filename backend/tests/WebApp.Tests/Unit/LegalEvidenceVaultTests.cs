using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Legal;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class LegalEvidenceVaultTests
    {
        private const string TestUserId = "user-evidence-vault-1";
        private const string TestIdeaId = "idea-evidence-vault-1";

        private readonly Mock<ICreatorIdeaStore> _mockIdeas = new();
        private readonly Mock<ILegalApplicabilityEngine> _mockEngine = new();

        private CreatorIdea CreateSampleIdea()
        {
            var idea = new CreatorIdea
            {
                Id = TestIdeaId,
                UserId = TestUserId,
                Documents = new List<CreatorIdeaDocument>
                {
                    new()
                    {
                        Id = "doc-capital-1",
                        DocumentType = CreatorIdeaDocumentTypes.CapitalDepositCert,
                        Title = "Attestation de Dépôt de Capital",
                        FileName = "attestation-depot-qonto.pdf",
                        MimeType = "application/pdf",
                        SizeBytes = 245000,
                        SourceModule = "legal_compliance"
                    },
                    new()
                    {
                        Id = "doc-statuts-1",
                        DocumentType = CreatorIdeaDocumentTypes.StatutsDraft,
                        Title = "Statuts Constitutifs SAS Signés",
                        FileName = "statuts-signes-v1.pdf",
                        MimeType = "application/pdf",
                        SizeBytes = 512000,
                        SourceModule = "legal_compliance"
                    },
                    new()
                    {
                        Id = "doc-insurance-1",
                        DocumentType = CreatorIdeaDocumentTypes.LegalEvidence,
                        Title = "Police Assurance Responsabilité Civile Pro",
                        FileName = "attestation-rc-pro-hiscox.pdf",
                        MimeType = "application/pdf",
                        SizeBytes = 180000,
                        SourceModule = "legal_compliance"
                    }
                },
                Phase3Data = new CreatorPhase3Data
                {
                    LegalAssessment = new CreatorLegalAssessment
                    {
                        Id = "assessment-1",
                        CreatorIdeaId = TestIdeaId,
                        UserId = TestUserId,
                        Jurisdiction = "FR",
                        RulesVersion = "FR-2026.1",
                        PlanningReadinessPct = 0.0,
                        Items = new List<CreatorLegalChecklistItem>
                        {
                            new()
                            {
                                Id = "FR-CORP-001",
                                Title = "Dépôt du capital social et attestation de blocage des fonds",
                                Stage = LegalStages.BeforeCreation,
                                RequiresEvidence = true,
                                EvidenceDocType = "capital_deposit_cert",
                                Status = LegalItemStatuses.ActionRequired
                            },
                            new()
                            {
                                Id = "FR-CORP-002",
                                Title = "Rédaction et signature des statuts constitutifs",
                                Stage = LegalStages.BeforeCreation,
                                RequiresEvidence = true,
                                EvidenceDocType = "statuts_draft",
                                Status = LegalItemStatuses.ActionRequired
                            },
                            new()
                            {
                                Id = "FR-REG-001",
                                Title = "Souscription d'une Assurance Responsabilité Civile Professionnelle",
                                Stage = LegalStages.Ongoing,
                                RequiresEvidence = true,
                                EvidenceDocType = "legal_evidence",
                                Status = LegalItemStatuses.ActionRequired
                            }
                        },
                        StageBreakdown = new List<LegalStageBreakdown>
                        {
                            new() { Stage = LegalStages.BeforeCreation, StageName = "Before Company Creation", TotalCount = 2, CompletedCount = 0 },
                            new() { Stage = LegalStages.Ongoing, StageName = "Ongoing Operations", TotalCount = 1, CompletedCount = 0 }
                        }
                    }
                }
            };

            return idea;
        }

        private CreatorJourneyService CreateService(CreatorIdea idea)
        {
            var mockDb = new Mock<IMongoDatabase>();
            var journeysCollectionMock = new Mock<IMongoCollection<CreatorJourney>>();

            var journey = new CreatorJourney
            {
                Id = "journey-1",
                UserId = idea.UserId,
                ActiveIdeaId = idea.Id
            };

            var cursorMock = new Mock<IAsyncCursor<CreatorJourney>>();
            cursorMock.Setup(c => c.Current).Returns(new List<CreatorJourney> { journey });
            cursorMock.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);

            journeysCollectionMock.Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<CreatorJourney>>(),
                    It.IsAny<FindOptions<CreatorJourney, CreatorJourney>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(cursorMock.Object);

            journeysCollectionMock.Setup(c => c.UpdateOneAsync(
                    It.IsAny<FilterDefinition<CreatorJourney>>(),
                    It.IsAny<UpdateDefinition<CreatorJourney>>(),
                    It.IsAny<UpdateOptions>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            mockDb.Setup(d => d.GetCollection<CreatorJourney>("CreatorJourneys", null))
                .Returns(journeysCollectionMock.Object);

            var context = new MongoDbContext(mockDb.Object);

            _mockIdeas.Setup(s => s.GetOwnedAsync(idea.Id, idea.UserId))
                .ReturnsAsync(idea);
            _mockIdeas.Setup(s => s.ListByUserAsync(idea.UserId))
                .ReturnsAsync(new List<CreatorIdea> { idea });
            _mockIdeas.Setup(s => s.UpdateAsync(idea.Id, idea.UserId, It.IsAny<UpdateDefinition<CreatorIdea>>(), It.IsAny<long?>(), It.IsAny<IClientSessionHandle?>()))
                .ReturnsAsync(true);

            _mockEngine.Setup(e => e.ComputePlanningReadiness(It.IsAny<List<CreatorLegalChecklistItem>>()))
                .Returns(33.3);

            return new CreatorJourneyService(
                context,
                Mock.Of<IBusinessPlanSessionStore>(),
                Mock.Of<IForecastSessionStore>(),
                _mockIdeas.Object,
                Mock.Of<IClarifierSessionStore>(),
                httpContextAccessor: null,
                marketStudies: null,
                businessModels: null,
                legalEngine: _mockEngine.Object);
        }

        [Fact]
        public async Task AttachEvidence_CreatesLink_And_LogsAuditTrail()
        {
            // Given: Idea with legal assessment
            var idea = CreateSampleIdea();
            var service = CreateService(idea);

            // When: Attaching capital deposit certificate to requirement FR-CORP-001
            var result = await service.AttachLegalAssessmentItemEvidenceAsync(
                TestUserId, "FR-CORP-001", "doc-capital-1", LegalEvidenceStatuses.Linked, "Initial bank deposit", TestIdeaId);

            // Then: Assessment item has evidence attached
            var assessment = result.Phase3Data.LegalAssessment;
            assessment.Should().NotBeNull();
            var item = assessment.Items.First(i => i.Id == "FR-CORP-001");
            item.EvidenceDocumentId.Should().Be("doc-capital-1");
            item.EvidenceFileName.Should().Be("attestation-depot-qonto.pdf");
            item.Status.Should().Be(LegalItemStatuses.ReadyForReview);

            // And: EvidenceLinks list records the association
            assessment.EvidenceLinks.Should().HaveCount(1);
            var link = assessment.EvidenceLinks[0];
            link.RequirementId.Should().Be("FR-CORP-001");
            link.DocumentId.Should().Be("doc-capital-1");
            link.DocumentFileName.Should().Be("attestation-depot-qonto.pdf");
            link.Status.Should().Be(LegalEvidenceStatuses.Linked);
            link.Notes.Should().Be("Initial bank deposit");
            link.LinkedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

            // And: EvidenceAuditTrail logs the action with timestamp
            assessment.EvidenceAuditTrail.Should().HaveCount(1);
            var audit = assessment.EvidenceAuditTrail[0];
            audit.Action.Should().Be(LegalEvidenceAuditActions.Linked);
            audit.RequirementId.Should().Be("FR-CORP-001");
            audit.DocumentId.Should().Be("doc-capital-1");
            audit.ActorUserId.Should().Be(TestUserId);
            audit.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        }

        [Fact]
        public async Task AttachEvidence_MultipleDocuments_To_SingleRequirement()
        {
            // Given: Idea with legal assessment
            var idea = CreateSampleIdea();
            var service = CreateService(idea);

            // When: Attaching two different evidence documents to FR-CORP-001
            await service.AttachLegalAssessmentItemEvidenceAsync(TestUserId, "FR-CORP-001", "doc-capital-1", null, null, TestIdeaId);
            var result = await service.AttachLegalAssessmentItemEvidenceAsync(TestUserId, "FR-CORP-001", "doc-statuts-1", null, null, TestIdeaId);

            var assessment = result.Phase3Data.LegalAssessment;

            // Then: Both links are stored
            assessment.EvidenceLinks.Should().HaveCount(2);
            assessment.EvidenceLinks.Select(l => l.DocumentId).Should().Contain(new[] { "doc-capital-1", "doc-statuts-1" });

            // And: Two distinct audit trail entries are logged
            assessment.EvidenceAuditTrail.Should().HaveCount(2);
            assessment.EvidenceAuditTrail.All(a => a.Action == LegalEvidenceAuditActions.Linked).Should().BeTrue();
        }

        [Fact]
        public async Task AttachEvidence_SingleDocument_To_MultipleRequirements()
        {
            // Given: Idea with legal assessment
            var idea = CreateSampleIdea();
            var service = CreateService(idea);

            // When: Linking doc-statuts-1 to both FR-CORP-001 and FR-CORP-002
            await service.AttachLegalAssessmentItemEvidenceAsync(TestUserId, "FR-CORP-001", "doc-statuts-1", null, null, TestIdeaId);
            var result = await service.AttachLegalAssessmentItemEvidenceAsync(TestUserId, "FR-CORP-002", "doc-statuts-1", null, null, TestIdeaId);

            var assessment = result.Phase3Data.LegalAssessment;

            // Then: Document is linked to both requirements
            assessment.EvidenceLinks.Should().HaveCount(2);
            var docLinks = assessment.EvidenceLinks.Where(l => l.DocumentId == "doc-statuts-1").ToList();
            docLinks.Should().HaveCount(2);
            docLinks.Select(l => l.RequirementId).Should().Contain(new[] { "FR-CORP-001", "FR-CORP-002" });
        }

        [Fact]
        public async Task UnlinkEvidence_RemovesLink_PreservesProjectDocument_And_LogsAuditTrail()
        {
            // Given: Requirement with linked document
            var idea = CreateSampleIdea();
            var service = CreateService(idea);
            await service.AttachLegalAssessmentItemEvidenceAsync(TestUserId, "FR-CORP-001", "doc-capital-1", null, null, TestIdeaId);

            // When: Unlinking document from requirement
            var result = await service.UnlinkLegalAssessmentItemEvidenceAsync(TestUserId, "FR-CORP-001", "doc-capital-1", TestIdeaId);

            var assessment = result.Phase3Data.LegalAssessment;

            // Then: Link is removed from EvidenceLinks
            assessment.EvidenceLinks.Should().BeEmpty();

            // And: Primary item evidence reference is cleared
            var item = assessment.Items.First(i => i.Id == "FR-CORP-001");
            item.EvidenceDocumentId.Should().BeNull();
            item.EvidenceFileName.Should().BeNull();
            item.Status.Should().Be(LegalItemStatuses.ActionRequired);

            // And: Physical document is RETAINED in idea.Documents (no project data loss)
            idea.Documents.Should().HaveCount(3);
            idea.Documents.Select(d => d.Id).Should().Contain("doc-capital-1");

            // And: Audit trail records the unlink event
            assessment.EvidenceAuditTrail.Should().HaveCount(2); // 1 linked + 1 unlinked
            var lastAudit = assessment.EvidenceAuditTrail.Last();
            lastAudit.Action.Should().Be(LegalEvidenceAuditActions.Unlinked);
            lastAudit.RequirementId.Should().Be("FR-CORP-001");
            lastAudit.DocumentId.Should().Be("doc-capital-1");
            lastAudit.Detail.Should().Contain("preserved in project vault");
        }

        [Fact]
        public async Task UpdateEvidenceStatus_UpdatesStatus_And_LogsAuditTrail()
        {
            // Given: Attached evidence
            var idea = CreateSampleIdea();
            var service = CreateService(idea);
            await service.AttachLegalAssessmentItemEvidenceAsync(TestUserId, "FR-REG-001", "doc-insurance-1", LegalEvidenceStatuses.Linked, null, TestIdeaId);

            var assessment = idea.Phase3Data.LegalAssessment;
            var linkId = assessment.EvidenceLinks.First().Id;

            // When: Updating status to accepted_for_planning
            var result = await service.UpdateLegalEvidenceStatusAsync(
                TestUserId, linkId, LegalEvidenceStatuses.AcceptedForPlanning, "Verified with broker", TestIdeaId);

            // Then: Link status is updated
            var updatedLink = result.Phase3Data.LegalAssessment.EvidenceLinks.First(l => l.Id == linkId);
            updatedLink.Status.Should().Be(LegalEvidenceStatuses.AcceptedForPlanning);
            updatedLink.Notes.Should().Be("Verified with broker");

            // And: Audit entry for status_changed is recorded
            var lastAudit = result.Phase3Data.LegalAssessment.EvidenceAuditTrail.Last();
            lastAudit.Action.Should().Be(LegalEvidenceAuditActions.StatusChanged);
            lastAudit.Detail.Should().Contain("accepted_for_planning");
        }

        [Fact]
        public async Task AttachEvidence_UnownedDocument_ThrowsNotFound()
        {
            // Given: Document ID not present in idea.Documents
            var idea = CreateSampleIdea();
            var service = CreateService(idea);

            // When / Then: Trying to attach unowned document throws CreatorJourneyException
            var act = async () => await service.AttachLegalAssessmentItemEvidenceAsync(
                TestUserId, "FR-CORP-001", "doc-other-tenant-999", null, null, TestIdeaId);

            await act.Should().ThrowAsync<CreatorJourneyException>()
                .WithMessage("*not found on this project*");
        }
    }
}
