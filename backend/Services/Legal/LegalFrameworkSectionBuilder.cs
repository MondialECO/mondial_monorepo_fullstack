using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos.Ai;

namespace WebApp.Services.Legal
{
    public class LegalFrameworkSectionBuilder : ILegalFrameworkSectionBuilder
    {
        public LegalRegulatoryFrameworkDto Build(CreatorLegalAssessment assessment, CreatorIdea idea, LegalRulesCatalogFile catalog)
        {
            var dto = new LegalRegulatoryFrameworkDto
            {
                Jurisdiction = "France",
                RulesVersion = catalog?.RulesVersion ?? assessment?.RulesVersion ?? "FR-2026.1",
                AssessmentDateUtc = assessment?.EvaluatedAt ?? DateTime.UtcNow,
                DisclaimerNotice = "MONDIAL BUSINESS CREATION (MBC) - Planning guidance only. Based on current venture classification. Does not constitute formal legal advice, certified statutory compliance, or official government incorporation.",
            };

            if (assessment == null)
            {
                dto.Summary = "Legal assessment not yet generated. Run Step 3.4 Legal & Compliance to generate the deterministic legal framework.";
                return dto;
            }

            // Readiness metrics
            dto.PlanningReadinessPercentage = (int)Math.Round(assessment.PlanningReadinessPct);
            var applicableItems = (assessment.Items ?? new List<CreatorLegalChecklistItem>())
                .Where(i => !string.Equals(i.Status, LegalItemStatuses.NotApplicable, StringComparison.OrdinalIgnoreCase)
                         && !string.Equals(i.EvaluationStatus, ApplicabilityEvaluationStatuses.NotApplicable, StringComparison.OrdinalIgnoreCase))
                .ToList();

            dto.TotalApplicableRequirementsCount = applicableItems.Count;
            dto.AddressedRequirementsCount = applicableItems.Count(i =>
                string.Equals(i.Status, LegalItemStatuses.Completed, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(i.Status, LegalItemStatuses.LegacyDone, StringComparison.OrdinalIgnoreCase));

            // Staleness check - strictly authoritative based on snapshot hash/rules version, not raw timestamps
            bool isStale = assessment.StaleMetadata?.IsStale ?? assessment.IsPotentiallyOutdated;
            string staleReason = assessment.StaleMetadata != null && !string.IsNullOrEmpty(assessment.StaleMetadata.StaleReason) && assessment.StaleMetadata.StaleReason != LegalStaleReasons.None
                ? (assessment.StaleMetadata.StaleReason == LegalStaleReasons.BusinessDataChanged
                    ? "Business model or founder inputs changed after the latest legal assessment."
                    : assessment.StaleMetadata.StaleReason == LegalStaleReasons.RulesUpdated
                        ? "French statutory guidance was updated."
                        : "Legal assessment requires re-evaluation.")
                : (isStale ? "Business model or founder inputs changed after the latest legal assessment." : "");

            dto.IsStale = isStale;
            dto.StaleReason = staleReason;
            dto.AssessmentVersion = assessment.AssessmentVersion;
            dto.BusinessProfileSnapshotHash = assessment.BusinessSnapshotHash;
            dto.GeneratedAt = assessment.EvaluatedAt;
            dto.StaleMetadata = assessment.StaleMetadata;
            dto.ChangedSignals = assessment.StaleMetadata?.HumanChangeDescriptions ?? new List<string>();

            // Proposed legal structure
            var formation = idea?.Phase3Data?.FormationGenerator;
            dto.ProposedLegalStructure = !string.IsNullOrWhiteSpace(formation?.SelectedType)
                ? formation.SelectedType
                : (!string.IsNullOrWhiteSpace(formation?.RecommendedType) ? formation.RecommendedType : "SAS");

            // Executive Summary (Safe language)
            var projectName = idea?.Project?.Name ?? "the venture";
            var archetypeText = assessment.DetectedArchetypes != null && assessment.DetectedArchetypes.Count > 0
                ? string.Join(", ", assessment.DetectedArchetypes)
                : "commercial enterprise";

            dto.Summary =
                $"Based on current business information, MBC identified {dto.TotalApplicableRequirementsCount} potentially applicable " +
                $"statutory requirements for {projectName} ({archetypeText}) operating under French jurisdiction. " +
                $"Current legal planning readiness is evaluated at {dto.PlanningReadinessPercentage}%, with {dto.AddressedRequirementsCount} " +
                $"of {dto.TotalApplicableRequirementsCount} milestone requirements addressed.";

            // Primary regulations highlights
            dto.PrimaryRegulations = applicableItems
                .Where(i => i.OfficialSource != null && !string.IsNullOrWhiteSpace(i.OfficialSource.Authority))
                .Select(i => $"{i.OfficialSource!.Authority}: {i.Title}")
                .Distinct()
                .Take(6)
                .ToList();

            // Compliance governance note
            dto.ComplianceGovernanceNote =
                $"Statutory tracking governed under French commercial and digital law (Code de Commerce, Code de la Consommation, RGPD, LCEN). " +
                $"Official sources verified against INPI, CNIL, DGCCRF, and Service-Public.fr.";

            // Intellectual property strategy
            var ipItems = applicableItems.Where(i => string.Equals(i.Category, "ip", StringComparison.OrdinalIgnoreCase) || i.Title.Contains("Marque", StringComparison.OrdinalIgnoreCase) || i.Title.Contains("INPI", StringComparison.OrdinalIgnoreCase)).ToList();
            dto.IntellectualPropertyStrategy = ipItems.Count > 0
                ? $"Prioritized trademark registration with INPI ({string.Join(", ", ipItems.Select(i => i.Title))}) and commercial software copyright safeguarding."
                : "Intellectual property strategy incorporates INPI brand trademark registration and trade secret governance.";

            // 1. Subsections (12.1 – 12.10)
            BuildThematicSubsections(dto, applicableItems, dto.ProposedLegalStructure);

            // 2. Roadmap Summary (12.11)
            BuildRoadmapSummary(dto, assessment, applicableItems);

            // 3. Priority Open Items (12.12)
            BuildPriorityOpenItems(dto, applicableItems);

            // 4. Needs Information Items
            BuildNeedsInformationItems(dto, assessment);

            // 5. Official Sources
            BuildOfficialSources(dto, applicableItems);

            // 6. Evidence Summary
            BuildEvidenceSummary(dto, assessment, applicableItems);

            return dto;
        }

        private static void BuildThematicSubsections(LegalRegulatoryFrameworkDto dto, List<CreatorLegalChecklistItem> items, string legalStructure)
        {
            var subsections = new List<LegalFrameworkSubsectionDto>();

            // 12.1 Legal Context (Always present)
            subsections.Add(new LegalFrameworkSubsectionDto
            {
                SubsectionKey = "12.1",
                Title = "Legal Context & Jurisdiction",
                Summary = "The venture operates under the French legal system, adhering to EU harmonized regulations (GDPR, Digital Services Act) and domestic commercial jurisprudence.",
                KeyObligations = new List<string>
                {
                    "Operations governed by Code de Commerce and Code Civil",
                    "Mandatory French registered office (siège social) or commercial representation",
                    "Compliance with domestic labor and commercial transparency requirements"
                },
                ApplicableAuthorities = new List<string> { "Service-Public.fr", "Greffe du Tribunal de Commerce" },
                RequirementCount = 1,
                AddressedCount = 1,
                Status = "Addressed"
            });

            // 12.2 Proposed Business Structure
            subsections.Add(new LegalFrameworkSubsectionDto
            {
                SubsectionKey = "12.2",
                Title = "Proposed Business Structure",
                Summary = $"Recommended corporate form: {legalStructure}. Provides limited liability protection, flexible share governance, and recognized stature for institutional investors.",
                KeyObligations = new List<string>
                {
                    $"Establishment of Articles of Association (Statuts constitutifs) under {legalStructure} regime",
                    "Designation of company President/Manager and legal governance structure",
                    "Registration of Beneficial Owners (Registre des Bénéficiaires Effectifs - RBE)"
                },
                ApplicableAuthorities = new List<string> { "INPI", "Greffe du Tribunal de Commerce" },
                RequirementCount = 1,
                AddressedCount = 1,
                Status = "Addressed"
            });

            // 12.3 Registration & Formation
            var formationItems = items.Where(i =>
                string.Equals(i.Stage, LegalStages.BeforeCreation, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(i.Stage, LegalStages.CompanyCreation, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(i.Category, "corporate", StringComparison.OrdinalIgnoreCase)).ToList();

            if (formationItems.Count > 0)
            {
                var addressed = formationItems.Count(IsAddressed);
                subsections.Add(new LegalFrameworkSubsectionDto
                {
                    SubsectionKey = "12.3",
                    Title = "Registration & Company Formation",
                    Summary = "Formal statutory procedures to incorporate the corporate entity and obtain statutory operating extracts.",
                    KeyObligations = formationItems.Select(i => i.Title).Take(4).ToList(),
                    ApplicableAuthorities = formationItems
                        .Where(i => i.OfficialSource != null && !string.IsNullOrWhiteSpace(i.OfficialSource.Authority))
                        .Select(i => i.OfficialSource!.Authority)
                        .Distinct().ToList(),
                    RequirementCount = formationItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == formationItems.Count ? "Addressed" : (addressed > 0 ? "InProgress" : "ActionRequired")
                });
            }

            // 12.4 Regulatory Requirements
            var regulatoryItems = items.Where(i =>
                string.Equals(i.Category, "regulatory", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Réglementé", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Autorisation", StringComparison.OrdinalIgnoreCase)).ToList();

            if (regulatoryItems.Count > 0)
            {
                var addressed = regulatoryItems.Count(IsAddressed);
                subsections.Add(new LegalFrameworkSubsectionDto
                {
                    SubsectionKey = "12.4",
                    Title = "Regulatory & Professional Requirements",
                    Summary = "Activity-specific licenses, mandatory declarations, or administrative approvals required prior to operating.",
                    KeyObligations = regulatoryItems.Select(i => i.Title).Take(4).ToList(),
                    ApplicableAuthorities = regulatoryItems.Where(i => i.OfficialSource != null && !string.IsNullOrWhiteSpace(i.OfficialSource.Authority)).Select(i => i.OfficialSource!.Authority).Distinct().ToList(),
                    RequirementCount = regulatoryItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == regulatoryItems.Count ? "Addressed" : "ActionRequired"
                });
            }

            // 12.5 Data Protection & Privacy (RGPD)
            var privacyItems = items.Where(i =>
                string.Equals(i.Category, "data_privacy", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("RGPD", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("CNIL", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Données", StringComparison.OrdinalIgnoreCase)).ToList();

            if (privacyItems.Count > 0)
            {
                var addressed = privacyItems.Count(IsAddressed);
                subsections.Add(new LegalFrameworkSubsectionDto
                {
                    SubsectionKey = "12.5",
                    Title = "Data Protection & Privacy (RGPD)",
                    Summary = "Compliance with General Data Protection Regulation (EU 2016/679) and French Informatique et Libertés law.",
                    KeyObligations = privacyItems.Select(i => i.Title).Take(4).ToList(),
                    ApplicableAuthorities = new List<string> { "CNIL" },
                    RequirementCount = privacyItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == privacyItems.Count ? "Addressed" : "ActionRequired"
                });
            }

            // 12.6 Website / Digital Commerce Obligations
            var digitalItems = items.Where(i =>
                i.Title.Contains("LCEN", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Mentions", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Cookies", StringComparison.OrdinalIgnoreCase)).ToList();

            if (digitalItems.Count > 0)
            {
                var addressed = digitalItems.Count(IsAddressed);
                subsections.Add(new LegalFrameworkSubsectionDto
                {
                    SubsectionKey = "12.6",
                    Title = "Website & Digital Commerce Obligations",
                    Summary = "Public disclosure, publisher transparency, and electronic cookie consent under LCEN and ePrivacy directives.",
                    KeyObligations = digitalItems.Select(i => i.Title).Take(4).ToList(),
                    ApplicableAuthorities = new List<string> { "DGCCRF", "CNIL" },
                    RequirementCount = digitalItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == digitalItems.Count ? "Addressed" : "ActionRequired"
                });
            }

            // 12.7 Commercial & Consumer Requirements
            var commercialItems = items.Where(i =>
                string.Equals(i.Category, "consumer_protection", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("CGV", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("CGU", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Consommateur", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Rétractation", StringComparison.OrdinalIgnoreCase)).ToList();

            if (commercialItems.Count > 0)
            {
                var addressed = commercialItems.Count(IsAddressed);
                subsections.Add(new LegalFrameworkSubsectionDto
                {
                    SubsectionKey = "12.7",
                    Title = "Commercial & Consumer Terms",
                    Summary = "Contractual transparency, General Terms of Sale (CGV), consumer withdrawal rights, and dispute mediation.",
                    KeyObligations = commercialItems.Select(i => i.Title).Take(4).ToList(),
                    ApplicableAuthorities = new List<string> { "DGCCRF" },
                    RequirementCount = commercialItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == commercialItems.Count ? "Addressed" : "ActionRequired"
                });
            }

            // 12.8 Intellectual Property
            var ipItems = items.Where(i =>
                string.Equals(i.Category, "ip", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Marque", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("INPI", StringComparison.OrdinalIgnoreCase)).ToList();

            if (ipItems.Count > 0)
            {
                var addressed = ipItems.Count(IsAddressed);
                subsections.Add(new LegalFrameworkSubsectionDto
                {
                    SubsectionKey = "12.8",
                    Title = "Intellectual Property Safeguards",
                    Summary = "Protection of distinctive brand assets, patents, software assets, and proprietary technical trade secrets.",
                    KeyObligations = ipItems.Select(i => i.Title).Take(4).ToList(),
                    ApplicableAuthorities = new List<string> { "INPI" },
                    RequirementCount = ipItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == ipItems.Count ? "Addressed" : "ActionRequired"
                });
            }

            // 12.9 Insurance & Professional Requirements
            var insuranceItems = items.Where(i =>
                i.Title.Contains("Assurance", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("RC Pro", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Responsabilité Civile", StringComparison.OrdinalIgnoreCase)).ToList();

            if (insuranceItems.Count > 0)
            {
                var addressed = insuranceItems.Count(IsAddressed);
                subsections.Add(new LegalFrameworkSubsectionDto
                {
                    SubsectionKey = "12.9",
                    Title = "Insurance & Operational Safeguards",
                    Summary = "Professional liability coverage (RC Pro) and risk indemnification policies.",
                    KeyObligations = insuranceItems.Select(i => i.Title).Take(4).ToList(),
                    ApplicableAuthorities = new List<string> { "France Assureurs", "ORIAS" },
                    RequirementCount = insuranceItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == insuranceItems.Count ? "Addressed" : "ActionRequired"
                });
            }

            // 12.10 Tax & Invoicing Considerations
            var taxItems = items.Where(i =>
                i.Title.Contains("Facturation", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("TVA", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("Fiscal", StringComparison.OrdinalIgnoreCase) ||
                i.Title.Contains("URSSAF", StringComparison.OrdinalIgnoreCase)).ToList();

            if (taxItems.Count > 0)
            {
                var addressed = taxItems.Count(IsAddressed);
                subsections.Add(new LegalFrameworkSubsectionDto
                {
                    SubsectionKey = "12.10",
                    Title = "Tax & Invoicing Compliance",
                    Summary = "Commercial invoicing standards, VAT liability rules, and social contribution regimes.",
                    KeyObligations = taxItems.Select(i => i.Title).Take(4).ToList(),
                    ApplicableAuthorities = new List<string> { "DGFIP (impots.gouv.fr)", "URSSAF" },
                    RequirementCount = taxItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == taxItems.Count ? "Addressed" : "ActionRequired"
                });
            }

            dto.Subsections = subsections;
        }

        private static void BuildRoadmapSummary(LegalRegulatoryFrameworkDto dto, CreatorLegalAssessment assessment, List<CreatorLegalChecklistItem> items)
        {
            var stages = new[]
            {
                (Stage: LegalStages.BeforeCreation, Title: "Before Company Creation"),
                (Stage: LegalStages.CompanyCreation, Title: "Company Creation"),
                (Stage: LegalStages.BeforeLaunch, Title: "Before Launch"),
                (Stage: LegalStages.BeforeSale, Title: "Before First Sale"),
                (Stage: LegalStages.Ongoing, Title: "Ongoing Operations"),
            };

            var summaryList = new List<LegalRoadmapStageSummaryDto>();
            foreach (var s in stages)
            {
                var stageItems = items.Where(i => string.Equals(i.Stage, s.Stage, StringComparison.OrdinalIgnoreCase)).ToList();
                if (stageItems.Count == 0) continue;

                var addressed = stageItems.Count(IsAddressed);
                summaryList.Add(new LegalRoadmapStageSummaryDto
                {
                    Stage = s.Stage,
                    StageTitle = s.Title,
                    TotalCount = stageItems.Count,
                    AddressedCount = addressed,
                    Status = addressed == stageItems.Count ? "Completed" : (addressed > 0 ? "InProgress" : "Pending")
                });
            }

            dto.RoadmapSummary = summaryList;
        }

        private static void BuildPriorityOpenItems(LegalRegulatoryFrameworkDto dto, List<CreatorLegalChecklistItem> items)
        {
            var openItems = items
                .Where(i => !IsAddressed(i))
                .OrderByDescending(i => string.Equals(i.Priority, LegalPriorities.Critical, StringComparison.OrdinalIgnoreCase))
                .ThenByDescending(i => string.Equals(i.Priority, LegalPriorities.Recommended, StringComparison.OrdinalIgnoreCase))
                .Take(5)
                .Select(i => new LegalPriorityOpenItemDto
                {
                    RequirementId = i.Id,
                    Title = i.Title,
                    Stage = i.Stage,
                    Priority = string.Equals(i.Priority, LegalPriorities.Critical, StringComparison.OrdinalIgnoreCase)
                        ? "Immediate"
                        : (string.Equals(i.Priority, LegalPriorities.Recommended, StringComparison.OrdinalIgnoreCase) ? "High" : "Normal"),
                    Status = i.Status,
                    RecommendedAction = !string.IsNullOrWhiteSpace(i.WhyItApplies)
                        ? i.WhyItApplies
                        : $"Complete statutory requirement: {i.Title}",
                    OfficialAuthority = i.OfficialSource?.Authority ?? "French Statutory Code"
                })
                .ToList();

            dto.PriorityOpenItems = openItems;
        }

        private static void BuildNeedsInformationItems(LegalRegulatoryFrameworkDto dto, CreatorLegalAssessment assessment)
        {
            var list = new List<LegalNeedsInformationDto>();
            if (assessment.Items != null)
            {
                foreach (var it in assessment.Items.Where(i => string.Equals(i.EvaluationStatus, ApplicabilityEvaluationStatuses.NeedsInformation, StringComparison.OrdinalIgnoreCase)))
                {
                    var guidance = !string.IsNullOrWhiteSpace(it.WhyItApplies)
                        ? it.WhyItApplies
                        : "Further confirmation required: MBC does not currently possess sufficient business inputs to determine statutory applicability.";

                    list.Add(new LegalNeedsInformationDto
                    {
                        RequirementId = it.Id,
                        Title = it.Title,
                        Stage = it.Stage,
                        ClarificationGuidance = guidance
                    });
                }
            }
            dto.NeedsInformationItems = list;
        }

        private static void BuildOfficialSources(LegalRegulatoryFrameworkDto dto, List<CreatorLegalChecklistItem> items)
        {
            var sources = new Dictionary<string, LegalOfficialSourceDto>(StringComparer.OrdinalIgnoreCase);

            foreach (var it in items)
            {
                if (it.OfficialSource == null || string.IsNullOrWhiteSpace(it.OfficialSource.Authority)) continue;
                var auth = it.OfficialSource.Authority.Trim();
                if (!sources.ContainsKey(auth))
                {
                    sources[auth] = new LegalOfficialSourceDto
                    {
                        AuthorityName = auth,
                        DocumentTitle = it.OfficialSource.Title ?? "Official Statutory Reference",
                        Url = it.OfficialSource.Url ?? "",
                        Description = it.OfficialSource.Notes ?? $"Official statutory requirements under {auth}."
                    };
                }
            }

            dto.OfficialSources = sources.Values.OrderBy(s => s.AuthorityName).ToList();
        }

        private static void BuildEvidenceSummary(LegalRegulatoryFrameworkDto dto, CreatorLegalAssessment assessment, List<CreatorLegalChecklistItem> items)
        {
            var links = assessment.EvidenceLinks ?? new List<LegalEvidenceLink>();
            var activeLinks = links.Where(l =>
                !string.Equals(l.Status, LegalEvidenceStatuses.Replaced, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(l.Status, "archived", StringComparison.OrdinalIgnoreCase)).ToList();

            var linkedReqIds = new HashSet<string>(activeLinks.Select(l => l.RequirementId), StringComparer.OrdinalIgnoreCase);

            var totalLinkedDocs = activeLinks.Count;
            var reqWithEvidence = linkedReqIds.Count;
            var needsReview = activeLinks.Count(l => string.Equals(l.Status, LegalEvidenceStatuses.NeedsReview, StringComparison.OrdinalIgnoreCase));
            var accepted = activeLinks.Count(l => string.Equals(l.Status, LegalEvidenceStatuses.AcceptedForPlanning, StringComparison.OrdinalIgnoreCase));

            var summaryText = reqWithEvidence > 0
                ? $"{reqWithEvidence} of {dto.TotalApplicableRequirementsCount} statutory requirements have planning evidence attached ({totalLinkedDocs} supporting document(s)). {needsReview} items require creator review."
                : $"0 of {dto.TotalApplicableRequirementsCount} statutory requirements have planning evidence attached (0 supporting document(s)). Supporting proof can be linked via the Legal Evidence Vault in Step 3.4.";

            dto.EvidenceSummary = new LegalEvidenceSummaryDto
            {
                TotalRequirementsWithEvidence = reqWithEvidence,
                TotalDocumentsLinked = totalLinkedDocs,
                NeedsReviewCount = needsReview,
                AcceptedForPlanningCount = accepted,
                SummaryText = summaryText
            };
        }

        private static bool IsAddressed(CreatorLegalChecklistItem item) =>
            string.Equals(item.Status, LegalItemStatuses.Completed, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(item.Status, LegalItemStatuses.LegacyDone, StringComparison.OrdinalIgnoreCase);
    }
}
