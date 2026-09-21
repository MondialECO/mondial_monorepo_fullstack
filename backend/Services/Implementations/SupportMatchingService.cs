using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class SupportMatchingService : ISupportMatchingService
    {
        private readonly ISupportEligibilityEngine _eligibilityEngine;

        public SupportMatchingService(ISupportEligibilityEngine eligibilityEngine)
        {
            _eligibilityEngine = eligibilityEngine;
        }

        public Task<SupportEligibilityContext> BuildEligibilityContextAsync(
            string userId,
            CreatorJourney journey,
            ProfessionalProfileRecord? profile,
            Dictionary<string, string>? customFacts = null)
        {
            var p = journey.Project ?? new CreatorJourneyProject();
            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();
            var p4 = journey.Phase4Data ?? new CreatorPhase4Data();
            var venture = profile?.VentureContext;

            var ctx = new SupportEligibilityContext
            {
                UserId = userId,
                IdeaId = journey.IdeaId ?? string.Empty,
                Country = "FR",
                Region = venture?.Region ?? "Île-de-France",
                CurrentSituation = venture?.CurrentSituation ?? "JobSeeker",
                WeeklyAvailability = venture?.WeeklyAvailability ?? "15-25 hours/week",
                LegalForm = p3.FormationGenerator?.SelectedType ?? p3.FormationGenerator?.RecommendedType ?? "SAS",
                FormationStatus = string.IsNullOrEmpty(journey.CompanyId) ? "NotCreated" : "Registered",
                Sector = p.Tags != null && p.Tags.Any() ? p.Tags.First() : "Tech / Digital",
                ActivityType = p.Solution ?? "Digital Platform",
                HasTrainingNeeds = p4.SkillsPlan?.Resolutions?.Any(r => r.ResolutionMode == "LEARN") == true,
                HasHiringPlans = p4.NeedsAnalysis?.ActiveNeeds?.Any(n => n.Category == "Team") == true,
                HasInnovativeActivity = true, // By default for tech/digital creation projects in MBC
                HasExportAmbitions = false
            };

            // Needs extraction
            if (p4.NeedsAnalysis?.ActiveNeeds != null)
            {
                ctx.ProjectNeeds = p4.NeedsAnalysis.ActiveNeeds.Select(n => n.Key).ToList();
                ctx.UnresolvedNeedKeys = p4.NeedsAnalysis.ActiveNeeds.Select(n => n.Key).ToList();
            }

            // Merge custom facts
            if (customFacts != null)
            {
                foreach (var kv in customFacts)
                {
                    ctx.KnownEligibilityFacts[kv.Key] = kv.Value;
                }
            }

            return Task.FromResult(ctx);
        }

        public Task<List<SupportMatch>> MatchOpportunitiesAsync(SupportEligibilityContext context, List<SupportOpportunity> candidates)
        {
            var matches = new List<SupportMatch>();
            foreach (var opp in candidates)
            {
                var match = _eligibilityEngine.EvaluateOpportunity(opp, context);
                matches.Add(match);
            }
            return Task.FromResult(matches);
        }

        public List<MissingEligibilityFact> ExtractMissingEligibilityFacts(List<SupportMatch> matches, SupportEligibilityContext context)
        {
            var missingFacts = new Dictionary<string, MissingEligibilityFact>();

            foreach (var match in matches.Where(m => m.EligibilityStatus == EligibilityStatus.NeedsInformation || m.EligibilityStatus == EligibilityStatus.PotentiallyEligible))
            {
                if (match.ConditionsMissing.Any(c => c.Contains("France Travail", StringComparison.OrdinalIgnoreCase)))
                {
                    if (!missingFacts.ContainsKey("is_registered_france_travail"))
                    {
                        missingFacts["is_registered_france_travail"] = new MissingEligibilityFact
                        {
                            Key = "is_registered_france_travail",
                            Question = "Êtes-vous actuellement inscrit comme demandeur d'emploi auprès de France Travail ?",
                            WhyNeeded = "Cette condition détermine votre éligibilité aux aides au maintien de revenus (ARCE, Maintien ARE) et aux exonérations sociales ACRE.",
                            RelatedOpportunityIds = new List<string> { match.OpportunityId },
                            DataType = "boolean",
                            AllowedValues = new List<string> { "Oui", "Non" },
                            CurrentValue = context.KnownEligibilityFacts.GetValueOrDefault("is_registered_france_travail"),
                            Required = true
                        };
                    }
                    else
                    {
                        missingFacts["is_registered_france_travail"].RelatedOpportunityIds.Add(match.OpportunityId);
                    }
                }

                if (match.ConditionsMissing.Any(c => c.Contains("immatriculation", StringComparison.OrdinalIgnoreCase) || c.Contains("création", StringComparison.OrdinalIgnoreCase)))
                {
                    if (!missingFacts.ContainsKey("is_company_already_registered"))
                    {
                        missingFacts["is_company_already_registered"] = new MissingEligibilityFact
                        {
                            Key = "is_company_already_registered",
                            Question = "Votre entreprise est-elle déjà formellement immatriculée au registre du commerce (Kbis obtenu) ?",
                            WhyNeeded = "Certaines subventions (comme la Bourse French Tech ou le Pass Création) doivent être obligatoirement demandées avant la création juridique.",
                            RelatedOpportunityIds = new List<string> { match.OpportunityId },
                            DataType = "boolean",
                            AllowedValues = new List<string> { "Oui", "Non" },
                            CurrentValue = context.KnownEligibilityFacts.GetValueOrDefault("is_company_already_registered"),
                            Required = true
                        };
                    }
                    else
                    {
                        missingFacts["is_company_already_registered"].RelatedOpportunityIds.Add(match.OpportunityId);
                    }
                }
            }

            return missingFacts.Values.ToList();
        }

        public List<SupportApplicationChecklist> BuildApplicationChecklists(List<SupportMatch> matches, CreatorJourney journey)
        {
            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();
            var p4 = journey.Phase4Data ?? new CreatorPhase4Data();

            bool hasBusinessPlan = !string.IsNullOrEmpty(p3.BusinessPlanSessionId);
            bool hasForecast = !string.IsNullOrEmpty(p3.ForecastSessionId) || p3.FormationGenerator?.ForecastBasis != null;
            bool hasMarketStudy = !string.IsNullOrEmpty(p3.MarketStudySessionId);
            bool hasSkillsPlan = p4.SkillsPlan != null;
            bool hasLegalAssessment = p3.LegalAssessment != null;

            var checklists = new List<SupportApplicationChecklist>();

            foreach (var match in matches.Where(m => m.EligibilityStatus == EligibilityStatus.Eligible || m.EligibilityStatus == EligibilityStatus.EligibleToApply || m.EligibilityStatus == EligibilityStatus.Awarded || m.EligibilityStatus == EligibilityStatus.PotentiallyEligible))
            {
                var checklist = new SupportApplicationChecklist
                {
                    OpportunityId = match.OpportunityId,
                    OpportunityKey = match.Key,
                    OpportunityName = match.Name,
                    Items = new List<ApplicationChecklistItem>()
                };

                // Map MBC document reuse
                checklist.Items.Add(new ApplicationChecklistItem
                {
                    Key = "doc-business-plan",
                    Label = "Business Plan & Synthèse Stratégique",
                    Required = true,
                    Status = hasBusinessPlan ? "Ready" : "Missing",
                    ExistingArtifactReference = hasBusinessPlan ? "Phase 3 Executive Business Plan (Disponible)" : null,
                    Notes = "Fournit la justification économique et le modèle de rentabilité du projet."
                });

                checklist.Items.Add(new ApplicationChecklistItem
                {
                    Key = "doc-forecast",
                    Label = "Plan de Trésorerie & Prévisionnel Financier 3 Ans",
                    Required = true,
                    Status = hasForecast ? "Ready" : "Missing",
                    ExistingArtifactReference = hasForecast ? "Phase 3 Financial Forecast (Disponible)" : null,
                    Notes = "Prévisionnel de revenus et modélisation de trésorerie validé."
                });

                if (match.SupportType == SupportType.TrainingFunding)
                {
                    checklist.Items.Add(new ApplicationChecklistItem
                    {
                        Key = "doc-skills-plan",
                        Label = "Plan de Compétences & Besoins de Formation",
                        Required = true,
                        Status = hasSkillsPlan ? "Ready" : "Missing",
                        ExistingArtifactReference = hasSkillsPlan ? "Phase 4.4 Skills & Training Plan (Disponible)" : null,
                        Notes = "Identifie les lacunes de compétences à financer."
                    });
                }

                if (match.Timing.MustApplyAfterCreation)
                {
                    checklist.Items.Add(new ApplicationChecklistItem
                    {
                        Key = "doc-kbis",
                        Label = "Extrait d'Immatriculation Kbis ou Avis SIRENE",
                        Required = true,
                        Status = string.IsNullOrEmpty(journey.CompanyId) ? "NotRequired" : "Ready",
                        ExistingArtifactReference = string.IsNullOrEmpty(journey.CompanyId) ? null : "Entreprise Immatriculée",
                        Notes = "Requis uniquement après l'immatriculation juridique."
                    });
                }

                checklist.ReadyCount = checklist.Items.Count(i => i.Status == "Ready");
                checklist.MissingCount = checklist.Items.Count(i => i.Status == "Missing");
                checklist.ReadinessStatus = checklist.MissingCount == 0 ? ApplicationReadiness.ReadyToApply : ApplicationReadiness.AlmostReady;

                checklists.Add(checklist);
            }

            return checklists;
        }

        public SupportPlanSummary ComputeSummary(List<SupportMatch> matches)
        {
            return new SupportPlanSummary
            {
                EligibleCount = matches.Count(m => m.EligibilityStatus == EligibilityStatus.Eligible || m.EligibilityStatus == EligibilityStatus.EligibleToApply || m.EligibilityStatus == EligibilityStatus.Awarded),
                PotentialCount = matches.Count(m => m.EligibilityStatus == EligibilityStatus.PotentiallyEligible),
                NeedsInfoCount = matches.Count(m => m.EligibilityStatus == EligibilityStatus.NeedsInformation),
                ReadyToPrepareCount = matches.Count(m => m.EligibilityStatus == EligibilityStatus.Eligible || m.EligibilityStatus == EligibilityStatus.EligibleToApply || m.EligibilityStatus == EligibilityStatus.Awarded || m.EligibilityStatus == EligibilityStatus.PotentiallyEligible),
                ActionCount = matches.Count(m => m.EligibilityStatus == EligibilityStatus.NeedsInformation || m.EligibilityStatus == EligibilityStatus.NeedsReview),
                TotalEvaluatedCount = matches.Count
            };
        }

        public List<SupportMatch> SelectTopMatches(List<SupportMatch> matches)
        {
            return matches
                .Where(m => m.EligibilityStatus != EligibilityStatus.NotEligible && m.EligibilityStatus != EligibilityStatus.Expired)
                .OrderBy(m => GetSortOrder(m))
                .Take(6)
                .ToList();
        }

        private static int GetSortOrder(SupportMatch m)
        {
            if ((m.EligibilityStatus == EligibilityStatus.Awarded || m.EligibilityStatus == EligibilityStatus.Eligible || m.EligibilityStatus == EligibilityStatus.EligibleToApply) && m.RelatedNeedKeys.Any()) return 1;
            if (m.EligibilityStatus == EligibilityStatus.Awarded || m.EligibilityStatus == EligibilityStatus.Eligible || m.EligibilityStatus == EligibilityStatus.EligibleToApply) return 2;
            if (m.EligibilityStatus == EligibilityStatus.PotentiallyEligible) return 3;
            if (m.EligibilityStatus == EligibilityStatus.NeedsInformation) return 4;
            if (m.EligibilityStatus == EligibilityStatus.NeedsReview) return 5;
            if (m.EligibilityStatus == EligibilityStatus.NotYetEligible) return 6;
            return 7;
        }
    }
}
