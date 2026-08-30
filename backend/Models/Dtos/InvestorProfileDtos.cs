namespace WebApp.Models.Dtos;

// Wire contracts for the investor self-service profile (Phase 3 Investment
// Thesis + Phase 4 Public Profile). Serialized camelCase by the global MVC
// JSON policy (PascalCase property -> camelCase key), matching the existing
// investor reads. Bound case-insensitively on the request side.

/// <summary>
/// Partial-update payload for PUT /api/investor/profile. Every field is
/// nullable; only provided fields are applied, so callers can patch a single
/// section (thesis, preferences, or public profile) without wiping the rest.
/// System/identity fields (Id, LinkedUserId, CompletedDeals, ActiveInvestments,
/// timestamps) are intentionally NOT writable here.
/// </summary>
public class UpdateInvestorProfileRequest
{
    // Identity / contact
    public string? Name { get; set; }
    public string? Type { get; set; } // angel | seed_fund | vc | corporate | family_office
    public string? PrimaryContact { get; set; }
    public string? PrimaryPhone { get; set; }

    // Investment preferences
    public List<string>? PreferredSectors { get; set; }
    public List<string>? PreferredStages { get; set; }
    public double? MinCheckSize { get; set; }
    public double? MaxCheckSize { get; set; }
    public List<string>? PreferredGeographies { get; set; }
    public bool? RequiresProRataRights { get; set; }
    public bool? RequiresBoardSeat { get; set; }
    public List<string>? PreferredEquityTypes { get; set; }

    // Investment thesis (Phase 3)
    public string? ThesisStatement { get; set; }
    public string? TargetReturnMultiple { get; set; }
    public string? FollowOnPolicy { get; set; }
    public string? PreferredRole { get; set; }
    public string? BoardParticipationLevel { get; set; }

    // Public profile (Phase 4)
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public Dictionary<string, string>? SocialLinks { get; set; }
    public bool? IsPublic { get; set; }

    // Self-reported track record (Phase 4 "notable investments")
    public int? SuccessfulExits { get; set; }
    public double? AverageCheckSize { get; set; }
}

/// <summary>
/// Full investor-profile projection returned by GET and PUT
/// /api/investor/profile. Superset of the previous sparse projection: every
/// previously-exposed key is preserved, plus the track-record and Phase-3/4
/// fields the thesis/public-profile UIs need.
/// </summary>
public class InvestorProfileResponse
{
    public string? Id { get; set; }
    public string UserId { get; set; } = "";
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Type { get; set; }

    // Public profile (Phase 4)
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public Dictionary<string, string> SocialLinks { get; set; } = new();
    public bool IsPublic { get; set; }

    // Investment preferences
    public List<string> PreferredSectors { get; set; } = new();
    public List<string> PreferredStages { get; set; } = new();
    public double MinCheckSize { get; set; }
    public double MaxCheckSize { get; set; }
    public List<string> PreferredGeographies { get; set; } = new();
    public bool RequiresProRataRights { get; set; }
    public bool RequiresBoardSeat { get; set; }
    public List<string> PreferredEquityTypes { get; set; } = new();

    // Investment thesis (Phase 3)
    public string? ThesisStatement { get; set; }
    public string? TargetReturnMultiple { get; set; }
    public string? FollowOnPolicy { get; set; }
    public string? PreferredRole { get; set; }
    public string? BoardParticipationLevel { get; set; }

    // Track record / activity (previously present in model but unprojected)
    public int SuccessfulExits { get; set; }
    public double AverageCheckSize { get; set; }
    public int CompletedDeals { get; set; }
    public int ActiveInvestments { get; set; }

    // Contact + metadata
    public string? PrimaryContact { get; set; }
    public string? PrimaryPhone { get; set; }
    public bool IsActive { get; set; }
    /// <summary>True when a catalogue Investor row is linked to the user.</summary>
    public bool Linked { get; set; }
}

/// <summary>
/// Safe public Investor profile projection for Founders/Entrepreneurs and public discovery.
/// Strictly excludes private personal contact (PrimaryEmail, PrimaryPhone, PrimaryContact),
/// banking, KYC, and internal system IDs (LinkedUserId).
/// </summary>
public class PublicInvestorProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // angel | seed_fund | vc | corporate | family_office
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public Dictionary<string, string> SocialLinks { get; set; } = new();
    public bool IsPublic { get; set; }

    // Investment preferences
    public List<string> PreferredSectors { get; set; } = new();
    public List<string> PreferredStages { get; set; } = new();
    public double MinCheckSize { get; set; }
    public double MaxCheckSize { get; set; }
    public List<string> PreferredGeographies { get; set; } = new();

    // Deal & Governance preferences
    public bool RequiresProRataRights { get; set; }
    public bool RequiresBoardSeat { get; set; }
    public List<string> PreferredEquityTypes { get; set; } = new();

    // Investment thesis (Phase 3)
    public string? ThesisStatement { get; set; }
    public string? TargetReturnMultiple { get; set; }
    public string? FollowOnPolicy { get; set; }
    public string? PreferredRole { get; set; }
    public string? BoardParticipationLevel { get; set; }

    // Track record & activity
    public int SuccessfulExits { get; set; }
    public double AverageCheckSize { get; set; }
    public int CompletedDeals { get; set; }
    public int ActiveInvestments { get; set; }
    public int ProfileScore { get; set; }
    public bool IsFinanceVerified { get; set; }
    public DateTime? LastActiveAt { get; set; }

    public static PublicInvestorProfileDto FromInvestor(DatabaseModels.Investor inv, bool isFinanceVerified = false)
    {
        if (inv == null) return null!;
        return new PublicInvestorProfileDto
        {
            Id = inv.Id ?? string.Empty,
            Name = inv.Name ?? string.Empty,
            Type = inv.Type ?? string.Empty,
            Headline = inv.Headline,
            Bio = inv.Bio,
            Website = inv.Website,
            LogoUrl = inv.LogoUrl,
            CoverImageUrl = inv.CoverImageUrl,
            SocialLinks = inv.SocialLinks ?? new Dictionary<string, string>(),
            IsPublic = inv.IsPublic,
            PreferredSectors = inv.PreferredSectors ?? new List<string>(),
            PreferredStages = inv.PreferredStages ?? new List<string>(),
            MinCheckSize = inv.MinCheckSize,
            MaxCheckSize = inv.MaxCheckSize,
            PreferredGeographies = inv.PreferredGeographies ?? new List<string>(),
            RequiresProRataRights = inv.RequiresProRataRights,
            RequiresBoardSeat = inv.RequiresBoardSeat,
            PreferredEquityTypes = inv.PreferredEquityTypes ?? new List<string>(),
            ThesisStatement = inv.ThesisStatement,
            TargetReturnMultiple = inv.TargetReturnMultiple,
            FollowOnPolicy = inv.FollowOnPolicy,
            PreferredRole = inv.PreferredRole,
            BoardParticipationLevel = inv.BoardParticipationLevel,
            SuccessfulExits = inv.SuccessfulExits,
            AverageCheckSize = inv.AverageCheckSize,
            CompletedDeals = inv.CompletedDeals,
            ActiveInvestments = inv.ActiveInvestments,
            ProfileScore = inv.ProfileScore,
            IsFinanceVerified = isFinanceVerified,
            LastActiveAt = inv.LastActiveAt
        };
    }
}

/// <summary>
/// Admin-only Investor projection for privileged administrative workflows.
/// </summary>
public class AdminInvestorDto : PublicInvestorProfileDto
{
    public string? PrimaryContact { get; set; }
    public string? PrimaryEmail { get; set; }
    public string? PrimaryPhone { get; set; }
    public string? LinkedUserId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static new AdminInvestorDto FromInvestor(DatabaseModels.Investor inv, bool isFinanceVerified = false)
    {
        if (inv == null) return null!;
        return new AdminInvestorDto
        {
            Id = inv.Id ?? string.Empty,
            Name = inv.Name ?? string.Empty,
            Type = inv.Type ?? string.Empty,
            Headline = inv.Headline,
            Bio = inv.Bio,
            Website = inv.Website,
            LogoUrl = inv.LogoUrl,
            CoverImageUrl = inv.CoverImageUrl,
            SocialLinks = inv.SocialLinks ?? new Dictionary<string, string>(),
            IsPublic = inv.IsPublic,
            PreferredSectors = inv.PreferredSectors ?? new List<string>(),
            PreferredStages = inv.PreferredStages ?? new List<string>(),
            MinCheckSize = inv.MinCheckSize,
            MaxCheckSize = inv.MaxCheckSize,
            PreferredGeographies = inv.PreferredGeographies ?? new List<string>(),
            RequiresProRataRights = inv.RequiresProRataRights,
            RequiresBoardSeat = inv.RequiresBoardSeat,
            PreferredEquityTypes = inv.PreferredEquityTypes ?? new List<string>(),
            ThesisStatement = inv.ThesisStatement,
            TargetReturnMultiple = inv.TargetReturnMultiple,
            FollowOnPolicy = inv.FollowOnPolicy,
            PreferredRole = inv.PreferredRole,
            BoardParticipationLevel = inv.BoardParticipationLevel,
            SuccessfulExits = inv.SuccessfulExits,
            AverageCheckSize = inv.AverageCheckSize,
            CompletedDeals = inv.CompletedDeals,
            ActiveInvestments = inv.ActiveInvestments,
            ProfileScore = inv.ProfileScore,
            IsFinanceVerified = isFinanceVerified,
            LastActiveAt = inv.LastActiveAt,
            PrimaryContact = inv.PrimaryContact,
            PrimaryEmail = inv.PrimaryEmail,
            PrimaryPhone = inv.PrimaryPhone,
            LinkedUserId = inv.LinkedUserId,
            IsActive = inv.IsActive,
            CreatedAt = inv.CreatedAt,
            UpdatedAt = inv.UpdatedAt
        };
    }
}
