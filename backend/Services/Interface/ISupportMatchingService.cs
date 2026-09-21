using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface ISupportMatchingService
    {
        Task<SupportEligibilityContext> BuildEligibilityContextAsync(string userId, CreatorJourney journey, ProfessionalProfileRecord? profile, Dictionary<string, string>? customFacts = null);
        Task<List<SupportMatch>> MatchOpportunitiesAsync(SupportEligibilityContext context, List<SupportOpportunity> candidates);
        List<MissingEligibilityFact> ExtractMissingEligibilityFacts(List<SupportMatch> matches, SupportEligibilityContext context);
        List<SupportApplicationChecklist> BuildApplicationChecklists(List<SupportMatch> matches, CreatorJourney journey);
        SupportPlanSummary ComputeSummary(List<SupportMatch> matches);
        List<SupportMatch> SelectTopMatches(List<SupportMatch> matches);
    }
}
