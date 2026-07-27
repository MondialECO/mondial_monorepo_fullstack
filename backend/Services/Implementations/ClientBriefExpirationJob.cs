using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

public class ClientBriefExpirationJob
{
    private readonly MongoDbContext _db;
    private readonly INotificationService _notifications;
    private readonly ILogger<ClientBriefExpirationJob> _logger;
    public ClientBriefExpirationJob(MongoDbContext db, INotificationService notifications, ILogger<ClientBriefExpirationJob> logger)
    {
        _db = db; _notifications = notifications; _logger = logger;
    }

    public async Task RunAsync()
    {
        var now = DateTime.UtcNow;
        var expiring = await _db.ClientBriefs.Find(x => x.Status == ClientBriefStatus.Open && x.ExpiresAt > now && x.ExpiresAt <= now.AddHours(24)).ToListAsync();
        foreach (var brief in expiring)
        {
            var saved = await _db.ClientBriefInteractions.Find(x => x.ClientBriefId == brief.Id && x.Saved && x.ExpiryNotificationSentAt == null).ToListAsync();
            foreach (var interaction in saved)
            {
                await NotifyAsync(interaction.ProviderId, "Saved brief expiring", $"{brief.Title} expires within 24 hours.");
                await _db.ClientBriefInteractions.UpdateOneAsync(x => x.Id == interaction.Id,
                    Builders<ClientBriefInteraction>.Update.Set(x => x.ExpiryNotificationSentAt, now));
            }
        }

        await _db.ClientBriefs.UpdateManyAsync(
            x => x.Status == ClientBriefStatus.Open && x.ExpiresAt <= now,
            Builders<ClientBrief>.Update.Set(x => x.Status, ClientBriefStatus.Expired).Set(x => x.UpdatedAt, now));

        var expiredProposals = await _db.Proposals.Find(x => x.Status == ProposalStatus.Submitted && x.ExpiresAt <= now).ToListAsync();
        foreach (var proposal in expiredProposals)
        {
            await _db.Proposals.UpdateOneAsync(x => x.Id == proposal.Id && x.Status == ProposalStatus.Submitted,
                Builders<Proposal>.Update.Set(x => x.Status, ProposalStatus.Expired).Set(x => x.UpdatedAt, now));
            await NotifyAsync(proposal.ProviderId, "Proposal expired", $"Your proposal '{proposal.Title}' expired.");
        }
    }

    private async Task NotifyAsync(string userId, string title, string body)
    {
        if (!Guid.TryParse(userId, out var id)) return;
        try { await _notifications.NotifyUser(id, title, body); }
        catch (Exception ex) { _logger.LogWarning(ex, "Expiry notification failed for {UserId}", userId); }
    }
}
