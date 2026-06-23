using Hangfire.Common;
using Hangfire.States;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Stops Hangfire from retrying an AI job whose failure is PERMANENT — one a
    /// retry cannot fix. Without this, the bounded <c>[AutomaticRetry]</c> on
    /// <see cref="IAiJobRunner.RunAsync"/> would re-run a doomed job twice more
    /// (30s + 120s delays), wasting slots and delaying the user's error.
    ///
    /// Mechanism: this filter runs BEFORE <c>AutomaticRetry</c> (lower
    /// <see cref="JobFilterAttribute.Order"/>). When the elected state is a
    /// <see cref="FailedState"/> carrying a permanent AI exception, it exhausts the
    /// "RetryCount" job parameter so the AutomaticRetry filter — which reads that
    /// same parameter — sees no attempts remaining and leaves the job in the
    /// terminal Failed state (visible in the Hangfire dashboard) instead of
    /// scheduling a retry.
    ///
    /// Permanent = local credit exhaustion (a retry still finds 0 balance) or a 4xx
    /// client error from the provider (bad request / forbidden / not-found).
    /// Transient (network, timeout, 5xx, 429 rate-limit, upstream provider 402)
    /// is left alone and retries normally.
    /// </summary>
    public sealed class StopRetryOnPermanentAiFailureAttribute : JobFilterAttribute, IElectStateFilter
    {
        // AutomaticRetry's default Order is 20; run before it so our RetryCount
        // bump is in place when AutomaticRetry makes its retry decision.
        public StopRetryOnPermanentAiFailureAttribute() => Order = 10;

        // Comfortably exceeds any real Attempts value without risking the
        // overflow that int.MaxValue + 1 would cause inside AutomaticRetry.
        private const int ExhaustRetryBudget = 1_000_000;

        public void OnStateElection(ElectStateContext context)
        {
            if (context.CandidateState is FailedState failed && IsPermanent(failed.Exception))
            {
                context.SetJobParameter("RetryCount", ExhaustRetryBudget);
            }
        }

        private static bool IsPermanent(Exception? ex) => ex switch
        {
            // Local zero-balance: the creator's own credits are spent — a retry
            // finds the same empty ledger. Upstream provider 402 (ProviderPaymentRequired)
            // is NOT permanent here — it falls through to the base case below.
            InsufficientCreditsException ice => ice.Source == CreditFailureSource.LocalBalance,
            // Rate-limit (429) is transient by definition.
            AiRateLimitException => false,
            // A 4xx client error from the provider won't fix itself on retry; 5xx,
            // timeouts and unparseable-200 bodies (StatusCode null/2xx) are transient.
            AiProviderException ape => ape.StatusCode is >= 400 and < 500,
            _ => false,
        };
    }
}
