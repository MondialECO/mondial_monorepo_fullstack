using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;

namespace WebApp.Services.Interface
{
    public interface ICapabilityResolutionPolicy
    {
        CapabilityResolution ResolveNeed(CreatorNeed need, SkillsResolutionContext context);
        LearningAction GenerateLearningAction(CapabilityResolution resolution);
        DelegationRequirement GenerateDelegationRequirement(CapabilityResolution resolution);
        VerificationRequirement GenerateVerificationRequirement(CapabilityResolution resolution);
        CoveredCapability GenerateCoveredCapability(CapabilityResolution resolution);
    }
}
