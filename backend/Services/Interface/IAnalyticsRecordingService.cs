namespace WebApp.Services.Interface
{
    public interface IAnalyticsRecordingService
    {
        /// <summary>
        /// Records an impression for the given listing if it hasn't been seen from this
        /// session key in the last 30 minutes and the caller is not the listing's provider.
        /// Fire-and-forget contract — always completes without throwing.
        /// </summary>
        Task RecordImpressionAsync(string listingId, string sessionKey, string? viewerProviderId, CancellationToken ct);

        /// <summary>
        /// Records a click for the given listing with a 5-second dedup window.
        /// Fire-and-forget contract.
        /// </summary>
        Task RecordClickAsync(string listingId, string sessionKey, string? target, string? viewerProviderId, CancellationToken ct);

        /// <summary>
        /// Increments the inquiry counter for the given listing. Called from the existing
        /// message-send flow after successful message persistence.
        /// </summary>
        Task IncrementInquiryAsync(string listingId, CancellationToken ct);
    }
}
