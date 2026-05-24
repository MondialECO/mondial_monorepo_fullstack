using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

/// <summary>
/// One investor-side event in the data room (view or download). Backend-derived;
/// the entrepreneur cannot fabricate engagement, and the investor cannot spoof
/// another investor's identity because the controller binds investorId to
/// the authenticated caller.
/// </summary>
public class Phase6AccessLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }
    public string DocumentId { get; set; }
    public string InvestorId { get; set; }

    /// <summary>view | download</summary>
    public string EventType { get; set; }

    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    /// <summary>SHA-256 of remote IP at event time (avoid persisting raw IP).</summary>
    public string IpHash { get; set; }
}

/// <summary>
/// Records that a specific investor has signed the data-room NDA for a
/// specific company. Looked up at access-grant and download time when
/// <c>Companies.IsDataRoomNdaRequired</c> is true.
/// </summary>
public class Phase6NdaAcceptance
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }
    public string InvestorId { get; set; }

    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;

    /// <summary>SHA-256 of the NDA text the investor accepted (immutable proof).</summary>
    public string NdaTextHash { get; set; }
    public string IpHash { get; set; }
}
