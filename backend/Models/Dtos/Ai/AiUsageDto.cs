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
        public int LifetimeSpent { get; set; }
    }
}
