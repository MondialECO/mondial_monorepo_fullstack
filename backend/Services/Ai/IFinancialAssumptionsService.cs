using MongoDB.Bson;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;

namespace WebApp.Services.Ai
{
    public interface IFinancialAssumptionsService
    {
        Task<ForecastSession> GetOrCreateForecastSessionAsync(string businessIdeaId, string ownerUserId);
        Task<ForecastSession> UpdateFromMarketStudyAsync(string businessIdeaId, string ownerUserId, BsonDocument marketStudyContent, int marketStudyVersion);
        Task<ForecastSession> UpdateFromBusinessModelAsync(string businessIdeaId, string ownerUserId, BsonDocument businessModelContent, int businessModelVersion, string? marketStudySessionId = null);
        Task<ForecastSession> UpdateFounderAssumptionsAsync(string businessIdeaId, string ownerUserId, UpdateFinancialAssumptionsDto request);
    }
}
