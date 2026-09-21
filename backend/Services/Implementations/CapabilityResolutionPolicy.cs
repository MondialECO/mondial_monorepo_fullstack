using System;
using System.Collections.Generic;
using System.Linq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class CapabilityResolutionPolicy : ICapabilityResolutionPolicy
    {
        private readonly ICapabilityMatcher _capabilityMatcher;

        public CapabilityResolutionPolicy(ICapabilityMatcher capabilityMatcher)
        {
            _capabilityMatcher = capabilityMatcher;
        }

        public CapabilityResolution ResolveNeed(CreatorNeed need, SkillsResolutionContext context)
        {
            var capabilityName = !string.IsNullOrWhiteSpace(need.CapabilityRequired) ? need.CapabilityRequired : need.Title;
            var resolutionKey = $"resolve.{SanitizeKey(need.Key)}";

            var resolution = new CapabilityResolution
            {
                Key = resolutionKey,
                NeedKey = need.Key,
                Capability = capabilityName,
                NeedCategory = need.Category,
                Priority = need.Priority,
                Timing = need.Timing,
                Blocking = need.Blocking,
                RelatedRoadmapTaskKeys = need.RelatedRoadmapTaskKeys ?? new List<string>(),
                Source = new List<string>(need.Source ?? new List<string>()),
                SourceReference = new List<string>(need.SourceReference ?? new List<string>()),
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // 1. MANDATORY STATUTORY / REGULATORY VERIFICATION CHECK (Correction 2: Authoritative-Only, never invented)
            var isStatutoryLegal = IsStatutoryLegalRequirement(need, context);
            if (isStatutoryLegal)
            {
                resolution.ResolutionMode = ResolutionModes.Verify;
                resolution.Confidence = ResolutionConfidence.High;
                resolution.ReasonCode = ResolutionReasonCodes.MandatoryProfessionalVerification;
                resolution.IsMandatoryVerification = true;
                resolution.AuthoritySource = context.LegalAssessment?.RulesVersion ?? "Statutory Authority Rule";
                resolution.Why = "Authoritative statutory regulation mandates official professional validation, administrative filing, or statutory deposit before operational activity.";
                resolution.RequiredCapabilityLevel = "Certified";
                return resolution;
            }

            // 2. CHECK EXISTING COVERAGE (Founding team & Founder skills)
            // 2a. Founding team capability coverage
            var teamCovered = context.Formation?.YouHave ?? new List<string>();
            var isCoveredByTeam = teamCovered.Any(t =>
                t.Contains(capabilityName, StringComparison.OrdinalIgnoreCase) ||
                (capabilityName.Contains("Software", StringComparison.OrdinalIgnoreCase) && t.Contains("Technical", StringComparison.OrdinalIgnoreCase)) ||
                (capabilityName.Contains("Development", StringComparison.OrdinalIgnoreCase) && t.Contains("Developer", StringComparison.OrdinalIgnoreCase)) ||
                (capabilityName.Contains("Design", StringComparison.OrdinalIgnoreCase) && t.Contains("Design", StringComparison.OrdinalIgnoreCase)));

            if (isCoveredByTeam)
            {
                resolution.ResolutionMode = ResolutionModes.Covered;
                resolution.Confidence = ResolutionConfidence.High;
                resolution.ReasonCode = ResolutionReasonCodes.ExistingTeamCoverage;
                resolution.Why = "Requirement is covered by your declared founding team or co-founder.";
                resolution.CurrentEvidence.Add("Founding team capability documented in Formation assessment.");
                return resolution;
            }

            // 2b. Founder skill matching via ICapabilityMatcher
            var declaredSkills = context.Skills ?? new List<ProfileSkill>();
            var matchResult = _capabilityMatcher.MatchCapability(capabilityName, declaredSkills);

            if (matchResult.IsMatched && matchResult.MatchedSkill != null)
            {
                var skill = matchResult.MatchedSkill;
                var level = skill.Level?.Trim();
                resolution.CurrentSkillLevel = level;
                resolution.CurrentEvidence.Add($"Declared skill: '{skill.Name}' (Level: {level ?? "Unspecified"}).");

                // Level null or whitespace -> NeedsReview (Correction 1)
                if (string.IsNullOrWhiteSpace(level))
                {
                    resolution.ResolutionMode = ResolutionModes.NeedsReview;
                    resolution.Confidence = ResolutionConfidence.NeedsReview;
                    resolution.ReasonCode = ResolutionReasonCodes.InsufficientEvidence;
                    resolution.Why = $"You declared '{skill.Name}', but your proficiency level has not been confirmed in your HumainX profile. Please update your profile.";
                    return resolution;
                }

                // Advanced / Expert -> Covered
                if (string.Equals(level, "Advanced", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(level, "Expert", StringComparison.OrdinalIgnoreCase))
                {
                    resolution.ResolutionMode = ResolutionModes.Covered;
                    resolution.Confidence = ResolutionConfidence.High;
                    resolution.ReasonCode = ResolutionReasonCodes.ExistingCapabilitySufficient;
                    resolution.Why = $"Sufficient capability verified: You have declared '{skill.Name}' at {level} level in your HumainX profile.";
                    return resolution;
                }

                // Comfortable / Intermediate -> Check requirement complexity (Correction 1)
                if (string.Equals(level, "Comfortable", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(level, "Intermediate", StringComparison.OrdinalIgnoreCase))
                {
                    var isComplexCritical = need.Priority == NeedPriority.Critical && need.Blocking;
                    var hasSupportingExperience = (context.Experiences ?? new List<ProfessionalExperience>())
                        .Any(e => e.JobTitle?.Contains(capabilityName, StringComparison.OrdinalIgnoreCase) == true ||
                                  e.Description?.Contains(capabilityName, StringComparison.OrdinalIgnoreCase) == true);

                    if (isComplexCritical && !hasSupportingExperience)
                    {
                        // Comfortable + complex/critical without supporting experience -> Evaluate evidence / NeedsReview
                        resolution.ResolutionMode = ResolutionModes.NeedsReview;
                        resolution.Confidence = ResolutionConfidence.Medium;
                        resolution.ReasonCode = ResolutionReasonCodes.InsufficientEvidence;
                        resolution.Why = $"You declared '{skill.Name}' at Comfortable level, but this is a critical, launch-blocking requirement without documented enterprise experience. Please review your practical readiness.";
                        return resolution;
                    }

                    resolution.ResolutionMode = ResolutionModes.Covered;
                    resolution.Confidence = ResolutionConfidence.High;
                    resolution.ReasonCode = ResolutionReasonCodes.ExistingCapabilitySufficient;
                    resolution.Why = $"Practical capability verified: You have declared '{skill.Name}' at {level} level in your HumainX profile.";
                    return resolution;
                }

                // Beginner -> Never automatically Covered (Correction 1). Proceeds to Learn/Delegate feasibility evaluation.
            }

            // 3. EVALUATE LEARN VS. DELEGATE FEASIBILITY
            var weeklyAvail = context.VentureContext?.WeeklyAvailability ?? string.Empty;
            var isVeryLowTime = weeklyAvail.Contains("<5", StringComparison.OrdinalIgnoreCase) ||
                                weeklyAvail.Contains("Less than 5", StringComparison.OrdinalIgnoreCase) ||
                                weeklyAvail.Contains("1-5", StringComparison.OrdinalIgnoreCase);

            var learningPref = context.VentureContext?.LearningPreference ?? string.Empty;
            var delegationPref = context.VentureContext?.DelegationPreference ?? string.Empty;
            var prefersLearning = learningPref.Contains("learn", StringComparison.OrdinalIgnoreCase) ||
                                  learningPref.Contains("study", StringComparison.OrdinalIgnoreCase);
            var prefersDelegation = delegationPref.Contains("delegate", StringComparison.OrdinalIgnoreCase) ||
                                    delegationPref.Contains("hire", StringComparison.OrdinalIgnoreCase) ||
                                    delegationPref.Contains("outsource", StringComparison.OrdinalIgnoreCase);

            var isImmediateCritical = (need.Timing == NeedTiming.Now) && need.Blocking;

            // Low available time (<5h/week) + Urgent/Critical -> DELEGATE
            if (isVeryLowTime && isImmediateCritical)
            {
                resolution.ResolutionMode = ResolutionModes.Delegate;
                resolution.Confidence = ResolutionConfidence.High;
                resolution.ReasonCode = ResolutionReasonCodes.LowAvailableTime;
                resolution.Why = "Your current weekly availability (<5 hours/week) is insufficient to learn this complex capability before upcoming milestones. Delegating to a specialist is recommended to keep launch on schedule.";
                resolution.LearningFeasibility = LearningFeasibility.Low;
                resolution.EstimatedEffort = "Large";
                return resolution;
            }

            // Explicit delegation preference + delegable requirement
            if (prefersDelegation && !prefersLearning)
            {
                resolution.ResolutionMode = ResolutionModes.Delegate;
                resolution.Confidence = ResolutionConfidence.High;
                resolution.ReasonCode = ResolutionReasonCodes.DelegationPreference;
                resolution.Why = "Aligned with your expressed preference in HumainX to delegate operational responsibilities to qualified specialists.";
                resolution.LearningFeasibility = LearningFeasibility.Medium;
                return resolution;
            }

            // Feasible learning path: Founder has Beginner skill OR requirement has runway (Next30Days, 30-60 Days, etc.)
            var isBeginner = matchResult.IsMatched && string.Equals(matchResult.MatchedSkill?.Level, "Beginner", StringComparison.OrdinalIgnoreCase);
            var hasLearningRunway = need.Timing != NeedTiming.Now || !need.Blocking;

            if ((isBeginner || prefersLearning || hasLearningRunway) && !isVeryLowTime)
            {
                resolution.ResolutionMode = ResolutionModes.Learn;
                resolution.Confidence = ResolutionConfidence.High;
                resolution.ReasonCode = isBeginner ? ResolutionReasonCodes.FeasibleLearningPath : ResolutionReasonCodes.LearningPreference;
                resolution.LearningFeasibility = LearningFeasibility.High;
                resolution.RequiredCapabilityLevel = "Comfortable"; // Correction 5: Target level practical, not always Advanced
                resolution.EstimatedEffort = isBeginner ? "Small" : "Medium";
                resolution.Why = isBeginner
                    ? $"You already have foundational knowledge in '{matchResult.MatchedSkill!.Name}'. With your weekly availability and runway, advancing to Comfortable proficiency is practical and cost-effective."
                    : "Developing practical operational knowledge in this area directly strengthens your founder autonomy without requiring an outside contract.";
                return resolution;
            }

            // Specialized complex technical requirement without background -> DELEGATE
            if (need.Category == NeedCategories.Technology || need.RequirementType == RequirementTypes.ProfessionalService)
            {
                resolution.ResolutionMode = ResolutionModes.Delegate;
                resolution.Confidence = ResolutionConfidence.Medium;
                resolution.ReasonCode = ResolutionReasonCodes.HighRequirementComplexity;
                resolution.Why = "This capability requires specialized professional execution that is more efficiently delegated to a verified external specialist.";
                resolution.LearningFeasibility = LearningFeasibility.Low;
                return resolution;
            }

            // Default fallback: NeedsReview
            resolution.ResolutionMode = ResolutionModes.NeedsReview;
            resolution.Confidence = ResolutionConfidence.Low;
            resolution.ReasonCode = ResolutionReasonCodes.InsufficientEvidence;
            resolution.Why = "Available capability and experience evidence is inconclusive. Please review your preference or update your HumainX profile.";
            return resolution;
        }

        public LearningAction GenerateLearningAction(CapabilityResolution resolution)
        {
            var topics = GetCuratedTopics(resolution.Capability, resolution.NeedCategory);

            return new LearningAction
            {
                ResolutionKey = resolution.Key,
                Capability = resolution.Capability,
                Objective = $"Acquire working practical competence in {resolution.Capability} to support project operations.",
                CurrentLevel = resolution.CurrentSkillLevel ?? "Beginner",
                TargetLevel = resolution.RequiredCapabilityLevel ?? "Comfortable",
                Priority = resolution.Priority,
                Timing = resolution.Timing,
                EstimatedLearningEffort = resolution.EstimatedEffort ?? "Medium",
                LearningFormat = LearningFormats.SelfGuided,
                LearningTopics = topics,
                CompletionCriteria = new List<string>
                {
                    $"Can explain and execute core {resolution.Capability} workflows independently",
                    $"Can review deliverables and interpret technical/business results accurately",
                    $"Can maintain ongoing operational standards for {resolution.Capability}"
                },
                Source = new List<string>(resolution.Source),
                FounderStatus = "NotStarted"
            };
        }

        public DelegationRequirement GenerateDelegationRequirement(CapabilityResolution resolution)
        {
            var resourceType = SuggestedResourceTypes.ServiceProvider;
            if (resolution.Capability.Contains("Software", StringComparison.OrdinalIgnoreCase) ||
                resolution.Capability.Contains("Development", StringComparison.OrdinalIgnoreCase))
            {
                resourceType = SuggestedResourceTypes.Freelancer;
            }
            else if (resolution.Capability.Contains("Legal", StringComparison.OrdinalIgnoreCase) ||
                     resolution.Capability.Contains("Accounting", StringComparison.OrdinalIgnoreCase))
            {
                resourceType = SuggestedResourceTypes.Specialist;
            }
            else if (resolution.Capability.Contains("Marketing", StringComparison.OrdinalIgnoreCase) ||
                     resolution.Capability.Contains("Design", StringComparison.OrdinalIgnoreCase))
            {
                resourceType = SuggestedResourceTypes.Agency;
            }

            return new DelegationRequirement
            {
                ResolutionKey = resolution.Key,
                Capability = resolution.Capability,
                RequirementSummary = $"Engage external {resourceType} support to fulfill {resolution.Capability} requirements.",
                Priority = resolution.Priority,
                Timing = resolution.Timing,
                Blocking = resolution.Blocking,
                SuggestedResourceType = resourceType,
                ExpectedOutcome = $"Deliver verified, production-ready {resolution.Capability} milestones on schedule.",
                Source = new List<string>(resolution.Source),
                FounderStatus = "NotStarted"
            };
        }

        public VerificationRequirement GenerateVerificationRequirement(CapabilityResolution resolution)
        {
            var vType = VerificationTypes.ProfessionalReview;
            if (resolution.Capability.Contains("Capital", StringComparison.OrdinalIgnoreCase) ||
                resolution.Capability.Contains("Deposit", StringComparison.OrdinalIgnoreCase))
            {
                vType = VerificationTypes.LegalValidation;
            }
            else if (resolution.Capability.Contains("Accounting", StringComparison.OrdinalIgnoreCase) ||
                     resolution.Capability.Contains("Tax", StringComparison.OrdinalIgnoreCase))
            {
                vType = VerificationTypes.AccountingValidation;
            }
            else if (resolution.Capability.Contains("Licence", StringComparison.OrdinalIgnoreCase) ||
                     resolution.Capability.Contains("License", StringComparison.OrdinalIgnoreCase))
            {
                vType = VerificationTypes.Licence;
            }
            else if (resolution.Capability.Contains("Trademark", StringComparison.OrdinalIgnoreCase) ||
                     resolution.Capability.Contains("IP", StringComparison.OrdinalIgnoreCase))
            {
                vType = VerificationTypes.LegalValidation;
            }

            LearningAction? supplement = null;
            if (resolution.Capability.Contains("Capital", StringComparison.OrdinalIgnoreCase) ||
                resolution.Capability.Contains("Escrow", StringComparison.OrdinalIgnoreCase) ||
                resolution.Capability.Contains("Deposit", StringComparison.OrdinalIgnoreCase) ||
                resolution.Capability.Contains("Legal", StringComparison.OrdinalIgnoreCase))
            {
                supplement = new LearningAction
                {
                    ResolutionKey = resolution.Key,
                    Capability = $"{resolution.Capability} (Foundational Knowledge)",
                    Objective = $"Understand basic principles and procedural flow for {resolution.Capability}",
                    CurrentLevel = "None",
                    TargetLevel = "Foundational",
                    EstimatedLearningEffort = "2-4 hours",
                    Priority = NeedPriority.Low,
                    Timing = resolution.Timing,
                    LearningFormat = LearningFormats.SelfGuided,
                    LearningTopics = new List<string> { "Capital Deposit Basics", "Escrow Certificate Flow", "Legal Filing Timeline" },
                    Source = new List<string>(resolution.Source)
                };
            }

            return new VerificationRequirement
            {
                ResolutionKey = resolution.Key,
                Requirement = resolution.Capability,
                VerificationType = vType,
                WhyRequired = resolution.Why,
                AuthoritySource = resolution.AuthoritySource,
                Timing = resolution.Timing,
                Blocking = resolution.Blocking,
                EvidenceRequired = new List<string>
                {
                    "Official statutory filing receipt or registration attestation",
                    "Certified practitioner or depositary confirmation document"
                },
                Source = new List<string>(resolution.Source),
                IsMandatory = resolution.IsMandatoryVerification,
                OptionalLearningSupplement = supplement,
                FounderStatus = "NotStarted"
            };
        }

        public CoveredCapability GenerateCoveredCapability(CapabilityResolution resolution)
        {
            return new CoveredCapability
            {
                ResolutionKey = resolution.Key,
                Capability = resolution.Capability,
                CoverageSource = resolution.ReasonCode == ResolutionReasonCodes.ExistingTeamCoverage ? "TeamMember" : "FounderSkill",
                Evidence = resolution.Why,
                CurrentLevel = resolution.CurrentSkillLevel,
                Source = new List<string>(resolution.Source)
            };
        }

        private static bool IsStatutoryLegalRequirement(CreatorNeed need, SkillsResolutionContext context)
        {
            // Correction 2: ONLY if Phase 3 Legal Assessment or authoritative structured upstream rule explicitly marks it mandatory
            // Phase 4.4 never invents legal obligations.
            if (context.LegalAssessment?.Items != null)
            {
                var matchingItem = context.LegalAssessment.Items.FirstOrDefault(i =>
                    string.Equals(i.Id, need.Key, StringComparison.OrdinalIgnoreCase) ||
                    need.Key.Contains(i.Id, StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrWhiteSpace(need.CapabilityRequired) &&
                     (i.Title?.Contains(need.CapabilityRequired, StringComparison.OrdinalIgnoreCase) == true ||
                      i.Label?.Contains(need.CapabilityRequired, StringComparison.OrdinalIgnoreCase) == true)));

                if (matchingItem != null && (string.Equals(matchingItem.Priority, "critical", StringComparison.OrdinalIgnoreCase) || matchingItem.RequiresEvidence))
                {
                    return true;
                }
            }

            if (need.Source != null && need.Source.Any(s => s.Contains("LegalAssessment", StringComparison.OrdinalIgnoreCase)))
            {
                if (need.Priority == NeedPriority.Critical && need.Blocking)
                {
                    return true;
                }
            }

            return false;
        }

        private static List<string> GetCuratedTopics(string capability, string category)
        {
            // Correction 5: Curated capability taxonomy templates (deterministic, never random AI hallucination)
            if (capability.Contains("Software", StringComparison.OrdinalIgnoreCase) ||
                capability.Contains("Development", StringComparison.OrdinalIgnoreCase) ||
                capability.Contains("Tech", StringComparison.OrdinalIgnoreCase))
            {
                return new List<string>
                {
                    "System Architecture & Data Modeling Fundamentals",
                    "REST API Integration & Authentication Basics",
                    "Staging Environments & Testing Protocols",
                    "Production Deployment & Monitoring Essentials"
                };
            }

            if (capability.Contains("Design", StringComparison.OrdinalIgnoreCase) ||
                capability.Contains("UI", StringComparison.OrdinalIgnoreCase))
            {
                return new List<string>
                {
                    "Figma Design Systems & Shared Component Libraries",
                    "User Flow & Wireframing Best Practices",
                    "Responsive Mobile-First Interface Usability",
                    "Interactive Prototyping & Usability Feedback"
                };
            }

            if (capability.Contains("Paid", StringComparison.OrdinalIgnoreCase) ||
                capability.Contains("Ads", StringComparison.OrdinalIgnoreCase))
            {
                return new List<string>
                {
                    "Ad Account Setup & Conversion Tracking Pixels",
                    "Audience Segmentation & Creative Asset Testing",
                    "Budget Allocation & ROAS Monitoring",
                    "Retargeting Campaigns & Acquisition Analytics"
                };
            }

            if (capability.Contains("Content", StringComparison.OrdinalIgnoreCase) ||
                capability.Contains("SEO", StringComparison.OrdinalIgnoreCase) ||
                capability.Contains("Marketing", StringComparison.OrdinalIgnoreCase))
            {
                return new List<string>
                {
                    "Keyword Research & Target Search Intent Mapping",
                    "Editorial Calendar & High-Converting Content Briefs",
                    "On-Page SEO & Metadata Optimization",
                    "Multi-Channel Organic Social Distribution"
                };
            }

            if (capability.Contains("Sales", StringComparison.OrdinalIgnoreCase) ||
                capability.Contains("Business Development", StringComparison.OrdinalIgnoreCase))
            {
                return new List<string>
                {
                    "Ideal Customer Profile (ICP) & Prospect Qualification",
                    "Discovery Call Structure & Active Listening Frameworks",
                    "Value Proposition Pitching & Objection Handling",
                    "CRM Pipeline Management & Follow-up Discipline"
                };
            }

            if (capability.Contains("Finance", StringComparison.OrdinalIgnoreCase) ||
                capability.Contains("Accounting", StringComparison.OrdinalIgnoreCase))
            {
                return new List<string>
                {
                    "Cash Flow Tracking & Burn Rate Discipline",
                    "Interpreting P&L Statements & Balance Sheets",
                    "Expense Categorization & Statutory Invoicing Rules",
                    "Runway Projection & Financial Buffer Planning"
                };
            }

            return new List<string>
            {
                "Operational Process Mapping & Workflow Documentation",
                "Tooling Configuration & Team Collaboration Setup",
                "Quality Assurance Standards & Execution Checklists",
                "Operational Key Performance Indicators (KPIs)"
            };
        }

        private static string SanitizeKey(string key)
        {
            return (key ?? string.Empty).ToLowerInvariant().Replace(' ', '-').Replace('.', '-');
        }
    }
}
