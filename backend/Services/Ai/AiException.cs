namespace WebApp.Services.Ai
{
    /// <summary>
    /// Base exception for AI-provider failures. Carries the upstream HTTP status
    /// (when known) so callers/handlers can branch without inspecting messages.
    /// </summary>
    public class AiProviderException : Exception
    {
        /// <summary>Upstream HTTP status code, when the failure came from the provider.</summary>
        public int? StatusCode { get; }

        public AiProviderException(string message, int? statusCode = null, Exception? inner = null)
            : base(message, inner)
        {
            StatusCode = statusCode;
        }
    }

    /// <summary>
    /// Identifies which side ran out of credits. A local zero-balance is the
    /// user's exhausted allocation — raised synchronously by the debit at Start
    /// (402, "upgrade" copy). A provider payment-required is a billing gap on OUR
    /// OpenRouter account — it can only occur inside the async job, is never
    /// retried (see StopRetryOnPermanentAiFailure), and surfaces via the session's
    /// Failed state with SERVICE-SIDE copy: it is never the user's credits and
    /// must never be presented as such.
    /// </summary>
    public enum CreditFailureSource
    {
        /// <summary>The creator's own AI credit balance is exhausted.</summary>
        LocalBalance,
        /// <summary>OpenRouter returned 402 — our provider account/billing issue.</summary>
        ProviderPaymentRequired,
    }

    /// <summary>
    /// Raised when a request is rejected for lack of credits. <see cref="Source"/>
    /// distinguishes a local zero-balance (the default — a creator's allocation is
    /// spent) from an upstream OpenRouter 402 (our provider billing gap), so the
    /// API layer maps them to different HTTP statuses (402 vs 503).
    /// </summary>
    public class InsufficientCreditsException : AiProviderException
    {
        /// <summary>Which side is out of credits. Defaults to <see cref="CreditFailureSource.LocalBalance"/>.</summary>
        public CreditFailureSource Source { get; init; } = CreditFailureSource.LocalBalance;

        public InsufficientCreditsException(string message, int? statusCode = 402, Exception? inner = null)
            : base(message, statusCode, inner)
        {
        }
    }

    /// <summary>
    /// Raised when the provider rate-limits the request (HTTP 429), after the
    /// HTTP-layer retries are exhausted. <see cref="RetryAfter"/> carries the
    /// provider's Retry-After hint when present.
    /// </summary>
    public class AiRateLimitException : AiProviderException
    {
        public TimeSpan? RetryAfter { get; }

        public AiRateLimitException(string message, TimeSpan? retryAfter = null, int? statusCode = 429, Exception? inner = null)
            : base(message, statusCode, inner)
        {
            RetryAfter = retryAfter;
        }
    }
}
