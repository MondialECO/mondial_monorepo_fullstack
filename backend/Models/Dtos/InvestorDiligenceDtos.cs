using System;
using System.Collections.Generic;

namespace WebApp.Models.Dtos;

public class DiligenceChecklistItemDto
{
    public string CategoryKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "not_started"; // "not_started" | "in_review" | "complete" | "needs_attention"
    public int TotalDocuments { get; set; }
    public int ReviewedDocuments { get; set; }
    public int NeedsAttentionDocuments { get; set; }
    public bool IsMandatory { get; set; } = true;
}

public class DiligenceReviewDto
{
    public string DocumentId { get; set; } = string.Empty;
    public string Status { get; set; } = "not_reviewed"; // "not_reviewed" | "reviewed" | "needs_attention"
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByUserId { get; set; }
    public int NotesCount { get; set; }
}

public class DiligenceNoteDto
{
    public string Id { get; set; } = string.Empty;
    public string InvestorId { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public string? DocumentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DiligenceQuestionDto
{
    public string Id { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public string InvestorId { get; set; } = string.Empty;
    public string? InvestorName { get; set; }
    public string? DocumentId { get; set; }
    public string? DocumentTitle { get; set; }
    public string? MatchId { get; set; }
    public string? DealExecutionId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string AskedByUserId { get; set; } = string.Empty;
    public DateTime AskedAt { get; set; }
    public string? FounderResponse { get; set; }
    public string? RespondedByUserId { get; set; }
    public DateTime? RespondedAt { get; set; }
    public string Status { get; set; } = "open"; // "open" | "answered" | "closed"
}

public class DiligenceSummaryResponse
{
    public string CompanyId { get; set; } = string.Empty;
    public string InvestorId { get; set; } = string.Empty;
    public string Status { get; set; } = "not_started"; // "not_started" | "in_progress" | "completed"
    public int PercentComplete { get; set; }
    public int TotalDocuments { get; set; }
    public int ReviewedDocuments { get; set; }
    public int OpenQuestionsCount { get; set; }
    public int NeedsAttentionCount { get; set; }
    public int ChecklistCompletedCount { get; set; }
    public int TotalChecklistCategories { get; set; }
    public bool CanComplete { get; set; }
    public string? BlockedReason { get; set; }
    public bool NdaAccepted { get; set; }
    public bool NdaRequired { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedByUserId { get; set; }
    public List<DiligenceChecklistItemDto> Checklist { get; set; } = new();
    public List<DiligenceReviewDto> Reviews { get; set; } = new();
    public List<DiligenceQuestionDto> Questions { get; set; } = new();
}

public class UpdateDocumentReviewRequest
{
    public string Status { get; set; } = "reviewed"; // "not_reviewed" | "reviewed" | "needs_attention"
}

public class CreateDiligenceNoteRequest
{
    public string? DocumentId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class AskDiligenceQuestionRequest
{
    public string? DocumentId { get; set; }
    public string? DocumentTitle { get; set; }
    public string Question { get; set; } = string.Empty;
}

public class AnswerDiligenceQuestionRequest
{
    public string Response { get; set; } = string.Empty;
}

public class UpdateChecklistOverrideRequest
{
    public string CategoryKey { get; set; } = string.Empty;
    public string Status { get; set; } = "complete"; // "not_started" | "in_review" | "complete" | "needs_attention"
}
