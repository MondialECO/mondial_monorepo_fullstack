using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;

namespace WebApp.Services.Legal
{
    /// <summary>
    /// Deterministic legal applicability engine for France MVP.
    /// Evaluates Creator business profiles against the France statutory rules catalogue.
    /// Zero LLM dependency: 100% deterministic, audit-traceable, and instant.
    /// </summary>
    public class LegalApplicabilityEngine : ILegalApplicabilityEngine
    {
        private readonly IFranceLegalRulesCatalog _catalog;
        private readonly ILogger<LegalApplicabilityEngine> _logger;

        public LegalApplicabilityEngine(
            IFranceLegalRulesCatalog catalog,
            ILogger<LegalApplicabilityEngine> logger)
        {
            _catalog = catalog;
            _logger = logger;
        }

        public CreatorLegalAssessment Evaluate(
            string creatorIdeaId,
            string userId,
            LegalBusinessProfile profile,
            List<CreatorLegalChecklistItem>? existingItems = null)
        {
            var prev = existingItems != null && existingItems.Count > 0
                ? new CreatorLegalAssessment { Items = existingItems }
                : null;
            return ReconcileAndEvaluate(creatorIdeaId, userId, profile, prev);
        }

        public LegalStaleMetadata CheckFreshness(
            CreatorLegalAssessment? assessment,
            LegalBusinessProfile currentProfile,
            string currentRulesVersion,
            string currentJurisdiction = "FR")
        {
            if (assessment == null)
            {
                return new LegalStaleMetadata
                {
                    IsStale = false,
                    StaleReason = LegalStaleReasons.None,
                    CurrentRulesVersion = currentRulesVersion,
                    AssessmentRulesVersion = currentRulesVersion
                };
            }

            var currentHash = ComputeSnapshotHash(currentProfile);
            bool hashChanged = !string.Equals(assessment.BusinessSnapshotHash, currentHash, StringComparison.OrdinalIgnoreCase);
            bool rulesChanged = !string.Equals(assessment.RulesVersion, currentRulesVersion, StringComparison.OrdinalIgnoreCase);
            bool jurisdictionChanged = !string.Equals(assessment.Jurisdiction, currentJurisdiction, StringComparison.OrdinalIgnoreCase);

            var diffs = LegalChangeDetector.ComputeDiffs(assessment.BusinessProfile, currentProfile);
            var humanDescriptions = LegalChangeDetector.FormatHumanChangeList(diffs);

            bool isStale = hashChanged || rulesChanged || jurisdictionChanged;
            string staleReason = LegalStaleReasons.None;

            if (hashChanged)
            {
                staleReason = LegalStaleReasons.BusinessDataChanged;
            }
            else if (rulesChanged)
            {
                staleReason = LegalStaleReasons.RulesUpdated;
            }
            else if (jurisdictionChanged)
            {
                staleReason = LegalStaleReasons.JurisdictionChanged;
            }

            return new LegalStaleMetadata
            {
                IsStale = isStale,
                StaleReason = staleReason,
                StaleDetectedAt = isStale ? (assessment.StaleMetadata?.StaleDetectedAt ?? DateTime.UtcNow) : null,
                LastEvaluatedAt = assessment.EvaluatedAt,
                CurrentRulesVersion = currentRulesVersion,
                AssessmentRulesVersion = assessment.RulesVersion,
                Diffs = diffs,
                HumanChangeDescriptions = humanDescriptions
            };
        }

        public CreatorLegalAssessment ReconcileAndEvaluate(
            string creatorIdeaId,
            string userId,
            LegalBusinessProfile profile,
            CreatorLegalAssessment? previousAssessment)
        {
            var rules = _catalog.GetAllRules();
            var previousItems = previousAssessment?.Items ?? new List<CreatorLegalChecklistItem>();
            var previousMap = previousItems
                .GroupBy(i => i.Id, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var items = new List<CreatorLegalChecklistItem>();
            var traces = new List<LegalEvaluationTrace>();

            var addedReqs = new List<ReconciliationRequirementItem>();
            var removedReqs = new List<ReconciliationRequirementItem>();
            int unchangedCount = 0;

            var evaluatedRuleIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var rule in rules)
            {
                evaluatedRuleIds.Add(rule.Id);
                var (status, matched, missing, rationale) = EvaluateRule(rule, profile);

                traces.Add(new LegalEvaluationTrace
                {
                    RuleId = rule.Id,
                    RuleTitle = rule.Title,
                    Status = status,
                    MatchedConditions = matched,
                    MissingSignals = missing,
                    TraceRationale = rationale
                });

                previousMap.TryGetValue(rule.Id, out var existing);

                if (status == ApplicabilityEvaluationStatuses.NotApplicable)
                {
                    // If it was previously applicable and active, mark as no longer applicable
                    if (existing != null && existing.Status != LegalItemStatuses.NotApplicable)
                    {
                        removedReqs.Add(new ReconciliationRequirementItem
                        {
                            Id = rule.Id,
                            Title = rule.Title,
                            Stage = rule.Stage,
                            Priority = rule.Priority,
                            Category = rule.Category
                        });

                        // Preserve in historical list with not_applicable status, keeping existing notes and evidence!
                        existing.Status = LegalItemStatuses.NotApplicable;
                        existing.EvaluationStatus = ApplicabilityEvaluationStatuses.NotApplicable;
                        existing.IsNewRequirement = false;
                        items.Add(existing);
                    }
                    else if (existing != null)
                    {
                        // Previously was already not_applicable, retain as-is
                        items.Add(existing);
                    }
                    continue;
                }

                // Rule IS applicable now
                if (existing != null && existing.Status != LegalItemStatuses.NotApplicable)
                {
                    // Unchanged applicable requirement: strictly preserve progress and evidence
                    unchangedCount++;
                    var item = new CreatorLegalChecklistItem
                    {
                        Id = rule.Id,
                        Label = rule.Title,
                        Title = rule.Title,
                        Category = rule.Category,
                        Status = existing.Status,
                        Stage = rule.Stage,
                        Priority = rule.Priority,
                        WhyItApplies = rule.WhyItApplies,
                        OfficialSource = rule.OfficialSource,
                        RequiresEvidence = rule.RequiresEvidence,
                        EvidenceDocType = rule.EvidenceDocType,
                        EvidenceDocumentId = existing.EvidenceDocumentId,
                        EvidenceFileName = existing.EvidenceFileName,
                        EvaluationStatus = status,
                        CompletedAt = existing.CompletedAt,
                        Notes = existing.Notes,
                        IsNewRequirement = false,
                        ShowFindSp = rule.RequiresEvidence,
                        SpSpecialty = rule.Category
                    };
                    items.Add(item);
                }
                else
                {
                    // Newly applicable requirement!
                    addedReqs.Add(new ReconciliationRequirementItem
                    {
                        Id = rule.Id,
                        Title = rule.Title,
                        Stage = rule.Stage,
                        Priority = rule.Priority,
                        Category = rule.Category
                    });

                    var item = new CreatorLegalChecklistItem
                    {
                        Id = rule.Id,
                        Label = rule.Title,
                        Title = rule.Title,
                        Category = rule.Category,
                        Status = status == ApplicabilityEvaluationStatuses.NeedsInformation
                            ? LegalItemStatuses.NeedsInformation
                            : LegalItemStatuses.NotStarted,
                        Stage = rule.Stage,
                        Priority = rule.Priority,
                        WhyItApplies = rule.WhyItApplies,
                        OfficialSource = rule.OfficialSource,
                        RequiresEvidence = rule.RequiresEvidence,
                        EvidenceDocType = rule.EvidenceDocType,
                        EvidenceDocumentId = existing?.EvidenceDocumentId,
                        EvidenceFileName = existing?.EvidenceFileName,
                        EvaluationStatus = status,
                        CompletedAt = null,
                        Notes = existing?.Notes,
                        IsNewRequirement = previousAssessment != null, // marked NEW only if there was a previous assessment
                        ShowFindSp = rule.RequiresEvidence,
                        SpSpecialty = rule.Category
                    };
                    items.Add(item);
                }
            }

            // Retain any legacy custom items that were in previousMap but not in catalog
            foreach (var prevItem in previousItems)
            {
                if (!evaluatedRuleIds.Contains(prevItem.Id) && !items.Any(i => string.Equals(i.Id, prevItem.Id, StringComparison.OrdinalIgnoreCase)))
                {
                    items.Add(prevItem);
                }
            }

            // Order items: active first (by stage, priority, id), then inactive/historical
            var stageOrder = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                [LegalStages.BeforeCreation] = 1,
                [LegalStages.CompanyCreation] = 2,
                [LegalStages.BeforeLaunch] = 3,
                [LegalStages.BeforeSale] = 4,
                [LegalStages.Ongoing] = 5
            };

            var priorityOrder = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                [LegalPriorities.Critical] = 1,
                [LegalPriorities.Recommended] = 2,
                [LegalPriorities.Optional] = 3
            };

            items = items
                .OrderBy(i => i.Status == LegalItemStatuses.NotApplicable ? 1 : 0)
                .ThenBy(i => stageOrder.GetValueOrDefault(i.Stage, 99))
                .ThenBy(i => priorityOrder.GetValueOrDefault(i.Priority, 99))
                .ThenBy(i => i.Id)
                .ToList();

            // Stage breakdown calculated ONLY on active items
            var activeItems = items.Where(i => !string.Equals(i.Status, LegalItemStatuses.NotApplicable, StringComparison.OrdinalIgnoreCase)).ToList();

            var breakdowns = LegalStages.All.Select(stageKey =>
            {
                var stageItems = activeItems.Where(i => string.Equals(i.Stage, stageKey, StringComparison.OrdinalIgnoreCase)).ToList();
                return new LegalStageBreakdown
                {
                    Stage = stageKey,
                    StageName = LegalStages.GetDisplayName(stageKey),
                    TotalCount = stageItems.Count,
                    CompletedCount = stageItems.Count(i => LegalItemStatuses.IsCompleted(i.Status)),
                    CriticalCount = stageItems.Count(i => string.Equals(i.Priority, LegalPriorities.Critical, StringComparison.OrdinalIgnoreCase))
                };
            }).ToList();

            var readinessScore = ComputePlanningReadiness(activeItems);
            var snapshotHash = ComputeSnapshotHash(profile);

            // Evidence links preservation (Zero loss)
            var evidenceLinks = previousAssessment?.EvidenceLinks != null
                ? new List<LegalEvidenceLink>(previousAssessment.EvidenceLinks)
                : new List<LegalEvidenceLink>();

            // Audit trail preservation
            var auditTrail = previousAssessment?.EvidenceAuditTrail != null
                ? new List<LegalEvidenceAuditEntry>(previousAssessment.EvidenceAuditTrail)
                : new List<LegalEvidenceAuditEntry>();

            var reconciliationSummary = new LegalReconciliationSummary
            {
                AddedRequirements = addedReqs,
                RemovedRequirements = removedReqs,
                UnchangedRequirementsCount = unchangedCount,
                TotalApplicableCount = activeItems.Count,
                ReconciledAt = DateTime.UtcNow
            };

            int newAssessmentVersion = (previousAssessment?.AssessmentVersion ?? 0) + 1;

            return new CreatorLegalAssessment
            {
                Id = previousAssessment?.Id ?? ObjectId.GenerateNewId().ToString(),
                CreatorIdeaId = creatorIdeaId,
                UserId = userId,
                Jurisdiction = _catalog.Jurisdiction,
                RulesVersion = _catalog.RulesVersion,
                AssessmentVersion = newAssessmentVersion,
                BusinessSnapshotHash = snapshotHash,
                IsPotentiallyOutdated = false,
                EvaluatedAt = DateTime.UtcNow,
                BusinessProfile = profile,
                DetectedArchetypes = profile.GetArchetypeLabels(),
                PlanningReadinessPct = readinessScore,
                StageBreakdown = breakdowns,
                Items = items,
                EvaluationTraces = traces,
                EvidenceLinks = evidenceLinks,
                EvidenceAuditTrail = auditTrail,
                ReconciliationSummary = reconciliationSummary,
                StaleMetadata = new LegalStaleMetadata
                {
                    IsStale = false,
                    StaleReason = LegalStaleReasons.None,
                    LastEvaluatedAt = DateTime.UtcNow,
                    CurrentRulesVersion = _catalog.RulesVersion,
                    AssessmentRulesVersion = _catalog.RulesVersion
                }
            };
        }

        public string ComputeSnapshotHash(LegalBusinessProfile profile)
        {
            var raw = string.Join("|",
                profile.Country,
                profile.Jurisdiction,
                profile.IsSaaS.Value,
                profile.IsEcommerce.Value,
                profile.IsMarketplace.Value,
                profile.IsConsulting.Value,
                profile.IsPhysicalBusiness.Value,
                profile.IsB2B.Value,
                profile.IsB2C.Value,
                profile.HasSubscription.Value,
                profile.HasOnlinePayments.Value,
                profile.HasWebsite.Value,
                profile.CollectsPersonalData.Value,
                profile.UsesAnalyticsOrTracking.Value,
                profile.HasEmployees.Value,
                profile.HasContractors.Value,
                profile.HasPhysicalPremises.Value,
                profile.MayBeRegulatedActivity.Value,
                profile.MayBeRegulatedActivity.Confidence
            );

            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        public double ComputePlanningReadiness(List<CreatorLegalChecklistItem> items)
        {
            var activeItems = items.Where(i => !string.Equals(i.Status, LegalItemStatuses.NotApplicable, StringComparison.OrdinalIgnoreCase)).ToList();
            if (activeItems.Count == 0) return 0.0;

            // Stage weights: Stages 1 & 2 = 40%, Stages 3 & 4 = 40%, Stage 5 = 20%
            var group1Stages = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { LegalStages.BeforeCreation, LegalStages.CompanyCreation };
            var group2Stages = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { LegalStages.BeforeLaunch, LegalStages.BeforeSale };
            var group3Stages = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { LegalStages.Ongoing };

            double g1Score = ComputeGroupScore(activeItems.Where(i => group1Stages.Contains(i.Stage)).ToList());
            double g2Score = ComputeGroupScore(activeItems.Where(i => group2Stages.Contains(i.Stage)).ToList());
            double g3Score = ComputeGroupScore(activeItems.Where(i => group3Stages.Contains(i.Stage)).ToList());

            // Normalize weights based on whether stages contain items
            double totalWeight = 0.0;
            double weightedSum = 0.0;

            if (activeItems.Any(i => group1Stages.Contains(i.Stage)))
            {
                weightedSum += g1Score * 0.40;
                totalWeight += 0.40;
            }
            if (activeItems.Any(i => group2Stages.Contains(i.Stage)))
            {
                weightedSum += g2Score * 0.40;
                totalWeight += 0.40;
            }
            if (activeItems.Any(i => group3Stages.Contains(i.Stage)))
            {
                weightedSum += g3Score * 0.20;
                totalWeight += 0.20;
            }

            if (totalWeight <= 0.0) return 0.0;

            double finalPct = (weightedSum / totalWeight) * 100.0;
            return Math.Round(Math.Clamp(finalPct, 0.0, 100.0), 1);
        }

        private static double ComputeGroupScore(List<CreatorLegalChecklistItem> items)
        {
            if (items.Count == 0) return 1.0; // Group has no items, treat as complete

            double totalPossible = 0.0;
            double earned = 0.0;

            foreach (var item in items)
            {
                // Critical items carry 2.0 weight, recommended carry 1.0
                double weight = string.Equals(item.Priority, LegalPriorities.Critical, StringComparison.OrdinalIgnoreCase) ? 2.0 : 1.0;
                totalPossible += weight;

                if (LegalItemStatuses.IsCompleted(item.Status))
                {
                    earned += weight;
                }
                else if (string.Equals(item.Status, LegalItemStatuses.InProgress, StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(item.Status, LegalItemStatuses.ReadyForReview, StringComparison.OrdinalIgnoreCase))
                {
                    earned += (weight * 0.5);
                }
            }

            return totalPossible > 0 ? (earned / totalPossible) : 1.0;
        }

        private static (string status, List<string> matched, List<string> missing, string rationale) EvaluateRule(
            LegalRuleDefinition rule,
            LegalBusinessProfile profile)
        {
            var matched = new List<string>();
            var missing = new List<string>();

            // Always applicable
            if (rule.Conditions.Always == true)
            {
                matched.Add("Universal French requirement (applicable to all commercial entities)");
                return (
                    ApplicabilityEvaluationStatuses.Applicable,
                    matched,
                    missing,
                    "Obligation statutaire universelle imposée à toute création d'activité commerciale en France."
                );
            }

            // Regulated activity special check (ambiguous check)
            if (rule.Conditions.MayBeRegulatedActivity == true)
            {
                if (profile.MayBeRegulatedActivity.Confidence == SignalConfidenceLevels.Unknown)
                {
                    matched.Add("Potential regulated activity keywords detected");
                    return (
                        ApplicabilityEvaluationStatuses.NeedsInformation,
                        matched,
                        missing,
                        profile.MayBeRegulatedActivity.Rationale
                    );
                }

                if (profile.MayBeRegulatedActivity.Value)
                {
                    matched.Add("Confirmed regulated activity");
                    return (
                        ApplicabilityEvaluationStatuses.Applicable,
                        matched,
                        missing,
                        "Activité soumise à qualification, agrément ou enregistrement professionnel préalable."
                    );
                }

                missing.Add("MayBeRegulatedActivity == false");
                return (
                    ApplicabilityEvaluationStatuses.NotApplicable,
                    matched,
                    missing,
                    "Aucune qualification ou agrément spécifique requis pour cette activité."
                );
            }

            // Condition evaluation against business profile
            bool allMatched = true;

            void CheckCondition(string name, bool? expected, BusinessSignal signal)
            {
                if (!expected.HasValue) return;

                if (signal.Value == expected.Value)
                {
                    matched.Add($"{name} == {expected.Value} ({signal.Source})");
                }
                else
                {
                    allMatched = false;
                    missing.Add($"{name} (expected: {expected.Value}, actual: {signal.Value})");
                }
            }

            CheckCondition(nameof(rule.Conditions.IsSaaS), rule.Conditions.IsSaaS, profile.IsSaaS);
            CheckCondition(nameof(rule.Conditions.IsEcommerce), rule.Conditions.IsEcommerce, profile.IsEcommerce);
            CheckCondition(nameof(rule.Conditions.IsMarketplace), rule.Conditions.IsMarketplace, profile.IsMarketplace);
            CheckCondition(nameof(rule.Conditions.IsConsulting), rule.Conditions.IsConsulting, profile.IsConsulting);
            CheckCondition(nameof(rule.Conditions.IsPhysicalBusiness), rule.Conditions.IsPhysicalBusiness, profile.IsPhysicalBusiness);
            CheckCondition(nameof(rule.Conditions.IsB2B), rule.Conditions.IsB2B, profile.IsB2B);
            CheckCondition(nameof(rule.Conditions.IsB2C), rule.Conditions.IsB2C, profile.IsB2C);
            CheckCondition(nameof(rule.Conditions.HasSubscription), rule.Conditions.HasSubscription, profile.HasSubscription);
            CheckCondition(nameof(rule.Conditions.HasOnlinePayments), rule.Conditions.HasOnlinePayments, profile.HasOnlinePayments);
            CheckCondition(nameof(rule.Conditions.HasWebsite), rule.Conditions.HasWebsite, profile.HasWebsite);
            CheckCondition(nameof(rule.Conditions.SellsProducts), rule.Conditions.SellsProducts, profile.SellsProducts);
            CheckCondition(nameof(rule.Conditions.SellsServices), rule.Conditions.SellsServices, profile.SellsServices);
            CheckCondition(nameof(rule.Conditions.CollectsPersonalData), rule.Conditions.CollectsPersonalData, profile.CollectsPersonalData);
            CheckCondition(nameof(rule.Conditions.UsesAnalyticsOrTracking), rule.Conditions.UsesAnalyticsOrTracking, profile.UsesAnalyticsOrTracking);
            CheckCondition(nameof(rule.Conditions.HasEmployees), rule.Conditions.HasEmployees, profile.HasEmployees);
            CheckCondition(nameof(rule.Conditions.HasContractors), rule.Conditions.HasContractors, profile.HasContractors);
            CheckCondition(nameof(rule.Conditions.HasPhysicalPremises), rule.Conditions.HasPhysicalPremises, profile.HasPhysicalPremises);

            if (allMatched && matched.Count > 0)
            {
                var rationale = $"Applicable car votre profil correspond aux critères légaux : {string.Join(", ", matched)}.";
                return (ApplicabilityEvaluationStatuses.Applicable, matched, missing, rationale);
            }

            var nonApplicableRationale = $"Non applicable car les critères suivants ne sont pas réunis : {string.Join(", ", missing)}.";
            return (ApplicabilityEvaluationStatuses.NotApplicable, matched, missing, nonApplicableRationale);
        }
    }
}
