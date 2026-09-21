using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations.SupportAdapters
{
    /// <summary>
    /// Regional adapter for Région Hauts-de-France economic creation programmes
    /// (e.g. Pass Création, Start-AIRR innovation support).
    /// </summary>
    public class HautsDeFranceSupportAdapter : IRegionalSupportAdapter
    {
        public string SourceId => "region-hauts-de-france";
        public string SourceName => "Région Hauts-de-France — Direction de l'Économie";
        public string AuthorityLevel => SourceAuthority.InstitutionalOfficial;
        public string Jurisdiction => "FR";
        public string GeographicScope => "Regional";
        public string TargetRegion => "Hauts-de-France";
        public string FreshnessPolicy => "RegionalCallCycleQuarterly";

        public Task<List<SupportOpportunity>> FetchAndNormalizeAsync()
        {
            var list = new List<SupportOpportunity>
            {
                new SupportOpportunity
                {
                    ExternalId = "hdf-pass-creation",
                    SourceId = SourceId,
                    Name = "Pass Création — Accompagnement et Prime Régionale Hauts-de-France",
                    Description = "Dispositif régional global combinant diagnostic, accompagnement renforcé ante et post-création et prime forfaitaire régionale de démarrage pour les créateurs d'entreprise des Hauts-de-France.",
                    SupportType = SupportType.RegionalSupport,
                    SelectionMode = SelectionMode.Discretionary,
                    ProgrammeOwner = "Conseil Régional des Hauts-de-France",
                    ManagingAuthority = "Région Hauts-de-France & Réseaux Partenaires (BGE, CCI, CMA)",
                    ApplicationAuthority = "Opérateur agréé Pass Création ou portail régional",
                    CatalogueSource = SourceName,
                    AuthoritativeRuleSources = new List<string>
                    {
                        "https://entreprises.hautsdefrance.fr/pass-creation"
                    },
                    Jurisdiction = "FR",
                    GeographicScope = "Regional",
                    EligibleLocations = new List<string> { "Hauts-de-France", "Nord", "Pas-de-Calais", "Oise", "Somme", "Aisne" },
                    TargetAudience = "Demandeurs d'emploi et jeunes créateurs d'entreprise domiciliés dans les Hauts-de-France",
                    EligibleBusinessStages = new List<string> { "Idea", "Creation" },
                    EligibleLegalForms = new List<string> { "SAS", "SASU", "SARL", "EURL", "MicroEntreprise", "EI" },
                    SupportValueMin = 1500m,
                    SupportValueMax = 3000m,
                    SupportValueDescription = "Prime régionale forfaitaire de 1 500 € à 3 000 € couplée à un accompagnement certifié",
                    SupportValueType = "FixedGrant",
                    SupportedExpenses = new List<string> { "Frais de lancement", "Accompagnement à la structuration", "Trésorerie initiale" },
                    RelatedNeedCategories = new List<string> { "Finance", "Services" },
                    TimingRules = new ApplicationTiming
                    {
                        MustApplyBeforeCreation = true,
                        Rolling = true,
                        TimingNotes = "Conventionnement impératif avant la formalité d'immatriculation au registre du commerce."
                    },
                    EvidenceRequired = new List<string>
                    {
                        "Diagnostic d'éligibilité réalisé avec un opérateur labellisé",
                        "Justificatif de domicile dans les Hauts-de-France",
                        "Attestation de situation professionnelle"
                    },
                    OfficialReference = "Délibération du Conseil Régional des Hauts-de-France n° 2022-18",
                    OfficialUrl = "https://entreprises.hautsdefrance.fr/pass-creation",
                    EffectiveFrom = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    LastVerifiedAt = DateTime.UtcNow,
                    SourceUpdatedAt = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                    Status = SupportStatus.Active,
                    RawSourceFingerprint = "fp-hdf-pass-2026",
                    EligibilityRules = new List<SupportEligibilityRule>
                    {
                        new SupportEligibilityRule
                        {
                            RuleId = "hdf-country",
                            Field = "Country",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "FR",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Projet situé en France."
                        },
                        new SupportEligibilityRule
                        {
                            RuleId = "hdf-region",
                            Field = "Region",
                            Operator = RuleOperator.Equals,
                            ExpectedValue = "Hauts-de-France",
                            Required = true,
                            NormalizationStatus = RuleNormalizationStatus.VerifiedStructured,
                            Description = "Le créateur et l'entreprise doivent être obligatoirement implantés dans les Hauts-de-France."
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
                SourceUrl = "https://entreprises.hautsdefrance.fr",
                ContentFingerprint = $"hdf-fp-{opportunityExternalId}-2026",
                ParserVersion = "1.0",
                NormalizationVersion = "1.0",
                RawPayload = rawPayload ?? "{ \"source\": \"Région Hauts-de-France\" }"
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
                BaseReference = "https://entreprises.hautsdefrance.fr",
                AdapterType = nameof(HautsDeFranceSupportAdapter),
                LastSuccessfulSyncAt = DateTime.UtcNow,
                LastCheckedAt = DateTime.UtcNow,
                FreshnessPolicy = FreshnessPolicy,
                Enabled = true,
                Notes = "Authoritative economic development programmes for the Hauts-de-France region."
            };
        }
    }
}
