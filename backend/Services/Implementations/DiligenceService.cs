using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

public class DiligenceService : IDiligenceService
{
    private readonly MongoDbContext _dbContext;
    private readonly ILogger<DiligenceService>? _logger;
    private readonly IServiceProvider? _serviceProvider;

    public DiligenceService(
        MongoDbContext dbContext,
        ILogger<DiligenceService>? logger = null,
        IServiceProvider? serviceProvider = null)
    {
        _dbContext = dbContext;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    private IPhaseNotificationService? GetNotificationService()
    {
        try
        {
            return _serviceProvider?.GetService(typeof(IPhaseNotificationService)) as IPhaseNotificationService;
        }
        catch
        {
            return null;
        }
    }

    private async Task<(Companies company, InvestorMatch? match, bool ndaOk)> ValidateAccessAndNdaAsync(string investorId, string companyId)
    {
        if (string.IsNullOrWhiteSpace(companyId))
            throw new ArgumentException("CompanyId is required");

        var company = await _dbContext.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Company {companyId} not found");

        InvestorMatch? match = null;
        if (!string.IsNullOrWhiteSpace(investorId))
        {
            match = await _dbContext.InvestorMatches
                .Find(m => m.CompanyId == companyId && m.InvestorId == investorId)
                .FirstOrDefaultAsync();
        }

        bool ndaRequired = company.IsDataRoomNdaRequired;

        bool ndaAccepted = false;
        if (!string.IsNullOrWhiteSpace(investorId))
        {
            var ndaRecord = await _dbContext.Phase6NdaAcceptances
                .Find(n => n.CompanyId == companyId && n.InvestorId == investorId)
                .FirstOrDefaultAsync();
            if (ndaRecord != null) ndaAccepted = true;
        }

        bool ndaOk = !ndaRequired || ndaAccepted;
        return (company, match, ndaOk);
    }

    public async Task<DiligenceSummaryResponse> GetDiligenceSummaryAsync(string investorId, string companyId, string userId)
    {
        var (company, match, ndaOk) = await ValidateAccessAndNdaAsync(investorId, companyId);

        var session = await _dbContext.InvestorDiligenceSessions
            .Find(s => s.CompanyId == companyId && s.InvestorId == investorId)
            .FirstOrDefaultAsync();

        var reviews = await _dbContext.InvestorDiligenceReviews
            .Find(r => r.CompanyId == companyId && r.InvestorId == investorId)
            .ToListAsync();

        var notes = await _dbContext.InvestorDiligenceNotes
            .Find(n => n.CompanyId == companyId && n.InvestorId == investorId)
            .ToListAsync();

        var questions = await _dbContext.InvestorDiligenceQuestions
            .Find(q => q.CompanyId == companyId && q.InvestorId == investorId)
            .SortByDescending(q => q.AskedAt)
            .ToListAsync();

        var documents = company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>();
        int totalDocs = documents.Count;
        var reviewMap = reviews.ToDictionary(r => r.DocumentId, r => r.Status);
        var notesCountMap = notes.Where(n => !string.IsNullOrWhiteSpace(n.DocumentId))
            .GroupBy(n => n.DocumentId!)
            .ToDictionary(g => g.Key, g => g.Count());

        int reviewedDocs = reviews.Count(r => r.Status == DiligenceReviewStatuses.Reviewed);
        int needsAttentionDocs = reviews.Count(r => r.Status == DiligenceReviewStatuses.NeedsAttention);
        int openQuestions = questions.Count(q => q.Status == DiligenceQuestionStatuses.Open);

        // Build dynamic checklist based on available document categories
        var categories = BuildChecklistCategories(documents, reviewMap, session?.ChecklistOverrides);

        int completedCategories = categories.Count(c => c.Status == "complete");
        int totalCategories = categories.Count;

        int percentComplete = totalCategories > 0
            ? (int)Math.Round((completedCategories / (double)totalCategories) * 100.0)
            : (totalDocs > 0 ? (int)Math.Round((reviewedDocs / (double)totalDocs) * 100.0) : 100);

        // Determine if diligence can be marked complete
        bool canComplete = true;
        string? blockedReason = null;

        if (!ndaOk)
        {
            canComplete = false;
            blockedReason = "NDA must be accepted to complete due diligence.";
        }
        else if (openQuestions > 0)
        {
            canComplete = false;
            blockedReason = $"There are {openQuestions} unresolved open questions.";
        }
        else if (needsAttentionDocs > 0)
        {
            canComplete = false;
            blockedReason = $"There are {needsAttentionDocs} documents flagged as 'Needs Attention'.";
        }
        else if (categories.Any(c => c.IsMandatory && c.Status == "not_started"))
        {
            var notStarted = categories.First(c => c.IsMandatory && c.Status == "not_started").Title;
            canComplete = false;
            blockedReason = $"Checklist item '{notStarted}' has not been started.";
        }

        var sessionStatus = session?.Status ?? (reviewedDocs > 0 || openQuestions > 0 ? DiligenceSessionStatuses.InProgress : DiligenceSessionStatuses.NotStarted);

        return new DiligenceSummaryResponse
        {
            CompanyId = companyId,
            InvestorId = investorId,
            Status = sessionStatus,
            PercentComplete = percentComplete,
            TotalDocuments = totalDocs,
            ReviewedDocuments = reviewedDocs,
            OpenQuestionsCount = openQuestions,
            NeedsAttentionCount = needsAttentionDocs,
            ChecklistCompletedCount = completedCategories,
            TotalChecklistCategories = totalCategories,
            CanComplete = canComplete,
            BlockedReason = blockedReason,
            NdaAccepted = ndaOk,
            NdaRequired = company.IsDataRoomNdaRequired,
            StartedAt = session?.StartedAt,
            CompletedAt = session?.CompletedAt,
            CompletedByUserId = session?.CompletedByUserId,
            Checklist = categories,
            Reviews = documents.Select(d => new DiligenceReviewDto
            {
                DocumentId = d.DocumentId,
                Status = reviewMap.TryGetValue(d.DocumentId, out var st) ? st : DiligenceReviewStatuses.NotReviewed,
                ReviewedAt = reviews.FirstOrDefault(r => r.DocumentId == d.DocumentId)?.ReviewedAt,
                ReviewedByUserId = reviews.FirstOrDefault(r => r.DocumentId == d.DocumentId)?.ReviewedByUserId,
                NotesCount = notesCountMap.TryGetValue(d.DocumentId, out var cnt) ? cnt : 0
            }).ToList(),
            Questions = questions.Select(q => new DiligenceQuestionDto
            {
                Id = q.Id,
                CompanyId = q.CompanyId,
                InvestorId = q.InvestorId,
                InvestorName = q.InvestorName,
                DocumentId = q.DocumentId,
                DocumentTitle = q.DocumentTitle,
                MatchId = q.MatchId,
                DealExecutionId = q.DealExecutionId,
                Question = q.Question,
                AskedByUserId = q.AskedByUserId,
                AskedAt = q.AskedAt,
                FounderResponse = q.FounderResponse,
                RespondedByUserId = q.RespondedByUserId,
                RespondedAt = q.RespondedAt,
                Status = q.Status
            }).ToList()
        };
    }

    private List<DiligenceChecklistItemDto> BuildChecklistCategories(
        List<DataRoomDocumentResponse> documents,
        Dictionary<string, string> reviewMap,
        Dictionary<string, string>? overrides)
    {
        var canonicalCategories = new (string key, string title, string[] matchKeywords)[]
        {
            ("overview", "Company Overview", new[] { "overview", "summary", "profile", "executive" }),
            ("pitch_deck", "Pitch Deck", new[] { "pitch", "deck", "presentation" }),
            ("business_plan", "Business Plan", new[] { "plan", "strategy", "roadmap" }),
            ("financials", "Financials & Forecasts", new[] { "financial", "finance", "forecast", "revenue", "model", "budget", "pnl", "balance" }),
            ("cap_table", "Cap Table & Equity", new[] { "cap table", "captable", "equity", "shareholder", "vesting" }),
            ("legal", "Legal & Incorporation", new[] { "legal", "incorporation", "articles", "bylaws", "certificate", "formation" }),
            ("traction", "Traction & KPIs", new[] { "traction", "kpi", "metrics", "analytics", "growth" }),
            ("contracts", "Material Contracts", new[] { "contract", "agreement", "customer", "vendor", "partner", "ip", "patent" }),
        };

        var result = new List<DiligenceChecklistItemDto>();

        foreach (var (key, title, keywords) in canonicalCategories)
        {
            // Find docs belonging to this category
            var matchingDocs = documents.Where(d =>
            {
                var cat = (d.Category ?? string.Empty).ToLowerInvariant();
                var name = (d.FileName ?? d.Title ?? string.Empty).ToLowerInvariant();
                return keywords.Any(k => cat.Contains(k) || name.Contains(k));
            }).ToList();

            // Check if company has data for this category even if no direct doc
            bool hasCategory = matchingDocs.Count > 0 || key == "overview" || key == "financials" || key == "cap_table";
            if (!hasCategory) continue;

            int total = matchingDocs.Count;
            int reviewed = matchingDocs.Count(d => reviewMap.TryGetValue(d.DocumentId, out var s) && s == DiligenceReviewStatuses.Reviewed);
            int needsAttention = matchingDocs.Count(d => reviewMap.TryGetValue(d.DocumentId, out var s) && s == DiligenceReviewStatuses.NeedsAttention);

            string autoStatus;
            if (total == 0)
            {
                autoStatus = "complete"; // Base data available in platform
            }
            else if (needsAttention > 0)
            {
                autoStatus = "needs_attention";
            }
            else if (reviewed == total)
            {
                autoStatus = "complete";
            }
            else if (reviewed > 0)
            {
                autoStatus = "in_review";
            }
            else
            {
                autoStatus = "not_started";
            }

            // Apply manual override if present
            string finalStatus = overrides != null && overrides.TryGetValue(key, out var ovr) && !string.IsNullOrWhiteSpace(ovr)
                ? ovr
                : autoStatus;

            result.Add(new DiligenceChecklistItemDto
            {
                CategoryKey = key,
                Title = title,
                Status = finalStatus,
                TotalDocuments = total,
                ReviewedDocuments = reviewed,
                NeedsAttentionDocuments = needsAttention,
                IsMandatory = true
            });
        }

        return result;
    }

    public async Task<DiligenceReviewDto> UpdateDocumentReviewStatusAsync(string investorId, string companyId, string documentId, string status, string userId)
    {
        var (company, match, ndaOk) = await ValidateAccessAndNdaAsync(investorId, companyId);
        if (!ndaOk)
            throw new UnauthorizedAccessException("NDA must be signed before accessing or reviewing Data Room documents.");

        var docExists = (company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>()).Any(d => d.DocumentId == documentId);
        if (!docExists)
            throw new KeyNotFoundException($"Document {documentId} not found in company data room");

        var normalizedStatus = status.ToLowerInvariant();
        if (normalizedStatus != DiligenceReviewStatuses.NotReviewed
            && normalizedStatus != DiligenceReviewStatuses.Reviewed
            && normalizedStatus != DiligenceReviewStatuses.NeedsAttention)
        {
            throw new ArgumentException("Invalid review status");
        }

        var review = await _dbContext.InvestorDiligenceReviews
            .Find(r => r.CompanyId == companyId && r.InvestorId == investorId && r.DocumentId == documentId)
            .FirstOrDefaultAsync();

        if (review == null)
        {
            review = new InvestorDiligenceReview
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                InvestorId = investorId,
                DocumentId = documentId,
                Status = normalizedStatus,
                ReviewedByUserId = userId,
                ReviewedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbContext.InvestorDiligenceReviews.InsertOneAsync(review);
        }
        else
        {
            review.Status = normalizedStatus;
            review.ReviewedByUserId = userId;
            review.ReviewedAt = DateTime.UtcNow;
            review.UpdatedAt = DateTime.UtcNow;
            await _dbContext.InvestorDiligenceReviews.ReplaceOneAsync(r => r.Id == review.Id, review);
        }

        await EnsureSessionInProgressAsync(investorId, companyId, userId, match?.Id);

        var notesCount = await _dbContext.InvestorDiligenceNotes
            .CountDocumentsAsync(n => n.CompanyId == companyId && n.InvestorId == investorId && n.DocumentId == documentId);

        return new DiligenceReviewDto
        {
            DocumentId = documentId,
            Status = review.Status,
            ReviewedAt = review.ReviewedAt,
            ReviewedByUserId = review.ReviewedByUserId,
            NotesCount = (int)notesCount
        };
    }

    private async Task EnsureSessionInProgressAsync(string investorId, string companyId, string userId, string? matchId)
    {
        var session = await _dbContext.InvestorDiligenceSessions
            .Find(s => s.CompanyId == companyId && s.InvestorId == investorId)
            .FirstOrDefaultAsync();

        if (session == null)
        {
            session = new InvestorDiligenceSession
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                InvestorId = investorId,
                InvestorUserId = userId,
                MatchId = matchId,
                Status = DiligenceSessionStatuses.InProgress,
                StartedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbContext.InvestorDiligenceSessions.InsertOneAsync(session);
        }
        else if (session.Status == DiligenceSessionStatuses.NotStarted)
        {
            session.Status = DiligenceSessionStatuses.InProgress;
            session.StartedAt ??= DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;
            await _dbContext.InvestorDiligenceSessions.ReplaceOneAsync(s => s.Id == session.Id, session);
        }
    }

    public async Task<DiligenceNoteDto> AddPrivateNoteAsync(string investorId, string companyId, string? documentId, string content, string userId)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Note content cannot be empty");

        var (company, match, ndaOk) = await ValidateAccessAndNdaAsync(investorId, companyId);
        if (!ndaOk)
            throw new UnauthorizedAccessException("NDA must be signed before creating diligence notes.");

        if (!string.IsNullOrWhiteSpace(documentId))
        {
            var docExists = (company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>()).Any(d => d.DocumentId == documentId);
            if (!docExists)
                throw new KeyNotFoundException($"Document {documentId} not found in company data room");
        }

        var note = new InvestorDiligenceNote
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            InvestorId = investorId,
            DocumentId = documentId,
            Content = content.Trim(),
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dbContext.InvestorDiligenceNotes.InsertOneAsync(note);
        await EnsureSessionInProgressAsync(investorId, companyId, userId, match?.Id);

        return new DiligenceNoteDto
        {
            Id = note.Id,
            InvestorId = note.InvestorId,
            CompanyId = note.CompanyId,
            DocumentId = note.DocumentId,
            Content = note.Content,
            CreatedByUserId = note.CreatedByUserId,
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        };
    }

    public async Task<List<DiligenceNoteDto>> GetPrivateNotesAsync(string investorId, string companyId, string? documentId, string userId)
    {
        var (company, match, ndaOk) = await ValidateAccessAndNdaAsync(investorId, companyId);
        if (!ndaOk)
            throw new UnauthorizedAccessException("NDA must be signed to view diligence notes.");

        var filterBuilder = Builders<InvestorDiligenceNote>.Filter;
        var filter = filterBuilder.Eq(n => n.CompanyId, companyId) & filterBuilder.Eq(n => n.InvestorId, investorId);

        if (!string.IsNullOrWhiteSpace(documentId))
        {
            filter &= filterBuilder.Eq(n => n.DocumentId, documentId);
        }

        var notes = await _dbContext.InvestorDiligenceNotes
            .Find(filter)
            .SortByDescending(n => n.CreatedAt)
            .ToListAsync();

        return notes.Select(n => new DiligenceNoteDto
        {
            Id = n.Id,
            InvestorId = n.InvestorId,
            CompanyId = n.CompanyId,
            DocumentId = n.DocumentId,
            Content = n.Content,
            CreatedByUserId = n.CreatedByUserId,
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt
        }).ToList();
    }

    public async Task<bool> DeletePrivateNoteAsync(string investorId, string companyId, string noteId, string userId)
    {
        var note = await _dbContext.InvestorDiligenceNotes
            .Find(n => n.Id == noteId && n.CompanyId == companyId && n.InvestorId == investorId)
            .FirstOrDefaultAsync();

        if (note == null) return false;

        var result = await _dbContext.InvestorDiligenceNotes.DeleteOneAsync(n => n.Id == noteId);
        return result.DeletedCount > 0;
    }

    public async Task<DiligenceQuestionDto> AskFounderQuestionAsync(string investorId, string companyId, string? documentId, string? documentTitle, string question, string userId)
    {
        if (string.IsNullOrWhiteSpace(question))
            throw new ArgumentException("Question cannot be empty");

        var (company, match, ndaOk) = await ValidateAccessAndNdaAsync(investorId, companyId);
        if (!ndaOk)
            throw new UnauthorizedAccessException("NDA must be signed to submit diligence questions.");

        string resolvedDocTitle = documentTitle ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(documentId))
        {
            var doc = (company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>()).FirstOrDefault(d => d.DocumentId == documentId);
            if (doc != null && string.IsNullOrWhiteSpace(resolvedDocTitle))
            {
                resolvedDocTitle = doc.Title ?? doc.FileName ?? "Document";
            }
        }

        var investor = await _dbContext.Investors.Find(i => i.Id == investorId).FirstOrDefaultAsync();
        var investorName = investor?.Name ?? "Investor";

        var questionDoc = new InvestorDiligenceQuestion
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            InvestorId = investorId,
            InvestorName = investorName,
            DocumentId = documentId,
            DocumentTitle = string.IsNullOrWhiteSpace(resolvedDocTitle) ? "General Diligence" : resolvedDocTitle,
            MatchId = match?.Id,
            Question = question.Trim(),
            AskedByUserId = userId,
            AskedAt = DateTime.UtcNow,
            Status = DiligenceQuestionStatuses.Open,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dbContext.InvestorDiligenceQuestions.InsertOneAsync(questionDoc);
        await EnsureSessionInProgressAsync(investorId, companyId, userId, match?.Id);

        // Notify founder
        var notif = GetNotificationService();
        if (notif != null)
        {
            await notif.NotifyDiligenceQuestionAskedAsync(
                companyId,
                investorName,
                questionDoc.DocumentTitle,
                questionDoc.Question);
        }

        return new DiligenceQuestionDto
        {
            Id = questionDoc.Id,
            CompanyId = questionDoc.CompanyId,
            InvestorId = questionDoc.InvestorId,
            InvestorName = questionDoc.InvestorName,
            DocumentId = questionDoc.DocumentId,
            DocumentTitle = questionDoc.DocumentTitle,
            MatchId = questionDoc.MatchId,
            Question = questionDoc.Question,
            AskedByUserId = questionDoc.AskedByUserId,
            AskedAt = questionDoc.AskedAt,
            Status = questionDoc.Status
        };
    }

    public async Task<List<DiligenceQuestionDto>> GetDiligenceQuestionsAsync(string actorId, string companyId, bool isFounder, string? documentId = null)
    {
        var company = await _dbContext.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Company {companyId} not found");

        var filterBuilder = Builders<InvestorDiligenceQuestion>.Filter;
        var filter = filterBuilder.Eq(q => q.CompanyId, companyId);

        if (!isFounder)
        {
            // Investor sees only their own questions
            filter &= filterBuilder.Eq(q => q.InvestorId, actorId);
        }

        if (!string.IsNullOrWhiteSpace(documentId))
        {
            filter &= filterBuilder.Eq(q => q.DocumentId, documentId);
        }

        var questions = await _dbContext.InvestorDiligenceQuestions
            .Find(filter)
            .SortByDescending(q => q.AskedAt)
            .ToListAsync();

        return questions.Select(q => new DiligenceQuestionDto
        {
            Id = q.Id,
            CompanyId = q.CompanyId,
            InvestorId = q.InvestorId,
            InvestorName = q.InvestorName,
            DocumentId = q.DocumentId,
            DocumentTitle = q.DocumentTitle,
            MatchId = q.MatchId,
            DealExecutionId = q.DealExecutionId,
            Question = q.Question,
            AskedByUserId = q.AskedByUserId,
            AskedAt = q.AskedAt,
            FounderResponse = q.FounderResponse,
            RespondedByUserId = q.RespondedByUserId,
            RespondedAt = q.RespondedAt,
            Status = q.Status
        }).ToList();
    }

    public async Task<DiligenceQuestionDto> AnswerFounderQuestionAsync(string companyId, string questionId, string response, string userId)
    {
        if (string.IsNullOrWhiteSpace(response))
            throw new ArgumentException("Response cannot be empty");

        var company = await _dbContext.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Company {companyId} not found");

        // Validate founder ownership
        if (!string.Equals(company.OwnerId, userId, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Only the company owner can answer diligence questions.");
        }

        var question = await _dbContext.InvestorDiligenceQuestions
            .Find(q => q.Id == questionId && q.CompanyId == companyId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Question {questionId} not found");

        question.FounderResponse = response.Trim();
        question.RespondedByUserId = userId;
        question.RespondedAt = DateTime.UtcNow;
        question.Status = DiligenceQuestionStatuses.Answered;
        question.UpdatedAt = DateTime.UtcNow;

        await _dbContext.InvestorDiligenceQuestions.ReplaceOneAsync(q => q.Id == question.Id, question);

        // Notify investor
        var notif = GetNotificationService();
        if (notif != null)
        {
            await notif.NotifyDiligenceQuestionAnsweredAsync(
                question.InvestorId,
                company.CompanyName,
                question.DocumentTitle ?? "Data Room Document",
                question.FounderResponse);
        }

        return new DiligenceQuestionDto
        {
            Id = question.Id,
            CompanyId = question.CompanyId,
            InvestorId = question.InvestorId,
            InvestorName = question.InvestorName,
            DocumentId = question.DocumentId,
            DocumentTitle = question.DocumentTitle,
            MatchId = question.MatchId,
            DealExecutionId = question.DealExecutionId,
            Question = question.Question,
            AskedByUserId = question.AskedByUserId,
            AskedAt = question.AskedAt,
            FounderResponse = question.FounderResponse,
            RespondedByUserId = question.RespondedByUserId,
            RespondedAt = question.RespondedAt,
            Status = question.Status
        };
    }

    public async Task<DiligenceSummaryResponse> CompleteDiligenceAsync(string investorId, string companyId, string userId)
    {
        var summary = await GetDiligenceSummaryAsync(investorId, companyId, userId);
        if (!summary.CanComplete)
        {
            throw new InvalidOperationException($"Cannot complete due diligence: {summary.BlockedReason}");
        }

        var session = await _dbContext.InvestorDiligenceSessions
            .Find(s => s.CompanyId == companyId && s.InvestorId == investorId)
            .FirstOrDefaultAsync();

        if (session == null)
        {
            session = new InvestorDiligenceSession
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                InvestorId = investorId,
                InvestorUserId = userId,
                Status = DiligenceSessionStatuses.Completed,
                StartedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                CompletedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbContext.InvestorDiligenceSessions.InsertOneAsync(session);
        }
        else
        {
            session.Status = DiligenceSessionStatuses.Completed;
            session.CompletedAt = DateTime.UtcNow;
            session.CompletedByUserId = userId;
            session.UpdatedAt = DateTime.UtcNow;
            await _dbContext.InvestorDiligenceSessions.ReplaceOneAsync(s => s.Id == session.Id, session);
        }

        return await GetDiligenceSummaryAsync(investorId, companyId, userId);
    }

    public async Task<DiligenceSummaryResponse> ReopenDiligenceAsync(string investorId, string companyId, string userId)
    {
        var session = await _dbContext.InvestorDiligenceSessions
            .Find(s => s.CompanyId == companyId && s.InvestorId == investorId)
            .FirstOrDefaultAsync();

        if (session != null)
        {
            session.Status = DiligenceSessionStatuses.InProgress;
            session.CompletedAt = null;
            session.CompletedByUserId = null;
            session.UpdatedAt = DateTime.UtcNow;
            await _dbContext.InvestorDiligenceSessions.ReplaceOneAsync(s => s.Id == session.Id, session);
        }

        return await GetDiligenceSummaryAsync(investorId, companyId, userId);
    }

    public async Task<DiligenceSummaryResponse> UpdateChecklistOverrideAsync(string investorId, string companyId, string categoryKey, string status, string userId)
    {
        var (company, match, ndaOk) = await ValidateAccessAndNdaAsync(investorId, companyId);
        if (!ndaOk)
            throw new UnauthorizedAccessException("NDA must be signed to update checklist items.");

        var session = await _dbContext.InvestorDiligenceSessions
            .Find(s => s.CompanyId == companyId && s.InvestorId == investorId)
            .FirstOrDefaultAsync();

        if (session == null)
        {
            session = new InvestorDiligenceSession
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                InvestorId = investorId,
                InvestorUserId = userId,
                Status = DiligenceSessionStatuses.InProgress,
                StartedAt = DateTime.UtcNow,
                ChecklistOverrides = new Dictionary<string, string> { { categoryKey, status } },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbContext.InvestorDiligenceSessions.InsertOneAsync(session);
        }
        else
        {
            session.ChecklistOverrides[categoryKey] = status;
            session.UpdatedAt = DateTime.UtcNow;
            await _dbContext.InvestorDiligenceSessions.ReplaceOneAsync(s => s.Id == session.Id, session);
        }

        return await GetDiligenceSummaryAsync(investorId, companyId, userId);
    }
}
