using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

/// <summary>
/// Immutable audit log of every state transition / mutation on a deal.
/// Powers the Phase 9 activity timeline; never updated after insert.
/// </summary>
public class Phase9DealActivityLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string CompanyId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string DealId { get; set; }

    /// <summary>
    /// Categorical event marker (e.g. deal_created, deal_status_changed,
    /// term_sheet_signed, due_diligence_updated, deal_document_uploaded,
    /// deal_closed). Whitelisted in Phase9Requirements.
    /// </summary>
    public string EventType { get; set; }

    public string FromStatus { get; set; }
    public string ToStatus { get; set; }

    public string ActorUserId { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    /// <summary>SHA-256 of caller IP; never stores raw IP.</summary>
    public string IpHash { get; set; }

    public string Notes { get; set; }
}

/// <summary>
/// Deal-scoped document attached during execution (term sheets, signed
/// agreements, diligence artefacts). Stored as a sub-shape on
/// <see cref="DealExecution"/> so deal-level retrieval can stream documents
/// without a join.
/// </summary>
public class DealDocument
{
    public string DocumentId { get; set; } = ObjectId.GenerateNewId().ToString();
    public string FileName { get; set; }
    public string StoragePath { get; set; }
    public long FileSize { get; set; }
    public string MimeType { get; set; }
    public string DocumentKind { get; set; } // term_sheet | signed_agreement | due_diligence | other
    public string UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
