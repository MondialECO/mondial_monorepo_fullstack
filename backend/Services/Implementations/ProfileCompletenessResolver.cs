using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

public class ProfileCompletenessResolver : IProfileCompletenessResolver
{
    public const string KeySkills = "Skills";
    public const string KeyCurrentSituation = "CurrentSituation";
    public const string KeyWeeklyAvailability = "WeeklyAvailability";
    public const string KeyRegion = "Region";
    public const string KeyProgressPreference = "ProgressPreference";

    public ProfileCompletenessResult Resolve(ProfessionalProfileRecord? profile)
    {
        var missing = new List<string>();

        bool hasSkills = (profile?.Skills?.Count ?? 0) > 0;
        bool hasSituation = !string.IsNullOrWhiteSpace(profile?.VentureContext?.CurrentSituation);
        bool hasAvailability = !string.IsNullOrWhiteSpace(profile?.VentureContext?.WeeklyAvailability);
        bool hasRegion = !string.IsNullOrWhiteSpace(profile?.VentureContext?.Region);
        bool hasPreference = !string.IsNullOrWhiteSpace(profile?.VentureContext?.LearningPreference)
            || !string.IsNullOrWhiteSpace(profile?.VentureContext?.DelegationPreference);

        if (!hasSkills) missing.Add(KeySkills);
        if (!hasSituation) missing.Add(KeyCurrentSituation);
        if (!hasAvailability) missing.Add(KeyWeeklyAvailability);
        if (!hasRegion) missing.Add(KeyRegion);
        if (!hasPreference) missing.Add(KeyProgressPreference);

        bool phase4Ready = missing.Count == 0;

        // Profile Completion (0–100%)
        int completion = 0;
        if (hasSkills) completion += 20;
        if (hasSituation) completion += 15;
        if (hasAvailability) completion += 15;
        if (hasRegion) completion += 10;
        if (hasPreference) completion += 15;
        if (!string.IsNullOrWhiteSpace(profile?.VentureContext?.PreviousEntrepreneurialExperience)) completion += 10;

        if ((profile?.Experiences?.Count ?? 0) > 0) completion += 5;
        if ((profile?.Education?.Count ?? 0) > 0) completion += 5;
        if ((profile?.LanguageProficiencies?.Count ?? 0) > 0 || (profile?.Languages?.Count ?? 0) > 0) completion += 5;

        completion = Math.Min(100, completion);

        return new ProfileCompletenessResult(
            ProfileCompletion: completion,
            Phase4Ready: phase4Ready,
            MissingForPhase4: missing
        );
    }
}
