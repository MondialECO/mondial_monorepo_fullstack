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

        /// <summary>
        /// Debits the configured cost for <paramref name="jobType"/> from the
        /// owner's balance with an explicit <paramref name="operationId"/>.
        /// </summary>
        Task DebitForJobAsync(string ownerUserId, AiJobType jobType, string? operationId);

        /// <summary>
        /// Compensates / refunds the configured cost for <paramref name="jobType"/> back to the
        /// owner's balance for a specific <paramref name="operationId"/> if downstream session persistence
        /// or job enqueue fails. Atomically idempotent: multiple calls for the same operationId mutate at most once.
        /// </summary>
        Task<CreditRefundResult> RefundForJobAsync(string ownerUserId, AiJobType jobType, string operationId, string reason = "Generation failed before acceptance");
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

        public Task DebitForJobAsync(string ownerUserId, AiJobType jobType) =>
            DebitForJobAsync(ownerUserId, jobType, null);

        public async Task DebitForJobAsync(string ownerUserId, AiJobType jobType, string? operationId)
        {
            var cost = _settings.CreditCosts.TryGetValue(jobType.ToString(), out var c) ? c : 0;
            if (cost <= 0)
                return; // free job (e.g. Probe) — no ledger interaction

            // Guarantee every user owns a starter ledger before their first debit.
            // Idempotent: TryGrantInitialAsync only inserts when absent (unique
            // OwnerUserId index), so an existing — even fully-spent — balance is
            // never topped up. This covers creators who signed up after the boot
            // backfill ran, so the very first paid job seeds their StarterCredits.
            if (_settings.StarterCredits > 0)
                await _credits.TryGrantInitialAsync(ownerUserId, _settings.StarterCredits);

            var result = await _credits.TryDebitAsync(ownerUserId, cost, new AiCreditDebit
            {
                OperationId = string.IsNullOrWhiteSpace(operationId) ? MongoDB.Bson.ObjectId.GenerateNewId().ToString() : operationId,
                Amount = cost,
                Reason = jobType.ToString(),
                Refunded = false,
                At = DateTime.UtcNow,
            });

            if (result == CreditDebitResult.Applied || result == CreditDebitResult.AlreadyDebited)
                return; // success (either fresh debit or idempotent replay)

            throw new InsufficientCreditsException(
                $"Insufficient AI credits for '{jobType}' (requires {cost}).", statusCode: 402)
                { Source = CreditFailureSource.LocalBalance };
        }

        public async Task<CreditRefundResult> RefundForJobAsync(string ownerUserId, AiJobType jobType, string operationId, string reason = "Generation failed before acceptance")
        {
            var cost = _settings.CreditCosts.TryGetValue(jobType.ToString(), out var c) ? c : 0;
            if (cost <= 0)
                return CreditRefundResult.Applied; // free job — no refund needed

            return await _credits.TryRefundAsync(ownerUserId, operationId, cost, reason);
        }
    }
}
