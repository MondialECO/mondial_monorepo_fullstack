using System.Collections.Generic;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface
{
    public class CapabilityMatchResult
    {
        public bool IsMatched { get; set; }
        public string Status { get; set; } = "Missing"; // Ready, Partial, NeedsReview, Missing
        public string Reason { get; set; } = string.Empty;
        public ProfileSkill? MatchedSkill { get; set; }
        public string MatchedCapabilityGroup { get; set; } = string.Empty;
    }

    public interface ICapabilityMatcher
    {
        CapabilityMatchResult MatchCapability(string requiredCapability, IEnumerable<ProfileSkill> declaredSkills);
        string NormalizeCapability(string input);
        bool BelongsToTaxonomy(string skillName, string targetCategory);
    }
}
