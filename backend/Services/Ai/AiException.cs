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
    /// Raised when the provider rejects a request for lack of credits/quota
    /// (OpenRouter returns HTTP 402). Distinct so the job layer can surface a
    /// clear "insufficient credits" state rather than a generic failure.
    /// </summary>
    public class InsufficientCreditsException : AiProviderException
    {
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
