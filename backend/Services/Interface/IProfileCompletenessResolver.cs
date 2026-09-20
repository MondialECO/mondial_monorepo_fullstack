using System.Collections.Generic;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface;

public record ProfileCompletenessResult(
    int ProfileCompletion,
    bool Phase4Ready,
    List<string> MissingForPhase4
);

public interface IProfileCompletenessResolver
{
    ProfileCompletenessResult Resolve(ProfessionalProfileRecord? profile);
}
