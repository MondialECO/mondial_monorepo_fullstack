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
    /// Permanent = credit exhaustion on EITHER side (a retry finds the same empty
    /// local ledger; a retry can't fix our provider billing), a 4xx client error
    /// from the provider, an HTTP timeout, or a 429 whose Retry-After points at the
    /// daily free-tier reset (hours away — retrying compounds against the cap).
    /// Transient (network, 5xx, burst 429) is left alone and retries normally.
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
            // BOTH credit-failure sources are permanent. Local zero-balance: a retry
            // finds the same empty ledger. Provider 402 (our OpenRouter billing gap):
            // a 30s/120s retry cannot fix billing — it only burns time and delays the
            // user's honest error. (Earlier docs called provider-402 transient; that
            // was wrong and never matched behavior.)
            InsufficientCreditsException => true,
            // Rate-limit (429): a BURST (20/min window) is transient — a delayed retry
            // can succeed. But a Retry-After far beyond the total retry window (~150s)
            // means the DAILY free-tier cap — retrying compounds against a reset that
            // is hours away, so treat it as permanent. No Retry-After → assume burst.
            AiRateLimitException rle => rle.RetryAfter is { } ra && ra > TimeSpan.FromMinutes(10),
            // HTTP timeout (HttpClient.Timeout elapsed): surfaces as an AiProviderException
            // with no StatusCode, wrapping a TaskCanceledException/OperationCanceledException.
            // On an already-slow model a retry almost certainly times out AGAIN, burning
            // another (likely-billed, mid-generation) free-tier request for ~zero gain — so
            // treat it as permanent and fail fast. The runner has already marked the session
            // Failed with this error, so the UI still shows an honest message + manual retry.
            // (Only the timeout matches here: the network-error path wraps HttpRequestException.)
            AiProviderException { InnerException: OperationCanceledException } => true,
            // A 4xx client error from the provider won't fix itself on retry; 5xx and
            // unparseable-200 bodies (StatusCode null/2xx, non-timeout) stay transient.
            AiProviderException ape => ape.StatusCode is >= 400 and < 500,
            _ => false,
        };
    }
}
