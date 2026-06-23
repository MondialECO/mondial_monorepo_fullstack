using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

[BsonIgnoreExtraElements]
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

    // Investment Thesis (Phase 3). Additive/nullable — legacy docs read as null.
    public string ThesisStatement { get; set; }
    public string TargetReturnMultiple { get; set; } // e.g. "5-10x"
    public string FollowOnPolicy { get; set; }       // e.g. "always_pro_rata", "selective", "none"
    public string PreferredRole { get; set; }        // e.g. "lead", "co_investor", "follower"
    public string BoardParticipationLevel { get; set; } // e.g. "board_seat", "observer", "none"

    // Profile
    public string Bio { get; set; }
    public string Website { get; set; }
    public string LogoUrl { get; set; }
    public int SuccessfulExits { get; set; }
    public double AverageCheckSize { get; set; }

    // Public Profile (Phase 4). Additive/nullable — legacy docs read as null/default.
    public string Headline { get; set; }
    public string CoverImageUrl { get; set; }
    public Dictionary<string, string> SocialLinks { get; set; } = new();
    public bool IsPublic { get; set; } = false;

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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Link back to ApplicationUser when this investor was auto-created
    // from an Investor-role signup. Null for admin-curated catalog entries
    // (e.g. demo seed data).
    public string? LinkedUserId { get; set; }
}
