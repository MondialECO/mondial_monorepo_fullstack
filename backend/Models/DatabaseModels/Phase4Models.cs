using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

/// <summary>
/// Allowed share-class identifiers. Phase 4 validator rejects unknown classes
/// and duplicate share-class names within a single cap table submission.
/// </summary>
public static class ShareClasses
{
    public const string Common = "common";
    public const string Preferred = "preferred";
    public const string Safe = "safe";
    public const string Note = "note";

    public static readonly IReadOnlyList<string> All = new[] { Common, Preferred, Safe, Note };

    public static bool IsValid(string s)
        => !string.IsNullOrWhiteSpace(s) && All.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));
}

/// <summary>
/// One equity grant (founder, investor, advisor, ESOP recipient).
/// Vesting is described declaratively here; the % vested at any point in time
/// is computed by Phase4Requirements.ComputeVestedPercent — never stored.
/// </summary>
public class EquityGrant
{
    public string GrantId { get; set; } = ObjectId.GenerateNewId().ToString();

    public string StakeholderName { get; set; }
    public string StakeholderType { get; set; } // founder | investor | advisor | esop
    public string ShareClass { get; set; }       // common | preferred | safe | note

    public int SharesGranted { get; set; }
    public double? InvestmentAmount { get; set; }

    public DateTime GrantDate { get; set; } = DateTime.UtcNow;

    /// <summary>0 if no cliff.</summary>
    public int CliffMonths { get; set; }
    /// <summary>Total vesting months (e.g. 48 for a standard 4-year schedule).</summary>
    public int TotalVestMonths { get; set; }
}

/// <summary>
/// Versioned cap table snapshot. Latest by RecordedAt represents the company's
/// current submitted cap table. Older versions form an immutable audit trail.
/// </summary>
public class Phase4CapTable
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }

    public int Version { get; set; }
    public int TotalShares { get; set; }
    public double EsopPoolPercent { get; set; }
    public int EsopVestingMonths { get; set; }
    public List<EquityGrant> Grants { get; set; } = new();

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Vesting schedule per-grant. Stored separately from <see cref="Phase4CapTable"/>
/// so vesting changes (e.g. acceleration on exit) can be recorded without
/// rewriting the cap table snapshot.
/// </summary>
public class Phase4VestingSchedule
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }
    public string GrantId { get; set; }
    public string StakeholderName { get; set; }
    public int SharesGranted { get; set; }

    public DateTime GrantDate { get; set; }
    public int CliffMonths { get; set; }
    public int TotalVestMonths { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// One ownership event in the company's history (e.g. a funding round).
/// Used to render dilution review without recomputing from scratch.
/// </summary>
public class Phase4OwnershipHistory
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }
    public string RoundName { get; set; }      // e.g. "Pre-seed", "Seed", "Series A"
    public DateTime EventDate { get; set; } = DateTime.UtcNow;

    public double FounderOwnershipBefore { get; set; }
    public double FounderOwnershipAfter { get; set; }
    public double InvestorOwnership { get; set; }
    public double EsopOwnership { get; set; }
    public double Valuation { get; set; }
    public string Notes { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Single share-issuance event (a new grant or follow-on). Phase 4 step 2
/// emits one of these per issued tranche.
/// </summary>
public class Phase4ShareIssuance
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }
    public string IssuedTo { get; set; }
    public string ShareClass { get; set; }
    public int SharesIssued { get; set; }
    public double? PricePerShare { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public string Reason { get; set; }
}
