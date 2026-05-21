using WebApp.Models.DatabaseModels;

namespace WebApp.Services;

public interface IPhaseValidator
{
    Task<(bool IsValid, List<string> Errors)> ValidatePhase1Async(Companies company);
    Task<(bool IsValid, List<string> Errors)> ValidatePhase2Async(Companies company);
    Task<(bool IsValid, List<string> Errors)> ValidatePhase3Async(Companies company);
    Task<(bool IsValid, List<string> Errors)> ValidatePhase4Async(Companies company);
    Task<(bool IsValid, List<string> Errors)> ValidatePhase5Async(Companies company);
    Task<(bool IsValid, List<string> Errors)> ValidatePhase6Async(Companies company);
    Task<(bool IsValid, List<string> Errors)> ValidatePhase7Async(Companies company);
    Task<(bool IsValid, List<string> Errors)> ValidatePhase8Async(Companies company);
    Task<(bool IsValid, List<string> Errors)> ValidatePhase9Async(Companies company);
}
