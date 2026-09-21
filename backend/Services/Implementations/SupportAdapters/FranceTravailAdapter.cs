using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations.SupportAdapters
{
    /// <summary>
    /// Primary official adapter for France Travail entrepreneurial training
    /// and skill development provisions (e.g. Aide Individuelle à la Formation - AIF).
    /// Directly connects with Phase 4.4 Skills & Training resolution outcomes.
    /// </summary>
    public class FranceTravailAdapter : ISupportSourceAdapter
    {
        public string SourceId => "france-travail-entrepreneuriat";
        public string SourceName => "France Travail (Pôle Emploi Formation)";
        public string AuthorityLevel => SourceAuthority.PrimaryOfficial;
        public string Jurisdiction => "FR";
        public string GeographicScope => "National";
        public string FreshnessPolicy => "MonthlyProgramCheck";

        public Task<List<SupportOpportunity>> FetchAndNormalizeAsync()
        {
            var list = new List<SupportOpportunity>
            {
                new SupportOpportunity
                {
                    ExternalId = "ft-aif-creation-entreprise",
                    SourceId = SourceId,
                    Name = "AIF — Financement des Formations du Créateur d'Entreprise",
                    Description = "Prise en charge financière directe par France Travail des coûts pédagogiques de formations certifiantes ou opérationnelles indispensables au démarrage de l'entreprise (gestion, vente, technique), validées par le conseiller référent.",
                    SupportType = SupportType.TrainingFunding,
                    SelectionMode = SelectionMode.Discretionary,
                    ProgrammeOwner = "France Travail",
                    ManagingAuthority = "France Travail",
                    ApplicationAuthority = "Conseiller référent France Travail de rattachement",
                    CatalogueSource = SourceName,
                    AuthoritativeRuleSources = new List<string>
                    {
                        "https://www.francetravail.fr/candidat/en-formation/mes-aides-financieres/aide-individuelle-a-la-formatio.html"
                    },
                    Jurisdiction = "FR",
                    GeographicScope = "National",
                    TargetAudience = "Demandeurs d'emploi inscrits ayant un projet de création d'entreprise nécessitant une montée en compétences",
                    EligibleBusinessStages = new List<string> { "Idea", "Creation" },
                    EligibleLegalForms = new List<string> { "SAS", "SASU", "SARL", "EURL", "MicroEntreprise", "EI" },
                    SupportValueMin = 500m,
                    SupportValueMax = 5000m,
                    SupportValueDescription = "Prise en charge totale ou partielle des coûts pédagogiques (généralement jusqu'à 3 000 € à 5 000 €)",
                    SupportValueType = "FixedGrant",
                    SupportedExpenses = new List<string> { "Frais pédagogiques de formation professionnelle", "Certifications professionnelles" },
                    RelatedNeedCategories = new List<string> { "Training", "Team" },
                    TimingRules = new ApplicationTiming
                    {
                        MustApplyBeforeExpense = true,
                        Rolling = true,
                        TimingNotes = "La demande doit être déposée auprès de France Travail au moins 15 jours calendaires avant le début de la session de formation."
                    },
                    EvidenceRequired = new List<string>
                    {
                        "Devis dématérialisé (devis Kairos émis par l'organisme de formation certifié Qualiopi)",
                        "Plan d'action de compétences ou diagnostic de besoins (Phase 4.4 Skills Plan)",
                        "Projet d'entreprise formalisé (Executive Summary / Business Plan)"
                    },
                    OfficialReference = "Code du travail art. R. 5426-3 et délibération France Travail n° 2018-41",
                    OfficialUrl = "https://www.francetravail.fr/candidat/en-formation/mes-aides-financieres/aide-individuelle-a-la-formatio.html",
                    EffectiveFrom = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    LastVerifiedAt = DateTime.UtcNow,
                    SourceUpdatedAt = new DateTime(2026, 1, 12, 0, 0, 0, DateTimeKind.Utc),
                    Status = SupportStatus.Active,
                    RawSourceFingerprint = "fp-ft-aif-2026",
                    EligibilityRules = new List<SupportEligibilityRule>
                    {
                        new SupportEligibilityRule
                        {
                            RuleId = "aif-country-fr",
                            Field = "Country",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "FR",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Organisme et créateur domiciliés en France."
                        },
                        new SupportEligibilityRule
                        {
                            RuleId = "aif-jobseeker",
                            Field = "CurrentSituation",
                            Operator = RuleOperator.In,
                            ExpectedValue = "JobSeeker,RegisteredJobSeeker",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Être inscrit en tant que demandeur d'emploi auprès de France Travail."
                        },
                        new SupportEligibilityRule
                        {
                            RuleId = "aif-training-need",
                            Field = "HasTrainingNeeds",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "True",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Le projet présente des actions d'apprentissage résolues sous le mode LEARN dans le plan de compétences."
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
                SourceUrl = "https://www.francetravail.fr",
                ContentFingerprint = $"ft-fp-{opportunityExternalId}-2026",
                ParserVersion = "1.0",
                NormalizationVersion = "1.0",
                RawPayload = rawPayload ?? "{ \"source\": \"France Travail Formation\" }"
            };
            return Task.FromResult(snapshot);
        }

        public Task<bool> ValidateFreshnessAsync(DateTime lastCheckedAt)
        {
            return Task.FromResult((DateTime.UtcNow - lastCheckedAt).TotalDays < 30);
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
                SourceType = "NationalEmploymentAgency",
                BaseReference = "https://www.francetravail.fr",
                AdapterType = nameof(FranceTravailAdapter),
                LastSuccessfulSyncAt = DateTime.UtcNow,
                LastCheckedAt = DateTime.UtcNow,
                FreshnessPolicy = FreshnessPolicy,
                Enabled = true,
                Notes = "Authoritative French national employment agency responsible for training allowances and return-to-work aids."
            };
        }
    }
}
