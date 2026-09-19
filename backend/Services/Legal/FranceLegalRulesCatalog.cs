using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using WebApp.Models.DatabaseModels.Legal;

namespace WebApp.Services.Legal
{
    /// <summary>
    /// In-memory cached repository for France statutory legal rules.
    /// Loads deterministically from versioned JSON asset with zero external network calls.
    /// </summary>
    public class FranceLegalRulesCatalog : IFranceLegalRulesCatalog
    {
        private readonly ILogger<FranceLegalRulesCatalog> _logger;
        private readonly LegalRulesCatalogFile _catalog;
        private readonly Dictionary<string, LegalRuleDefinition> _rulesById;

        public string RulesVersion => _catalog.RulesVersion;
        public string Jurisdiction => _catalog.Jurisdiction;

        public FranceLegalRulesCatalog(ILogger<FranceLegalRulesCatalog> logger, IWebHostEnvironment? env = null)
        {
            _logger = logger;
            _catalog = LoadCatalog(env);
            _rulesById = _catalog.Rules.ToDictionary(r => r.Id, StringComparer.OrdinalIgnoreCase);

            _logger.LogInformation(
                "[FranceLegalRulesCatalog] Initialized version {Version} with {Count} authoritative statutory rules.",
                _catalog.RulesVersion,
                _catalog.Rules.Count);
        }

        public LegalRulesCatalogFile GetCatalog() => _catalog;

        public IReadOnlyList<LegalRuleDefinition> GetAllRules() => _catalog.Rules;

        public LegalRuleDefinition? GetRuleById(string ruleId)
        {
            if (string.IsNullOrWhiteSpace(ruleId)) return null;
            return _rulesById.GetValueOrDefault(ruleId);
        }

        private LegalRulesCatalogFile LoadCatalog(IWebHostEnvironment? env)
        {
            var candidates = new List<string>();

            if (env != null && !string.IsNullOrWhiteSpace(env.ContentRootPath))
            {
                candidates.Add(Path.Combine(env.ContentRootPath, "Resources", "LegalRules", "FranceRules.json"));
            }

            candidates.Add(Path.Combine(AppContext.BaseDirectory, "Resources", "LegalRules", "FranceRules.json"));
            candidates.Add(Path.Combine(AppContext.BaseDirectory, "FranceRules.json"));

            // Traverse upward in test runner or monorepo environments
            var current = new DirectoryInfo(AppContext.BaseDirectory);
            while (current != null)
            {
                candidates.Add(Path.Combine(current.FullName, "Resources", "LegalRules", "FranceRules.json"));
                candidates.Add(Path.Combine(current.FullName, "backend", "Resources", "LegalRules", "FranceRules.json"));
                current = current.Parent;
            }

            string? resolvedPath = candidates.FirstOrDefault(File.Exists);

            if (resolvedPath != null)
            {
                try
                {
                    var json = File.ReadAllText(resolvedPath);
                    var opts = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var parsed = JsonSerializer.Deserialize<LegalRulesCatalogFile>(json, opts);
                    if (parsed != null && parsed.Rules.Count > 0)
                    {
                        return parsed;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[FranceLegalRulesCatalog] Failed reading rules from {Path}", resolvedPath);
                }
            }

            _logger.LogWarning("[FranceLegalRulesCatalog] FranceRules.json not located on disk. Using built-in bootstrap catalogue.");
            return CreateBootstrapCatalog();
        }

        private static LegalRulesCatalogFile CreateBootstrapCatalog()
        {
            return new LegalRulesCatalogFile
            {
                RulesVersion = "FR-2026.1",
                Jurisdiction = "FR",
                Title = "France Statutory Legal & Compliance Rules (Bootstrap)",
                LastUpdated = "2026-09-19",
                Rules = new List<LegalRuleDefinition>
                {
                    new()
                    {
                        Id = "FR-CORP-001",
                        Title = "Dépôt du capital social et attestation de blocage des fonds",
                        Category = "corporate",
                        Stage = LegalStages.BeforeCreation,
                        Priority = LegalPriorities.Critical,
                        Description = "Dépôt obligatoire des apports en numéraire constitutifs du capital social auprès d'une banque ou d'un notaire.",
                        WhyItApplies = "Toute création de société commerciale en France impose le dépôt préalable des fonds constitutifs.",
                        Conditions = new LegalRuleCondition { Always = true },
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "Service-Public.fr",
                            Title = "Dépôt du capital social d'une société commerciale",
                            Url = "https://www.service-public.fr/professionnels-entreprises/vosdroits/F31440",
                            SourceType = "official_portal",
                            LastVerified = "2026-06-01",
                            ArticleReference = "Code de commerce, Articles L223-7 et L225-3"
                        },
                        RequiresEvidence = true,
                        EvidenceDocType = "capital_deposit_cert",
                        EvidenceLabel = "Attestation de dépôt des fonds délivrée par l'établissement dépositaire"
                    },
                    new()
                    {
                        Id = "FR-CORP-004",
                        Title = "Formalités d'immatriculation au Guichet Unique INPI (Kbis / RNE)",
                        Category = "corporate",
                        Stage = LegalStages.CompanyCreation,
                        Priority = LegalPriorities.Critical,
                        Description = "Déclaration d'immatriculation obligatoire de l'entreprise via le Guichet Unique opéré par l'INPI.",
                        WhyItApplies = "Depuis le 1er janvier 2023, le guichet unique INPI est la seule voie légale d'immatriculation pour toute entreprise en France.",
                        Conditions = new LegalRuleCondition { Always = true },
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "INPI / Guichet Unique",
                            Title = "Portail des formalités d'entreprises",
                            Url = "https://formalites.entreprises.gouv.fr/",
                            SourceType = "official_portal",
                            LastVerified = "2026-06-15",
                            ArticleReference = "Code de commerce, Article L123-33"
                        },
                        RequiresEvidence = true,
                        EvidenceDocType = "kbis_extract",
                        EvidenceLabel = "Extrait Kbis ou récépissé de dépôt de dossier au Guichet Unique"
                    }
                }
            };
        }
    }
}
