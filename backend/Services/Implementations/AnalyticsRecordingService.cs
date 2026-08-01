using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class AnalyticsRecordingService(
        MongoDbContext db,
        ILogger<AnalyticsRecordingService> logger) : IAnalyticsRecordingService
    {
        public async Task RecordImpressionAsync(string listingId, string sessionKey, string? viewerProviderId, CancellationToken ct)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(listingId) || string.IsNullOrWhiteSpace(sessionKey))
                    return;

                // Fast lookup to get listing's ProviderId and verify it exists.
                var listing = await db.ServiceListings
                    .Find(x => x.Id == listingId)
                    .Project(x => new { x.Id, x.ProviderId })
                    .FirstOrDefaultAsync(ct);

                if (listing is null)
                {
                    logger.LogWarning("Impression recording: listing {ListingId} not found.", listingId);
                    return;
                }

                // Drop provider self-views.
                if (!string.IsNullOrWhiteSpace(viewerProviderId) && viewerProviderId == listing.ProviderId)
                    return;

                var now = DateTime.UtcNow;
                var expiresAt = now.AddMinutes(30);

                // Check for existing session record within the dedup window.
                var existing = await db.AnalyticsSessionSeen
                    .Find(x => x.ListingId == listingId
                        && x.SessionKey == sessionKey
                        && x.EventType == "impression"
                        && x.ExpiresAt > now)
                    .FirstOrDefaultAsync(ct);

                if (existing is not null)
                    return;

                // Atomic upsert on daily bucket. Must precede the dedup insert: if this
                // throws, no dedup record may be left behind, or every retry for this
                // session is suppressed for the rest of the window.
                var today = now.Date;
                var update = Builders<AnalyticsDailyBucket>.Update
                    .Inc(x => x.Impressions, 1)
                    .Set(x => x.UpdatedAt, now)
                    .SetOnInsert(x => x.ListingId, listingId)
                    .SetOnInsert(x => x.ProviderId, listing.ProviderId)
                    .SetOnInsert(x => x.Date, today);

                await db.AnalyticsDailyBuckets.UpdateOneAsync(
                    x => x.ListingId == listingId && x.Date == today,
                    update,
                    new UpdateOptions { IsUpsert = true },
                    cancellationToken: ct);

                // Claim the dedup window only once the counter is durably incremented.
                var sessionDoc = new AnalyticsSessionSeen
                {
                    ListingId = listingId,
                    SessionKey = sessionKey,
                    EventType = "impression",
                    LastSeenAt = now,
                    ExpiresAt = expiresAt
                };
                await db.AnalyticsSessionSeen.InsertOneAsync(sessionDoc, cancellationToken: ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error recording impression for listing {ListingId}.", listingId);
                // Fire-and-forget contract: always complete without throwing.
            }
        }

        public async Task RecordClickAsync(string listingId, string sessionKey, string? target, string? viewerProviderId, CancellationToken ct)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(listingId) || string.IsNullOrWhiteSpace(sessionKey))
                    return;

                // Fast lookup to get listing's ProviderId and verify it exists.
                var listing = await db.ServiceListings
                    .Find(x => x.Id == listingId)
                    .Project(x => new { x.Id, x.ProviderId })
                    .FirstOrDefaultAsync(ct);

                if (listing is null)
                {
                    logger.LogWarning("Click recording: listing {ListingId} not found.", listingId);
                    return;
                }

                // Drop provider self-views.
                if (!string.IsNullOrWhiteSpace(viewerProviderId) && viewerProviderId == listing.ProviderId)
                    return;

                var now = DateTime.UtcNow;
                var expiresAt = now.AddSeconds(5);

                // Check for existing session record within the 5-second dedup window.
                var existing = await db.AnalyticsSessionSeen
                    .Find(x => x.ListingId == listingId
                        && x.SessionKey == sessionKey
                        && x.EventType == "click"
                        && x.ExpiresAt > now)
                    .FirstOrDefaultAsync(ct);

                if (existing is not null)
                    return;

                // Atomic upsert on daily bucket. Must precede the dedup insert: if this
                // throws, no dedup record may be left behind, or every retry for this
                // session is suppressed for the rest of the window.
                var today = now.Date;
                var update = Builders<AnalyticsDailyBucket>.Update
                    .Inc(x => x.Clicks, 1)
                    .Set(x => x.UpdatedAt, now)
                    .SetOnInsert(x => x.ListingId, listingId)
                    .SetOnInsert(x => x.ProviderId, listing.ProviderId)
                    .SetOnInsert(x => x.Date, today);

                await db.AnalyticsDailyBuckets.UpdateOneAsync(
                    x => x.ListingId == listingId && x.Date == today,
                    update,
                    new UpdateOptions { IsUpsert = true },
                    cancellationToken: ct);

                // Claim the dedup window only once the counter is durably incremented.
                var sessionDoc = new AnalyticsSessionSeen
                {
                    ListingId = listingId,
                    SessionKey = sessionKey,
                    EventType = "click",
                    Target = target,
                    LastSeenAt = now,
                    ExpiresAt = expiresAt
                };
                await db.AnalyticsSessionSeen.InsertOneAsync(sessionDoc, cancellationToken: ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error recording click for listing {ListingId}.", listingId);
                // Fire-and-forget contract: always complete without throwing.
            }
        }

        public async Task IncrementInquiryAsync(string listingId, CancellationToken ct)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(listingId))
                    return;

                // Fast lookup to get listing's ProviderId.
                var listing = await db.ServiceListings
                    .Find(x => x.Id == listingId)
                    .Project(x => new { x.Id, x.ProviderId })
                    .FirstOrDefaultAsync(ct);

                if (listing is null)
                {
                    logger.LogWarning("Inquiry increment: listing {ListingId} not found.", listingId);
                    return;
                }

                var now = DateTime.UtcNow;
                var today = now.Date;

                // Atomic upsert on daily bucket.
                var update = Builders<AnalyticsDailyBucket>.Update
                    .Inc(x => x.Inquiries, 1)
                    .Set(x => x.UpdatedAt, now)
                    .SetOnInsert(x => x.ListingId, listingId)
                    .SetOnInsert(x => x.ProviderId, listing.ProviderId)
                    .SetOnInsert(x => x.Date, today);

                await db.AnalyticsDailyBuckets.UpdateOneAsync(
                    x => x.ListingId == listingId && x.Date == today,
                    update,
                    new UpdateOptions { IsUpsert = true },
                    cancellationToken: ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error incrementing inquiry for listing {ListingId}.", listingId);
                // Fire-and-forget contract: always complete without throwing.
            }
        }
    }
}
