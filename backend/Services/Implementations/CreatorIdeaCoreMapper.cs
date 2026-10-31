using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations
{
    /// <summary>
    /// Maps either Phase 2 entry path into the one persisted CreatorIdea.Project
    /// shape. This is a stateless adapter, not another stored idea representation.
    /// </summary>
    public static class CreatorIdeaCoreMapper
    {
        /// <summary>
        /// A C-2 finalize is authoritative for the clarifier-owned fields: each is overwritten with the
        /// new summary (so a re-run after "Fix it" really updates the Idea Core), except a field the
        /// Creator edited by hand (provenance "user_edited"). An empty value from the summary keeps the
        /// current one rather than wiping it. ClarityScore always follows the new summary.
        /// Legacy projects (no provenance) are treated as clarifier-owned.
        /// </summary>
        public static void ApplyClarifier(
            CreatorJourneyProject project, string problem, string targetUser, string solution,
            double clarityScore, List<string> tags, string marketGap, string creatorEdge,
            string existingAlternatives, string whyNow, string riskiestAssumption)
        {
            void Write(string field, string? value, Action<string> set)
            {
                if (string.IsNullOrWhiteSpace(value) || ProjectFieldProvenance.IsUserEdited(project, field))
                    return;
                set(value);
                MarkClarifier(project, field);
            }

            Write(ProjectFieldProvenance.Problem, problem, v => project.Problem = v);
            Write(ProjectFieldProvenance.TargetUser, targetUser, v => project.TargetUser = v);
            Write(ProjectFieldProvenance.Solution, solution, v => project.Solution = v);
            Write(ProjectFieldProvenance.MarketGap, marketGap, v => project.MarketGap = v);
            Write(ProjectFieldProvenance.CreatorEdge, creatorEdge, v => project.CreatorEdge = v);
            Write(ProjectFieldProvenance.ExistingAlternatives, existingAlternatives, v => project.ExistingAlternatives = v);
            Write(ProjectFieldProvenance.WhyNow, whyNow, v => project.WhyNow = v);
            Write(ProjectFieldProvenance.RiskiestAssumption, riskiestAssumption, v => project.RiskiestAssumption = v);
            Write(ProjectFieldProvenance.Concept, !string.IsNullOrWhiteSpace(solution) ? solution : marketGap, v => project.Concept = v);

            if (tags is { Count: > 0 } && !ProjectFieldProvenance.IsUserEdited(project, ProjectFieldProvenance.Tags))
            {
                project.Tags = tags;
                MarkClarifier(project, ProjectFieldProvenance.Tags);
            }
            if (!ProjectFieldProvenance.IsUserEdited(project, ProjectFieldProvenance.ClarityScore))
            {
                project.ClarityScore = clarityScore;
                MarkClarifier(project, ProjectFieldProvenance.ClarityScore);
            }
            if (string.IsNullOrWhiteSpace(project.SourceMethod)) project.SourceMethod = "clarifier";
        }

        private static void MarkClarifier(CreatorJourneyProject project, string field)
        {
            project.FieldProvenance ??= new Dictionary<string, string>();
            project.FieldProvenance[field] = ProjectFieldProvenance.Clarifier;
        }

        /// <summary>A hand edit of a clarifier-owned field: a later summary re-run must keep it.</summary>
        public static void MarkUserEdited(CreatorJourneyProject project, string field)
        {
            project.FieldProvenance ??= new Dictionary<string, string>();
            project.FieldProvenance[field] = ProjectFieldProvenance.UserEdited;
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
