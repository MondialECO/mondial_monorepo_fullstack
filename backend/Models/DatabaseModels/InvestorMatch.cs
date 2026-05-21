using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

public class InvestorMatch
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string CompanyId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string InvestorId { get; set; }

    public int MatchScore { get; set; } // 0-100

    public string Status { get; set; } = "new"; // new | viewed | interested | reviewing | matched | rejected | passed

    public InvestorPreferences InvestorPreferences { get; set; } = new();

    public List<InteractionRecord> Interactions { get; set; } = new();

    public DateTime MatchedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastInteractionAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class InvestorPreferences
{
    public List<string> PreferredSectors { get; set; } = new();
    public List<string> PreferredStages { get; set; } = new(); // pre_seed, seed, series_a
    public double MinInvestmentAmount { get; set; }
    public double MaxInvestmentAmount { get; set; }
    public List<string> PreferredGeographies { get; set; } = new();
    public bool PreRataRightsRequired { get; set; }
    public bool BoardSeatRequired { get; set; }
}

public class InteractionRecord
{
    public string Type { get; set; } // view | message | call | proposal_sent | term_sheet
    public string Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string InitiatedBy { get; set; } // company | investor
}
