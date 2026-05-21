using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services;

public interface IAiReviewEngine
{
    Task<AiReviewResponse> RunReviewAsync(Companies company);
}
