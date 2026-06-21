using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Ai
{
    /// <summary>
    /// Gates AI jobs on the per-user <c>AICredits</c> balance. Cost per job type
    /// comes from <c>Ai:CreditCosts</c>; a cost of 0 (e.g. Probe) is free and
    /// skips the ledger entirely so the self-test runs without credits.
    /// </summary>
    public interface IAiCreditService
    {
        /// <summary>
        /// Debits the configured cost for <paramref name="jobType"/> from the
        /// owner's balance. No-op when the cost is 0. Throws
        /// <see cref="InsufficientCreditsException"/> when the balance is too low.
        /// </summary>
        Task DebitForJobAsync(string ownerUserId, AiJobType jobType);
    }

    public sealed class AiCreditService : IAiCreditService
    {
        private readonly AiCreditLedgerRepository _credits;
        private readonly AiSettings _settings;

        public AiCreditService(AiCreditLedgerRepository credits, IOptions<AiSettings> settings)
        {
            _credits = credits;
            _settings = settings.Value;
        }

        public async Task DebitForJobAsync(string ownerUserId, AiJobType jobType)
        {
            var cost = _settings.CreditCosts.TryGetValue(jobType.ToString(), out var c) ? c : 0;
            if (cost <= 0)
                return; // free job (e.g. Probe) — no ledger interaction

            var debited = await _credits.TryDebitAsync(ownerUserId, cost, new AiCreditDebit
            {
                Amount = cost,
                Reason = jobType.ToString(),
                At = DateTime.UtcNow,
            });

            if (!debited)
                throw new InsufficientCreditsException(
                    $"Insufficient AI credits for '{jobType}' (requires {cost}).", statusCode: 402);
        }
    }
}
