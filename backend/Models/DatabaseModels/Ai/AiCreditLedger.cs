using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// Per-user AI credit balance + debit ledger (collection <c>AICredits</c>),
    /// one document per user (unique <see cref="OwnerUserId"/>). Gates
    /// regenerations / paid jobs in later phases. Phase 2 = schema + index only.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class AiCreditLedger
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        [BsonElement("Balance")]
        public int Balance { get; set; }

        [BsonElement("LifetimeGranted")]
        public int LifetimeGranted { get; set; }

        [BsonElement("LifetimeSpent")]
        public int LifetimeSpent { get; set; }

        /// <summary>Start of current measuring period. Null when no period is active (default for all users).</summary>
        [BsonElement("PeriodStart")]
        [BsonIgnoreIfNull]
        public DateTime? PeriodStart { get; set; }

        /// <summary>End of current measuring period. Null when no period is active.</summary>
        [BsonElement("PeriodEnd")]
        [BsonIgnoreIfNull]
        public DateTime? PeriodEnd { get; set; }

        /// <summary>Credits spent within the current measuring period. Null when no period is active.</summary>
        [BsonElement("PeriodCreditsSpent")]
        [BsonIgnoreIfNull]
        public int? PeriodCreditsSpent { get; set; }

        /// <summary>Maximum credit balance allowed to accumulate/carry over into a subsequent period. Null when uncapped or dormant.</summary>
        [BsonElement("CarryOverCeiling")]
        [BsonIgnoreIfNull]
        public int? CarryOverCeiling { get; set; }

        [BsonElement("Debits")]
        public List<AiCreditDebit> Debits { get; set; } = new();

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>A single credit debit sub-document.</summary>
    [BsonIgnoreExtraElements]
    public class AiCreditDebit
    {
        [BsonElement("OperationId")]
        [BsonIgnoreIfDefault]
        public string OperationId { get; set; } = "";

        [BsonElement("Amount")]
        public int Amount { get; set; }

        [BsonElement("Reason")]
        public string Reason { get; set; } = "";

        [BsonElement("Refunded")]
        [BsonIgnoreIfDefault]
        public bool Refunded { get; set; } = false;

        [BsonElement("RefundedAt")]
        [BsonIgnoreIfNull]
        public DateTime? RefundedAt { get; set; }

        [BsonElement("At")]
        public DateTime At { get; set; } = DateTime.UtcNow;
    }

    /// <summary>Result of an idempotent credit debit attempt.</summary>
    public enum CreditDebitResult
    {
        Applied,
        AlreadyDebited,
        InsufficientCredits,
        LedgerNotFound
    }

    /// <summary>Result of an idempotent credit refund attempt.</summary>
    public enum CreditRefundResult
    {
        Applied,
        AlreadyRefunded,
        DebitNotFound,
        InvalidMismatch
    }

    /// <summary>Audit report of a legacy starter credit normalization run.</summary>
    public class LegacyCreditNormalizationReport
    {
        public int EligibleLedgersCount { get; set; }
        public int NormalizedLedgersCount { get; set; }
        public int TotalCreditsGranted { get; set; }
        public int AlreadyCurrentLedgersCount { get; set; }
        public int UnexpectedShapeCount { get; set; }
    }
}
