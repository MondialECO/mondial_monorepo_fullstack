using System;
using System.Collections.Generic;

namespace WebApp.Models.Dtos;

public class InvestorFinanceVerificationResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string InvestorId { get; set; } = string.Empty;
    public string Status { get; set; } = "not_started"; // not_started, draft, submitted, under_review, verified, needs_update, rejected
    public bool FinanceVerified { get; set; }
    public string InvestorType { get; set; } = string.Empty;
    public double DeclaredAvailableCapital { get; set; }
    public double MinTicket { get; set; }
    public double MaxTicket { get; set; }
    public string Currency { get; set; } = "EUR";
    public int DeploymentPeriodMonths { get; set; } = 12;
    public List<string> SourceOfFunds { get; set; } = new();
    public string SourceOfFundsExplanation { get; set; } = string.Empty;
    public List<InvestorFinanceDocumentDto> Documents { get; set; } = new();
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? DecisionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class InvestorFinanceDocumentDto
{
    public string DocumentId { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
    public string VerificationStatus { get; set; } = "pending";
    public string? ReviewNote { get; set; }
}

public class SaveFinanceDraftRequest
{
    public string? InvestorType { get; set; }
    public double? DeclaredAvailableCapital { get; set; }
    public double? MinTicket { get; set; }
    public double? MaxTicket { get; set; }
    public string? Currency { get; set; }
    public int? DeploymentPeriodMonths { get; set; }
    public List<string>? SourceOfFunds { get; set; }
    public string? SourceOfFundsExplanation { get; set; }
}

public class SubmitFinanceVerificationRequest
{
    public string InvestorType { get; set; } = string.Empty;
    public double DeclaredAvailableCapital { get; set; }
    public double MinTicket { get; set; }
    public double MaxTicket { get; set; }
    public string Currency { get; set; } = "EUR";
    public int DeploymentPeriodMonths { get; set; } = 12;
    public List<string> SourceOfFunds { get; set; } = new();
    public string SourceOfFundsExplanation { get; set; } = string.Empty;
    public bool DeclarationConfirmed { get; set; }
}

public class AdminFinanceDecisionRequest
{
    public string Action { get; set; } = string.Empty; // verify | needs_update | reject
    public string? DecisionReason { get; set; }
}

public class AdminFinanceVerificationListItem
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string InvestorId { get; set; } = string.Empty;
    public string InvestorName { get; set; } = string.Empty;
    public string InvestorEmail { get; set; } = string.Empty;
    public string InvestorType { get; set; } = string.Empty;
    public double DeclaredAvailableCapital { get; set; }
    public double MinTicket { get; set; }
    public double MaxTicket { get; set; }
    public string Currency { get; set; } = "EUR";
    public string Status { get; set; } = string.Empty;
    public int DocumentCount { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByUserId { get; set; }
    public string? DecisionReason { get; set; }
}
