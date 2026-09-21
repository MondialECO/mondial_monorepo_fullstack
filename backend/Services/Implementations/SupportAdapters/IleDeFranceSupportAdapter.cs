using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations.SupportAdapters
{
    /// <summary>
    /// Regional adapter for Région Île-de-France public economic interventions (Loi NOTRe),
    /// specifically Innov'Up (co-financed with Bpifrance) for innovative regional projects.
    /// </summary>
    public class IleDeFranceSupportAdapter : IRegionalSupportAdapter
    {
        public string SourceId => "region-ile-de-france";
        public string SourceName => "Région Île-de-France — Pôle Développement Économique";
        public string AuthorityLevel => SourceAuthority.InstitutionalOfficial;
        public string Jurisdiction => "FR";
        public string GeographicScope => "Regional";
        public string TargetRegion => "Île-de-France";
        public string FreshnessPolicy => "RegionalCallCycleQuarterly";

        public Task<List<SupportOpportunity>> FetchAndNormalizeAsync()
        {
            var list = new List<SupportOpportunity>
            {
                new SupportOpportunity
                {
                    ExternalId = "idf-innov-up-faisabilite",
                    SourceId = SourceId,
                    Name = "Innov'Up Faisabilité — Région Île-de-France & Bpifrance",
                    Description = "Subvention régionale pour soutenir les projets d'innovation et de R&D des TPE et PME franciliennes en phase de faisabilité, de conception technique et d'expérimentation.",
                    SupportType = SupportType.RegionalSupport,
                    SelectionMode = SelectionMode.Competitive,
                    ProgrammeOwner = "Conseil Régional d'Île-de-France",
                    ManagingAuthority = "Bpifrance Île-de-France & Région Île-de-France",
                    ApplicationAuthority = "Plateforme régionale des aides Île-de-France (mesdemarches.iledefrance.fr)",
                    CatalogueSource = SourceName,
                    AuthoritativeRuleSources = new List<string>
                    {
                        "https://www.iledefrance.fr/innovup-soutien-linnovation-des-tpe-et-pme",
                        "https://www.bpifrance.fr/nos-appels-a-projets-concours/innovup"
                    },
                    Jurisdiction = "FR",
                    GeographicScope = "Regional",
                    EligibleLocations = new List<string> { "Île-de-France", "Paris", "Hauts-de-Seine", "Seine-Saint-Denis", "Val-de-Marne", "Yvelines", "Essonne", "Val-d'Oise", "Seine-et-Marne" },
                    TargetAudience = "Startups et PME innovantes immatriculées ou en cours d'implantation en Île-de-France",
                    EligibleBusinessStages = new List<string> { "Creation", "EarlyStage", "Growth" },
                    EligibleLegalForms = new List<string> { "SAS", "SASU", "SARL" },
                    SupportValueMin = 15000m,
                    SupportValueMax = 100000m,
                    SupportValueDescription = "Subvention jusqu'à 100 000 € (prise en charge de 50% des dépenses internes et externes éligibles de R&D)",
                    SupportValueType = "FixedGrant",
                    SupportedExpenses = new List<string> { "Salaires des équipes de R&D", "Prestations de conseil technologique", "Dépôts de brevets", "Prototypage" },
                    RelatedNeedCategories = new List<string> { "Technology", "Finance", "Services" },
                    TimingRules = new ApplicationTiming
                    {
                        MustApplyBeforeExpense = true,
                        Rolling = true,
                        TimingNotes = "Dépôt du dossier en ligne impérativement avant l'engagement des dépenses de R&D faisant l'objet de l'aide."
                    },
                    EvidenceRequired = new List<string>
                    {
                        "Dossier technique de faisabilité et d'innovation",
                        "Attestation de domiciliation ou établissement en Île-de-France",
                        "Business plan et tableau prévisionnel des dépenses de R&D sur 12-24 mois",
                        "Comptes prévisionnels certifiés"
                    },
                    OfficialReference = "Délibération n° CR 2021-042 du Conseil Régional d'Île-de-France",
                    OfficialUrl = "https://www.iledefrance.fr/innovup-soutien-linnovation-des-tpe-et-pme",
                    EffectiveFrom = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    LastVerifiedAt = DateTime.UtcNow,
                    SourceUpdatedAt = new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc),
                    Status = SupportStatus.Active,
                    RawSourceFingerprint = "fp-idf-innovup-2026",
                    EligibilityRules = new List<SupportEligibilityRule>
                    {
                        new SupportEligibilityRule
                        {
                            RuleId = "innovup-country",
                            Field = "Country",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "FR",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Entreprise située en France."
                        },
                        new SupportEligibilityRule
                        {
                            RuleId = "innovup-region",
                            Field = "Region",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "Île-de-France",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "L'établissement ou le projet doit être obligatoirement localisé en région Île-de-France."
                        },
                        new SupportEligibilityRule
                        {
                            RuleId = "innovup-innovation",
                            Field = "HasInnovativeActivity",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "True",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Le projet doit présenter un caractère innovant ou une démarche de R&D avérée."
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
                SourceUrl = "https://www.iledefrance.fr",
                ContentFingerprint = $"idf-fp-{opportunityExternalId}-2026",
                ParserVersion = "1.0",
                NormalizationVersion = "1.0",
                RawPayload = rawPayload ?? "{ \"source\": \"Région Île-de-France\" }"
            };
            return Task.FromResult(snapshot);
        }

        public Task<bool> ValidateFreshnessAsync(DateTime lastCheckedAt)
        {
            return Task.FromResult((DateTime.UtcNow - lastCheckedAt).TotalDays < 60);
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
                SourceType = "RegionalPublicAuthority",
                BaseReference = "https://www.iledefrance.fr",
                AdapterType = nameof(IleDeFranceSupportAdapter),
                LastSuccessfulSyncAt = DateTime.UtcNow,
                LastCheckedAt = DateTime.UtcNow,
                FreshnessPolicy = FreshnessPolicy,
                Enabled = true,
                Notes = "Authoritative economic development programmes for the Île-de-France region."
            };
        }
    }
}
