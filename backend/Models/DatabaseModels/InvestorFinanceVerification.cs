using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

[BsonIgnoreExtraElements]
public class InvestorFinanceVerification
{
    [BsonId]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string UserId { get; set; } = string.Empty;
    public string InvestorId { get; set; } = string.Empty;

    // Status: draft, submitted, under_review, verified, needs_update, rejected
    public string Status { get; set; } = "draft";

    // Step 1: Investor Profile
    public string InvestorType { get; set; } = string.Empty; // angel | seed_fund | vc | corporate | family_office | syndicate | other

    // Step 2: Investment Capacity
    public double DeclaredAvailableCapital { get; set; }
    public double MinTicket { get; set; }
    public double MaxTicket { get; set; }
    public string Currency { get; set; } = "EUR";
    public int DeploymentPeriodMonths { get; set; } = 12;

    // Step 3: Source of Funds
    public List<string> SourceOfFunds { get; set; } = new();
    public string SourceOfFundsExplanation { get; set; } = string.Empty;

    // Step 4: Supporting Evidence Documents
    public List<InvestorFinanceDocument> Documents { get; set; } = new();

    // Review & Timestamps
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewStartedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByUserId { get; set; }
    public string? DecisionReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class InvestorFinanceDocument
{
    public string DocumentId { get; set; } = Guid.NewGuid().ToString("N");
    public string InvestorId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty; // bank_statement, proof_of_funds_letter, investment_account_statement, etc.
    public string OriginalFilename { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string MimeType { get; set; } = "application/pdf";
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string VerificationStatus { get; set; } = "pending"; // pending, verified, rejected
    public string? ReviewNote { get; set; }
}
