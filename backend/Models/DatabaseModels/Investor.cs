using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

public class Investor
{
    [BsonId]
    public string Id { get; set; }

    public string Name { get; set; }
    public string Type { get; set; } // angel | seed_fund | vc | corporate | family_office

    // Investment Preferences
    public List<string> PreferredSectors { get; set; } = new();
    public List<string> PreferredStages { get; set; } = new(); // pre_seed, seed, series_a, series_b, series_c
    public double MinCheckSize { get; set; }
    public double MaxCheckSize { get; set; }
    public List<string> PreferredGeographies { get; set; } = new();

    // Deal Preferences
    public bool RequiresProRataRights { get; set; } = false;
    public bool RequiresBoardSeat { get; set; } = false;
    public List<string> PreferredEquityTypes { get; set; } = new(); // preferred, safe, note

    // Profile
    public string Bio { get; set; }
    public string Website { get; set; }
    public string LogoUrl { get; set; }
    public int SuccessfulExits { get; set; }
    public double AverageCheckSize { get; set; }

    // Activity
    public int CompletedDeals { get; set; }
    public int ActiveInvestments { get; set; }
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;

    // Contact
    public string PrimaryContact { get; set; }
    public string PrimaryEmail { get; set; }
    public string PrimaryPhone { get; set; }

    // Metadata
    public bool IsActive { get; set; } = true;
    public int ProfileScore { get; set; } // 0-100, higher = more attractive
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
