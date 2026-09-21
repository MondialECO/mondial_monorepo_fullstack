using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations.SupportAdapters
{
    /// <summary>
    /// Institutional official adapter for Bpifrance Création and public innovation instruments.
    /// Manages competitive innovation grants, credit guarantees, and honorary loans.
    /// </summary>
    public class BpifranceAdapter : ISupportSourceAdapter
    {
        public string SourceId => "bpifrance-creation";
        public string SourceName => "Bpifrance Création & Innovation";
        public string AuthorityLevel => SourceAuthority.InstitutionalOfficial;
        public string Jurisdiction => "FR";
        public string GeographicScope => "National";
        public string FreshnessPolicy => "MonthlyProgramCheck";

        public Task<List<SupportOpportunity>> FetchAndNormalizeAsync()
        {
            var list = new List<SupportOpportunity>
            {
                // 1. Bourse French Tech (Competitive Innovation Grant)
                new SupportOpportunity
                {
                    ExternalId = "bpi-bourse-french-tech",
                    SourceId = SourceId,
                    Name = "Bourse French Tech — Subvention d'Amorçage Innovant",
                    Description = "Subvention non remboursable pour financer les dépenses de faisabilité, de modélisation technologique, d'études de marché approfondies et de prototypage pour les projets innovants.",
                    SupportType = SupportType.InnovationSupport,
                    SelectionMode = SelectionMode.Competitive,
                    ProgrammeOwner = "Mission French Tech / Bpifrance",
                    ManagingAuthority = "Bpifrance",
                    ApplicationAuthority = "Direction Régionale Bpifrance / Portail en ligne Bpifrance",
                    CatalogueSource = SourceName,
                    AuthoritativeRuleSources = new List<string>
                    {
                        "https://www.bpifrance.fr/nos-appels-a-projets-concours/bourse-french-tech",
                        "https://bpifrance-creation.fr/encyclopedie/aides-a-creation-a-reprise-dentreprise/bourse-french-tech"
                    },
                    Jurisdiction = "FR",
                    GeographicScope = "National",
                    TargetAudience = "Créateurs d'entreprises innovantes (technologiques, d'usage, de modèle ou organisationnelles)",
                    EligibleBusinessStages = new List<string> { "Idea", "Creation", "EarlyStage" },
                    EligibleLegalForms = new List<string> { "SAS", "SASU", "SARL" },
                    SupportValueMin = 10000m,
                    SupportValueMax = 30000m,
                    SupportValueDescription = "Subvention non remboursable jusqu'à 30 000 € (prise en charge jusqu'à 70% des dépenses éligibles)",
                    SupportValueType = "FixedGrant",
                    SupportedExpenses = new List<string>
                    {
                        "Frais d'études de faisabilité et marché",
                        "Prestations de conseil technique et juridique",
                        "Développement de prototypes / POC",
                        "Protection de propriété intellectuelle"
                    },
                    RelatedNeedCategories = new List<string> { "Technology", "Finance", "Services" },
                    TimingRules = new ApplicationTiming
                    {
                        MustApplyBeforeExpense = true,
                        Rolling = true,
                        TimingNotes = "La candidature doit être déposée avant la création ou dans les 3 mois suivant l'immatriculation."
                    },
                    EvidenceRequired = new List<string>
                    {
                        "Executive Summary & Business Plan complet",
                        "Budget prévisionnel des dépenses de faisabilité (dépenses R&D/prototypage)",
                        "Dossier technique démontrant le caractère innovant du projet",
                        "CV et parcours de l'équipe fondatrice"
                    },
                    OfficialReference = "Règlement Bpifrance Bourse French Tech 2026",
                    OfficialUrl = "https://www.bpifrance.fr/nos-appels-a-projets-concours/bourse-french-tech",
                    EffectiveFrom = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    LastVerifiedAt = DateTime.UtcNow,
                    SourceUpdatedAt = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                    Status = SupportStatus.Active,
                    RawSourceFingerprint = "fp-bpi-bft-2026",
                    EligibilityRules = new List<SupportEligibilityRule>
                    {
                        new SupportEligibilityRule
                        {
                            RuleId = "bft-country-fr",
                            Field = "Country",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "FR",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Projet implanté sur le territoire national français."
                        },
                        new SupportEligibilityRule
                        {
                            RuleId = "bft-innovative-project",
                            Field = "HasInnovativeActivity",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "True",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Le projet doit comporter une dimension innovante (technologique, modèle d'affaires ou usage)."
                        },
                        new SupportEligibilityRule
                        {
                            RuleId = "bft-stage",
                            Field = "BusinessStage",
                            Operator = RuleOperator.In,
                            ExpectedValue = "Idea,Creation,EarlyStage",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Phase de maturation pré-commerciale ou jeune entreprise de moins d'un an."
                        }
                    }
                },

                // 2. Prêt d'Honneur Création (Credit Assessment - Zero-Interest Loan)
                new SupportOpportunity
                {
                    ExternalId = "bpi-pret-honneur-creation",
                    SourceId = SourceId,
                    Name = "Prêt d'Honneur Création (Réseau Initiative / Réseau Entreprendre)",
                    Description = "Prêt personnel à taux zéro accordé au fondateur sans caution personnelle ni garantie, destiné à renforcer les fonds propres pour créer un effet de levier bancaire auprès des banques commerciales.",
                    SupportType = SupportType.HonorLoan,
                    SelectionMode = SelectionMode.CreditAssessment,
                    ProgrammeOwner = "Initiative France / Réseau Entreprendre / Bpifrance",
                    ManagingAuthority = "Plateformes locales Initiative France ou Réseau Entreprendre",
                    ApplicationAuthority = "Comité d'engagement de la plateforme locale",
                    CatalogueSource = SourceName,
                    AuthoritativeRuleSources = new List<string>
                    {
                        "https://www.initiative-france.fr/financer/le-pret-d-honneur.html",
                        "https://bpifrance-creation.fr/encyclopedie/financements/fonds-propres/prets-dhonneur"
                    },
                    Jurisdiction = "FR",
                    GeographicScope = "National",
                    TargetAudience = "Porteurs de projets créant ou reprenant une entreprise nécessitant un effet de levier bancaire",
                    EligibleBusinessStages = new List<string> { "Creation", "EarlyStage" },
                    EligibleLegalForms = new List<string> { "SAS", "SASU", "SARL", "EURL" },
                    SupportValueMin = 3000m,
                    SupportValueMax = 50000m,
                    SupportValueDescription = "Prêt à taux zéro de 3 000 € à 50 000 € par fondateur, remboursable sur 3 à 5 ans avec différé possible",
                    SupportValueType = "LoanLimit",
                    SupportedExpenses = new List<string> { "Capital social", "Trésorerie de démarrage", "Apport personnel" },
                    RelatedNeedCategories = new List<string> { "Finance" },
                    TimingRules = new ApplicationTiming
                    {
                        MustApplyBeforeExpense = true,
                        Rolling = true,
                        TimingNotes = "À solliciter impérativement en amont de la demande de prêt bancaire commercial pour constituer le dossier de co-financement."
                    },
                    EvidenceRequired = new List<string>
                    {
                        "Business plan et plan de financement prévisionnel sur 3 ans",
                        "Plan de trésorerie mensuel de première année",
                        "Présentation de l'équipe et des motivations du fondateur"
                    },
                    OfficialReference = "Charte nationale des réseaux de financement de la création d'entreprise",
                    OfficialUrl = "https://www.initiative-france.fr",
                    EffectiveFrom = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    LastVerifiedAt = DateTime.UtcNow,
                    SourceUpdatedAt = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc),
                    Status = SupportStatus.Active,
                    RawSourceFingerprint = "fp-bpi-ph-2026",
                    EligibilityRules = new List<SupportEligibilityRule>
                    {
                        new SupportEligibilityRule
                        {
                            RuleId = "ph-country-fr",
                            Field = "Country",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "FR",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Projet implanté sur le territoire français."
                        },
                        new SupportEligibilityRule
                        {
                            RuleId = "ph-need-finance",
                            Field = "ProjectNeeds",
                            Operator = RuleOperator.Contains,
                            ExpectedValue = "finance.launch-capital",
                            Required = false,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Le plan d'affaires nécessite un apport en fonds propres pour mobiliser un crédit bancaire."
                        }
                    }
                }
            };

            return Task.FromResult(list);
        }

        public Task<SupportSourceSnapshot> CreateSnapshotAsync(string opportunityExternalId, string? rawPayload = null)
        {
            var snapshot = new SupportSourceSnapshot
            {
                SourceId = SourceId,
                OpportunityExternalId = opportunityExternalId,
                RetrievedAt = DateTime.UtcNow,
                SourceUpdatedAt = DateTime.UtcNow,
                SourceUrl = "https://bpifrance-creation.fr",
                ContentFingerprint = $"bpi-fp-{opportunityExternalId}-2026",
                ParserVersion = "1.0",
                NormalizationVersion = "1.0",
                RawPayload = rawPayload ?? "{ \"source\": \"Bpifrance Création\" }"
            };
            return Task.FromResult(snapshot);
        }

        public Task<bool> ValidateFreshnessAsync(DateTime lastCheckedAt)
        {
            return Task.FromResult((DateTime.UtcNow - lastCheckedAt).TotalDays < 45);
        }

        public SupportSourceRegistryRecord GetRegistryMetadata()
        {
            return new SupportSourceRegistryRecord
            {
                SourceId = SourceId,
                Name = SourceName,
                AuthorityLevel = AuthorityLevel,
                Jurisdiction = Jurisdiction,
                GeographicScope = GeographicScope,
                SourceType = "InstitutionalDevelopmentBank",
                BaseReference = "https://bpifrance-creation.fr",
                AdapterType = nameof(BpifranceAdapter),
                LastSuccessfulSyncAt = DateTime.UtcNow,
                LastCheckedAt = DateTime.UtcNow,
                FreshnessPolicy = FreshnessPolicy,
                Enabled = true,
                Notes = "Institutional public investment bank supporting venture creation and innovation in France."
            };
        }
    }
}
