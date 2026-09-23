using System.Security.Cryptography;
using System.Text;
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
        public string RulesFingerprint { get; }
        public string? RulesLastVerifiedAt => _catalog.Metadata?.LastVerifiedAt;

        public FranceLegalRulesCatalog(ILogger<FranceLegalRulesCatalog> logger, IWebHostEnvironment? env = null)
        {
            _logger = logger;
            _catalog = LoadCatalog(env);
            _rulesById = _catalog.Rules.ToDictionary(r => r.Id, StringComparer.OrdinalIgnoreCase);
            RulesFingerprint = ComputeRulesFingerprint(_catalog);

            _logger.LogInformation(
                "[FranceLegalRulesCatalog] Initialized version {Version} (fingerprint: {Fingerprint}) with {Count} authoritative statutory rules.",
                _catalog.RulesVersion,
                RulesFingerprint,
                _catalog.Rules.Count);
        }

        /// <summary>
        /// Computes a deterministic SHA-256 fingerprint of the canonical statutory rules payload.
        /// Excludes metadata.sourceFingerprint and non-rule verification timestamps (e.g. metadata.lastVerifiedAt,
        /// officialSource.lastVerified, or lastUpdated) so a LastVerifiedAt-only change never makes an assessment stale.
        /// </summary>
        public static string ComputeRulesFingerprint(LegalRulesCatalogFile catalog)
        {
            var normalizedRules = (catalog.Rules ?? new List<LegalRuleDefinition>())
                .OrderBy(r => r.Id, StringComparer.Ordinal)
                .Select(r => new
                {
                    id = r.Id ?? string.Empty,
                    title = r.Title ?? string.Empty,
                    category = r.Category ?? string.Empty,
                    stage = r.Stage ?? string.Empty,
                    priority = r.Priority ?? string.Empty,
                    description = r.Description ?? string.Empty,
                    whyItApplies = r.WhyItApplies ?? string.Empty,
                    requiresEvidence = r.RequiresEvidence,
                    evidenceDocType = r.EvidenceDocType ?? string.Empty,
                    evidenceLabel = r.EvidenceLabel ?? string.Empty,
                    conditions = new
                    {
                        always = r.Conditions?.Always,
                        isSaaS = r.Conditions?.IsSaaS,
                        isEcommerce = r.Conditions?.IsEcommerce,
                        isMarketplace = r.Conditions?.IsMarketplace,
                        isConsulting = r.Conditions?.IsConsulting,
                        isPhysicalBusiness = r.Conditions?.IsPhysicalBusiness,
                        isB2B = r.Conditions?.IsB2B,
                        isB2C = r.Conditions?.IsB2C,
                        hasSubscription = r.Conditions?.HasSubscription,
                        hasOnlinePayments = r.Conditions?.HasOnlinePayments,
                        hasWebsite = r.Conditions?.HasWebsite,
                        sellsProducts = r.Conditions?.SellsProducts,
                        sellsServices = r.Conditions?.SellsServices,
                        collectsPersonalData = r.Conditions?.CollectsPersonalData,
                        usesAnalyticsOrTracking = r.Conditions?.UsesAnalyticsOrTracking,
                        hasEmployees = r.Conditions?.HasEmployees,
                        hasContractors = r.Conditions?.HasContractors,
                        hasPhysicalPremises = r.Conditions?.HasPhysicalPremises,
                        mayBeRegulatedActivity = r.Conditions?.MayBeRegulatedActivity
                    },
                    source = new
                    {
                        authority = r.OfficialSource?.Authority ?? string.Empty,
                        title = r.OfficialSource?.Title ?? string.Empty,
                        url = r.OfficialSource?.Url ?? string.Empty,
                        sourceType = r.OfficialSource?.SourceType ?? string.Empty,
                        articleReference = r.OfficialSource?.ArticleReference ?? string.Empty,
                        notes = r.OfficialSource?.Notes ?? string.Empty
                        // NOTE: OfficialSource.LastVerified is deliberately excluded to prevent timestamp false staleness
                    }
                }).ToList();

            var payload = JsonSerializer.Serialize(new
            {
                jurisdiction = catalog.Jurisdiction ?? "FR",
                rulesVersion = catalog.RulesVersion ?? "FR-2026.1",
                rules = normalizedRules
            });

            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(payload));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
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
                        Title = "Share Capital Deposit & Escrow Certificate",
                        Category = "corporate",
                        Stage = LegalStages.BeforeCreation,
                        Priority = LegalPriorities.Critical,
                        Description = "Mandatory deposit of initial cash contributions forming the share capital with an accredited bank, notaire, or public depository.",
                        WhyItApplies = "Every commercial company formation in France mandates the prior deposit of founding share capital.",
                        Conditions = new LegalRuleCondition { Always = true },
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "Service-Public.fr",
                            Title = "Share capital deposit for commercial companies",
                            Url = "https://www.service-public.fr/professionnels-entreprises/vosdroits/F31440",
                            SourceType = "official_portal",
                            LastVerified = "2026-06-01",
                            ArticleReference = "Code de commerce, Articles L223-7 et L225-3"
                        },
                        RequiresEvidence = true,
                        EvidenceDocType = "capital_deposit_cert",
                        EvidenceLabel = "Share capital deposit certificate issued by an accredited financial institution"
                    },
                    new()
                    {
                        Id = "FR-CORP-004",
                        Title = "Company Registration via INPI Guichet Unique (SIREN & Kbis)",
                        Category = "corporate",
                        Stage = LegalStages.CompanyCreation,
                        Priority = LegalPriorities.Critical,
                        Description = "Mandatory company registration filing via the INPI Guichet Unique portal to register in the National Register of Companies.",
                        WhyItApplies = "Under French law (PACTE Act), the INPI Guichet Unique is the sole legal channel for incorporating any enterprise in France.",
                        Conditions = new LegalRuleCondition { Always = true },
                        OfficialSource = new OfficialSourceReference
                        {
                            Authority = "INPI / Guichet Unique",
                            Title = "Single window portal for business formalities",
                            Url = "https://formalites.entreprises.gouv.fr/",
                            SourceType = "official_portal",
                            LastVerified = "2026-06-15",
                            ArticleReference = "Code de commerce, Article L123-33"
                        },
                        RequiresEvidence = true,
                        EvidenceDocType = "kbis_extract",
                        EvidenceLabel = "Official Kbis extract or Guichet Unique filing confirmation receipt"
                    }
                }
            };
        }
    }
}
