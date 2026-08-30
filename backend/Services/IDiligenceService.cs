using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.Dtos;

namespace WebApp.Services;

public interface IDiligenceService
{
    Task<DiligenceSummaryResponse> GetDiligenceSummaryAsync(string investorId, string companyId, string userId);
    Task<DiligenceReviewDto> UpdateDocumentReviewStatusAsync(string investorId, string companyId, string documentId, string status, string userId);
    Task<DiligenceNoteDto> AddPrivateNoteAsync(string investorId, string companyId, string? documentId, string content, string userId);
    Task<List<DiligenceNoteDto>> GetPrivateNotesAsync(string investorId, string companyId, string? documentId, string userId);
    Task<bool> DeletePrivateNoteAsync(string investorId, string companyId, string noteId, string userId);
    Task<DiligenceQuestionDto> AskFounderQuestionAsync(string investorId, string companyId, string? documentId, string? documentTitle, string question, string userId);
    Task<List<DiligenceQuestionDto>> GetDiligenceQuestionsAsync(string actorId, string companyId, bool isFounder, string? documentId = null);
    Task<DiligenceQuestionDto> AnswerFounderQuestionAsync(string companyId, string questionId, string response, string userId);
    Task<DiligenceSummaryResponse> CompleteDiligenceAsync(string investorId, string companyId, string userId);
    Task<DiligenceSummaryResponse> ReopenDiligenceAsync(string investorId, string companyId, string userId);
    Task<DiligenceSummaryResponse> UpdateChecklistOverrideAsync(string investorId, string companyId, string categoryKey, string status, string userId);
}
