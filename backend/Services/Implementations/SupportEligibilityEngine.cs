using System;
using System.Collections.Generic;
using System.Linq;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class SupportEligibilityEngine : ISupportEligibilityEngine
    {
        public SupportMatch EvaluateOpportunity(SupportOpportunity opp, SupportEligibilityContext ctx)
        {
            var match = new SupportMatch
            {
                Key = $"support.{opp.SourceId}.{opp.ExternalId}",
                OpportunityId = opp.ExternalId,
                Name = opp.Name,
                Description = opp.Description,
                SupportType = opp.SupportType,
                SelectionMode = opp.SelectionMode,
                ProgrammeOwner = opp.ProgrammeOwner,
                ManagingAuthority = opp.ManagingAuthority,
                ApplicationAuthority = opp.ApplicationAuthority,
                CatalogueSource = opp.CatalogueSource,
                SourceAuthority = GetSourceAuthority(opp.CatalogueSource),
                OfficialReference = opp.OfficialReference,
                OfficialUrl = opp.OfficialUrl,
                EstimatedSupportValue = opp.SupportValueMax ?? opp.SupportValueMin,
                SupportValueDescription = opp.SupportValueDescription,
                SupportValueType = opp.SupportValueType,
                Timing = opp.TimingRules,
                EvaluatedAt = DateTime.UtcNow,
                RuleVersion = "1.0",
                OpportunityLastVerifiedAt = opp.LastVerifiedAt,
                SourceLastCheckedAt = opp.SourceUpdatedAt
            };

            // 1. Check Deadline & Active Period
            var now = DateTime.UtcNow;
            if (opp.ApplicationDeadline.HasValue && opp.ApplicationDeadline.Value < now)
            {
                match.EligibilityStatus = EligibilityStatus.Expired;
                match.MatchConfidence = MatchConfidence.High;
                match.ConditionsFailed.Add($"Programme deadline expired on {opp.ApplicationDeadline.Value:yyyy-MM-dd}");
                match.ReasonCodes.Add("DEADLINE_EXPIRED");
                match.RecommendedNextStep = "This programme is currently closed for applications.";
                return match;
            }
            if (opp.EffectiveTo.HasValue && opp.EffectiveTo.Value < now)
            {
                match.EligibilityStatus = EligibilityStatus.Expired;
                match.MatchConfidence = MatchConfidence.High;
                match.ConditionsFailed.Add($"Programme closed on {opp.EffectiveTo.Value:yyyy-MM-dd}");
                match.ReasonCodes.Add("DEADLINE_EXPIRED");
                match.RecommendedNextStep = "This programme is currently closed for applications.";
                return match;
            }

            // 2. Check Geographic Scope & Regional Locality
            if (opp.GeographicScope == "Regional" && opp.EligibleLocations != null && opp.EligibleLocations.Any())
            {
                bool matchesRegion = !string.IsNullOrWhiteSpace(ctx.Region) &&
                    opp.EligibleLocations.Any(loc => loc.Equals(ctx.Region, StringComparison.OrdinalIgnoreCase));

                if (!matchesRegion)
                {
                    match.EligibilityStatus = EligibilityStatus.NotEligible;
                    match.MatchConfidence = MatchConfidence.High;
                    match.ConditionsFailed.Add($"Project region '{ctx.Region}' is not eligible (Eligible: {string.Join(", ", opp.EligibleLocations)}).");
                    match.ReasonCodes.Add("LOCATION_MISMATCH");
                    match.ReasonCodes.Add("REGION_NOT_ELIGIBLE");
                    match.RecommendedNextStep = "Explore schemes available specifically in your project's region.";
                    return match;
                }
                else
                {
                    match.WhyMatched.Add($"Project is located in the eligible region ({ctx.Region})");
                    match.ConditionsMet.Add($"Regional localization in {ctx.Region} confirmed");
                    match.ReasonCodes.Add("LOCATION_MATCH");
                }
            }

            // 3. Evaluate Explicit Eligibility Rules
            bool hasAmbiguousRule = false;
            bool hasUnvalidatedRule = false;
            bool hasMissingRequiredFact = false;
            bool hasFailedRequiredRule = false;

            if (opp.EligibilityRules != null && opp.EligibilityRules.Any())
            {
                foreach (var rule in opp.EligibilityRules)
                {
                    // Refinement 6: Check Normalization Status
                    if (rule.NormalizationStatus == RuleNormalizationStatus.Ambiguous)
                    {
                        hasAmbiguousRule = true;
                        match.ConditionsMissing.Add($"Ambiguous official rule requires review: {rule.Description}");
                        match.ReasonCodes.Add("AMBIGUOUS_PARSED_RULE");
                        continue;
                    }
                    if (rule.NormalizationStatus != RuleNormalizationStatus.VerifiedStructured &&
                        rule.NormalizationStatus != RuleNormalizationStatus.HumanValidated)
                    {
                        hasUnvalidatedRule = true;
                        match.ConditionsMissing.Add($"Unvalidated rule criteria: {rule.Description}");
                        match.ReasonCodes.Add("UNVALIDATED_RULE");
                        continue;
                    }

                    // Extract actual context value
                    var contextValue = GetFieldValue(rule.Field, ctx);

                    if (contextValue == null)
                    {
                        if (rule.Required)
                        {
                            hasMissingRequiredFact = true;
                            match.ConditionsMissing.Add($"Information needed: {rule.Description}");
                            match.ReasonCodes.Add("MISSING_REQUIRED_INFORMATION");
                        }
                        continue;
                    }

                    // Evaluate Operator
                    bool passed = EvaluateOperator(rule.Operator, contextValue, rule.ExpectedValue);
                    if (passed)
                    {
                        match.ConditionsMet.Add(rule.Description);
                        AddMatchingReasonCode(rule.Field, match.ReasonCodes, match.WhyMatched);
                    }
                    else
                    {
                        if (rule.Required)
                        {
                            hasFailedRequiredRule = true;
                            match.ConditionsFailed.Add(rule.Description);
                            AddFailingReasonCode(rule.Field, match.ReasonCodes);
                        }
                    }
                }
            }

            // 4. Determine Final Eligibility Status & Confidence
            if (hasFailedRequiredRule)
            {
                match.EligibilityStatus = EligibilityStatus.NotEligible;
                match.MatchConfidence = MatchConfidence.High;
                match.RecommendedNextStep = "Your project does not meet one or more mandatory eligibility criteria for this scheme.";
            }
            else if (hasAmbiguousRule || hasUnvalidatedRule)
            {
                // Refinement 6: Ambiguous or unvalidated rules cannot produce Eligible
                match.EligibilityStatus = EligibilityStatus.NeedsReview;
                match.MatchConfidence = MatchConfidence.NeedsReview;
                match.RecommendedNextStep = "Manual adviser or authority verification is required before confirming eligibility.";
            }
            else if (hasMissingRequiredFact)
            {
                match.EligibilityStatus = EligibilityStatus.NeedsInformation;
                match.MatchConfidence = MatchConfidence.Medium;
                match.RecommendedNextStep = "Answer the missing eligibility question to determine if your project qualifies.";
            }
            else
            {
                // All evaluated conditions met!
                // FIX-02 CANONICAL PRINCIPLE:
                // Meets known application criteria != Funding eligibility guaranteed != Awarded != Spendable funding.
                // Competitive, Discretionary, and CreditAssessment support must use EligibleToApply semantics.
                // Awarded status requires explicit verified award evidence.

                bool hasAwardEvidence = ctx.ConfirmedAwardOpportunityKeys != null &&
                    (ctx.ConfirmedAwardOpportunityKeys.Contains(match.Key) ||
                     ctx.ConfirmedAwardOpportunityKeys.Contains(opp.ExternalId));

                if (hasAwardEvidence)
                {
                    match.EligibilityStatus = EligibilityStatus.Awarded;
                    match.FounderApplicationState = FounderApplicationState.Awarded;
                    match.MatchConfidence = MatchConfidence.High;
                    match.WhyMatched.Add("Award confirmed with official programme authority.");
                    match.RecommendedNextStep = "Awarded: Follow disbursement schedule and reporting milestones.";
                }
                else if (opp.SelectionMode == SelectionMode.Competitive ||
                         opp.SelectionMode == SelectionMode.Discretionary ||
                         opp.SelectionMode == SelectionMode.CreditAssessment)
                {
                    match.EligibilityStatus = EligibilityStatus.EligibleToApply;
                    match.MatchConfidence = MatchConfidence.High;

                    if (opp.SelectionMode == SelectionMode.Competitive)
                    {
                        match.WhyMatched.Add("You appear to meet the known application criteria for this competitive call");
                        match.RecommendedNextStep = "Eligible to Apply: Prepare your application dossier according to jury guidelines. Final selection depends on the programme authority.";
                    }
                    else if (opp.SelectionMode == SelectionMode.Discretionary)
                    {
                        match.WhyMatched.Add("You appear to meet the preliminary criteria for this discretionary aid");
                        match.RecommendedNextStep = "Eligible to Apply: Submit dossier for discretionary appraisal. Decision remains subject to committee approval.";
                    }
                    else // CreditAssessment
                    {
                        match.WhyMatched.Add("Your project qualifies to submit an application for financial assessment");
                        match.RecommendedNextStep = "Eligible to Apply: Prepare your 3-year cash forecast for financial committee review. Credit approval remains external.";
                    }
                }
                else
                {
                    // Statutory entitlement
                    match.EligibilityStatus = EligibilityStatus.Eligible;
                    match.MatchConfidence = MatchConfidence.High;
                    match.WhyMatched.Add("All statutory and administrative eligibility conditions are satisfied");
                    match.RecommendedNextStep = "Proceed with preparing required application documents.";
                }
            }

            // 5. Link Related Needs & Tasks
            if (opp.RelatedNeedCategories != null)
            {
                foreach (var cat in opp.RelatedNeedCategories)
                {
                    var matchingNeeds = ctx.UnresolvedNeedKeys
                        .Where(k => k.StartsWith(cat.ToLowerInvariant()))
                        .ToList();
                    match.RelatedNeedKeys.AddRange(matchingNeeds);
                }
            }

            // Clean duplicates
            match.WhyMatched = match.WhyMatched.Distinct().ToList();
            match.ConditionsMet = match.ConditionsMet.Distinct().ToList();
            match.ConditionsMissing = match.ConditionsMissing.Distinct().ToList();
            match.ConditionsFailed = match.ConditionsFailed.Distinct().ToList();
            match.ReasonCodes = match.ReasonCodes.Distinct().ToList();

            return match;
        }

        private static string? GetFieldValue(string field, SupportEligibilityContext ctx)
        {
            if (ctx.KnownEligibilityFacts.TryGetValue(field, out var knownVal) && !string.IsNullOrWhiteSpace(knownVal))
            {
                return knownVal;
            }

            return field.ToLowerInvariant() switch
            {
                "country" => ctx.Country,
                "region" => ctx.Region,
                "department" => ctx.Department,
                "currentsituation" => ctx.CurrentSituation,
                "businessstage" => ctx.BusinessStage,
                "formationstatus" => ctx.FormationStatus,
                "legalform" => ctx.LegalForm,
                "sector" => ctx.Sector,
                "activitytype" => ctx.ActivityType,
                "hasinnovativeactivity" => ctx.HasInnovativeActivity ? "True" : "False",
                "hastrainingneeds" => ctx.HasTrainingNeeds ? "True" : "False",
                "hashiringplans" => ctx.HasHiringPlans ? "True" : "False",
                "hasexportambitions" => ctx.HasExportAmbitions ? "True" : "False",
                "projectneeds" => string.Join(",", ctx.ProjectNeeds),
                _ => null
            };
        }

        private static bool EvaluateOperator(string op, string actual, string expected)
        {
            return op switch
            {
                RuleOperator.Equals => string.Equals(actual, expected, StringComparison.OrdinalIgnoreCase),
                RuleOperator.NotEquals => !string.Equals(actual, expected, StringComparison.OrdinalIgnoreCase),
                RuleOperator.In => expected.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Any(exp => string.Equals(actual, exp, StringComparison.OrdinalIgnoreCase)),
                RuleOperator.NotIn => !expected.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Any(exp => string.Equals(actual, exp, StringComparison.OrdinalIgnoreCase)),
                RuleOperator.Contains => actual.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Any(a => string.Equals(a, expected, StringComparison.OrdinalIgnoreCase)),
                RuleOperator.Exists => !string.IsNullOrWhiteSpace(actual),
                _ => false
            };
        }

        private static void AddMatchingReasonCode(string field, List<string> reasonCodes, List<string> whyMatched)
        {
            switch (field.ToLowerInvariant())
            {
                case "country":
                    reasonCodes.Add("COUNTRY_MATCH");
                    whyMatched.Add("Your project is established in France/EU jurisdiction");
                    break;
                case "region":
                    reasonCodes.Add("LOCATION_MATCH");
                    whyMatched.Add("Your project is established in an eligible region");
                    break;
                case "currentsituation":
                    reasonCodes.Add("EMPLOYMENT_STATUS_MATCH");
                    whyMatched.Add("Your current employment or founder situation matches programme criteria");
                    break;
                case "businessstage":
                    reasonCodes.Add("BUSINESS_STAGE_MATCH");
                    whyMatched.Add("Your project is at the supported venture stage");
                    break;
                case "hasinnovativeactivity":
                    reasonCodes.Add("INNOVATION_MATCH");
                    whyMatched.Add("Your project's R&D or innovative scope aligns with programme objectives");
                    break;
                case "hastrainingneeds":
                    reasonCodes.Add("TRAINING_NEED_MATCH");
                    whyMatched.Add("Supports your verified skills and training development roadmap");
                    break;
                case "hashiringplans":
                    reasonCodes.Add("HIRING_PLAN_MATCH");
                    whyMatched.Add("Directly funds upcoming team expansion and hiring needs");
                    break;
                case "projectneeds":
                    reasonCodes.Add("PROJECT_TYPE_MATCH");
                    whyMatched.Add("Directly addresses resource requirements identified in your Needs Analysis");
                    break;
            }
        }

        private static void AddFailingReasonCode(string field, List<string> reasonCodes)
        {
            switch (field.ToLowerInvariant())
            {
                case "country":
                case "region":
                    reasonCodes.Add("LOCATION_MISMATCH");
                    break;
                case "currentsituation":
                    reasonCodes.Add("EMPLOYMENT_STATUS_MISMATCH");
                    break;
                case "businessstage":
                    reasonCodes.Add("BUSINESS_STAGE_MISMATCH");
                    break;
                default:
                    reasonCodes.Add("PREREQUISITE_NOT_MET");
                    break;
            }
        }

        private static string GetSourceAuthority(string catalogueSource)
        {
            if (catalogueSource.Contains("Service-Public") || catalogueSource.Contains("URSSAF") || catalogueSource.Contains("France Travail"))
                return SourceAuthority.PrimaryOfficial;
            if (catalogueSource.Contains("Bpifrance") || catalogueSource.Contains("Région") || catalogueSource.Contains("Commission"))
                return SourceAuthority.InstitutionalOfficial;
            if (catalogueSource.Contains("Aides-entreprises"))
                return SourceAuthority.OfficialAggregator;
            return SourceAuthority.SecondaryReference;
        }
    }
}
