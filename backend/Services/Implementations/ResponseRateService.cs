using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

public class ResponseRateService : IResponseRateService
{
    public static readonly TimeSpan ResponseWindow = TimeSpan.FromHours(48);
    private readonly MongoDbContext _db;
    private readonly IServiceProviderService _providers;

    public ResponseRateService(MongoDbContext db, IServiceProviderService providers)
    {
        _db = db;
        _providers = providers;
    }

    /// <summary>
    /// Time from a brief being surfaced to this provider until their first response to it,
    /// one entry per surfaced brief. A null entry is a brief the provider never answered.
    ///
    /// This is the single source of the interaction/proposal/message join. Both the
    /// response RATE and the median response TIME derive from it, so the two can never
    /// disagree about what counts as a response or which response came first.
    /// </summary>
    private async Task<List<TimeSpan?>> FirstResponseLatenciesAsync(string providerId)
    {
        var interactions = await _db.ClientBriefInteractions.Find(x => x.ProviderId == providerId).ToListAsync();
        if (interactions.Count == 0) return new();

        var ids = interactions.Select(x => x.ClientBriefId).Distinct().ToList();
        var proposals = await _db.Proposals.Find(x => x.ProviderId == providerId && x.ClientBriefId != null && ids.Contains(x.ClientBriefId)).ToListAsync();

        List<ChatMessage> messages = new();
        if (Guid.TryParse(providerId, out var providerGuid))
            messages = await _db.ChatMessages.Find(x => x.SenderId == providerGuid && x.ClientBriefId != null && ids.Contains(x.ClientBriefId)).ToListAsync();

        return interactions.Select(i =>
        {
            var proposalAt = proposals.Where(p => p.ClientBriefId == i.ClientBriefId).MinBy(p => p.SubmittedAt)?.SubmittedAt;
            var messageAt = messages.Where(m => m.ClientBriefId == i.ClientBriefId).MinBy(m => m.CreatedAt)?.CreatedAt;
            var first = new[] { proposalAt, messageAt }.Where(x => x.HasValue).Min();

            // A response timestamped before the brief was surfaced cannot be a response to
            // it; the rate has always discarded those, and a negative latency would drag
            // the median below zero.
            if (!first.HasValue || first.Value < i.CreatedAt) return (TimeSpan?)null;
            return first.Value - i.CreatedAt;
        }).ToList();
    }

    public async Task<double?> CalculateAsync(string providerId)
    {
        var latencies = await FirstResponseLatenciesAsync(providerId);
        if (latencies.Count == 0) return null;

        var responded = latencies.Count(x => x.HasValue && x.Value <= ResponseWindow);

        return Math.Round(100.0 * responded / latencies.Count, 1);
    }

    /// <summary>
    /// Median first-response latency, as a phrase that completes "Responds in ___" —
    /// both marketplace call sites render it that way.
    ///
    /// Median, not mean: one abandoned brief left unanswered for a month would drag a
    /// mean far away from what a buyer will actually experience.
    ///
    /// Unanswered briefs are excluded rather than counted as infinite. This answers
    /// "when they reply, how fast"; "how often they reply at all" is what the response
    /// rate already measures. Responses later than the 48h window ARE included —
    /// dropping them would bias the median low by discarding exactly the slow cases a
    /// buyer most needs to see.
    /// </summary>
    public async Task<string?> CalculateMedianResponseTimeAsync(string providerId)
    {
        var answered = (await FirstResponseLatenciesAsync(providerId))
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .ToList();

        var median = Median(answered);

        return median.HasValue ? FormatResponseLatency(median.Value) : null;
    }

    /// <summary>
    /// Median of a latency sample; null for an empty sample. Even-sized samples take the
    /// midpoint of the two central values. Public because it is pure and worth testing
    /// directly rather than through a Mongo-backed service.
    /// </summary>
    public static TimeSpan? Median(IReadOnlyList<TimeSpan> values)
    {
        if (values.Count == 0) return null;

        var sorted = values.OrderBy(x => x).ToList();
        var mid = sorted.Count / 2;

        return sorted.Count % 2 == 1
            ? sorted[mid]
            : TimeSpan.FromTicks((sorted[mid - 1].Ticks + sorted[mid].Ticks) / 2);
    }

    /// <summary>
    /// Buckets a latency into a display phrase. Deliberately coarse: this summarises a
    /// habit from a handful of samples, and an exact "in 3.7 hours" would imply a
    /// precision the data does not have. Every bucket is worded to read correctly after
    /// "Responds in". Public because it is pure and worth testing directly.
    /// </summary>
    public static string FormatResponseLatency(TimeSpan latency) => latency switch
    {
        _ when latency < TimeSpan.FromHours(1) => "under an hour",
        _ when latency < TimeSpan.FromHours(3) => "a couple of hours",
        _ when latency < TimeSpan.FromHours(12) => "a few hours",
        _ when latency < TimeSpan.FromHours(24) => "under a day",
        _ when latency < TimeSpan.FromHours(48) => "1-2 days",
        _ => "2+ days",
    };

    public async Task RefreshTrustSignalAsync(string providerId)
    {
        var rate = await CalculateAsync(providerId);
        await _providers.UpdateResponseRateSignalAsync(providerId, rate);
    }
}
