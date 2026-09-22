using System.Text.Json.Serialization;

namespace WebApp.Models.DatabaseModels.Legal
{
    /// <summary>
    /// Declarative conditions for a legal rule's deterministic applicability.
    /// Matched against the normalized LegalBusinessProfile.
    /// </summary>
    public class LegalRuleCondition
    {
        [JsonPropertyName("always")]
        public bool? Always { get; set; }

        [JsonPropertyName("isSaaS")]
        public bool? IsSaaS { get; set; }

        [JsonPropertyName("isEcommerce")]
        public bool? IsEcommerce { get; set; }

        [JsonPropertyName("isMarketplace")]
        public bool? IsMarketplace { get; set; }

        [JsonPropertyName("isConsulting")]
        public bool? IsConsulting { get; set; }

        [JsonPropertyName("isPhysicalBusiness")]
        public bool? IsPhysicalBusiness { get; set; }

        [JsonPropertyName("isB2B")]
        public bool? IsB2B { get; set; }

        [JsonPropertyName("isB2C")]
        public bool? IsB2C { get; set; }

        [JsonPropertyName("hasSubscription")]
        public bool? HasSubscription { get; set; }

        [JsonPropertyName("hasOnlinePayments")]
        public bool? HasOnlinePayments { get; set; }

        [JsonPropertyName("hasWebsite")]
        public bool? HasWebsite { get; set; }

        [JsonPropertyName("sellsProducts")]
        public bool? SellsProducts { get; set; }

        [JsonPropertyName("sellsServices")]
        public bool? SellsServices { get; set; }

        [JsonPropertyName("collectsPersonalData")]
        public bool? CollectsPersonalData { get; set; }

        [JsonPropertyName("usesAnalyticsOrTracking")]
        public bool? UsesAnalyticsOrTracking { get; set; }

        [JsonPropertyName("hasEmployees")]
        public bool? HasEmployees { get; set; }

        [JsonPropertyName("hasContractors")]
        public bool? HasContractors { get; set; }

        [JsonPropertyName("hasPhysicalPremises")]
        public bool? HasPhysicalPremises { get; set; }

        [JsonPropertyName("mayBeRegulatedActivity")]
        public bool? MayBeRegulatedActivity { get; set; }
    }

    /// <summary>
    /// Definition of a statutory requirement in the legal rules catalog.
    /// </summary>
    public class LegalRuleDefinition
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("stage")]
        public string Stage { get; set; } = string.Empty;

        [JsonPropertyName("priority")]
        public string Priority { get; set; } = LegalPriorities.Critical;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("whyItApplies")]
        public string WhyItApplies { get; set; } = string.Empty;

        [JsonPropertyName("conditions")]
        public LegalRuleCondition Conditions { get; set; } = new();

        [JsonPropertyName("officialSource")]
        public OfficialSourceReference OfficialSource { get; set; } = new();

        [JsonPropertyName("requiresEvidence")]
        public bool RequiresEvidence { get; set; }

        [JsonPropertyName("evidenceDocType")]
        public string? EvidenceDocType { get; set; }

        [JsonPropertyName("evidenceLabel")]
        public string? EvidenceLabel { get; set; }
    }

    /// <summary>
    /// Schema of the serialized rules JSON file.
    /// </summary>
    public class LegalRulesCatalogFile
    {
        [JsonPropertyName("rulesVersion")]
        public string RulesVersion { get; set; } = "FR-2026.1";

        [JsonPropertyName("jurisdiction")]
        public string Jurisdiction { get; set; } = "FR";

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("lastUpdated")]
        public string LastUpdated { get; set; } = string.Empty;

        [JsonPropertyName("metadata")]
        public LegalRulesMetadata? Metadata { get; set; }

        [JsonPropertyName("rules")]
        public List<LegalRuleDefinition> Rules { get; set; } = new();
    }

    /// <summary>
    /// Metadata block for France statutory legal rules catalog.
    /// Excluded from statutory rules fingerprint to ensure non-rule verification timestamps
    /// never cause false staleness.
    /// </summary>
    public class LegalRulesMetadata
    {
        [JsonPropertyName("version")]
        public string Version { get; set; } = "FR-2026.1";

        [JsonPropertyName("effectiveDate")]
        public string EffectiveDate { get; set; } = "2026-01-01";

        [JsonPropertyName("lastVerifiedAt")]
        public string LastVerifiedAt { get; set; } = "2026-09-19T00:00:00Z";

        [JsonPropertyName("sourceFingerprint")]
        public string SourceFingerprint { get; set; } = string.Empty;

        [JsonPropertyName("sources")]
        public List<string> Sources { get; set; } = new();
    }
}
