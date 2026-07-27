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

    public async Task<double?> CalculateAsync(string providerId)
    {
        var interactions = await _db.ClientBriefInteractions.Find(x => x.ProviderId == providerId).ToListAsync();
        if (interactions.Count == 0) return null;

        var ids = interactions.Select(x => x.ClientBriefId).Distinct().ToList();
        var proposals = await _db.Proposals.Find(x => x.ProviderId == providerId && x.ClientBriefId != null && ids.Contains(x.ClientBriefId)).ToListAsync();

        List<ChatMessage> messages = new();
        if (Guid.TryParse(providerId, out var providerGuid))
            messages = await _db.ChatMessages.Find(x => x.SenderId == providerGuid && x.ClientBriefId != null && ids.Contains(x.ClientBriefId)).ToListAsync();

        var responded = interactions.Count(i =>
        {
            var deadline = i.CreatedAt + ResponseWindow;
            var proposalAt = proposals.Where(p => p.ClientBriefId == i.ClientBriefId).MinBy(p => p.SubmittedAt)?.SubmittedAt;
            var messageAt = messages.Where(m => m.ClientBriefId == i.ClientBriefId).MinBy(m => m.CreatedAt)?.CreatedAt;
            var first = new[] { proposalAt, messageAt }.Where(x => x.HasValue).Min();
            return first.HasValue && first.Value >= i.CreatedAt && first.Value <= deadline;
        });

        return Math.Round(100.0 * responded / interactions.Count, 1);
    }

    public async Task RefreshTrustSignalAsync(string providerId)
    {
        var rate = await CalculateAsync(providerId);
        await _providers.UpdateResponseRateSignalAsync(providerId, rate);
    }
}
