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
    }
}
