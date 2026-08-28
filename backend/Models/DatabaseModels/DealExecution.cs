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

    /// <summary>
    /// Ordered offer/counter-offer history (Phase D-4). The last entry is the
    /// live offer; <see cref="TermSheet"/> holds the accepted/current terms.
    /// </summary>
    public List<TermSheetRevision> Revisions { get; set; } = new();

    /// <summary>
    /// Whose action the offer thread is waiting on: "founder", "investor", or
    /// "" (none — no open offer / negotiation concluded).
    /// </summary>
    public string CurrentTurn { get; set; } = "";

    /// <summary>
    /// Per-role term-sheet signatures. Each party signs only its own slot; a
    /// deal is fully signed only when BOTH slots are present (Phase D-3).
    /// </summary>
    public DealSignatures Signatures { get; set; } = new();

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

    /// <summary>
    /// Snapshotted company (counterparty) name, set at deal creation. Lets the
    /// investor-facing deal inbox render the real company instead of a raw
    /// "Founder · {dealId}" fallback. Same rationale as InvestorNameSnapshot.
    /// </summary>
    public string CompanyNameSnapshot { get; set; }

    public string CreatedByUserId { get; set; }

    // ============ PHASE 3: CREATOR MARKETPLACE EXTENSIONS ============
    /// <summary>"EQUITY_PARTNERSHIP" | "FULL_BUYOUT" | "INVESTMENT_ROUND"</summary>
    public string DealType { get; set; } = "INVESTMENT_ROUND";

    public string? IdeaId { get; set; }
    public string? ListingId { get; set; }
    public string? ProjectInterestId { get; set; }
    public string? CreatorId { get; set; }
    public string? EntrepreneurId { get; set; }
    public string? ConversationId { get; set; }

    /// <summary>"OFFER_NEGOTIATION" | "ROLES_PENDING" | "REJECTED" | "WITHDRAWN" | "ACTIVE"</summary>
    public string DealStage { get; set; } = "OFFER_NEGOTIATION";

    public int? AcceptedRevisionNumber { get; set; }
    public string? AcceptedRevisionId { get; set; }
    public DateTime? AcceptedAt { get; set; }

    public EquityTerms? EquityTerms { get; set; }
    public BuyoutTerms? BuyoutTerms { get; set; }

    // ============ PHASE 4: ROLE & RESPONSIBILITY EXTENSIONS ============
    public RoleResponsibilityAgreement? RoleAgreement { get; set; }

    // ============ PHASE 5: EQUITY & OWNERSHIP CAP TABLE DRAFT EXTENSIONS ============
    public DealCapTableDraft? CapTableDraft { get; set; }

    // ============ PHASE 6: LEGAL & SHAREHOLDER REVIEW EXTENSIONS ============
    public LegalReviewPackage? LegalPackage { get; set; }

    // ============ PHASE 7: AGREEMENT SIGNING EXTENSIONS ============
    public AgreementSigningPackage? SigningPackage { get; set; }

    // ============ PHASE 8: COMPANY & PROJECT ACTIVATION EXTENSIONS ============
    public PartnershipActivation? Activation { get; set; }

    // ============ FULL BUYOUT PHASE 3: LEGAL & ASSET TRANSFER EXTENSIONS ============
    public BuyoutLegalReviewPackage? BuyoutLegalPackage { get; set; }
    public BuyoutAssetTransferManifest? BuyoutAssetManifest { get; set; }

    // ============ FULL BUYOUT PHASE 4: AGREEMENT SIGNING EXTENSIONS ============
    public BuyoutSigningPackage? BuyoutSigningPackage { get; set; }

    // ============ FULL BUYOUT PHASE 5: CLOSING & PAYMENT CONFIRMATION EXTENSIONS ============
    public BuyoutClosing? BuyoutClosing { get; set; }

    // ============ FULL BUYOUT PHASE 6: ASSET HANDOVER & FINAL SALE EXTENSIONS ============
    public BuyoutHandover? BuyoutHandover { get; set; }
    public BuyoutSaleRecord? BuyoutSaleRecord { get; set; }

    public long Version { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class DealCapTableDraft
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;
    public int TotalShares { get; set; } = 10_000_000;
    public List<DealCapTableEntry> Entries { get; set; } = new();
    public double EsopPoolPercent { get; set; } = 0;
    public double InvestorReservePercent { get; set; } = 0;
    public int EsopVestingMonths { get; set; } = 48;

    /// <summary>
    /// "AWAITING_CONFIRMATION" | "CREATOR_APPROVED" | "ENTREPRENEUR_APPROVED" | "APPROVED" | "CHANGES_REQUESTED"
    /// </summary>
    public string Status { get; set; } = "AWAITING_CONFIRMATION";

    public int Version { get; set; } = 1;

    public string? LastEditedByRole { get; set; }
    public string? LastEditedByUserId { get; set; }
    public string? Notes { get; set; }

    public DateTime? CreatorConfirmedAt { get; set; }
    public DateTime? EntrepreneurConfirmedAt { get; set; }
    public int CreatorConfirmedVersion { get; set; }
    public int EntrepreneurConfirmedVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class DealCapTableEntry
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string? UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string RoleTitle { get; set; } = string.Empty;
    public string StakeholderType { get; set; } = "founder"; // founder | creator | esop | investor_reserve | advisor
    public string ShareClass { get; set; } = "common";       // common | preferred | safe | note
    public bool HasVotingRights { get; set; } = true;
    public double EquityPercent { get; set; }
    public int SharesGranted { get; set; }
    public int VestingMonths { get; set; }
    public int CliffMonths { get; set; }
    public bool IsCreator { get; set; }
    public bool IsFounder { get; set; }
    public bool IsEsop { get; set; }
    public bool IsInvestorReserve { get; set; }
    public bool IsLocked { get; set; }
}

public class RoleResponsibilityAgreement
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;

    public string CreatorRole { get; set; } = string.Empty;
    public string EntrepreneurRole { get; set; } = "CEO";

    public List<string> CreatorResponsibilities { get; set; } = new();
    public List<string> EntrepreneurResponsibilities { get; set; } = new();

    public string CreatorTimeCommitment { get; set; } = string.Empty;
    public string EntrepreneurTimeCommitment { get; set; } = "Full-time";

    public string CreatorCommitmentType { get; set; } = "HOURS_PER_WEEK";
    public double? CreatorCommitmentValue { get; set; }

    public string EntrepreneurCommitmentType { get; set; } = "FULL_TIME";
    public double? EntrepreneurCommitmentValue { get; set; }

    public DateTime? CreatorConfirmedAt { get; set; }
    public DateTime? EntrepreneurConfirmedAt { get; set; }

    public int CreatorConfirmedVersion { get; set; }
    public int EntrepreneurConfirmedVersion { get; set; }

    /// <summary>
    /// "DRAFT" | "AWAITING_CONFIRMATION" | "CREATOR_CONFIRMED" | "ENTREPRENEUR_CONFIRMED" | "CONFIRMED" | "CHANGES_REQUESTED"
    /// </summary>
    public string Status { get; set; } = "DRAFT";

    public int Version { get; set; } = 1;

    public string? LastEditedByRole { get; set; }
    public string? LastEditedByUserId { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class EquityTerms
{
    public double EquityPercentage { get; set; }
    public string CreatorRole { get; set; } = string.Empty;
    public decimal? CashComponent { get; set; }
    public bool VestingEnabled { get; set; }
    public int VestingMonths { get; set; }
    public int CliffMonths { get; set; }
    public List<string> Responsibilities { get; set; } = new();
    public string TimeCommitment { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public string? Notes { get; set; }
}

public class BuyoutTerms
{
    public decimal PurchasePrice { get; set; }
    public int HandoverPeriodWeeks { get; set; } = 2;
    public int TransitionSupportWeeks { get; set; } = 4;
    public List<string> IncludedAssets { get; set; } = new();
    public DateTime? ExpiresAt { get; set; }
    public string? Notes { get; set; }
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

// One round in the offer/counter-offer thread (Phase D-4). Terms is a snapshot
// of the proposed economics for that round; the live/accepted terms remain on
// DealExecution.TermSheet.
public class TermSheetRevision
{
    public int RevisionNumber { get; set; }

    /// <summary>"founder" | "investor" | "entrepreneur" | "creator".</summary>
    public string ProposedByRole { get; set; } = string.Empty;

    /// <summary>Founder = ApplicationUser id; investor = catalogue InvestorId.</summary>
    public string ProposedByPrincipalId { get; set; } = string.Empty;

    public string OfferedByRole { get; set; } = string.Empty;
    public string OfferedByUserId { get; set; } = string.Empty;

    /// <summary>Whitelisted: "pending" | "sent" | "superseded" | "countered" | "accepted" | "rejected" | "expired".</summary>
    public string Status { get; set; } = "pending";

    /// <summary>Snapshot of proposed economics for this round.</summary>
    public TermSheet Terms { get; set; } = new();

    public EquityTerms? EquityTerms { get; set; }
    public BuyoutTerms? BuyoutTerms { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ViewedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

// Dual-party term-sheet signatures. The slot a caller writes is fixed by their
// role, so a founder can never sign the investor slot and vice versa.
public class DealSignatures
{
    public DateTime? FounderSignedAt { get; set; }
    public string FounderSignedByUserId { get; set; }
    public string FounderSignedDocumentId { get; set; }

    public DateTime? InvestorSignedAt { get; set; }
    public string InvestorSignedByInvestorId { get; set; }
    public string InvestorSignedDocumentId { get; set; }

    public bool BothSigned => FounderSignedAt.HasValue && InvestorSignedAt.HasValue;
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

public class LegalReviewPackage
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;

    public string? Jurisdiction { get; set; }
    public string CompanyContext { get; set; } = "CASE_A_PRE_INCORPORATION"; // CASE_A_PRE_INCORPORATION | CASE_B_EXISTING_COMPANY
    public string? CompanyId { get; set; }
    public string? CompanyName { get; set; }

    public List<LegalDocument> Documents { get; set; } = new();

    public string? AssignedLegalProviderId { get; set; }
    public string? AssignedLegalProviderName { get; set; }
    /// <summary>
    /// "NOT_ASSIGNED" | "ASSIGNED" | "IN_REVIEW" | "CHANGES_REQUESTED" | "REVIEW_COMPLETE"
    /// </summary>
    public string ProviderReviewStatus { get; set; } = "NOT_ASSIGNED";
    public int ProviderReviewedVersion { get; set; }
    public DateTime? ProviderReviewedAt { get; set; }
    public string? ProviderReviewNotes { get; set; }

    public int CreatorApprovedVersion { get; set; }
    public int EntrepreneurApprovedVersion { get; set; }
    public DateTime? CreatorApprovedAt { get; set; }
    public DateTime? EntrepreneurApprovedAt { get; set; }

    // Binding upstream source versions
    public int AcceptedOfferRevisionNumber { get; set; }
    public int RoleAgreementVersion { get; set; }
    public int CapTableVersion { get; set; }

    /// <summary>
    /// "AWAITING_REVIEW" | "IN_REVIEW" | "CHANGES_REQUESTED" | "CREATOR_APPROVED" | "ENTREPRENEUR_APPROVED" | "APPROVED"
    /// </summary>
    public string Status { get; set; } = "AWAITING_REVIEW";
    public int Version { get; set; } = 1;

    public string? LastEditedByRole { get; set; }
    public string? LastEditedByUserId { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class LegalDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DocumentType { get; set; } = "COFOUNDER_AGREEMENT"; // COFOUNDER_AGREEMENT | SHAREHOLDER_AGREEMENT | IP_CONTRIBUTION_AGREEMENT | VESTING_AGREEMENT | ARTICLES_AMENDMENT | NDA_REFERENCE
    public string Title { get; set; } = string.Empty;
    public string RequirementType { get; set; } = "REQUIRED"; // REQUIRED | CONDITIONAL | NOT_APPLICABLE
    public string ContentMarkdown { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty; // SHA-256
    public int Version { get; set; } = 1;
    public string Status { get; set; } = "DRAFT"; // DRAFT | IN_REVIEW | CHANGES_REQUESTED | REVIEWED
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class AgreementSigningPackage
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;

    public string LegalPackageId { get; set; } = string.Empty;
    public int LegalPackageVersion { get; set; }

    public int AcceptedOfferRevisionNumber { get; set; }
    public int RoleAgreementVersion { get; set; }
    public int CapTableVersion { get; set; }

    public string? Jurisdiction { get; set; }
    public string CompanyContext { get; set; } = "CASE_A_PRE_INCORPORATION";
    public string? CompanyId { get; set; }
    public string? CompanyName { get; set; }

    public List<SigningDocumentRef> Documents { get; set; } = new();

    public string ManifestHash { get; set; } = string.Empty; // SHA-256 of canonical serialized manifest

    public PartySignature? CreatorSignature { get; set; }
    public PartySignature? EntrepreneurSignature { get; set; }

    /// <summary>
    /// "PENDING_SIGNATURES" | "CREATOR_SIGNED" | "ENTREPRENEUR_SIGNED" | "AGREEMENT_SIGNED" | "INVALIDATED"
    /// </summary>
    public string Status { get; set; } = "PENDING_SIGNATURES";

    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinalizedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class SigningDocumentRef
{
    public string DocumentId { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string RequirementType { get; set; } = "REQUIRED"; // REQUIRED | CONDITIONAL | NOT_APPLICABLE
    public int DocumentVersion { get; set; } = 1;
    public string DocumentHash { get; set; } = string.Empty; // SHA-256
    public string ContentMarkdown { get; set; } = string.Empty;
}

public class PartySignature
{
    public string SignerUserId { get; set; } = string.Empty;
    public string SignerName { get; set; } = string.Empty;
    public string SignerRole { get; set; } = string.Empty; // "Creator" | "Entrepreneur"
    public string ManifestHash { get; set; } = string.Empty;
    public int LegalPackageVersion { get; set; }
    public DateTime SignedAt { get; set; } = DateTime.UtcNow;
    public string SignatureHash { get; set; } = string.Empty; // SHA-256
    public string? IpHash { get; set; }
    public string? UserAgentHash { get; set; }
    public string ConsentStatement { get; set; } = "I confirm that I have reviewed and agree to the documents listed in this signing package.";
}

// ============ PHASE 8: COMPANY & PROJECT ACTIVATION MODELS ============

public class PartnershipActivation
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;
    public string? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public string CompanyCase { get; set; } = "CASE_A_PRE_INCORPORATION"; // CASE_A_PRE_INCORPORATION | CASE_B_EXISTING_COMPANY
    /// <summary>
    /// "ACTIVATION_PENDING" | "COMPANY_SETUP" | "OWNERSHIP_RECORDING" | "DOCUMENT_LINKING" | "READY_TO_ACTIVATE" | "PARTNERSHIP_ACTIVE" | "FAILED"
    /// </summary>
    public string Status { get; set; } = "ACTIVATION_PENDING";
    public string SignedManifestHash { get; set; } = string.Empty;
    public int AppliedLegalPackageVersion { get; set; }
    public int AppliedOfferRevisionNumber { get; set; }
    public int AppliedRoleAgreementVersion { get; set; }
    public int AppliedCapTableVersion { get; set; }
    public string? CreatorShareholderId { get; set; }
    public string? EntrepreneurShareholderId { get; set; }
    public string CorporateFilingStatus { get; set; } = "NOT_REQUIRED"; // NOT_REQUIRED | EXTERNAL_FILING_PENDING | FILING_COMPLETE
    public string? CorporateFilingNotes { get; set; }
    public bool CanActivate { get; set; }
    public List<string> Blockers { get; set; } = new();
    public List<ActivatedDocumentRef> LinkedDocuments { get; set; } = new();
    public List<DealCapTableEntry> AppliedCapTableEntries { get; set; } = new();
    public List<DealCapTableEntry> PreviousCapTableEntries { get; set; } = new();
    public List<PartnershipMilestone> Milestones { get; set; } = new();
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ActivatedDocumentRef
{
    public string DocumentId { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int Version { get; set; }
    public string DocumentHash { get; set; } = string.Empty;
    public DateTime LinkedAt { get; set; } = DateTime.UtcNow;
}

// ============ PHASE 9: PARTNERSHIP ACTIVE & MILESTONE MODELS ============

public class PartnershipMilestone
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;
    public string? CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    /// <summary>
    /// "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
    /// </summary>
    public string Status { get; set; } = "NOT_STARTED";
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

// ============ FULL BUYOUT PHASE 3: LEGAL & ASSET TRANSFER MODELS ============

public class BuyoutLegalReviewPackage
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;

    public string? Jurisdiction { get; set; }
    public List<BuyoutLegalDocument> Documents { get; set; } = new();

    public string? AssignedLegalProviderId { get; set; }
    public string? AssignedLegalProviderName { get; set; }
    /// <summary>
    /// "NOT_ASSIGNED" | "ASSIGNED" | "IN_REVIEW" | "CHANGES_REQUESTED" | "REVIEW_COMPLETE"
    /// </summary>
    public string ProviderReviewStatus { get; set; } = "NOT_ASSIGNED";
    public DateTime? ProviderReviewedAt { get; set; }
    public string? ProviderReviewNotes { get; set; }
    public int ProviderReviewedVersion { get; set; }

    public int CreatorApprovedVersion { get; set; }
    public int EntrepreneurApprovedVersion { get; set; }
    public DateTime? CreatorApprovedAt { get; set; }
    public DateTime? EntrepreneurApprovedAt { get; set; }

    // Binding upstream source versions
    public int AcceptedBuyoutRevisionNumber { get; set; }
    public int AssetManifestVersion { get; set; }

    /// <summary>
    /// "AWAITING_REVIEW" | "IN_REVIEW" | "CHANGES_REQUESTED" | "CREATOR_APPROVED" | "ENTREPRENEUR_APPROVED" | "APPROVED"
    /// </summary>
    public string Status { get; set; } = "AWAITING_REVIEW";
    public int Version { get; set; } = 1;

    public string? LastEditedByRole { get; set; }
    public string? LastEditedByUserId { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class BuyoutLegalDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DocumentType { get; set; } = "ASSET_PURCHASE_AGREEMENT"; // ASSET_PURCHASE_AGREEMENT | IP_ASSIGNMENT_AGREEMENT | ASSET_TRANSFER_SCHEDULE | HANDOVER_TRANSITION_SCHEDULE | BRAND_TRANSFER_SCHEDULE | DOMAIN_TRANSFER_SCHEDULE | SOURCE_CODE_TRANSFER_SCHEDULE | DESIGN_ASSET_TRANSFER_SCHEDULE | BUSINESS_DOCUMENT_TRANSFER_SCHEDULE | TRANSITION_SUPPORT_AGREEMENT
    public string Title { get; set; } = string.Empty;
    public string RequirementType { get; set; } = "REQUIRED"; // REQUIRED | CONDITIONAL | NOT_APPLICABLE
    public string ContentMarkdown { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty; // SHA-256
    public int Version { get; set; } = 1;
    public string Status { get; set; } = "DRAFT"; // DRAFT | IN_REVIEW | CHANGES_REQUESTED | REVIEWED
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class BuyoutAssetTransferManifest
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;
    public int AcceptedRevisionNumber { get; set; }
    public decimal PurchasePrice { get; set; }
    public string Currency { get; set; } = "EUR";
    public int HandoverPeriodWeeks { get; set; }
    public int TransitionSupportWeeks { get; set; }
    public List<BuyoutAssetEntry> Assets { get; set; } = new();
    public int Version { get; set; } = 1;
    public string ManifestHash { get; set; } = string.Empty; // SHA-256
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class BuyoutAssetEntry
{
    public string AssetType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool TransferRequired { get; set; } = true;
    /// <summary>
    /// "AVAILABLE_IN_PLATFORM" | "EXTERNAL_TRANSFER_REQUIRED" | "MISSING" | "NOT_APPLICABLE"
    /// </summary>
    public string AvailabilityStatus { get; set; } = "AVAILABLE_IN_PLATFORM";
    public string? SourceReference { get; set; }
    public string? DocumentId { get; set; }
    public string? FileReference { get; set; }
    public bool ExternalTransferRequired { get; set; }
    public string? Notes { get; set; }
}

// ============ FULL BUYOUT PHASE 4: FINAL TRANSFER AGREEMENT SIGNING MODELS ============

public class BuyoutSigningPackage
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;
    public string DealType { get; set; } = "FULL_BUYOUT";

    public int AcceptedBuyoutRevisionNumber { get; set; }
    public string BuyoutLegalPackageId { get; set; } = string.Empty;
    public int BuyoutLegalPackageVersion { get; set; }

    public int AssetManifestVersion { get; set; }
    public string AssetManifestHash { get; set; } = string.Empty;

    public decimal PurchasePrice { get; set; }
    public string Currency { get; set; } = "EUR";
    public int HandoverPeriodWeeks { get; set; }
    public int TransitionSupportWeeks { get; set; }

    public List<SigningDocumentRef> Documents { get; set; } = new();

    public string ManifestHash { get; set; } = string.Empty; // SHA-256 of canonical serialized manifest

    public PartySignature? CreatorSignature { get; set; }
    public PartySignature? EntrepreneurSignature { get; set; }

    /// <summary>
    /// "PENDING_SIGNATURES" | "CREATOR_SIGNED" | "BUYER_SIGNED" | "AGREEMENT_SIGNED" | "INVALIDATED"
    /// </summary>
    public string Status { get; set; } = "PENDING_SIGNATURES";

    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinalizedAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// ============ FULL BUYOUT PHASE 5: CLOSING & PAYMENT CONFIRMATION MODELS ============

public class BuyoutClosing
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;
    public string DealType { get; set; } = "FULL_BUYOUT";

    public int AcceptedRevisionNumber { get; set; }
    public string SigningPackageId { get; set; } = string.Empty;
    public string ManifestHash { get; set; } = string.Empty;

    public decimal PurchasePrice { get; set; }
    public string Currency { get; set; } = "EUR";

    /// <summary>
    /// "BANK_TRANSFER" | "PAYMENT_PROVIDER" | "ESCROW" | "OTHER"
    /// </summary>
    public string PaymentMethod { get; set; } = "BANK_TRANSFER";

    /// <summary>
    /// "NOT_STARTED" | "PAYMENT_PENDING" | "PAYMENT_SUBMITTED" | "PAYMENT_VERIFICATION_PENDING" | "PAYMENT_CONFIRMED" | "PAYMENT_FAILED" | "PAYMENT_DISPUTED"
    /// </summary>
    public string PaymentStatus { get; set; } = "NOT_STARTED";

    public string? PaymentReference { get; set; }
    public decimal? PaymentAmount { get; set; }
    public string? PaymentCurrency { get; set; }
    public DateTime? PaidAt { get; set; }

    public DateTime? BuyerConfirmedAt { get; set; }
    public DateTime? CreatorConfirmedAt { get; set; }
    public DateTime? ProviderConfirmedAt { get; set; }

    public List<BuyoutPaymentEvidenceEntry> Evidence { get; set; } = new();

    /// <summary>
    /// "PENDING" | "PAYMENT_PENDING" | "PAYMENT_VERIFICATION" | "PAYMENT_CONFIRMED" | "READY_FOR_HANDOVER" | "BLOCKED" | "DISPUTED"
    /// </summary>
    public string ClosingStatus { get; set; } = "PENDING";

    public bool CanProceedToHandover { get; set; }
    public List<string> Blockers { get; set; } = new();

    public string? DisputeReason { get; set; }
    public DateTime? DisputedAt { get; set; }
    public string? DisputedByUserId { get; set; }

    public int Version { get; set; } = 1;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaymentCompletedAt { get; set; }
    public DateTime? ReadyForHandoverAt { get; set; }
}

public class BuyoutPaymentEvidenceEntry
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DocumentReference { get; set; } = string.Empty;
    public string DocumentName { get; set; } = string.Empty;
    public string UploadedByUserId { get; set; } = string.Empty;
    public string UploadedByRole { get; set; } = string.Empty; // "Buyer" | "Creator" | "Provider"
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? ContentHash { get; set; }
    public decimal? StatedAmount { get; set; }
    public string? StatedCurrency { get; set; }
    public string? Notes { get; set; }
}

// ============ FULL BUYOUT PHASE 6: ASSET HANDOVER & FINAL SALE MODELS ============

public class BuyoutHandover
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;
    public string DealType { get; set; } = "FULL_BUYOUT";

    public int AcceptedRevisionNumber { get; set; }
    public int AssetManifestVersion { get; set; } = 1;
    public string AssetManifestHash { get; set; } = string.Empty;
    public string SigningPackageId { get; set; } = string.Empty;
    public string ManifestHash { get; set; } = string.Empty;
    public string ClosingId { get; set; } = string.Empty;

    public List<BuyoutHandoverAsset> Assets { get; set; } = new();

    /// <summary>
    /// "NOT_STARTED" | "IN_PROGRESS" | "AWAITING_BUYER_CONFIRMATION" | "CHANGES_REQUESTED" | "COMPLETED" | "DISPUTED"
    /// </summary>
    public string Status { get; set; } = "NOT_STARTED";

    public bool CanCompleteSale { get; set; }
    public List<string> Blockers { get; set; } = new();

    public DateTime? SellerConfirmedAt { get; set; }
    public DateTime? BuyerConfirmedAt { get; set; }

    public int Version { get; set; } = 1;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}

public class BuyoutHandoverAsset
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string AssetId { get; set; } = string.Empty; // Unique key from Manifest
    public string AssetType { get; set; } = string.Empty; // Brand, Logo, Business Plan, Domain, Source Code, etc.
    public string DisplayName { get; set; } = string.Empty;
    public string DeliveryType { get; set; } = "AVAILABLE_IN_PLATFORM"; // AVAILABLE_IN_PLATFORM | EXTERNAL_TRANSFER_REQUIRED | DOCUMENT_EXPORT | CREDENTIAL_COORDINATION
    public bool IsRequired { get; set; } = true;

    /// <summary>
    /// "PENDING" | "DELIVERY_IN_PROGRESS" | "DELIVERED" | "VERIFICATION_PENDING" | "VERIFIED" | "ISSUE_REPORTED" | "BLOCKED"
    /// </summary>
    public string Status { get; set; } = "PENDING";

    public string? SourceReference { get; set; }
    public string? DeliveryReference { get; set; }
    public string? DeliveryInstructions { get; set; }

    public DateTime? SellerDeliveredAt { get; set; }
    public string? SellerDeliveredByUserId { get; set; }

    public DateTime? BuyerVerifiedAt { get; set; }
    public string? BuyerVerifiedByUserId { get; set; }

    public string? SellerNotes { get; set; }
    public string? BuyerNotes { get; set; }
    public string? IssueReason { get; set; }
    public DateTime? IssueReportedAt { get; set; }

    public List<BuyoutPaymentEvidenceEntry> Evidence { get; set; } = new();
    public int Version { get; set; } = 1;
}

public class BuyoutSaleRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DealId { get; set; } = string.Empty;
    public string IdeaId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;

    public string SellerUserId { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public string BuyerUserId { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;

    public decimal PurchasePrice { get; set; }
    public string Currency { get; set; } = "EUR";

    public int AcceptedRevisionNumber { get; set; }
    public string SigningPackageId { get; set; } = string.Empty;
    public string ManifestHash { get; set; } = string.Empty;
    public int AssetManifestVersion { get; set; } = 1;
    public string ClosingId { get; set; } = string.Empty;
    public string HandoverId { get; set; } = string.Empty;

    public DateTime SoldAt { get; set; } = DateTime.UtcNow;
    public List<string> TransferredAssets { get; set; } = new();

    /// <summary>
    /// "SOLD"
    /// </summary>
    public string Status { get; set; } = "SOLD";
    public string AuditReference { get; set; } = string.Empty;
}
