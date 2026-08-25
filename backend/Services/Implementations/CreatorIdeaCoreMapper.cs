using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations
{
    /// <summary>
    /// Maps either Phase 2 entry path into the one persisted CreatorIdea.Project
    /// shape. This is a stateless adapter, not another stored idea representation.
    /// It only fills absent values so a creator's subsequent project edit wins.
    /// </summary>
    public static class CreatorIdeaCoreMapper
    {
        public static void ApplyClarifier(
            CreatorJourneyProject project, string problem, string targetUser, string solution,
            double clarityScore, List<string> tags, string marketGap, string creatorEdge,
            string existingAlternatives, string whyNow, string riskiestAssumption)
        {
            if (string.IsNullOrWhiteSpace(project.Problem) && !string.IsNullOrWhiteSpace(problem)) project.Problem = problem;
            if (string.IsNullOrWhiteSpace(project.TargetUser) && !string.IsNullOrWhiteSpace(targetUser)) project.TargetUser = targetUser;
            if (string.IsNullOrWhiteSpace(project.Solution) && !string.IsNullOrWhiteSpace(solution)) project.Solution = solution;
            if (project.ClarityScore <= 0) project.ClarityScore = clarityScore;
            if (string.IsNullOrWhiteSpace(project.MarketGap) && !string.IsNullOrWhiteSpace(marketGap)) project.MarketGap = marketGap;
            if (string.IsNullOrWhiteSpace(project.CreatorEdge) && !string.IsNullOrWhiteSpace(creatorEdge)) project.CreatorEdge = creatorEdge;
            if (string.IsNullOrWhiteSpace(project.ExistingAlternatives) && !string.IsNullOrWhiteSpace(existingAlternatives)) project.ExistingAlternatives = existingAlternatives;
            if (string.IsNullOrWhiteSpace(project.WhyNow) && !string.IsNullOrWhiteSpace(whyNow)) project.WhyNow = whyNow;
            if (string.IsNullOrWhiteSpace(project.RiskiestAssumption) && !string.IsNullOrWhiteSpace(riskiestAssumption)) project.RiskiestAssumption = riskiestAssumption;
            if ((project.Tags == null || project.Tags.Count == 0) && tags != null && tags.Count > 0) project.Tags = tags;
            if (string.IsNullOrWhiteSpace(project.SourceMethod)) project.SourceMethod = "clarifier";

            var conceptLine = !string.IsNullOrWhiteSpace(solution) ? solution : marketGap;
            if (string.IsNullOrWhiteSpace(project.Concept) && !string.IsNullOrWhiteSpace(conceptLine)) project.Concept = conceptLine;
        }

        public static void ApplyDiscovery(CreatorJourneyProject project, CreatorDiscoveryConcept concept)
        {
            if (string.IsNullOrWhiteSpace(project.Problem) && !string.IsNullOrWhiteSpace(concept.CoreProblem)) project.Problem = concept.CoreProblem;
            if (string.IsNullOrWhiteSpace(project.TargetUser) && !string.IsNullOrWhiteSpace(concept.TargetUser)) project.TargetUser = concept.TargetUser;
            if (string.IsNullOrWhiteSpace(project.Solution) && !string.IsNullOrWhiteSpace(concept.Solution)) project.Solution = concept.Solution;
            if (string.IsNullOrWhiteSpace(project.MarketGap) && !string.IsNullOrWhiteSpace(concept.MarketGap)) project.MarketGap = concept.MarketGap;
            if (string.IsNullOrWhiteSpace(project.CreatorEdge) && !string.IsNullOrWhiteSpace(concept.FounderEdge)) project.CreatorEdge = concept.FounderEdge;
            var conceptText = !string.IsNullOrWhiteSpace(concept.Concept) ? concept.Concept : concept.Description;
            if (string.IsNullOrWhiteSpace(project.Concept) && !string.IsNullOrWhiteSpace(conceptText)) project.Concept = conceptText;
            if (string.IsNullOrWhiteSpace(project.Category) && !string.IsNullOrWhiteSpace(concept.Category)) project.Category = concept.Category;
            if ((project.Tags == null || project.Tags.Count == 0) && !string.IsNullOrWhiteSpace(concept.Category)) project.Tags = new List<string> { concept.Category };
            if (project.ClarityScore <= 0) project.ClarityScore = concept.Score;
            if (string.IsNullOrWhiteSpace(project.SourceMethod)) project.SourceMethod = "discovery";
        }
    }
}
