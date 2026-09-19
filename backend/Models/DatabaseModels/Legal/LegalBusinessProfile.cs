using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Legal
{
    /// <summary>
    /// A single business signal with traceability and provenance metadata.
    /// Documents exactly why a signal was derived and where it originated.
    /// </summary>
    public class BusinessSignal
    {
        [BsonElement("Value")]
        public bool Value { get; set; }

        [BsonElement("Confidence")]
        public string Confidence { get; set; } = SignalConfidenceLevels.Derived; // confirmed | derived | unknown

        [BsonElement("Source")]
        public string Source { get; set; } = string.Empty; // e.g. "BusinessModelSession.canvas.revenueStreams"

        [BsonElement("Rationale")]
        public string Rationale { get; set; } = string.Empty;

        public static BusinessSignal Confirmed(bool value, string source, string rationale) => new()
        {
            Value = value,
            Confidence = SignalConfidenceLevels.Confirmed,
            Source = source,
            Rationale = rationale
        };

        public static BusinessSignal Derived(bool value, string source, string rationale) => new()
        {
            Value = value,
            Confidence = SignalConfidenceLevels.Derived,
            Source = source,
            Rationale = rationale
        };

        public static BusinessSignal Unknown(string source, string rationale) => new()
        {
            Value = false,
            Confidence = SignalConfidenceLevels.Unknown,
            Source = source,
            Rationale = rationale
        };
    }

    /// <summary>
    /// Normalized deterministic business profile derived from Creator artifacts
    /// (Idea Core, Business Model Canvas, Market Study, and Financial Forecast).
    /// Input payload for the France Legal Applicability Engine.
    /// </summary>
    public class LegalBusinessProfile
    {
        [BsonElement("Country")]
        public string Country { get; set; } = "France";

        [BsonElement("Jurisdiction")]
        public string Jurisdiction { get; set; } = "FR";

        [BsonElement("BusinessName")]
        public string BusinessName { get; set; } = string.Empty;

        [BsonElement("RawSector")]
        public string RawSector { get; set; } = string.Empty;

        [BsonElement("RawCategory")]
        public string RawCategory { get; set; } = string.Empty;

        // --- Core Business Archetypes ---
        [BsonElement("IsSaaS")]
        public BusinessSignal IsSaaS { get; set; } = new();

        [BsonElement("IsEcommerce")]
        public BusinessSignal IsEcommerce { get; set; } = new();

        [BsonElement("IsMarketplace")]
        public BusinessSignal IsMarketplace { get; set; } = new();

        [BsonElement("IsConsulting")]
        public BusinessSignal IsConsulting { get; set; } = new();

        [BsonElement("IsPhysicalBusiness")]
        public BusinessSignal IsPhysicalBusiness { get; set; } = new();

        // --- Customer Segments ---
        [BsonElement("IsB2B")]
        public BusinessSignal IsB2B { get; set; } = new();

        [BsonElement("IsB2C")]
        public BusinessSignal IsB2C { get; set; } = new();

        // --- Monetization & Delivery ---
        [BsonElement("HasSubscription")]
        public BusinessSignal HasSubscription { get; set; } = new();

        [BsonElement("HasOnlinePayments")]
        public BusinessSignal HasOnlinePayments { get; set; } = new();

        [BsonElement("HasWebsite")]
        public BusinessSignal HasWebsite { get; set; } = new();

        [BsonElement("SellsProducts")]
        public BusinessSignal SellsProducts { get; set; } = new();

        [BsonElement("SellsServices")]
        public BusinessSignal SellsServices { get; set; } = new();

        // --- Privacy & Tracking ---
        [BsonElement("CollectsPersonalData")]
        public BusinessSignal CollectsPersonalData { get; set; } = new();

        [BsonElement("UsesAnalyticsOrTracking")]
        public BusinessSignal UsesAnalyticsOrTracking { get; set; } = new();

        // --- Operations & Workforce ---
        [BsonElement("HasEmployees")]
        public BusinessSignal HasEmployees { get; set; } = new();

        [BsonElement("HasContractors")]
        public BusinessSignal HasContractors { get; set; } = new();

        [BsonElement("HasPhysicalPremises")]
        public BusinessSignal HasPhysicalPremises { get; set; } = new();

        // --- Regulatory Uncertainty ---
        [BsonElement("MayBeRegulatedActivity")]
        public BusinessSignal MayBeRegulatedActivity { get; set; } = new();

        [BsonElement("RegulatoryNotes")]
        [BsonIgnoreIfNull]
        public string? RegulatoryNotes { get; set; }

        /// <summary>
        /// Summary tags for dashboard badges (e.g. ["SaaS", "B2C", "Subscription", "Online Payment"]).
        /// </summary>
        public List<string> GetArchetypeLabels()
        {
            var labels = new List<string>();
            if (IsSaaS.Value) labels.Add("SaaS");
            if (IsEcommerce.Value) labels.Add("E-commerce");
            if (IsMarketplace.Value) labels.Add("Marketplace");
            if (IsConsulting.Value) labels.Add("Consulting");
            if (IsPhysicalBusiness.Value) labels.Add("Physical Business");
            if (IsB2C.Value) labels.Add("B2C");
            if (IsB2B.Value && !labels.Contains("B2C")) labels.Add("B2B");
            if (HasSubscription.Value) labels.Add("Subscription");
            if (HasOnlinePayments.Value) labels.Add("Online Payment");
            return labels;
        }
    }
}
