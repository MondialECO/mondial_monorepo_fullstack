using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;

namespace WebApp.Services.Migrations;

public sealed record DealLifecycleReconciliationResult(
    string DealId,
    bool Reconciled,
    string Status,
    string Reason);

public interface IDealLifecycleReconciliation
{
    Task<DealLifecycleReconciliationResult> ReconcileAsync(
        string dealId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Targeted repair for historical offer rows whose persisted signature evidence
/// proves they are fully signed while their top-level lifecycle is stale.
/// This is intentionally opt-in by DealId and never performs a global rewrite.
/// </summary>
public sealed class DealLifecycleReconciliation(
    MongoDbContext db,
    ILogger<DealLifecycleReconciliation> logger) : IDealLifecycleReconciliation
{
    public static string? IneligibilityReason(DealExecution deal)
    {
        if (deal == null) return "Deal not found.";
        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            return $"Terminal deal '{deal.Status}' is never reconciled.";
        if (string.Equals(deal.Status, Phase9Requirements.DealStatusSigned, StringComparison.OrdinalIgnoreCase))
            return "Deal is already signed.";
        if (deal.Signatures?.BothSigned != true)
            return "Both persisted signature timestamps are required.";
        if (!string.Equals(deal.TermSheet?.Status, Phase9Requirements.TermSheetStatusSigned, StringComparison.OrdinalIgnoreCase))
            return "Persisted term sheet status must be signed.";
        if (deal.Revisions?.Any(revision =>
                string.Equals(revision.Status, Phase9Requirements.OfferStatusAccepted, StringComparison.OrdinalIgnoreCase)) != true)
            return "An accepted persisted revision is required.";
        return null;
    }

    public async Task<DealLifecycleReconciliationResult> ReconcileAsync(
        string dealId,
        CancellationToken cancellationToken = default)
    {
        if (!ObjectId.TryParse(dealId, out _))
            throw new ArgumentException("A valid dealId is required.", nameof(dealId));

        var deal = await db.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync(cancellationToken);
        if (deal == null)
            return new(dealId, false, "not_found", "Deal not found.");

        var reason = IneligibilityReason(deal);
        if (reason != null)
            return new(dealId, false, deal.Status, reason);

        var fromStatus = deal.Status;
        var filter = Builders<DealExecution>.Filter.And(
            Builders<DealExecution>.Filter.Eq(d => d.Id, dealId),
            Builders<DealExecution>.Filter.Eq(d => d.Status, fromStatus),
            Builders<DealExecution>.Filter.Ne("Signatures.FounderSignedAt", BsonNull.Value),
            Builders<DealExecution>.Filter.Ne("Signatures.InvestorSignedAt", BsonNull.Value),
            Builders<DealExecution>.Filter.Eq("TermSheet.Status", Phase9Requirements.TermSheetStatusSigned),
            Builders<DealExecution>.Filter.ElemMatch(
                d => d.Revisions,
                revision => revision.Status == Phase9Requirements.OfferStatusAccepted));
        var update = Builders<DealExecution>.Update
            .Set(d => d.Status, Phase9Requirements.DealStatusSigned)
            .Set(d => d.UpdatedAt, DateTime.UtcNow)
            .Inc(d => d.Version, 1);

        var write = await db.DealExecutions.UpdateOneAsync(
            filter, update, cancellationToken: cancellationToken);
        if (write.ModifiedCount != 1)
        {
            var current = await db.DealExecutions
                .Find(d => d.Id == dealId)
                .FirstOrDefaultAsync(cancellationToken);
            return new(
                dealId,
                false,
                current?.Status ?? "not_found",
                "Deal changed concurrently or no longer satisfies reconciliation eligibility.");
        }

        await db.Phase9DealActivityLogs.InsertOneAsync(new Phase9DealActivityLog
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = deal.CompanyId,
            DealId = deal.Id,
            EventType = Phase9Requirements.ActivityDealStatusChanged,
            FromStatus = fromStatus,
            ToStatus = Phase9Requirements.DealStatusSigned,
            ActorUserId = "system_deal_lifecycle_reconciliation",
            OccurredAt = DateTime.UtcNow,
            IpHash = string.Empty,
            Notes = "Reconciled from persisted accepted revision and both persisted signatures."
        }, cancellationToken: cancellationToken);

        logger.LogInformation(
            "Reconciled deal {DealId} lifecycle from {FromStatus} to signed.",
            dealId,
            fromStatus);
        return new(dealId, true, Phase9Requirements.DealStatusSigned, "Reconciled.");
    }
}
