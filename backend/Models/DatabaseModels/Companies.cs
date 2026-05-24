using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Twilio.Annotations;
using static System.Runtime.InteropServices.JavaScript.JSType;
using WebApp.Models.Dtos;

namespace WebApp.Models.DatabaseModels;

public class Companies
{
    [BsonId]
    public string Id { get; set; }

    public string OwnerId { get; set; }

    // Phase 1: Basic Info
    public string CompanyName { get; set; }
    public string Industry { get; set; }
    public string Website { get; set; }
    public string Tagline { get; set; }

    // Phase tracking - Entrepreneur phases start at 2; Universal Phase 1 is already complete
    public int CurrentPhase { get; set; } = 2;
    public List<int> CompletedPhases { get; set; } = new();
    public int TrustScore { get; set; } = 0;
    public bool IsInvestorReady { get; set; } = false;
    public DateTime? InvestorReadyBadgeAwardedAt { get; set; }

    // Phase 2: Legal Info & Documents
    public string LegalName { get; set; }
    public string RegistrationNumber { get; set; }
    public string LegalStructure { get; set; }
    public string IncorporationDate { get; set; }
    public string RegisteredAddress { get; set; }
    public string Country { get; set; }
    public string NafCode { get; set; }

    public LegalInfo Legal { get; set; }

    public string VerificationStatus { get; set; } = "pending"; // pending | in_review | verified | rejected
    public bool VerifiedBadge { get; set; } = false;

    public PhaseState Phase { get; set; } = new();

    public List<CompanyDocument> Documents { get; set; } = new();
    public List<DocumentStatusResponse> DocumentStatuses { get; set; } = new();
    public List<BeneficialOwner> BeneficialOwners { get; set; } = new();
    public List<BeneficialOwnerDto> BeneficialOwnersDto { get; set; } = new();

    // Phase 3: Financial
    public double? Q1Revenue { get; set; }
    public double? Q2Revenue { get; set; }
    public double? Q3Revenue { get; set; }
    public double? Q4Revenue { get; set; }
    public double? Valuation { get; set; }
    public double? CurrentFunds { get; set; }
    public double? MonthlyBurn { get; set; }

    // Phase 4: Equity Structure
    public List<EquityEntryDto> EquityStructure { get; set; } = new();
    public double? EsopPoolPercent { get; set; }
    public int? EsopVestingMonths { get; set; }
    public int? TotalShares { get; set; }

    // Phase 5: Funding Ask
    public double? FundingAskAmount { get; set; }
    public string FundingRoundType { get; set; }
    public double? PreMoneyValuation { get; set; }
    public string ShareType { get; set; }
    public List<CapitalAllocationDto> CapitalAllocation { get; set; } = new();
    public ResourceMapDto ResourceMap { get; set; }

    // Phase 5: Pitch & Outreach
    public string PitchDeckFileName { get; set; }
    public DateTime? PitchDeckUploadedAt { get; set; }
    public string FundingNarrative { get; set; }
    public string OutreachCampaignTemplate { get; set; }
    public List<string> OutreachInvestorList { get; set; } = new();
    public DateTime? OutreachCampaignStartedAt { get; set; }

    // Phase 6: Data Room
    public bool IsDataRoomLive { get; set; } = false;
    public bool IsDataRoomNdaRequired { get; set; } = true;
    public List<DataRoomDocumentResponse> DataRoomDocuments { get; set; } = new();
    public List<DataRoomAccessRecord> DataRoomAccessRecords { get; set; } = new();

    public DataRoomInfo DataRoom { get; set; } = new();

    // Phase 7: AI Review
    public AiReviewResponse AiReview { get; set; }
    public DateTime? LastAiReviewAt { get; set; }

    public AiReview AiReview_old { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class LegalInfo
{
    public string LegalName { get; set; }
    public string RegistrationSiret { get; set; }
    public string LegalStructure { get; set; }
    public string IncorporationDate { get; set; }
    public string RegisteredAddress { get; set; }
    public string Country { get; set; }
    public string NafCode { get; set; }
}


public class PhaseState
{
    public int Current { get; set; } = 1;

    public List<int> Completed { get; set; } = new();

    public List<PhaseHistory> History { get; set; } = new();
}

public class PhaseHistory
{
    public int Phase { get; set; }
    public DateTime CompletedAt { get; set; }
}

public class CompanyDocument
{
    public string DocType { get; set; } // kbis | rib | tax_cert | insurance

    public string S3Key { get; set; } // could be a presigned URL or a key to generate the presigned URL when needed
    public string FileName { get; set; }

    public string Status { get; set; } = "pending"; // pending | approved | rejected

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }

    public string ReviewNote { get; set; }
}

public class BeneficialOwner
{
    public string FullName { get; set; }
    public string Role { get; set; }
    public string Nationality { get; set; }
    public double OwnershipPercent { get; set; }
    public string KycStatus { get; set; } // pending | verified
    public string VerificationApplicantId { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class FinancialSummary
{
    public double TotalRevenue { get; set; }
    public double FinalValuation { get; set; }

    public double Mrr { get; set; }
    public double Arr { get; set; }
    public int RunwayMonths { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}

public class EquityStructure
{
    public int CapTableVersion { get; set; }
    public int TotalShares { get; set; }

    public bool IsFinalized { get; set; }

    public double EsopPoolPercent { get; set; }
    public int EsopVestingMonths { get; set; }

    public List<EquityEntry> Entries { get; set; } = new();

    public List<DilutionSimulation> DilutionSimulation { get; set; } = new();

    public string CapTablePdfS3Key { get; set; }
    public string CapTableXlsxS3Key { get; set; }

    public DateTime? FinalizedAt { get; set; }
}


public class EquityEntry
{
    public string StakeholderName { get; set; }
    public string Type { get; set; } // founder | investor | esop

    public int SharesOwned { get; set; }
    public double PercentFullyDiluted { get; set; }

    public int? VestingMonths { get; set; }

    public double? InvestmentAmount { get; set; }
}


public class DilutionSimulation
{
    public string Round { get; set; } // pre_seed | seed | series_a

    public double OwnershipAfter { get; set; }
    public double AmountRaised { get; set; }

    public double Valuation { get; set; }
}

public class FundingAsk
{
    public double RaiseAmount { get; set; }

    public string RoundType { get; set; } // pre_seed | seed | series_a

    public double EquityPercent { get; set; }

    public string ShareType { get; set; } // preferred | safe | note

    public double PreMoneyValuation { get; set; }
    public double PostMoneyValuation { get; set; }

    public double MinTicketSize { get; set; }

    public bool ProRataRights { get; set; }
    public string LiquidationPreference { get; set; }

    public bool BoardSeat { get; set; }

    public bool IsLive { get; set; }

    public List<CapitalAllocation> CapitalAllocation { get; set; } = new();

    public ResourceMap ResourceMap { get; set; }
}


public class CapitalAllocation
{
    public string Category { get; set; }

    public double Amount { get; set; }
    public double Percent { get; set; }
}

public class ResourceMap
{
    public List<HiringPlan> HiringPlan { get; set; } = new();

    public List<ServiceProviderRef> ServiceProviders { get; set; } = new();

    public List<TechTool> TechTools { get; set; } = new();
}


public class HiringPlan
{
    public string Role { get; set; }
    public double Salary { get; set; }

    public string Timeline { get; set; }
    public string Priority { get; set; }
}

public class ServiceProviderRef
{
    public string ProviderId { get; set; }
    public string Name { get; set; }

    public double EstimatedCost { get; set; }
}

public class TechTool
{
    public string Name { get; set; }
    public double MonthlyCost { get; set; }
}


public class DataRoomInfo
{
    public bool IsLive { get; set; } = false;

    public bool NdaRequired { get; set; } = true;

    public int AccessExpiresDays { get; set; } = 7;

    public List<DataRoomDocument> Documents { get; set; } = new();
}

public class DataRoomDocument
{
    public string Title { get; set; }

    public string S3Key { get; set; }

    public string Category { get; set; } // legal | financial | business

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public bool IsRequired { get; set; }
}


public class AiReview
{
    public int InvestorReadyScore { get; set; }

    public ScoreBreakdown ScoreBreakdown { get; set; }

    public bool InvestorReadyBadge { get; set; }

    public DateTime? BadgeAwardedAt { get; set; }

    public List<AiRecommendation> Recommendations { get; set; } = new();

    public string PitchHeadlineOriginal { get; set; }
    public string PitchHeadlineAI { get; set; }

    public DateTime? ReviewedAt { get; set; }
}


public class ScoreBreakdown
{
    public int Verification { get; set; }
    public int Financial { get; set; }
    public int Equity { get; set; }
    public int FundingAsk { get; set; }
    public int DataRoom { get; set; }
}

public class AiRecommendation
{
    public string Text { get; set; }
    public int PointValue { get; set; }
}




















public enum VerifiStatus
{
    Pending,
    InReview,
    Verified,
    Rejected
}

public enum CompanyDocumentType
{
    Kbis,
    Rib,
    TaxCert,
    Insurance,
    Other
}

public enum DocumentStatus
{
    Uploaded,
    Reviewing,
    Approved,
    Rejected
}