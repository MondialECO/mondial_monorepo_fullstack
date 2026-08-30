using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

[BsonIgnoreExtraElements]
public class CompanyPortfolioHolding
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string InvestorId { get; set; } = string.Empty;
    public string InvestorUserId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string CompanyId { get; set; } = string.Empty;

    public string CompanyName { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string DealExecutionId { get; set; } = string.Empty;

    public string? MatchId { get; set; }

    public double InvestmentAmount { get; set; }
    public string Currency { get; set; } = "EUR";

    /// <summary>
    /// "equity" | "safe" | "convertible_note" | "debt"
    /// </summary>
    public string InstrumentType { get; set; } = "equity";

    /// <summary>
    /// Stored ONLY for real Equity instruments (preferred/common). Remains null for SAFE/Note/Debt unless converted.
    /// </summary>
    public double? EquityPercentage { get; set; }

    public double? EntryValuation { get; set; }
    public double? ValuationCap { get; set; }
    public double? DiscountRate { get; set; }
    public double? InterestRate { get; set; }
    public DateTime? MaturityDate { get; set; }

    public DateTime InvestmentDate { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    /// <summary>
    /// "active" | "exited" | "written_off"
    /// </summary>
    public string Status { get; set; } = "active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
