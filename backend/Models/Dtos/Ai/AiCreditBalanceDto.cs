namespace WebApp.Models.Dtos.Ai
{
    /// <summary>
    /// Owner-scoped credit balance and cost table.
    /// Exposes current available balance, lifetime totals, and the server-authoritative
    /// cost per capability from AiSettings.CreditCosts (the single source of truth).
    /// </summary>
    public sealed class AiCreditBalanceDto
    {
        public int Balance { get; set; }
        public int LifetimeGranted { get; set; }
        public int LifetimeSpent { get; set; }
        public IReadOnlyDictionary<string, int> Costs { get; set; } = new Dictionary<string, int>();
    }
}
