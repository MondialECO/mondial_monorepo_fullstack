using Hangfire;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// The single Hangfire entrypoint for all AI jobs. One durable job per AI
    /// request; module logic lives in <see cref="IAiTaskHandler"/> strategies,
    /// not in separate Hangfire methods.
    ///
    /// Filters live on this interface method because that is what Hangfire sees
    /// when enqueued via <c>Enqueue&lt;IAiJobRunner&gt;(r =&gt; r.RunAsync(id))</c>:
    /// the job runs on the dedicated <c>ai</c> queue with bounded retries.
    /// </summary>
    public interface IAiJobRunner
    {
        [Queue("ai")]
        [AutomaticRetry(Attempts = 2, DelaysInSeconds = new[] { 30, 120 })]
        // Permanent failures (local zero-balance, provider 4xx) skip the retries above
        // and go straight to Hangfire's Failed state — no wasted 30s+120s delay.
        [StopRetryOnPermanentAiFailure]
        Task RunAsync(string requestId);
    }
}
