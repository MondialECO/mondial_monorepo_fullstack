using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

/// <summary>
/// Phase 3 KPI baseline document. One latest-baseline per company is the
/// minimum required to complete Phase 3. Historical baselines may accumulate
/// over time; the validator looks at the most recent.
/// </summary>
public class Phase3Kpi
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }

    public double Mrr { get; set; }
    public double Arr { get; set; }
    public double GrossMarginPercent { get; set; }
    public double Cac { get; set; }
    public double Ltv { get; set; }
    public double ChurnPercent { get; set; }
    public int ActiveAccounts { get; set; }

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Monthly revenue data point. A Phase 3 submission may include any number of
/// months; sector breakdown is optional and recorded as a map of sector → revenue.
/// </summary>
public class Phase3MonthlyRevenue
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }

    /// <summary>YYYY-MM string for stable lexicographic sort.</summary>
    public string YearMonth { get; set; }

    public double Revenue { get; set; }

    public Dictionary<string, double> SectorBreakdown { get; set; } = new();

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Phase 3 financial report (P&amp;L, balance sheet, audit, etc.). Uploaded
/// via multipart; the binary lives on disk via IDocumentManager and the
/// metadata + storage path lives here.
/// </summary>
public class Phase3FinancialReport
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string CompanyId { get; set; }

    /// <summary>pnl | balance | audit | other</summary>
    public string Type { get; set; }

    public string FileName { get; set; }
    public string StoragePath { get; set; }
    public long FileSize { get; set; }

    /// <summary>pending | approved | rejected (same vocabulary as Phase 2 docs)</summary>
    public string Status { get; set; } = "pending";

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string ReviewNote { get; set; }
}
