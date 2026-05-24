using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

public class DealExecution
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string CompanyId { get; set; }

    /// <summary>
    /// Whitelisted in <c>Phase9Requirements.DealStatusWhitelist</c>. Mutations
    /// only via <c>UpdateDealStatusAsync</c> using the transition graph.
    /// </summary>
    public string Status { get; set; } = "initiated";

    public List<DealParticipant> Investors { get; set; } = new();

    public TermSheet TermSheet { get; set; } = new();

    public List<DueDigligenceItem> DueDiligenceChecklist { get; set; } = new();

    public List<ClosingChecklistItem> ClosingChecklist { get; set; } = new();

    public List<DealMilestone> Milestones { get; set; } = new();

    public DealNegotiationStatus NegotiationStatus { get; set; } = new();

    /// <summary>
    /// Deal-scoped documents (term sheets, signed agreements, etc).
    /// </summary>
    public List<DealDocument> DealDocuments { get; set; } = new();

    /// <summary>
    /// Snapshotted at deal creation time. The live Investor record may later
    /// disappear; the snapshot guarantees deal timelines never render null
    /// investor identity.
    /// </summary>
    public string InvestorNameSnapshot { get; set; }
    public string InvestorTypeSnapshot { get; set; }

    public string CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class DealParticipant
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string InvestorId { get; set; }

    public string InvestorName { get; set; }
    public double CommittedAmount { get; set; }
    /// <summary>Whitelisted in <c>Phase9Requirements.ParticipantStatusWhitelist</c>.</summary>
    public string Status { get; set; } = "interested";
    public double EquityPercentage { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public class TermSheet
{
    public double TotalRaiseAmount { get; set; }
    public double PostMoneyValuation { get; set; }
    public double PreMoneyValuation { get; set; }
    public string EquityType { get; set; } // preferred | safe | note
    public double InvestorEquityPercent { get; set; }

    // Rights & Preferences
    public bool ProRataRights { get; set; }
    public string LiquidationPreference { get; set; } // 1x_non_participating, 1x_participating, 2x, 3x
    public int BoardSeats { get; set; }
    public string AntiDilutionProtection { get; set; } // broad_based, narrow_based, none

    // Vesting (if equity to founders)
    public int VestingYears { get; set; } = 4;
    public int CliffMonths { get; set; } = 12;

    // Governance
    public List<string> InvestorRights { get; set; } = new(); // information_rights, voting_rights, etc
    public bool InfoRightsTermination { get; set; } // Terminates upon IPO/acquisition
    public DateTime? ProposedClosingDate { get; set; }

    /// <summary>Whitelisted in <c>Phase9Requirements.TermSheetStatusWhitelist</c>.</summary>
    public string Status { get; set; } = "draft";
    public DateTime? SignedAt { get; set; }
    /// <summary>DocumentId of the signed term sheet artefact (in DealExecution.DealDocuments).</summary>
    public string SignedDocumentId { get; set; }
}

public class DueDigligenceItem
{
    public string ItemName { get; set; }
    public string Category { get; set; } // legal | financial | technical | business
    public string Status { get; set; } = "pending"; // pending | in_progress | completed | flagged
    public string AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    public string Notes { get; set; }
    public string[] RequiredDocuments { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ClosingChecklistItem
{
    public string Item { get; set; }
    public bool Completed { get; set; }
    public string Owner { get; set; } // company | investor | legal
    public DateTime? DueDate { get; set; }
    public string Notes { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class DealMilestone
{
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime TargetDate { get; set; }
    public DateTime? ActualDate { get; set; }
    public string Status { get; set; } = "pending"; // pending | in_progress | completed | blocked
    public double MilestoneAmount { get; set; } // If tranched funding
}

public class DealNegotiationStatus
{
    public string CurrentPhase { get; set; } = "negotiation";
    public double ProgressPercent { get; set; }
    public List<NegotiationPoint> OpenPoints { get; set; } = new();
    public List<string> AgreedTerms { get; set; } = new();
    public DateTime LastUpdateAt { get; set; } = DateTime.UtcNow;
}

public class NegotiationPoint
{
    public string Point { get; set; }
    public string CompanyProposal { get; set; }
    public string InvestorProposal { get; set; }
    public string Status { get; set; } = "open"; // open | compromised | agreed
    public string ResolutionPath { get; set; }
}
