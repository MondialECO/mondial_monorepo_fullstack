namespace WebApp.Models.Dtos.Ai
{
    /// <summary>Token/credit/cost summary for <c>GET /api/ai/usage</c>.</summary>
    public class AiUsageDto
    {
        public int TotalCalls { get; set; }
        public long PromptTokens { get; set; }
        public long CompletionTokens { get; set; }
        public long TotalTokens { get; set; }
        public decimal EstimatedCost { get; set; }

        public int CreditBalance { get; set; }
        public int LifetimeGranted { get; set; }

        /// <summary>Gross credits ever debited (failures and refunded debits included).</summary>
        public int LifetimeSpent { get; set; }

        /// <summary>Net credits effectively retained/consumed (excluding refunded debits).</summary>
        public int NetCreditsSpent { get; set; }

        /// <summary>Total credits returned to user balance via refund.</summary>
        public int RefundedCredits { get; set; }

        /// <summary>Indicates if a measuring period is currently active for the user (only present when period=current is requested).</summary>
        [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
        public bool? PeriodActive { get; set; }

        /// <summary>Start timestamp of the active measuring period.</summary>
        [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? PeriodStart { get; set; }

        /// <summary>End timestamp of the active measuring period.</summary>
        [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? PeriodEnd { get; set; }

        /// <summary>Credits spent within the current measuring period.</summary>
        [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
        public int? PeriodCreditsSpent { get; set; }
    }
}
